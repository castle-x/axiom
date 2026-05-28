import fs from "node:fs";
import path from "node:path";
import { parseFrontmatter } from "./frontmatter.mjs";
import { walkAxm } from "./axm-walker.mjs";

const VALID_DOC_STATE = new Set(["current", "draft", "deprecated"]);
const VALID_DEPTH = new Set(["overview", "deep"]);
const VALID_PROGRESS_TYPE = new Set(["roadmap", "spec", "decision", "bug"]);
const WORKFLOW_STATE_BY_PROGRESS_TYPE = {
	roadmap: new Set(["proposed", "ready", "in-progress", "blocked", "implemented", "verified", "closed", "deferred", "superseded"]),
	spec: new Set(["proposed", "ready", "in-progress", "blocked", "implemented", "verified", "closed", "deferred", "superseded"]),
	decision: new Set(["proposed", "accepted", "rejected", "superseded"]),
	bug: new Set(["open", "in-progress", "fixed", "verified", "closed", "reopened", "wont-fix", "duplicate"]),
};
const BUG_FILE_RE = /^bug-(\d{4}-\d{2}-\d{2})-[a-z0-9]+(?:-[a-z0-9]+)*\.md$/;

export function validateAxmProject(target = ".") {
	const repoRoot = path.resolve(target);
	const axmRoot = path.join(repoRoot, ".axm");
	if (!fs.existsSync(axmRoot)) {
		throw new Error(`.axm 目录不存在于 ${repoRoot}`);
	}

	const files = walkAxm(axmRoot, repoRoot);
	const issues = [];
	const add = (level, file, ruleRef, message, line) => {
		issues.push({ level, file, line, ruleRef, rule: ruleRef, message });
	};

	const parsedByFile = new Map();
	for (const file of files) {
		const parsed = checkFrontmatter(file, add);
		if (parsed) parsedByFile.set(file.relPath, parsed);
	}
	for (const file of files) checkBugContracts(file.relPath, parsedByFile.get(file.relPath)?.data ?? {}, add);
	checkBugDirectoryContracts(repoRoot, add);
	checkIndexSync(files, repoRoot, add);
	checkCodeRefs(files, repoRoot, add);
	checkAgentsRefs(repoRoot, add);

	const errors = issues.filter((issue) => issue.level === "error").length;
	const warnings = issues.filter((issue) => issue.level === "warn").length;
	return {
		repoRoot,
		axmRoot,
		files,
		scannedFiles: files.length,
		status: errors > 0 ? "error" : warnings > 0 ? "warn" : "pass",
		errors,
		warnings,
		issues,
	};
}

export function exitCodeForValidation(validation) {
	if (validation.errors > 0) return 1;
	if (validation.warnings > 0) return 2;
	return 0;
}

function checkFrontmatter(file, add) {
	const { relPath, absPath, kind } = file;
	let raw;
	try {
		raw = fs.readFileSync(absPath, "utf8");
	} catch (error) {
		add("error", relPath, "docs.md §二", `无法读取文件: ${error.message}`);
		return null;
	}
	let parsed;
	try {
		parsed = parseFrontmatter(raw);
	} catch (error) {
		add("error", relPath, "docs.md §二", `axm metadata 解析失败: ${error.message}`);
		return null;
	}
	if (!parsed.hasMeta) {
		add("error", relPath, "docs.md §二", "缺少 axm-meta 注释块（必须以 <!-- axm-meta 开头）");
		return null;
	}
	if (parsed.metaKind === "frontmatter") {
		add("warn", relPath, "docs.md §二", "仍使用旧 YAML frontmatter；建议迁移到隐藏的 <!-- axm-meta --> 注释块");
	}

	const data = parsed.data;
	checkCommonMeta(relPath, data, add);
	if (kind === "index") checkIndexMeta(relPath, data, add);
	else if (kind === "universal" || kind === "project") checkSpecMeta(relPath, data, add);
	else if (kind === "knowledge") checkKnowledgeMetaFields(relPath, data, add);
	else if (kind === "progress") checkProgressMeta(relPath, data, add);
	return parsed;
}

function checkCommonMeta(relPath, data, add) {
	if (Object.hasOwn(data, "status")) {
		add("error", relPath, "docs.md §二", "legacy status field is not supported; use doc-state");
	}
	if (!data["doc-state"]) add("error", relPath, "docs.md §二", "metadata 缺少 doc-state");
	else if (!VALID_DOC_STATE.has(data["doc-state"])) add("error", relPath, "docs.md §二", `doc-state 非法：${data["doc-state"]}（应为 current/draft/deprecated）`);
	if (!data["last-reviewed"]) add("error", relPath, "docs.md §二", "metadata 缺少 last-reviewed");
	else if (!isDate(data["last-reviewed"])) add("error", relPath, "docs.md §三.4", `last-reviewed 日期格式非法：${data["last-reviewed"]}（应为 YYYY-MM-DD）`);
	if (!data.owner) add("error", relPath, "docs.md §二", "metadata 缺少 owner");
}

function checkIndexMeta(relPath, data, add) {
	const entries = data.entries;
	if (!Array.isArray(entries)) {
		add("error", relPath, "docs.md §二.C", "index 文档缺少 entries 列表");
		return;
	}
	entries.forEach((entry, index) => {
		if (!entry || typeof entry !== "object") {
			add("error", relPath, "docs.md §二.C", `entries[${index}] 不是对象`);
			return;
		}
		for (const key of ["path", "title", "when-to-read"]) {
			if (!entry[key]) add("error", relPath, "docs.md §二.C", `entries[${index}] 缺少字段 ${key}`);
		}
	});
}

function checkSpecMeta(relPath, data, add) {
	if (!data["applies-to"]) add("error", relPath, "docs.md §二.A", "规范文档缺少 applies-to");
	else if (!Array.isArray(data["applies-to"]) || data["applies-to"].length === 0) {
		add("error", relPath, "docs.md §二.A", "applies-to 必须为非空列表");
	}
}

function checkKnowledgeMetaFields(relPath, data, add) {
	if (!data.depth) add("error", relPath, "docs.md §二.B", "知识文档缺少 depth");
	else if (!VALID_DEPTH.has(data.depth)) add("error", relPath, "docs.md §二.B", `depth 非法：${data.depth}（应为 overview/deep）`);
	if (!Array.isArray(data["code-refs"]) || data["code-refs"].length === 0) {
		add("error", relPath, "docs.md §二.B", "知识文档 code-refs 必须为非空列表");
	}
}

function checkProgressMeta(relPath, data, add) {
	if (!data["progress-type"]) add("error", relPath, "docs.md §二.D", "进度文档缺少 progress-type");
	else if (!VALID_PROGRESS_TYPE.has(data["progress-type"])) {
		add("error", relPath, "docs.md §二.D", `progress-type 非法：${data["progress-type"]}（应为 roadmap/spec/decision/bug）`);
	}
	if (!data.initiative) add("error", relPath, "docs.md §二.D", "进度文档缺少 initiative");
	if (!data["workflow-state"]) add("error", relPath, "docs.md §二.D", "进度文档缺少 workflow-state");
	if (!data["state-updated"]) add("error", relPath, "docs.md §二.D", "进度文档缺少 state-updated");
	else if (!isStrictDate(data["state-updated"])) add("error", relPath, "docs.md §二.D", `state-updated 日期格式非法：${data["state-updated"]}（应为严格 YYYY-MM-DD）`);
	checkWorkflowState(relPath, data, workflowTypeForProgressDoc(relPath, data), add);
}

function workflowTypeForProgressDoc(relPath, data) {
	const info = bugPathInfo(relPath);
	if (info?.kind === "initiative-bug") {
		if (info.name === "log.md") return "roadmap";
		if (!isIndexDocName(info.name)) return "bug";
	}
	return data["progress-type"];
}

function checkWorkflowState(relPath, data, progressType, add) {
	if (!data["workflow-state"] || !VALID_PROGRESS_TYPE.has(progressType)) return;
	const validStates = WORKFLOW_STATE_BY_PROGRESS_TYPE[progressType];
	if (!validStates.has(data["workflow-state"])) {
		add(
			"error",
			relPath,
			"docs.md §二.D",
			`workflow-state 非法：${data["workflow-state"]}（progress-type: ${progressType} 应为 ${Array.from(validStates).join("/")})`,
		);
	}
}

function checkIndexSync(files, repoRoot, add) {
	const indexFiles = files.filter((file) => file.kind === "index");
	for (const indexFile of indexFiles) {
		const dir = path.dirname(indexFile.absPath);
		let raw;
		try {
			raw = fs.readFileSync(indexFile.absPath, "utf8");
		} catch {
			continue;
		}
		let parsed;
		try {
			parsed = parseFrontmatter(raw);
		} catch {
			continue;
		}
		const entries = Array.isArray(parsed.data.entries) ? parsed.data.entries : [];
		const declaredPaths = new Set(entries.map((entry) => entry?.path).filter(Boolean));
		let realChildren;
		try {
			realChildren = fs.readdirSync(dir, { withFileTypes: true });
		} catch {
			continue;
		}

		const actualItems = [];
		for (const child of realChildren) {
			if (child.isDirectory()) {
				actualItems.push(`${child.name}/`);
			} else if (child.isFile() && isAxmDocName(child.name) && !isIndexDocName(child.name)) {
				actualItems.push(child.name);
			}
		}
		const actualSet = new Set(actualItems);
		for (const item of declaredPaths) {
			if (!actualSet.has(item)) {
				add("error", indexFile.relPath, "docs.md §六", `entries 引用的子项不存在：${item}`);
			}
		}
		for (const item of actualItems) {
			if (!declaredPaths.has(item)) {
				add("warn", indexFile.relPath, "docs.md §六", `发现孤儿子项未登记到 entries：${item}`);
			}
		}
	}
}

function checkCodeRefs(files, repoRoot, add) {
	for (const file of files) {
		if (file.kind !== "knowledge") continue;
		let raw;
		try {
			raw = fs.readFileSync(file.absPath, "utf8");
		} catch {
			continue;
		}
		let parsed;
		try {
			parsed = parseFrontmatter(raw);
		} catch {
			continue;
		}
		const refs = Array.isArray(parsed.data["code-refs"]) ? parsed.data["code-refs"] : [];
		for (const ref of refs) {
			if (typeof ref !== "string") continue;
			const full = path.join(repoRoot, ref);
			if (!fs.existsSync(full)) {
				add("error", file.relPath, "docs.md §二.B", `code-refs 指向的源码不存在：${ref}`);
			} else if (fs.statSync(full).isDirectory()) {
				add("warn", file.relPath, "docs.md §二.B", `code-refs 指向的是目录而不是文件：${ref}`);
			}
		}
	}
}

function checkAgentsRefs(repoRoot, add) {
	const agentsPath = path.join(repoRoot, "AGENTS.md");
	if (!fs.existsSync(agentsPath)) {
		add("warn", "AGENTS.md", "docs.md §五", "AGENTS.md 不存在（跳过引用检查）");
		return;
	}
	const raw = fs.readFileSync(agentsPath, "utf8");
	const startMatch = raw.match(/^##\s+Knowledge Index\s*$/m);
	if (!startMatch) {
		add("warn", "AGENTS.md", "docs.md §五", "未找到 '## Knowledge Index' 段（跳过引用检查）");
		return;
	}
	const startIdx = startMatch.index + startMatch[0].length;
	const nextH2 = raw.slice(startIdx).match(/^##\s+/m);
	const section = nextH2 ? raw.slice(startIdx, startIdx + nextH2.index) : raw.slice(startIdx);
	const regex = /`(\.axm\/[^`\s<>]+\.(?:md|mdc)(?:#[^`\s<>]+)?)`/g;
	const seen = new Set();
	let match;
	while ((match = regex.exec(section)) !== null) {
		const rel = match[1].replace(/#.*$/, "");
		if (seen.has(rel)) continue;
		seen.add(rel);
		if (!fs.existsSync(path.join(repoRoot, rel))) {
			add("error", "AGENTS.md", "docs.md §五", `Knowledge Index 引用的路径不存在：${rel}`);
		}
	}
}

function checkBugContracts(relPath, data, add) {
	const info = bugPathInfo(relPath);
	if (!info) {
		if (isBugDocOutsideBugs(relPath, data)) {
			add("error", relPath, "bug-doc-guide.md §0.1", "BUG docs must live directly under progress/<initiative>/bugs/");
		}
		return;
	}
	if (info.kind === "top-level") {
		add("error", relPath, "bug-doc-guide.md §0.1", "BUG must be under progress/<initiative>/bugs/; top-level progress/bugs/ is not allowed");
		return;
	}
	if (info.kind === "nested-bug") {
		add("error", relPath, "bug-doc-guide.md §0.1", "BUG docs must live directly under progress/<initiative>/bugs/; nested BUG subdirectories are not allowed");
		return;
	}
	if (isIndexDocName(info.name)) return;

	if (info.name === "log.md") {
		if (data["progress-type"] !== "roadmap") {
			add("error", relPath, "bug-doc-guide.md §0.3", "bugs/log.md must use progress-type: roadmap");
		}
		if (data.initiative && data.initiative !== info.initiative) {
			add("error", relPath, "bug-doc-guide.md §0.2", `bugs/log.md initiative must match path initiative "${info.initiative}"`);
		}
		return;
	}

	if (!isBugFileName(info.name)) {
		add("error", relPath, "bug-doc-guide.md §0.3", "BUG file name must match bug-YYYY-MM-DD-<slug>.md");
	}
	if (data["progress-type"] !== "bug") {
		add("error", relPath, "bug-doc-guide.md §0.3", "single BUG docs must use progress-type: bug");
	}
	if (data.initiative === "bugs") {
		add("error", relPath, "bug-doc-guide.md §0.2", "single BUG docs must not use initiative: bugs");
	} else if (data.initiative && data.initiative !== info.initiative) {
		add("error", relPath, "bug-doc-guide.md §0.2", `BUG initiative must match path initiative "${info.initiative}"`);
	}
}

function checkBugDirectoryContracts(repoRoot, add) {
	const progressRoot = path.join(repoRoot, ".axm", "progress");
	if (!fs.existsSync(progressRoot)) return;
	const topLevelBugs = path.join(progressRoot, "bugs");
	if (isDirectory(topLevelBugs)) {
		add("error", ".axm/progress/bugs/", "bug-doc-guide.md §0.1", "BUG must be under progress/<initiative>/bugs/; top-level progress/bugs/ is not allowed");
	}
	for (const entry of fs.readdirSync(progressRoot, { withFileTypes: true })) {
		if (!entry.isDirectory() || entry.name === "bugs") continue;
		const bugsRoot = path.join(progressRoot, entry.name, "bugs");
		if (!isDirectory(bugsRoot)) continue;
		for (const child of fs.readdirSync(bugsRoot, { withFileTypes: true })) {
			if (child.isDirectory()) {
				add("error", `.axm/progress/${entry.name}/bugs/${child.name}/`, "bug-doc-guide.md §0.1", "BUG docs must live directly under progress/<initiative>/bugs/; nested BUG subdirectories are not allowed");
			}
		}
	}
}

function bugPathInfo(relPath) {
	const normalized = normalizePath(relPath);
	const parts = normalized.split("/");
	if (parts[0] !== ".axm" || parts[1] !== "progress") return null;
	if (parts[2] === "bugs") {
		return { kind: "top-level", normalized };
	}
	if (parts.length >= 5 && parts[3] === "bugs") {
		if (parts.length !== 5) {
			return {
				kind: "nested-bug",
				initiative: parts[2],
				name: parts[parts.length - 1],
				normalized,
			};
		}
		return {
			kind: "initiative-bug",
			initiative: parts[2],
			name: parts[parts.length - 1],
			normalized,
		};
	}
	return null;
}

function isBugDocOutsideBugs(relPath, data) {
	const normalized = normalizePath(relPath);
	const parts = normalized.split("/");
	if (parts[0] !== ".axm" || parts[1] !== "progress") return false;
	const name = parts[parts.length - 1];
	if (isIndexDocName(name)) return false;
	return data["progress-type"] === "bug" || isBugFileName(name);
}

function isBugFileName(name) {
	const match = name.match(BUG_FILE_RE);
	return Boolean(match && isStrictDate(match[1]));
}

function isAxmDocName(name) {
	return name.endsWith(".md") || name.endsWith(".mdc");
}

function isIndexDocName(name) {
	return name === "index.md" || name === "index.mdc";
}

function isDirectory(target) {
	try {
		return fs.statSync(target).isDirectory();
	} catch {
		return false;
	}
}

function isDate(s) {
	return typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s));
}

function isStrictDate(s) {
	if (typeof s !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
	const [year, month, day] = s.split("-").map(Number);
	const date = new Date(Date.UTC(year, month - 1, day));
	return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

function normalizePath(value) {
	return value.split(path.sep).join("/");
}
