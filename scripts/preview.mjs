#!/usr/bin/env node
/**
 * axm preview — 只读 localhost 预览器
 *
 * 用法：
 *   node scripts/preview.mjs [--target=.] [--port=8765]
 *
 * 约束：
 *   - 只绑定 127.0.0.1
 *   - 查看接口只读；target 切换只更新本 preview 进程状态
 *   - 不执行 scaffold / validate / reindex
 *   - 不写入目标仓库
 */

import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { buildPreviewModel } from "./_lib/preview-data.mjs";
import { buildPreviewHtml } from "./_lib/preview-page.mjs";

const DEFAULT_HOST = "127.0.0.1";
const DEFAULT_PORT = 8765;
const ALLOW = "GET, HEAD, OPTIONS, POST";

export function createPreviewServer({ target = "." } = {}) {
	let activeTarget = resolveInitialTarget(target);

	return http.createServer(async (req, res) => {
		if (req.method === "OPTIONS") {
			res.writeHead(204, {
				Allow: ALLOW,
				"Cache-Control": "no-store",
			});
			res.end();
			return;
		}

		const url = new URL(req.url || "/", "http://127.0.0.1");
		if (req.method === "POST") {
			if (!isSameOriginPost(req)) {
				send(res, 403, { error: "forbidden", message: "POST requests must be same-origin." }, req.method);
				return;
			}
			if (url.pathname === "/api/target") {
				try {
					const body = await readJsonBody(req);
					const nextTarget = resolveAxmTarget(body.path);
					activeTarget = nextTarget;
					send(res, 200, buildPreviewModel(activeTarget.path), req.method);
				} catch (error) {
					sendError(res, error, req.method);
				}
				return;
			}
			send(res, 405, { error: "method_not_allowed", allow: ALLOW }, req.method, {
				Allow: ALLOW,
			});
			return;
		}
		if (!["GET", "HEAD"].includes(req.method)) {
			send(res, 405, { error: "method_not_allowed", allow: ALLOW }, req.method, {
				Allow: ALLOW,
			});
			return;
		}
		if (url.pathname === "/") {
			sendHtml(res, buildPreviewHtml(), req.method);
			return;
		}
		if (url.pathname === "/api/model") {
			try {
				if (!activeTarget) throw previewError("target_not_selected", "Open a project folder that contains .axm.", 409);
				send(res, 200, buildPreviewModel(activeTarget.path), req.method);
			} catch (error) {
				sendError(res, error, req.method);
			}
			return;
		}
		if (url.pathname === "/api/target") {
			send(res, 200, { target: activeTarget }, req.method);
			return;
		}
		if (url.pathname === "/api/health") {
			send(res, 200, { ok: true, readonly: true, target: activeTarget }, req.method);
			return;
		}
		send(res, 404, { error: "not_found" }, req.method);
	});
}

function resolveInitialTarget(target) {
	try {
		return resolveAxmTarget(target);
	} catch {
		return null;
	}
}

function resolveAxmTarget(inputPath) {
	if (!inputPath || typeof inputPath !== "string") {
		throw previewError("target_path_required", "Project path is required.", 400);
	}
	const resolved = path.resolve(inputPath);
	if (!fs.existsSync(resolved) || !fs.statSync(resolved).isDirectory()) {
		throw previewError("target_not_directory", `Project path is not a directory: ${resolved}`, 400);
	}
	const directRoot = path.basename(resolved) === ".axm" ? path.dirname(resolved) : resolved;
	if (hasAxm(directRoot)) return targetInfo(directRoot);

	const candidates = findImmediateAxmProjects(resolved);
	if (candidates.length === 1) return targetInfo(candidates[0]);
	if (candidates.length > 1) {
		const error = previewError("target_multiple_projects", "Multiple child projects contain .axm. Choose a more specific project path.", 400);
		error.candidates = candidates.map((candidate) => targetInfo(candidate));
		throw error;
	}
	throw previewError("target_missing_axm", `.axm directory not found under ${resolved}`, 400);
}

function hasAxm(projectPath) {
	const axmPath = path.join(projectPath, ".axm");
	return fs.existsSync(axmPath) && fs.statSync(axmPath).isDirectory();
}

function findImmediateAxmProjects(root) {
	return fs.readdirSync(root, { withFileTypes: true })
		.filter((entry) => entry.isDirectory() && !entry.name.startsWith("."))
		.map((entry) => path.join(root, entry.name))
		.filter((candidate) => {
			try {
				return hasAxm(candidate);
			} catch {
				return false;
			}
		});
}

function targetInfo(projectPath) {
	const resolved = path.resolve(projectPath);
	return {
		path: resolved,
		name: path.basename(resolved),
	};
}

function isSameOriginPost(req) {
	const origin = req.headers.origin;
	if (!origin) return true;
	try {
		const parsed = new URL(origin);
		return parsed.protocol === "http:" && parsed.host === req.headers.host;
	} catch {
		return false;
	}
}

function readJsonBody(req) {
	return new Promise((resolve, reject) => {
		let raw = "";
		req.setEncoding("utf8");
		req.on("data", (chunk) => {
			raw += chunk;
			if (raw.length > 32768) {
				reject(previewError("request_too_large", "Request body is too large.", 413));
				req.destroy();
			}
		});
		req.on("end", () => {
			if (!raw.trim()) {
				resolve({});
				return;
			}
			try {
				resolve(JSON.parse(raw));
			} catch {
				reject(previewError("invalid_json", "Request body must be JSON.", 400));
			}
		});
		req.on("error", reject);
	});
}

function previewError(code, message, status = 500) {
	const error = new Error(message);
	error.code = code;
	error.status = status;
	return error;
}

function sendHtml(res, html, method) {
	res.writeHead(200, {
		"Content-Type": "text/html; charset=utf-8",
		"Cache-Control": "no-store",
		"X-Content-Type-Options": "nosniff",
	});
	if (method !== "HEAD") res.end(html);
	else res.end();
}

function send(res, status, body, method, extraHeaders = {}) {
	const payload = JSON.stringify(body);
	res.writeHead(status, {
		"Content-Type": "application/json; charset=utf-8",
		"Cache-Control": "no-store",
		"X-Content-Type-Options": "nosniff",
		...extraHeaders,
	});
	if (method !== "HEAD") res.end(payload);
	else res.end();
}

function sendError(res, error, method) {
	const status = Number.isInteger(error.status) ? error.status : error.code === "target_not_selected" ? 409 : 500;
	send(res, status, {
		error: error.code || "preview_model_failed",
		message: error.message,
		candidates: error.candidates,
	}, method);
}

function parseArgs(argv) {
	const args = {
		target: ".",
		host: DEFAULT_HOST,
		port: DEFAULT_PORT,
	};
	for (let i = 2; i < argv.length; i++) {
		const arg = argv[i];
		const match = arg.match(/^--([a-zA-Z-]+)(?:=(.*))?$/);
		if (!match) throw new Error(`无法解析参数 "${arg}"`);
		const key = match[1];
		const value = match[2] ?? (argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[++i] : true);
		if (key === "target") args.target = String(value);
		else if (key === "port") args.port = Number(value);
		else if (key === "host") args.host = String(value);
		else throw new Error(`未知参数 --${key}`);
	}
	if (!Number.isInteger(args.port) || args.port < 0 || args.port > 65535) {
		throw new Error("--port 必须是 0-65535 的整数");
	}
	if (args.host !== DEFAULT_HOST) {
		throw new Error("preview 首版只允许绑定 127.0.0.1");
	}
	return args;
}

async function listenWithFallback(server, { host, port }) {
	if (port === 0) return listenOnce(server, host, port);
	let lastError = null;
	for (let candidate = port; candidate < port + 20; candidate++) {
		try {
			return await listenOnce(server, host, candidate);
		} catch (error) {
			if (error.code !== "EADDRINUSE") throw error;
			lastError = error;
		}
	}
	throw lastError ?? new Error("无法启动 preview server");
}

function listenOnce(server, host, port) {
	return new Promise((resolve, reject) => {
		function cleanup() {
			server.off("error", onError);
			server.off("listening", onListening);
		}
		function onError(error) {
			cleanup();
			reject(error);
		}
		function onListening() {
			cleanup();
			resolve(server.address());
		}
		server.once("error", onError);
		server.once("listening", onListening);
		server.listen(port, host);
	});
}

async function main() {
	try {
		const args = parseArgs(process.argv);
		const initialTarget = resolveInitialTarget(args.target);
		const server = createPreviewServer(args);
		const address = await listenWithFallback(server, args);
		const url = `http://${address.address}:${address.port}/`;
		console.log(`Axiom Preview: ${url}`);
		console.log(`target: ${initialTarget ? initialTarget.path : "not selected; use Open Project or Path in the UI"}`);
		console.log("view: GET /, GET /api/model, GET /api/target, GET /api/health");
		console.log("target switch: POST /api/target");
	} catch (error) {
		console.error(error.message);
		process.exit(1);
	}
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
	main();
}
