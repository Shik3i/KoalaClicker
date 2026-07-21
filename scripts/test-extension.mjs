import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import vm from 'node:vm';

const rootDir = path.resolve(import.meta.dirname, '..');
const distDir = path.join(rootDir, 'dist');

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

test('Chrome release manifest keeps the minimal activeTab permission model', () => {
  const manifest = readJson(path.join(distDir, 'chrome', 'manifest.json'));

  assert.equal(manifest.manifest_version, 3);
  assert.deepEqual(manifest.permissions, ['activeTab', 'storage', 'scripting']);
  assert.equal(manifest.host_permissions, undefined);
  assert.equal(manifest.content_scripts, undefined);
  assert.equal(manifest.web_accessible_resources, undefined);
  assert.equal(manifest.browser_specific_settings, undefined);
});

test('Firefox release manifest targets APIs used by the package', () => {
  const manifest = readJson(path.join(distDir, 'firefox', 'manifest.json'));
  const gecko = manifest.browser_specific_settings.gecko;

  assert.equal(gecko.id, 'koalaclicker@koalastuff.net');
  assert.equal(gecko.strict_min_version, '140.0');
  assert.deepEqual(gecko.data_collection_permissions.required, ['none']);
  assert.equal(manifest.browser_specific_settings.gecko_android.strict_min_version, '142.0');
});

test('release packages contain only expected extension files', () => {
  const expectedFiles = [
    'assets/Logo_Cut_128.png',
    'assets/Logo_Cut_16.png',
    'assets/Logo_Cut_48.png',
    'content/compatibility.js',
    'content/content.css',
    'content/content.js',
    'manifest.json',
    'popup/popup.css',
    'popup/popup.html',
    'popup/popup.js'
  ];

  for (const browserName of ['chrome', 'firefox']) {
    const browserDir = path.join(distDir, browserName);
    const files = [];
    const visit = (directory) => {
      for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
        const entryPath = path.join(directory, entry.name);
        if (entry.isDirectory()) visit(entryPath);
        else files.push(path.relative(browserDir, entryPath));
      }
    };
    visit(browserDir);
    assert.deepEqual(files.sort(), expectedFiles);
  }
});

test('MAIN-world compatibility helper is event-driven and idempotent', () => {
  const listeners = new Map();
  const context = {
    document: {
      addEventListener(name, listener) {
        listeners.set(name, listener);
      }
    },
    Game: { lastClick: 42 }
  };
  context.globalThis = context;

  const source = fs.readFileSync(path.join(rootDir, 'src', 'content', 'compatibility.js'), 'utf8');
  vm.runInNewContext(source, context);
  vm.runInNewContext(source, context);

  assert.equal(listeners.size, 1);
  assert.equal(context.Game.lastClick, 42);
  listeners.get('koala-clicker:before-click')();
  assert.equal(context.Game.lastClick, 0);
});
