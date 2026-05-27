#!/usr/bin/env node
import { chmod, copyFile, cp, mkdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";

import {
  archiveNameForTarget,
  binaryNameForTarget,
  cleanVersion,
  npmVendorNameForTarget,
  releaseTargets,
} from "./release-plan.mjs";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const defaultRootDir = path.resolve(currentDir, "..");

export async function stageNpmPackage({
  rootDir = defaultRootDir,
  binDir = path.join(rootDir, "bin"),
  outputDir = path.join(rootDir, "dist", "npm"),
  version,
} = {}) {
  if (!version) {
    throw new Error("--version is required");
  }

  const npmSourceDir = path.join(rootDir, "npm");
  const vendorDir = path.join(outputDir, "vendor");

  await rm(outputDir, { recursive: true, force: true });
  await mkdir(outputDir, { recursive: true });
  await mkdir(vendorDir, { recursive: true });

  await cp(path.join(npmSourceDir, "bin"), path.join(outputDir, "bin"), {
    recursive: true,
  });
  await mkdir(path.join(outputDir, "lib"), { recursive: true });
  await copyFile(
    path.join(npmSourceDir, "lib", "platform.mjs"),
    path.join(outputDir, "lib", "platform.mjs"),
  );
  await copyFile(path.join(npmSourceDir, "README.md"), path.join(outputDir, "README.md"));

  const packageJsonPath = path.join(npmSourceDir, "package.json");
  const packageJson = JSON.parse(await readFile(packageJsonPath, "utf8"));
  packageJson.version = cleanVersion(version);
  await writeFile(
    path.join(outputDir, "package.json"),
    `${JSON.stringify(packageJson, null, 2)}\n`,
  );

  await chmodExecutable(path.join(outputDir, "bin", "axiom-preview.js"));

  for (const target of releaseTargets) {
    const sourcePath = path.join(binDir, binaryNameForTarget(target));
    await assertFileExists(sourcePath);
    const vendorPath = path.join(outputDir, "vendor", npmVendorNameForTarget(target));
    await copyFile(sourcePath, vendorPath);
    await chmodExecutable(vendorPath);
  }
}

export async function createReleaseArchives({
  rootDir = defaultRootDir,
  binDir = path.join(rootDir, "bin"),
  outputDir = path.join(rootDir, "dist", "release"),
  version,
} = {}) {
  if (!version) {
    throw new Error("--version is required");
  }

  await rm(outputDir, { recursive: true, force: true });
  await mkdir(outputDir, { recursive: true });

  const workDir = path.join(outputDir, ".work");
  await rm(workDir, { recursive: true, force: true });
  await mkdir(workDir, { recursive: true });

  for (const target of releaseTargets) {
    const sourcePath = path.join(binDir, binaryNameForTarget(target));
    await assertFileExists(sourcePath);

    const packageDirName = `axiom-preview-${cleanVersion(version)}-${target.goos}-${target.goarch}`;
    const packageDir = path.join(workDir, packageDirName);
    await mkdir(packageDir, { recursive: true });

    const executableName = target.goos === "windows" ? "axiom-preview.exe" : "axiom-preview";
    const executablePath = path.join(packageDir, executableName);
    await copyFile(sourcePath, executablePath);
    await chmodExecutable(executablePath);
    await writeFile(
      path.join(packageDir, "README.txt"),
      [
        "Axiom Preview",
        "",
        `Version: ${cleanVersion(version)}`,
        `Target: ${target.goos}/${target.goarch}`,
        "",
        `Run: ./${executableName} --target=/path/to/project --port=8765`,
        "",
      ].join("\n"),
    );

    const archivePath = path.join(outputDir, archiveNameForTarget(version, target));
    const result = spawnSync("tar", ["-czf", archivePath, "-C", workDir, packageDirName], {
      stdio: "inherit",
    });
    if (result.status !== 0) {
      throw new Error(`tar failed for ${packageDirName}`);
    }
  }

  await rm(workDir, { recursive: true, force: true });
  await writeFile(
    path.join(outputDir, "RELEASE_NOTES.md"),
    [
      `## Axiom Preview ${cleanVersion(version)}`,
      "",
      "### Install",
      "",
      "```bash",
      "npm install -g @castle-xx/axm-preview",
      "axiom-preview --target=/path/to/project",
      "```",
      "",
      "Or run directly:",
      "",
      "```bash",
      "npx @castle-xx/axm-preview --target=/path/to/project",
      "```",
      "",
    ].join("\n"),
  );
}

function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--version") {
      args.version = argv[index + 1];
      index += 1;
    } else if (arg.startsWith("--version=")) {
      args.version = arg.slice("--version=".length);
    } else if (arg === "--bin-dir") {
      args.binDir = argv[index + 1];
      index += 1;
    } else if (arg.startsWith("--bin-dir=")) {
      args.binDir = arg.slice("--bin-dir=".length);
    } else if (arg === "--release-dir") {
      args.releaseDir = argv[index + 1];
      index += 1;
    } else if (arg.startsWith("--release-dir=")) {
      args.releaseDir = arg.slice("--release-dir=".length);
    } else if (arg === "--npm-dir") {
      args.npmDir = argv[index + 1];
      index += 1;
    } else if (arg.startsWith("--npm-dir=")) {
      args.npmDir = arg.slice("--npm-dir=".length);
    } else {
      throw new Error(`unknown argument: ${arg}`);
    }
  }
  return args;
}

async function assertFileExists(filePath) {
  const info = await stat(filePath).catch(() => null);
  if (!info?.isFile()) {
    throw new Error(`required binary not found: ${filePath}`);
  }
}

async function chmodExecutable(filePath) {
  await stat(filePath);
  await chmod(filePath, 0o755);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const version = cleanVersion(args.version ?? "");
  if (!version) {
    throw new Error("--version is required");
  }

  await createReleaseArchives({
    version,
    binDir: args.binDir,
    outputDir: args.releaseDir,
  });
  await stageNpmPackage({
    version,
    binDir: args.binDir,
    outputDir: args.npmDir,
  });

  console.log(`Created preview release artifacts for ${version}`);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
}
