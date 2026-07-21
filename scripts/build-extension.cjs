const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

const rootDir = path.join(__dirname, '..');
const srcDir = path.join(rootDir, 'src');
const distDir = path.join(rootDir, 'dist');
const manifestPath = path.join(srcDir, 'manifest.json');

const versionArg = process.argv.find((arg) => arg.startsWith('--version='));
const releaseVersion = versionArg
  ? versionArg.slice('--version='.length)
  : process.env.VERSION || null;
const zipDate = new Date('1980-01-01T00:00:00.000Z');

function validateVersion(version) {
  if (!/^\d+(\.\d+){0,3}$/.test(version)) {
    throw new Error(`Invalid extension version "${version}"`);
  }

  const parts = version.split('.').map(Number);
  if (parts.some(part => part > 65535)) {
    throw new Error(`Extension version component exceeds 65535: "${version}"`);
  }
}

function readManifest() {
  return JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
}

function resetDist() {
  if (fs.existsSync(distDir)) {
    fs.rmSync(distDir, { recursive: true, force: true });
  }
  fs.mkdirSync(distDir, { recursive: true });
}

function copyDir(source, target) {
  fs.mkdirSync(target, { recursive: true });
  for (const item of fs.readdirSync(source)) {
    const sourcePath = path.join(source, item);
    const targetPath = path.join(target, item);
    const stat = fs.lstatSync(sourcePath);

    if (stat.isDirectory()) {
      copyDir(sourcePath, targetPath);
    } else {
      fs.copyFileSync(sourcePath, targetPath);
    }
  }
}

function validateManifest(manifest, browserName) {
  const requiredPermissions = ['activeTab', 'storage', 'scripting'];
  for (const permission of requiredPermissions) {
    if (!manifest.permissions.includes(permission)) {
      throw new Error(`${browserName}: missing required permission "${permission}"`);
    }
  }

  if (manifest.host_permissions && manifest.host_permissions.length > 0) {
    throw new Error(`${browserName}: host_permissions should stay empty for activeTab-only access`);
  }

  if (manifest.content_scripts) {
    throw new Error(`${browserName}: static content_scripts would weaken the activeTab privacy model`);
  }

  if (manifest.web_accessible_resources) {
    throw new Error(`${browserName}: web_accessible_resources should stay empty unless a page must fetch extension assets`);
  }
}

function writeManifest(targetDir, browserName, modifier) {
  const manifest = readManifest();
  if (releaseVersion) {
    manifest.version = releaseVersion.replace(/^v/, '');
  }
  validateVersion(manifest.version);

  const browserManifest = modifier(manifest);
  validateManifest(browserManifest, browserName);

  fs.writeFileSync(
    path.join(targetDir, 'manifest.json'),
    `${JSON.stringify(browserManifest, null, 2)}\n`
  );

  return browserManifest.version;
}

function zipDirectory(sourceDir, outputPath) {
  return new Promise((resolve, reject) => {
    const archive = archiver('zip', { zlib: { level: 9 } });
    const stream = fs.createWriteStream(outputPath);

    stream.on('close', resolve);
    archive.on('error', reject);
    const addFiles = (directory) => {
      for (const item of fs.readdirSync(directory, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
        const itemPath = path.join(directory, item.name);
        if (item.isDirectory()) addFiles(itemPath);
        else archive.append(fs.readFileSync(itemPath), {
          name: path.relative(sourceDir, itemPath).split(path.sep).join('/'),
          date: zipDate,
          mode: 0o100644
        });
      }
    };

    addFiles(sourceDir);
    archive.pipe(stream);
    archive.finalize();
  });
}

async function buildBrowser(browserName, modifier) {
  const targetDir = path.join(distDir, browserName);
  copyDir(srcDir, targetDir);

  const version = writeManifest(targetDir, browserName, modifier);
  const zipPath = path.join(distDir, `koalaclicker-${browserName}-v${version}.zip`);
  await zipDirectory(targetDir, zipPath);

  console.log(`Built ${browserName} v${version}: ${path.relative(rootDir, zipPath)}`);
}

async function run() {
  resetDist();

  await buildBrowser('chrome', (manifest) => {
    delete manifest.browser_specific_settings;
    return manifest;
  });

  await buildBrowser('firefox', (manifest) => {
    manifest.browser_specific_settings = {
      gecko: {
        id: 'koalaclicker@koalastuff.net',
        strict_min_version: '140.0',
        data_collection_permissions: {
          required: ['none']
        }
      },
      gecko_android: {
        strict_min_version: '142.0'
      }
    };
    return manifest;
  });
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
