import { INITIAL_STATE } from './initialState.js';

export const CAMPAIGN_SAVE_VERSION = 2;
export const CAMPAIGN_STORAGE_KEY = 'titans-of-war:campaign:auto-save';
const SUPPORTED_SAVE_VERSIONS = new Set([1, CAMPAIGN_SAVE_VERSION]);

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function getDefaultStorage() {
  if (typeof window === 'undefined' || !window.localStorage) return null;
  return window.localStorage;
}

export function createFreshCampaignState(seed = Math.floor(Math.random() * 1e9), firstScenarioId = null) {
  return {
    ...clone(INITIAL_STATE),
    seed,
    scenarioId: firstScenarioId,
    nextScenarioId: null,
    history: [],
    gameOver: false
  };
}

function isValidState(state) {
  return Boolean(
    state
    && Number.isFinite(state.currentTurn)
    && Number.isFinite(state.seed)
    && state.metrics
    && Number.isFinite(state.metrics.militaryStrength)
    && Number.isFinite(state.metrics.munitions)
    && Number.isFinite(state.metrics.treasury)
    && Number.isFinite(state.metrics.foodSupply)
    && Number.isFinite(state.metrics.publicMorale)
    && state.shards
    && state.shards.hotspur
    && state.shards.fox
    && state.shards.wolf
  );
}

function normalizeState(rawState) {
  const state = {
    ...clone(INITIAL_STATE),
    ...clone(rawState),
    metrics: {
      ...INITIAL_STATE.metrics,
      ...(rawState.metrics || {})
    },
    shards: {
      ...clone(INITIAL_STATE.shards),
      ...(rawState.shards || {})
    },
    history: Array.isArray(rawState.history) ? rawState.history : []
  };

  state.scenarioId = state.scenarioId || null;
  state.nextScenarioId = state.nextScenarioId || null;
  return state;
}

export function createCampaignSnapshot(state, activeScenario, metadata = {}) {
  return {
    version: CAMPAIGN_SAVE_VERSION,
    exportedAt: new Date().toISOString(),
    metadata: {
      engine: 'titans-of-war',
      mode: metadata.aiPortalEngaged ? 'ollama-or-fallback' : 'scripted',
      selectedModel: metadata.selectedModel || null
    },
    state: clone(state),
    activeScenarioId: activeScenario?.id || state.scenarioId || null,
    activeScenario: activeScenario ? clone(activeScenario) : null
  };
}

export function getCampaignSnapshotCompatibility(snapshot) {
  if (!snapshot || typeof snapshot !== 'object') {
    return { ok: false, reason: 'Save data is missing or is not a campaign snapshot.' };
  }
  if (!Number.isInteger(snapshot.version)) {
    return { ok: false, reason: 'Save data does not identify a supported format version.' };
  }
  if (snapshot.version > CAMPAIGN_SAVE_VERSION) {
    return {
      ok: false,
      reason: `Save version ${snapshot.version} was created by a newer Titans of War build. This build supports version ${CAMPAIGN_SAVE_VERSION}.`
    };
  }
  if (!SUPPORTED_SAVE_VERSIONS.has(snapshot.version)) {
    return {
      ok: false,
      reason: `Save version ${snapshot.version} is no longer supported. Supported versions: ${Array.from(SUPPORTED_SAVE_VERSIONS).join(', ')}.`
    };
  }
  if (!snapshot.state || typeof snapshot.state !== 'object') {
    return { ok: false, reason: 'Save data does not contain a campaign state.' };
  }
  return {
    ok: true,
    reason: null,
    migratedFromVersion: snapshot.version < CAMPAIGN_SAVE_VERSION ? snapshot.version : null
  };
}

function migrateCampaignSnapshot(snapshot) {
  if (snapshot.version === CAMPAIGN_SAVE_VERSION) return snapshot;

  return {
    ...clone(snapshot),
    version: CAMPAIGN_SAVE_VERSION,
    metadata: {
      engine: 'titans-of-war',
      mode: 'scripted',
      selectedModel: null,
      ...(snapshot.metadata || {}),
      migratedFromVersion: snapshot.version
    }
  };
}

export function restoreCampaignFromSnapshot(snapshot, scenarios = []) {
  const compatibility = getCampaignSnapshotCompatibility(snapshot);
  if (!compatibility.ok) return null;
  const migratedSnapshot = migrateCampaignSnapshot(snapshot);

  const state = normalizeState(migratedSnapshot.state);
  if (!isValidState(state)) return null;

  const scenarioId = migratedSnapshot.activeScenarioId || state.scenarioId || state.nextScenarioId;
  const staticScenario = scenarioId ? scenarios.find((scenario) => scenario.id === scenarioId) : null;
  const turnScenario = scenarios.find((scenario) => scenario.turn === state.currentTurn);
  const activeScenario = staticScenario
    || (migratedSnapshot.activeScenario?.choices ? migratedSnapshot.activeScenario : null)
    || turnScenario
    || scenarios[0]
    || null;

  return {
    state: {
      ...state,
      scenarioId: activeScenario?.id || state.scenarioId || null,
      nextScenarioId: state.nextScenarioId || null
    },
    activeScenario,
    migratedFromVersion: compatibility.migratedFromVersion
  };
}

export function saveCampaignSnapshot(snapshot, storage = getDefaultStorage()) {
  if (!storage) return { ok: false, error: 'localStorage unavailable' };

  try {
    storage.setItem(CAMPAIGN_STORAGE_KEY, JSON.stringify(snapshot));
    return { ok: true, error: null };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

export function loadCampaignSnapshot(storage = getDefaultStorage()) {
  return loadCampaignSnapshotResult(storage).snapshot;
}

export function loadCampaignSnapshotResult(storage = getDefaultStorage()) {
  if (!storage) {
    return {
      snapshot: null,
      error: 'Browser storage is unavailable.'
    };
  }

  try {
    const raw = storage.getItem(CAMPAIGN_STORAGE_KEY);
    return {
      snapshot: raw ? JSON.parse(raw) : null,
      error: null
    };
  } catch (err) {
    return {
      snapshot: null,
      error: `Stored auto-save could not be read: ${err.message}`
    };
  }
}
