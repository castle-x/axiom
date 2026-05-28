#!/usr/bin/env node
/**
 * axm reindex — index.md 同步器
 *
 * 用法：
 *   node scripts/reindex.mjs [--target=.] [--dry-run]
 *
 * 行为：
 *   1. 扫 .axm/ 每个含 index.md / index.mdc 的目录
 *   2. 列出该目录的实际子项（.md/.mdc 文件 + 子目录；排除自身 index）
 *   3. 与 index 文档现有 entries 合并：
 *      - 保留已有 entry 的 title / when-to-read
 *      - 新增孤儿子项：title = 子项路径，when-to-read = "TODO: 补充触发条件"
 *      - 删除已失效（实际不存在的）entry
 *   4. 按 entries[].path 字符串序排序
 *   5. 原子写入（.tmp + rename），--dry-run 只打印 diff 不落盘
 *
 * 约束（刻意为之，保持简单）：
 *   - 只改 entries 字段；其他 metadata 字段（含 last-reviewed）保持原样
 *   - 不触碰正文；索引链路的"人文描述"由人工维护
 *   - 解析失败的 index 文档跳过并报错，不做自动修复
 */

import fs from "node:fs";
import path from "node:path";
import { findMetadataBlock, parseFrontmatter } from "./_lib/frontmatter.mjs";
import { log } from "./_lib/logger.mjs";

function parseArgs(argv) {
	const args = { "dry-run": false };
	for (const a of argv.slice(2)) {
		const m = a.match(/^--([a-zA-Z-]+)(?:=(.*))?$/);
		if (!m) throw new Error(`无法解析参数 "${a}"`);
		args[m[1]] = m[2] ?? true;
	}
	return args;
}

/** 扫 .axm 下所有 index.md / index.mdc 的绝对路径 */
function findIndexFiles(axmRoot) {
	const out = [];
	function walk(dir) {
		for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
			const full = path.join(dir, e.name);
			if (e.isDirectory()) walk(full);
			else if (e.isFile() && (e.name === "index.md" || e.name === "index.mdc")) out.push(full);
		}
	}
	if (fs.existsSync(axmRoot)) walk(axmRoot);
	return out;
}

/** 收集某目录的实际子项（用于 entries） */
function collectActual(dir) {
	const out = [];
	for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
		if (e.isDirectory()) out.push(`${e.name}/`);
		else if (e.isFile() && isAxmDocName(e.name) && !isIndexDocName(e.name)) out.push(e.name);
	}
	return out;
}

/**
 * 重新生成 entries：
 *   - 已登记且实际存在 → 保留原 title/when-to-read，保留原位置
 *   - 实际存在但未登记（孤儿） → 追加到末尾，标 TODO
 *   - 已登记但实际不存在 → 删除
 * 不做字典序重排：人工编排的顺序（如 universal→project→knowledge）优先于机械排序。
 * @param {Array<{path:string,title:string,'when-to-read':string}>} existing
 * @param {string[]} actualPaths
 */
function mergeEntries(existing, actualPaths) {
	const actualSet = new Set(actualPaths);
	const result = [];
	const seen = new Set();
	// Pass 1：保留原顺序，剔除失效条目
	for (const e of existing) {
		if (!e || typeof e !== "object" || !e.path) continue;
		if (!actualSet.has(e.path)) continue;
		result.push({
			path: e.path,
			title: e.title ?? "TODO: 补充标题",
			"when-to-read": e["when-to-read"] ?? "TODO: 补充触发条件",
		});
		seen.add(e.path);
	}
	// Pass 2：追加孤儿
	for (const p of actualPaths) {
		if (seen.has(p)) continue;
		result.push({
			path: p,
			title: "TODO: 补充标题",
			"when-to-read": "TODO: 补充触发条件",
		});
	}
	return result;
}

/**
 * 用原文件的 metadata 区块做**最小化替换**：只替换 entries 块，其余字段与正文一字不动。
 * 回避了"回写 YAML"的复杂性。
 * @param {string} raw 原文件内容
 * @param {Array} newEntries
 * @returns {string} 新内容
 */
function rewriteEntries(raw, newEntries) {
	const lines = raw.split(/\r?\n/);
	const meta = findMetadataBlock(lines);
	if (!meta) throw new Error("文件缺少 axm metadata");

	// 找到 entries: 开始行
	let entriesStart = -1;
	for (let i = meta.start + 1; i < meta.end; i++) {
		if (/^entries:\s*(\[\s*\])?\s*$/.test(lines[i]) || /^entries:\s*$/.test(lines[i])) {
			entriesStart = i;
			break;
		}
	}
	// entries 块的结尾：下一个顶层键（不以空格开头）或 metadata 结束
	let entriesEnd = meta.end;
	if (entriesStart !== -1) {
		for (let i = entriesStart + 1; i < meta.end; i++) {
			if (/^[a-zA-Z]/.test(lines[i])) {
				entriesEnd = i;
				break;
			}
		}
	}

	const newEntriesLines = renderEntries(newEntries);

	let out;
	if (entriesStart === -1) {
		// 原文件没有 entries：插到 metadata 末尾
		out = [...lines.slice(0, meta.end), ...newEntriesLines, ...lines.slice(meta.end)];
	} else {
		out = [...lines.slice(0, entriesStart), ...newEntriesLines, ...lines.slice(entriesEnd)];
	}
	return out.join("\n");
}

function isAxmDocName(name) {
	return name.endsWith(".md") || name.endsWith(".mdc");
}

function isIndexDocName(name) {
	return name === "index.md" || name === "index.mdc";
}

function renderEntries(entries) {
	if (entries.length === 0) return ["entries: []"];
	const lines = ["entries:"];
	for (const e of entries) {
		lines.push(`  - path: ${e.path}`);
		lines.push(`    title: ${e.title}`);
		lines.push(`    when-to-read: ${e["when-to-read"]}`);
	}
	return lines;
}

function diffPreview(oldRaw, newRaw) {
	// 刻意简单：逐行对比展示不同行。插入/删除会导致后续行错位，
	// 这只是预览提示，实际落盘由 rewriteEntries 精确替换 entries 块、正文一字不动。
	const oldLines = oldRaw.split(/\r?\n/);
	const newLines = newRaw.split(/\r?\n/);
	const max = Math.max(oldLines.length, newLines.length);
	const out = [];
	for (let i = 0; i < max; i++) {
		const a = oldLines[i] ?? "";
		const b = newLines[i] ?? "";
		if (a !== b) {
			out.push(`  - ${a}`);
			out.push(`  + ${b}`);
		}
	}
	return out.join("\n");
}

function main() {
	const args = parseArgs(process.argv);
	const repoRoot = path.resolve(args.target ?? ".");
	const axmRoot = path.join(repoRoot, ".axm");
	const dryRun = args["dry-run"] === true;

	log.info(`reindex target  = ${repoRoot}`);
	log.info(`dry-run         = ${dryRun ? "yes" : "no"}`);

	if (!fs.existsSync(axmRoot)) {
		log.error(`.axm 目录不存在于 ${repoRoot}`);
		process.exit(1);
	}

	const indexes = findIndexFiles(axmRoot);
	log.info(`found ${indexes.length} index docs`);
	let changed = 0;
	let failed = 0;

	for (const idxAbs of indexes) {
		const relPath = path.relative(repoRoot, idxAbs);
		let raw;
		try {
			raw = fs.readFileSync(idxAbs, "utf8");
		} catch (e) {
			log.error(`读取失败 ${relPath}: ${e.message}`);
			failed++;
			continue;
		}
		let parsed;
		try {
			parsed = parseFrontmatter(raw);
		} catch (e) {
			log.error(`axm metadata 解析失败 ${relPath}: ${e.message}（跳过，不自动修复）`);
			failed++;
			continue;
		}
		const existing = Array.isArray(parsed.data.entries) ? parsed.data.entries : [];
		const actual = collectActual(path.dirname(idxAbs));
		const merged = mergeEntries(existing, actual);

		let newRaw;
		try {
			newRaw = rewriteEntries(raw, merged);
		} catch (e) {
			log.error(`回写失败 ${relPath}: ${e.message}`);
			failed++;
			continue;
		}

		if (newRaw === raw) {
			log.info(`unchanged: ${relPath}`);
			continue;
		}
		changed++;
		if (dryRun) {
			log.plain(`\n[DIFF] ${relPath}`);
			log.plain(diffPreview(raw, newRaw));
			continue;
		}
		const tmp = `${idxAbs}.tmp`;
		fs.writeFileSync(tmp, newRaw, "utf8");
		fs.renameSync(tmp, idxAbs);
		log.info(`updated:   ${relPath}`);
	}

	log.plain("");
	log.info(`done. changed=${changed}${dryRun ? " (dry-run)" : ""}, failed=${failed}, total=${indexes.length}`);
	log.plain(`Tip: reindex only syncs index entries. Run validate.mjs --target=${repoRoot} for contract checks.`);
	process.exit(failed > 0 ? 1 : 0);
}

main();
