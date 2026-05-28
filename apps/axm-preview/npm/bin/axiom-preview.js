#!/usr/bin/env node
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { resolveVendorBinaryName } from "../lib/platform.mjs";

const packageRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const binaryPath = path.join(packageRoot, "vendor", resolveVendorBinaryName());

if (!existsSync(binaryPath)) {
  console.error(`axiom-preview binary not found: ${binaryPath}`);
  process.exit(1);
}

const child = spawn(binaryPath, process.argv.slice(2), { stdio: "inherit" });

child.on("error", (error) => {
  console.error(`failed to start axiom-preview: ${error.message}`);
  process.exit(1);
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 1);
});
