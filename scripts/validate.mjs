#!/usr/bin/env node
/**
 * axm validate — Phase 4 契约校验
 *
 * 用法：
 *   node scripts/validate.mjs [--target=.]
 *
 * 执行四类检查（错误信息附 docs.mdc 章节引用）：
 *   1. Frontmatter 骨架合法性（三套 A/B/C 必填字段 + 日期格式）
 *   2. 每份 index.mdc 的 entries ↔ 同目录实际文件/子目录 双向一致
 *   3. knowledge/**\/*.mdc 的 code-refs 指向仓库根相对路径真实存在
 *   4. AGENTS.md 的 Knowledge Index 表里引用的 .axm 路径真实存在
 *
 * 退出码：
 *   0 — 全 PASS
 *   1 — 存在 ERROR（契约违反）
 *   2 — 仅 WARN（过期 last-reviewed 等）
 */

import fs from "node:fs";
import path from "node:path";
import { parseFrontmatter } from "./_lib/frontmatter.mjs";
import { walkAxm } from "./_lib/mdc-walker.mjs";
import { formatIssue, log } from "./_lib/logger.mjs";

const VALID_STATUS = new Set(["active", "draft", "deprecated"]);
const VALID_DEPTH = new Set(["overview", "deep"]);

function parseArgs(argv) {
	const args = {};
	for (const a of argv.slice(2)) {
		const m = a.match(/^--([a-zA-Z-]+)(?:=(.*))?$/);
		if (!m) throw new Error(`无法解析参数 "${a}"`);
		args[m[1]] = m[2] ?? true;
	}
	return args;
}

/** @type {Array<{level:'error'|'warn', file?:string, line?:number, ruleRef?:string, message:string}>} */
const issues = [];

function err(file, ruleRef, message) {
	issues.push({ level: "error", file, ruleRef, message });
}
function warn(file, ruleRef, message) {
	issues.push({ level: "warn", file, ruleRef, message });
}

function isDate(s) {
	return typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s));
}

/** Check 1: frontmatter 骨架 */
function checkFrontmatter(file) {
	const { relPath, absPath, kind } = file;
	let raw;
	try {
		raw = fs.readFileSync(absPath, "utf8");
	} catch (e) {
		err(relPath, "docs.mdc §二", `无法读取文件: ${e.message}`);
		return null;
	}
	let parsed;
	try {
		parsed = parseFrontmatter(raw);
	} catch (e) {
		err(relPath, "docs.mdc §二", `frontmatter 解析失败: ${e.message}`);
		return null;
	}
	if (!parsed.hasFrontmatter) {
		err(relPath, "docs.mdc §二", "缺少 YAML frontmatter（必须以 --- 开头）");
		return null;
	}
	const d = parsed.data;
	// 通用必填
	if (!d.status) err(relPath, "docs.mdc §二", "frontmatter 缺少 status");
	else if (!VALID_STATUS.has(d.status)) err(relPath, "docs.mdc §二", `status 非法：${d.status}（应为 active/draft/deprecated）`);
	if (!d["last-reviewed"]) err(relPath, "docs.mdc §二", "frontmatter 缺少 last-reviewed");
	else if (!isDate(d["last-reviewed"])) err(relPath, "docs.mdc §三.4", `last-reviewed 日期格式非法：${d["last-reviewed"]}（应为 YYYY-MM-DD）`);
	if (!d.owner) err(relPath, "docs.mdc §二", "frontmatter 缺少 owner");

	if (kind === "index") {
		// 骨架 C
		if (!Array.isArray(d.entries)) {
			err(relPath, "docs.mdc §二.C", "index.mdc 缺少 entries 列表");
		} else {
			d.entries.forEach((e, i) => {
				if (!e || typeof e !== "object") {
					err(relPath, "docs.mdc §二.C", `entries[${i}] 不是对象`);
					return;
				}
				for (const k of ["path", "title", "when-to-read"]) {
					if (!e[k]) err(relPath, "docs.mdc §二.C", `entries[${i}] 缺少字段 ${k}`);
				}
			});
		}
	} else if (kind === "universal" || kind === "project") {
		// 骨架 A
		if (!d["applies-to"]) err(relPath, "docs.mdc §二.A", "规范文档缺少 applies-to");
		else if (!Array.isArray(d["applies-to"]) || d["applies-to"].length === 0) {
			err(relPath, "docs.mdc §二.A", "applies-to 必须为非空列表");
		}
	} else if (kind === "knowledge") {
		// 骨架 B
		if (!d.depth) err(relPath, "docs.mdc §二.B", "知识文档缺少 depth");
		else if (!VALID_DEPTH.has(d.depth)) err(relPath, "docs.mdc §二.B", `depth 非法：${d.depth}（应为 overview/deep）`);
		if (!Array.isArray(d["code-refs"]) || d["code-refs"].length === 0) {
			err(relPath, "docs.mdc §二.B", "知识文档 code-refs 必须为非空列表");
		}
	}
	return parsed;
}

/** Check 2: index.mdc entries ↔ 实际文件双向一致 */
function checkIndexSync(files, axmRoot, repoRoot) {
	const indexFiles = files.filter((f) => f.kind === "index");
	for (const idx of indexFiles) {
		const dir = path.dirname(idx.absPath);
		let raw;
		try {
			raw = fs.readFileSync(idx.absPath, "utf8");
		} catch {
			continue; // 上一步已报错
		}
		let parsed;
		try {
			parsed = parseFrontmatter(raw);
		} catch {
			continue;
		}
		const entries = Array.isArray(parsed.data.entries) ? parsed.data.entries : [];
		const declaredPaths = new Set(entries.map((e) => e.path).filter(Boolean));

		// 实际子项：同目录下的 .mdc 文件（排除自身 index.mdc）+ 子目录
		const actualItems = [];
		const realChildren = fs.readdirSync(dir, { withFileTypes: true });
		for (const child of realChildren) {
			if (child.isDirectory()) {
				actualItems.push(`${child.name}/`);
			} else if (child.isFile() && child.name.endsWith(".mdc") && child.name !== "index.mdc") {
				actualItems.push(child.name);
			}
		}
		const actualSet = new Set(actualItems);

		// declared 但不存在
		for (const p of declaredPaths) {
			if (!actualSet.has(p)) {
				err(idx.relPath, "docs.mdc §六", `entries 引用的子项不存在：${p}`);
			}
		}
		// 存在但未登记（孤儿）
		for (const a of actualItems) {
			if (!declaredPaths.has(a)) {
				warn(idx.relPath, "docs.mdc §六", `发现孤儿子项未登记到 entries：${a}`);
			}
		}
	}
}

/** Check 3: knowledge code-refs 真实存在 */
function checkCodeRefs(files, repoRoot) {
	for (const f of files) {
		if (f.kind !== "knowledge") continue;
		let raw;
		try {
			raw = fs.readFileSync(f.absPath, "utf8");
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
				err(f.relPath, "docs.mdc §二.B", `code-refs 指向的源码不存在：${ref}`);
			}
		}
	}
}

/** Check 4: AGENTS.md 的 Knowledge Index 段内引用的 .axm 路径存在 */
function checkAgentsRefs(repoRoot) {
	const agentsPath = path.join(repoRoot, "AGENTS.md");
	if (!fs.existsSync(agentsPath)) {
		warn("AGENTS.md", "docs.mdc §五", "AGENTS.md 不存在（跳过引用检查）");
		return;
	}
	const raw = fs.readFileSync(agentsPath, "utf8");
	// 只抓取 "## Knowledge Index" 段到下一个二级标题（或文末）之间的内容，
	// 避免误把 ".axm 召回声明"段的示例（`.axm/<路径>`）当真实引用。
	const startMatch = raw.match(/^##\s+Knowledge Index\s*$/m);
	if (!startMatch) {
		warn("AGENTS.md", "docs.mdc §五", "未找到 '## Knowledge Index' 段（跳过引用检查）");
		return;
	}
	const startIdx = startMatch.index + startMatch[0].length;
	const nextH2 = raw.slice(startIdx).match(/^##\s+/m);
	const section = nextH2 ? raw.slice(startIdx, startIdx + nextH2.index) : raw.slice(startIdx);
	// 抓形如 `.axm/xxx` 的反引号片段；排除包含占位符尖括号的示例值
	const regex = /`(\.axm\/[^`\s<>]+)`/g;
	const seen = new Set();
	let mm;
	while ((mm = regex.exec(section)) !== null) {
		const rel = mm[1];
		if (seen.has(rel)) continue;
		seen.add(rel);
		const cleaned = rel.replace(/#.*$/, "");
		const full = path.join(repoRoot, cleaned);
		if (!fs.existsSync(full)) {
			err("AGENTS.md", "docs.mdc §五", `Knowledge Index 引用的路径不存在：${cleaned}`);
		}
	}
}

function printSummary() {
	const errs = issues.filter((i) => i.level === "error");
	const warns = issues.filter((i) => i.level === "warn");
	for (const i of issues) {
		const line = formatIssue(i.level, { file: i.file, line: i.line, ruleRef: i.ruleRef, message: i.message });
		if (i.level === "error") console.error(line);
		else console.warn(line);
	}
	log.plain("");
	log.plain(`Summary: ${errs.length} error(s), ${warns.length} warning(s)`);
	if (errs.length > 0) return 1;
	if (warns.length > 0) return 2;
	return 0;
}

function main() {
	const args = parseArgs(process.argv);
	const repoRoot = path.resolve(args.target ?? ".");
	const axmRoot = path.join(repoRoot, ".axm");
	log.info(`validate target = ${repoRoot}`);

	if (!fs.existsSync(axmRoot)) {
		log.error(`.axm 目录不存在于 ${repoRoot}`);
		process.exit(1);
	}

	const files = walkAxm(axmRoot, repoRoot);
	log.info(`scanned ${files.length} .mdc files`);

	for (const f of files) checkFrontmatter(f);
	checkIndexSync(files, axmRoot, repoRoot);
	checkCodeRefs(files, repoRoot);
	checkAgentsRefs(repoRoot);

	const code = printSummary();
	process.exit(code);
}

main();
