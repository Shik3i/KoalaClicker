import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import crypto from 'node:crypto';
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
  assert.ok(manifest.description.length <= 132, `description has ${manifest.description.length} characters`);
  assert.deepEqual(manifest.permissions, ['activeTab', 'storage', 'scripting']);
  assert.equal(manifest.commands._execute_action.suggested_key.default, 'Alt+Shift+K');
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
    'popup/popup.js',
    'shared/model.js'
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

test('shared model accepts only web URLs and normalizes persisted clickers', () => {
  const context = { URL };
  context.globalThis = context;
  const source = fs.readFileSync(path.join(rootDir, 'src', 'shared', 'model.js'), 'utf8');
  vm.runInNewContext(source, context);

  assert.equal(context.KoalaClickerModel.parseSiteUrl('https://example.com/path').origin, 'https://example.com');
  for (const blockedUrl of ['about:config', 'data:text/plain,test', 'file:///tmp/test.html', 'not a url']) {
    assert.equal(context.KoalaClickerModel.parseSiteUrl(blockedUrl), null);
  }

  const normalized = context.KoalaClickerModel.normalizeClickers([
    { selector: '#target', name: '  Primary  ', interval: 1, active: true },
    null,
    { selector: '', interval: 250, active: true }
  ]);
  assert.equal(normalized.length, 1);
  assert.equal(normalized[0].name, 'Primary');
  assert.equal(normalized[0].interval, 25);
  assert.equal(normalized[0].active, true);
  assert.match(normalized[0].id, /^migrated-0-/);
});

test('MAIN-world compatibility helper is host-scoped, event-driven, and idempotent', () => {
  const listeners = new Map();
  const context = {
    document: {
      addEventListener(name, listener) {
        listeners.set(name, listener);
      }
    },
    location: { hostname: 'orteil.dashnet.org' },
    Set,
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

  const unsupportedListeners = new Map();
  const unsupportedContext = {
    document: { addEventListener(name, listener) { unsupportedListeners.set(name, listener); } },
    location: { hostname: 'example.com' },
    Set
  };
  unsupportedContext.globalThis = unsupportedContext;
  vm.runInNewContext(source, unsupportedContext);
  assert.equal(unsupportedListeners.size, 0);
});

test('all published version sources stay synchronized', () => {
  const manifestVersion = readJson(path.join(rootDir, 'src', 'manifest.json')).version;
  assert.equal(readJson(path.join(rootDir, 'package.json')).version, manifestVersion);
  assert.equal(readJson(path.join(rootDir, 'package-lock.json')).version, manifestVersion);
  assert.equal(readJson(path.join(rootDir, 'package-lock.json')).packages[''].version, manifestVersion);

  const website = fs.readFileSync(path.join(rootDir, 'website', 'index.html'), 'utf8');
  assert.match(website, new RegExp(`<meta name="koalaclicker-version" content="${manifestVersion.replaceAll('.', '\\.')}">`));
});

test('release ZIPs are reproducible', () => {
  const zipPaths = ['chrome', 'firefox'].map(browserName => (
    path.join(distDir, `koalaclicker-${browserName}-v${readJson(path.join(rootDir, 'src', 'manifest.json')).version}.zip`)
  ));
  const digest = filePath => crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
  const before = zipPaths.map(digest);

  execFileSync(process.execPath, [path.join(rootDir, 'scripts', 'build-extension.cjs')]);

  assert.deepEqual(zipPaths.map(digest), before);
});
