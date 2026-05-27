package server_test

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/castlexu/axiom/preview/internal/server"
)

func TestServerServesReadonlyAPIsAndSwitchesTargets(t *testing.T) {
	first := makeRepo(t, "first")
	second := makeRepo(t, "second")
	statePath := filepath.Join(t.TempDir(), "preview.json")

	handler := server.New(server.Options{
		Target:    first,
		StatePath: statePath,
	})
	ts := httptest.NewServer(handler)
	defer ts.Close()

	health := getJSON[map[string]any](t, ts.URL+"/api/health")
	if health["ok"] != true || health["readonly"] != true {
		t.Fatalf("health = %#v, want ok readonly", health)
	}

	model := getJSON[map[string]any](t, ts.URL+"/api/model")
	target := model["target"].(map[string]any)
	if target["path"] != first {
		t.Fatalf("model target = %#v, want %q", target, first)
	}

	resp, err := http.Post(ts.URL+"/api/target", "application/json", strings.NewReader(`{"path":`+quote(second)+`}`))
	if err != nil {
		t.Fatalf("POST /api/target: %v", err)
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("POST /api/target status = %d, want 200", resp.StatusCode)
	}
	switched := decodeJSON[map[string]any](t, resp)
	switchedTarget := switched["target"].(map[string]any)
	if switchedTarget["path"] != second {
		t.Fatalf("switched target = %#v, want %q", switchedTarget, second)
	}

	rawState, err := os.ReadFile(statePath)
	if err != nil {
		t.Fatalf("ReadFile(state): %v", err)
	}
	if !strings.Contains(string(rawState), second) {
		t.Fatalf("state file = %s, want persisted target %q", rawState, second)
	}

	denied, err := http.Post(ts.URL+"/api/model", "application/json", strings.NewReader(`{}`))
	if err != nil {
		t.Fatalf("POST /api/model: %v", err)
	}
	defer denied.Body.Close()
	if denied.StatusCode != http.StatusMethodNotAllowed {
		t.Fatalf("POST /api/model status = %d, want 405", denied.StatusCode)
	}
}

func getJSON[T any](t *testing.T, url string) T {
	t.Helper()
	resp, err := http.Get(url)
	if err != nil {
		t.Fatalf("GET %s: %v", url, err)
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("GET %s status = %d, want 200", url, resp.StatusCode)
	}
	return decodeJSON[T](t, resp)
}

func decodeJSON[T any](t *testing.T, resp *http.Response) T {
	t.Helper()
	var out T
	if err := json.NewDecoder(resp.Body).Decode(&out); err != nil {
		t.Fatalf("Decode: %v", err)
	}
	return out
}

func makeRepo(t *testing.T, name string) string {
	t.Helper()
	root := filepath.Join(t.TempDir(), name)
	writeFile(t, root, ".axm/index.md", "<!-- axm-meta\ndoc-state: current\nlast-reviewed: 2026-05-25\nowner: tests\nentries: []\n-->\n# Index\n")
	return root
}

func writeFile(t *testing.T, root, rel, content string) {
	t.Helper()
	abs := filepath.Join(root, rel)
	if err := os.MkdirAll(filepath.Dir(abs), 0o755); err != nil {
		t.Fatalf("MkdirAll(%s): %v", filepath.Dir(abs), err)
	}
	if err := os.WriteFile(abs, []byte(content), 0o644); err != nil {
		t.Fatalf("WriteFile(%s): %v", abs, err)
	}
}

func quote(value string) string {
	b, _ := json.Marshal(value)
	return string(b)
}
