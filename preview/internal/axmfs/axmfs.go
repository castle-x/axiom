package axmfs

import (
	"errors"
	"fmt"
	"io/fs"
	"os"
	"path/filepath"
	"sort"
	"strings"
)

type Target struct {
	Path string `json:"path"`
	Name string `json:"name"`
}

type PreviewError struct {
	Code       string   `json:"error"`
	Message    string   `json:"message"`
	Status     int      `json:"-"`
	Candidates []Target `json:"candidates,omitempty"`
}

func (e *PreviewError) Error() string {
	return e.Message
}

func NewPreviewError(code, message string, status int) *PreviewError {
	return &PreviewError{Code: code, Message: message, Status: status}
}

func AsPreviewError(err error) (*PreviewError, bool) {
	var previewErr *PreviewError
	if errors.As(err, &previewErr) {
		return previewErr, true
	}
	return nil, false
}

func ResolveTarget(inputPath string) (Target, error) {
	if inputPath == "" {
		return Target{}, NewPreviewError("target_path_required", "Project path is required.", 400)
	}
	resolved, err := filepath.Abs(inputPath)
	if err != nil {
		return Target{}, NewPreviewError("target_path_invalid", err.Error(), 400)
	}
	info, err := os.Stat(resolved)
	if err != nil || !info.IsDir() {
		return Target{}, NewPreviewError("target_not_directory", fmt.Sprintf("Project path is not a directory: %s", resolved), 400)
	}

	directRoot := resolved
	if filepath.Base(resolved) == ".axm" {
		directRoot = filepath.Dir(resolved)
	}
	if HasAXM(directRoot) {
		return TargetInfo(directRoot), nil
	}

	candidates := FindImmediateAXMProjects(resolved)
	if len(candidates) == 1 {
		return TargetInfo(candidates[0]), nil
	}
	if len(candidates) > 1 {
		previewErr := NewPreviewError("target_multiple_projects", "Multiple child projects contain .axm. Choose a more specific project path.", 400)
		previewErr.Candidates = make([]Target, 0, len(candidates))
		for _, candidate := range candidates {
			previewErr.Candidates = append(previewErr.Candidates, TargetInfo(candidate))
		}
		return Target{}, previewErr
	}
	return Target{}, NewPreviewError("target_missing_axm", fmt.Sprintf(".axm directory not found under %s", resolved), 400)
}

func HasAXM(projectPath string) bool {
	info, err := os.Stat(filepath.Join(projectPath, ".axm"))
	return err == nil && info.IsDir()
}

func FindImmediateAXMProjects(root string) []string {
	entries, err := os.ReadDir(root)
	if err != nil {
		return nil
	}
	var candidates []string
	for _, entry := range entries {
		if !entry.IsDir() || strings.HasPrefix(entry.Name(), ".") {
			continue
		}
		candidate := filepath.Join(root, entry.Name())
		if HasAXM(candidate) {
			candidates = append(candidates, candidate)
		}
	}
	sort.Strings(candidates)
	return candidates
}

func TargetInfo(projectPath string) Target {
	resolved, err := filepath.Abs(projectPath)
	if err != nil {
		resolved = projectPath
	}
	return Target{Path: resolved, Name: filepath.Base(resolved)}
}

type Kind string

const (
	KindIndex     Kind = "index"
	KindUniversal Kind = "universal"
	KindProject   Kind = "project"
	KindKnowledge Kind = "knowledge"
	KindProgress  Kind = "progress"
)

type File struct {
	AbsPath string `json:"absPath"`
	RelPath string `json:"relPath"`
	Kind    Kind   `json:"kind"`
}

func WalkAXM(axmRoot, repoRoot string) ([]File, error) {
	if !HasDir(axmRoot) {
		return nil, nil
	}
	var out []File
	err := filepath.WalkDir(axmRoot, func(abs string, entry fs.DirEntry, err error) error {
		if err != nil {
			return err
		}
		if entry.IsDir() || !IsAXMDocName(entry.Name()) {
			return nil
		}
		rel, err := filepath.Rel(repoRoot, abs)
		if err != nil {
			return err
		}
		rel = NormalizePath(rel)
		kind, err := Classify(rel)
		if err != nil {
			return err
		}
		out = append(out, File{AbsPath: abs, RelPath: rel, Kind: kind})
		return nil
	})
	if err != nil {
		return nil, err
	}
	sort.Slice(out, func(i, j int) bool {
		return out[i].RelPath < out[j].RelPath
	})
	return out, nil
}

func Classify(relPath string) (Kind, error) {
	base := filepath.Base(relPath)
	if IsIndexDocName(base) {
		return KindIndex, nil
	}
	parts := strings.Split(NormalizePath(relPath), "/")
	if len(parts) < 2 || parts[0] != ".axm" {
		return "", fmt.Errorf("walker: cannot classify file %s", relPath)
	}
	switch parts[1] {
	case "universal":
		return KindUniversal, nil
	case "project":
		return KindProject, nil
	case "knowledge":
		return KindKnowledge, nil
	case "progress":
		return KindProgress, nil
	default:
		return "", fmt.Errorf("walker: cannot classify file %s", relPath)
	}
}

func HasDir(target string) bool {
	info, err := os.Stat(target)
	return err == nil && info.IsDir()
}

func IsAXMDocName(name string) bool {
	return strings.HasSuffix(name, ".md") || strings.HasSuffix(name, ".mdc")
}

func IsIndexDocName(name string) bool {
	return name == "index.md" || name == "index.mdc"
}

func NormalizePath(value string) string {
	return filepath.ToSlash(value)
}
