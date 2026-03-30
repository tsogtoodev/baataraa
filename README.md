# Баатараа (gogame)

Web tic-tac-toe with optional LLM play. Start the web app with `make web` or `go run ./cmd/web` (default port `4000`).

## Run

| Web + LLM proxy | `make web` → `http://localhost:4000` |
| Change port | `PORT=4001 make web` |

## Vercel deploy

- The static frontend is served from `web/`
- `POST /api/llm-move` runs as a Vercel Go function (`api/llm-move.go`)
- `vercel.json` uses `outputDirectory: "web"` and does not require a build step
- Local development still uses `make web`

## Tech

- Go 1.24+
- Web: static HTML/CSS/JS, with LLM calls proxied through `cmd/web`

---

*Inspired by my beautiful wife Delgermaa.*
