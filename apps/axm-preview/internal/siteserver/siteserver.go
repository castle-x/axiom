package siteserver

import (
	"io/fs"
	"net/http"
	"path"
	"strings"
)

type Handler struct {
	apiHandler http.Handler
	dist       fs.FS
	fileServer http.Handler
	indexHTML  []byte
}

func New(apiHandler http.Handler, dist fs.FS) (*Handler, error) {
	indexHTML, err := fs.ReadFile(dist, "index.html")
	if err != nil {
		return nil, err
	}
	return &Handler{
		apiHandler: apiHandler,
		dist:       dist,
		fileServer: http.FileServer(http.FS(dist)),
		indexHTML:  indexHTML,
	}, nil
}

func Wrap(apiHandler http.Handler, dist fs.FS) http.Handler {
	handler, err := New(apiHandler, dist)
	if err != nil {
		return apiHandler
	}
	return handler
}

func (h *Handler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	if r.URL.Path == "/" || r.URL.Path == "" {
		h.serveIndex(w, r)
		return
	}
	cleanPath := path.Clean("/" + r.URL.Path)
	reqPath := ""
	if cleanPath != "/" && cleanPath != "." {
		reqPath = strings.TrimPrefix(cleanPath, "/")
	}
	if h.apiHandler != nil && (strings.HasPrefix(reqPath, "api/") || strings.HasPrefix(reqPath, "apis/")) {
		h.apiHandler.ServeHTTP(w, r)
		return
	}
	if strings.Contains(path.Base(reqPath), ".") {
		if _, err := fs.Stat(h.dist, reqPath); err != nil {
			http.NotFound(w, r)
			return
		}
		if strings.HasPrefix(reqPath, "assets/") {
			w.Header().Set("Cache-Control", "public, max-age=31536000, immutable")
		}
		h.fileServer.ServeHTTP(w, r)
		return
	}
	h.serveIndex(w, r)
}

func (h *Handler) serveIndex(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	w.Header().Set("Cache-Control", "no-cache")
	w.WriteHeader(http.StatusOK)
	if r.Method != http.MethodHead {
		_, _ = w.Write(h.indexHTML)
	}
}
