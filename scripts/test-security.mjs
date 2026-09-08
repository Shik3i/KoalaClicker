import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import test from "node:test";
test("vulnerable unused image parser is disabled before Firefox linting", () => {
  const script = `const {imageSize}=require('image-size');const data=Buffer.alloc(16);data.write('icns');data.writeUInt32BE(16,4);data.write('ic07',8);require('node:assert/strict').throws(()=>imageSize(data),/disabled file type: icns/);const png=require('node:fs').readFileSync('src/assets/Logo_Cut_128.png');require('node:assert/strict').equal(imageSize(png).width,128);`;
  assert.doesNotThrow(() =>
    execFileSync(
      process.execPath,
      ["--require", "./scripts/linter-safe-images.cjs", "-e", script],
      { timeout: 3000 },
    ),
  );
});
