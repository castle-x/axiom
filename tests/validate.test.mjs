import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { afterEach, describe, test } from "node:test";

import { buildPreviewModel } from "../scripts/_lib/preview-data.mjs";
import {
	assertExit,
	cleanupTempRoots,
	combinedOutput,
	commonIndexMeta,
	makeProgressBugRepo,
	makeTempRepo,
	progressMeta,
	runNode,
	writeDoc,
	writeRootIndex,
} from "./helpers.mjs";

afterEach(cleanupTempRoots);

describe("validate CLI", () => {
	test("valid scaffold smoke passes after scaffold -> validate -> reindex --dry-run", () => {
		const root = makeTempRepo("axm-scaffold-smoke-");
		fs.rmSync(path.join(root, "AGENTS.md"), { force: true });

		const scaffold = runNode("scripts/scaffold.mjs", [
			"--owner=smoke",
			"--date=2026-05-15",
			"--project-name=smoke",
			`--target=${root}`,
		]);
		assertExit(scaffold, 0, "scaffold");

		const validate = runNode("scripts/validate.mjs", [`--target=${root}`]);
		assertExit(validate, 0, "validate");
		assert.doesNotMatch(combinedOutput(validate), /metadata 缺少 doc-state/);
		for (const file of fs.readdirSync(path.join(root, ".axm"), { recursive: true })) {
			if (!String(file).endsWith(".md")) continue;
			const raw = fs.readFileSync(path.join(root, ".axm", file), "utf8");
			assert.match(raw, /doc-state: (current|draft|deprecated)/, `${file} should use doc-state`);
			assert.doesNotMatch(raw, /^status:/m, `${file} should not use legacy status`);
		}

		const reindex = runNode("scripts/reindex.mjs", [`--target=${root}`, "--dry-run"]);
		assertExit(reindex, 0, "reindex --dry-run");
	});

	test("legacy status metadata returns ERROR", () => {
		const root = makeTempRepo("axm-legacy-status-");
		writeDoc(root, ".axm/index.md", {
			status: "active",
			"last-reviewed": "2026-05-15",
			owner: "tests",
			entries: [{ path: "project/", title: "Project", "when-to-read": "Project docs" }],
		});
		writeDoc(root, ".axm/project/index.md", {
			status: "active",
			"last-reviewed": "2026-05-15",
			owner: "tests",
			entries: [{ path: "spec.md", title: "Spec", "when-to-read": "Spec docs" }],
		});
		writeDoc(root, ".axm/project/spec.md", {
			status: "active",
			"last-reviewed": "2026-05-15",
			owner: "tests",
			"applies-to": ["project:smoke"],
		});

		const result = runNode("scripts/validate.mjs", [`--target=${root}`]);
		const output = combinedOutput(result);

		assertExit(result, 1, "validate");
		assert.match(output, /status/);
		assert.match(output, /doc-state/);
	});

	test("progress docs require workflow-state and state-updated", () => {
		const root = makeProgressBugRepo();
		writeDoc(root, ".axm/progress/foo/bugs/index.md", commonIndexMeta([
			{ path: "bug-2026-05-15-no-workflow.md", title: "Missing workflow", "when-to-read": "Invalid bug" },
			{ path: "bug-2026-05-15-no-updated.md", title: "Missing update date", "when-to-read": "Invalid bug" },
		]));
		writeDoc(root, ".axm/progress/foo/bugs/bug-2026-05-15-no-workflow.md", progressMeta({ "workflow-state": undefined }));
		writeDoc(root, ".axm/progress/foo/bugs/bug-2026-05-15-no-updated.md", progressMeta({ "state-updated": undefined }));

		const result = runNode("scripts/validate.mjs", [`--target=${root}`]);
		const output = combinedOutput(result);

		assertExit(result, 1, "validate");
		assert.match(output, /workflow-state/);
		assert.match(output, /state-updated/);
	});

	test("workflow-state is validated by progress-type", () => {
		const root = makeProgressBugRepo();
		writeDoc(root, ".axm/progress/foo/index.md", commonIndexMeta([
			{ path: "roadmap.md", title: "Roadmap", "when-to-read": "Roadmap" },
			{ path: "decision.md", title: "Decision", "when-to-read": "Decision" },
			{ path: "bugs/", title: "Bugs", "when-to-read": "Bug board" },
		]));
		writeDoc(root, ".axm/progress/foo/roadmap.md", progressMeta({ "progress-type": "roadmap", "workflow-state": "accepted" }));
		writeDoc(root, ".axm/progress/foo/decision.md", progressMeta({ "progress-type": "decision", "workflow-state": "fixed" }));
		writeDoc(root, ".axm/progress/foo/bugs/index.md", commonIndexMeta([
			{ path: "bug-2026-05-15-invalid-state.md", title: "Invalid bug state", "when-to-read": "Invalid bug" },
		]));
		writeDoc(root, ".axm/progress/foo/bugs/bug-2026-05-15-invalid-state.md", progressMeta({ "workflow-state": "accepted" }));

		const result = runNode("scripts/validate.mjs", [`--target=${root}`]);
		const output = combinedOutput(result);

		assertExit(result, 1, "validate");
		assert.match(output, /workflow-state/);
		assert.match(output, /roadmap/);
		assert.match(output, /decision/);
		assert.match(output, /bug/);
	});

	test("top-level progress/bugs docs return ERROR", () => {
		const root = makeTempRepo("axm-top-bugs-");
		writeRootIndex(root, [{ path: "progress/", title: "Progress", "when-to-read": "Progress docs" }]);
		writeDoc(root, ".axm/progress/index.md", commonIndexMeta([{ path: "bugs/", title: "Bugs", "when-to-read": "Invalid top-level bugs" }]));
		writeDoc(root, ".axm/progress/bugs/index.md", commonIndexMeta([{ path: "bug-2026-05-15-x.md", title: "Bug", "when-to-read": "Invalid bug" }]));
		writeDoc(root, ".axm/progress/bugs/bug-2026-05-15-x.md", progressMeta({ initiative: "quality" }));

		const result = runNode("scripts/validate.mjs", [`--target=${root}`]);

		assertExit(result, 1, "validate");
		assert.match(combinedOutput(result), /bug-doc-guide\.md §0\.1/);
		assert.match(combinedOutput(result), /BUG must be under progress\/<initiative>\/bugs\//);
	});

	test("top-level progress/bugs directory returns ERROR even without markdown docs", () => {
		const root = makeTempRepo("axm-top-bugs-dir-");
		writeRootIndex(root, [{ path: "progress/", title: "Progress", "when-to-read": "Progress docs" }]);
		writeDoc(root, ".axm/progress/index.md", commonIndexMeta([{ path: "bugs/", title: "Bugs", "when-to-read": "Invalid top-level bugs" }]));
		fs.mkdirSync(path.join(root, ".axm/progress/bugs"), { recursive: true });
		fs.writeFileSync(path.join(root, ".axm/progress/bugs/README.txt"), "not an axm doc\n", "utf8");

		const result = runNode("scripts/validate.mjs", [`--target=${root}`]);
		const preview = buildPreviewModel(root);

		assertExit(result, 1, "validate");
		assert.match(combinedOutput(result), /\.axm\/progress\/bugs\//);
		assert.ok(preview.validation.issues.some((issue) => issue.file === ".axm/progress/bugs/"));
	});

	test("random single BUG file names return ERROR", () => {
		const root = makeProgressBugRepo();
		writeDoc(root, ".axm/progress/foo/bugs/index.md", commonIndexMeta([{ path: "random.md", title: "Bug", "when-to-read": "Invalid bug" }]));
		writeDoc(root, ".axm/progress/foo/bugs/random.md", progressMeta());

		const result = runNode("scripts/validate.mjs", [`--target=${root}`]);

		assertExit(result, 1, "validate");
		assert.match(combinedOutput(result), /bug-doc-guide\.md §0\.3/);
		assert.match(combinedOutput(result), /bug-YYYY-MM-DD-<slug>\.md/);
	});

	test("single BUG docs cannot use initiative: bugs", () => {
		const root = makeProgressBugRepo();
		writeDoc(root, ".axm/progress/foo/bugs/index.md", commonIndexMeta([{ path: "bug-2026-05-15-x.md", title: "Bug", "when-to-read": "Invalid initiative" }]));
		writeDoc(root, ".axm/progress/foo/bugs/bug-2026-05-15-x.md", progressMeta({ initiative: "bugs" }));

		const result = runNode("scripts/validate.mjs", [`--target=${root}`]);

		assertExit(result, 1, "validate");
		assert.match(combinedOutput(result), /bug-doc-guide\.md §0\.2/);
		assert.match(combinedOutput(result), /initiative.*bugs/);
	});

	test("single BUG docs must use the path initiative", () => {
		const root = makeProgressBugRepo();
		writeDoc(root, ".axm/progress/foo/bugs/index.md", commonIndexMeta([{ path: "bug-2026-05-15-x.md", title: "Bug", "when-to-read": "Invalid initiative" }]));
		writeDoc(root, ".axm/progress/foo/bugs/bug-2026-05-15-x.md", progressMeta({ initiative: "bar" }));

		const result = runNode("scripts/validate.mjs", [`--target=${root}`]);
		const output = combinedOutput(result);

		assertExit(result, 1, "validate");
		assert.match(output, /bug-doc-guide\.md §0\.2/);
		assert.match(output, /BUG initiative must match path initiative "foo"/);
	});

	test("bugs/log.md must use roadmap type and the path initiative", () => {
		const root = makeProgressBugRepo();
		writeDoc(root, ".axm/progress/foo/bugs/index.md", commonIndexMeta([{ path: "log.md", title: "Bug log", "when-to-read": "Review bug board" }]));
		writeDoc(root, ".axm/progress/foo/bugs/log.md", progressMeta({ "progress-type": "bug", initiative: "bar" }));

		const result = runNode("scripts/validate.mjs", [`--target=${root}`]);
		const output = combinedOutput(result);
		const preview = buildPreviewModel(root);

		assertExit(result, 1, "validate");
		assert.match(output, /bugs\/log\.md must use progress-type: roadmap/);
		assert.match(output, /bugs\/log\.md initiative must match path initiative "foo"/);
		assert.ok(preview.validation.issues.some((issue) => issue.message === "bugs/log.md must use progress-type: roadmap"));
		assert.ok(preview.validation.issues.some((issue) => issue.message === 'bugs/log.md initiative must match path initiative "foo"'));
	});

	test("BUG file names reject invalid dates and malformed kebab-case slugs", () => {
		const root = makeProgressBugRepo();
		writeDoc(root, ".axm/progress/foo/bugs/index.md", commonIndexMeta([
			{ path: "bug-2026-02-31-x.md", title: "Invalid date", "when-to-read": "Invalid bug" },
			{ path: "bug-2026-05-15-x-.md", title: "Invalid slug", "when-to-read": "Invalid bug" },
		]));
		writeDoc(root, ".axm/progress/foo/bugs/bug-2026-02-31-x.md", progressMeta());
		writeDoc(root, ".axm/progress/foo/bugs/bug-2026-05-15-x-.md", progressMeta());

		const result = runNode("scripts/validate.mjs", [`--target=${root}`]);
		const output = combinedOutput(result);

		assertExit(result, 1, "validate");
		assert.match(output, /bug-2026-02-31-x\.md/);
		assert.match(output, /bug-2026-05-15-x-\.md/);
	});

	test("BUG docs must live directly under initiative bugs directory", () => {
		const root = makeProgressBugRepo();
		writeDoc(root, ".axm/progress/foo/bugs/index.md", commonIndexMeta([{ path: "archive/", title: "Archive", "when-to-read": "Invalid nested bugs" }]));
		writeDoc(root, ".axm/progress/foo/bugs/archive/index.md", commonIndexMeta([{ path: "bug-2026-05-15-x.md", title: "Bug", "when-to-read": "Invalid nested bug" }]));
		writeDoc(root, ".axm/progress/foo/bugs/archive/bug-2026-05-15-x.md", progressMeta());

		const result = runNode("scripts/validate.mjs", [`--target=${root}`]);
		const output = combinedOutput(result);
		const preview = buildPreviewModel(root);

		assertExit(result, 1, "validate");
		assert.match(output, /nested BUG subdirectories are not allowed/);
		assert.ok(preview.validation.issues.some((issue) => issue.message.includes("nested BUG subdirectories are not allowed")));
	});

	test("nested bugs subdirectories return ERROR even without markdown docs", () => {
		const root = makeProgressBugRepo();
		writeDoc(root, ".axm/progress/foo/bugs/index.md", commonIndexMeta([{ path: "archive/", title: "Archive", "when-to-read": "Invalid nested bugs" }]));
		fs.mkdirSync(path.join(root, ".axm/progress/foo/bugs/archive"), { recursive: true });
		fs.writeFileSync(path.join(root, ".axm/progress/foo/bugs/archive/README.txt"), "not an axm doc\n", "utf8");

		const result = runNode("scripts/validate.mjs", [`--target=${root}`]);
		const preview = buildPreviewModel(root);

		assertExit(result, 1, "validate");
		assert.match(combinedOutput(result), /\.axm\/progress\/foo\/bugs\/archive\//);
		assert.ok(preview.validation.issues.some((issue) => issue.file === ".axm/progress/foo/bugs/archive/"));
	});

	test("bug-typed progress docs outside bugs directory return ERROR", () => {
		const root = makeProgressBugRepo();
		writeDoc(root, ".axm/progress/foo/index.md", commonIndexMeta([
			{ path: "bugs/", title: "Bugs", "when-to-read": "Bug board" },
			{ path: "bug-2026-05-15-x.md", title: "Bug", "when-to-read": "Invalid bug placement" },
		]));
		writeDoc(root, ".axm/progress/foo/bug-2026-05-15-x.md", progressMeta());

		const result = runNode("scripts/validate.mjs", [`--target=${root}`]);
		const output = combinedOutput(result);
		const preview = buildPreviewModel(root);

		assertExit(result, 1, "validate");
		assert.match(output, /BUG docs must live directly under progress\/<initiative>\/bugs\//);
		assert.ok(preview.validation.issues.some((issue) => issue.message === "BUG docs must live directly under progress/<initiative>/bugs/"));
	});

	test("bugs/log.md with progress-type roadmap remains valid", () => {
		const root = makeProgressBugRepo();
		writeDoc(root, ".axm/progress/foo/bugs/index.md", commonIndexMeta([{ path: "log.md", title: "Bug log", "when-to-read": "Review bug board" }]));
		writeDoc(root, ".axm/progress/foo/bugs/log.md", progressMeta({ "progress-type": "roadmap", "workflow-state": "proposed", initiative: "foo" }));

		const result = runNode("scripts/validate.mjs", [`--target=${root}`]);

		assertExit(result, 0, "validate");
	});

	test("bugs/index.md remains skeleton C and valid without progress-type", () => {
		const root = makeProgressBugRepo();

		const result = runNode("scripts/validate.mjs", [`--target=${root}`]);

		assertExit(result, 0, "validate");
	});

	test("--format=flat preserves flat output", () => {
		const root = makeProgressBugRepo();
		writeDoc(root, ".axm/progress/foo/bugs/index.md", commonIndexMeta([{ path: "random.md", title: "Bug", "when-to-read": "Invalid bug" }]));
		writeDoc(root, ".axm/progress/foo/bugs/random.md", progressMeta());

		const result = runNode("scripts/validate.mjs", [`--target=${root}`, "--format=flat"]);
		const output = combinedOutput(result);

		assertExit(result, 1, "validate");
		assert.match(output, /^\[ERROR\]/m);
		assert.doesNotMatch(output, /Affected files:/);
	});

	test("invalid --format exits as an error, not warn-only", () => {
		const root = makeProgressBugRepo();

		const result = runNode("scripts/validate.mjs", [`--target=${root}`, "--format=json"]);

		assertExit(result, 1, "validate");
		assert.match(combinedOutput(result), /--format 非法/);
	});

	test("--format=grouped groups repeated issues", () => {
		const root = makeTempRepo("axm-grouped-");
		writeRootIndex(root, [{ path: "project/", title: "Project", "when-to-read": "Project docs" }]);
		writeDoc(root, ".axm/project/index.md", commonIndexMeta([
			{ path: "a.md", title: "A", "when-to-read": "A" },
			{ path: "b.md", title: "B", "when-to-read": "B" },
		]));
		const meta = {
			"doc-state": "current",
			"last-reviewed": "2026-05-15",
			"applies-to": ["project:smoke"],
		};
		writeDoc(root, ".axm/project/a.md", meta);
		writeDoc(root, ".axm/project/b.md", meta);

		const result = runNode("scripts/validate.mjs", [`--target=${root}`, "--format=grouped"]);
		const output = combinedOutput(result);

		assertExit(result, 1, "validate");
		assert.match(output, /Affected files:/);
		assert.match(output, /2 affected file\(s\)/);
		assert.match(output, /\.axm\/project\/a\.md/);
		assert.match(output, /\.axm\/project\/b\.md/);
	});

	test("more than 20 issues default to grouped output", () => {
		const root = makeTempRepo("axm-default-grouped-");
		const entries = Array.from({ length: 21 }, (_, index) => ({
			path: `doc-${index}.md`,
			title: `Doc ${index}`,
			"when-to-read": "Grouped validation",
		}));
		writeRootIndex(root, [{ path: "project/", title: "Project", "when-to-read": "Project docs" }]);
		writeDoc(root, ".axm/project/index.md", commonIndexMeta(entries));
		for (const entry of entries) {
			writeDoc(root, `.axm/project/${entry.path}`, {
				"doc-state": "current",
				"last-reviewed": "2026-05-15",
				"applies-to": ["project:smoke"],
			});
		}

		const result = runNode("scripts/validate.mjs", [`--target=${root}`]);
		const output = combinedOutput(result);

		assertExit(result, 1, "validate");
		assert.match(output, /Affected files:/);
		assert.match(output, /21 affected file\(s\)/);
	});

	test("directory code-refs emit WARN in CLI and preview validation", () => {
		const root = makeTempRepo("axm-dir-code-ref-");
		fs.mkdirSync(path.join(root, "src"));
		writeRootIndex(root, [{ path: "knowledge/", title: "Knowledge", "when-to-read": "Knowledge docs" }]);
		writeDoc(root, ".axm/knowledge/index.md", commonIndexMeta([{ path: "system/", title: "System", "when-to-read": "System docs" }]));
		writeDoc(root, ".axm/knowledge/system/index.md", commonIndexMeta([{ path: "overview.md", title: "Overview", "when-to-read": "System overview" }]));
		writeDoc(root, ".axm/knowledge/system/overview.md", {
			"doc-state": "current",
			"last-reviewed": "2026-05-15",
			owner: "tests",
			depth: "overview",
			"code-refs": ["src"],
		});

		const result = runNode("scripts/validate.mjs", [`--target=${root}`]);
		const output = combinedOutput(result);
		const preview = buildPreviewModel(root);

		assertExit(result, 2, "validate");
		assert.match(output, /^\[WARN\].*code-refs.*目录/m);
		assert.equal(preview.validation.status, "warn");
		assert.equal(preview.validation.warnings, 1);
		assert.match(preview.validation.issues[0].message, /目录/);
	});

	test("preview validation mirrors index orphan warnings", () => {
		const root = makeTempRepo("axm-preview-orphan-");
		writeRootIndex(root, [{ path: "project/", title: "Project", "when-to-read": "Project docs" }]);
		writeDoc(root, ".axm/project/index.md", commonIndexMeta([]));
		writeDoc(root, ".axm/project/orphan.md", {
			"doc-state": "current",
			"last-reviewed": "2026-05-15",
			owner: "tests",
			"applies-to": ["project:smoke"],
		});

		const result = runNode("scripts/validate.mjs", [`--target=${root}`]);
		const preview = buildPreviewModel(root);

		assertExit(result, 2, "validate");
		assert.match(combinedOutput(result), /发现孤儿子项未登记到 entries：orphan\.md/);
		assert.equal(preview.validation.status, "warn");
		assert.ok(preview.validation.issues.some((issue) => issue.message === "发现孤儿子项未登记到 entries：orphan.md"));
	});

	test("preview validation mirrors orphan warnings when index entries are malformed", () => {
		const root = makeTempRepo("axm-preview-malformed-index-");
		writeRootIndex(root, [{ path: "project/", title: "Project", "when-to-read": "Project docs" }]);
		writeDoc(root, ".axm/project/index.md", {
			"doc-state": "current",
			"last-reviewed": "2026-05-15",
			owner: "tests",
		});
		writeDoc(root, ".axm/project/orphan.md", {
			"doc-state": "current",
			"last-reviewed": "2026-05-15",
			owner: "tests",
			"applies-to": ["project:smoke"],
		});

		const result = runNode("scripts/validate.mjs", [`--target=${root}`]);
		const preview = buildPreviewModel(root);

		assertExit(result, 1, "validate");
		assert.match(combinedOutput(result), /index 文档缺少 entries 列表/);
		assert.match(combinedOutput(result), /发现孤儿子项未登记到 entries：orphan\.md/);
		assert.equal(preview.validation.status, "error");
		assert.equal(preview.validation.errors, 1);
		assert.equal(preview.validation.warnings, 1);
		assert.ok(preview.validation.issues.some((issue) => issue.message === "发现孤儿子项未登记到 entries：orphan.md"));
	});

	test("preview validation mirrors non-direct index entry errors", () => {
		const root = makeTempRepo("axm-preview-index-entry-");
		writeRootIndex(root, [{ path: ".axm/universal/docs.md", title: "Docs", "when-to-read": "Invalid non-direct entry" }]);
		writeDoc(root, ".axm/universal/index.md", commonIndexMeta([{ path: "docs.md", title: "Docs", "when-to-read": "Docs" }]));
		writeDoc(root, ".axm/universal/docs.md", {
			"doc-state": "current",
			"last-reviewed": "2026-05-15",
			owner: "tests",
			"applies-to": ["universal"],
		});

		const result = runNode("scripts/validate.mjs", [`--target=${root}`]);
		const preview = buildPreviewModel(root);

		assertExit(result, 1, "validate");
		assert.match(combinedOutput(result), /entries 引用的子项不存在：\.axm\/universal\/docs\.md/);
		assert.equal(preview.validation.status, "error");
		assert.ok(preview.validation.issues.some((issue) => issue.message === "entries 引用的子项不存在：.axm/universal/docs.md"));
	});

	test("preview validation mirrors AGENTS.md warnings", () => {
		const missingAgentsRoot = makeTempRepo("axm-preview-missing-agents-");
		fs.rmSync(path.join(missingAgentsRoot, "AGENTS.md"), { force: true });
		writeRootIndex(missingAgentsRoot, []);

		const missingAgentsCli = runNode("scripts/validate.mjs", [`--target=${missingAgentsRoot}`]);
		const missingAgentsPreview = buildPreviewModel(missingAgentsRoot);

		assertExit(missingAgentsCli, 2, "validate");
		assert.equal(missingAgentsPreview.validation.status, "warn");
		assert.ok(missingAgentsPreview.validation.issues.some((issue) => issue.message === "AGENTS.md 不存在（跳过引用检查）"));

		const missingIndexRoot = makeTempRepo("axm-preview-missing-knowledge-index-");
		fs.writeFileSync(path.join(missingIndexRoot, "AGENTS.md"), "# AGENTS.md\n", "utf8");
		writeRootIndex(missingIndexRoot, []);

		const missingIndexCli = runNode("scripts/validate.mjs", [`--target=${missingIndexRoot}`]);
		const missingIndexPreview = buildPreviewModel(missingIndexRoot);

		assertExit(missingIndexCli, 2, "validate");
		assert.equal(missingIndexPreview.validation.status, "warn");
		assert.ok(missingIndexPreview.validation.issues.some((issue) => issue.message === "未找到 '## Knowledge Index' 段（跳过引用检查）"));
	});

	test("preview validation mirrors missing axm-meta errors", () => {
		const root = makeTempRepo("axm-preview-missing-meta-");
		writeRootIndex(root, [{ path: "project/", title: "Project", "when-to-read": "Project docs" }]);
		writeDoc(root, ".axm/project/index.md", commonIndexMeta([{ path: "a.md", title: "A", "when-to-read": "A" }]));
		fs.writeFileSync(path.join(root, ".axm/project/a.md"), "# Missing metadata\n", "utf8");

		const result = runNode("scripts/validate.mjs", [`--target=${root}`]);
		const preview = buildPreviewModel(root);

		assertExit(result, 1, "validate");
		assert.match(combinedOutput(result), /缺少 axm-meta 注释块/);
		assert.equal(preview.validation.status, "error");
		assert.deepEqual(
			preview.validation.issues.filter((issue) => issue.file === ".axm/project/a.md").map((issue) => issue.message),
			["缺少 axm-meta 注释块（必须以 <!-- axm-meta 开头）"],
		);
	});

	test("preview validation mirrors BUG contract checks", () => {
		const root = makeProgressBugRepo();
		writeDoc(root, ".axm/progress/foo/bugs/index.md", commonIndexMeta([{ path: "random.md", title: "Bug", "when-to-read": "Invalid bug" }]));
		writeDoc(root, ".axm/progress/foo/bugs/random.md", progressMeta());

		const model = buildPreviewModel(root);

		assert.equal(model.validation.status, "error");
		assert.ok(model.validation.issues.some((issue) => issue.rule === "bug-doc-guide.md §0.3"));
	});
});
