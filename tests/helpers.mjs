import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const tempRoots = [];

export function cleanupTempRoots() {
	for (const root of tempRoots.splice(0)) {
		fs.rmSync(root, { recursive: true, force: true });
	}
}

export function makeTempRepo(prefix = "axm-test-") {
	const root = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
	tempRoots.push(root);
	fs.writeFileSync(path.join(root, "AGENTS.md"), "# AGENTS.md\n\n## Knowledge Index\n\n| Task | Read |\n| --- | --- |\n", "utf8");
	return root;
}

export function runNode(scriptRel, args = [], options = {}) {
	return spawnSync(process.execPath, [path.join(repoRoot, scriptRel), ...args], {
		cwd: repoRoot,
		encoding: "utf8",
		...options,
	});
}

export function runBin(command, args = [], options = {}) {
	return spawnSync(command, args, {
		cwd: repoRoot,
		encoding: "utf8",
		...options,
	});
}

export function combinedOutput(result) {
	return `${result.stdout ?? ""}${result.stderr ?? ""}`;
}

export function assertExit(result, code, label = "command") {
	assert.equal(result.status, code, `${label} exited ${result.status}\n${combinedOutput(result)}`);
}

export function writeDoc(root, relPath, meta, body = "# Test\n") {
	const abs = path.join(root, relPath);
	fs.mkdirSync(path.dirname(abs), { recursive: true });
	fs.writeFileSync(abs, `${renderMeta(meta)}\n\n${body}\n`, "utf8");
}

export function renderMeta(meta) {
	const lines = ["<!-- axm-meta"];
	for (const [key, value] of Object.entries(meta)) {
		if (value === undefined) continue;
		if (Array.isArray(value)) {
			if (value.length === 0) {
				lines.push(`${key}: []`);
			} else if (value.every((item) => typeof item === "string")) {
				lines.push(`${key}:`);
				for (const item of value) lines.push(`  - ${item}`);
			} else {
				lines.push(`${key}:`);
				for (const item of value) {
					const entries = Object.entries(item);
					const [firstKey, firstValue] = entries[0];
					lines.push(`  - ${firstKey}: ${firstValue}`);
					for (const [childKey, childValue] of entries.slice(1)) {
						lines.push(`    ${childKey}: ${childValue}`);
					}
				}
			}
		} else {
			lines.push(`${key}: ${value}`);
		}
	}
	lines.push("-->");
	return lines.join("\n");
}

export function writeRootIndex(root, entries) {
	writeDoc(root, ".axm/index.md", commonIndexMeta(entries), "# .axm\n");
}

export function commonIndexMeta(entries = []) {
	return {
		"doc-state": "current",
		"last-reviewed": "2026-05-15",
		owner: "tests",
		entries,
	};
}

export function progressMeta(extra = {}) {
	return {
		"doc-state": "current",
		"last-reviewed": "2026-05-15",
		owner: "tests",
		"progress-type": "bug",
		"workflow-state": "open",
		"state-updated": "2026-05-15",
		initiative: "foo",
		...extra,
	};
}

export function makeProgressBugRepo() {
	const root = makeTempRepo("axm-bug-test-");
	writeRootIndex(root, [{ path: "progress/", title: "Progress", "when-to-read": "Progress docs" }]);
	writeDoc(root, ".axm/progress/index.md", commonIndexMeta([{ path: "foo/", title: "Foo", "when-to-read": "Foo initiative" }]));
	writeDoc(root, ".axm/progress/foo/index.md", commonIndexMeta([{ path: "bugs/", title: "Bugs", "when-to-read": "Bug board" }]));
	writeDoc(root, ".axm/progress/foo/bugs/index.md", commonIndexMeta([]));
	return root;
}
