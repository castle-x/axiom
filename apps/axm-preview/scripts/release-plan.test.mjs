import assert from "node:assert/strict";
import test from "node:test";

import {
  releaseTargets,
  archiveNameForTarget,
  binaryNameForTarget,
  npmVendorNameForTarget,
} from "./release-plan.mjs";

test("release targets cover macOS, Windows, and Linux", () => {
  assert.deepEqual(
    releaseTargets.map((target) => `${target.goos}/${target.goarch}`),
    [
      "darwin/amd64",
      "darwin/arm64",
      "linux/amd64",
      "linux/arm64",
      "windows/amd64",
    ],
  );
});

test("release assets use stable cross-platform names", () => {
  const windows = releaseTargets.find((target) => target.goos === "windows");
  const macArm = releaseTargets.find(
    (target) => target.goos === "darwin" && target.goarch === "arm64",
  );

  assert.equal(binaryNameForTarget(windows), "axiom-preview-windows-amd64.exe");
  assert.equal(npmVendorNameForTarget(macArm), "axiom-preview-darwin-arm64");
  assert.equal(
    archiveNameForTarget("1.2.3", macArm),
    "axiom-preview_1.2.3_darwin_arm64.tar.gz",
  );
});
