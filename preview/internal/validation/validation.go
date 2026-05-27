package validation

import (
	"fmt"
	"os"
	"path/filepath"
	"regexp"
	"strings"
	"time"

	"github.com/castlexu/axiom/preview/internal/axmfs"
	"github.com/castlexu/axiom/preview/internal/axmmeta"
)

type Issue struct {
	Level   string `json:"level"`
	File    string `json:"file"`
	Line    int    `json:"line,omitempty"`
	RuleRef string `json:"ruleRef"`
	Rule    string `json:"rule"`
	Message string `json:"message"`
}

type Result struct {
	RepoRoot     string       `json:"repoRoot"`
	AxmRoot      string       `json:"axmRoot"`
	Files        []axmfs.File `json:"files"`
	ScannedFiles int          `json:"scannedFiles"`
	Status       string       `json:"status"`
	Errors       int          `json:"errors"`
	Warnings     int          `json:"warnings"`
	Issues       []Issue      `json:"issues"`
}

var (
	validDocState     = set("current", "draft", "deprecated")
	validDepth        = set("overview", "deep")
	validProgressType = set("roadmap", "spec", "decision", "bug")
	bugFileRE         = regexp.MustCompile(`^bug-(\d{4}-\d{2}-\d{2})-[a-z0-9]+(?:-[a-z0-9]+)*\.md$`)
	workflowStates    = map[string]map[string]bool{
		"roadmap":  set("proposed", "ready", "in-progress", "blocked", "implemented", "verified", "closed", "deferred", "superseded"),
		"spec":     set("proposed", "ready", "in-progress", "blocked", "implemented", "verified", "closed", "deferred", "superseded"),
		"decision": set("proposed", "accepted", "rejected", "superseded"),
		"bug":      set("open", "in-progress", "fixed", "verified", "closed", "reopened", "wont-fix", "duplicate"),
	}
)

func Validate(target string) (Result, error) {
	repoRoot, err := filepath.Abs(target)
	if err != nil {
		return Result{}, err
	}
	axmRoot := filepath.Join(repoRoot, ".axm")
	if !axmfs.HasDir(axmRoot) {
		return Result{}, fmt.Errorf(".axm directory does not exist under %s", repoRoot)
	}
	files, err := axmfs.WalkAXM(axmRoot, repoRoot)
	if err != nil {
		return Result{}, err
	}
	result := Result{RepoRoot: repoRoot, AxmRoot: axmRoot, Files: files, ScannedFiles: len(files), Issues: []Issue{}}
	parsedByFile := map[string]axmmeta.Parsed{}
	add := func(level, file, rule, message string) {
		result.Issues = append(result.Issues, Issue{Level: level, File: file, RuleRef: rule, Rule: rule, Message: message})
	}

	for _, file := range files {
		parsed, ok := checkFrontmatter(file, add)
		if ok {
			parsedByFile[file.RelPath] = parsed
		}
	}
	for _, file := range files {
		checkBugContracts(file.RelPath, parsedByFile[file.RelPath].Data, add)
	}
	checkBugDirectoryContracts(repoRoot, add)
	checkIndexSync(files, repoRoot, parsedByFile, add)
	checkCodeRefs(files, repoRoot, parsedByFile, add)
	checkAgentsRefs(repoRoot, add)

	for _, issue := range result.Issues {
		if issue.Level == "error" {
			result.Errors++
		} else if issue.Level == "warn" {
			result.Warnings++
		}
	}
	switch {
	case result.Errors > 0:
		result.Status = "error"
	case result.Warnings > 0:
		result.Status = "warn"
	default:
		result.Status = "pass"
	}
	return result, nil
}

func checkFrontmatter(file axmfs.File, add func(string, string, string, string)) (axmmeta.Parsed, bool) {
	raw, err := os.ReadFile(file.AbsPath)
	if err != nil {
		add("error", file.RelPath, "docs.md §二", "cannot read file: "+err.Error())
		return axmmeta.Parsed{}, false
	}
	parsed, err := axmmeta.Parse(string(raw))
	if err != nil {
		add("error", file.RelPath, "docs.md §二", "axm metadata parse failed: "+err.Error())
		return axmmeta.Parsed{}, false
	}
	if !parsed.HasMeta {
		add("error", file.RelPath, "docs.md §二", "missing axm-meta comment block")
		return parsed, false
	}
	if parsed.MetaKind == "frontmatter" {
		add("warn", file.RelPath, "docs.md §二", "uses legacy YAML frontmatter; prefer <!-- axm-meta -->")
	}
	data := parsed.Data
	checkCommonMeta(file.RelPath, data, add)
	switch file.Kind {
	case axmfs.KindIndex:
		if _, ok := data["entries"].([]any); !ok {
			add("error", file.RelPath, "docs.md §二.C", "index document missing entries list")
		}
	case axmfs.KindUniversal, axmfs.KindProject:
		if list, ok := data["applies-to"].([]any); !ok || len(list) == 0 {
			add("error", file.RelPath, "docs.md §二.A", "spec document missing non-empty applies-to")
		}
	case axmfs.KindKnowledge:
		if depth, _ := data["depth"].(string); !validDepth[depth] {
			add("error", file.RelPath, "docs.md §二.B", "knowledge document depth must be overview/deep")
		}
		if refs, ok := data["code-refs"].([]any); !ok || len(refs) == 0 {
			add("error", file.RelPath, "docs.md §二.B", "knowledge document code-refs must be non-empty")
		}
	case axmfs.KindProgress:
		checkProgressMeta(file.RelPath, data, add)
	}
	return parsed, true
}

func checkCommonMeta(relPath string, data map[string]any, add func(string, string, string, string)) {
	if _, ok := data["status"]; ok {
		add("error", relPath, "docs.md §二", "legacy status field is not supported; use doc-state")
	}
	docState, _ := data["doc-state"].(string)
	if docState == "" {
		add("error", relPath, "docs.md §二", "metadata missing doc-state")
	} else if !validDocState[docState] {
		add("error", relPath, "docs.md §二", "invalid doc-state: "+docState)
	}
	lastReviewed, _ := data["last-reviewed"].(string)
	if lastReviewed == "" {
		add("error", relPath, "docs.md §二", "metadata missing last-reviewed")
	} else if !isDate(lastReviewed) {
		add("error", relPath, "docs.md §三.4", "invalid last-reviewed date: "+lastReviewed)
	}
	if owner, _ := data["owner"].(string); owner == "" {
		add("error", relPath, "docs.md §二", "metadata missing owner")
	}
}

func checkProgressMeta(relPath string, data map[string]any, add func(string, string, string, string)) {
	progressType, _ := data["progress-type"].(string)
	if progressType == "" {
		add("error", relPath, "docs.md §二.D", "progress document missing progress-type")
	} else if !validProgressType[progressType] {
		add("error", relPath, "docs.md §二.D", "invalid progress-type: "+progressType)
	}
	if initiative, _ := data["initiative"].(string); initiative == "" {
		add("error", relPath, "docs.md §二.D", "progress document missing initiative")
	}
	state, _ := data["workflow-state"].(string)
	if state == "" {
		add("error", relPath, "docs.md §二.D", "progress document missing workflow-state")
	}
	updated, _ := data["state-updated"].(string)
	if updated == "" {
		add("error", relPath, "docs.md §二.D", "progress document missing state-updated")
	} else if !isStrictDate(updated) {
		add("error", relPath, "docs.md §二.D", "invalid state-updated date: "+updated)
	}
	workflowType := workflowTypeForProgressDoc(relPath, progressType)
	if state != "" && workflowStates[workflowType] != nil && !workflowStates[workflowType][state] {
		add("error", relPath, "docs.md §二.D", "invalid workflow-state: "+state)
	}
}

func checkIndexSync(files []axmfs.File, repoRoot string, parsedByFile map[string]axmmeta.Parsed, add func(string, string, string, string)) {
	for _, file := range files {
		if file.Kind != axmfs.KindIndex {
			continue
		}
		entries, _ := parsedByFile[file.RelPath].Data["entries"].([]any)
		declared := map[string]bool{}
		for _, raw := range entries {
			entry, ok := raw.(map[string]any)
			if !ok {
				add("error", file.RelPath, "docs.md §二.C", "entries item is not an object")
				continue
			}
			for _, key := range []string{"path", "title", "when-to-read"} {
				if value, _ := entry[key].(string); value == "" {
					add("error", file.RelPath, "docs.md §二.C", "entries item missing "+key)
				}
			}
			if pathValue, _ := entry["path"].(string); pathValue != "" {
				declared[pathValue] = true
			}
		}

		entriesOnDisk, err := os.ReadDir(filepath.Dir(file.AbsPath))
		if err != nil {
			continue
		}
		actual := map[string]bool{}
		for _, entry := range entriesOnDisk {
			if entry.IsDir() {
				actual[entry.Name()+"/"] = true
				continue
			}
			if axmfs.IsAXMDocName(entry.Name()) && !axmfs.IsIndexDocName(entry.Name()) {
				actual[entry.Name()] = true
			}
		}
		for item := range declared {
			if !actual[item] {
				add("error", file.RelPath, "docs.md §六", "entries references missing child: "+item)
			}
		}
		for item := range actual {
			if !declared[item] {
				add("warn", file.RelPath, "docs.md §六", "orphan child is not registered in entries: "+item)
			}
		}
	}
}

func checkCodeRefs(files []axmfs.File, repoRoot string, parsedByFile map[string]axmmeta.Parsed, add func(string, string, string, string)) {
	for _, file := range files {
		if file.Kind != axmfs.KindKnowledge {
			continue
		}
		refs, _ := parsedByFile[file.RelPath].Data["code-refs"].([]any)
		for _, rawRef := range refs {
			ref, ok := rawRef.(string)
			if !ok || ref == "" {
				continue
			}
			full := filepath.Join(repoRoot, ref)
			info, err := os.Stat(full)
			if err != nil {
				add("error", file.RelPath, "docs.md §二.B", "code-refs target does not exist: "+ref)
			} else if info.IsDir() {
				add("warn", file.RelPath, "docs.md §二.B", "code-refs target is a directory: "+ref)
			}
		}
	}
}

func checkAgentsRefs(repoRoot string, add func(string, string, string, string)) {
	raw, err := os.ReadFile(filepath.Join(repoRoot, "AGENTS.md"))
	if err != nil {
		add("warn", "AGENTS.md", "docs.md §五", "AGENTS.md does not exist")
		return
	}
	text := string(raw)
	start := regexp.MustCompile(`(?m)^##\s+Knowledge Index\s*$`).FindStringIndex(text)
	if start == nil {
		add("warn", "AGENTS.md", "docs.md §五", "Knowledge Index section not found")
		return
	}
	section := text[start[1]:]
	if next := regexp.MustCompile(`(?m)^##\s+`).FindStringIndex(section); next != nil {
		section = section[:next[0]]
	}
	refRE := regexp.MustCompile("`(\\.axm/[^`\\s<>]+\\.(?:md|mdc)(?:#[^`\\s<>]+)?)`")
	seen := map[string]bool{}
	for _, match := range refRE.FindAllStringSubmatch(section, -1) {
		rel := strings.Split(match[1], "#")[0]
		if seen[rel] {
			continue
		}
		seen[rel] = true
		if _, err := os.Stat(filepath.Join(repoRoot, filepath.FromSlash(rel))); err != nil {
			add("error", "AGENTS.md", "docs.md §五", "Knowledge Index references missing path: "+rel)
		}
	}
}

func checkBugContracts(relPath string, data map[string]any, add func(string, string, string, string)) {
	info := bugPathInfo(relPath)
	if info.kind == "" {
		if isBugDocOutsideBugs(relPath, data) {
			add("error", relPath, "bug-doc-guide.md §0.1", "BUG docs must live under progress/<initiative>/bugs/")
		}
		return
	}
	switch info.kind {
	case "top-level":
		add("error", relPath, "bug-doc-guide.md §0.1", "top-level progress/bugs/ is not allowed")
	case "nested-bug":
		add("error", relPath, "bug-doc-guide.md §0.1", "nested BUG subdirectories are not allowed")
	case "initiative-bug":
		if axmfs.IsIndexDocName(info.name) {
			return
		}
		if info.name == "log.md" {
			if progressType, _ := data["progress-type"].(string); progressType != "roadmap" {
				add("error", relPath, "bug-doc-guide.md §0.3", "bugs/log.md must use progress-type: roadmap")
			}
			return
		}
		if !isBugFileName(info.name) {
			add("error", relPath, "bug-doc-guide.md §0.3", "BUG file name must match bug-YYYY-MM-DD-<slug>.md")
		}
		if progressType, _ := data["progress-type"].(string); progressType != "bug" {
			add("error", relPath, "bug-doc-guide.md §0.3", "single BUG docs must use progress-type: bug")
		}
		if initiative, _ := data["initiative"].(string); initiative == "bugs" {
			add("error", relPath, "bug-doc-guide.md §0.2", "single BUG docs must not use initiative: bugs")
		} else if initiative != "" && initiative != info.initiative {
			add("error", relPath, "bug-doc-guide.md §0.2", "BUG initiative must match path initiative "+info.initiative)
		}
	}
}

func checkBugDirectoryContracts(repoRoot string, add func(string, string, string, string)) {
	progressRoot := filepath.Join(repoRoot, ".axm", "progress")
	if !axmfs.HasDir(progressRoot) {
		return
	}
	if axmfs.HasDir(filepath.Join(progressRoot, "bugs")) {
		add("error", ".axm/progress/bugs/", "bug-doc-guide.md §0.1", "top-level progress/bugs/ is not allowed")
	}
	entries, err := os.ReadDir(progressRoot)
	if err != nil {
		return
	}
	for _, entry := range entries {
		if !entry.IsDir() || entry.Name() == "bugs" {
			continue
		}
		bugsRoot := filepath.Join(progressRoot, entry.Name(), "bugs")
		if !axmfs.HasDir(bugsRoot) {
			continue
		}
		children, err := os.ReadDir(bugsRoot)
		if err != nil {
			continue
		}
		for _, child := range children {
			if child.IsDir() {
				add("error", axmfs.NormalizePath(filepath.Join(".axm", "progress", entry.Name(), "bugs", child.Name()))+"/", "bug-doc-guide.md §0.1", "nested BUG subdirectories are not allowed")
			}
		}
	}
}

type bugInfo struct {
	kind       string
	initiative string
	name       string
}

func bugPathInfo(relPath string) bugInfo {
	parts := strings.Split(axmfs.NormalizePath(relPath), "/")
	if len(parts) < 3 || parts[0] != ".axm" || parts[1] != "progress" {
		return bugInfo{}
	}
	if parts[2] == "bugs" {
		return bugInfo{kind: "top-level"}
	}
	if len(parts) >= 5 && parts[3] == "bugs" {
		if len(parts) != 5 {
			return bugInfo{kind: "nested-bug", initiative: parts[2], name: parts[len(parts)-1]}
		}
		return bugInfo{kind: "initiative-bug", initiative: parts[2], name: parts[4]}
	}
	return bugInfo{}
}

func workflowTypeForProgressDoc(relPath, progressType string) string {
	info := bugPathInfo(relPath)
	if info.kind == "initiative-bug" {
		if info.name == "log.md" {
			return "roadmap"
		}
		if !axmfs.IsIndexDocName(info.name) {
			return "bug"
		}
	}
	return progressType
}

func isBugDocOutsideBugs(relPath string, data map[string]any) bool {
	parts := strings.Split(axmfs.NormalizePath(relPath), "/")
	if len(parts) < 3 || parts[0] != ".axm" || parts[1] != "progress" {
		return false
	}
	name := parts[len(parts)-1]
	if axmfs.IsIndexDocName(name) {
		return false
	}
	progressType, _ := data["progress-type"].(string)
	return progressType == "bug" || isBugFileName(name)
}

func isBugFileName(name string) bool {
	match := bugFileRE.FindStringSubmatch(name)
	return len(match) == 2 && isStrictDate(match[1])
}

func isDate(value string) bool {
	if !regexp.MustCompile(`^\d{4}-\d{2}-\d{2}$`).MatchString(value) {
		return false
	}
	_, err := time.Parse("2006-01-02", value)
	return err == nil
}

func isStrictDate(value string) bool {
	return isDate(value)
}

func set(values ...string) map[string]bool {
	out := make(map[string]bool, len(values))
	for _, value := range values {
		out[value] = true
	}
	return out
}
