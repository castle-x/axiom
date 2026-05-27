package axmfs_test

import (
	"os"
	"path/filepath"
	"testing"

	"github.com/castlexu/axiom/preview/internal/axmfs"
)

func TestResolveTargetAcceptsProjectRootAndAxmDirectory(t *testing.T) {
	root := makeRepo(t, "project")

	fromRoot, err := axmfs.ResolveTarget(root)
	if err != nil {
		t.Fatalf("ResolveTarget(root) error = %v", err)
	}
	if fromRoot.Path != root || fromRoot.Name != "project" {
		t.Fatalf("ResolveTarget(root) = %#v, want path %q name project", fromRoot, root)
	}

	fromAxm, err := axmfs.ResolveTarget(filepath.Join(root, ".axm"))
	if err != nil {
		t.Fatalf("ResolveTarget(.axm) error = %v", err)
	}
	if fromAxm.Path != root {
		t.Fatalf("ResolveTarget(.axm).Path = %q, want %q", fromAxm.Path, root)
	}
}

func TestResolveTargetSelectsSingleImmediateChildProject(t *testing.T) {
	parent := t.TempDir()
	child := makeRepoAt(t, parent, "child")

	target, err := axmfs.ResolveTarget(parent)
	if err != nil {
		t.Fatalf("ResolveTarget(parent) error = %v", err)
	}
	if target.Path != child {
		t.Fatalf("ResolveTarget(parent).Path = %q, want %q", target.Path, child)
	}
}

func TestResolveTargetReportsMultipleCandidates(t *testing.T) {
	parent := t.TempDir()
	first := makeRepoAt(t, parent, "first")
	second := makeRepoAt(t, parent, "second")

	_, err := axmfs.ResolveTarget(parent)
	if err == nil {
		t.Fatal("ResolveTarget(parent) error = nil, want target_multiple_projects")
	}
	previewErr, ok := axmfs.AsPreviewError(err)
	if !ok {
		t.Fatalf("ResolveTarget(parent) error type = %T, want PreviewError", err)
	}
	if previewErr.Code != "target_multiple_projects" || previewErr.Status != 400 {
		t.Fatalf("PreviewError = %#v, want target_multiple_projects status 400", previewErr)
	}
	if len(previewErr.Candidates) != 2 {
		t.Fatalf("Candidates = %#v, want two candidates", previewErr.Candidates)
	}
	got := map[string]bool{previewErr.Candidates[0].Path: true, previewErr.Candidates[1].Path: true}
	if !got[first] || !got[second] {
		t.Fatalf("Candidates = %#v, want %q and %q", previewErr.Candidates, first, second)
	}
}

func makeRepo(t *testing.T, name string) string {
	t.Helper()
	return makeRepoAt(t, t.TempDir(), name)
}

func makeRepoAt(t *testing.T, parent, name string) string {
	t.Helper()
	root := filepath.Join(parent, name)
	if err := os.MkdirAll(filepath.Join(root, ".axm"), 0o755); err != nil {
		t.Fatalf("MkdirAll(.axm): %v", err)
	}
	return root
}
