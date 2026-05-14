/**
 * 统一日志格式（零依赖、不打色、AI 可解析）。
 * 错误格式：
 *   [ERROR] <file>:<line?> <rule-ref> <message>
 *   [WARN]  <file>:<line?> <rule-ref> <message>
 */

/** @typedef {'error' | 'warn'} IssueLevel */

/**
 * @param {IssueLevel} level
 * @param {{file?: string, line?: number, ruleRef?: string, message: string}} issue
 */
export function formatIssue(level, { file, line, ruleRef, message }) {
	const tag = level === "error" ? "[ERROR]" : "[WARN] ";
	const loc = file ? ` ${file}${line ? `:${line}` : ""}` : "";
	const ref = ruleRef ? ` (${ruleRef})` : "";
	return `${tag}${loc}${ref} ${message}`;
}

export const log = {
	info: (msg) => console.log(`[INFO]  ${msg}`),
	warn: (msg) => console.warn(`[WARN]  ${msg}`),
	error: (msg) => console.error(`[ERROR] ${msg}`),
	plain: (msg) => console.log(msg),
};
