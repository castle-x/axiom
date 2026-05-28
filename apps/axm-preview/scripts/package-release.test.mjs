import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

import { stageNpmPackage } from "./package-release.mjs";
import { binaryNameForTarget, releaseTargets } from "./release-plan.mjs";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const previewRoot = path.resolve(currentDir, "..");

test("stages npm package with versioned metadata and bundled binaries", async () => {
  const workspace = await mkdtemp(path.join(tmpdir(), "axiom-preview-release-"));
  const binDir = path.join(workspace, "bin");
  const outputDir = path.join(workspace, "npm");
  await mkdir(binDir, { recursive: true });

  for (const target of releaseTargets) {
    await writeFile(path.join(binDir, binaryNameForTarget(target)), "binary");
  }

  await stageNpmPackage({
    rootDir: previewRoot,
    binDir,
    outputDir,
    version: "1.2.3",
  });

  const packageJson = JSON.parse(
    await readFile(path.join(outputDir, "package.json"), "utf8"),
  );
  assert.equal(packageJson.name, "@castle-xx/axm-preview");
  assert.equal(packageJson.version, "1.2.3");
  assert.deepEqual(packageJson.bin, {
    "axiom-preview": "./bin/axiom-preview.js",
  });

  const macBinary = await stat(
    path.join(outputDir, "vendor", "axiom-preview-darwin-arm64"),
  );
  assert.equal(macBinary.mode & 0o111, 0o111);

  await stat(path.join(outputDir, "vendor", "axiom-preview-windows-amd64.exe"));
});
