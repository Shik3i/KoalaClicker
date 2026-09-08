import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { sha, verifyArchives, git } from "./release-assets.mjs";
const repo = process.env.GITHUB_REPOSITORY || "Shik3i/KoalaClicker";
if (repo !== "Shik3i/KoalaClicker") throw Error("Unexpected repository");
const version = JSON.parse(fs.readFileSync("package.json")).version,
  tag = `v${version}`,
  commit = git("rev-parse", "HEAD");
const run = (args) =>
  execFileSync("gh", args, { maxBuffer: 100 * 1024 * 1024 });
const api = (endpoint, body) =>
  JSON.parse(
    execFileSync(
      "gh",
      ["api", endpoint, ...(body ? ["--method", "POST", "--input", "-"] : [])],
      {
        input: body ? JSON.stringify(body) : undefined,
        encoding: "utf8",
        maxBuffer: 10 * 1024 * 1024,
      },
    ),
  );
const releases = JSON.parse(
  run(["api", "--paginate", "--slurp", `repos/${repo}/releases?per_page=100`]),
).flat();
let release = releases.find((item) => item.tag_name === tag);
if (process.argv.includes("--create")) {
  if (release && !release.draft)
    throw Error("Published releases are immutable.");
  if (!release)
    release = api(`repos/${repo}/releases`, {
      tag_name: tag,
      target_commitish: commit,
      name: `KoalaClicker ${tag}`,
      draft: true,
      prerelease: false,
      body: "Reliable local storage across tabs, safer stopped target selection, target reselection and stop-all controls. Chrome and Firefox workflow tests, full archive inventories, checksums and provenance. Website deployment and store submission are manual. See README and assets/store for test scope and operator prerequisites.",
    });
  if (release.assets.length)
    throw Error(
      "Draft already contains assets; inspect by release ID before any rerun. No assets are replaced.",
    );
  run([
    "release",
    "upload",
    tag,
    ...fs
      .readdirSync("dist")
      .filter(
        (name) =>
          name.endsWith(".zip") ||
          ["SHA256SUMS", "INVENTORY.json", "PROVENANCE.json"].includes(name),
      )
      .map((name) => path.join("dist", name)),
    "--repo",
    repo,
  ]);
  release = api(`repos/${repo}/releases/${release.id}`);
}
if (!release) throw Error("Release not found in authenticated release list.");
const expected = [
  ...["chrome", "firefox", "source", "website"].map(
    (type) => `koalaclicker-${type}-v${version}.zip`,
  ),
  "SHA256SUMS",
  "INVENTORY.json",
  "PROVENANCE.json",
].sort();
if (
  JSON.stringify(release.assets.map((item) => item.name).sort()) !==
  JSON.stringify(expected)
)
  throw Error("Unexpected release asset inventory");
const download = path.resolve("build", `release-download-${release.id}`);
fs.mkdirSync(download, { recursive: true });
for (const asset of release.assets) {
  const bytes = run([
    "api",
    `repos/${repo}/releases/assets/${asset.id}`,
    "-H",
    "Accept: application/octet-stream",
  ]);
  const output = path.join(download, asset.name);
  fs.writeFileSync(output, bytes);
  if (
    process.argv.includes("--publish") &&
    sha(bytes) !== sha(fs.readFileSync(path.join("dist", asset.name)))
  )
    throw Error(`Downloaded bytes differ from checked build: ${asset.name}`);
}
await verifyArchives(download, version, true);
const provenance = JSON.parse(
  fs.readFileSync(path.join(download, "PROVENANCE.json")),
);
if (provenance.commit !== commit || provenance.tag !== tag)
  throw Error("Source provenance differs from checkout");
if (process.argv.includes("--attest") || process.argv.includes("--publish")) {
  for (const name of expected.filter((name) => name.endsWith(".zip"))) {
    run([
      "attestation",
      "verify",
      path.join(download, name),
      "--repo",
      repo,
      "--signer-workflow",
      `${repo}/.github/workflows/release.yml`,
      "--source-ref",
      `refs/tags/${tag}`,
      "--source-digest",
      commit,
    ]);
  }
}
if (process.argv.includes("--publish")) {
  if (!release.draft) throw Error("Refusing to republish an existing release.");
  execFileSync(
    "gh",
    [
      "api",
      `repos/${repo}/releases/${release.id}`,
      "--method",
      "PATCH",
      "--input",
      "-",
    ],
    {
      input: JSON.stringify({ draft: false, make_latest: "true" }),
      stdio: ["pipe", "ignore", "inherit"],
    },
  );
}
console.log(
  `Verified ${release.draft ? "draft" : "published"} release ${release.id}: ${release.html_url}\nDownloads: ${download}`,
);
