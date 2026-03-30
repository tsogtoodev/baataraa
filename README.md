# Баатараа (gogame)

Тик-так-тое: **Bubble Tea** терминал интерфэйс болон **вэб** (LLM-тай тоглох боломжтой). Вэбийг `make web` эсвэл `go run ./cmd/web` ашиглан ачаална (анхдагч порт `4000`).

## Ажиллуулах

| Терминал (TUI) | `go run .` |
| Вэб + LLM прокси | `make web` → `http://localhost:4000` |
| Порт солих | `PORT=4001 make web` |

## Технологи

- Go 1.24+
- Вэб: статик HTML/CSS/JS, LLM дуудлага `cmd/web` серверээр дамжина

---

*Inspired by my beautiful wife Delgermaa.*

