import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import test from "node:test";

function box(name, contents = Buffer.alloc(0), length = contents.length + 8) {
  const header = Buffer.alloc(8);
  header.writeUInt32BE(length);
  header.write(name, 4);
  return Buffer.concat([header, contents]);
}

// Each parser runs in a separate process: a regressed infinite loop cannot hang CI.
function parse(bytes) {
  const script = `const linterRequire=require("node:module").createRequire(require.resolve("addons-linter"));
    const {imageSize}=linterRequire("image-size");
    try { const result=imageSize(require("node:fs").readFileSync(0));
      console.log(JSON.stringify({width:result.width,height:result.height,type:result.type}));
    } catch(error) { console.log(JSON.stringify({error:error.message})); }`;
  const result = spawnSync(process.execPath, ["-e", script], {
    input: bytes,
    encoding: "utf8",
    timeout: 2000,
  });
  assert.ifError(result.error);
  assert.equal(result.status, 0, result.stderr);
  return JSON.parse(result.stdout);
}

test("ICNS zero and undersized entry lengths terminate without disabling the parser", () => {
  const bytes = Buffer.alloc(16);
  bytes.write("icns");
  bytes.writeUInt32BE(16, 4);
  bytes.write("ic07", 8);
  for (const length of [0, 1, 7]) {
    bytes.writeUInt32BE(length, 12);
    const result = parse(bytes);
    assert.match(result.error, /Invalid ICNS/);
  }
  bytes.writeUInt32BE(8, 12);
  assert.deepEqual(parse(bytes), { width: 128, height: 128, type: "icns" });
});

test("JXL zero-size partial stream terminates with a parser error", () => {
  const signature = Buffer.from("0000000c4a584c200d0a870a", "hex");
  const result = parse(
    Buffer.concat([
      signature,
      box("ftyp", Buffer.from("jxl 0000")),
      box("jxlp", Buffer.alloc(4), 0),
    ]),
  );
  assert.ok(result.error);
  assert.doesNotMatch(result.error, /disabled file type/);
});

test("HEIF zero-size ispe advances to EOF and keeps valid image dimensions", () => {
  const dimensions = Buffer.alloc(12);
  dimensions.writeUInt32BE(32, 4);
  dimensions.writeUInt32BE(16, 8);
  const bytes = Buffer.concat([
    box("ftyp", Buffer.from("avif0000")),
    box(
      "meta",
      Buffer.concat([
        Buffer.alloc(4),
        box("iprp", box("ipco", box("ispe", dimensions, 0))),
      ]),
    ),
  ]);
  assert.deepEqual(parse(bytes), { width: 32, height: 16, type: "avif" });
});

test("JPEG invalid segment length and truncated images terminate", () => {
  for (const bytes of [
    Buffer.from("ffd8ffe10000ffff", "hex"),
    Buffer.from("000000014a584c20", "hex"),
    Buffer.alloc(0),
  ])
    assert.ok(parse(bytes).error);
});

test("unrestricted image parser preserves PNG and SVG dimensions used by the linter", () => {
  assert.deepEqual(parse(fs.readFileSync("src/assets/Logo_Cut_128.png")), {
    width: 128,
    height: 128,
    type: "png",
  });
  assert.deepEqual(
    parse(
      Buffer.from(
        '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="48"></svg>',
      ),
    ),
    { width: 32, height: 48, type: "svg" },
  );
});
