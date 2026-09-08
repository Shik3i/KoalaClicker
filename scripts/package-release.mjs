import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { readZip, sha, git, verifyArchives } from "./release-assets.mjs";
const version = JSON.parse(fs.readFileSync("package.json")).version;
const source = path.resolve(`dist/koalaclicker-source-v${version}.zip`);
if (git("status", "--porcelain", "--untracked-files=no"))
  throw Error("Reviewer archive requires a clean committed source tree.");
execFileSync("git", [
  "-c",
  `safe.directory=${process.cwd().replaceAll("\\", "/")}`,
  "-c",
  "core.autocrlf=false",
  "-c",
  "core.eol=lf",
  "archive",
  "--format=zip",
  `--output=${source}`,
  "HEAD",
]);
const provenance = {
  repository: "Shik3i/KoalaClicker",
  version,
  commit: git("rev-parse", "HEAD"),
  tag: `v${version}`,
  workflow: ".github/workflows/release.yml",
  runId: process.env.GITHUB_RUN_ID || null,
};
fs.writeFileSync(
  "dist/PROVENANCE.json",
  JSON.stringify(provenance, null, 2) + "\n",
);
const names = ["chrome", "firefox", "source", "website"].map(
  (type) => `koalaclicker-${type}-v${version}.zip`,
);
const inventory = {};
for (const name of names) {
  const files = await readZip(path.join("dist", name));
  inventory[name] = Object.fromEntries(
    [...files]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, bytes]) => [key, sha(bytes)]),
  );
}
fs.writeFileSync(
  "dist/INVENTORY.json",
  JSON.stringify(inventory, null, 2) + "\n",
);
fs.writeFileSync(
  "dist/SHA256SUMS",
  [...names, "INVENTORY.json", "PROVENANCE.json"]
    .sort()
    .map((name) => `${sha(fs.readFileSync(path.join("dist", name)))}  ${name}`)
    .join("\n") + "\n",
);
await verifyArchives("dist", version, true);
console.log("Release files prepared and verified.");
