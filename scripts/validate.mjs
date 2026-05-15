#!/usr/bin/env node
/**
 * axm validate — Phase 4 契约校验
 *
 * 用法：
 *   node scripts/validate.mjs [--target=.] [--format=flat|grouped]
 *
 * 执行四类检查（错误信息附 docs.md 章节引用）：
 *   1. axm-meta 骨架合法性（四套 A/B/C/D 必填字段 + 日期格式）
 *   2. 每份 index.md / index.mdc 的 entries ↔ 同目录实际文件/子目录 双向一致
 *   3. knowledge 目录下的 .md / .mdc 文档 code-refs 指向仓库根相对路径真实存在
 *   4. AGENTS.md 的 Knowledge Index 表里引用的 .axm 路径真实存在
 *
 * 退出码：
 *   0 — 全 PASS
 *   1 — 存在 ERROR（契约违反）
 *   2 — 仅 WARN（如 orphan entries、旧 frontmatter 等）
 */

import path from "node:path";
import { formatIssue, log } from "./_lib/logger.mjs";
import { exitCodeForValidation, validateAxmProject } from "./_lib/validation.mjs";

const VALID_FORMAT = new Set(["flat", "grouped"]);

function parseArgs(argv) {
	const args = {};
	for (const arg of argv.slice(2)) {
		const match = arg.match(/^--([a-zA-Z-]+)(?:=(.*))?$/);
		if (!match) throw new Error(`无法解析参数 "${arg}"`);
		args[match[1]] = match[2] ?? true;
	}
	return args;
}

function printSummary(validation, format = null) {
	const outputFormat = format ?? (validation.issues.length > 20 ? "grouped" : "flat");
	if (outputFormat === "grouped") {
		printGroupedIssues(validation.issues);
	} else {
		for (const issue of validation.issues) {
			const line = formatIssue(issue.level, issue);
			if (issue.level === "error") console.error(line);
			else console.warn(line);
		}
	}
	log.plain("");
	log.plain(`Summary: ${validation.errors} error(s), ${validation.warnings} warning(s)`);
	return exitCodeForValidation(validation);
}

function printGroupedIssues(issues) {
	for (const group of groupIssues(issues)) {
		const line = formatIssue(group.level, {
			ruleRef: group.ruleRef,
			message: `${group.message} — ${group.files.length} affected file(s)`,
		});
		const out = group.level === "error" ? console.error : console.warn;
		out(line);
		out("Affected files:");
		for (const file of group.files) {
			out(`  - ${file}`);
		}
	}
}

function groupIssues(items) {
	const groups = new Map();
	for (const item of items) {
		const key = JSON.stringify([item.level, item.ruleRef ?? "", item.message]);
		let group = groups.get(key);
		if (!group) {
			group = {
				level: item.level,
				ruleRef: item.ruleRef,
				message: item.message,
				files: [],
				seenFiles: new Set(),
			};
			groups.set(key, group);
		}
		const loc = item.file ? `${item.file}${item.line ? `:${item.line}` : ""}` : "(no file)";
		if (!group.seenFiles.has(loc)) {
			group.seenFiles.add(loc);
			group.files.push(loc);
		}
	}
	return Array.from(groups.values()).map(({ seenFiles, ...group }) => group);
}

function main() {
	const args = parseArgs(process.argv);
	if (args.format && !VALID_FORMAT.has(args.format)) {
		log.error(`--format 非法：${args.format}（应为 flat 或 grouped）`);
		process.exit(1);
	}

	const repoRoot = path.resolve(args.target ?? ".");
	log.info(`validate target = ${repoRoot}`);
	let validation;
	try {
		validation = validateAxmProject(repoRoot);
	} catch (error) {
		log.error(error.message);
		process.exit(1);
	}
	log.info(`scanned ${validation.scannedFiles} axm doc files`);

	const code = printSummary(validation, args.format ?? null);
	process.exit(code);
}

main();
