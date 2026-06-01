import fs from 'node:fs';
import path from 'node:path';
import { AUDIO_TRACK_LIBRARY } from '../src/game/audioCatalog.js';
import { HISTORICAL_ASSET_MANIFEST } from '../src/game/historicalAssetManifest.js';
import { MEDIA_CATALOG } from '../src/game/mediaCatalog.js';

const ROOT = process.cwd();
const MIN_BYTES = 1024;

function filePath(asset) {
  return path.resolve(ROOT, asset.targetDir, asset.filename);
}

function rel(file) {
  return path.relative(ROOT, file);
}

function validateManifest(errors, warnings) {
  const ids = new Set();
  const filenames = new Set();

  HISTORICAL_ASSET_MANIFEST.forEach((asset) => {
    const prefix = `Asset "${asset.id || asset.filename || '(unknown)'}"`;
    if (!asset.id) errors.push(`${prefix}: missing id`);
    if (ids.has(asset.id)) errors.push(`${prefix}: duplicate id`);
    ids.add(asset.id);

    if (!['audio', 'image'].includes(asset.type)) {
      errors.push(`${prefix}: invalid type "${asset.type}"`);
    }

    if (!['curated', 'pending'].includes(asset.status)) {
      errors.push(`${prefix}: invalid status "${asset.status}"`);
    }

    if (!asset.filename) errors.push(`${prefix}: missing filename`);
    if (!asset.targetDir) errors.push(`${prefix}: missing targetDir`);
    if (!asset.catalogKey) errors.push(`${prefix}: missing catalogKey`);

    const filenameKey = `${asset.targetDir}/${asset.filename}`;
    if (filenames.has(filenameKey)) errors.push(`${prefix}: duplicate target file ${filenameKey}`);
    filenames.add(filenameKey);

    if (asset.status === 'curated' && !asset.sourceUrl) {
      errors.push(`${prefix}: curated assets must include sourceUrl`);
    }

    if (asset.status === 'pending' && !asset.sourceUrl) {
      warnings.push(`${prefix}: pending source URL`);
    }
  });
}

function validateCatalogLinks(errors) {
  const audioByKey = new Map(AUDIO_TRACK_LIBRARY.map((track) => [track.key, track]));

  HISTORICAL_ASSET_MANIFEST.forEach((asset) => {
    if (asset.type === 'audio') {
      const track = audioByKey.get(asset.catalogKey);
      if (!track) {
        errors.push(`Asset "${asset.id}": audio catalog missing key "${asset.catalogKey}"`);
        return;
      }
      if (track.src !== `/audio/${asset.filename}`) {
        errors.push(`Asset "${asset.id}": audio catalog src "${track.src}" does not match filename "${asset.filename}"`);
      }
      if (asset.status === 'curated' && track.licenseStatus === 'recording-needed') {
        errors.push(`Asset "${asset.id}": curated audio still marked recording-needed in audioCatalog.js`);
      }
    }

    if (asset.type === 'image') {
      const media = MEDIA_CATALOG[asset.catalogKey];
      if (!media) {
        errors.push(`Asset "${asset.id}": media catalog missing key "${asset.catalogKey}"`);
        return;
      }
      if (media.src !== `/images/cw_pictures/${asset.filename}`) {
        errors.push(`Asset "${asset.id}": media catalog src "${media.src}" does not match filename "${asset.filename}"`);
      }
    }
  });
}

function validateLocalFiles(errors, warnings) {
  HISTORICAL_ASSET_MANIFEST.forEach((asset) => {
    const target = filePath(asset);
    if (!fs.existsSync(target)) {
      if (asset.status === 'pending') return;
      warnings.push(`Missing ${asset.type} file: ${rel(target)} (${asset.status})`);
      return;
    }

    const stats = fs.statSync(target);
    if (stats.size < MIN_BYTES) {
      errors.push(`File too small: ${rel(target)} (${stats.size} bytes)`);
    }

    if (asset.type === 'audio' && !asset.filename.endsWith('.mp3')) {
      errors.push(`Audio asset must be mp3: ${rel(target)}`);
    }

    if (asset.type === 'image' && !/\.(jpg|jpeg|png|webp|avif|svg)$/i.test(asset.filename)) {
      errors.push(`Image asset has unsupported extension: ${rel(target)}`);
    }
  });
}

function main() {
  const errors = [];
  const warnings = [];

  validateManifest(errors, warnings);
  validateCatalogLinks(errors);
  validateLocalFiles(errors, warnings);

  if (warnings.length) {
    console.log('Asset warnings:');
    warnings.forEach((warning) => console.log(`  ! ${warning}`));
  }

  if (errors.length) {
    console.error('Asset validation failed:');
    errors.forEach((error) => console.error(`  x ${error}`));
    process.exitCode = 1;
    return;
  }

  console.log(`Asset validation OK (${HISTORICAL_ASSET_MANIFEST.length} manifest entries, ${warnings.length} warning${warnings.length === 1 ? '' : 's'})`);
}

main();
