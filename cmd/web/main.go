// Web server: static files from ./web and POST /api/llm-move (proxies to LLM APIs).
// Run from repo root: go run ./cmd/web
package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"regexp"
	"strings"
	"time"
)

type llmMoveRequest struct {
	Provider  string     `json:"provider"`
	APIKey    string     `json:"apiKey"`
	Model     string     `json:"model"`
	Board     [][]string `json:"board"`
	BotMark   string     `json:"botMark"`
	HumanMark string     `json:"humanMark"`
}

type llmMoveResponse struct {
	Row int    `json:"row"`
	Col int    `json:"col"`
	Err string `json:"error,omitempty"`
}

func main() {
	mux := http.NewServeMux()
	webDir := filepath.Join(".", "web")
	if _, err := os.Stat(webDir); err != nil {
		log.Fatalf("web directory not found at %s (run from repository root)", webDir)
	}
	fs := http.FileServer(http.Dir(webDir))
	mux.Handle("/", fs)
	mux.HandleFunc("POST /api/llm-move", handleLLMMove)

	// Default 4000; override with PORT=3000 etc.
	addr := ":4000"
	if p := os.Getenv("PORT"); p != "" {
		addr = ":" + p
	}
	log.Printf("serving %s at http://localhost%s (LLM mode requires this server)", webDir, addr)
	if err := http.ListenAndServe(addr, mux); err != nil {
		log.Fatalf("listen %s: %v — try another port, e.g. PORT=4001 go run ./cmd/web", addr, err)
	}
}

func handleLLMMove(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	var req llmMoveRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, llmMoveResponse{Err: "invalid JSON"})
		return
	}
	req.Provider = strings.ToLower(strings.TrimSpace(req.Provider))
	if req.APIKey == "" || req.Model == "" {
		writeJSON(w, http.StatusBadRequest, llmMoveResponse{Err: "apiKey and model required"})
		return
	}
	text, err := callLLM(req)
	if err != nil {
		writeJSON(w, http.StatusBadGateway, llmMoveResponse{Err: err.Error()})
		return
	}
	row, col, err := parseMoveJSON(text, req.Board)
	if err != nil {
		writeJSON(w, http.StatusUnprocessableEntity, llmMoveResponse{Err: err.Error()})
		return
	}
	writeJSON(w, http.StatusOK, llmMoveResponse{Row: row, Col: col})
}

func writeJSON(w http.ResponseWriter, status int, v llmMoveResponse) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(v)
}

func buildPrompt(req llmMoveRequest) string {
	b, _ := json.Marshal(req.Board)
	return fmt.Sprintf(`You play tic-tac-toe on a 3x3 board. Rows and columns use indices 0, 1, and 2 only.
You are %s. The opponent is %s.
Current board (JSON, empty cells are ""): %s
Choose one empty cell for your next move.
Reply with ONLY this JSON object and nothing else: {"row":R,"col":C}
Replace R and C with integers 0-2. No markdown fences, no explanation.`, req.BotMark, req.HumanMark, string(b))
}

func callLLM(req llmMoveRequest) (string, error) {
	prompt := buildPrompt(req)
	client := &http.Client{Timeout: 90 * time.Second}

	switch req.Provider {
	case "egune":
		return callOpenAICompatible(client, "https://api.egune.com/v1/chat/completions", req.APIKey, req.Model, prompt)
	case "openai", "chatgpt":
		return callOpenAICompatible(client, "https://api.openai.com/v1/chat/completions", req.APIKey, req.Model, prompt)
	case "claude":
		return callAnthropic(client, req.APIKey, req.Model, prompt)
	default:
		return "", fmt.Errorf("unknown provider: %s", req.Provider)
	}
}

func callOpenAICompatible(client *http.Client, url, apiKey, model, prompt string) (string, error) {
	body := map[string]interface{}{
		"model": model,
		"messages": []map[string]string{
			{"role": "user", "content": prompt},
		},
		"temperature": 0.2,
		"max_tokens":  80,
	}
	raw, _ := json.Marshal(body)
	req, err := http.NewRequest(http.MethodPost, url, bytes.NewReader(raw))
	if err != nil {
		return "", err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+apiKey)

	resp, err := client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()
	b, _ := io.ReadAll(resp.Body)
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return "", fmt.Errorf("API %s: %s", resp.Status, truncate(string(b), 300))
	}
	var out struct {
		Choices []struct {
			Message struct {
				Content string `json:"content"`
			} `json:"message"`
		} `json:"choices"`
	}
	if err := json.Unmarshal(b, &out); err != nil {
		return "", fmt.Errorf("parse response: %w", err)
	}
	if len(out.Choices) == 0 {
		return "", fmt.Errorf("empty choices")
	}
	return strings.TrimSpace(out.Choices[0].Message.Content), nil
}

func callAnthropic(client *http.Client, apiKey, model, prompt string) (string, error) {
	body := map[string]interface{}{
		"model":      model,
		"max_tokens": 120,
		"messages": []map[string]interface{}{
			{"role": "user", "content": prompt},
		},
	}
	raw, _ := json.Marshal(body)
	req, err := http.NewRequest(http.MethodPost, "https://api.anthropic.com/v1/messages", bytes.NewReader(raw))
	if err != nil {
		return "", err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("x-api-key", apiKey)
	req.Header.Set("anthropic-version", "2023-06-01")

	resp, err := client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()
	b, _ := io.ReadAll(resp.Body)
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return "", fmt.Errorf("Anthropic %s: %s", resp.Status, truncate(string(b), 300))
	}
	var out struct {
		Content []struct {
			Text string `json:"text"`
		} `json:"content"`
	}
	if err := json.Unmarshal(b, &out); err != nil {
		return "", fmt.Errorf("parse response: %w", err)
	}
	if len(out.Content) == 0 {
		return "", fmt.Errorf("empty content")
	}
	return strings.TrimSpace(out.Content[0].Text), nil
}

var jsonObjRe = regexp.MustCompile(`\{[\s\S]*?"row"[\s\S]*?"col"[\s\S]*?\}`)

func parseMoveJSON(text string, board [][]string) (row, col int, err error) {
	s := strings.TrimSpace(text)
	if i := strings.Index(s, "{"); i >= 0 {
		s = s[i:]
	}
	sub := jsonObjRe.FindString(s)
	if sub == "" {
		return 0, 0, fmt.Errorf("no JSON object in model output")
	}
	var m struct {
		Row int `json:"row"`
		Col int `json:"col"`
	}
	if e := json.Unmarshal([]byte(sub), &m); e != nil {
		return 0, 0, fmt.Errorf("invalid JSON: %w", e)
	}
	if m.Row < 0 || m.Row > 2 || m.Col < 0 || m.Col > 2 {
		return 0, 0, fmt.Errorf("row/col out of range")
	}
	if len(board) != 3 || len(board[m.Row]) <= m.Col {
		return 0, 0, fmt.Errorf("invalid board access")
	}
	if board[m.Row][m.Col] != "" {
		return 0, 0, fmt.Errorf("cell not empty")
	}
	return m.Row, m.Col, nil
}

func truncate(s string, n int) string {
	s = strings.TrimSpace(s)
	if len(s) <= n {
		return s
	}
	return s[:n] + "…"
}
