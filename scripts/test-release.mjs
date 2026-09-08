import fs from "node:fs";
import assert from "node:assert/strict";
import test from "node:test";
import { execFileSync } from "node:child_process";
import {
  validateSource,
  validateChecks,
  requiredChecks,
  releaseVersion,
} from "./release-preflight.mjs";
const commit = "a".repeat(40);
test("release eligibility rejects lightweight tags, mismatched versions/commits and missing or failed checks", () => {
  assert.equal(releaseVersion("v1.3.0"), "1.3.0");
  for (const tag of ["v01.3.0", "v1.3.0-beta", "1.3.0", "v1.3.0\n"])
    assert.throws(() => releaseVersion(tag));
  const source = {
    tag: "v1.3.0",
    type: "tag",
    commit,
    main: commit,
    version: "1.3.0",
  };
  assert.doesNotThrow(() => validateSource(source));
  for (const patch of [
    { type: "commit" },
    { version: "1.2.10" },
    { main: "b".repeat(40) },
  ])
    assert.throws(() => validateSource({ ...source, ...patch }));
  const checks = requiredChecks.map((name, id) => ({
    name,
    id,
    head_sha: commit,
    app: { slug: "github-actions" },
    status: "completed",
    conclusion: "success",
  }));
  assert.doesNotThrow(() => validateChecks(checks, commit));
  assert.throws(() => validateChecks(checks.slice(1), commit));
  assert.throws(() =>
    validateChecks(
      [...checks, { ...checks[0], id: 100, conclusion: "failure" }],
      commit,
    ),
  );
});
test("build refuses a version override that was not committed in source", () => {
  assert.throws(
    () =>
      execFileSync(
        process.execPath,
        ["scripts/build-extension.cjs", "--version=9.9.9"],
        { stdio: "pipe" },
      ),
    (error) => error.stderr.toString().includes("build never rewrites it"),
  );
  // Restore the normal build after the deliberate failure.
  execFileSync(process.execPath, ["scripts/build-extension.cjs"]);
});
test("public instructions and manifests use one release version without obsolete compatibility injection", () => {
  const version = JSON.parse(fs.readFileSync("package.json")).version;
  assert.ok(
    fs.readFileSync("README.md", "utf8").includes(`Current build: v${version}`),
  );
  const source = fs.readFileSync("src/popup/popup.js", "utf8");
  assert.ok(
    source.includes("/shared/model.js") &&
      source.includes("/content/content.js"),
  );
  assert.ok(!source.includes("compatibility.js"));
  assert.ok(!fs.existsSync("src/content/compatibility.js"));
  for (const file of [
    "src/popup/popup.html",
    "website/index.html",
    "website/datenschutz.html",
    "website/404.html",
    "assets/store/listing.md",
  ]) {
    const text = fs.readFileSync(file, "utf8");
    const links = [...text.matchAll(/https:\/\/[^\s"'<>\)]+/g)].map(
      ([value]) => new URL(value),
    );
    assert.ok(links.some((url) => url.href === "https://koalastuff.net/legal"));
    assert.ok(
      !links.some(
        (url) =>
          url.hostname === "koalastuff.net" && url.pathname === "/imprint",
      ),
    );
  }
});

test("repeated builds produce identical ZIPs", () => {
  const version = JSON.parse(fs.readFileSync("package.json")).version;
  const files = ["chrome", "firefox", "website"].map(
    (type) => "dist/koalaclicker-" + type + "-v" + version + ".zip",
  );
  const before = files.map((file) => fs.readFileSync(file));
  execFileSync(process.execPath, ["scripts/build-extension.cjs"]);
  for (let index = 0; index < files.length; index++)
    assert.deepEqual(fs.readFileSync(files[index]), before[index]);
});
