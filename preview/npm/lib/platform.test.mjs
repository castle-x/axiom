import assert from "node:assert/strict";
import test from "node:test";

import { resolveVendorBinaryName } from "./platform.mjs";

test("resolves supported npm host platforms to bundled binaries", () => {
  assert.equal(
    resolveVendorBinaryName({ platform: "darwin", arch: "arm64" }),
    "axiom-preview-darwin-arm64",
  );
  assert.equal(
    resolveVendorBinaryName({ platform: "linux", arch: "x64" }),
    "axiom-preview-linux-amd64",
  );
  assert.equal(
    resolveVendorBinaryName({ platform: "win32", arch: "x64" }),
    "axiom-preview-windows-amd64.exe",
  );
});

test("rejects unsupported npm host platforms", () => {
  assert.throws(
    () => resolveVendorBinaryName({ platform: "freebsd", arch: "x64" }),
    /unsupported platform/,
  );
});
