package picker

import (
	"os"
	"os/exec"
	"runtime"
	"strings"

	"github.com/castlexu/axiom/preview/internal/axmfs"
)

func PickTarget(defaultPath string) (string, error) {
	if runtime.GOOS != "darwin" {
		return "", axmfs.NewPreviewError("target_picker_unsupported", "System folder picker is only available on macOS. Use Path instead.", 501)
	}
	script := `POSIX path of (choose folder with prompt "Select an Axiom project folder")`
	if defaultPath != "" {
		if _, err := os.Stat(defaultPath); err == nil {
			script = `POSIX path of (choose folder with prompt "Select an Axiom project folder" default location (POSIX file ` + quoteAppleScript(defaultPath) + `))`
		}
	}
	out, err := exec.Command("osascript", "-e", script).Output()
	if err != nil {
		msg := err.Error()
		if exitErr, ok := err.(*exec.ExitError); ok {
			msg += "\n" + string(exitErr.Stderr)
		}
		if strings.Contains(strings.ToLower(msg), "user canceled") {
			return "", axmfs.NewPreviewError("target_pick_cancelled", "Project selection cancelled.", 400)
		}
		return "", axmfs.NewPreviewError("target_picker_failed", msg, 500)
	}
	return strings.TrimSpace(string(out)), nil
}

func quoteAppleScript(value string) string {
	return `"` + strings.ReplaceAll(value, `"`, `\"`) + `"`
}
