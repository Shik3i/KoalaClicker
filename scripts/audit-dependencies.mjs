import { spawnSync } from "node:child_process";
const result = spawnSync(
  process.platform === "win32" ? "npm.cmd" : "npm",
  ["audit", "--json"],
  { encoding: "utf8", shell: process.platform === "win32" },
);
if (result.error) throw result.error;
let report;
try {
  report = JSON.parse(result.stdout);
} catch {
  throw Error(result.stderr || "npm audit did not return JSON");
}
if (report.error) throw Error(JSON.stringify(report.error));
const expected = new Set([
  "https://github.com/advisories/GHSA-w3rx-r6r6-pgpr",
  "https://github.com/advisories/GHSA-5p2g-fcmc-qvqq",
]);
for (const [name, value] of Object.entries(report.vulnerabilities || {})) {
  if (
    !["image-size", "addons-linter"].includes(name) ||
    (!value.isDirect && name !== "image-size")
  )
    throw Error(`Unreviewed vulnerable dependency: ${name}`);
  for (const via of value.via) {
    if (typeof via === "string") {
      if (via !== "image-size") throw Error(`Unreviewed chain: ${via}`);
    } else if (!expected.has(via.url))
      throw Error(`Unreviewed advisory: ${via.url}`);
  }
}
console.log(JSON.stringify(report.metadata.vulnerabilities));
if (Object.keys(report.vulnerabilities || {}).length)
  console.log(
    "Known development-only image-size parser advisories remain upstream. Firefox lint preloads disabled ICNS/JXL/HEIF parsers; regression tests enforce rejection. No dependencies are shipped in extension packages.",
  );
