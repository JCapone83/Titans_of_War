import { INITIAL_STATE } from './initialState.js';

export const CAMPAIGN_SAVE_VERSION = 1;
export const CAMPAIGN_STORAGE_KEY = 'titans-of-war:campaign:auto-save';

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

export function restoreCampaignFromSnapshot(snapshot, scenarios = []) {
  if (!snapshot || snapshot.version !== CAMPAIGN_SAVE_VERSION || !snapshot.state) return null;

  const state = normalizeState(snapshot.state);
  if (!isValidState(state)) return null;

  const scenarioId = snapshot.activeScenarioId || state.scenarioId || state.nextScenarioId;
  const staticScenario = scenarioId ? scenarios.find((scenario) => scenario.id === scenarioId) : null;
  const turnScenario = scenarios.find((scenario) => scenario.turn === state.currentTurn);
  const activeScenario = staticScenario
    || (snapshot.activeScenario?.choices ? snapshot.activeScenario : null)
    || turnScenario
    || scenarios[0]
    || null;

  return {
    state: {
      ...state,
      scenarioId: activeScenario?.id || state.scenarioId || null,
      nextScenarioId: state.nextScenarioId || null
    },
    activeScenario
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
  if (!storage) return null;

  try {
    const raw = storage.getItem(CAMPAIGN_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}