#!/usr/bin/env node
/**
 * Install the Axiom skill family into an Agent Skills directory.
 *
 * Usage:
 *   node scripts/install-skills.mjs [--target=~/.claude/skills] [--force]
 */

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const REPO_ROOT = path.resolve(path.dirname(__filename), "..");
const SKILLS_ROOT = path.join(REPO_ROOT, "skills");
const DEFAULT_TARGET = path.join(os.homedir(), ".claude", "skills");

function parseArgs(argv) {
	const args = { target: DEFAULT_TARGET, force: false };
	for (let index = 2; index < argv.length; index++) {
		const arg = argv[index];
		const match = arg.match(/^--([a-zA-Z-]+)(?:=(.*))?$/);
		if (!match) throw new Error(`无法解析参数 "${arg}"`);
		const key = match[1];
		const value = match[2] ?? (argv[index + 1] && !argv[index + 1].startsWith("--") ? argv[++index] : true);
		if (key === "target") {
			if (value === true) throw new Error("--target 需要目录路径");
			args.target = String(value);
		} else if (key === "force") args.force = true;
		else throw new Error(`未知参数 --${key}`);
	}
	args.target = expandHome(args.target);
	return args;
}

function expandHome(value) {
	if (value === "~") return os.homedir();
	if (value.startsWith("~/")) return path.join(os.homedir(), value.slice(2));
	return value;
}

function skillDirs() {
	return fs.readdirSync(SKILLS_ROOT, { withFileTypes: true })
		.filter((entry) => entry.isDirectory() && entry.name.startsWith("axm-"))
		.map((entry) => entry.name)
		.sort();
}

function main() {
	const args = parseArgs(process.argv);
	const targetRoot = path.resolve(args.target);
	fs.mkdirSync(targetRoot, { recursive: true });

	const manifest = { installed: [], skipped: [], overwritten: [] };
	for (const name of skillDirs()) {
		const source = path.join(SKILLS_ROOT, name);
		const dest = path.join(targetRoot, name);
		const exists = fs.existsSync(dest);
		if (exists && !args.force) {
			manifest.skipped.push(name);
			continue;
		}
		if (exists) fs.rmSync(dest, { recursive: true, force: true });
		fs.cpSync(source, dest, {
			recursive: true,
			filter: (src) => !src.includes(`${path.sep}node_modules${path.sep}`),
		});
		if (exists) manifest.overwritten.push(name);
		else manifest.installed.push(name);
	}

	console.log(`Axiom skills target: ${targetRoot}`);
	printGroup("installed", manifest.installed, "+");
	printGroup("overwritten", manifest.overwritten, "~");
	printGroup("skipped", manifest.skipped, "=");
	if (manifest.skipped.length > 0 && !args.force) {
		console.log("Existing skills were skipped. Rerun with --force to overwrite them.");
	}
}

function printGroup(title, items, marker) {
	if (items.length === 0) return;
	console.log(`\n-- ${title} --`);
	for (const item of items) console.log(`  ${marker} ${item}`);
}

try {
	main();
} catch (error) {
	console.error(error.message);
	process.exit(1);
}
