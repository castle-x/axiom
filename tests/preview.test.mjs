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

	test("preview html contains the expected app regions and no write-action copy", () => {
		const html = buildPreviewHtml();

		assert.match(html, /id="fileTree"/);
		assert.match(html, /id="markdownView"/);
		assert.match(html, /id="metaPanel"/);
		assert.match(html, /id="graphCanvas"/);
		assert.match(html, /id="searchInput"/);
		assert.match(html, /id="validationRefresh"/);
		assert.match(html, /refresh-cw/);
		assert.match(html, /Contract check/);
		assert.match(html, /function loadModel\(initial\)/);
		assert.match(html, /fetch\("\/api\/model", \{ cache: "no-store" \}\)/);
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
		assert.match(html, /findDoc\("\.axm\/index\.mdc"\)/);
		assert.match(html, /index\\\.mdc\?/);
		assert.match(html, /doc\.kind === "agents"\) return "AGENTS\.md"/);
		assert.doesNotMatch(html, /\b(save|delete|edit|upload|write|run command)\b/i);
	});

	test("preview chrome uses Axiom branding, lucide icons, and drawer graph controls", () => {
		const html = buildPreviewHtml();

		assert.match(html, /Axiom Preview/);
		assert.doesNotMatch(html, /AXM Preview/);
		assert.doesNotMatch(html, /id="projectName"/);
		assert.doesNotMatch(html, /aria-label="设置"/);
		assert.doesNotMatch(html, /lucide-settings/);
		assert.match(html, /class="[^"]*lucide lucide-search/);
		assert.match(html, /panel-bottom-close/);
		assert.match(html, /file-text/);
		assert.match(html, /graph-drawer/);
		assert.match(html, /id="legendToggle"/);
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
		assert.ok(html.includes("escapeHtml(node.name) + '</span>'"));
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
