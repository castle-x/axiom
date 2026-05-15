#!/usr/bin/env node
/**
 * axm preview — 只读 localhost 预览器
 *
 * 用法：
 *   node scripts/preview.mjs --target=. [--port=8765]
 *
 * 约束：
 *   - 只绑定 127.0.0.1
 *   - 只提供 GET/HEAD/OPTIONS 查看接口
 *   - 不执行 scaffold / validate / reindex
 *   - 不写入目标仓库
 */

import http from "node:http";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { buildPreviewModel } from "./_lib/preview-data.mjs";
import { buildPreviewHtml } from "./_lib/preview-page.mjs";

const DEFAULT_HOST = "127.0.0.1";
const DEFAULT_PORT = 8765;
const ALLOW = "GET, HEAD, OPTIONS";

export function createPreviewServer({ target = "." } = {}) {
	const resolvedTarget = path.resolve(target);
	buildPreviewModel(resolvedTarget);

	return http.createServer((req, res) => {
		if (!["GET", "HEAD", "OPTIONS"].includes(req.method)) {
			send(res, 405, { error: "method_not_allowed", allow: ALLOW }, req.method, {
				Allow: ALLOW,
			});
			return;
		}
		if (req.method === "OPTIONS") {
			res.writeHead(204, {
				Allow: ALLOW,
				"Cache-Control": "no-store",
			});
			res.end();
			return;
		}

		const url = new URL(req.url || "/", "http://127.0.0.1");
		if (url.pathname === "/") {
			sendHtml(res, buildPreviewHtml(), req.method);
			return;
		}
		if (url.pathname === "/api/model") {
			try {
				send(res, 200, buildPreviewModel(resolvedTarget), req.method);
			} catch (error) {
				send(res, 500, { error: "preview_model_failed", message: error.message }, req.method);
			}
			return;
		}
		if (url.pathname === "/api/health") {
			send(res, 200, { ok: true, readonly: true }, req.method);
			return;
		}
		send(res, 404, { error: "not_found" }, req.method);
	});
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
		const server = createPreviewServer(args);
		const address = await listenWithFallback(server, args);
		const url = `http://${address.address}:${address.port}/`;
		console.log(`Axiom Preview: ${url}`);
		console.log(`target: ${path.resolve(args.target)}`);
		console.log("readonly: GET /, GET /api/model, GET /api/health");
	} catch (error) {
		console.error(error.message);
		process.exit(1);
	}
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
	main();
}
