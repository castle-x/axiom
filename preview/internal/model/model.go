package model

import (
	"encoding/json"
	"fmt"
	"os"
	"path"
	"path/filepath"
	"sort"
	"strings"
	"time"

	"github.com/castlexu/axiom/preview/internal/axmfs"
	"github.com/castlexu/axiom/preview/internal/axmmeta"
	"github.com/castlexu/axiom/preview/internal/validation"
)

type Preview struct {
	Version     int               `json:"version"`
	GeneratedAt string            `json:"generatedAt"`
	Target      axmfs.Target      `json:"target"`
	Summary     Summary           `json:"summary"`
	Tree        TreeNode          `json:"tree"`
	Documents   []Document        `json:"documents"`
	Graph       Graph             `json:"graph"`
	Bugs        BugInventory      `json:"bugs"`
	Validation  validation.Result `json:"validation"`
}

type Document struct {
	ID         string         `json:"id"`
	Path       string         `json:"path"`
	Name       string         `json:"name"`
	Dir        string         `json:"dir"`
	Kind       string         `json:"kind"`
	Title      string         `json:"title"`
	Subtitle   string         `json:"subtitle"`
	Body       string         `json:"body"`
	Raw        string         `json:"raw"`
	LineCount  int            `json:"lineCount"`
	Meta       map[string]any `json:"meta"`
	HasMeta    bool           `json:"hasMeta,omitempty"`
	MetaKind   *string        `json:"metaKind"`
	ParseError *string        `json:"parseError"`
	SearchText string         `json:"searchText"`
}

type TreeNode struct {
	Type          string     `json:"type"`
	Name          string     `json:"name"`
	Path          string     `json:"path"`
	Children      []TreeNode `json:"children,omitempty"`
	Count         int        `json:"count,omitempty"`
	Title         string     `json:"title,omitempty"`
	Subtitle      string     `json:"subtitle,omitempty"`
	Kind          string     `json:"kind,omitempty"`
	DocState      string     `json:"docState,omitempty"`
	WorkflowState string     `json:"workflowState,omitempty"`
	DisplayState  string     `json:"displayState,omitempty"`
}

type Graph struct {
	Nodes []GraphNode `json:"nodes"`
	Edges []GraphEdge `json:"edges"`
}

type GraphNode struct {
	ID            string `json:"id"`
	Type          string `json:"type"`
	Path          string `json:"path"`
	Label         string `json:"label"`
	Title         string `json:"title"`
	Subtitle      string `json:"subtitle"`
	Kind          string `json:"kind,omitempty"`
	DocState      string `json:"docState,omitempty"`
	WorkflowState string `json:"workflowState,omitempty"`
	DisplayState  string `json:"displayState,omitempty"`
}

type GraphEdge struct {
	Key   string `json:"-"`
	From  string `json:"from"`
	To    string `json:"to"`
	Type  string `json:"type"`
	Label string `json:"label"`
}

type Summary struct {
	Docs            int            `json:"docs"`
	AxmDocs         int            `json:"axmDocs"`
	AgentsDocs      int            `json:"agentsDocs"`
	Errors          int            `json:"errors"`
	Warnings        int            `json:"warnings"`
	Bugs            int            `json:"bugs"`
	Status          string         `json:"status"`
	ByDocState      map[string]int `json:"byDocState"`
	ByWorkflowState map[string]int `json:"byWorkflowState"`
	Lines           int            `json:"lines"`
}

type BugInventory struct {
	Open      int            `json:"open"`
	OpenCount int            `json:"openCount"`
	Total     int            `json:"total"`
	ByState   map[string]int `json:"byState"`
	Items     []BugItem      `json:"items"`
}

type BugItem struct {
	Path         string `json:"path"`
	Title        string `json:"title"`
	Subtitle     string `json:"subtitle"`
	Initiative   string `json:"initiative"`
	State        string `json:"state"`
	Open         bool   `json:"open"`
	StateUpdated string `json:"stateUpdated"`
	Priority     string `json:"priority,omitempty"`
	Severity     string `json:"severity,omitempty"`
	Excerpt      string `json:"excerpt"`
	SearchText   string `json:"searchText"`
}

func Build(target string) (Preview, error) {
	repoRoot, err := filepath.Abs(target)
	if err != nil {
		return Preview{}, err
	}
	axmRoot := filepath.Join(repoRoot, ".axm")
	if !axmfs.HasDir(axmRoot) {
		return Preview{}, fmt.Errorf(".axm directory does not exist under %s", repoRoot)
	}
	documents, err := readDocuments(axmRoot, repoRoot)
	if err != nil {
		return Preview{}, err
	}
	documentMap := map[string]Document{}
	for _, doc := range documents {
		documentMap[doc.Path] = doc
	}
	graph := buildGraph(documents, documentMap, repoRoot)
	validationResult, err := validation.Validate(repoRoot)
	if err != nil {
		return Preview{}, err
	}
	bugs := buildBugInventory(documents)
	return Preview{
		Version:     1,
		GeneratedAt: time.Now().UTC().Format(time.RFC3339Nano),
		Target:      axmfs.TargetInfo(repoRoot),
		Summary:     buildSummary(documents, validationResult, bugs),
		Tree:        buildTree(documents),
		Documents:   documents,
		Graph:       graph,
		Bugs:        bugs,
		Validation:  validationResult,
	}, nil
}

func readDocuments(axmRoot, repoRoot string) ([]Document, error) {
	files, err := axmfs.WalkAXM(axmRoot, repoRoot)
	if err != nil {
		return nil, err
	}
	documents := make([]Document, 0, len(files)+1)
	for _, file := range files {
		documents = append(documents, readDocument(file))
	}
	agentsPath := filepath.Join(repoRoot, "AGENTS.md")
	if _, err := os.Stat(agentsPath); err == nil {
		documents = append(documents, readAgentsDocument(agentsPath))
	}
	return documents, nil
}

func readAgentsDocument(absPath string) Document {
	rawBytes, err := os.ReadFile(absPath)
	raw := string(rawBytes)
	if err != nil {
		raw = ""
	}
	relPath := "AGENTS.md"
	meta := map[string]any{"doc-state": "current"}
	return Document{
		ID:         relPath,
		Path:       relPath,
		Name:       relPath,
		Dir:        ".",
		Kind:       "agents",
		Title:      inferTitle(raw, relPath),
		Subtitle:   inferSubtitle(raw),
		Body:       raw,
		Raw:        raw,
		LineCount:  lineCount(raw),
		Meta:       meta,
		MetaKind:   nil,
		ParseError: nil,
		SearchText: buildSearchText(relPath, inferTitle(raw, relPath), inferSubtitle(raw), raw, meta),
	}
}

func readDocument(file axmfs.File) Document {
	rawBytes, err := os.ReadFile(file.AbsPath)
	raw := string(rawBytes)
	if err != nil {
		raw = ""
	}
	parsed, parseErr := axmmeta.Parse(raw)
	body := parsed.Body
	meta := parsed.Data
	hasMeta := parsed.HasMeta
	var metaKind *string
	var parseError *string
	if parsed.MetaKind != "" {
		metaKind = &parsed.MetaKind
	}
	if parseErr != nil {
		msg := parseErr.Error()
		parseError = &msg
		body = stripMetadata(raw)
		meta = map[string]any{}
		hasMeta = true
		metaKind = nil
	}
	title := inferTitle(body, file.RelPath)
	subtitle := inferSubtitle(body)
	return Document{
		ID:         file.RelPath,
		Path:       file.RelPath,
		Name:       path.Base(file.RelPath),
		Dir:        path.Dir(file.RelPath),
		Kind:       string(file.Kind),
		Title:      title,
		Subtitle:   subtitle,
		Body:       body,
		Raw:        raw,
		LineCount:  lineCount(raw),
		Meta:       meta,
		HasMeta:    hasMeta,
		MetaKind:   metaKind,
		ParseError: parseError,
		SearchText: buildSearchText(file.RelPath, title, subtitle, body, meta),
	}
}

func buildTree(documents []Document) TreeNode {
	root := TreeNode{Type: "dir", Name: ".axm", Path: ".axm", Count: len(documents)}
	dirIndex := map[string]*TreeNode{root.Path: &root}
	for _, doc := range documents {
		parts := strings.Split(doc.Path, "/")
		current := &root
		currentPath := parts[0]
		if len(parts) > 1 {
			for _, part := range parts[1 : len(parts)-1] {
				currentPath += "/" + part
				next := dirIndex[currentPath]
				if next == nil {
					current.Children = append(current.Children, TreeNode{Type: "dir", Name: part, Path: currentPath})
					next = &current.Children[len(current.Children)-1]
					dirIndex[currentPath] = next
				}
				next.Count++
				current = next
			}
		}
		current.Children = append(current.Children, TreeNode{
			Type:          "doc",
			Name:          doc.Name,
			Path:          doc.Path,
			Title:         doc.Title,
			Subtitle:      doc.Subtitle,
			Kind:          doc.Kind,
			DocState:      docStateForDoc(doc),
			WorkflowState: workflowStateForDoc(doc),
			DisplayState:  displayStateForDoc(doc),
		})
	}
	sortTree(&root)
	return root
}

func sortTree(node *TreeNode) {
	sort.SliceStable(node.Children, func(i, j int) bool {
		left := node.Children[i]
		right := node.Children[j]
		if lw, rw := treeOrderWeight(left, node.Path), treeOrderWeight(right, node.Path); lw != rw {
			return lw < rw
		}
		return left.Name < right.Name
	})
	for i := range node.Children {
		sortTree(&node.Children[i])
	}
}

func treeOrderWeight(node TreeNode, parentPath string) int {
	if parentPath == ".axm" && node.Type == "dir" {
		switch node.Name {
		case "universal":
			return 0
		case "project":
			return 1
		case "knowledge":
			return 2
		case "progress":
			return 3
		default:
			return 4
		}
	}
	if node.Type == "doc" && axmfs.IsIndexDocName(node.Name) {
		return 0
	}
	if node.Type == "dir" {
		return 5
	}
	return 6
}

func buildGraph(documents []Document, documentMap map[string]Document, repoRoot string) Graph {
	nodes := map[string]GraphNode{}
	edges := []GraphEdge{}
	addNode := func(node GraphNode) {
		if _, exists := nodes[node.ID]; !exists {
			nodes[node.ID] = node
		}
	}
	addEdge := func(from, to, edgeType, label string) {
		if from == "" || to == "" || from == to {
			return
		}
		key := from + "\x00" + to + "\x00" + edgeType
		for _, edge := range edges {
			if edge.Key == key {
				return
			}
		}
		edges = append(edges, GraphEdge{Key: key, From: from, To: to, Type: edgeType, Label: label})
	}

	for _, doc := range documents {
		addNode(GraphNode{
			ID:            doc.Path,
			Type:          "doc",
			Path:          doc.Path,
			Label:         labelForDoc(doc),
			Title:         doc.Title,
			Subtitle:      doc.Subtitle,
			Kind:          doc.Kind,
			DocState:      docStateForDoc(doc),
			WorkflowState: workflowStateForDoc(doc),
			DisplayState:  displayStateForDoc(doc),
		})
	}
	if _, err := os.Stat(filepath.Join(repoRoot, "AGENTS.md")); err == nil {
		addNode(GraphNode{ID: "AGENTS.md", Type: "root", Path: "AGENTS.md", Label: "AGENTS.md", Title: "AGENTS.md", Subtitle: "AI development context entry", DisplayState: "current"})
		if rootIndex := resolveIndexDocPath(".axm", documentMap); rootIndex != "" {
			addEdge("AGENTS.md", rootIndex, "entries", "routes")
		}
	}
	for _, doc := range documents {
		for _, entry := range metaList(doc.Meta, "entries") {
			entryPath, _ := entry["path"].(string)
			if entryPath == "" {
				continue
			}
			if target := resolveEntryPath(doc.Path, entryPath, documentMap); target != "" {
				addEdge(doc.Path, target, "entries", "entries")
			}
		}
		for _, related := range metaStrings(doc.Meta, "related") {
			if target := resolveDocRef(doc.Path, related, documentMap); target != "" {
				addEdge(doc.Path, target, "related", "related")
			}
		}
		for _, scope := range metaStrings(doc.Meta, "applies-to") {
			id := "scope:" + scope
			addNode(GraphNode{ID: id, Type: "scope", Path: scope, Label: scope, Title: scope, DisplayState: "current"})
			addEdge(doc.Path, id, "applies-to", "applies-to")
		}
		for _, codeRef := range metaStrings(doc.Meta, "code-refs") {
			id := codeRef
			state := "current"
			if _, err := os.Stat(filepath.Join(repoRoot, filepath.FromSlash(codeRef))); err != nil {
				state = "missing"
			}
			addNode(GraphNode{ID: id, Type: "code", Path: codeRef, Label: path.Base(codeRef), Title: codeRef, DisplayState: state})
			addEdge(doc.Path, id, "code-ref", "code-ref")
		}
	}
	nodeList := make([]GraphNode, 0, len(nodes))
	for _, node := range nodes {
		nodeList = append(nodeList, node)
	}
	sort.Slice(nodeList, func(i, j int) bool { return nodeList[i].ID < nodeList[j].ID })
	sort.Slice(edges, func(i, j int) bool { return edges[i].Key < edges[j].Key })
	return Graph{Nodes: nodeList, Edges: edges}
}

func buildBugInventory(documents []Document) BugInventory {
	openStates := map[string]bool{"open": true, "in-progress": true, "fixed": true, "verified": true, "reopened": true}
	inventory := BugInventory{ByState: map[string]int{}, Items: []BugItem{}}
	for _, doc := range documents {
		progressType, _ := doc.Meta["progress-type"].(string)
		if progressType != "bug" && !isCanonicalBugPath(doc.Path) {
			continue
		}
		state := workflowStateForDoc(doc)
		if state == "" {
			state = "unknown"
		}
		item := BugItem{
			Path:         doc.Path,
			Title:        doc.Title,
			Subtitle:     doc.Subtitle,
			Initiative:   coalesce(stringMeta(doc.Meta, "initiative"), inferInitiative(doc.Path)),
			State:        state,
			Open:         openStates[state],
			StateUpdated: stringMeta(doc.Meta, "state-updated"),
			Priority:     coalesce(stringMeta(doc.Meta, "priority"), extractBodyField(doc.Body, "priority")),
			Severity:     coalesce(stringMeta(doc.Meta, "severity"), extractBodyField(doc.Body, "severity")),
			Excerpt:      bugExcerpt(doc.Body),
		}
		item.SearchText = strings.ToLower(strings.Join([]string{doc.SearchText, item.Priority, item.Severity}, "\n"))
		inventory.Items = append(inventory.Items, item)
		inventory.ByState[state]++
		if item.Open {
			inventory.OpenCount++
		}
	}
	inventory.Open = inventory.OpenCount
	inventory.Total = len(inventory.Items)
	return inventory
}

func buildSummary(documents []Document, validationResult validation.Result, bugs BugInventory) Summary {
	summary := Summary{
		Errors:          validationResult.Errors,
		Warnings:        validationResult.Warnings,
		Bugs:            bugs.OpenCount,
		Status:          validationResult.Status,
		ByDocState:      map[string]int{},
		ByWorkflowState: map[string]int{},
	}
	for _, doc := range documents {
		summary.Docs++
		if doc.Kind == "agents" {
			summary.AgentsDocs++
		} else {
			summary.AxmDocs++
		}
		summary.Lines += doc.LineCount
		if state := docStateForDoc(doc); state != "" {
			summary.ByDocState[state]++
		}
		if state := workflowStateForDoc(doc); state != "" {
			summary.ByWorkflowState[state]++
		}
	}
	return summary
}

func resolveEntryPath(docPath, entryPath string, documentMap map[string]Document) string {
	dir := path.Dir(docPath)
	if strings.HasSuffix(entryPath, "/") {
		return resolveIndexDocPath(path.Join(dir, strings.TrimSuffix(entryPath, "/")), documentMap)
	}
	return resolveDocRef(docPath, entryPath, documentMap)
}

func resolveDocRef(docPath, ref string, documentMap map[string]Document) string {
	clean := strings.TrimSpace(strings.Split(ref, "#")[0])
	if clean == "" {
		return ""
	}
	clean = path.Clean(clean)
	if strings.HasPrefix(clean, ".axm/") || clean == "AGENTS.md" {
		if _, ok := documentMap[clean]; ok {
			return clean
		}
		if target := resolveDirectoryRef(clean, documentMap); target != "" {
			return target
		}
		if strings.HasPrefix(clean, ".axm/") {
			return clean
		}
		return ""
	}
	candidate := path.Clean(path.Join(path.Dir(docPath), clean))
	if _, ok := documentMap[candidate]; ok {
		return candidate
	}
	if target := resolveDirectoryRef(candidate, documentMap); target != "" {
		return target
	}
	return ""
}

func resolveDirectoryRef(candidate string, documentMap map[string]Document) string {
	if strings.HasSuffix(candidate, ".md") || strings.HasSuffix(candidate, ".mdc") {
		return ""
	}
	return resolveIndexDocPath(candidate, documentMap)
}

func resolveIndexDocPath(dir string, documentMap map[string]Document) string {
	for _, name := range []string{"index.md", "index.mdc"} {
		candidate := path.Join(dir, name)
		if _, ok := documentMap[candidate]; ok {
			return candidate
		}
	}
	return ""
}

func inferTitle(body, relPath string) string {
	for _, line := range strings.Split(body, "\n") {
		if strings.HasPrefix(line, "# ") {
			return strings.TrimSpace(strings.TrimPrefix(line, "# "))
		}
	}
	return path.Base(relPath)
}

func inferSubtitle(body string) string {
	for _, line := range strings.Split(body, "\n") {
		trimmed := strings.TrimSpace(line)
		if trimmed == "" || strings.HasPrefix(trimmed, "#") || strings.HasPrefix(trimmed, "|") || strings.HasPrefix(trimmed, "```") {
			continue
		}
		return truncate(stripMarkdown(trimmed), 90)
	}
	return ""
}

func stripMarkdown(value string) string {
	value = strings.ReplaceAll(value, "`", "")
	value = strings.ReplaceAll(value, "**", "")
	return value
}

func stripMetadata(raw string) string {
	if strings.HasPrefix(raw, "<!-- axm-meta") {
		if end := strings.Index(raw, "-->"); end >= 0 {
			return strings.TrimLeft(raw[end+3:], "\n\r")
		}
	}
	if strings.HasPrefix(raw, "---") {
		parts := strings.SplitN(raw, "---", 3)
		if len(parts) == 3 {
			return strings.TrimLeft(parts[2], "\n\r")
		}
	}
	return raw
}

func buildSearchText(relPath, title, subtitle, body string, meta map[string]any) string {
	metaJSON, _ := json.Marshal(meta)
	text := strings.Join([]string{relPath, title, subtitle, body, string(metaJSON), stringMeta(meta, "doc-state"), stringMeta(meta, "workflow-state"), stringMeta(meta, "state-updated")}, "\n")
	return text + "\n" + strings.ToLower(text)
}

func docStateForDoc(doc Document) string {
	if value := stringMeta(doc.Meta, "doc-state"); value != "" {
		return value
	}
	return "unknown"
}

func workflowStateForDoc(doc Document) string {
	return stringMeta(doc.Meta, "workflow-state")
}

func displayStateForDoc(doc Document) string {
	return docStateForDoc(doc)
}

func labelForDoc(doc Document) string {
	if axmfs.IsIndexDocName(doc.Name) {
		parent := path.Base(doc.Dir)
		if parent == ".axm" {
			return doc.Path
		}
		return parent + "/"
	}
	return doc.Name
}

func metaList(meta map[string]any, key string) []map[string]any {
	rawList, ok := meta[key].([]any)
	if !ok {
		return nil
	}
	out := make([]map[string]any, 0, len(rawList))
	for _, item := range rawList {
		if mapped, ok := item.(map[string]any); ok {
			out = append(out, mapped)
		}
	}
	return out
}

func metaStrings(meta map[string]any, key string) []string {
	rawList, ok := meta[key].([]any)
	if !ok {
		return nil
	}
	out := make([]string, 0, len(rawList))
	for _, item := range rawList {
		if value, ok := item.(string); ok && value != "" {
			out = append(out, value)
		}
	}
	return out
}

func stringMeta(meta map[string]any, key string) string {
	value, _ := meta[key].(string)
	return value
}

func inferInitiative(docPath string) string {
	parts := strings.Split(docPath, "/")
	if len(parts) >= 4 && parts[0] == ".axm" && parts[1] == "progress" {
		return parts[2]
	}
	return ""
}

func extractBodyField(body, field string) string {
	field = strings.ToLower(field)
	for _, line := range strings.Split(body, "\n") {
		trimmed := strings.TrimSpace(line)
		if !strings.HasPrefix(trimmed, "|") {
			continue
		}
		cells := strings.Split(trimmed, "|")
		if len(cells) < 3 {
			continue
		}
		if strings.EqualFold(strings.TrimSpace(cells[1]), field) {
			return stripMarkdown(strings.TrimSpace(cells[2]))
		}
	}
	return ""
}

func bugExcerpt(body string) string {
	for _, line := range strings.Split(body, "\n") {
		trimmed := strings.TrimSpace(line)
		if trimmed == "" || strings.HasPrefix(trimmed, "#") || strings.HasPrefix(trimmed, "|") || strings.HasPrefix(trimmed, "```") {
			continue
		}
		return truncate(stripMarkdown(trimmed), 140)
	}
	return ""
}

func coalesce(values ...string) string {
	for _, value := range values {
		if value != "" {
			return value
		}
	}
	return ""
}

func lineCount(value string) int {
	if value == "" {
		return 1
	}
	return len(strings.Split(value, "\n"))
}

func isCanonicalBugPath(docPath string) bool {
	parts := strings.Split(docPath, "/")
	if len(parts) != 5 {
		return false
	}
	return parts[0] == ".axm" && parts[1] == "progress" && parts[3] == "bugs" && strings.HasPrefix(parts[4], "bug-") && strings.HasSuffix(parts[4], ".md")
}

func truncate(value string, limit int) string {
	if len(value) <= limit {
		return value
	}
	return value[:limit]
}
