package model_test

import (
	"encoding/json"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/castlexu/axiom/preview/internal/model"
)

func TestBuildIncludesDocumentsTreeGraphBugsAndValidation(t *testing.T) {
	root := makePreviewRepo(t)

	preview, err := model.Build(root)
	if err != nil {
		t.Fatalf("Build() error = %v", err)
	}

	if preview.Version != 1 {
		t.Fatalf("Version = %d, want 1", preview.Version)
	}
	if preview.Target.Path != root || preview.Target.Name != filepath.Base(root) {
		t.Fatalf("Target = %#v, want root target", preview.Target)
	}
	if preview.Summary.Docs != 8 || preview.Summary.AxmDocs != 7 || preview.Summary.AgentsDocs != 1 {
		t.Fatalf("Summary docs = %#v, want 8 total / 7 axm / 1 agents", preview.Summary)
	}
	if preview.Bugs.OpenCount != 1 || preview.Bugs.Total != 1 {
		t.Fatalf("Bugs = %#v, want one open bug", preview.Bugs)
	}
	if preview.Validation.Status != "pass" {
		t.Fatalf("Validation status = %q, issues = %#v; want pass", preview.Validation.Status, preview.Validation.Issues)
	}

	doc := findDoc(t, preview.Documents, ".axm/progress/core/bugs/bug-2026-05-25-crash.md")
	if doc.Meta["progress-type"] != "bug" || doc.Meta["workflow-state"] != "open" {
		t.Fatalf("bug doc meta = %#v, want progress-type bug workflow-state open", doc.Meta)
	}
	if preview.Tree.Name != ".axm" || len(preview.Tree.Children) == 0 {
		t.Fatalf("Tree = %#v, want .axm root with children", preview.Tree)
	}
	if len(preview.Graph.Nodes) == 0 || len(preview.Graph.Edges) == 0 {
		t.Fatalf("Graph = %#v, want nodes and edges", preview.Graph)
	}
}

func TestBuildGraphUsesCodeRefPathAsNodeID(t *testing.T) {
	root := t.TempDir()
	writeFile(t, root, "AGENTS.md", "# AGENTS.md\n\n## Knowledge Index\n\n| Task | Read |\n| --- | --- |\n| Code | `.axm/knowledge/core/overview.md` |\n")
	writeFile(t, root, "src/main.go", "package main\n")
	writeFile(t, root, ".axm/index.md", meta(`doc-state: current
last-reviewed: 2026-05-25
owner: tests
entries:
  - path: knowledge/
    title: Knowledge
    when-to-read: Knowledge docs`)+"\n# Root\n")
	writeFile(t, root, ".axm/knowledge/index.md", meta(`doc-state: current
last-reviewed: 2026-05-25
owner: tests
entries:
  - path: core/
    title: Core
    when-to-read: Core docs`)+"\n# Knowledge\n")
	writeFile(t, root, ".axm/knowledge/core/index.md", meta(`doc-state: current
last-reviewed: 2026-05-25
owner: tests
entries:
  - path: overview.md
    title: Overview
    when-to-read: Overview`)+"\n# Core\n")
	writeFile(t, root, ".axm/knowledge/core/overview.md", meta(`doc-state: current
last-reviewed: 2026-05-25
owner: tests
depth: overview
code-refs:
  - src/main.go`)+"\n# Core Overview\n")

	preview, err := model.Build(root)
	if err != nil {
		t.Fatalf("Build() error = %v", err)
	}
	if !hasGraphNode(preview.Graph.Nodes, "src/main.go", "code") {
		t.Fatalf("graph nodes = %#v, want code node with id src/main.go", preview.Graph.Nodes)
	}
	if hasGraphNode(preview.Graph.Nodes, "code:src/main.go", "code") {
		t.Fatalf("graph nodes = %#v, did not expect code: prefix", preview.Graph.Nodes)
	}
	if !hasGraphEdge(preview.Graph.Edges, ".axm/knowledge/core/overview.md", "src/main.go", "code-ref") {
		t.Fatalf("graph edges = %#v, want code-ref edge to src/main.go", preview.Graph.Edges)
	}
	rootIndex := graphNode(preview.Graph.Nodes, ".axm/index.md")
	if rootIndex.Label != ".axm/index.md" {
		t.Fatalf("root index label = %q, want .axm/index.md", rootIndex.Label)
	}
	coreIndex := graphNode(preview.Graph.Nodes, ".axm/knowledge/core/index.md")
	if coreIndex.Label != "core/" {
		t.Fatalf("nested index label = %q, want core/", coreIndex.Label)
	}
}

func TestBuildBugInventoryMatchesLegacyShapeAndBodyFallbacks(t *testing.T) {
	root := t.TempDir()
	writeFile(t, root, "AGENTS.md", "# AGENTS.md\n\n## Knowledge Index\n\n| Task | Read |\n| --- | --- |\n| Bugs | `.axm/progress/core/bugs/bug-2026-05-25-body-fields.md` |\n")
	writeFile(t, root, ".axm/index.md", meta(`doc-state: current
last-reviewed: 2026-05-25
owner: tests
entries:
  - path: progress/
    title: Progress
    when-to-read: Progress docs`)+"\n# Root\n")
	writeFile(t, root, ".axm/progress/index.md", meta(`doc-state: current
last-reviewed: 2026-05-25
owner: tests
entries:
  - path: core/
    title: Core
    when-to-read: Core progress`)+"\n# Progress\n")
	writeFile(t, root, ".axm/progress/core/index.md", meta(`doc-state: current
last-reviewed: 2026-05-25
owner: tests
entries:
  - path: bugs/
    title: Bugs
    when-to-read: Bugs`)+"\n# Core\n")
	writeFile(t, root, ".axm/progress/core/bugs/index.md", meta(`doc-state: current
last-reviewed: 2026-05-25
owner: tests
entries:
  - path: bug-2026-05-25-body-fields.md
    title: Body Fields
    when-to-read: Bug`)+"\n# Bugs\n")
	writeFile(t, root, ".axm/progress/core/bugs/bug-2026-05-25-body-fields.md", meta(`doc-state: current
last-reviewed: 2026-05-25
owner: tests
progress-type: bug
workflow-state: open
state-updated: 2026-05-25`)+"\n# Body Fields\n\n| priority | P2 |\n| severity | medium |\n\nBody excerpt line.\n")

	preview, err := model.Build(root)
	if err != nil {
		t.Fatalf("Build() error = %v", err)
	}
	if preview.Bugs.Open != 1 || preview.Bugs.OpenCount != 1 || preview.Bugs.Total != 1 {
		t.Fatalf("Bugs = %#v, want open/openCount/total all 1", preview.Bugs)
	}
	bug := preview.Bugs.Items[0]
	if bug.Initiative != "core" || bug.Priority != "P2" || bug.Severity != "medium" {
		t.Fatalf("Bug item = %#v, want path initiative and body priority/severity fallbacks", bug)
	}
	if bug.Excerpt != "Body excerpt line." || !strings.Contains(bug.SearchText, "p2") || !strings.Contains(bug.SearchText, "medium") {
		t.Fatalf("Bug excerpt/search = %#v, want body excerpt and fallback fields in search", bug)
	}
}

func TestBuildUsesDocStateForDisplayState(t *testing.T) {
	root := makePreviewRepo(t)
	writeFile(t, root, ".axm/progress/core/bugs/index.md", meta(`doc-state: current
last-reviewed: 2026-05-25
owner: tests
entries:
  - path: bug-2026-05-25-crash.md
    title: Crash
    when-to-read: Bug details
  - path: bug-2026-05-25-closed.md
    title: Closed
    when-to-read: Closed bug`)+"\n# Bugs Index\n")
	writeFile(t, root, ".axm/progress/core/bugs/bug-2026-05-25-closed.md", meta(`doc-state: deprecated
last-reviewed: 2026-05-25
owner: tests
progress-type: bug
initiative: core
workflow-state: closed
state-updated: 2026-05-25`)+"\n# Closed\n\nDeprecated closed bug.\n")

	preview, err := model.Build(root)
	if err != nil {
		t.Fatalf("Build() error = %v", err)
	}

	doc := findDoc(t, preview.Documents, ".axm/progress/core/bugs/bug-2026-05-25-closed.md")
	if doc.Meta["doc-state"] != "deprecated" || doc.Meta["workflow-state"] != "closed" {
		t.Fatalf("doc meta = %#v, want deprecated doc-state and closed workflow-state", doc.Meta)
	}
	node := graphNode(preview.Graph.Nodes, doc.Path)
	if node.DisplayState != "deprecated" {
		t.Fatalf("graph node displayState = %q, want deprecated", node.DisplayState)
	}
	tree := findTreeNode(preview.Tree, doc.Path)
	if tree.DisplayState != "deprecated" || tree.WorkflowState != "closed" {
		t.Fatalf("tree node = %#v, want deprecated displayState with closed workflowState preserved", tree)
	}
}

func TestBuildGraphResolvesLegacyRefsAndHidesInternalEdgeKey(t *testing.T) {
	root := t.TempDir()
	writeFile(t, root, "AGENTS.md", "# AGENTS.md\n\n## Knowledge Index\n\n| Task | Read |\n| --- | --- |\n| Core | `.axm/knowledge/core/overview.md` |\n")
	writeFile(t, root, ".axm/index.md", meta(`doc-state: current
last-reviewed: 2026-05-25
owner: tests
entries:
  - path: knowledge/
    title: Knowledge
    when-to-read: Knowledge docs`)+"\n# Root\n")
	writeFile(t, root, ".axm/knowledge/index.md", meta(`doc-state: current
last-reviewed: 2026-05-25
owner: tests
entries:
  - path: core/
    title: Core
    when-to-read: Core docs`)+"\n# Knowledge\n")
	writeFile(t, root, ".axm/knowledge/core/index.md", meta(`doc-state: current
last-reviewed: 2026-05-25
owner: tests
entries:
  - path: overview.md
    title: Overview
    when-to-read: Overview`)+"\n# Core\n")
	writeFile(t, root, ".axm/knowledge/core/overview.md", meta(`doc-state: current
last-reviewed: 2026-05-25
owner: tests
depth: overview
code-refs:
  - AGENTS.md
related:
  - ../core
  - .axm/knowledge/missing.md`)+"\n# Overview\n")

	preview, err := model.Build(root)
	if err != nil {
		t.Fatalf("Build() error = %v", err)
	}
	if !hasGraphEdge(preview.Graph.Edges, ".axm/knowledge/core/overview.md", ".axm/knowledge/core/index.md", "related") {
		t.Fatalf("graph edges = %#v, want directory related ref to resolve to index doc", preview.Graph.Edges)
	}
	if !hasGraphEdge(preview.Graph.Edges, ".axm/knowledge/core/overview.md", ".axm/knowledge/missing.md", "related") {
		t.Fatalf("graph edges = %#v, want unresolved absolute .axm related ref preserved", preview.Graph.Edges)
	}
	raw, err := json.Marshal(preview.Graph)
	if err != nil {
		t.Fatalf("Marshal(graph) error = %v", err)
	}
	if strings.Contains(string(raw), `"key"`) {
		t.Fatalf("graph JSON = %s, did not expect internal edge key", raw)
	}
}

func TestBuildUsesUnknownForMissingDocState(t *testing.T) {
	root := makePreviewRepo(t)
	writeFile(t, root, ".axm/project/index.md", meta(`doc-state: current
last-reviewed: 2026-05-25
owner: tests
entries:
  - path: architecture.md
    title: Architecture
    when-to-read: Architecture
  - path: no-meta.md
    title: No Meta
    when-to-read: No metadata`)+"\n# Project Index\n")
	writeFile(t, root, ".axm/project/no-meta.md", "# No Meta\n")

	preview, err := model.Build(root)
	if err != nil {
		t.Fatalf("Build() error = %v", err)
	}
	doc := findDoc(t, preview.Documents, ".axm/project/no-meta.md")
	if doc.Meta["doc-state"] != nil {
		t.Fatalf("doc meta = %#v, did not expect doc-state", doc.Meta)
	}
	node := graphNode(preview.Graph.Nodes, doc.Path)
	if node.DocState != "unknown" || node.DisplayState != "unknown" {
		t.Fatalf("graph node = %#v, want unknown doc/display state", node)
	}
}

func findDoc(t *testing.T, docs []model.Document, path string) model.Document {
	t.Helper()
	for _, doc := range docs {
		if doc.Path == path {
			return doc
		}
	}
	t.Fatalf("document %q not found in %#v", path, docs)
	return model.Document{}
}

func findTreeNode(root model.TreeNode, path string) model.TreeNode {
	if root.Path == path {
		return root
	}
	for _, child := range root.Children {
		if found := findTreeNode(child, path); found.Path != "" {
			return found
		}
	}
	return model.TreeNode{}
}

func hasGraphNode(nodes []model.GraphNode, id, nodeType string) bool {
	for _, node := range nodes {
		if node.ID == id && node.Type == nodeType {
			return true
		}
	}
	return false
}

func hasGraphEdge(edges []model.GraphEdge, from, to, edgeType string) bool {
	for _, edge := range edges {
		if edge.From == from && edge.To == to && edge.Type == edgeType {
			return true
		}
	}
	return false
}

func graphNode(nodes []model.GraphNode, id string) model.GraphNode {
	for _, node := range nodes {
		if node.ID == id {
			return node
		}
	}
	return model.GraphNode{}
}

func makePreviewRepo(t *testing.T) string {
	t.Helper()
	root := t.TempDir()
	writeFile(t, root, "AGENTS.md", "# AGENTS.md\n\n## Knowledge Index\n\n| 任务类型 | 读哪里 |\n| --- | --- |\n| Core | `.axm/project/architecture.md` |\n")
	writeFile(t, root, "src/main.go", "package main\n")
	writeFile(t, root, ".axm/index.md", meta(`doc-state: current
last-reviewed: 2026-05-25
owner: tests
entries:
  - path: project/
    title: Project
    when-to-read: Project docs
  - path: progress/
    title: Progress
    when-to-read: Progress docs`)+"\n# Root Index\n")
	writeFile(t, root, ".axm/project/index.md", meta(`doc-state: current
last-reviewed: 2026-05-25
owner: tests
entries:
  - path: architecture.md
    title: Architecture
    when-to-read: Architecture`)+"\n# Project Index\n")
	writeFile(t, root, ".axm/project/architecture.md", meta(`doc-state: current
last-reviewed: 2026-05-25
owner: tests
applies-to: [project:test]`)+"\n# Architecture\n\nCore docs.\n")
	writeFile(t, root, ".axm/progress/index.md", meta(`doc-state: current
last-reviewed: 2026-05-25
owner: tests
entries:
  - path: core/
    title: Core
    when-to-read: Core progress`)+"\n# Progress Index\n")
	writeFile(t, root, ".axm/progress/core/index.md", meta(`doc-state: current
last-reviewed: 2026-05-25
owner: tests
entries:
  - path: bugs/
    title: Bugs
    when-to-read: Bug list`)+"\n# Core Index\n")
	writeFile(t, root, ".axm/progress/core/bugs/index.md", meta(`doc-state: current
last-reviewed: 2026-05-25
owner: tests
entries:
  - path: bug-2026-05-25-crash.md
    title: Crash
    when-to-read: Bug details`)+"\n# Bugs Index\n")
	writeFile(t, root, ".axm/progress/core/bugs/bug-2026-05-25-crash.md", meta(`doc-state: current
last-reviewed: 2026-05-25
owner: tests
progress-type: bug
initiative: core
workflow-state: open
state-updated: 2026-05-25
priority: P1
severity: high`)+"\n# Crash\n\nThe preview crashes.\n")
	return root
}

func meta(body string) string {
	return "<!-- axm-meta\n" + body + "\n-->\n"
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
