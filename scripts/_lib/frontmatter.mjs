/**
 * 极简 axm metadata 解析器（零依赖）。
 *
 * 仅覆盖 .axm 四套骨架（A/B/C/D）实际用到的 YAML 子集：
 *   - 标量字段：status / last-reviewed / owner / depth / progress-type / initiative / applies-to(inline)
 *   - inline 列表：applies-to: [universal] / [project:name, scope]
 *   - block 列表（字符串）：related / code-refs
 *   - entries 对象列表：每项含 path / title / when-to-read
 *
 * 刻意**不**支持：嵌套对象、多行字符串、锚点别名、注释、流式映射等 YAML 高级特性。
 * 超出范围的输入会直接抛错，由 validate.mjs 转成结构化错误。
 */

const FM_DELIM = "---";
const META_START = "<!-- axm-meta";
const META_END = "-->";

/**
 * @param {string} raw 整个 .md/.mdc 文件内容
 * @returns {{ data: Record<string, any>, body: string, hasFrontmatter: boolean, hasMeta: boolean, metaKind?: 'comment' | 'frontmatter' }}
 */
export function parseFrontmatter(raw) {
	const lines = raw.split(/\r?\n/);
	const meta = findMetadataBlock(lines);
	if (meta?.kind === "comment") {
		const metaLines = lines.slice(meta.start + 1, meta.end);
		const bodyLines = lines.slice(meta.end + 1);
		if (bodyLines[0] === "") bodyLines.shift();
		const data = parseYamlSubset(metaLines);
		return {
			data,
			body: bodyLines.join("\n"),
			hasFrontmatter: true,
			hasMeta: true,
			metaKind: "comment",
		};
	}
	if (lines[0]?.trim() !== FM_DELIM) {
		return { data: {}, body: raw, hasFrontmatter: false, hasMeta: false };
	}
	if (!meta || meta.kind !== "frontmatter") {
		throw new Error("frontmatter: 缺少结束分隔符 ---");
	}
	const fmLines = lines.slice(meta.start + 1, meta.end);
	const bodyLines = lines.slice(meta.end + 1);
	// body 去掉首个空行（保持原格式上与 frontmatter 的视觉分隔）
	if (bodyLines[0] === "") bodyLines.shift();
	const data = parseYamlSubset(fmLines);
	return {
		data,
		body: bodyLines.join("\n"),
		hasFrontmatter: true,
		hasMeta: true,
		metaKind: "frontmatter",
	};
}

/**
 * 找到文件顶部的 axm metadata 区块。
 * 新格式优先：HTML 注释块，Markdown 预览中不可见。
 * 旧格式兼容：YAML frontmatter。
 *
 * @param {string[]} lines
 * @returns {{kind:'comment'|'frontmatter', start:number, end:number} | null}
 */
export function findMetadataBlock(lines) {
	const first = lines[0]?.trim();
	if (first === META_START) {
		for (let i = 1; i < lines.length; i++) {
			if (lines[i].trim() === META_END) {
				return { kind: "comment", start: 0, end: i };
			}
		}
		throw new Error("axm-meta: 缺少结束分隔符 -->");
	}
	if (first === FM_DELIM) {
		for (let i = 1; i < lines.length; i++) {
			if (lines[i].trim() === FM_DELIM) {
				return { kind: "frontmatter", start: 0, end: i };
			}
		}
		throw new Error("frontmatter: 缺少结束分隔符 ---");
	}
	return null;
}

/**
 * 解析有限 YAML 子集。行级扫描，不支持嵌套 map。
 * @param {string[]} lines frontmatter 内部行（不含 ---）
 */
function parseYamlSubset(lines) {
	/** @type {Record<string, any>} */
	const out = {};
	let i = 0;
	while (i < lines.length) {
		const line = lines[i];
		if (line.trim() === "" || line.trim().startsWith("#")) {
			i++;
			continue;
		}
		// 顶层键必须从第 0 列开始
		const m = line.match(/^([a-zA-Z][a-zA-Z0-9_-]*):\s*(.*)$/);
		if (!m) {
			throw new Error(`frontmatter: 无法解析行 "${line}"`);
		}
		const key = m[1];
		const rest = m[2];
		if (rest === "" || rest === undefined) {
			// block 形式：下一行起为缩进的 - 列表项
			const { list, consumed } = parseBlockList(lines, i + 1);
			out[key] = list;
			i += 1 + consumed;
		} else if (rest.startsWith("[") && rest.endsWith("]")) {
			// inline 列表
			out[key] = parseInlineList(rest);
			i++;
		} else {
			// 标量
			out[key] = parseScalar(rest);
			i++;
		}
	}
	return out;
}

/**
 * 解析 block 列表。从 startIdx 起连续的以 "  - " 开头的行；
 * 若列表项包含缩进的键值对（如 entries 的 path/title/when-to-read），归并为对象。
 */
function parseBlockList(lines, startIdx) {
	const items = [];
	let i = startIdx;
	let indent = null;
	/** @type {Record<string, any> | null} */
	let currentObj = null;
	while (i < lines.length) {
		const line = lines[i];
		if (line.trim() === "") {
			i++;
			continue;
		}
		// 回到顶层键：列表结束
		if (/^[a-zA-Z]/.test(line)) break;
		const m = line.match(/^(\s+)-\s+(.*)$/);
		if (m) {
			// 新列表项
			if (indent === null) indent = m[1].length;
			else if (m[1].length !== indent) {
				throw new Error(`frontmatter: 列表缩进不一致 "${line}"`);
			}
			const payload = m[2];
			const kv = payload.match(/^([a-zA-Z][a-zA-Z0-9_-]*):\s*(.+)$/);
			if (kv) {
				// 对象列表项的第一行（如 `- path: xxx`）
				currentObj = {};
				currentObj[kv[1]] = parseScalar(kv[2]);
				items.push(currentObj);
			} else {
				// 字符串列表项
				items.push(parseScalar(payload));
				currentObj = null;
			}
			i++;
			continue;
		}
		// 续行：对象列表项的后续键
		const cont = line.match(/^(\s+)([a-zA-Z][a-zA-Z0-9_-]*):\s*(.+)$/);
		if (cont && currentObj) {
			const contIndent = cont[1].length;
			if (indent !== null && contIndent > indent) {
				currentObj[cont[2]] = parseScalar(cont[3]);
				i++;
				continue;
			}
		}
		break;
	}
	return { list: items, consumed: i - startIdx };
}

function parseInlineList(s) {
	const inner = s.slice(1, -1).trim();
	if (inner === "") return [];
	return inner.split(",").map((x) => parseScalar(x.trim()));
}

function parseScalar(raw) {
	const s = raw.trim();
	if (s === "true") return true;
	if (s === "false") return false;
	if (s === "null" || s === "~") return null;
	// 带引号
	if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
		return s.slice(1, -1);
	}
	// 日期 YYYY-MM-DD：保留原字符串，由 validator 再校验
	return s;
}
