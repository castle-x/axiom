package siteserver_test

import (
	"io/fs"
	"net/http"
	"net/http/httptest"
	"testing"
	"testing/fstest"

	"github.com/castlexu/axiom/apps/axm-preview/internal/siteserver"
)

func TestSPAHandlerServesStaticFilesAndFallsBackToIndex(t *testing.T) {
	dist := fstest.MapFS{
		"index.html":       &fstest.MapFile{Data: []byte("<div id=\"root\"></div>")},
		"assets/app.js":    &fstest.MapFile{Data: []byte("console.log('ok')")},
		"assets/style.css": &fstest.MapFile{Data: []byte("body{}")},
	}
	handler, err := siteserver.New(nil, dist)
	if err != nil {
		t.Fatalf("New() error = %v", err)
	}

	index := request(t, handler, "/docs/core")
	if index.Code != http.StatusOK || index.Body.String() != "<div id=\"root\"></div>" {
		t.Fatalf("SPA fallback = %d %q, want index", index.Code, index.Body.String())
	}
	root := request(t, handler, "/")
	if root.Code != http.StatusOK || root.Body.String() != "<div id=\"root\"></div>" {
		t.Fatalf("root fallback = %d %q, want index", root.Code, root.Body.String())
	}

	asset := request(t, handler, "/assets/app.js")
	if asset.Code != http.StatusOK || asset.Body.String() != "console.log('ok')" {
		t.Fatalf("asset = %d %q, want JS file", asset.Code, asset.Body.String())
	}
	if got := asset.Header().Get("Cache-Control"); got != "public, max-age=31536000, immutable" {
		t.Fatalf("asset Cache-Control = %q, want immutable", got)
	}

	missing := request(t, handler, "/assets/missing.js")
	if missing.Code != http.StatusNotFound {
		t.Fatalf("missing asset status = %d, want 404", missing.Code)
	}
}

func TestSPAHandlerKeepsAPIPrefixWithAPIHandler(t *testing.T) {
	dist := fstest.MapFS{"index.html": &fstest.MapFile{Data: []byte("index")}}
	api := http.NewServeMux()
	api.HandleFunc("/api/health", func(w http.ResponseWriter, r *http.Request) {
		_, _ = w.Write([]byte("api"))
	})
	handler, err := siteserver.New(api, dist)
	if err != nil {
		t.Fatalf("New() error = %v", err)
	}

	resp := request(t, handler, "/api/health")
	if resp.Code != http.StatusOK || resp.Body.String() != "api" {
		t.Fatalf("API response = %d %q, want api", resp.Code, resp.Body.String())
	}
}

func request(t *testing.T, handler http.Handler, target string) *httptest.ResponseRecorder {
	t.Helper()
	req := httptest.NewRequest(http.MethodGet, target, nil)
	resp := httptest.NewRecorder()
	handler.ServeHTTP(resp, req)
	return resp
}

var _ fs.FS = fstest.MapFS{}
