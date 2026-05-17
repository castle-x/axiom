import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { afterEach, describe, test } from "node:test";

import {
	assertExit,
	cleanupTempRoots,
	combinedOutput,
	commonIndexMeta,
	makeTempRepo,
	runBin,
	runNode,
	writeDoc,
	writeRootIndex,
} from "./helpers.mjs";

afterEach(cleanupTempRoots);

describe("reindex CLI", () => {
	test("reindex --dry-run prints validate tip and does not mutate tracked repo files", () => {
		const root = makeTempRepo("axm-reindex-dry-run-");
		writeRootIndex(root, [{ path: "project/", title: "Project", "when-to-read": "Project docs" }]);
		writeDoc(root, ".axm/project/index.md", commonIndexMeta([]));
		writeDoc(root, ".axm/project/architecture.md", {
			"doc-state": "current",
			"last-reviewed": "2026-05-15",
			owner: "tests",
			"applies-to": ["project:smoke"],
		});

		assertExit(runBin("git", ["init"], { cwd: root }), 0, "git init");
		assertExit(runBin("git", ["add", "."], { cwd: root }), 0, "git add");

		const before = fs.readFileSync(path.join(root, ".axm/project/index.md"), "utf8");
		const result = runNode("scripts/reindex.mjs", [`--target=${root}`, "--dry-run"]);
		const after = fs.readFileSync(path.join(root, ".axm/project/index.md"), "utf8");
		const diff = runBin("git", ["diff", "--exit-code", "--", "."], { cwd: root });

		assertExit(result, 0, "reindex --dry-run");
		assert.equal(after, before);
		assertExit(diff, 0, "git diff");
		assert.match(
			combinedOutput(result),
			new RegExp(`^Tip: reindex only syncs index entries\\. Run validate\\.mjs --target=${escapeRegExp(root)} for contract checks\\.$`, "m"),
		);
	});
});

function escapeRegExp(value) {
	return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
