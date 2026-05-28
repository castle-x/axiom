import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { afterEach, describe, test } from "node:test";

import {
	assertExit,
	cleanupTempRoots,
	makeTempRepo,
	runNode,
} from "./helpers.mjs";

afterEach(cleanupTempRoots);

describe("install skills CLI", () => {
	test("installs every axm skill directory with a SKILL.md", () => {
		const target = makeTempRepo("axm-skills-install-");
		fs.rmSync(path.join(target, "AGENTS.md"), { force: true });

		const result = runNode("scripts/install-skills.mjs", [`--target=${target}`]);

		assertExit(result, 0, "install-skills");
		for (const name of ["axm-health-check", "axm-init", "axm-maintain", "axm-preview", "axm-progress"]) {
			assert.ok(fs.existsSync(path.join(target, name, "SKILL.md")), `${name} should be installed`);
		}
	});

	test("skips existing skills unless --force is provided", () => {
		const target = makeTempRepo("axm-skills-skip-");
		fs.rmSync(path.join(target, "AGENTS.md"), { force: true });

		assertExit(runNode("scripts/install-skills.mjs", [`--target=${target}`]), 0, "initial install");
		const skillPath = path.join(target, "axm-init", "SKILL.md");
		fs.writeFileSync(skillPath, "local edit\n", "utf8");

		assertExit(runNode("scripts/install-skills.mjs", [`--target=${target}`]), 0, "skip existing");
		assert.equal(fs.readFileSync(skillPath, "utf8"), "local edit\n");

		assertExit(runNode("scripts/install-skills.mjs", [`--target=${target}`, "--force"]), 0, "force install");
		assert.notEqual(fs.readFileSync(skillPath, "utf8"), "local edit\n");
	});
});
