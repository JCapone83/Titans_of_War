import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import https from 'node:https';
import { pipeline } from 'node:stream/promises';
import { HISTORICAL_ASSET_MANIFEST } from '../src/game/historicalAssetManifest.js';

const ROOT = process.cwd();
const REPORT_PATH = path.resolve(ROOT, 'public/assets-download-report.json');
const MIN_BYTES = {
  audio: 1024,
  image: 1024,
};

function parseArgs(argv) {
  const options = {
    dryRun: false,
    force: false,
    type: 'all',
    includePending: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--dry-run') {
      options.dryRun = true;
    } else if (arg === '--force') {
      options.force = true;
    } else if (arg === '--include-pending') {
      options.includePending = true;
    } else if (arg === '--type') {
      options.type = argv[index + 1] || 'all';
      index += 1;
    } else if (arg === '--help' || arg === '-h') {
      options.help = true;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  if (!['all', 'audio', 'image'].includes(options.type)) {
    throw new Error('--type must be one of: all, audio, image');
  }

  return options;
}

function printHelp() {
  console.log(`Titans of War historical asset downloader

Usage:
  npm run download-assets -- [options]

Options:
  --dry-run           Print planned downloads without writing files
  --force             Redownload even when target files already exist
  --type audio        Download only audio assets
  --type image        Download only image assets
  --include-pending   Include manifest entries without verified URLs
  --help              Show this help
`);
}

function clientFor(url) {
  return url.protocol === 'http:' ? http : https;
}

function request(urlString, redirectCount = 0) {
  if (redirectCount > 6) {
    return Promise.reject(new Error('too many redirects'));
  }

  const url = new URL(urlString);
  const client = clientFor(url);
  const headers = {
    'User-Agent': 'Titans-of-War-AssetDownloader/0.3.1',
    Accept: 'audio/*,image/*,*/*;q=0.5',
  };

  return new Promise((resolve, reject) => {
    const req = client.get(url, { headers }, (response) => {
      const location = response.headers.location;
      if (response.statusCode >= 300 && response.statusCode < 400 && location) {
        response.resume();
        const nextUrl = new URL(location, url).toString();
        request(nextUrl, redirectCount + 1).then(resolve, reject);
        return;
      }

      resolve(response);
    });

    req.on('error', reject);
    req.setTimeout(30000, () => {
      req.destroy(new Error('request timed out'));
    });
  });
}

function targetPathFor(asset) {
  return path.resolve(ROOT, asset.targetDir, asset.filename);
}

function validateDownloadedFile(asset, destPath) {
  const stats = fs.statSync(destPath);
  if (stats.size < (MIN_BYTES[asset.type] || 1024)) {
    throw new Error(`downloaded file is too small (${stats.size} bytes)`);
  }
}

async function downloadAsset(asset, options) {
  const destPath = targetPathFor(asset);
  const tempPath = `${destPath}.tmp`;
  const downloadUrl = asset.downloadUrl || asset.sourceUrl;
  fs.mkdirSync(path.dirname(destPath), { recursive: true });

  if (asset.status === 'pending' && !asset.downloadUrl) {
    return {
      id: asset.id,
      filename: asset.filename,
      type: asset.type,
      status: 'pending',
      message: 'source page recorded; no verified direct download URL yet',
      sourceUrl: asset.sourceUrl,
      downloadUrl: asset.downloadUrl,
      sourceInstitution: asset.sourceInstitution,
      license: asset.license,
    };
  }

  if (!downloadUrl) {
    return {
      id: asset.id,
      filename: asset.filename,
      type: asset.type,
      status: 'pending',
      message: 'no download URL recorded yet',
      sourceUrl: asset.sourceUrl,
      downloadUrl: asset.downloadUrl,
      sourceInstitution: asset.sourceInstitution,
      license: asset.license,
    };
  }

  if (fs.existsSync(destPath) && !options.force) {
    return {
      id: asset.id,
      filename: asset.filename,
      type: asset.type,
      status: 'skipped',
      message: 'file already exists',
      sourceUrl: asset.sourceUrl,
      downloadUrl,
      sourceInstitution: asset.sourceInstitution,
      license: asset.license,
    };
  }

  if (options.dryRun) {
    return {
      id: asset.id,
      filename: asset.filename,
      type: asset.type,
      status: 'planned',
      message: `would download to ${path.relative(ROOT, destPath)}`,
      sourceUrl: asset.sourceUrl,
      downloadUrl,
      sourceInstitution: asset.sourceInstitution,
      license: asset.license,
    };
  }

  if (fs.existsSync(tempPath)) {
    fs.rmSync(tempPath);
  }

  const response = await request(downloadUrl);
  const contentType = (response.headers['content-type'] || '').toLowerCase();

  if (response.statusCode !== 200) {
    response.resume();
    throw new Error(`HTTP ${response.statusCode}`);
  }

  if (asset.expectedContentType && !contentType.startsWith(asset.expectedContentType)) {
    response.resume();
    throw new Error(`unexpected content-type "${contentType || 'unknown'}"`);
  }

  await pipeline(response, fs.createWriteStream(tempPath));
  validateDownloadedFile(asset, tempPath);
  fs.renameSync(tempPath, destPath);

  return {
    id: asset.id,
    filename: asset.filename,
    type: asset.type,
    status: 'downloaded',
    message: `saved ${path.relative(ROOT, destPath)}`,
    bytes: fs.statSync(destPath).size,
    contentType,
    sourceUrl: asset.sourceUrl,
    downloadUrl,
    sourceInstitution: asset.sourceInstitution,
    license: asset.license,
  };
}

function selectAssets(options) {
  return HISTORICAL_ASSET_MANIFEST.filter((asset) => {
    if (options.type !== 'all' && asset.type !== options.type) return false;
    if (!options.includePending && asset.status === 'pending') return false;
    return true;
  });
}

async function runDownloader() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    printHelp();
    return;
  }

  const assets = selectAssets(options);
  const report = {
    generatedAt: new Date().toISOString(),
    options,
    totalAssets: assets.length,
    results: [],
  };

  console.log('Titans of War historical asset downloader');
  console.log(`Mode: ${options.dryRun ? 'dry run' : 'download'} · Type: ${options.type} · Force: ${options.force ? 'yes' : 'no'}`);
  console.log('');

  for (const asset of assets) {
    try {
      console.log(`[${asset.type}] ${asset.filename}`);
      console.log(`  Source: ${asset.sourceInstitution}`);
      console.log(`  Rights: ${asset.license}`);
      const result = await downloadAsset(asset, options);
      report.results.push(result);
      console.log(`  ${result.status}: ${result.message}\n`);
    } catch (error) {
      const result = {
        id: asset.id,
        filename: asset.filename,
        type: asset.type,
        status: 'failed',
        message: error.message,
        sourceUrl: asset.sourceUrl,
        downloadUrl: asset.downloadUrl,
        sourceInstitution: asset.sourceInstitution,
        license: asset.license,
      };
      report.results.push(result);
      console.log(`  failed: ${error.message}\n`);
      const tempPath = `${targetPathFor(asset)}.tmp`;
      if (fs.existsSync(tempPath)) fs.rmSync(tempPath);
    }
  }

  report.summary = report.results.reduce((summary, result) => {
    summary[result.status] = (summary[result.status] || 0) + 1;
    return summary;
  }, {});

  fs.mkdirSync(path.dirname(REPORT_PATH), { recursive: true });
  fs.writeFileSync(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`);

  console.log('Download pass complete.');
  console.log(`Report: ${path.relative(ROOT, REPORT_PATH)}`);
}

runDownloader().catch((error) => {
  console.error(`[download-assets] ${error.message}`);
  process.exitCode = 1;
});
