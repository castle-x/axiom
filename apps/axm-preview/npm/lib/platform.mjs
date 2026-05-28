const platformMap = new Map([
  ["darwin", "darwin"],
  ["linux", "linux"],
  ["win32", "windows"],
]);

const archMap = new Map([
  ["x64", "amd64"],
  ["arm64", "arm64"],
]);

const supportedTargets = new Set([
  "darwin-amd64",
  "darwin-arm64",
  "linux-amd64",
  "linux-arm64",
  "windows-amd64",
]);

export function resolveVendorBinaryName(host = process) {
  const goos = platformMap.get(host.platform);
  const goarch = archMap.get(host.arch);

  if (!goos || !goarch) {
    throw new Error(`unsupported platform: ${host.platform}/${host.arch}`);
  }

  const target = `${goos}-${goarch}`;
  if (!supportedTargets.has(target)) {
    throw new Error(`unsupported platform: ${host.platform}/${host.arch}`);
  }

  const suffix = goos === "windows" ? ".exe" : "";
  return `axiom-preview-${target}${suffix}`;
}
