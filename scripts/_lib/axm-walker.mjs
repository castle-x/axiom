/**
 * 遍历 .axm 目录下的 .md / .mdc 文档，返回带分类标签的文件清单。
 * 零依赖，使用 node:fs 同步 API。
 */

import fs from "node:fs";
import path from "node:path";

/**
 * @typedef {'index' | 'universal' | 'project' | 'knowledge' | 'progress'} AxmKind
 * @typedef {{ absPath: string, relPath: string, kind: AxmKind }} AxmFile
 */

/**
 * @param {string} axmRoot .axm 目录绝对路径
 * @param {string} repoRoot 仓库根绝对路径（用于生成 relPath）
 * @returns {AxmFile[]}
 */
export function walkAxm(axmRoot, repoRoot) {
	if (!fs.existsSync(axmRoot)) return [];
	const out = [];
	walk(axmRoot, (abs) => {
		if (!isAxmDoc(abs)) return;
		const relPath = path.relative(repoRoot, abs);
		out.push({ absPath: abs, relPath, kind: classify(relPath) });
	});
	return out;
}

/** @param {string} relPath 相对仓库根，如 .axm/universal/docs.md */
function classify(relPath) {
	const base = path.basename(relPath);
	if (base === "index.md" || base === "index.mdc") return "index";
	const parts = relPath.split(path.sep);
	// parts[0] = '.axm'
	const top = parts[1];
	if (top === "universal") return "universal";
	if (top === "project") return "project";
	if (top === "knowledge") return "knowledge";
	if (top === "progress") return "progress";
	throw new Error(`walker: 无法分类文件 ${relPath}`);
}

function isAxmDoc(absPath) {
	return absPath.endsWith(".md") || absPath.endsWith(".mdc");
}

function walk(dir, onFile) {
	const entries = fs.readdirSync(dir, { withFileTypes: true });
	for (const e of entries) {
		const full = path.join(dir, e.name);
		if (e.isDirectory()) {
			walk(full, onFile);
		} else if (e.isFile()) {
			onFile(full);
		}
	}
}
