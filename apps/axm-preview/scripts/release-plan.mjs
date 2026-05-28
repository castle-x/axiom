const binaryBaseName = "axiom-preview";

export const releaseTargets = Object.freeze([
  Object.freeze({ goos: "darwin", goarch: "amd64" }),
  Object.freeze({ goos: "darwin", goarch: "arm64" }),
  Object.freeze({ goos: "linux", goarch: "amd64" }),
  Object.freeze({ goos: "linux", goarch: "arm64" }),
  Object.freeze({ goos: "windows", goarch: "amd64" }),
]);

export function targetId(target) {
  return `${target.goos}-${target.goarch}`;
}

export function binaryNameForTarget(target) {
  const suffix = target.goos === "windows" ? ".exe" : "";
  return `${binaryBaseName}-${targetId(target)}${suffix}`;
}

export function npmVendorNameForTarget(target) {
  return binaryNameForTarget(target);
}

export function archiveNameForTarget(version, target) {
  return `${binaryBaseName}_${cleanVersion(version)}_${target.goos}_${target.goarch}.tar.gz`;
}

export function cleanVersion(version) {
  return version.replace(/^preview-v/, "").replace(/^v/, "");
}
