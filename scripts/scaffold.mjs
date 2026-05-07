#!/usr/bin/env node
/**
 * axm scaffold — Phase 2 释放器
 *
 * 用法：
 *   node scripts/scaffold.mjs --owner=<team> --date=<YYYY-MM-DD> [--project-name=<name>] [--target=.] [--force]
 *
 * 行为：
 *   1. 读取 templates/**\/*.tpl（相对 skill 根）
 *   2. 做 {{owner}} / {{date}} / {{project_name}} 字符串替换
 *   3. 写到 <target>/.axm/ 与 <target>/AGENTS.md（.tpl 后缀去掉，AGENTS.md.tpl → AGENTS.md）
 *   4. 默认拒绝覆盖已存在文件；--force 强制覆盖
 *   5. 输出 manifest（created / skipped / overwritten 三类）
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { log } from "./_lib/logger.mjs";

const __filename = fileURLToPath(import.meta.url);
const SKILL_ROOT = path.resolve(path.dirname(__filename), "..");
const TEMPLATES_DIR = path.join(SKILL_ROOT, "templates");

function parseArgs(argv) {
	const args = { force: false };
	for (const a of argv.slice(2)) {
		const m = a.match(/^--([a-zA-Z-]+)(?:=(.*))?$/);
		if (!m) throw new Error(`无法解析参数 "${a}"，期望 --key=value 或 --flag`);
		const key = m[1];
		const val = m[2];
		if (val === undefined) args[key] = true;
		else args[key] = val;
	}
	return args;
}

function renderTemplate(raw, vars) {
	return raw.replace(/\{\{\s*([a-zA-Z_-]+)\s*\}\}/g, (_, k) => {
		if (!(k in vars)) {
			throw new Error(`模板引用未知变量 {{${k}}}`);
		}
		return vars[k];
	});
}

/** 收集所有 .tpl 文件，返回 {relFromTemplatesDir, absSrc} 列表 */
function collectTemplates(dir, rel = "") {
	const out = [];
	for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
		const full = path.join(dir, e.name);
		const relPath = rel ? path.join(rel, e.name) : e.name;
		if (e.isDirectory()) out.push(...collectTemplates(full, relPath));
		else if (e.isFile() && e.name.endsWith(".tpl")) out.push({ rel: relPath, abs: full });
	}
	return out;
}

/**
 * 将模板相对路径映射为目标仓库下的实际相对路径。
 *   templates/AGENTS.md.tpl     → AGENTS.md
 *   templates/axm/index.mdc.tpl → .axm/index.mdc
 *   templates/axm/universal/... → .axm/universal/...
 */
function mapToDestRel(tplRel) {
	let relNoTpl = tplRel.replace(/\.tpl$/, "");
	// 顶层 axm/ 映射为 .axm/
	if (relNoTpl === "axm" || relNoTpl.startsWith(`axm${path.sep}`)) {
		relNoTpl = `.axm${relNoTpl.slice(3)}`;
	}
	return relNoTpl;
}

function ensureDir(p) {
	fs.mkdirSync(p, { recursive: true });
}

function main() {
	const args = parseArgs(process.argv);
	const errors = [];
	if (!args.owner) errors.push("缺少 --owner=<team-or-person>");
	if (!args.date) errors.push("缺少 --date=<YYYY-MM-DD>");
	if (args.date && !/^\d{4}-\d{2}-\d{2}$/.test(args.date)) {
		errors.push(`--date 格式非法（需 YYYY-MM-DD），实际：${args.date}`);
	}
	if (errors.length) {
		log.error(errors.join("\n"));
		printHelp();
		process.exit(2);
	}
	const target = path.resolve(args.target ?? ".");
	const projectName = args["project-name"] ?? path.basename(target);
	const vars = {
		owner: args.owner,
		date: args.date,
		project_name: projectName,
	};

	log.info(`scaffold target   = ${target}`);
	log.info(`scaffold vars     = owner=${vars.owner}, date=${vars.date}, project_name=${vars.project_name}`);
	log.info(`scaffold force    = ${args.force ? "yes" : "no"}`);
	log.info(`templates source  = ${TEMPLATES_DIR}`);

	const templates = collectTemplates(TEMPLATES_DIR);
	if (templates.length === 0) {
		log.error("未找到任何 .tpl 模板，检查 templates/ 目录");
		process.exit(1);
	}

	const manifest = { created: [], skipped: [], overwritten: [] };
	for (const tpl of templates) {
		const destRel = mapToDestRel(tpl.rel);
		const destAbs = path.join(target, destRel);
		const exists = fs.existsSync(destAbs);
		if (exists && !args.force) {
			manifest.skipped.push(destRel);
			continue;
		}
		let raw;
		try {
			raw = fs.readFileSync(tpl.abs, "utf8");
		} catch (err) {
			log.error(`读取模板失败 ${tpl.rel}: ${err.message}`);
			process.exit(1);
		}
		let rendered;
		try {
			rendered = renderTemplate(raw, vars);
		} catch (err) {
			log.error(`渲染模板失败 ${tpl.rel}: ${err.message}`);
			process.exit(1);
		}
		ensureDir(path.dirname(destAbs));
		fs.writeFileSync(destAbs, rendered, "utf8");
		if (exists) manifest.overwritten.push(destRel);
		else manifest.created.push(destRel);
	}

	printManifest(manifest);
	const anyWrite = manifest.created.length + manifest.overwritten.length;
	log.info(`done. created=${manifest.created.length}, overwritten=${manifest.overwritten.length}, skipped=${manifest.skipped.length}`);
	if (manifest.skipped.length > 0 && !args.force) {
		log.info("提示：检测到已存在文件被跳过。如需强制覆盖，追加 --force");
	}
	process.exit(anyWrite === 0 && manifest.skipped.length === templates.length ? 0 : 0);
}

function printManifest(m) {
	if (m.created.length) {
		log.plain("\n-- created --");
		for (const f of m.created) log.plain(`  + ${f}`);
	}
	if (m.overwritten.length) {
		log.plain("\n-- overwritten --");
		for (const f of m.overwritten) log.plain(`  ~ ${f}`);
	}
	if (m.skipped.length) {
		log.plain("\n-- skipped (already exists, use --force to overwrite) --");
		for (const f of m.skipped) log.plain(`  = ${f}`);
	}
}

function printHelp() {
	log.plain(`
Usage: node scripts/scaffold.mjs --owner=<team> --date=<YYYY-MM-DD> [options]

Required:
  --owner=<value>        规范文档的 owner 字段（团队或个人标识）
  --date=<YYYY-MM-DD>    last-reviewed 初始日期

Optional:
  --project-name=<value> 项目名（默认取 target 目录名）
  --target=<path>        目标仓库根（默认为当前目录）
  --force                已存在文件强制覆盖（默认拒绝）
`);
}

main();
