import { createCampaignSnapshot } from './campaignStorage.js';
import { buildCampaignChronicle, resolveExportMedia } from './chronicleExporter.js';

export const CAMPAIGN_BUNDLE_VERSION = 1;

function collectReferencedScenarioIds(state, activeScenario) {
  const scenarioIds = new Set(
    (state?.history || [])
      .map((entry) => entry.scenarioId)
      .filter(Boolean)
  );

  if (activeScenario?.id) {
    scenarioIds.add(activeScenario.id);
  } else if (state?.scenarioId) {
    scenarioIds.add(state.scenarioId);
  }

  return [...scenarioIds];
}

function buildMediaManifest(state, activeScenario, exportedAt, scenarios = []) {
  const scenarioIds = collectReferencedScenarioIds(state, activeScenario);
  const seenAssets = new Set();
  const assets = [];

  for (const scenarioId of scenarioIds) {
    const media = resolveExportMedia(scenarioId, scenarios);
    if (!media?.src || media.assetKey === 'unknown' || seenAssets.has(media.assetKey)) continue;
    seenAssets.add(media.assetKey);
    assets.push({
      id: media.assetKey,
      src: media.src,
      title: media.title,
      kind: media.kind,
      location: media.location || '',
      era: media.era || '',
      caption: media.caption || '',
      credit: media.credit || '',
      promptSeed: media.promptSeed || '',
      cropFocus: media.cropFocus || null,
      cropMode: media.cropMode || 'wide',
      theaterOpacity: media.theaterOpacity ?? null,
      overlayOpacity: media.overlayOpacity ?? null,
      referencedBy: scenarioIds.filter((id) => {
        const linked = resolveExportMedia(id, scenarios);
        return linked.assetKey === media.assetKey;
      }),
      sourcePath: media.src,
    });
  }

  return {
    version: 1,
    generatedAt: exportedAt,
    activeScenarioId: activeScenario?.id || state?.scenarioId || null,
    referencedScenarioIds: scenarioIds,
    assets,
    note: 'Image files are referenced by existing public paths; this bundle does not embed binary media.',
  };
}

export function buildCampaignBundle(state, activeScenario, options = {}) {
  const exportedAt = new Date().toISOString();
  const snapshot = createCampaignSnapshot(state, activeScenario, options);
  const chronicle = buildCampaignChronicle(state, {
    generatedAt: exportedAt,
    mediaEmbedFormat: 'markdown',
    includeMediaEmbeds: true,
    filename: 'chronicle.md',
    scenarios: options.scenarios || [],
  });
  const mediaManifest = buildMediaManifest(state, activeScenario, exportedAt, options.scenarios || []);

  const files = {
    'campaign.json': snapshot,
    'chronicle.md': chronicle.markdown,
    'media-manifest.json': mediaManifest,
  };

  const payload = {
    bundleVersion: CAMPAIGN_BUNDLE_VERSION,
    exportedAt,
    manifest: {
      seed: state?.seed ?? null,
      currentTurn: state?.currentTurn ?? 0,
      activeScenarioId: activeScenario?.id || state?.scenarioId || null,
      summary: chronicle.summary,
      files: Object.keys(files),
      mediaCount: mediaManifest.assets.length,
      downloadFormat: 'json-envelope',
    },
    files,
  };

  return {
    filename: `Titans_of_War_Bundle_Seed_${state?.seed ?? 'unknown'}_Turn_${state?.currentTurn ?? 0}.json`,
    summary: chronicle.summary,
    payload,
    chronicle,
    mediaManifest,
  };
}
