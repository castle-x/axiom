import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, test } from "node:test";

import { buildPreviewModel } from "../scripts/_lib/preview-data.mjs";
import { buildPreviewHtml } from "../scripts/_lib/preview-page.mjs";
import { validateAxmProject } from "../scripts/_lib/validation.mjs";
import { createPreviewServer } from "../scripts/preview.mjs";

const tempRoots = [];

afterEach(() => {
	for (const root of tempRoots.splice(0)) {
		fs.rmSync(root, { recursive: true, force: true });
	}
});

function makeTempRepo() {
	const root = fs.mkdtempSync(path.join(os.tmpdir(), "axm-preview-test-"));
	tempRoots.push(root);
	fs.mkdirSync(path.join(root, ".axm", "universal"), { recursive: true });
	fs.writeFileSync(path.join(root, "README.md"), "# Smoke\n", "utf8");
	fs.writeFileSync(
		path.join(root, "AGENTS.md"),
		[
			"# AGENTS.md",
			"",
			"## Knowledge Index",
			"",
			"| 任务类型 | 读哪里 |",
			"| --- | --- |",
			"| 写文档 | `.axm/universal/docs.md` |",
			"",
		].join("\n"),
		"utf8",
	);
	writeDoc(
		root,
		".axm/index.md",
		{
			status: "active",
			"last-reviewed": "2026-05-15",
			owner: "axm-core",
			entries: [
				{ path: "universal/", title: "通用规范", "when-to-read": "跨项目通用规则" },
			],
		},
		"# .axm\n\nRoot index.",
	);
	writeDoc(
		root,
		".axm/universal/index.md",
		{
			status: "active",
			"last-reviewed": "2026-05-15",
			owner: "axm-core",
			entries: [
				{ path: "docs.md", title: "文档规范", "when-to-read": "写 axm 文档" },
				{ path: "devloop.md", title: "DEVLOOP", "when-to-read": "开发流程" },
			],
		},
		"# universal\n\nUniversal index.",
	);
	writeDoc(
		root,
		".axm/universal/docs.md",
		{
			status: "active",
			"last-reviewed": "2026-05-15",
			owner: "axm-core",
			"applies-to": ["universal"],
			related: ["./devloop.md"],
			"code-refs": ["README.md"],
		},
		"# 文档规范\n\n本文定义 axm metadata 与文档关系。",
	);
	writeDoc(
		root,
		".axm/universal/devloop.md",
		{
			status: "draft",
			"last-reviewed": "2026-05-15",
			owner: "axm-core",
			"applies-to": ["universal"],
		},
		"# DEVLOOP\n\n状态机。",
	);
	return root;
}

function writeDoc(root, relPath, meta, body) {
	const abs = path.join(root, relPath);
	fs.mkdirSync(path.dirname(abs), { recursive: true });
	fs.writeFileSync(abs, `${renderMeta(meta)}\n\n${body}\n`, "utf8");
}

function renderMeta(meta) {
	const lines = ["<!-- axm-meta"];
	for (const [key, value] of Object.entries(meta)) {
		if (Array.isArray(value)) {
			if (value.every((item) => typeof item === "string")) {
				lines.push(`${key}:`);
				for (const item of value) lines.push(`  - ${item}`);
			} else {
				lines.push(`${key}:`);
				for (const item of value) {
					const entries = Object.entries(item);
					const [firstKey, firstValue] = entries[0];
					lines.push(`  - ${firstKey}: ${firstValue}`);
					for (const [childKey, childValue] of entries.slice(1)) {
						lines.push(`    ${childKey}: ${childValue}`);
					}
				}
			}
		} else {
			lines.push(`${key}: ${value}`);
		}
	}
	lines.push("-->");
	return lines.join("\n");
}

describe("AXM preview data model", () => {
	test("rejects targets without .axm", () => {
		const root = fs.mkdtempSync(path.join(os.tmpdir(), "axm-preview-empty-"));
		tempRoots.push(root);

		assert.throws(() => buildPreviewModel(root), /\.axm/);
	});

	test("builds read-only document tree, metadata summary, search index, and graph relations", () => {
		const root = makeTempRepo();

		const model = buildPreviewModel(root);
		const validation = validateAxmProject(root);

		assert.equal(model.target.name, path.basename(root));
		assert.equal(model.summary.docs, 5);
		assert.equal(model.summary.axmDocs, validation.scannedFiles);
		assert.equal(model.summary.agentsDocs, 1);
		assert.equal(model.summary.errors, 0);
		assert.deepEqual(model.validation.issues, validation.issues);
		assert.equal(model.tree.name, ".axm");
		assert.ok(model.tree.children.some((child) => child.name === "universal"));
		assert.deepEqual(
			model.tree.children.map((child) => child.name),
			["universal", "AGENTS.md", "index.md"],
		);

		const docs = model.documents.find((doc) => doc.path === ".axm/universal/docs.md");
		assert.equal(docs.title, "文档规范");
		assert.equal(docs.meta.status, "active");
		assert.match(docs.body, /metadata/);
		assert.ok(docs.searchText.includes("README.md"));
		const agents = model.documents.find((doc) => doc.path === "AGENTS.md");
		assert.equal(agents.kind, "agents");
		assert.match(agents.body, /Knowledge Index/);
		assert.ok(agents.searchText.includes(".axm/universal/docs.md"));

		assert.ok(
			model.graph.edges.some(
				(edge) =>
					edge.type === "entries" &&
					edge.from === ".axm/index.md" &&
					edge.to === ".axm/universal/index.md",
			),
		);
		assert.ok(
			model.graph.edges.some(
				(edge) =>
					edge.type === "related" &&
					edge.from === ".axm/universal/docs.md" &&
					edge.to === ".axm/universal/devloop.md",
			),
		);
		assert.ok(
			model.graph.edges.some(
				(edge) =>
					edge.type === "code-ref" &&
					edge.from === ".axm/universal/docs.md" &&
					edge.to === "README.md",
			),
		);
		assert.ok(
			model.graph.edges.some(
				(edge) =>
					edge.type === "applies-to" &&
					edge.from === ".axm/universal/docs.md" &&
					edge.to === "scope:universal",
			),
		);
		assert.ok(model.graph.nodes.some((node) => node.id === "AGENTS.md"));
		assert.ok(
			model.graph.edges.some(
				(edge) =>
					edge.type === "entries" &&
					edge.from === "AGENTS.md" &&
					edge.to === ".axm/index.md",
			),
		);
	});

	test("resolves directory entries to index.mdc in preview graph", () => {
		const root = fs.mkdtempSync(path.join(os.tmpdir(), "axm-preview-mdc-"));
		tempRoots.push(root);
		fs.mkdirSync(path.join(root, ".axm", "universal"), { recursive: true });
		fs.writeFileSync(
			path.join(root, "AGENTS.md"),
			[
				"# AGENTS.md",
				"",
				"## Knowledge Index",
				"",
				"| 任务类型 | 读哪里 |",
				"| --- | --- |",
				"| 写文档 | `.axm/universal/` |",
				"",
			].join("\n"),
			"utf8",
		);
		writeDoc(
			root,
			".axm/index.mdc",
			{
				status: "active",
				"last-reviewed": "2026-05-15",
				owner: "axm-core",
				entries: [
					{ path: "universal/", title: "通用规范", "when-to-read": "跨项目通用规则" },
				],
			},
			"# .axm\n\nRoot index.",
		);
		writeDoc(
			root,
			".axm/universal/index.mdc",
			{
				status: "active",
				"last-reviewed": "2026-05-15",
				owner: "axm-core",
				entries: [
					{ path: "docs.mdc", title: "文档规范", "when-to-read": "写 axm 文档" },
				],
			},
			"# universal\n\nUniversal index.",
		);
		writeDoc(
			root,
			".axm/universal/docs.mdc",
			{
				status: "active",
				"last-reviewed": "2026-05-15",
				owner: "axm-core",
				"applies-to": ["universal"],
			},
			"# 文档规范\n\n本文定义 axm metadata 与文档关系。",
		);

		const model = buildPreviewModel(root);

		assert.ok(model.graph.nodes.some((node) => node.id === ".axm/index.mdc" && node.label === ".axm/index.mdc"));
		assert.ok(
			model.graph.edges.some(
				(edge) =>
					edge.type === "entries" &&
					edge.from === "AGENTS.md" &&
					edge.to === ".axm/index.mdc",
			),
		);
		assert.ok(
			model.graph.edges.some(
				(edge) =>
					edge.type === "entries" &&
					edge.from === ".axm/index.mdc" &&
					edge.to === ".axm/universal/index.mdc",
			),
		);
		assert.ok(
			model.graph.edges.some(
				(edge) =>
					edge.type === "entries" &&
					edge.from === ".axm/universal/index.mdc" &&
					edge.to === ".axm/universal/docs.mdc",
			),
		);
	});
	});

describe("AXM preview HTTP server", () => {
	test("serves the preview shell and JSON model with read-only methods", async () => {
		const root = makeTempRepo();
		const server = createPreviewServer({ target: root });
		await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
		const { port } = server.address();
		const base = `http://127.0.0.1:${port}`;
		try {
			const html = await fetch(`${base}/`).then((res) => res.text());
			assert.match(html, /Axiom Preview/);
			assert.match(html, /graphCanvas/);
			assert.doesNotMatch(html, /<form\b/i);

			const model = await fetch(`${base}/api/model`).then((res) => res.json());
			assert.equal(model.summary.docs, 5);

			const denied = await fetch(`${base}/api/model`, { method: "POST" });
			assert.equal(denied.status, 405);
		} finally {
			await new Promise((resolve) => server.close(resolve));
		}
	});

	test("starts without a valid target and switches active targets at runtime", async () => {
		const invalidRoot = fs.mkdtempSync(path.join(os.tmpdir(), "axm-preview-invalid-target-"));
		tempRoots.push(invalidRoot);
		const firstRoot = makeTempRepo();
		const secondRoot = makeTempRepo();
		const server = createPreviewServer({ target: invalidRoot });
		await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
		const { port } = server.address();
		const base = `http://127.0.0.1:${port}`;
		try {
			const missing = await fetch(`${base}/api/model`);
			assert.equal(missing.status, 409);
			assert.equal((await missing.json()).error, "target_not_selected");

			const first = await fetch(`${base}/api/target`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ path: firstRoot }),
			});
			assert.equal(first.status, 200);
			assert.equal((await first.json()).target.path, firstRoot);

			const second = await fetch(`${base}/api/target`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ path: secondRoot }),
			});
			assert.equal(second.status, 200);
			assert.equal((await second.json()).target.path, secondRoot);

			const current = await fetch(`${base}/api/model`).then((res) => res.json());
			assert.equal(current.target.path, secondRoot);

			const invalid = await fetch(`${base}/api/target`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ path: invalidRoot }),
			});
			assert.equal(invalid.status, 400);
			assert.equal((await invalid.json()).error, "target_missing_axm");
		} finally {
			await new Promise((resolve) => server.close(resolve));
		}
	});

	test("preview html contains the expected app regions and no write-action copy", () => {
		const html = buildPreviewHtml();

		assert.match(html, /id="fileTree"/);
		assert.match(html, /id="markdownView"/);
		assert.match(html, /id="metaPanel"/);
		assert.match(html, /id="graphCanvas"/);
		assert.match(html, /id="searchInput"/);
		assert.match(html, /id="projectCurrent"/);
		assert.match(html, /id="projectName"/);
		assert.match(html, /id="projectDropdown"/);
		assert.match(html, /id="openProject"/);
		assert.match(html, /id="manualProject"/);
		assert.match(html, /id="pathDialog"/);
		assert.match(html, /id="projectPathInput"/);
		assert.match(html, /axmPreview:recentProjects/);
		assert.match(html, /fetchJson\("\/api\/target"/);
		assert.doesNotMatch(html, /fetchJson\("\/api\/pick-target"/);
		assert.doesNotMatch(html, /window\.prompt/);
		assert.doesNotMatch(html, /<select class="project-select"/);
		assert.match(html, /--search-results-top/);
		assert.match(html, /--search-results-left/);
		assert.match(html, /--search-results-width/);
		assert.match(html, /--inspector-min-width: 380px/);
		assert.match(html, /--inspector-width: clamp\(380px, 32vw, 520px\)/);
		assert.match(html, /grid-template-columns: minmax\(240px, 280px\) minmax\(0, 1fr\)/);
		assert.match(html, /grid-template-columns: minmax\(0, 1fr\) minmax\(var\(--inspector-min-width\), var\(--inspector-width\)\)/);
		assert.match(html, /\.meta-table \{ width: 100%; table-layout: auto;/);
		assert.match(html, /\.meta-table th \{ width: 1%;[^}]*white-space: nowrap;[^}]*overflow-wrap: normal;[^}]*word-break: normal;/);
		assert.match(html, /\.meta-table td \{ min-width: 0; overflow-wrap: anywhere; \}/);
		assert.doesNotMatch(html, /\.meta-table th \{ width: 118px;/);
		assert.match(html, /function positionSearchResults\(\)/);
		assert.match(html, /closest\("\.searchbox"\)/);
		assert.match(html, /getBoundingClientRect\(\)/);
		assert.match(html, /setProperty\("--search-results-left"/);
		assert.match(html, /if \(els\.results\.classList\.contains\("open"\)\) positionSearchResults\(\)/);
		assert.doesNotMatch(html, /right: clamp\(12px, 11vw, 190px\)/);
		assert.match(html, /id="validationRefresh"/);
		assert.match(html, /class="refresh-btn" id="validationRefresh"/);
		assert.match(html, /\.refresh-btn \{[\s\S]*border: 0;/);
		assert.ok(html.indexOf('<span class="chip \' + statusClassName') < html.indexOf('id="validationRefresh"'));
		assert.match(html, /refresh-cw/);
		assert.match(html, /Contract check/);
		assert.match(html, /function loadModel\(initial\)/);
		assert.match(html, /fetchJson\("\/api\/model", \{ cache: "no-store" \}\)/);
		assert.match(html, /loadModel\(false\)/);
		assert.match(html, /checked " \+ axmDocs \+ " \.axm doc files/);
		assert.match(html, /sanitizeMarkdownUrl\(href\)/);
		assert.match(html, /rel="noreferrer"/);
		assert.match(html, /\^\(https\?\|mailto\):/);
		assert.match(html, /return trimmed;/);
		assert.doesNotMatch(html, /return escapeHtml\(trimmed\);/);
		assert.doesNotMatch(html, /<a href="\$2">/);
		assert.match(html, /function statusClass\(value\)/);
		assert.match(html, /statusClass\(item\)/);
		assert.match(html, /statusClass\(value\)/);
		assert.match(html, /\^\[a-z0-9_-\]\+\$/i);
		assert.doesNotMatch(html, /key === "status" \? " " \+ item/);
		assert.match(html, /function renderIssueRows\(issues, emptyTitle, emptySub\)/);
		assert.match(html, /renderIssueRows\(allIssues/);
		assert.match(html, /All issues/);
		assert.match(html, /id="errorCount">0 errors/);
		assert.match(html, /class="stat-dot err"><\/span><span id="errorCount"/);
		assert.doesNotMatch(html, /class="stat-dot ok"><\/span><span id="errorCount"/);
		assert.doesNotMatch(html, /<span>validate\.mjs<\/span>/);
		assert.doesNotMatch(html, /class="icon-btn refresh-btn"/);
		assert.match(html, /findDoc\("\.axm\/index\.mdc"\)/);
		assert.match(html, /index\\\.mdc\?/);
		assert.match(html, /doc\.kind === "agents"\) return "AGENTS\.md"/);
		assert.doesNotMatch(html, /\b(save|delete|edit|upload|write|run command)\b/i);
	});

	test("preview chrome uses Axiom branding, lucide icons, and drawer graph controls", () => {
		const html = buildPreviewHtml();

		assert.match(html, /Axiom Preview/);
		assert.doesNotMatch(html, /AXM Preview/);
		assert.match(html, /id="projectName"/);
		assert.doesNotMatch(html, /aria-label="设置"/);
		assert.doesNotMatch(html, /lucide-settings/);
		assert.match(html, /class="[^"]*lucide lucide-search/);
		assert.match(html, /file-text/);
		assert.match(html, /graph-drawer/);
		assert.match(html, /id="legendToggle"/);
		assert.match(html, /class="icon-btn graph-toggle-btn" id="graphToggle"/);
		assert.match(html, /aria-label="Expand graph"/);
		assert.match(html, /aria-label", "Collapse graph"/);
		assert.match(html, />Expand<\/button>/);
		assert.match(html, /textContent = "Collapse"/);
		assert.match(html, /textContent = "Expand"/);
		assert.doesNotMatch(html, /panel-bottom-open/);
		assert.doesNotMatch(html, /panel-bottom-close/);
		assert.ok(html.indexOf('id="fitGraph"') < html.indexOf('id="zoomOut"'));
		assert.ok(html.indexOf('id="graphToggle"') > html.indexOf('id="zoomIn"'));
		assert.match(html, /aria-pressed="true"/);
		assert.match(html, /\.legend\.hidden/);
		assert.match(html, /rgba\(255,255,255,\.72\)/);
		assert.match(html, /graphView = \{ zoom: 1, panX: 0, panY: 0 \}/);
		assert.match(html, /function setGraphZoom/);
		assert.match(html, /function panGraph/);
		assert.match(html, /function toggleLegend/);
		assert.match(html, /addEventListener\("wheel"/);
		assert.match(html, /addEventListener\("pointerdown"/);
		assert.doesNotMatch(html, /id="graphFullscreen"/);
		assert.doesNotMatch(html, /graphFullscreen/);
		assert.match(html, /classList\.toggle\("fullscreen"/);
		assert.doesNotMatch(html, />[↻⌁»⌄−+▱▤◈◧▣]<\//);
	});

	test("preview file tree is a compact VS Code style collapsible outline", () => {
		const html = buildPreviewHtml();

		assert.match(html, /treeCollapsed = new Set/);
		assert.match(html, /function toggleTreeNode/);
		assert.match(html, /aria-expanded/);
		assert.match(html, /renderTreeChildren\(model\.tree\.children \|\| \[\], 0, els\.tree\)/);
		assert.match(html, /--tree-indent/);
		assert.match(html, /id="sideRootLabel"/);
		assert.match(html, /\/\.axm"/);
		assert.match(html, /--content-head-height: 48px/);
		assert.match(html, /grid-template-rows: var\(--content-head-height\) 1fr 44px/);
		assert.match(html, /grid-template-rows: var\(--content-head-height\) minmax\(0, 1fr\)/);
		assert.match(html, /function treeDisplayName\(node\)/);
		assert.match(html, /\.\.\/AGENTS\.md/);
		assert.ok(html.includes("escapeHtml(treeDisplayName(node)) + '</span>'"));
		assert.ok(!html.includes("escapeHtml(node.name) + '/</span>'"));
		assert.match(html, /min-height: 26px/);
		assert.match(html, /padding: 1px 0/);
		assert.match(html, /\.tree-row\.active \.tree-name \{ color: var\(--accent\); \}/);
		assert.match(html, /\.tree-disclosure\.placeholder \{ opacity: 0; \}/);
		assert.doesNotMatch(html, /\.tree-row \{[^}]*height: 24px;[^}]*\}/);
		assert.doesNotMatch(html, /\.tree-row \{[^}]*overflow: hidden;[^}]*\}/);
		assert.doesNotMatch(html, /\.tree-row\.active \{[^}]*background:[^}]*\}/);
		assert.doesNotMatch(html, /\.tree-row\.active \{[^}]*box-shadow:[^}]*\}/);
		assert.doesNotMatch(html, /tree-disclosure empty/);
		assert.doesNotMatch(html, /tree-subtitle/);
	});
});
