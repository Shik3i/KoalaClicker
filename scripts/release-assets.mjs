import fs from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { createHash } from "node:crypto";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url),
  yauzl = require("yauzl");
export const sha = (bytes) => createHash("sha256").update(bytes).digest("hex");
export function readZip(file) {
  return new Promise((resolve, reject) =>
    yauzl.open(file, { lazyEntries: true }, (error, zip) => {
      if (error) return reject(error);
      const files = new Map();
      zip.on("error", reject);
      zip.on("entry", (entry) => {
        const name = entry.fileName;
        if (name.endsWith("/")) {
          zip.readEntry();
          return;
        }
        if (
          name.includes("\\") ||
          name.includes(":") ||
          name.startsWith("/") ||
          name.split("/").some((part) => part === ".." || part === "") ||
          files.has(name)
        ) {
          zip.close();
          reject(new Error(`Unsafe/duplicate ZIP entry: ${name}`));
          return;
        }
        if (((entry.externalFileAttributes >>> 16) & 0xf000) === 0xa000) {
          zip.close();
          reject(new Error("Symlinks are not allowed in archives"));
          return;
        }
        if (entry.uncompressedSize > 30_000_000) {
          reject(new Error(`Oversized entry: ${name}`));
          zip.close();
          return;
        }
        zip.openReadStream(entry, (error, stream) => {
          if (error) return reject(error);
          const chunks = [];
          stream.on("data", (chunk) => chunks.push(chunk));
          stream.on("error", reject);
          stream.on("end", () => {
            files.set(name, Buffer.concat(chunks));
            zip.readEntry();
          });
        });
      });
      zip.on("end", () => resolve(files));
      zip.readEntry();
    }),
  );
}
export function directoryFiles(root) {
  const files = new Map();
  function visit(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, entry.name);
      if (entry.isSymbolicLink()) throw Error(`Symlink not allowed: ${p}`);
      if (entry.isDirectory()) visit(p);
      else
        files.set(
          path.relative(root, p).split(path.sep).join("/"),
          fs.readFileSync(p),
        );
    }
  }
  visit(root);
  return files;
}
export function compareFiles(actual, expected, label) {
  if (
    JSON.stringify([...actual.keys()].sort()) !==
    JSON.stringify([...expected.keys()].sort())
  )
    throw Error(`Inventory mismatch: ${label}`);
  for (const [name, bytes] of actual)
    if (!bytes.equals(expected.get(name)))
      throw Error(`Content mismatch: ${label}/${name}`);
}
export function git(...args) {
  return execFileSync(
    "git",
    ["-c", `safe.directory=${process.cwd().replaceAll("\\", "/")}`, ...args],
    { encoding: "utf8" },
  ).trim();
}
export async function verifyArchives(directory, version, compareBuild = false) {
  const names = ["chrome", "firefox", "website", "source"].map(
    (type) => `koalaclicker-${type}-v${version}.zip`,
  );
  const sums = fs
    .readFileSync(path.join(directory, "SHA256SUMS"), "utf8")
    .trim()
    .split(/\r?\n/);
  const expectedNames = [...names, "PROVENANCE.json", "INVENTORY.json"].sort();
  const parsed = sums.map((line) => {
    const match = /^([a-f0-9]{64})  ([A-Za-z0-9._-]+)$/.exec(line);
    if (!match) throw Error("Nonportable checksum entry");
    return match;
  });
  if (
    JSON.stringify(parsed.map((m) => m[2]).sort()) !==
    JSON.stringify(expectedNames)
  )
    throw Error("Checksum inventory mismatch");
  for (const [, digest, name] of parsed)
    if (sha(fs.readFileSync(path.join(directory, name))) !== digest)
      throw Error(`Checksum mismatch: ${name}`);
  const inventory = JSON.parse(
    fs.readFileSync(path.join(directory, "INVENTORY.json")),
  );
  if (
    JSON.stringify(Object.keys(inventory).sort()) !==
    JSON.stringify(names.sort())
  )
    throw Error("Archive inventory list mismatch");
  for (const name of names) {
    const files = await readZip(path.join(directory, name));
    const entries = Object.fromEntries(
      [...files]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, value]) => [key, sha(value)]),
    );
    if (JSON.stringify(entries) !== JSON.stringify(inventory[name]))
      throw Error(`Archive inventory digest mismatch: ${name}`);
    const type = name.split("-")[1];
    if (type === "chrome" || type === "firefox") {
      const manifest = JSON.parse(files.get("manifest.json"));
      if (manifest.version !== version) throw Error("Archive version mismatch");
      if (
        JSON.stringify(manifest.permissions) !==
          JSON.stringify(["activeTab", "storage", "scripting"]) ||
        manifest.host_permissions ||
        manifest.optional_host_permissions ||
        manifest.content_scripts
      )
        throw Error("Production permission expansion");
      if (
        [...files.keys()].some((p) =>
          /harness|node_modules|test|\.map$/.test(p),
        )
      )
        throw Error("Test files in production archive");
    } else if (type === "website") {
      if (
        files
          .get("index.html")
          ?.toString()
          .match(
            /<meta\s+name="koalaclicker-version"\s+content="([^"]+)"\s*\/?\s*>/,
          )?.[1] !== version
      )
        throw Error("Website version mismatch");
    } else if (
      JSON.parse(files.get("package.json")).version !== version ||
      JSON.parse(files.get("src/manifest.json")).version !== version
    )
      throw Error("Source version mismatch");
    if (compareBuild && type !== "source")
      compareFiles(files, directoryFiles(path.join("dist", type)), name);
    if (compareBuild && type === "source") {
      const expected = new Map();
      for (const file of git("ls-tree", "-r", "--name-only", "HEAD").split(
        "\n",
      )) {
        expected.set(
          file,
          execFileSync(
            "git",
            [
              "-c",
              `safe.directory=${process.cwd().replaceAll("\\", "/")}`,
              "show",
              `HEAD:${file}`,
            ],
            { maxBuffer: 32 * 1024 * 1024 },
          ),
        );
      }
      compareFiles(files, expected, name);
    }
  }
  const provenance = JSON.parse(
    fs.readFileSync(path.join(directory, "PROVENANCE.json")),
  );
  if (
    provenance.version !== version ||
    !/^[a-f0-9]{40}$/.test(provenance.commit) ||
    provenance.repository !== "Shik3i/KoalaClicker"
  )
    throw Error("Invalid provenance");
  return names;
}
if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(import.meta.filename)
) {
  await verifyArchives(
    process.argv[2] || "dist",
    process.argv[3] || JSON.parse(fs.readFileSync("package.json")).version,
    process.argv.includes("--compare-build"),
  );
  console.log(
    "Release archive checksums, full inventories, versions and permissions verified.",
  );
}
