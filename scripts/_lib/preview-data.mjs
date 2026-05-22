import fs from "node:fs";
import path from "node:path";
import { parseFrontmatter } from "./frontmatter.mjs";
import { validateAxmProject } from "./validation.mjs";
import { walkAxm } from "./axm-walker.mjs";

export function buildPreviewModel(target = ".") {
	const repoRoot = path.resolve(target);
	const axmRoot = path.join(repoRoot, ".axm");
	if (!fs.existsSync(axmRoot)) {
		throw new Error(`.axm 目录不存在于 ${repoRoot}`);
	}

	const documents = readDocuments(axmRoot, repoRoot);
	const documentMap = new Map(documents.map((doc) => [doc.path, doc]));
	const tree = buildTree(documents);
	const graph = buildGraph({ documents, documentMap, repoRoot });
	const validation = validateAxmProject(repoRoot);
	const bugs = buildBugInventory(documents);
	const summary = buildSummary(documents, validation, bugs);

	return {
		version: 1,
		generatedAt: new Date().toISOString(),
		target: {
			path: repoRoot,
			name: path.basename(repoRoot),
		},
		summary,
		tree,
		documents,
		graph,
		bugs,
		validation,
	};
}

function readDocuments(axmRoot, repoRoot) {
	const documents = walkAxm(axmRoot, repoRoot)
		.sort((a, b) => normalizePath(a.relPath).localeCompare(normalizePath(b.relPath)))
		.map((file) => readDocument(file));
	const agentsPath = path.join(repoRoot, "AGENTS.md");
	if (fs.existsSync(agentsPath)) {
		documents.push(readAgentsDocument(agentsPath));
	}
	return documents;
}

function readAgentsDocument(absPath) {
	const raw = fs.readFileSync(absPath, "utf8");
	const relPath = "AGENTS.md";
	const title = inferTitle(raw, relPath);
	const subtitle = inferSubtitle(raw);
	const meta = { "doc-state": "current" };
	return {
		id: relPath,
		path: relPath,
		name: relPath,
		dir: ".",
		kind: "agents",
		title,
		subtitle,
		body: raw,
		raw,
		lineCount: raw.split(/\r?\n/).length,
		meta,
		metaKind: null,
		parseError: null,
		searchText: buildSearchText({ relPath, title, subtitle, body: raw, meta }),
	};
}

function readDocument(file) {
	const raw = fs.readFileSync(file.absPath, "utf8");
	const relPath = normalizePath(file.relPath);
	try {
		const parsed = parseFrontmatter(raw);
		const title = inferTitle(parsed.body, relPath);
		const subtitle = inferSubtitle(parsed.body);
		const meta = parsed.data ?? {};
		const lineCount = raw.split(/\r?\n/).length;
		return {
			id: relPath,
			path: relPath,
			name: path.posix.basename(relPath),
			dir: path.posix.dirname(relPath),
			kind: file.kind,
			title,
			subtitle,
			body: parsed.body,
			raw,
			lineCount,
			meta,
			hasMeta: parsed.hasMeta,
			metaKind: parsed.metaKind ?? null,
			parseError: null,
			searchText: buildSearchText({ relPath, title, subtitle, body: parsed.body, meta }),
		};
	} catch (error) {
		const body = stripMetadata(raw);
		const title = inferTitle(body, relPath);
		const subtitle = inferSubtitle(body);
		return {
			id: relPath,
			path: relPath,
			name: path.posix.basename(relPath),
			dir: path.posix.dirname(relPath),
			kind: file.kind,
			title,
			subtitle,
			body,
			raw,
			lineCount: raw.split(/\r?\n/).length,
			meta: {},
			hasMeta: true,
			metaKind: null,
			parseError: error.message,
			searchText: buildSearchText({ relPath, title, subtitle, body, meta: {} }),
		};
	}
}

function inferTitle(body, relPath) {
	const heading = body.match(/^#\s+(.+)$/m);
	if (heading) return heading[1].trim();
	return path.posix.basename(relPath);
}

function inferSubtitle(body) {
	for (const line of body.split(/\r?\n/)) {
		const trimmed = line.trim();
		if (!trimmed || trimmed.startsWith("#") || trimmed.startsWith("|") || trimmed.startsWith("```")) continue;
		return stripMarkdown(trimmed).slice(0, 90);
	}
	return "";
}

function stripMarkdown(s) {
	return s
		.replace(/`([^`]+)`/g, "$1")
		.replace(/\*\*([^*]+)\*\*/g, "$1")
		.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
}

function stripMetadata(raw) {
	return raw.replace(/^<!-- axm-meta[\s\S]*?-->\s*/, "").replace(/^---[\s\S]*?---\s*/, "");
}

function buildSearchText({ relPath, title, subtitle, body, meta }) {
	const metaText = [
		JSON.stringify(meta),
		meta["doc-state"],
		meta["workflow-state"],
		meta["state-updated"],
	].filter(Boolean).join("\n");
	const text = [relPath, title, subtitle, body, metaText].join("\n");
	return `${text}\n${text.toLowerCase()}`;
}

function buildTree(documents) {
	const root = {
		type: "dir",
		name: ".axm",
		path: ".axm",
		children: [],
		count: documents.length,
	};
	const dirMap = new Map([[root.path, root]]);

	for (const doc of documents) {
		const parts = doc.path.split("/");
		let current = root;
		let currentPath = parts[0];
		for (const part of parts.slice(1, -1)) {
			currentPath = `${currentPath}/${part}`;
			let next = dirMap.get(currentPath);
			if (!next) {
				next = { type: "dir", name: part, path: currentPath, children: [], count: 0 };
				dirMap.set(currentPath, next);
				current.children.push(next);
			}
			next.count++;
			current = next;
		}
		current.children.push({
			type: "doc",
			name: doc.name,
			path: doc.path,
			title: doc.title,
			subtitle: doc.subtitle,
			kind: doc.kind,
			docState: docStateForDoc(doc),
			workflowState: workflowStateForDoc(doc),
			displayState: displayStateForDoc(doc),
		});
	}
	sortTree(root);
	return root;
}

function sortTree(node) {
	if (!node.children) return;
	node.children.sort((a, b) => {
		const aWeight = treeOrderWeight(a, node);
		const bWeight = treeOrderWeight(b, node);
		if (aWeight !== bWeight) return aWeight - bWeight;
		return a.name.localeCompare(b.name);
	});
	for (const child of node.children) sortTree(child);
}

function treeOrderWeight(node, parent) {
	if (parent?.path === ".axm") {
		const rootOrder = new Map([
			["universal", 0],
			["project", 1],
			["knowledge", 2],
			["progress", 3],
		]);
		if (node.type === "dir" && rootOrder.has(node.name)) return rootOrder.get(node.name);
		if (node.type === "dir") return 4;
		return 5;
	}
	if (node.type === "doc" && isIndexDocName(node.name)) return 0;
	const order = new Map([
		["universal", 1],
		["project", 2],
		["knowledge", 3],
		["progress", 4],
	]);
	if (node.type === "dir" && order.has(node.name)) return order.get(node.name);
	if (node.type === "dir") return 5;
	return 6;
}

function buildGraph({ documents, documentMap, repoRoot }) {
	const nodes = new Map();
	const edges = [];
	const addNode = (node) => {
		if (!nodes.has(node.id)) nodes.set(node.id, node);
	};
	const addEdge = (edge) => {
		if (!edge.from || !edge.to || edge.from === edge.to) return;
		const key = `${edge.from}\u0000${edge.to}\u0000${edge.type}`;
		if (edges.some((existing) => existing.key === key)) return;
		edges.push({ key, ...edge });
	};

	for (const doc of documents) {
		addNode({
			id: doc.path,
			type: "doc",
			path: doc.path,
			label: labelForDoc(doc),
			title: doc.title,
			subtitle: doc.subtitle,
			kind: doc.kind,
			docState: docStateForDoc(doc),
			workflowState: workflowStateForDoc(doc),
			displayState: displayStateForDoc(doc),
		});
	}

	if (fs.existsSync(path.join(repoRoot, "AGENTS.md"))) {
		addNode({
			id: "AGENTS.md",
			type: "root",
			path: "AGENTS.md",
			label: "AGENTS.md",
			title: "AGENTS.md",
			subtitle: "AI 开发上下文入口",
			displayState: "current",
		});
		const rootIndexPath = resolveIndexDocPath(".axm", documentMap);
		if (rootIndexPath) {
			addEdge({ from: "AGENTS.md", to: rootIndexPath, type: "entries", label: "routes" });
		}
	}

	for (const doc of documents) {
		const entries = Array.isArray(doc.meta.entries) ? doc.meta.entries : [];
		for (const entry of entries) {
			const target = resolveAxmRef(doc.path, entry.path, documentMap);
			if (target) addEdge({ from: doc.path, to: target, type: "entries", label: "entries" });
		}

		const related = Array.isArray(doc.meta.related) ? doc.meta.related : [];
		for (const ref of related) {
			const target = resolveAxmRef(doc.path, ref, documentMap);
			if (target) addEdge({ from: doc.path, to: target, type: "related", label: "related" });
		}

		const codeRefs = Array.isArray(doc.meta["code-refs"]) ? doc.meta["code-refs"] : [];
		for (const ref of codeRefs) {
			if (typeof ref !== "string" || ref.trim() === "") continue;
			const id = normalizePath(ref);
			addNode({
				id,
				type: "code",
				path: id,
				label: path.posix.basename(id),
				title: id,
				subtitle: "code-ref",
				displayState: fs.existsSync(path.join(repoRoot, ref)) ? "current" : "missing",
			});
			addEdge({ from: doc.path, to: id, type: "code-ref", label: "code-ref" });
		}

		const scopes = Array.isArray(doc.meta["applies-to"]) ? doc.meta["applies-to"] : [];
		for (const scope of scopes) {
			if (typeof scope !== "string" || scope.trim() === "") continue;
			const id = `scope:${scope}`;
			addNode({
				id,
				type: "scope",
				path: id,
				label: `[${scope}]`,
				title: scope,
				subtitle: "applies-to",
				displayState: "current",
			});
			addEdge({ from: doc.path, to: id, type: "applies-to", label: "applies-to" });
		}
	}

	return {
		nodes: Array.from(nodes.values()),
		edges: edges.map(({ key, ...edge }) => edge),
	};
}

function labelForDoc(doc) {
	if (isIndexDocName(doc.name)) {
		const parent = path.posix.basename(path.posix.dirname(doc.path));
		return parent === ".axm" ? doc.path : `${parent}/`;
	}
	return doc.name;
}

function resolveAxmRef(fromDocPath, ref, documentMap) {
	if (typeof ref !== "string" || ref.trim() === "") return null;
	const cleaned = ref.replace(/#.*$/, "");
	let candidate;
	if (cleaned.startsWith(".axm/")) {
		candidate = normalizePath(cleaned);
	} else {
		const baseDir = path.posix.dirname(fromDocPath);
		candidate = path.posix.normalize(path.posix.join(baseDir, cleaned));
	}
	if (candidate.endsWith("/")) {
		const indexPath = resolveIndexDocPath(candidate.slice(0, -1), documentMap);
		if (indexPath) return indexPath;
	}
	if (!candidate.endsWith(".md") && !candidate.endsWith(".mdc")) {
		const indexPath = resolveIndexDocPath(candidate, documentMap);
		if (indexPath) return indexPath;
	}
	if (documentMap.has(candidate)) return candidate;
	const indexPath = resolveIndexDocPath(candidate, documentMap);
	if (indexPath) return indexPath;
	return candidate.startsWith(".axm/") ? candidate : null;
}

function resolveIndexDocPath(dirPath, documentMap) {
	const dir = dirPath.replace(/\/+$/, "");
	for (const name of ["index.md", "index.mdc"]) {
		const candidate = `${dir}/${name}`;
		if (documentMap.has(candidate)) return candidate;
	}
	return null;
}

function isIndexDocName(name) {
	return name === "index.md" || name === "index.mdc";
}

function buildSummary(documents, validation, bugs) {
	const byDocState = { current: 0, draft: 0, deprecated: 0, unknown: 0 };
	const byWorkflowState = {};
	for (const doc of documents) {
		const docState = docStateForDoc(doc);
		const workflowState = workflowStateForDoc(doc);
		if (docState in byDocState) byDocState[docState]++;
		else byDocState.unknown++;
		if (workflowState) byWorkflowState[workflowState] = (byWorkflowState[workflowState] ?? 0) + 1;
	}
	const agentsDocs = documents.filter((doc) => doc.kind === "agents").length;
	return {
		docs: documents.length,
		axmDocs: validation.scannedFiles,
		agentsDocs,
		errors: validation.errors,
		warnings: validation.warnings,
		bugs: bugs.openCount,
		status: validation.status,
		byDocState,
		byWorkflowState,
		lines: documents.reduce((sum, doc) => sum + doc.lineCount, 0),
	};
}

const OPEN_BUG_STATES = new Set(["open", "in-progress", "fixed", "verified", "reopened"]);

function buildBugInventory(documents) {
	const items = documents
		.filter((doc) => isBugDoc(doc))
		.map((doc) => bugItemForDoc(doc));
	const byState = {};
	for (const item of items) {
		byState[item.state] = (byState[item.state] ?? 0) + 1;
	}
	const openCount = items.filter((item) => item.open).length;
	return {
		open: openCount,
		openCount,
		total: items.length,
		byState,
		items,
	};
}

function isBugDoc(doc) {
	return doc.meta["progress-type"] === "bug" || /^\.axm\/progress\/[^/]+\/bugs\/bug-\d{4}-\d{2}-\d{2}-[a-z0-9]+(?:-[a-z0-9]+)*\.md$/.test(doc.path);
}

function bugItemForDoc(doc) {
	const state = workflowStateForDoc(doc) ?? "unknown";
	const priority = doc.meta.priority ?? extractBodyField(doc.body, "priority") ?? "";
	const severity = doc.meta.severity ?? extractBodyField(doc.body, "severity") ?? "";
	return {
		path: doc.path,
		title: doc.title,
		subtitle: doc.subtitle,
		initiative: doc.meta.initiative ?? inferInitiative(doc.path),
		state,
		open: OPEN_BUG_STATES.has(state),
		stateUpdated: doc.meta["state-updated"] ?? "",
		priority,
		severity,
		excerpt: bugExcerpt(doc.body),
		searchText: [doc.searchText, priority, severity].filter(Boolean).join("\n").toLowerCase(),
	};
}

function inferInitiative(relPath) {
	const parts = relPath.split("/");
	return parts[2] === "progress" ? parts[3] ?? "" : "";
}

function extractBodyField(body, field) {
	const pattern = new RegExp(`^\\|\\s*${field}\\s*\\|\\s*([^|]+?)\\s*\\|`, "im");
	const match = body.match(pattern);
	return match ? stripMarkdown(match[1].trim()) : null;
}

function bugExcerpt(body) {
	for (const line of body.split(/\r?\n/)) {
		const trimmed = line.trim();
		if (!trimmed || trimmed.startsWith("#") || trimmed.startsWith("|") || trimmed.startsWith("```")) continue;
		return stripMarkdown(trimmed).slice(0, 140);
	}
	return "";
}

function docStateForDoc(doc) {
	return doc.meta["doc-state"] ?? "unknown";
}

function workflowStateForDoc(doc) {
	return doc.meta["workflow-state"] ?? null;
}

function displayStateForDoc(doc) {
	return workflowStateForDoc(doc) ?? docStateForDoc(doc) ?? "unknown";
}

function normalizePath(p) {
	return p.split(path.sep).join("/");
}
