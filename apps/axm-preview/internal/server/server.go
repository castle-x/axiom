package server

import (
	"encoding/json"
	"errors"
	"io"
	"net/http"
	"os"
	"path/filepath"

	"github.com/castlexu/axiom/apps/axm-preview/internal/axmfs"
	"github.com/castlexu/axiom/apps/axm-preview/internal/model"
	"github.com/castlexu/axiom/apps/axm-preview/internal/picker"
)

const allowHeader = "GET, HEAD, OPTIONS, POST"

type Options struct {
	Target    string
	StatePath string
	Shell     http.Handler
}

type Server struct {
	activeTarget *axmfs.Target
	statePath    string
	shell        http.Handler
}

func New(options Options) http.Handler {
	server := &Server{
		statePath: options.StatePath,
		shell:     options.Shell,
	}
	if server.statePath == "" {
		server.statePath = DefaultStatePath()
	}
	if target, err := axmfs.ResolveTarget(options.Target); err == nil {
		server.activeTarget = &target
		_ = server.SaveLastTarget(target)
	}
	return server
}

func (s *Server) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodOptions {
		w.Header().Set("Allow", allowHeader)
		w.Header().Set("Cache-Control", "no-store")
		w.WriteHeader(http.StatusNoContent)
		return
	}
	if r.Method == http.MethodPost {
		s.handlePost(w, r)
		return
	}
	if r.Method != http.MethodGet && r.Method != http.MethodHead {
		sendJSON(w, r, http.StatusMethodNotAllowed, map[string]any{"error": "method_not_allowed", "allow": allowHeader}, map[string]string{"Allow": allowHeader})
		return
	}
	switch r.URL.Path {
	case "/api/model":
		s.handleModel(w, r)
	case "/api/target":
		sendJSON(w, r, http.StatusOK, map[string]any{"target": s.activeTarget}, nil)
	case "/api/health":
		sendJSON(w, r, http.StatusOK, map[string]any{"ok": true, "readonly": true, "target": s.activeTarget}, nil)
	case "/":
		s.serveShell(w, r)
	default:
		if s.shell != nil {
			s.shell.ServeHTTP(w, r)
			return
		}
		sendJSON(w, r, http.StatusNotFound, map[string]any{"error": "not_found"}, nil)
	}
}

func (s *Server) handlePost(w http.ResponseWriter, r *http.Request) {
	if !isSameOriginPost(r) {
		sendJSON(w, r, http.StatusForbidden, map[string]any{"error": "forbidden", "message": "POST requests must be same-origin."}, nil)
		return
	}
	switch r.URL.Path {
	case "/api/target":
		var body struct {
			Path string `json:"path"`
		}
		if err := readJSONBody(r, &body); err != nil {
			sendError(w, r, err)
			return
		}
		target, err := axmfs.ResolveTarget(body.Path)
		if err != nil {
			sendError(w, r, err)
			return
		}
		s.activeTarget = &target
		_ = s.SaveLastTarget(target)
		s.handleModel(w, r)
	case "/api/pick-target":
		defaultPath := ""
		if s.activeTarget != nil {
			defaultPath = s.activeTarget.Path
		}
		chosen, err := picker.PickTarget(defaultPath)
		if err != nil {
			sendError(w, r, err)
			return
		}
		target, err := axmfs.ResolveTarget(chosen)
		if err != nil {
			sendError(w, r, err)
			return
		}
		s.activeTarget = &target
		_ = s.SaveLastTarget(target)
		s.handleModel(w, r)
	default:
		sendJSON(w, r, http.StatusMethodNotAllowed, map[string]any{"error": "method_not_allowed", "allow": allowHeader}, map[string]string{"Allow": allowHeader})
	}
}

func (s *Server) handleModel(w http.ResponseWriter, r *http.Request) {
	if s.activeTarget == nil {
		sendError(w, r, axmfs.NewPreviewError("target_not_selected", "Open a project folder that contains .axm.", http.StatusConflict))
		return
	}
	preview, err := model.Build(s.activeTarget.Path)
	if err != nil {
		sendError(w, r, err)
		return
	}
	sendJSON(w, r, http.StatusOK, preview, nil)
}

func (s *Server) serveShell(w http.ResponseWriter, r *http.Request) {
	if s.shell != nil {
		s.shell.ServeHTTP(w, r)
		return
	}
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	w.Header().Set("Cache-Control", "no-store")
	if r.Method != http.MethodHead {
		_, _ = io.WriteString(w, "<!doctype html><title>Axiom Preview</title><div id=\"root\">Axiom Preview</div>")
	}
}

type persistedState struct {
	LastTargetPath string `json:"lastTargetPath"`
}

func DefaultStatePath() string {
	if value := os.Getenv("AXM_PREVIEW_STATE_PATH"); value != "" {
		return value
	}
	home, err := os.UserHomeDir()
	if err != nil {
		return filepath.Join(os.TempDir(), "axiom", "preview.json")
	}
	return filepath.Join(home, ".cache", "axiom", "preview.json")
}

func (s *Server) SaveLastTarget(target axmfs.Target) error {
	if target.Path == "" {
		return nil
	}
	if err := os.MkdirAll(filepath.Dir(s.statePath), 0o755); err != nil {
		return err
	}
	payload, err := json.MarshalIndent(persistedState{LastTargetPath: target.Path}, "", "  ")
	if err != nil {
		return err
	}
	payload = append(payload, '\n')
	return os.WriteFile(s.statePath, payload, 0o644)
}

func ReadLastTarget(statePath string) string {
	if statePath == "" {
		statePath = DefaultStatePath()
	}
	raw, err := os.ReadFile(statePath)
	if err != nil {
		return ""
	}
	var state persistedState
	if err := json.Unmarshal(raw, &state); err != nil {
		return ""
	}
	if state.LastTargetPath == "" {
		return ""
	}
	resolved, err := filepath.Abs(state.LastTargetPath)
	if err != nil {
		return state.LastTargetPath
	}
	return resolved
}

func isSameOriginPost(r *http.Request) bool {
	origin := r.Header.Get("Origin")
	if origin == "" {
		return true
	}
	parsed, err := http.NewRequest(http.MethodGet, origin, nil)
	if err != nil || parsed.URL == nil {
		return false
	}
	return parsed.URL.Scheme == "http" && parsed.URL.Host == r.Host
}

func readJSONBody(r *http.Request, dest any) error {
	defer r.Body.Close()
	raw, err := io.ReadAll(io.LimitReader(r.Body, 32769))
	if err != nil {
		return err
	}
	if len(raw) > 32768 {
		return axmfs.NewPreviewError("request_too_large", "Request body is too large.", http.StatusRequestEntityTooLarge)
	}
	if len(raw) == 0 {
		return nil
	}
	if err := json.Unmarshal(raw, dest); err != nil {
		return axmfs.NewPreviewError("invalid_json", "Request body must be JSON.", http.StatusBadRequest)
	}
	return nil
}

func sendError(w http.ResponseWriter, r *http.Request, err error) {
	status := http.StatusInternalServerError
	body := map[string]any{
		"error":   "preview_model_failed",
		"message": err.Error(),
	}
	if previewErr, ok := axmfs.AsPreviewError(err); ok {
		status = previewErr.Status
		body["error"] = previewErr.Code
		body["message"] = previewErr.Message
		if len(previewErr.Candidates) > 0 {
			body["candidates"] = previewErr.Candidates
		}
	} else if errors.Is(err, os.ErrNotExist) {
		status = http.StatusNotFound
	}
	sendJSON(w, r, status, body, nil)
}

func sendJSON(w http.ResponseWriter, r *http.Request, status int, body any, extra map[string]string) {
	for key, value := range extra {
		w.Header().Set(key, value)
	}
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.Header().Set("Cache-Control", "no-store")
	w.Header().Set("X-Content-Type-Options", "nosniff")
	w.WriteHeader(status)
	if r.Method != http.MethodHead {
		_ = json.NewEncoder(w).Encode(body)
	}
}
