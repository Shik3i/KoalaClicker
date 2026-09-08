import { execFileSync } from "node:child_process";
import { appendFileSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const requiredChecks = [
  "verify",
  "browser (chrome)",
  "browser (firefox)",
  "website",
  "analyze",
];
export function releaseVersion(tag) {
  if (
    !/^v(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(tag) ||
    /\s/.test(tag)
  )
    throw new Error("Expected stable annotated tag vMAJOR.MINOR.PATCH");
  return tag.slice(1);
}
export function validateSource({ tag, type, commit, main, version }) {
  if (type !== "tag") throw new Error("Release tag must be annotated");
  if (!/^[a-f0-9]{40}$/.test(commit) || commit !== main)
    throw new Error("Release tag must point to the exact remote main commit");
  if (version !== releaseVersion(tag))
    throw new Error("Package version does not match release tag");
}
export function validateChecks(checks, commit) {
  for (const name of requiredChecks) {
    const check = checks
      .filter(
        (c) =>
          c.name === name &&
          c.head_sha === commit &&
          c.app?.slug === "github-actions",
      )
      .sort((a, b) => b.id - a.id)[0];
    if (
      !check ||
      check.status !== "completed" ||
      check.conclusion !== "success"
    )
      throw new Error(`Required check is not successful: ${name}`);
  }
}
export function run(command, args) {
  return execFileSync(command, args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "inherit"],
  }).trim();
}
export function preflight(tag, repo) {
  const version = releaseVersion(tag);
  if (!/^[\w.-]+\/[\w.-]+$/.test(repo)) throw new Error("Invalid repository");
  const ref = `refs/tags/${tag}`;
  const commit = run("git", ["rev-parse", `${ref}^{commit}`]);
  const remoteTag = JSON.parse(
    run("gh", ["api", `repos/${repo}/git/ref/tags/${tag}`]),
  ).object;
  if (
    remoteTag.type !== "tag" ||
    remoteTag.sha !== run("git", ["rev-parse", ref])
  )
    throw new Error("Remote annotated tag changed since checkout");
  const main = JSON.parse(
    run("gh", ["api", `repos/${repo}/git/ref/heads/main`]),
  ).object.sha;
  validateSource({
    tag,
    type: run("git", ["cat-file", "-t", ref]),
    commit,
    main,
    version: JSON.parse(readFileSync("package.json", "utf8")).version,
  });
  if (run("git", ["rev-parse", "HEAD"]) !== commit)
    throw new Error("Checkout does not match tag commit");
  const pages = JSON.parse(
    run("gh", [
      "api",
      "--paginate",
      "--slurp",
      `repos/${repo}/commits/${commit}/check-runs?per_page=100&filter=all`,
    ]),
  );
  validateChecks(
    pages.flatMap((page) => page.check_runs),
    commit,
  );
  // A paginated successful read distinguishes absence from an API/authentication failure.
  const releases = JSON.parse(
    run("gh", [
      "api",
      "--paginate",
      "--slurp",
      `repos/${repo}/releases?per_page=100`,
    ]),
  ).flat();
  if (releases.some((release) => release.tag_name === tag && !release.draft))
    throw new Error("Refusing to replace a published release");
  if (process.env.GITHUB_OUTPUT)
    appendFileSync(
      process.env.GITHUB_OUTPUT,
      `version=${version}\ncommit=${commit}\n`,
    );
  console.log(`Release preflight passed: ${tag} at ${commit}`);
}
if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
)
  preflight(
    process.env.GITHUB_REF_NAME || process.argv[2],
    process.env.GITHUB_REPOSITORY || "Shik3i/KoalaClicker",
  );
