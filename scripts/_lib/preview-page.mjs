const ICON_PATHS = {
	box: '<path d="m21 16-9 5-9-5V8l9-5 9 5v8Z"></path><path d="m3.3 7 8.7 5 8.7-5"></path><path d="M12 22V12"></path>',
	search: '<path d="m21 21-4.3-4.3"></path><circle cx="11" cy="11" r="8"></circle>',
	terminal: '<path d="m4 17 6-6-6-6"></path><path d="M12 19h8"></path>',
	settings: '<path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"></path><path d="M19.4 15a7.8 7.8 0 0 0 .1-1 7.8 7.8 0 0 0-.1-1l2-1.5-2-3.4-2.4 1a7.6 7.6 0 0 0-1.7-1L15 5.5h-4l-.4 2.6a7.6 7.6 0 0 0-1.7 1l-2.4-1-2 3.4 2 1.5a7.8 7.8 0 0 0-.1 1c0 .3 0 .7.1 1l-2 1.5 2 3.4 2.4-1c.5.4 1.1.7 1.7 1l.4 2.6h4l.4-2.6c.6-.2 1.2-.6 1.7-1l2.4 1 2-3.4-2.1-1.5Z"></path>',
	file: '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"></path><path d="M14 2v4a2 2 0 0 0 2 2h4"></path>',
	"file-text": '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"></path><path d="M14 2v4a2 2 0 0 0 2 2h4"></path><path d="M10 9H8"></path><path d="M16 13H8"></path><path d="M16 17H8"></path>',
	folder: '<path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.7-.9L9.6 4A2 2 0 0 0 7.9 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"></path>',
	"chevron-down": '<path d="m6 9 6 6 6-6"></path>',
	"chevron-right": '<path d="m9 18 6-6-6-6"></path>',
	"zoom-in": '<circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path><path d="M11 8v6"></path><path d="M8 11h6"></path>',
	"zoom-out": '<circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path><path d="M8 11h6"></path>',
	list: '<path d="M8 6h13"></path><path d="M8 12h13"></path><path d="M8 18h13"></path><path d="M3 6h.01"></path><path d="M3 12h.01"></path><path d="M3 18h.01"></path>',
	scan: '<path d="M3 7V5a2 2 0 0 1 2-2h2"></path><path d="M17 3h2a2 2 0 0 1 2 2v2"></path><path d="M21 17v2a2 2 0 0 1-2 2h-2"></path><path d="M7 21H5a2 2 0 0 1-2-2v-2"></path><path d="M7 12h10"></path>',
	"refresh-cw": '<path d="M3 12a9 9 0 0 1 15.1-6.6L21 8"></path><path d="M21 3v5h-5"></path><path d="M21 12a9 9 0 0 1-15.1 6.6L3 16"></path><path d="M3 21v-5h5"></path>',
	check: '<path d="M20 6 9 17l-5-5"></path>',
	"triangle-alert": '<path d="m21.7 18-8-14a2 2 0 0 0-3.4 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.7-3Z"></path><path d="M12 9v4"></path><path d="M12 17h.01"></path>',
	"circle-alert": '<circle cx="12" cy="12" r="10"></circle><path d="M12 8v4"></path><path d="M12 16h.01"></path>',
	layers: '<path d="m12.8 2.3 8.4 4.2a1 1 0 0 1 0 1.8l-8.4 4.2a2 2 0 0 1-1.8 0L2.6 8.3a1 1 0 0 1 0-1.8L11 2.3a2 2 0 0 1 1.8 0Z"></path><path d="m22 12-9.2 4.6a2 2 0 0 1-1.8 0L2 12"></path><path d="m22 17-9.2 4.6a2 2 0 0 1-1.8 0L2 17"></path>',
};

function icon(name, size = 16, className = "") {
	const paths = ICON_PATHS[name] ?? ICON_PATHS.file;
	const classes = `${className} lucide lucide-${name}`.trim();
	return `<svg class="${classes}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${paths}</svg>`;
}

export function buildPreviewHtml() {
	return `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Axiom Preview</title>
<style>
:root {
	color-scheme: light;
	--bg: #ffffff;
	--panel: #fbfcfe;
	--panel-strong: #f6f8fb;
	--text: #1d2430;
	--muted: #647184;
	--faint: #8a95a6;
	--border: #dce2ea;
	--border-strong: #c9d4e4;
	--accent: #1d6fe8;
	--accent-soft: #e8f1ff;
	--purple: #8055d6;
	--green: #22a05d;
	--yellow: #d89a0b;
	--red: #d93f4b;
	--shadow: 0 16px 48px rgba(31, 45, 61, .12);
	--content-head-height: 48px;
	--inspector-min-width: 380px;
	--inspector-width: clamp(380px, 32vw, 520px);
}
* { box-sizing: border-box; }
html, body { height: 100%; }
body {
	margin: 0;
	background: var(--bg);
	color: var(--text);
	font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
	font-size: 14px;
	letter-spacing: 0;
	overflow: hidden;
}
button, input { font: inherit; }
button { border: 0; background: transparent; color: inherit; cursor: pointer; }
.app { height: 100vh; display: grid; grid-template-rows: 56px 1fr; }
.topbar {
	display: grid;
	grid-template-columns: 280px minmax(220px, 360px) minmax(260px, 1fr) auto;
	align-items: center;
	gap: 14px;
	height: 56px;
	padding: 0 16px;
	border-bottom: 1px solid var(--border);
	background: rgba(255,255,255,.96);
	backdrop-filter: blur(12px);
}
.brand { display: flex; align-items: center; gap: 12px; min-width: 0; }
.brand-icon { color: #174ea6; flex: 0 0 auto; }
.brand-title { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 18px; font-weight: 720; line-height: 1; }
.projectbar {
	justify-self: start;
	display: inline-flex;
	align-items: center;
	gap: 8px;
	min-width: 0;
	width: 100%;
	max-width: 430px;
	height: 32px;
	padding: 0 6px 0 10px;
	border: 1px solid #b9d2f7;
	border-radius: 6px;
	background: #eef6ff;
	color: #26374d;
	font-size: 12px;
	overflow: hidden;
}
.project-current {
	min-width: 0;
	flex: 1 1 auto;
	height: 100%;
	display: inline-flex;
	align-items: center;
	gap: 8px;
	padding: 0 8px 0 0;
	border-radius: 5px;
	color: #26374d;
}
.project-current:hover, .project-current[aria-expanded="true"] { background: #dfeeff; }
.project-current .lucide-folder { flex: 0 0 auto; color: #174ea6; }
.project-name {
	min-width: 0;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
	font-size: 13px;
	font-weight: 620;
	text-align: left;
}
.project-chevron { flex: 0 0 auto; color: #68778a; }
.project-current[aria-expanded="true"] .project-chevron { transform: rotate(180deg); }
.project-popover {
	position: fixed;
	top: var(--project-menu-top, 52px);
	left: var(--project-menu-left, 16px);
	width: var(--project-menu-width, 360px);
	display: none;
	overflow: hidden;
	border: 1px solid var(--border);
	border-radius: 9px;
	background: #fff;
	box-shadow: var(--shadow);
	z-index: 30;
}
.project-popover.open { display: block; }
.project-option {
	width: 100%;
	display: grid;
	grid-template-columns: minmax(0, 1fr);
	gap: 2px;
	padding: 9px 12px;
	text-align: left;
}
.project-option:hover, .project-option.active { background: var(--accent-soft); }
.project-option-title { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 13px; font-weight: 680; color: #263244; }
.project-option-path { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 11px; color: var(--muted); }
.project-popover-empty, .project-popover-error { padding: 12px; color: var(--muted); font-size: 12px; }
.project-popover-error { color: var(--red); border-top: 1px solid var(--border); }
.path-backdrop {
	position: fixed;
	inset: 0;
	display: none;
	align-items: flex-start;
	justify-content: center;
	padding-top: 92px;
	background: rgba(29, 36, 48, .24);
	z-index: 40;
}
.path-backdrop.open { display: flex; }
.path-dialog {
	width: min(560px, calc(100vw - 32px));
	border: 1px solid var(--border);
	border-radius: 10px;
	background: #fff;
	box-shadow: var(--shadow);
}
.path-dialog-head {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 12px;
	padding: 14px 16px 8px;
}
.path-dialog-title { font-size: 14px; font-weight: 720; color: #263244; }
.path-close { width: 28px; height: 28px; border-radius: 6px; color: #68778a; }
.path-close:hover { background: #f2f6fb; color: #263244; }
.path-dialog-body { padding: 0 16px 16px; }
.path-input {
	width: 100%;
	height: 38px;
	padding: 0 11px;
	border: 1px solid var(--border-strong);
	border-radius: 7px;
	outline: 0;
	color: #263244;
}
.path-input:focus { border-color: #9ec2ff; box-shadow: 0 0 0 3px rgba(29,111,232,.12); }
.path-error { min-height: 18px; margin-top: 8px; color: var(--red); font-size: 12px; }
.path-dialog-actions {
	display: flex;
	justify-content: flex-end;
	gap: 8px;
	padding: 0 16px 16px;
}
.path-secondary, .path-primary {
	height: 30px;
	padding: 0 12px;
	border-radius: 6px;
	font-size: 12px;
	font-weight: 650;
}
.path-secondary { color: #566274; background: #f2f6fb; }
.path-primary { color: #fff; background: var(--accent); }
.path-primary[disabled], .path-secondary[disabled] { opacity: .65; cursor: wait; }
.bug-backdrop {
	position: fixed;
	inset: 0;
	display: none;
	align-items: flex-start;
	justify-content: center;
	padding: 76px 16px 24px;
	background: rgba(29, 36, 48, .24);
	z-index: 42;
}
.bug-backdrop.open { display: flex; }
.bug-dialog {
	width: min(860px, calc(100vw - 32px));
	max-height: min(720px, calc(100vh - 100px));
	display: grid;
	grid-template-rows: auto auto minmax(0, 1fr);
	border: 1px solid var(--border);
	border-radius: 10px;
	background: #fff;
	box-shadow: var(--shadow);
	overflow: hidden;
}
.bug-dialog-sub { margin-top: 3px; color: var(--muted); font-size: 12px; font-weight: 500; }
.bug-toolbar {
	display: grid;
	grid-template-columns: minmax(220px, 1fr) auto;
	gap: 12px;
	align-items: center;
	padding: 8px 16px 12px;
	border-bottom: 1px solid var(--border);
}
.bug-search {
	height: 34px;
	display: flex;
	align-items: center;
	border: 1px solid var(--border-strong);
	border-radius: 7px;
	background: #fff;
	color: #68778a;
}
.bug-search svg { margin-left: 10px; flex: 0 0 auto; }
.bug-search input {
	width: 100%;
	height: 100%;
	min-width: 0;
	border: 0;
	outline: 0;
	padding: 0 10px;
	background: transparent;
	color: #263244;
	font-size: 13px;
}
.bug-search:focus-within { border-color: #9ec2ff; box-shadow: 0 0 0 3px rgba(29,111,232,.12); }
.bug-filters { display: inline-flex; align-items: center; gap: 6px; justify-content: flex-end; }
.bug-filters button {
	height: 30px;
	padding: 0 10px;
	border: 1px solid var(--border);
	border-radius: 6px;
	background: #fff;
	color: #566274;
	font-size: 12px;
	font-weight: 650;
	white-space: nowrap;
}
.bug-filters button[aria-pressed="true"] { border-color: #b9d2f7; background: var(--accent-soft); color: #174ea6; }
.bug-list { min-height: 0; overflow: auto; padding: 10px; background: #fbfcfe; }
.bug-item {
	width: 100%;
	display: grid;
	grid-template-columns: minmax(0, 1fr) auto;
	gap: 12px;
	padding: 12px;
	border: 1px solid var(--border);
	border-radius: 8px;
	background: #fff;
	text-align: left;
}
.bug-item + .bug-item { margin-top: 8px; }
.bug-item:hover { border-color: #b9d2f7; background: #f7faff; }
.bug-title { min-width: 0; color: #1f2937; font-size: 13px; font-weight: 720; line-height: 1.35; overflow-wrap: anywhere; }
.bug-path { margin-top: 4px; color: var(--muted); font-size: 11px; overflow-wrap: anywhere; }
.bug-excerpt { margin-top: 8px; color: #465365; font-size: 12px; line-height: 1.5; }
.bug-meta { display: flex; flex-wrap: wrap; gap: 6px; justify-content: flex-end; align-content: start; max-width: 260px; }
.bug-empty { padding: 28px 16px; color: var(--muted); font-size: 13px; text-align: center; }
.project-action {
	height: 24px;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	padding: 0 8px;
	border-radius: 5px;
	background: #fff;
	color: #174ea6;
	font-size: 12px;
	font-weight: 650;
	flex: 0 0 auto;
}
.project-action:hover { background: #f7faff; }
.project-action[disabled], .project-current[disabled] { opacity: .6; cursor: wait; }
.searchbox {
	position: relative;
	min-width: 0;
	height: 36px;
	display: flex;
	align-items: center;
	border: 1px solid var(--border);
	border-radius: 7px;
	background: #fff;
}
.searchbox svg { margin-left: 11px; color: #697789; }
.searchbox input {
	width: 100%;
	height: 100%;
	border: 0;
	outline: 0;
	padding: 0 54px 0 10px;
	background: transparent;
	color: var(--text);
}
.kbd {
	position: absolute;
	right: 8px;
	top: 7px;
	height: 20px;
	min-width: 34px;
	border: 1px solid var(--border);
	border-radius: 5px;
	background: var(--panel-strong);
	color: var(--muted);
	font-size: 11px;
	line-height: 18px;
	text-align: center;
}
.stats { display: flex; align-items: center; gap: 10px; justify-content: end; }
.stat {
	height: 32px;
	display: inline-flex;
	align-items: center;
	gap: 8px;
	padding: 0 14px;
	border: 1px solid var(--border);
	border-radius: 7px;
	background: #fff;
	white-space: nowrap;
}
.stat-button { color: #263244; }
.stat-button:hover, .stat-button[aria-expanded="true"] { border-color: #b9d2f7; background: #f7faff; }
.stat-button[disabled] { opacity: .55; cursor: default; }
.stat-dot { width: 9px; height: 9px; border-radius: 999px; background: var(--accent); }
.stat-dot.ok { background: var(--green); }
.stat-dot.warn { background: var(--yellow); }
.stat-dot.err { background: var(--red); }
.stat-dot.bug { background: var(--purple); }
.icon-btn {
	width: 34px;
	height: 34px;
	display: inline-grid;
	place-items: center;
	border: 1px solid var(--border);
	border-radius: 7px;
	background: #fff;
	color: #566274;
}
.icon-btn .lucide { display: block; }
.icon-btn:hover { border-color: var(--border-strong); background: #f7faff; color: #26374d; }
.shell {
	min-height: 0;
	display: grid;
	grid-template-columns: minmax(240px, 280px) minmax(0, 1fr);
	grid-template-rows: minmax(0, 1fr);
	padding-bottom: 56px;
}
.sidebar {
	grid-row: 1;
	border-right: 1px solid var(--border);
	background: var(--panel);
	min-width: 0;
	display: grid;
	grid-template-rows: var(--content-head-height) 1fr 44px;
}
.side-head, .side-foot {
	min-width: 0;
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 0 18px;
	border-bottom: 1px solid var(--border);
	overflow: hidden;
}
.side-head strong { display: block; min-width: 0; max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 16px; }
.tree { min-width: 0; max-width: 100%; min-height: 0; overflow-y: auto; overflow-x: hidden; padding: 8px 8px 18px; }
.tree-row {
	position: relative;
	width: 100%;
	max-width: 100%;
	display: grid;
	grid-template-columns: 16px 16px minmax(0, 1fr);
	align-items: center;
	min-height: 26px;
	gap: 4px;
	padding: 1px 8px 1px var(--tree-indent, 6px);
	border-radius: 5px;
	color: #2f3a4a;
	text-align: left;
	overflow: hidden;
}
.tree-row.dir { font-weight: 500; }
.tree-row:hover { background: #edf2f8; }
.tree-row.active:hover { background: transparent; }
.tree-row.active .tree-name { color: var(--accent); }
.tree-row.hidden { display: none; }
.tree-disclosure, .tree-icon { width: 16px; height: 16px; color: #68778a; display: inline-grid; place-items: center; flex: 0 0 auto; }
.tree-disclosure.placeholder { opacity: 0; }
.tree-name { display: block; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 13px; line-height: 20px; padding: 1px 0; }
.tree-row.dir .tree-name { color: #263244; }
.workspace {
	min-width: 0;
	min-height: 0;
	display: grid;
	grid-template-rows: minmax(0, 1fr);
}
.doc-pane {
	min-width: 0;
	min-height: 0;
	display: grid;
	grid-template-columns: minmax(0, 1fr) minmax(var(--inspector-min-width), var(--inspector-width));
	border-bottom: 1px solid var(--border);
}
.reader {
	min-width: 0;
	min-height: 0;
	display: grid;
	grid-template-rows: var(--content-head-height) minmax(0, 1fr);
	background: #fff;
}
.crumbs {
	display: flex;
	align-items: center;
	gap: 9px;
	padding: 0 22px;
	border-bottom: 1px solid var(--border);
	color: var(--muted);
	font-size: 12px;
	overflow: hidden;
	white-space: nowrap;
}
.crumbs strong { color: var(--accent); font-weight: 650; }
.line-count { margin-left: auto; color: #566274; }
.markdown-scroll { min-height: 0; overflow: auto; }
.markdown {
	max-width: 860px;
	padding: 26px 28px 96px;
	color: #202938;
	line-height: 1.68;
	overflow-wrap: anywhere;
}
.markdown h1 { margin: 0 0 16px; font-size: 32px; line-height: 1.18; font-weight: 760; color: #111827; }
.markdown h2 { margin: 30px 0 12px; font-size: 24px; line-height: 1.25; color: #111827; }
.markdown h3 { margin: 24px 0 10px; font-size: 18px; line-height: 1.35; color: #111827; }
.markdown p { margin: 0 0 14px; }
.markdown a { color: var(--accent); text-decoration: none; }
.markdown code {
	font-family: SFMono-Regular, Menlo, Consolas, monospace;
	background: #f2f6fb;
	border: 1px solid #e1e8f0;
	border-radius: 5px;
	padding: 2px 5px;
	color: #174ea6;
	font-size: .92em;
}
.markdown pre {
	margin: 16px 0;
	padding: 14px;
	overflow: auto;
	background: #f7f9fc;
	border: 1px solid var(--border);
	border-radius: 7px;
}
.markdown pre code { padding: 0; border: 0; background: transparent; color: #26374d; }
.markdown-table-scroll { max-width: 100%; overflow-x: auto; margin: 16px 0; }
.markdown table { width: max-content; min-width: 100%; border-collapse: collapse; font-size: 13px; }
.markdown th, .markdown td { border: 1px solid var(--border); padding: 9px 10px; vertical-align: top; overflow-wrap: normal; word-break: normal; }
.markdown th { background: #f6f8fb; font-weight: 650; }
.markdown td code, .markdown th code { white-space: nowrap; overflow-wrap: normal; word-break: normal; }
.markdown blockquote { margin: 16px 0; padding: 0 0 0 14px; border-left: 3px solid var(--border-strong); color: #4d5a69; }
.markdown ul, .markdown ol { padding-left: 22px; }
.markdown :where(p, li, blockquote, a, code) { overflow-wrap: anywhere; }
.hit { background: #fff1b8; border-radius: 3px; }
.inspector {
	min-width: 0;
	min-height: 0;
	border-left: 1px solid var(--border);
	background: var(--panel);
	overflow: auto;
	padding: 14px;
}
.panel {
	border: 1px solid var(--border);
	border-radius: 8px;
	background: #fff;
	margin-bottom: 14px;
	overflow: hidden;
}
.panel-title {
	display: flex;
	align-items: center;
	justify-content: space-between;
	min-height: 42px;
	padding: 0 14px;
	border-bottom: 1px solid var(--border);
	font-weight: 700;
	gap: 12px;
}
.panel-title > * { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.panel-title-actions { display: inline-flex; align-items: center; gap: 6px; flex: 0 0 auto; overflow: visible; }
.panel-title-actions .chip { margin-right: 0; }
.refresh-btn {
	width: 24px;
	height: 24px;
	display: inline-grid;
	place-items: center;
	border: 0;
	border-radius: 5px;
	background: transparent;
	color: #566274;
	padding: 0;
}
.refresh-btn:hover { background: #f2f6fb; color: #26374d; }
.refresh-btn[disabled] { opacity: .55; cursor: wait; }
.refresh-btn[aria-busy="true"] svg { animation: spin 900ms linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.meta-table { width: 100%; table-layout: auto; border-collapse: collapse; font-size: 13px; }
.meta-table th, .meta-table td { border-bottom: 1px solid var(--border); padding: 9px 14px; text-align: left; vertical-align: top; }
.meta-table th { width: 1%; color: #536173; font-weight: 520; white-space: nowrap; overflow-wrap: normal; word-break: normal; background: #fbfcfe; }
.meta-table td { min-width: 0; overflow-wrap: anywhere; }
.chip {
	display: inline-flex;
	align-items: center;
	min-height: 22px;
	padding: 1px 7px;
	border-radius: 5px;
	border: 1px solid #cfd8e6;
	background: #fff;
	color: #26374d;
	font-size: 12px;
	margin: 1px 4px 1px 0;
	max-width: 100%;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}
.chip.current, .chip.implemented, .chip.fixed, .chip.accepted, .chip.pass { border-color: #8ad7aa; background: #eafaf1; color: #10713d; }
.chip.verified { border-color: #87d6d2; background: #e8fbfa; color: #08716d; }
.chip.closed, .chip.unknown { border-color: #cfd8e6; background: #f6f8fb; color: #536173; }
.chip.draft, .chip.proposed, .chip.ready, .chip.open { border-color: #a9c8ff; background: #edf5ff; color: #174ea6; }
.chip.in-progress, .chip.warn { border-color: #f0ce77; background: #fff7dc; color: #9a6800; }
.chip.deprecated, .chip.deferred, .chip.superseded, .chip.duplicate { border-color: #c7b4f4; background: #f4efff; color: #6740bd; }
.chip.missing, .chip.blocked, .chip.reopened, .chip.rejected, .chip.wont-fix, .chip.error { border-color: #f0a3a8; background: #fff0f1; color: #b22230; }
.chip.state-date { border-color: #b9d2f7; background: #f4f8ff; color: #315173; }
.chip.linkish { color: var(--accent); border-color: #b9d2f7; background: #f4f8ff; cursor: pointer; }
.validate-card { padding: 14px; }
.validate-row { display: grid; grid-template-columns: 20px 1fr; gap: 11px; align-items: start; padding: 8px 0; }
.validate-row > div { min-width: 0; overflow: hidden; }
.validate-icon { width: 20px; height: 20px; border-radius: 999px; display: grid; place-items: center; color: #fff; font-size: 12px; background: var(--green); }
.validate-icon.warn { background: var(--yellow); }
.validate-icon.err { background: var(--red); }
.validate-section-title { margin: 12px 0 4px; color: #536173; font-size: 11px; font-weight: 700; text-transform: uppercase; }
.validate-title { font-weight: 650; }
.validate-sub { color: var(--muted); font-size: 12px; margin-top: 5px; line-height: 1.45; }
.graph-drawer {
	position: fixed;
	left: 0;
	right: 0;
	bottom: 0;
	top: 56px;
	z-index: 18;
	height: auto;
	min-height: 0;
	background: #fff;
	display: grid;
	grid-template-rows: 56px minmax(0, 1fr);
	border-top: 1px solid var(--border);
	box-shadow: 0 -12px 36px rgba(31, 45, 61, .08);
	transform: translateY(calc(100% - 56px));
	transition: transform 180ms ease-out, box-shadow 160ms ease-out;
}
.graph-drawer.fullscreen {
	transform: translateY(0);
	box-shadow: 0 -18px 60px rgba(31, 45, 61, .18);
}
.graph-head {
	display: flex;
	align-items: center;
	gap: 10px;
	padding: 0 20px;
	border-bottom: 1px solid var(--border);
	min-width: 0;
}
.graph-head strong { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 16px; }
.graph-meta { flex: 0 1 auto; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--muted); font-size: 12px; }
.graph-controls {
	min-width: 0;
	display: inline-flex;
	align-items: center;
	gap: 8px;
	overflow-x: auto;
	scrollbar-width: none;
}
.graph-controls::-webkit-scrollbar { display: none; }
.graph-segment, .graph-filters {
	display: inline-flex;
	align-items: center;
	gap: 2px;
	padding: 3px;
	border: 1px solid var(--border);
	border-radius: 8px;
	background: #fff;
	flex: 0 0 auto;
}
.graph-segment button, .graph-filters button {
	height: 26px;
	padding: 0 9px;
	border-radius: 6px;
	color: #566274;
	font-size: 12px;
	font-weight: 650;
	white-space: nowrap;
}
.graph-segment button[aria-pressed="true"], .graph-filters button[aria-pressed="true"] {
	background: var(--accent-soft);
	color: #174ea6;
}
.graph-filters button[aria-pressed="false"] { color: #9aa6b5; background: #f6f8fb; }
.graph-tools {
	margin-left: auto;
	display: inline-flex;
	align-items: center;
	gap: 4px;
	flex: 0 0 auto;
	padding: 3px;
	border: 1px solid var(--border);
	border-radius: 9px;
	background: #fff;
}
.graph-tools .icon-btn {
	width: 32px;
	height: 32px;
	border: 0;
	border-radius: 6px;
	background: transparent;
}
.graph-tools .graph-toggle-btn {
	width: auto;
	min-width: 92px;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	gap: 6px;
	padding: 0 10px;
}
.graph-tools .icon-btn:hover { background: #f2f6fb; }
.graph-tools .icon-btn[aria-pressed="false"] { color: #9aa6b5; background: #f6f8fb; }
.graph-body { position: relative; min-height: 0; overflow: hidden; }
.graph-body.dragging #graphCanvas { cursor: grabbing; }
.graph-drawer:not(.fullscreen) .graph-body { visibility: hidden; pointer-events: none; }
#graphCanvas { width: 100%; height: 100%; display: block; cursor: grab; touch-action: none; }
.legend {
	position: absolute;
	right: clamp(12px, 2vw, 32px);
	top: 70px;
	width: min(172px, calc(100% - 24px));
	padding: 13px 16px;
	border: 1px solid var(--border);
	border-radius: 8px;
	background: rgba(255,255,255,.72);
	box-shadow: 0 8px 28px rgba(31,45,61,.08);
	backdrop-filter: blur(10px);
	opacity: .78;
	transition: opacity 140ms ease, transform 140ms ease;
}
.legend:hover { opacity: .96; }
.legend.hidden { opacity: 0; transform: translateX(12px); pointer-events: none; }
.legend-row { display: grid; grid-template-columns: 14px 1fr; gap: 12px; align-items: start; margin: 10px 0; color: #3f4b5b; }
.legend-row div { min-width: 0; overflow: hidden; text-overflow: ellipsis; }
.legend-dot { width: 10px; height: 10px; border-radius: 999px; margin-top: 4px; }
.legend-row small { display: block; color: var(--muted); margin-top: 3px; line-height: 1.35; }
.graph-preview {
	position: absolute;
	left: var(--graph-preview-left, 16px);
	top: var(--graph-preview-top, 16px);
	width: min(360px, calc(100% - 32px));
	max-height: min(300px, calc(100% - 32px));
	display: none;
	overflow: auto;
	padding: 12px 14px;
	border: 1px solid var(--border);
	border-radius: 8px;
	background: rgba(255,255,255,.94);
	box-shadow: var(--shadow);
	z-index: 3;
	color: #243044;
}
.graph-preview.open { display: block; }
.graph-preview-title { font-size: 13px; font-weight: 740; color: #162033; line-height: 1.35; }
.graph-preview-path { margin-top: 3px; color: var(--muted); font-size: 11px; overflow-wrap: anywhere; }
.graph-preview-text { margin-top: 9px; color: #465365; font-size: 12px; line-height: 1.55; }
.graph-preview-actions { display: flex; justify-content: flex-end; margin-top: 11px; }
.graph-preview-open {
	height: 28px;
	padding: 0 10px;
	border-radius: 6px;
	background: var(--accent);
	color: #fff;
	font-size: 12px;
	font-weight: 680;
}
.graph-preview-open:hover { background: #174ea6; }
.search-results {
	position: fixed;
	top: var(--search-results-top, 52px);
	left: var(--search-results-left, 16px);
	width: var(--search-results-width, min(560px, calc(100vw - 40px)));
	max-height: min(520px, calc(100vh - var(--search-results-top, 52px) - 16px));
	display: none;
	overflow: auto;
	border: 1px solid var(--border);
	border-radius: 9px;
	background: #fff;
	box-shadow: var(--shadow);
	z-index: 20;
}
.search-results.open { display: block; }
.result-group { padding: 9px 0; }
.result-label { padding: 0 14px 6px; color: var(--muted); font-size: 11px; font-weight: 700; text-transform: uppercase; }
.result-item { padding: 8px 14px; min-height: 44px; cursor: pointer; }
.result-item:hover, .result-item.active { background: var(--accent-soft); }
.result-title { font-size: 13px; color: #1f2937; }
.result-title { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.result-sub { font-size: 11px; color: var(--muted); margin-top: 3px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.empty { color: var(--muted); padding: 20px; font-size: 13px; }
@media (max-width: 1050px) {
	:root { --inspector-min-width: 340px; --inspector-width: clamp(340px, 36vw, 420px); }
	.topbar { grid-template-columns: 220px minmax(170px, 240px) minmax(220px, 1fr); }
	.stats { display: none; }
	.shell { grid-template-columns: 240px minmax(0, 1fr); }
	.graph-filters { display: none; }
	.legend { top: auto; bottom: 24px; }
}
</style>
</head>
<body>
<div class="app">
	<header class="topbar">
		<div class="brand">
			${icon("box", 28, "brand-icon")}
			<div class="brand-title">Axiom Preview</div>
		</div>
		<div class="projectbar" aria-label="Project">
			<button class="project-current" id="projectCurrent" type="button" aria-label="Switch project" aria-haspopup="listbox" aria-expanded="false">
				${icon("folder", 16)}
				<span class="project-name" id="projectName">Open a project</span>
				${icon("chevron-down", 13, "project-chevron")}
			</button>
			<button class="project-action" id="openProject" type="button">Open</button>
			<button class="project-action" id="manualProject" type="button">Path</button>
		</div>
		<label class="searchbox" aria-label="搜索文档">
			${icon("search", 16)}
			<input id="searchInput" placeholder="Search docs, meta, code refs">
			<span class="kbd">⌘K</span>
		</label>
		<div class="stats">
			<div class="stat"><span class="stat-dot"></span><span id="docCount">0 docs</span></div>
			<div class="stat"><span class="stat-dot err"></span><span id="errorCount">0 errors</span></div>
			<div class="stat"><span class="stat-dot warn"></span><span id="warningCount">0 warnings</span></div>
			<button class="stat stat-button" id="bugStat" type="button" aria-haspopup="dialog" aria-expanded="false" disabled><span class="stat-dot bug"></span><span id="bugCount">0 bugs</span></button>
		</div>
	</header>
	<div class="shell">
		<aside class="sidebar">
			<div class="side-head">
				<strong id="sideRootLabel">.axm</strong>
			</div>
			<nav class="tree" id="fileTree" aria-label=".axm 文件树"></nav>
			<div class="side-foot"><span id="sideDocCount">0 docs</span></div>
		</aside>
		<main class="workspace">
			<section class="doc-pane">
				<div class="reader">
					<div class="crumbs" id="breadcrumbs"></div>
					<div class="markdown-scroll"><article class="markdown" id="markdownView"></article></div>
				</div>
				<aside class="inspector" id="metaPanel"></aside>
			</section>
		</main>
		<section class="graph-drawer" id="graphSection">
			<div class="graph-head">
				<strong>Knowledge Graph</strong>
				<span class="graph-meta" id="graphMeta">0 nodes · 0 edges</span>
				<div class="graph-controls">
					<div class="graph-segment" role="group" aria-label="Graph mode">
						<button id="graphModeOverview" type="button" data-graph-mode="overview" aria-pressed="true">Overview</button>
						<button id="graphModeFocus" type="button" data-graph-mode="focus" aria-pressed="false">Focus</button>
						<button id="graphModeAll" type="button" data-graph-mode="all" aria-pressed="false">All</button>
					</div>
					<div class="graph-filters" role="group" aria-label="Graph relations">
						<button type="button" data-edge-type="entries" aria-pressed="true">entries</button>
						<button type="button" data-edge-type="related" aria-pressed="true">related</button>
						<button type="button" data-edge-type="code-ref" aria-pressed="false">code</button>
						<button type="button" data-edge-type="applies-to" aria-pressed="false">scope</button>
					</div>
				</div>
				<div class="graph-tools">
					<button class="icon-btn" id="legendToggle" aria-label="隐藏图例" aria-pressed="true">${icon("list", 18)}</button>
					<button class="icon-btn" id="fitGraph" aria-label="适配视图">${icon("scan", 18)}</button>
					<button class="icon-btn" id="zoomOut" aria-label="缩小">${icon("zoom-out", 18)}</button>
					<button class="icon-btn" id="zoomIn" aria-label="放大">${icon("zoom-in", 18)}</button>
					<button class="icon-btn graph-toggle-btn" id="graphToggle" aria-label="Expand graph" aria-expanded="false">Expand</button>
				</div>
			</div>
			<div class="graph-body">
				<canvas id="graphCanvas"></canvas>
				<div class="legend" id="graphLegend">
					<div class="legend-row"><span class="legend-dot" style="background:#22a05d"></span><div>current<small>当前文档</small></div></div>
					<div class="legend-row"><span class="legend-dot" style="background:#d89a0b"></span><div>in-progress<small>进行中的进展</small></div></div>
					<div class="legend-row"><span class="legend-dot" style="background:#647184"></span><div>closed<small>已关闭 / 已完成</small></div></div>
					<div class="legend-row"><span class="legend-dot" style="background:#d93f4b"></span><div>missing<small>缺失或阻塞</small></div></div>
				</div>
				<div class="graph-preview" id="graphPreview" role="dialog" aria-hidden="true"></div>
			</div>
		</section>
	</div>
</div>
<div class="project-popover" id="projectDropdown" role="listbox" aria-label="Recent projects"></div>
<div class="bug-backdrop" id="bugDialog" aria-hidden="true">
	<div class="bug-dialog" role="dialog" aria-modal="true" aria-labelledby="bugDialogTitle">
		<div class="path-dialog-head">
			<div>
				<div class="path-dialog-title" id="bugDialogTitle">Open bugs</div>
				<div class="bug-dialog-sub" id="bugDialogSummary">0 unclosed · 0 total</div>
			</div>
			<button class="path-close" id="bugDialogClose" type="button" aria-label="Close">×</button>
		</div>
		<div class="bug-toolbar">
			<label class="bug-search" aria-label="Search bugs">
				${icon("search", 15)}
				<input id="bugSearchInput" placeholder="Search bugs, state, priority" spellcheck="false">
			</label>
			<div class="bug-filters" role="group" aria-label="Bug filters">
				<button type="button" data-bug-filter="open" aria-pressed="true">Open</button>
				<button type="button" data-bug-filter="all" aria-pressed="false">All</button>
				<button type="button" data-bug-filter="closed" aria-pressed="false">Closed</button>
			</div>
		</div>
		<div class="bug-list" id="bugList"></div>
	</div>
</div>
<div class="path-backdrop" id="pathDialog" aria-hidden="true">
	<div class="path-dialog" role="dialog" aria-modal="true" aria-labelledby="pathDialogTitle">
		<div class="path-dialog-head">
			<div class="path-dialog-title" id="pathDialogTitle">Project path</div>
			<button class="path-close" id="pathDialogClose" type="button" aria-label="Close">×</button>
		</div>
		<div class="path-dialog-body">
			<input class="path-input" id="projectPathInput" placeholder="/path/to/project" spellcheck="false">
			<div class="path-error" id="projectPathError"></div>
		</div>
		<div class="path-dialog-actions">
			<button class="path-secondary" id="pathDialogCancel" type="button">Cancel</button>
			<button class="path-primary" id="pathDialogSubmit" type="button">Open</button>
		</div>
	</div>
</div>
<div class="search-results" id="searchResults"></div>
<script>
(function () {
	var model = null;
	var selectedPath = null;
	var searchTimer = null;
	var graphView = { zoom: 1, panX: 0, panY: 0 };
	var graphDrag = { active: false, moved: false, lastX: 0, lastY: 0 };
	var graphHitBoxes = [];
	var graphDrawFrame = 0;
	var graphMode = "overview";
	var graphEdgeTypes = { entries: true, related: true, "code-ref": false, "applies-to": false };
	var graphHoveredId = null;
	var graphPreviewHideTimer = 0;
	var treeCollapsed = new Set();
	var refreshing = false;
	var currentTarget = null;
	var recentProjects = loadRecentProjects();
	var projectMenuOpen = false;
	var pathDialogOpen = false;
	var bugDialogOpen = false;
	var bugFilter = "open";
	var projectError = "";
	var iconPaths = ${JSON.stringify(ICON_PATHS)};
	var colors = {
		entries: "#1d6fe8",
		related: "#8055d6",
		"code-ref": "#778397",
		"applies-to": "#22a05d",
		universal: "#1d6fe8",
		project: "#8055d6",
		knowledge: "#22a05d",
		progress: "#d89a0b",
		index: "#647184",
		root: "#174ea6",
		code: "#778397",
		scope: "#22a05d"
	};
	var chipStates = new Set([
		"current", "draft", "deprecated", "missing",
		"proposed", "ready", "in-progress", "blocked", "implemented", "verified", "closed", "deferred", "superseded",
		"open", "fixed", "reopened", "wont-fix", "duplicate", "accepted", "rejected", "unknown",
		"pass", "warn", "error"
	]);
	var stateStyles = {
		current: { color: "#22a05d", fill: "#eafaf1", stroke: "#8ad7aa", text: "#10713d" },
		draft: { color: "#1d6fe8", fill: "#edf5ff", stroke: "#a9c8ff", text: "#174ea6" },
		deprecated: { color: "#8055d6", fill: "#f4efff", stroke: "#c7b4f4", text: "#6740bd" },
		missing: { color: "#d93f4b", fill: "#fff0f1", stroke: "#f0a3a8", text: "#b22230" },
		proposed: { color: "#1d6fe8", fill: "#edf5ff", stroke: "#a9c8ff", text: "#174ea6" },
		ready: { color: "#1d6fe8", fill: "#edf5ff", stroke: "#a9c8ff", text: "#174ea6" },
		open: { color: "#1d6fe8", fill: "#edf5ff", stroke: "#a9c8ff", text: "#174ea6" },
		"in-progress": { color: "#d89a0b", fill: "#fff7dc", stroke: "#f0ce77", text: "#9a6800" },
		blocked: { color: "#d93f4b", fill: "#fff0f1", stroke: "#f0a3a8", text: "#b22230" },
		reopened: { color: "#d93f4b", fill: "#fff0f1", stroke: "#f0a3a8", text: "#b22230" },
		rejected: { color: "#d93f4b", fill: "#fff0f1", stroke: "#f0a3a8", text: "#b22230" },
		"wont-fix": { color: "#d93f4b", fill: "#fff0f1", stroke: "#f0a3a8", text: "#b22230" },
		implemented: { color: "#22a05d", fill: "#eafaf1", stroke: "#8ad7aa", text: "#10713d" },
		verified: { color: "#0f9f9a", fill: "#e8fbfa", stroke: "#87d6d2", text: "#08716d" },
		fixed: { color: "#16884f", fill: "#eafaf1", stroke: "#8ad7aa", text: "#0f6237" },
		accepted: { color: "#22a05d", fill: "#eafaf1", stroke: "#8ad7aa", text: "#10713d" },
		closed: { color: "#647184", fill: "#f6f8fb", stroke: "#cfd8e6", text: "#536173" },
		deferred: { color: "#8055d6", fill: "#f4efff", stroke: "#c7b4f4", text: "#6740bd" },
		superseded: { color: "#8055d6", fill: "#f4efff", stroke: "#c7b4f4", text: "#6740bd" },
		duplicate: { color: "#8055d6", fill: "#f4efff", stroke: "#c7b4f4", text: "#6740bd" },
		pass: { color: "#22a05d", fill: "#eafaf1", stroke: "#8ad7aa", text: "#10713d" },
		warn: { color: "#d89a0b", fill: "#fff7dc", stroke: "#f0ce77", text: "#9a6800" },
		error: { color: "#d93f4b", fill: "#fff0f1", stroke: "#f0a3a8", text: "#b22230" },
		unknown: { color: "#647184", fill: "#f6f8fb", stroke: "#cfd8e6", text: "#536173" }
	};
	graphMode = loadGraphMode();
	graphEdgeTypes = loadGraphEdgeTypes();

	var els = {
		docCount: document.getElementById("docCount"),
		errorCount: document.getElementById("errorCount"),
		warningCount: document.getElementById("warningCount"),
		bugCount: document.getElementById("bugCount"),
		bugStat: document.getElementById("bugStat"),
		sideDocCount: document.getElementById("sideDocCount"),
		tree: document.getElementById("fileTree"),
		markdown: document.getElementById("markdownView"),
		meta: document.getElementById("metaPanel"),
		crumbs: document.getElementById("breadcrumbs"),
		search: document.getElementById("searchInput"),
		projectCurrent: document.getElementById("projectCurrent"),
		projectName: document.getElementById("projectName"),
		projectDropdown: document.getElementById("projectDropdown"),
		openProject: document.getElementById("openProject"),
		manualProject: document.getElementById("manualProject"),
		pathDialog: document.getElementById("pathDialog"),
		projectPathInput: document.getElementById("projectPathInput"),
		projectPathError: document.getElementById("projectPathError"),
		pathDialogClose: document.getElementById("pathDialogClose"),
		pathDialogCancel: document.getElementById("pathDialogCancel"),
		pathDialogSubmit: document.getElementById("pathDialogSubmit"),
		bugDialog: document.getElementById("bugDialog"),
		bugDialogClose: document.getElementById("bugDialogClose"),
		bugDialogSummary: document.getElementById("bugDialogSummary"),
		bugSearch: document.getElementById("bugSearchInput"),
		bugList: document.getElementById("bugList"),
		bugFilterButtons: document.querySelectorAll("[data-bug-filter]"),
		sideRootLabel: document.getElementById("sideRootLabel"),
		results: document.getElementById("searchResults"),
		canvas: document.getElementById("graphCanvas"),
		graphMeta: document.getElementById("graphMeta"),
		graphSection: document.getElementById("graphSection"),
		graphToggle: document.getElementById("graphToggle"),
		graphModeButtons: document.querySelectorAll("[data-graph-mode]"),
		graphEdgeButtons: document.querySelectorAll("[data-edge-type]"),
		graphLegend: document.getElementById("graphLegend"),
		graphPreview: document.getElementById("graphPreview"),
		legendToggle: document.getElementById("legendToggle")
	};

	renderProjectPicker();
	loadModel(true);

	function loadModel(initial) {
		if (refreshing) return Promise.resolve();
		refreshing = !initial;
		setRefreshBusy(true);
		return fetchJson("/api/model", { cache: "no-store" })
			.then(function (data) { applyModel(data, initial); })
			.catch(function (error) {
				if (initial && recentProjects.length) return restoreRecentTarget(error);
				currentTarget = null;
				renderProjectPicker();
				renderNoTarget(error.message);
			})
			.finally(function () {
				refreshing = false;
				setRefreshBusy(false);
			});
	}

	function applyModel(data, initial) {
		model = data;
		currentTarget = data.target || null;
		rememberTarget(currentTarget);
		renderProjectPicker();
		treeCollapsed = loadTreeCollapsed();
		if (initial) {
			var storedPath = localStorage.getItem("axmPreview:selectedPath");
			selectedPath = findDoc(storedPath) ? storedPath : defaultDocPath();
		} else if (!findDoc(selectedPath)) {
			selectedPath = defaultDocPath();
		}
		if (selectedPath) localStorage.setItem("axmPreview:selectedPath", selectedPath);
		renderAll();
	}

	function fetchJson(url, options) {
		return fetch(url, options).then(function (res) {
			return res.json().catch(function () { return {}; }).then(function (body) {
				if (res.ok) return body;
				var error = new Error(body.message || "Preview request failed: " + res.status);
				error.error = body.error;
				error.candidates = body.candidates || [];
				throw error;
			});
		});
	}

	function restoreRecentTarget(originalError) {
		if (!recentProjects[0] || !recentProjects[0].path) {
			currentTarget = null;
			renderProjectPicker();
			renderNoTarget(originalError.message);
			return Promise.resolve();
		}
		projectError = "";
		return fetchJson("/api/target", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ path: recentProjects[0].path })
		})
			.then(function (data) { applyModel(data, true); })
			.catch(function (error) {
				currentTarget = null;
				projectError = error.message || originalError.message;
				renderProjectPicker();
				renderNoTarget(projectError);
			});
	}

	function renderNoTarget(message) {
		model = null;
		selectedPath = null;
		els.sideRootLabel.textContent = ".axm";
		els.docCount.textContent = "0 docs";
		els.errorCount.textContent = "0 errors";
		els.warningCount.textContent = "0 warnings";
		els.bugCount.textContent = "0 bugs";
		els.bugStat.disabled = true;
		els.bugStat.setAttribute("aria-expanded", "false");
		els.sideDocCount.textContent = "0 docs";
		els.graphMeta.textContent = "0 nodes · 0 edges";
		els.tree.innerHTML = "";
		els.crumbs.innerHTML = "<strong>No project selected</strong>";
		els.markdown.innerHTML = '<div class="empty">' + escapeHtml(message || "Open a project folder that contains .axm.") + "</div>";
		els.meta.innerHTML = '<div class="panel"><div class="panel-title"><span>Project</span></div><div class="validate-card"><div class="validate-row"><span class="validate-icon warn">' + iconSvg("folder", 13) + '</span><div><div class="validate-title">Open an Axiom project</div><div class="validate-sub">Choose a project folder that contains .axm, or switch to a recent project.</div></div></div></div></div>';
		graphHitBoxes = [];
		hideGraphPreview();
		closeBugDialog();
	}

	function renderProjectPicker() {
		var label = currentTarget ? currentTarget.name : "Open a project";
		var title = currentTarget ? currentTarget.path : "";
		els.projectName.textContent = label;
		els.projectCurrent.title = title;
		els.projectCurrent.setAttribute("aria-expanded", projectMenuOpen ? "true" : "false");
		renderProjectDropdown();
	}

	function renderProjectDropdown() {
		els.projectDropdown.innerHTML = "";
		var activePath = currentTarget ? currentTarget.path : "";
		var items = recentProjects.slice();
		if (currentTarget && !items.some(function (item) { return item.path === currentTarget.path; })) {
			items.unshift(currentTarget);
		}
		if (!items.length) {
			els.projectDropdown.innerHTML = '<div class="project-popover-empty">No recent projects</div>';
		}
		items.forEach(function (project) {
			var option = document.createElement("button");
			option.type = "button";
			option.className = "project-option" + (project.path === activePath ? " active" : "");
			option.dataset.path = project.path;
			option.title = project.path;
			option.setAttribute("role", "option");
			option.setAttribute("aria-selected", project.path === activePath ? "true" : "false");
			option.innerHTML = '<span class="project-option-title">' + escapeHtml(project.name) + '</span><span class="project-option-path">' + escapeHtml(project.path) + '</span>';
			els.projectDropdown.appendChild(option);
		});
		if (projectError) {
			var error = document.createElement("div");
			error.className = "project-popover-error";
			error.textContent = projectError;
			els.projectDropdown.appendChild(error);
		}
		if (projectMenuOpen) positionProjectDropdown();
	}

	function loadRecentProjects() {
		try {
			var parsed = JSON.parse(localStorage.getItem("axmPreview:recentProjects") || "[]");
			if (!Array.isArray(parsed)) return [];
			return parsed.filter(function (item) {
				return item && typeof item.path === "string" && typeof item.name === "string";
			}).slice(0, 8);
		} catch {
			return [];
		}
	}

	function loadGraphMode() {
		try {
			var stored = localStorage.getItem("axmPreview:graphMode");
			return stored === "focus" || stored === "all" || stored === "overview" ? stored : "overview";
		} catch {
			return "overview";
		}
	}

	function loadGraphEdgeTypes() {
		var defaults = { entries: true, related: true, "code-ref": false, "applies-to": false };
		try {
			var parsed = JSON.parse(localStorage.getItem("axmPreview:graphEdgeTypes") || "{}");
			if (!parsed || typeof parsed !== "object") return defaults;
			Object.keys(defaults).forEach(function (type) {
				if (typeof parsed[type] === "boolean") defaults[type] = parsed[type];
			});
		} catch {}
		return defaults;
	}

	function saveGraphEdgeTypes() {
		try {
			localStorage.setItem("axmPreview:graphEdgeTypes", JSON.stringify(graphEdgeTypes));
		} catch {}
	}

	function treeStorageKey() {
		var targetPath = currentTarget && currentTarget.path ? currentTarget.path : "default";
		return "axmPreview:treeCollapsed:" + targetPath;
	}

	function loadTreeCollapsed() {
		try {
			var parsed = JSON.parse(localStorage.getItem(treeStorageKey()) || "[]");
			if (!Array.isArray(parsed)) return new Set();
			return new Set(parsed.filter(function (item) { return typeof item === "string"; }));
		} catch {
			return new Set();
		}
	}

	function saveTreeCollapsed() {
		try {
			localStorage.setItem(treeStorageKey(), JSON.stringify(Array.from(treeCollapsed)));
		} catch {}
	}

	function rememberTarget(target) {
		if (!target || !target.path) return;
		recentProjects = [target].concat(recentProjects.filter(function (item) {
			return item.path !== target.path;
		})).slice(0, 8);
		try {
			localStorage.setItem("axmPreview:recentProjects", JSON.stringify(recentProjects));
		} catch {}
	}

	function setProjectBusy(busy) {
		els.openProject.disabled = busy;
		els.manualProject.disabled = busy;
		els.projectCurrent.disabled = busy;
		els.pathDialogSubmit.disabled = busy;
		els.pathDialogCancel.disabled = busy;
	}

	function switchTarget(path) {
		if (!path) return Promise.resolve();
		setProjectBusy(true);
		projectError = "";
		setPathError("");
		return fetchJson("/api/target", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ path: path })
		})
			.then(function (data) {
				closeProjectDropdown();
				closePathDialog();
				applyModel(data, false);
			})
			.catch(function (error) {
				handleTargetError(error);
				throw error;
			})
			.finally(function () { setProjectBusy(false); });
	}

	function openProject() {
		setProjectBusy(true);
		projectError = "";
		closeProjectDropdown();
		closePathDialog();
		closeBugDialog();
		return fetchJson("/api/pick-target", { method: "POST" })
			.then(function (data) { applyModel(data, false); })
			.catch(function (error) {
				if (error.error === "target_pick_cancelled") return;
				openPathDialog(error.message);
			})
			.finally(function () { setProjectBusy(false); });
	}

	function toggleProjectDropdown() {
		if (projectMenuOpen) closeProjectDropdown();
		else openProjectDropdown();
	}

	function openProjectDropdown() {
		projectMenuOpen = true;
		projectError = "";
		closePathDialog();
		closeBugDialog();
		renderProjectPicker();
		els.projectDropdown.classList.add("open");
		els.projectCurrent.setAttribute("aria-expanded", "true");
		positionProjectDropdown();
	}

	function closeProjectDropdown() {
		projectMenuOpen = false;
		els.projectDropdown.classList.remove("open");
		els.projectCurrent.setAttribute("aria-expanded", "false");
	}

	function positionProjectDropdown() {
		var anchor = document.querySelector(".projectbar");
		if (!anchor) return;
		var rect = anchor.getBoundingClientRect();
		var viewportPadding = 12;
		var maxWidth = Math.max(260, window.innerWidth - viewportPadding * 2);
		var width = Math.min(430, Math.max(280, rect.width), maxWidth);
		var left = Math.min(Math.max(viewportPadding, rect.left), window.innerWidth - viewportPadding - width);
		var top = rect.bottom + 8;
		els.projectDropdown.style.setProperty("--project-menu-top", Math.round(top) + "px");
		els.projectDropdown.style.setProperty("--project-menu-left", Math.round(left) + "px");
		els.projectDropdown.style.setProperty("--project-menu-width", Math.round(width) + "px");
	}

	function openPathDialog(message) {
		projectError = "";
		closeProjectDropdown();
		closeBugDialog();
		pathDialogOpen = true;
		els.pathDialog.classList.add("open");
		els.pathDialog.setAttribute("aria-hidden", "false");
		els.projectPathInput.value = currentTarget ? currentTarget.path : "";
		setPathError(message || "");
		els.projectPathInput.focus();
		els.projectPathInput.select();
	}

	function closePathDialog() {
		pathDialogOpen = false;
		els.pathDialog.classList.remove("open");
		els.pathDialog.setAttribute("aria-hidden", "true");
		setPathError("");
	}

	function submitPathDialog() {
		var value = els.projectPathInput.value.trim();
		if (!value) {
			setPathError("Project path is required.");
			return;
		}
		switchTarget(value).catch(function () {});
	}

	function setPathError(message) {
		els.projectPathError.textContent = message || "";
	}

	function openBugDialog() {
		if (!model) return;
		closeProjectDropdown();
		closePathDialog();
		els.results.classList.remove("open");
		bugDialogOpen = true;
		els.bugDialog.classList.add("open");
		els.bugDialog.setAttribute("aria-hidden", "false");
		els.bugStat.setAttribute("aria-expanded", "true");
		renderBugDialog();
		els.bugSearch.focus();
		els.bugSearch.select();
	}

	function closeBugDialog() {
		bugDialogOpen = false;
		els.bugDialog.classList.remove("open");
		els.bugDialog.setAttribute("aria-hidden", "true");
		els.bugStat.setAttribute("aria-expanded", "false");
	}

	function renderBugDialog() {
		var inventory = model && model.bugs ? model.bugs : { items: [], openCount: 0, total: 0 };
		var items = filteredBugItems();
		els.bugDialogSummary.textContent = inventory.openCount + " unclosed · " + inventory.total + " total";
		Array.prototype.forEach.call(els.bugFilterButtons, function (button) {
			var pressed = button.dataset.bugFilter === bugFilter;
			button.setAttribute("aria-pressed", pressed ? "true" : "false");
		});
		if (!items.length) {
			els.bugList.innerHTML = '<div class="bug-empty">No bugs match the current filter.</div>';
			return;
		}
		els.bugList.innerHTML = items.map(function (bug) {
			var stateClass = chipClass(bug.state);
			var chips = [
				renderChip(bug.state, stateClass),
				bug.priority ? renderChip(bug.priority, "") : "",
				bug.severity ? renderChip(bug.severity, "") : "",
				bug.initiative ? renderChip(bug.initiative, "") : "",
				bug.stateUpdated ? renderChip(bug.stateUpdated, "state-date") : "",
			].filter(Boolean).join("");
			return '<button class="bug-item" type="button" data-bug-path="' + escapeHtml(bug.path) + '">' +
				'<div><div class="bug-title">' + escapeHtml(bug.title) + '</div><div class="bug-path">' + escapeHtml(bug.path) + '</div><div class="bug-excerpt">' + escapeHtml(bug.excerpt || bug.subtitle || "No preview text available.") + '</div></div>' +
				'<div class="bug-meta">' + chips + '</div>' +
				'</button>';
		}).join("");
	}

	function filteredBugItems() {
		if (!model || !model.bugs) return [];
		var q = els.bugSearch.value.trim().toLowerCase();
		return model.bugs.items.filter(function (bug) {
			if (bugFilter === "open" && !bug.open) return false;
			if (bugFilter === "closed" && bug.open) return false;
			if (bugFilter !== "open" && bugFilter !== "closed" && bugFilter !== "all" && bug.state !== bugFilter) return false;
			return bugMatchesQuery(bug, q);
		});
	}

	function bugMatchesQuery(bug, query) {
		if (!query) return true;
		return bug.searchText.indexOf(query) !== -1;
	}

	function openBugInViewer(bug) {
		selectDoc(bug.path);
		closeBugDialog();
	}

	function handleTargetError(error) {
		if (pathDialogOpen) {
			setPathError(error.message);
			return;
		}
		projectError = error.message;
		renderProjectDropdown();
		if (projectMenuOpen) els.projectDropdown.classList.add("open");
		if (!model) {
			renderNoTarget(error.message);
		}
	}

	function setRefreshBusy(busy) {
		var button = document.getElementById("validationRefresh");
		if (!button) return;
		button.disabled = busy;
		button.setAttribute("aria-busy", busy ? "true" : "false");
		button.setAttribute("aria-label", busy ? "正在重新检查" : "重新检查");
	}

	function renderAll() {
		els.sideRootLabel.textContent = (model.target && model.target.name ? model.target.name : "project") + "/.axm";
		els.docCount.textContent = model.summary.docs + " docs";
		els.errorCount.textContent = model.summary.errors + " errors";
		els.warningCount.textContent = model.summary.warnings + " warnings";
		els.bugCount.textContent = model.summary.bugs + " bugs";
		els.bugStat.disabled = false;
		els.sideDocCount.textContent = model.summary.docs + " docs";
		updateGraphControls();
		updateGraphMeta();
		renderTree();
		renderSelected();
		if (bugDialogOpen) renderBugDialog();
		scheduleGraphDraw();
	}

	function updateGraphMeta() {
		if (!model) {
			els.graphMeta.textContent = "0 nodes · 0 edges";
			return;
		}
		var graph = visibleGraph();
		var modeLabel = graphMode.slice(0, 1).toUpperCase() + graphMode.slice(1);
		els.graphMeta.textContent = modeLabel + " · " + graph.nodes.length + "/" + model.graph.nodes.length + " nodes · " + graph.edges.length + "/" + model.graph.edges.length + " edges";
	}

	function updateGraphControls() {
		Array.prototype.forEach.call(els.graphModeButtons, function (button) {
			button.setAttribute("aria-pressed", button.dataset.graphMode === graphMode ? "true" : "false");
		});
		Array.prototype.forEach.call(els.graphEdgeButtons, function (button) {
			button.setAttribute("aria-pressed", graphEdgeTypes[button.dataset.edgeType] ? "true" : "false");
		});
	}

	function setGraphMode(mode) {
		if (mode !== "overview" && mode !== "focus" && mode !== "all") return;
		graphMode = mode;
		try {
			localStorage.setItem("axmPreview:graphMode", graphMode);
		} catch {}
		updateGraphControls();
		updateGraphMeta();
		resetGraphView();
	}

	function toggleGraphEdgeType(type) {
		if (!Object.prototype.hasOwnProperty.call(graphEdgeTypes, type)) return;
		graphEdgeTypes[type] = !graphEdgeTypes[type];
		saveGraphEdgeTypes();
		updateGraphControls();
		updateGraphMeta();
		resetGraphView();
	}

	function defaultDocPath() {
		if (findDoc(".axm/universal/docs.md")) return ".axm/universal/docs.md";
		if (findDoc(".axm/index.md")) return ".axm/index.md";
		if (findDoc(".axm/index.mdc")) return ".axm/index.mdc";
		return model.documents[0] ? model.documents[0].path : null;
	}

	function findDoc(path) {
		if (!path) return null;
		return model.documents.find(function (doc) { return doc.path === path; }) || null;
	}

	function renderTree() {
		els.tree.innerHTML = "";
		renderTreeChildren(model.tree.children || [], 0, els.tree);
	}

	function renderTreeChildren(children, depth, parent) {
		children.forEach(function (child) {
			renderTreeNode(child, depth, parent);
		});
	}

	function renderTreeNode(node, depth, parent) {
		var indent = 6 + depth * 14 + "px";
		if (node.type === "dir") {
			var collapsed = treeCollapsed.has(node.path);
			var dirRow = document.createElement("button");
			dirRow.type = "button";
			dirRow.className = "tree-row dir";
			dirRow.style.setProperty("--tree-indent", indent);
			dirRow.dataset.path = node.path;
			dirRow.setAttribute("aria-expanded", collapsed ? "false" : "true");
			dirRow.innerHTML = '<span class="tree-disclosure">' + iconSvg(collapsed ? "chevron-right" : "chevron-down", 13) + '</span><span class="tree-icon">' + iconSvg("folder", 16) + '</span><span class="tree-name">' + escapeHtml(treeDisplayName(node)) + '</span>';
			dirRow.addEventListener("click", function () { toggleTreeNode(node.path); });
			parent.appendChild(dirRow);
			if (!collapsed) renderTreeChildren(node.children || [], depth + 1, parent);
			return;
		}

		var row = document.createElement("button");
		row.type = "button";
		row.className = "tree-row" + (node.path === selectedPath ? " active" : "");
		row.style.setProperty("--tree-indent", indent);
		row.dataset.path = node.path;
		var displayName = treeDisplayName(node);
		row.title = node.title ? displayName + " — " + node.title : displayName;
		row.innerHTML = '<span class="tree-disclosure placeholder">' + iconSvg("chevron-right", 13) + '</span><span class="tree-icon">' + docIcon(node) + '</span><span class="tree-name">' + escapeHtml(displayName) + '</span>';
		row.addEventListener("click", function () { selectDoc(node.path); });
		parent.appendChild(row);
	}

	function docIcon(doc) {
		return iconSvg("file-text", 15);
	}

	function treeDisplayName(node) {
		if (node.path === "AGENTS.md") return "../AGENTS.md";
		return node.name;
	}

	function toggleTreeNode(path) {
		if (treeCollapsed.has(path)) uncollapseTreeNode(path);
		else treeCollapsed.add(path);
		saveTreeCollapsed();
		renderTree();
	}

	function uncollapseTreeNode(path) {
		var next = new Set();
		treeCollapsed.forEach(function (item) {
			if (item !== path) next.add(item);
		});
		treeCollapsed = next;
	}

	function revealPath(path) {
		var beforeSize = treeCollapsed.size;
		var parts = path.split("/");
		for (var i = 1; i < parts.length - 1; i++) {
			uncollapseTreeNode(parts.slice(0, i + 1).join("/"));
		}
		if (treeCollapsed.size !== beforeSize) saveTreeCollapsed();
	}

	function selectDoc(path) {
		if (!findDoc(path)) return;
		selectedPath = path;
		localStorage.setItem("axmPreview:selectedPath", path);
		revealPath(path);
		renderTree();
		renderSelected();
		updateGraphMeta();
		scheduleGraphDraw();
	}

	function renderSelected() {
		var doc = findDoc(selectedPath);
		if (!doc) return;
		els.crumbs.innerHTML = renderBreadcrumbs(doc) + '<span class="line-count">' + doc.lineCount + " lines</span>";
		els.markdown.innerHTML = renderMarkdown(doc.body);
		renderMeta(doc);
	}

	function renderBreadcrumbs(doc) {
		var parts = doc.path.split("/");
		var out = [];
		for (var i = 0; i < parts.length; i++) {
			if (i > 0) out.push('<span class="crumb-sep">' + iconSvg("chevron-right", 12) + '</span>');
			if (i === parts.length - 1) out.push("<strong>" + escapeHtml(parts[i]) + "</strong>");
			else out.push("<span>" + escapeHtml(parts[i]) + "</span>");
		}
		return out.join("");
	}

	function renderMeta(doc) {
		var rows = [];
		var meta = doc.meta || {};
		rows.push(row("kind", skeletonName(doc)));
		Object.keys(meta).forEach(function (key) {
			rows.push(row(key, renderMetaValue(key, meta[key])));
		});
		var allIssues = model.validation.issues || [];
		var currentIssues = allIssues.filter(function (issue) { return issue.file === doc.path; });
		var currentIssueRows = renderIssueRows(currentIssues, "No document issues", "当前文档未发现契约问题");
		var allIssueRows = renderIssueRows(allIssues, "No project issues", "当前项目未发现契约问题");
		var statusIcon = model.validation.errors ? "circle-alert" : model.validation.warnings ? "triangle-alert" : "check";
		var statusClassName = chipClass(model.validation.status);
		els.meta.innerHTML = '<div class="panel"><div class="panel-title"><span>axm-meta</span><span class="chip">' + escapeHtml(doc.name) + '</span></div><table class="meta-table"><tbody>' + rows.join("") + '</tbody></table></div><div class="panel"><div class="panel-title"><span>Contract check</span><span class="panel-title-actions"><span class="chip ' + statusClassName + '">' + escapeHtml(model.validation.status.toUpperCase()) + '</span><button class="refresh-btn" id="validationRefresh" type="button" title="重新检查" aria-label="重新检查" aria-busy="false">' + iconSvg("refresh-cw", 14) + '</button></span></div><div class="validate-card"><div class="validate-row"><span class="validate-icon ' + (model.validation.errors ? "err" : model.validation.warnings ? "warn" : "") + '">' + iconSvg(statusIcon, 13) + '</span><div><div class="validate-title">' + escapeHtml(checkedLabel()) + '</div><div class="validate-sub">' + model.summary.errors + ' error(s), ' + model.summary.warnings + ' warning(s)</div></div></div><div class="validate-section-title">Current document</div>' + currentIssueRows + '<div class="validate-section-title">All issues</div>' + allIssueRows + '</div></div>';
	}

	function checkedLabel() {
		var axmDocs = model.summary.axmDocs == null ? model.summary.docs : model.summary.axmDocs;
		var agentsDocs = model.summary.agentsDocs || 0;
		return "checked " + axmDocs + " .axm doc files" + (agentsDocs ? " + AGENTS.md" : "");
	}

	function renderIssueRows(issues, emptyTitle, emptySub) {
		return issues.length
			? issues.map(function (issue) {
				var cls = issue.level === "error" ? "err" : "warn";
				var issueIcon = issue.level === "error" ? "circle-alert" : "triangle-alert";
				var file = issue.file || "project";
				var rule = issue.ruleRef || issue.rule || "validation";
				return '<div class="validate-row"><span class="validate-icon ' + cls + '">' + iconSvg(issueIcon, 13) + '</span><div><div class="validate-title">' + escapeHtml(file) + '</div><div class="validate-sub">' + escapeHtml(rule + " · " + issue.message) + '</div></div></div>';
			}).join("")
			: '<div class="validate-row"><span class="validate-icon">' + iconSvg("check", 13) + '</span><div><div class="validate-title">' + escapeHtml(emptyTitle) + '</div><div class="validate-sub">' + escapeHtml(emptySub) + '</div></div></div>';
	}

	function row(label, value) {
		return "<tr><th>" + escapeHtml(label) + "</th><td>" + value + "</td></tr>";
	}

	function skeletonName(doc) {
		if (doc.kind === "agents") return "AGENTS.md";
		if (doc.kind === "index") return "C / index";
		if (doc.kind === "knowledge") return "B / knowledge";
		if (doc.kind === "progress") return "D / progress";
		return "A / spec";
	}

	function renderMetaValue(key, value) {
		if (Array.isArray(value)) {
			if (value.length === 0) return '<span class="chip">empty</span>';
			return value.map(function (item) {
				if (typeof item === "object" && item) {
					var label = item.path || JSON.stringify(item);
					return '<span class="chip linkish" data-ref="' + escapeHtml(label) + '">' + escapeHtml(label) + '</span>';
				}
				return renderChip(String(item), metaChipClass(key, item));
			}).join("");
		}
		if (isMetaChipKey(key)) return renderChip(String(value), metaChipClass(key, value));
		return escapeHtml(String(value));
	}

	function renderChip(value, className) {
		return '<span class="chip' + (className ? " " + className : "") + '">' + escapeHtml(value) + '</span>';
	}

	function isMetaChipKey(key) {
		return key === "doc-state" || key === "workflow-state" || key === "state-updated";
	}

	function metaChipClass(key, value) {
		if (key === "state-updated") return "state-date";
		return chipClass(value);
	}

	function chipClass(value) {
		var token = String(value == null ? "" : value).trim();
		return chipStates.has(token) ? token : "";
	}

	function renderMarkdown(markdown) {
		var lines = markdown.split(/\\r?\\n/);
		var html = [];
		var paragraph = [];
		var inCode = false;
		var codeLines = [];
		var tableLines = [];

		function flushParagraph() {
			if (!paragraph.length) return;
			html.push("<p>" + renderInline(paragraph.join(" ")) + "</p>");
			paragraph = [];
		}
		function flushCode() {
			if (!codeLines.length) return;
			html.push("<pre><code>" + escapeHtml(codeLines.join("\\n")) + "</code></pre>");
			codeLines = [];
		}
		function flushTable() {
			if (!tableLines.length) return;
			var rows = tableLines.filter(function (line) { return !/^\\|?\\s*:?-{3,}/.test(line.replace(/\\|/g, "").trim()); });
			var table = rows.map(function (line, index) {
				var cells = line.replace(/^\\||\\|$/g, "").split("|").map(function (cell) { return cell.trim(); });
				var tag = index === 0 ? "th" : "td";
				return "<tr>" + cells.map(function (cell) { return "<" + tag + ">" + renderInline(cell) + "</" + tag + ">"; }).join("") + "</tr>";
			}).join("");
			html.push('<div class="markdown-table-scroll"><table>' + table + "</table></div>");
			tableLines = [];
		}

		lines.forEach(function (line) {
			if (line.trim().startsWith("\`\`\`")) {
				if (inCode) {
					inCode = false;
					flushCode();
				} else {
					flushParagraph();
					flushTable();
					inCode = true;
				}
				return;
			}
			if (inCode) {
				codeLines.push(line);
				return;
			}
			if (/^\\s*\\|.+\\|\\s*$/.test(line)) {
				flushParagraph();
				tableLines.push(line);
				return;
			}
			flushTable();
			var heading = line.match(/^(#{1,3})\\s+(.+)$/);
			if (heading) {
				flushParagraph();
				var level = heading[1].length;
				html.push("<h" + level + ">" + renderInline(heading[2]) + "</h" + level + ">");
				return;
			}
			if (/^>\\s?/.test(line)) {
				flushParagraph();
				html.push("<blockquote>" + renderInline(line.replace(/^>\\s?/, "")) + "</blockquote>");
				return;
			}
			if (/^\\s*[-*]\\s+/.test(line)) {
				flushParagraph();
				html.push("<ul><li>" + renderInline(line.replace(/^\\s*[-*]\\s+/, "")) + "</li></ul>");
				return;
			}
			if (!line.trim()) {
				flushParagraph();
				return;
			}
			paragraph.push(line.trim());
		});
		flushParagraph();
		flushTable();
		return html.join("\\n");
	}

		function renderInline(text) {
			return escapeHtml(text)
				.replace(/\\*\\*([^*]+)\\*\\*/g, "<strong>$1</strong>")
				.replace(/\`([^\`]+)\`/g, "<code>$1</code>")
				.replace(/\\[([^\\]]+)\\]\\(([^)]+)\\)/g, function (_match, label, href) {
					var safeHref = sanitizeMarkdownUrl(href);
					if (!safeHref) return label;
					return '<a href="' + safeHref + '" rel="noreferrer">' + label + "</a>";
				});
		}

		function sanitizeMarkdownUrl(href) {
			var trimmed = String(href || "").trim();
			if (!trimmed || /[\\u0000-\\u001f\\u007f\\s]/.test(trimmed)) return "";
			var lower = trimmed.toLowerCase();
			var colonIndex = lower.indexOf(":");
			var firstPathIndex = lower.search(/[\\/?#]/);
			if (colonIndex !== -1 && (firstPathIndex === -1 || colonIndex < firstPathIndex)) {
				if (!/^(https?|mailto):/.test(lower)) return "";
			}
			return trimmed;
		}

	function runSearch(query) {
		var q = query.trim().toLowerCase();
		if (!q) {
			els.results.classList.remove("open");
			renderTree();
			return;
		}
		var matches = model.documents.filter(function (doc) { return doc.searchText.indexOf(q) !== -1; }).slice(0, 24);
		positionSearchResults();
		els.results.classList.add("open");
		if (!matches.length) {
			els.results.innerHTML = '<div class="empty">No matches</div>';
			return;
		}
		els.results.innerHTML = '<div class="result-group"><div class="result-label">Files</div>' + matches.map(function (doc) {
			return '<div class="result-item" data-path="' + escapeHtml(doc.path) + '"><div class="result-title">' + escapeHtml(doc.title) + '</div><div class="result-sub">' + escapeHtml(doc.path) + '</div></div>';
		}).join("") + "</div>";
		Array.prototype.forEach.call(els.results.querySelectorAll(".result-item"), function (item) {
			item.addEventListener("click", function () {
				selectDoc(item.dataset.path);
				els.results.classList.remove("open");
			});
		});
	}

	function positionSearchResults() {
		var anchor = els.search.closest ? els.search.closest(".searchbox") : els.search.parentElement;
		if (!anchor) return;
		var rect = anchor.getBoundingClientRect();
		var viewportPadding = 12;
		var maxWidth = Math.max(240, window.innerWidth - viewportPadding * 2);
		var width = Math.min(560, Math.max(320, rect.width), maxWidth);
		var left = Math.min(Math.max(viewportPadding, rect.left), window.innerWidth - viewportPadding - width);
		var top = Math.min(rect.bottom + 8, window.innerHeight - 24);
		els.results.style.setProperty("--search-results-top", Math.round(top) + "px");
		els.results.style.setProperty("--search-results-left", Math.round(left) + "px");
		els.results.style.setProperty("--search-results-width", Math.round(width) + "px");
	}

	els.search.addEventListener("input", function () {
		clearTimeout(searchTimer);
		searchTimer = setTimeout(function () { runSearch(els.search.value); }, 120);
	});
	els.search.addEventListener("focus", function () {
		if (els.results.classList.contains("open")) positionSearchResults();
	});
	els.bugStat.addEventListener("click", openBugDialog);
	els.bugDialogClose.addEventListener("click", closeBugDialog);
	els.bugDialog.addEventListener("click", function (event) {
		if (event.target === els.bugDialog) closeBugDialog();
	});
	els.bugSearch.addEventListener("input", renderBugDialog);
	Array.prototype.forEach.call(els.bugFilterButtons, function (button) {
		button.addEventListener("click", function () {
			bugFilter = button.dataset.bugFilter;
			renderBugDialog();
		});
	});
	els.bugList.addEventListener("click", function (event) {
		var item = event.target.closest ? event.target.closest("[data-bug-path]") : null;
		if (!item || !model || !model.bugs) return;
		var bug = model.bugs.items.find(function (candidate) { return candidate.path === item.dataset.bugPath; });
		if (bug) openBugInViewer(bug);
	});
	els.projectCurrent.addEventListener("click", toggleProjectDropdown);
	els.openProject.addEventListener("click", openProject);
	els.manualProject.addEventListener("click", function () { openPathDialog(""); });
	els.projectDropdown.addEventListener("click", function (event) {
		var option = event.target.closest ? event.target.closest(".project-option") : null;
		if (!option || !option.dataset.path) return;
		switchTarget(option.dataset.path).catch(function () {});
	});
	els.pathDialogClose.addEventListener("click", closePathDialog);
	els.pathDialogCancel.addEventListener("click", closePathDialog);
	els.pathDialog.addEventListener("click", function (event) {
		if (event.target === els.pathDialog) closePathDialog();
	});
	els.pathDialogSubmit.addEventListener("click", submitPathDialog);
	els.projectPathInput.addEventListener("keydown", function (event) {
		if (event.key === "Enter") submitPathDialog();
	});
	document.addEventListener("click", function (event) {
		if (!projectMenuOpen) return;
		var inProjectBar = event.target.closest ? event.target.closest(".projectbar") : null;
		var inProjectDropdown = event.target.closest ? event.target.closest("#projectDropdown") : null;
		if (!inProjectBar && !inProjectDropdown) closeProjectDropdown();
	});
	document.addEventListener("keydown", function (event) {
		if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
			event.preventDefault();
			els.search.focus();
		}
		if (event.key === "Escape") {
			if (bugDialogOpen) closeBugDialog();
			else if (pathDialogOpen) closePathDialog();
			else if (projectMenuOpen) closeProjectDropdown();
			else if (els.graphSection.classList.contains("fullscreen")) collapseGraph();
			else els.results.classList.remove("open");
		}
		if (event.key === "Enter" && document.activeElement === els.search) {
			var first = els.results.querySelector(".result-item");
			if (first) {
				selectDoc(first.dataset.path);
				els.results.classList.remove("open");
			}
		}
	});
	els.meta.addEventListener("click", function (event) {
		var button = event.target.closest ? event.target.closest("#validationRefresh") : null;
		if (!button) return;
		event.preventDefault();
		loadModel(false);
	});

	els.graphToggle.addEventListener("click", toggleGraph);
	els.graphSection.addEventListener("transitionend", scheduleGraphDraw);
	els.legendToggle.addEventListener("click", toggleLegend);
	Array.prototype.forEach.call(els.graphModeButtons, function (button) {
		button.addEventListener("click", function () { setGraphMode(button.dataset.graphMode); });
	});
	Array.prototype.forEach.call(els.graphEdgeButtons, function (button) {
		button.addEventListener("click", function () { toggleGraphEdgeType(button.dataset.edgeType); });
	});
	document.getElementById("zoomIn").addEventListener("click", function () { zoomGraphBy(1.14); });
	document.getElementById("zoomOut").addEventListener("click", function () { zoomGraphBy(1 / 1.14); });
	document.getElementById("fitGraph").addEventListener("click", resetGraphView);
	if ("ResizeObserver" in window) {
		new ResizeObserver(scheduleGraphDraw).observe(document.querySelector(".graph-body"));
	}

	els.canvas.addEventListener("wheel", function (event) {
		if (!els.graphSection.classList.contains("fullscreen")) return;
		event.preventDefault();
		var rect = els.canvas.getBoundingClientRect();
		var x = event.clientX - rect.left;
		var y = event.clientY - rect.top;
		var wheelZoom = event.deltaMode === 1 || (Math.abs(event.deltaY) >= 80 && Math.abs(event.deltaX) < 1);
		if (event.ctrlKey || event.metaKey || wheelZoom) {
			setGraphZoom(graphView.zoom * Math.exp(-event.deltaY * 0.0025), x, y);
			return;
		}
		panGraph(event.shiftKey ? -event.deltaY : -event.deltaX, event.shiftKey ? 0 : -event.deltaY);
	}, { passive: false });

	els.canvas.addEventListener("pointerdown", function (event) {
		if (!els.graphSection.classList.contains("fullscreen")) return;
		graphDrag.active = true;
		graphDrag.moved = false;
		graphDrag.lastX = event.clientX;
		graphDrag.lastY = event.clientY;
		if (els.canvas.setPointerCapture) els.canvas.setPointerCapture(event.pointerId);
		document.querySelector(".graph-body").classList.add("dragging");
		hideGraphPreview();
	});
	els.canvas.addEventListener("pointermove", function (event) {
		if (!graphDrag.active) {
			updateGraphPreviewFromPointer(event);
			return;
		}
		var dx = event.clientX - graphDrag.lastX;
		var dy = event.clientY - graphDrag.lastY;
		graphDrag.lastX = event.clientX;
		graphDrag.lastY = event.clientY;
		if (!dx && !dy) return;
		graphDrag.moved = true;
		panGraph(dx, dy);
	});
	els.canvas.addEventListener("pointerup", endGraphDrag);
	els.canvas.addEventListener("pointercancel", endGraphDrag);
	els.canvas.addEventListener("pointerleave", scheduleHideGraphPreview);
	els.graphPreview.addEventListener("mouseenter", cancelHideGraphPreview);
	els.graphPreview.addEventListener("mouseleave", scheduleHideGraphPreview);
	els.graphPreview.addEventListener("click", function (event) {
		var button = event.target.closest ? event.target.closest("[data-open-path]") : null;
		if (!button) return;
		selectDoc(button.dataset.openPath);
		collapseGraph();
		hideGraphPreview();
	});

	els.canvas.addEventListener("click", function (event) {
		if (graphDrag.moved) {
			graphDrag.moved = false;
			return;
		}
		var rect = els.canvas.getBoundingClientRect();
		var x = event.clientX - rect.left;
		var y = event.clientY - rect.top;
		for (var i = graphHitBoxes.length - 1; i >= 0; i--) {
			var box = graphHitBoxes[i];
			if (x >= box.x && x <= box.x + box.w && y >= box.y && y <= box.y + box.h && findDoc(box.id)) {
				selectDoc(box.id);
				hideGraphPreview();
				break;
			}
		}
	});
	window.addEventListener("resize", function () {
		if (model) scheduleGraphDraw();
		if (els.results.classList.contains("open")) positionSearchResults();
		if (projectMenuOpen) positionProjectDropdown();
	});

	function endGraphDrag(event) {
		if (!graphDrag.active) return;
		graphDrag.active = false;
		if (event && els.canvas.hasPointerCapture && els.canvas.hasPointerCapture(event.pointerId)) {
			els.canvas.releasePointerCapture(event.pointerId);
		}
		document.querySelector(".graph-body").classList.remove("dragging");
	}

	function updateGraphPreviewFromPointer(event) {
		if (!els.graphSection.classList.contains("fullscreen")) return;
		var rect = els.canvas.getBoundingClientRect();
		var x = event.clientX - rect.left;
		var y = event.clientY - rect.top;
		var box = graphBoxAt(x, y);
		els.canvas.style.cursor = box ? "pointer" : "grab";
		if (!box) {
			scheduleHideGraphPreview();
			return;
		}
		cancelHideGraphPreview();
		showGraphPreview(box);
	}

	function graphBoxAt(x, y) {
		for (var i = graphHitBoxes.length - 1; i >= 0; i--) {
			var box = graphHitBoxes[i];
			if (x >= box.x && x <= box.x + box.w && y >= box.y && y <= box.y + box.h) return box;
		}
		return null;
	}

	function showGraphPreview(box) {
		if (!box) return;
		if (graphHoveredId === box.id) return;
		graphHoveredId = box.id;
		var node = box.node || {};
		var doc = findDoc(box.id);
		var title = doc ? doc.title : node.title || node.label || box.id;
		var path = doc ? doc.path : node.path || box.id;
		var state = node.displayState || node.workflowState || node.docState || "reference";
		var text = doc ? graphPreviewExcerpt(doc.body || doc.subtitle || "") : graphPreviewExcerpt(node.subtitle || node.title || node.path || "");
		els.graphPreview.innerHTML =
			'<div class="graph-preview-title">' + escapeHtml(title) + '</div>' +
			'<div class="graph-preview-path">' + escapeHtml(path) + " · " + escapeHtml(state) + '</div>' +
			'<div class="graph-preview-text">' + escapeHtml(text || "No preview text available.") + '</div>' +
			(doc ? '<div class="graph-preview-actions"><button class="graph-preview-open" type="button" data-open-path="' + escapeHtml(doc.path) + '">Open in viewer</button></div>' : "");
		els.graphPreview.classList.add("open");
		els.graphPreview.setAttribute("aria-hidden", "false");
		positionGraphPreview(box);
	}

	function positionGraphPreview(box) {
		if (!box || !els.graphPreview.classList.contains("open")) return;
		var body = document.querySelector(".graph-body").getBoundingClientRect();
		var preview = els.graphPreview.getBoundingClientRect();
		var left = box.x + box.w + 14;
		var top = box.y;
		if (left + preview.width + 12 > body.width) left = box.x - preview.width - 14;
		left = Math.max(12, Math.min(left, body.width - preview.width - 12));
		top = Math.max(12, Math.min(top, body.height - preview.height - 12));
		els.graphPreview.style.setProperty("--graph-preview-left", Math.round(left) + "px");
		els.graphPreview.style.setProperty("--graph-preview-top", Math.round(top) + "px");
	}

	function scheduleHideGraphPreview() {
		if (graphPreviewHideTimer) clearTimeout(graphPreviewHideTimer);
		graphPreviewHideTimer = setTimeout(hideGraphPreview, 120);
	}

	function cancelHideGraphPreview() {
		if (!graphPreviewHideTimer) return;
		clearTimeout(graphPreviewHideTimer);
		graphPreviewHideTimer = 0;
	}

	function hideGraphPreview() {
		cancelHideGraphPreview();
		graphHoveredId = null;
		if (!els || !els.graphPreview) return;
		els.graphPreview.classList.remove("open");
		els.graphPreview.setAttribute("aria-hidden", "true");
		els.canvas.style.cursor = "grab";
	}

	function zoomGraphBy(factor) {
		var rect = els.canvas.getBoundingClientRect();
		setGraphZoom(graphView.zoom * factor, rect.width / 2, rect.height / 2);
	}

	function setGraphZoom(nextZoom, anchorX, anchorY) {
		var rect = els.canvas.getBoundingClientRect();
		if (!rect.width || !rect.height) return;
		var oldZoom = graphView.zoom;
		var next = Math.max(.25, Math.min(3, nextZoom));
		var offsetX = (1 - oldZoom) * rect.width / 2 + graphView.panX;
		var offsetY = (1 - oldZoom) * rect.height / 2 + graphView.panY;
		var worldX = (anchorX - offsetX) / oldZoom;
		var worldY = (anchorY - offsetY) / oldZoom;
		graphView.zoom = next;
		graphView.panX = anchorX - worldX * next - (1 - next) * rect.width / 2;
		graphView.panY = anchorY - worldY * next - (1 - next) * rect.height / 2;
		scheduleGraphDraw();
	}

	function panGraph(dx, dy) {
		graphView.panX += dx;
		graphView.panY += dy;
		scheduleGraphDraw();
	}

	function resetGraphView() {
		graphView.zoom = 1;
		graphView.panX = 0;
		graphView.panY = 0;
		scheduleGraphDraw();
	}

	function toggleLegend() {
		var hidden = els.graphLegend.classList.toggle("hidden");
		els.legendToggle.setAttribute("aria-pressed", hidden ? "false" : "true");
		els.legendToggle.setAttribute("aria-label", hidden ? "显示图例" : "隐藏图例");
	}

	function toggleGraph() {
		if (els.graphSection.classList.contains("fullscreen")) collapseGraph();
		else expandGraph();
	}

	function expandGraph() {
		els.results.classList.remove("open");
		els.graphSection.classList.toggle("fullscreen", true);
		els.graphToggle.setAttribute("aria-expanded", "true");
		els.graphToggle.setAttribute("aria-label", "Collapse graph");
		els.graphToggle.textContent = "Collapse";
		scheduleGraphDraw();
	}

	function collapseGraph() {
		els.graphSection.classList.toggle("fullscreen", false);
		els.graphToggle.setAttribute("aria-expanded", "false");
		els.graphToggle.setAttribute("aria-label", "Expand graph");
		els.graphToggle.textContent = "Expand";
		graphHitBoxes = [];
		scheduleGraphDraw();
	}

	function scheduleGraphDraw() {
		if (graphDrawFrame) cancelAnimationFrame(graphDrawFrame);
		graphDrawFrame = requestAnimationFrame(function () {
			graphDrawFrame = 0;
			drawGraph();
		});
	}

	function visibleGraph() {
		if (!model || !model.graph) return { nodes: [], edges: [] };
		var nodeById = {};
		model.graph.nodes.forEach(function (node) { nodeById[node.id] = node; });
		var edges = model.graph.edges.filter(shouldShowGraphEdge);
		var visibleIds = new Set();
		if (graphMode === "all") addAllGraphNodes(visibleIds, edges, nodeById);
		else if (graphMode === "focus") addFocusedGraphNodes(visibleIds, edges, nodeById);
		else addOverviewGraphNodes(visibleIds, edges, nodeById);
		if (!visibleIds.size) addOverviewGraphNodes(visibleIds, edges, nodeById);
		var visibleEdges = edges.filter(function (edge) {
			return visibleIds.has(edge.from) && visibleIds.has(edge.to);
		});
		return {
			nodes: model.graph.nodes.filter(function (node) { return visibleIds.has(node.id); }),
			edges: visibleEdges
		};
	}

	function shouldShowGraphEdge(edge) {
		return graphEdgeTypes[edge.type] !== false;
	}

	function addAllGraphNodes(visibleIds, edges, nodeById) {
		var connected = new Set();
		edges.forEach(function (edge) {
			connected.add(edge.from);
			connected.add(edge.to);
		});
		model.graph.nodes.forEach(function (node) {
			if ((node.type === "code" || node.type === "scope") && !connected.has(node.id)) return;
			visibleIds.add(node.id);
		});
	}

	function addOverviewGraphNodes(visibleIds, edges, nodeById) {
		model.graph.nodes.forEach(function (node) {
			if (isGraphCoreNode(node)) visibleIds.add(node.id);
		});
		addSelectedGraphPath(visibleIds, nodeById);
		addGraphNeighbors(visibleIds, edges, nodeById, selectedPath);
		edges.forEach(function (edge) {
			var to = nodeById[edge.to];
			if (edge.type === "entries" && visibleIds.has(edge.from) && isGraphCoreNode(to)) {
				visibleIds.add(edge.to);
			}
		});
	}

	function addFocusedGraphNodes(visibleIds, edges, nodeById) {
		if (!selectedPath || !nodeById[selectedPath]) {
			addOverviewGraphNodes(visibleIds, edges, nodeById);
			return;
		}
		addSelectedGraphPath(visibleIds, nodeById);
		addGraphNeighbors(visibleIds, edges, nodeById, selectedPath);
	}

	function addGraphNeighbors(visibleIds, edges, nodeById, path) {
		if (!path || !nodeById[path]) return;
		visibleIds.add(path);
		edges.forEach(function (edge) {
			if (edge.from === path && nodeById[edge.to]) visibleIds.add(edge.to);
			if (edge.to === path && nodeById[edge.from]) visibleIds.add(edge.from);
		});
	}

	function addSelectedGraphPath(visibleIds, nodeById) {
		if (!selectedPath) return;
		if (nodeById[selectedPath]) visibleIds.add(selectedPath);
		if (selectedPath === "AGENTS.md") return;
		var parts = selectedPath.split("/");
		for (var i = 1; i < parts.length; i++) {
			var dir = parts.slice(0, i).join("/");
			var indexId = graphIndexForDir(dir, nodeById);
			if (indexId) visibleIds.add(indexId);
		}
	}

	function graphIndexForDir(dir, nodeById) {
		if (!dir) return null;
		var md = dir + "/index.md";
		var mdc = dir + "/index.mdc";
		if (nodeById[md]) return md;
		if (nodeById[mdc]) return mdc;
		return null;
	}

	function isGraphCoreNode(node) {
		if (!node) return false;
		return node.id === "AGENTS.md" || /^\\.axm\\/index\\.mdc?$/.test(node.id) || /^\\.axm\\/[^/]+\\/index\\.mdc?$/.test(node.id);
	}

	function drawGraph() {
		if (!model) return;
		var canvas = els.canvas;
		var rect = canvas.getBoundingClientRect();
		if (!els.graphSection.classList.contains("fullscreen") || rect.width < 2 || rect.height < 2) {
			graphHitBoxes = [];
			return;
		}
		var dpr = window.devicePixelRatio || 1;
		canvas.width = Math.max(1, Math.floor(rect.width * dpr));
		canvas.height = Math.max(1, Math.floor(rect.height * dpr));
		var ctx = canvas.getContext("2d");
		ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
		ctx.clearRect(0, 0, rect.width, rect.height);
		graphHitBoxes = [];
		if (!model.graph.nodes.length) {
			ctx.fillStyle = "#647184";
			ctx.font = "13px Inter, sans-serif";
			ctx.fillText("No graph data", 28, 48);
			return;
		}
		var graph = visibleGraph();
		var nodes = layoutGraph(graph.nodes, graph.edges, rect.width, rect.height);
		applyGraphTransform(ctx, dpr, rect.width, rect.height);
		graph.edges.forEach(function (edge) {
			var from = nodes[edge.from];
			var to = nodes[edge.to];
			if (!from || !to) return;
			var active = edge.from === selectedPath || edge.to === selectedPath;
			ctx.strokeStyle = active ? colors[edge.type] || colors.entries : edge.type === "related" ? "rgba(128,85,214,.58)" : "rgba(29,111,232,.52)";
			ctx.lineWidth = active ? 1.8 : 1.1;
			ctx.beginPath();
			ctx.moveTo(from.x + from.w / 2, from.y + from.h / 2);
			var midY = (from.y + to.y) / 2;
			ctx.bezierCurveTo(from.x + from.w / 2, midY, to.x + to.w / 2, midY, to.x + to.w / 2, to.y + to.h / 2);
			ctx.stroke();
			drawArrow(ctx, from, to, ctx.strokeStyle);
			if (active) drawEdgeLabel(ctx, edge, from, to);
		});
		Object.keys(nodes).forEach(function (id) {
			drawNode(ctx, nodes[id], id === selectedPath, rect.width, rect.height);
		});
		ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
	}

	function layoutGraph(nodeList, edges, width, height) {
		var byId = {};
		var levels = [[], [], [], [], []];
		nodeList.forEach(function (node) {
			var level = 3;
			if (node.id === "AGENTS.md") level = 0;
			else if (/^\\.axm\\/index\\.mdc?$/.test(node.id)) level = 1;
			else if (/^\\.axm\\/[^/]+\\/index\\.mdc?$/.test(node.id)) level = 2;
			else if (node.type === "code" || node.type === "scope") level = 4;
			levels[level].push(node);
		});
		var top = 26;
		var levelY = [];
		var nextY = top;
		levels.forEach(function (items, level) {
			levelY[level] = nextY;
			var baseW = graphColumnWidth(level);
			var usable = Math.max(baseW, width - (level === 3 ? 180 : 240));
			var minGap = level === 3 ? 56 : 44;
			var columns = Math.max(1, Math.floor((usable + minGap) / (baseW + minGap)));
			var rows = Math.max(1, Math.ceil(items.length / columns));
			nextY += rows * 86 + (level === 2 ? 62 : 44);
		});
		levels.forEach(function (items, level) {
			var baseW = graphColumnWidth(level);
			var usable = Math.max(baseW, width - (level === 3 ? 180 : 240));
			var minGap = level === 3 ? 56 : 44;
			var columns = Math.max(1, Math.floor((usable + minGap) / (baseW + minGap)));
			items.forEach(function (node, index) {
				var size = nodeSizeForGraph(node);
				var w = size.w;
				var col = index % columns;
				var row = Math.floor(index / columns);
				var usedColumns = Math.min(columns, items.length - row * columns);
				var rowWidth = usedColumns * baseW + Math.max(0, usedColumns - 1) * minGap;
				var rowStart = Math.max(28, width / 2 - rowWidth / 2);
				var x = rowStart + col * (baseW + minGap) + (baseW - w) / 2;
				var y = levelY[level] + row * 80;
				byId[node.id] = {
					id: node.id,
					node: node,
					x: Math.max(18, Math.min(width - w - 18, x)),
					y: y,
					w: w,
					h: size.h
				};
			});
		});
		return byId;
	}

	function graphColumnWidth(level) {
		if (level === 2) return 188;
		if (level === 4) return 164;
		return 176;
	}

	function nodeSizeForGraph(node) {
		if (node.type === "code" || node.type === "scope") return { w: 156, h: 46 };
		if (node.id === "AGENTS.md") return { w: 176, h: 58 };
		if (node.type === "doc" && /\\/index\\.mdc?$/.test(node.id)) return { w: 184, h: 62 };
		return { w: 176, h: 62 };
	}

	function applyGraphTransform(ctx, dpr, width, height) {
		var xOffset = (1 - graphView.zoom) * width / 2 + graphView.panX;
		var yOffset = (1 - graphView.zoom) * height / 2 + graphView.panY;
		ctx.setTransform(dpr * graphView.zoom, 0, 0, dpr * graphView.zoom, dpr * xOffset, dpr * yOffset);
	}

	function screenBoxForGraph(box, width, height) {
		var xOffset = (1 - graphView.zoom) * width / 2 + graphView.panX;
		var yOffset = (1 - graphView.zoom) * height / 2 + graphView.panY;
		return {
			id: box.id,
			node: box.node,
			x: box.x * graphView.zoom + xOffset,
			y: box.y * graphView.zoom + yOffset,
			w: box.w * graphView.zoom,
			h: box.h * graphView.zoom
		};
	}

	function drawNode(ctx, box, active, screenWidth, screenHeight) {
		var node = box.node;
		var stateStyle = graphStateStyle(node);
		var fill = active ? "#e8f1ff" : stateStyle.fill;
		var stroke = active ? "#1d6fe8" : stateStyle.stroke;
		roundRect(ctx, box.x, box.y, box.w, box.h, 7, fill, stroke, active ? 2.2 : 1.4);
		ctx.fillStyle = colors[node.kind] || colors[node.type] || colors.index;
		ctx.beginPath();
		ctx.arc(box.x + 17, box.y + 19, active ? 6 : 4.5, 0, Math.PI * 2);
		ctx.fill();
		ctx.fillStyle = active ? "#0b55c7" : "#1f2937";
		ctx.font = "600 12px Inter, sans-serif";
		ctx.fillText(truncateToWidth(ctx, node.label || node.title, box.w - 58), box.x + 31, box.y + 20, box.w - 58);
		ctx.fillStyle = "#647184";
		ctx.font = "11px Inter, sans-serif";
		ctx.fillText(truncateToWidth(ctx, node.subtitle || node.path, box.w - 28), box.x + 14, box.y + 39, box.w - 28);
		drawNodeStatus(ctx, box, node, stateStyle, active);
		graphHitBoxes.push(screenBoxForGraph(box, screenWidth, screenHeight));
	}

	function graphStateStyle(node) {
		var state = String(node.displayState || node.workflowState || node.docState || "unknown");
		return stateStyles[state] || stateStyles.unknown;
	}

	function drawNodeStatus(ctx, box, node, style, active) {
		ctx.fillStyle = style.color;
		ctx.beginPath();
		ctx.arc(box.x + box.w - 14, box.y + 15, active ? 6 : 5, 0, Math.PI * 2);
		ctx.fill();
	}

	function drawArrow(ctx, from, to, color) {
		var x = to.x + to.w / 2;
		var y = to.y + to.h / 2;
		ctx.fillStyle = color;
		ctx.beginPath();
		ctx.moveTo(x, y);
		ctx.lineTo(x - 5, y - 4);
		ctx.lineTo(x - 2, y + 6);
		ctx.closePath();
		ctx.fill();
	}

	function drawEdgeLabel(ctx, edge, from, to) {
		ctx.fillStyle = colors[edge.type] || colors.entries;
		ctx.font = "11px Inter, sans-serif";
		ctx.fillText(edge.label || edge.type, (from.x + to.x) / 2, (from.y + to.y) / 2 - 4);
	}

	function roundRect(ctx, x, y, w, h, r, fill, stroke, lineWidth) {
		ctx.beginPath();
		ctx.moveTo(x + r, y);
		ctx.lineTo(x + w - r, y);
		ctx.quadraticCurveTo(x + w, y, x + w, y + r);
		ctx.lineTo(x + w, y + h - r);
		ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
		ctx.lineTo(x + r, y + h);
		ctx.quadraticCurveTo(x, y + h, x, y + h - r);
		ctx.lineTo(x, y + r);
		ctx.quadraticCurveTo(x, y, x + r, y);
		ctx.closePath();
		ctx.fillStyle = fill;
		ctx.fill();
		ctx.strokeStyle = stroke;
		ctx.lineWidth = lineWidth;
		ctx.stroke();
	}

	function truncate(text, max) {
		text = String(text || "");
		return text.length > max ? text.slice(0, max - 1) + "…" : text;
	}

	function truncateToWidth(ctx, text, maxWidth) {
		text = String(text || "");
		if (ctx.measureText(text).width <= maxWidth) return text;
		var out = text;
		while (out.length > 1 && ctx.measureText(out + "…").width > maxWidth) {
			out = out.slice(0, -1);
		}
		return out + "…";
	}

	function graphPreviewExcerpt(text) {
		var tick = String.fromCharCode(96);
		var axmMeta = new RegExp("^<!-- axm-meta[\\\\s\\\\S]*?-->\\\\s*");
		var frontmatter = new RegExp("^---[\\\\s\\\\S]*?---\\\\s*");
		var codeFence = new RegExp(tick + tick + tick + "[\\\\s\\\\S]*?" + tick + tick + tick, "g");
		var inlineCode = new RegExp(tick + "([^" + tick + "]+)" + tick, "g");
		var heading = new RegExp("^#+\\\\s+", "gm");
		var bold = new RegExp("\\\\*\\\\*([^*]+)\\\\*\\\\*", "g");
		var link = new RegExp("\\\\[([^\\\\]]+)\\\\]\\\\([^)]+\\\\)", "g");
		var whitespace = new RegExp("\\\\s+", "g");
		return truncate(String(text || "")
			.replace(axmMeta, "")
			.replace(frontmatter, "")
			.replace(codeFence, " ")
			.replace(heading, "")
			.replace(inlineCode, "$1")
			.replace(bold, "$1")
			.replace(link, "$1")
			.replace(whitespace, " ")
			.trim(), 240);
	}

	function iconSvg(name, size) {
		var paths = iconPaths[name] || iconPaths.file;
		return '<svg class="lucide lucide-' + escapeHtml(name) + '" width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' + paths + '</svg>';
	}

	function escapeHtml(value) {
		return String(value == null ? "" : value)
			.replace(/&/g, "&amp;")
			.replace(/</g, "&lt;")
			.replace(/>/g, "&gt;")
			.replace(/"/g, "&quot;")
			.replace(/'/g, "&#039;");
	}
})();
</script>
</body>
</html>`;
}
