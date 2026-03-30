package handler

import (
	"net/http"

	"github.com/tsoggtbayar/gogame/pkg/llmmove"
)

func Handler(w http.ResponseWriter, r *http.Request) {
	llmmove.Handler(w, r)
}
