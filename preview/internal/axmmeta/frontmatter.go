package axmmeta

import (
	"fmt"
	"strings"
)

type Parsed struct {
	Data           map[string]any
	Body           string
	HasFrontmatter bool
	HasMeta        bool
	MetaKind       string
}

const (
	frontmatterDelim = "---"
	metaStart        = "<!-- axm-meta"
	metaEnd          = "-->"
)

func Parse(raw string) (Parsed, error) {
	lines := splitLines(raw)
	if len(lines) == 0 {
		return Parsed{Data: map[string]any{}, Body: raw}, nil
	}
	first := strings.TrimSpace(lines[0])
	if first == metaStart {
		end := -1
		for i := 1; i < len(lines); i++ {
			if strings.TrimSpace(lines[i]) == metaEnd {
				end = i
				break
			}
		}
		if end == -1 {
			return Parsed{}, fmt.Errorf("axm-meta: missing closing delimiter -->")
		}
		data, err := parseYAMLSubset(lines[1:end])
		if err != nil {
			return Parsed{}, err
		}
		bodyLines := append([]string(nil), lines[end+1:]...)
		if len(bodyLines) > 0 && bodyLines[0] == "" {
			bodyLines = bodyLines[1:]
		}
		return Parsed{Data: data, Body: strings.Join(bodyLines, "\n"), HasFrontmatter: true, HasMeta: true, MetaKind: "comment"}, nil
	}
	if first != frontmatterDelim {
		return Parsed{Data: map[string]any{}, Body: raw}, nil
	}
	end := -1
	for i := 1; i < len(lines); i++ {
		if strings.TrimSpace(lines[i]) == frontmatterDelim {
			end = i
			break
		}
	}
	if end == -1 {
		return Parsed{}, fmt.Errorf("frontmatter: missing closing delimiter ---")
	}
	data, err := parseYAMLSubset(lines[1:end])
	if err != nil {
		return Parsed{}, err
	}
	bodyLines := append([]string(nil), lines[end+1:]...)
	if len(bodyLines) > 0 && bodyLines[0] == "" {
		bodyLines = bodyLines[1:]
	}
	return Parsed{Data: data, Body: strings.Join(bodyLines, "\n"), HasFrontmatter: true, HasMeta: true, MetaKind: "frontmatter"}, nil
}

func parseYAMLSubset(lines []string) (map[string]any, error) {
	out := map[string]any{}
	for i := 0; i < len(lines); {
		line := lines[i]
		trimmed := strings.TrimSpace(line)
		if trimmed == "" || strings.HasPrefix(trimmed, "#") {
			i++
			continue
		}
		if len(line) > 0 && (line[0] == ' ' || line[0] == '\t') {
			return nil, fmt.Errorf("frontmatter: cannot parse line %q", line)
		}
		key, rest, ok := strings.Cut(line, ":")
		if !ok || key == "" {
			return nil, fmt.Errorf("frontmatter: cannot parse line %q", line)
		}
		key = strings.TrimSpace(key)
		rest = strings.TrimSpace(rest)
		if rest == "" {
			list, consumed, err := parseBlockList(lines[i+1:])
			if err != nil {
				return nil, err
			}
			out[key] = list
			i += 1 + consumed
			continue
		}
		if strings.HasPrefix(rest, "[") && strings.HasSuffix(rest, "]") {
			out[key] = parseInlineList(rest)
		} else {
			out[key] = parseScalar(rest)
		}
		i++
	}
	return out, nil
}

func parseBlockList(lines []string) ([]any, int, error) {
	var items []any
	consumed := 0
	indent := -1
	var current map[string]any
	for consumed < len(lines) {
		line := lines[consumed]
		if strings.TrimSpace(line) == "" {
			consumed++
			continue
		}
		if len(line) > 0 && line[0] != ' ' && line[0] != '\t' {
			break
		}
		prefixLen := len(line) - len(strings.TrimLeft(line, " \t"))
		trimmed := strings.TrimSpace(line)
		if strings.HasPrefix(trimmed, "- ") {
			if indent == -1 {
				indent = prefixLen
			} else if prefixLen != indent {
				return nil, consumed, fmt.Errorf("frontmatter: inconsistent list indentation %q", line)
			}
			payload := strings.TrimSpace(strings.TrimPrefix(trimmed, "- "))
			if key, rest, ok := strings.Cut(payload, ":"); ok && strings.TrimSpace(rest) != "" {
				current = map[string]any{strings.TrimSpace(key): parseScalar(strings.TrimSpace(rest))}
				items = append(items, current)
			} else {
				current = nil
				items = append(items, parseScalar(payload))
			}
			consumed++
			continue
		}
		if current != nil && indent >= 0 && prefixLen > indent {
			key, rest, ok := strings.Cut(strings.TrimSpace(line), ":")
			if ok && strings.TrimSpace(rest) != "" {
				current[strings.TrimSpace(key)] = parseScalar(strings.TrimSpace(rest))
				consumed++
				continue
			}
		}
		break
	}
	return items, consumed, nil
}

func parseInlineList(value string) []any {
	inner := strings.TrimSpace(strings.TrimSuffix(strings.TrimPrefix(value, "["), "]"))
	if inner == "" {
		return []any{}
	}
	parts := strings.Split(inner, ",")
	out := make([]any, 0, len(parts))
	for _, part := range parts {
		out = append(out, parseScalar(strings.TrimSpace(part)))
	}
	return out
}

func parseScalar(raw string) any {
	s := strings.TrimSpace(raw)
	if s == "true" {
		return true
	}
	if s == "false" {
		return false
	}
	if s == "null" || s == "~" {
		return nil
	}
	if len(s) >= 2 {
		if (s[0] == '"' && s[len(s)-1] == '"') || (s[0] == '\'' && s[len(s)-1] == '\'') {
			return s[1 : len(s)-1]
		}
	}
	return s
}

func splitLines(raw string) []string {
	return strings.Split(strings.ReplaceAll(raw, "\r\n", "\n"), "\n")
}
