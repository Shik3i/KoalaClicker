import { spawnSync } from "node:child_process";
const result = spawnSync(
  process.platform === "win32" ? process.env.ComSpec || "cmd.exe" : "npm",
  process.platform === "win32"
    ? ["/d", "/s", "/c", "npm audit --json"]
    : ["audit", "--json"],
  { encoding: "utf8", timeout: 60000 },
);
if (result.error) throw result.error;
let report;
try {
  report = JSON.parse(result.stdout);
} catch {
  throw Error(result.stderr || "npm audit did not return JSON");
}
if (report.error) throw Error(JSON.stringify(report.error));
if (
  result.status !== 0 ||
  report.metadata?.vulnerabilities?.total !== 0 ||
  Object.keys(report.vulnerabilities || {}).length
)
  throw Error(
    `npm audit failed: ${JSON.stringify(report.vulnerabilities || report)}`,
  );
console.log(
  "npm audit: 0 vulnerabilities (all severities; no advisory exceptions).",
);
