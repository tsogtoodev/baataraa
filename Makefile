# Run from repository root.
PORT ?= 4000

.PHONY: help web tui build build-web vet test clean

help:
	@echo "Targets:"
	@echo "  make web       - LLM/proxy web UI (default PORT=$(PORT))"
	@echo "  make tui       - terminal Bubble Tea UI"
	@echo "  make build     - build TUI binary -> bin/gogame"
	@echo "  make build-web - build web server -> bin/gogame-web"
	@echo "  make vet       - go vet ./..."
	@echo "  make test      - go test ./..."
	@echo "  make clean     - remove bin/"
	@echo "Override port: PORT=4001 make web"

web:
	PORT=$(PORT) go run ./cmd/web

tui:
	go run .

build:
	mkdir -p bin
	go build -o bin/gogame .

build-web:
	mkdir -p bin
	go build -o bin/gogame-web ./cmd/web

vet:
	go vet ./...

test:
	go test ./...

clean:
	rm -rf bin
