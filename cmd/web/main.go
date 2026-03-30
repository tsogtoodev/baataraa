// Web server: static files from ./web and POST /api/llm-move.
// Run from repo root: go run ./cmd/web
package main

import (
	"log"
	"net/http"
	"os"
	"path/filepath"

	"github.com/tsoggtbayar/gogame/pkg/llmmove"
)

func main() {
	mux := http.NewServeMux()
	webDir := filepath.Join(".", "web")
	if _, err := os.Stat(webDir); err != nil {
		log.Fatalf("web directory not found at %s (run from repository root)", webDir)
	}
	fs := http.FileServer(http.Dir(webDir))
	mux.Handle("/", fs)
	mux.HandleFunc("POST /api/llm-move", llmmove.Handler)

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
