import { createFreshCampaignState } from './campaignStorage.js';
import { calculateCampaignScore, resolveNextScenario, tickMetrics } from './simulationEngine.js';

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

const CRISIS_LABELS = {
  hotspur: 'Hotspur Cabinet Crisis',
  fox: 'Fox Supply Crisis',
  wolf: 'Wolf Finance Crisis'
};

export function getScenarioForState(state, scenarios) {
  if (!Array.isArray(scenarios) || !scenarios.length) return null;

  if (state?.nextScenarioId) {
    const pending = scenarios.find((scenario) => scenario.id === state.nextScenarioId);
    if (pending) return pending;
  }

  if (state?.scenarioId) {
    const current = scenarios.find((scenario) => scenario.id === state.scenarioId);
    if (current) return current;
  }

  return scenarios.find((scenario) => scenario.turn === state?.currentTurn) || scenarios[0] || null;
}

export function resolveChoiceInput(activeScenario, choiceInput) {
  if (!activeScenario?.choices?.length) return null;

  if (typeof choiceInput === 'string') {
    return activeScenario.choices.find((choice) => choice.id === choiceInput) || null;
  }

  if (choiceInput?.id) {
    return activeScenario.choices.find((choice) => choice.id === choiceInput.id) || choiceInput;
  }

  return null;
}

export function buildHistoryEntry(state, activeScenario, choice, ticked) {
  const crisisFor = activeScenario?.crisisFor || null;
  const crisisAlignmentBefore = crisisFor ? state?.shards?.[crisisFor]?.alignment ?? null : null;
  const crisisAlignmentAfter = crisisFor ? ticked?.shards?.[crisisFor]?.alignment ?? null : null;

  return {
    turn: state.currentTurn,
    scenarioId: activeScenario.id,
    date: activeScenario.date,
    scenarioTitle: activeScenario.title,
    choiceId: choice.id,
    choiceText: choice.text,
    choiceProposer: choice.proposer,
    choiceSucceeded: ticked.choiceSucceeded,
    consequence: ticked.resolvedConsequence,
    divergence: ticked.divergenceIndex,
    crisisFor,
    crisisLabel: crisisFor ? (CRISIS_LABELS[crisisFor] || `${crisisFor} Crisis`) : null,
    crisisAlignmentBefore,
    crisisAlignmentAfter,
    crisisResolved: crisisFor ? crisisAlignmentAfter !== null && crisisAlignmentAfter >= 30 : false
  };
}

// Derives a human-readable tag describing which routing path the campaign director took.
function resolveDirectorRoute(activeScenario, choice, nextScenario, ticked) {
  if (!nextScenario) return 'end-of-campaign';
  if (choice?.next && nextScenario.id === choice.next) return 'choice.next';
  if (nextScenario.crisisFor) return `cabinet-crisis:${nextScenario.crisisFor}`;
  if (Array.isArray(activeScenario?.branches)) {
    const matched = activeScenario.branches.find(
      (b) => b.scenarioId === nextScenario.id && (ticked.divergenceIndex || 0) >= (b.minDivergence || 0)
    );
    if (matched) return `divergence-branch:${(matched.minDivergence * 100).toFixed(0)}%`;
  }
  return 'linear';
}

export function advanceCampaignTurn(state, activeScenario, choiceInput, scenarios, successModifier = 0) {
  const choice = resolveChoiceInput(activeScenario, choiceInput);
  if (!choice) {
    throw new Error(`Choice not found for scenario ${activeScenario?.id || 'unknown'}`);
  }

  const ticked = tickMetrics(state, choice, successModifier);
  const historyEntry = buildHistoryEntry(state, activeScenario, choice, ticked);
  const nextScenario = resolveNextScenario(
    activeScenario,
    choice,
    ticked.currentTurn,
    scenarios,
    ticked.divergenceIndex,
    ticked.shards
  );
  const linearScenario = scenarios.find((scenario) => scenario.turn === ticked.currentTurn) || null;
  const nextScenarioId = nextScenario && nextScenario.id !== linearScenario?.id
    ? nextScenario.id
    : null;
  const canonicalNextScenario = nextScenarioId
    ? nextScenario
    : (linearScenario || nextScenario || null);

  const directorRoute = resolveDirectorRoute(activeScenario, choice, canonicalNextScenario, ticked);

  const nextState = {
    ...clone(state),
    currentTurn: ticked.currentTurn,
    scenarioId: canonicalNextScenario?.id || state.scenarioId || null,
    nextScenarioId,
    metrics: ticked.metrics,
    shards: ticked.shards,
    divergenceIndex: ticked.divergenceIndex,
    gameOver: ticked.gameOver,
    statusMessage: ticked.statusMessage,
    history: [...(state.history || []), historyEntry]
  };

  return {
    state: nextState,
    nextScenario: canonicalNextScenario,
    historyEntry,
    choice,
    ticked,
    directorRoute
  };
}

export function runHeadlessCampaign({ scenarios, initialState = null, chooseChoice = null, maxTurns = 13 }) {
  if (!Array.isArray(scenarios) || !scenarios.length) {
    throw new Error('runHeadlessCampaign requires a non-empty scenario array');
  }

  let state = clone(
    initialState || createFreshCampaignState(1861, scenarios.find((scenario) => scenario.turn === 1)?.id || scenarios[0].id)
  );
  let scenario = getScenarioForState(state, scenarios);
  const turns = [];

  while (scenario && !state.gameOver && turns.length < maxTurns) {
    const selected = chooseChoice
      ? chooseChoice({ state: clone(state), scenario, step: turns.length })
      : scenario.choices?.[0]?.id;

    if (!selected) break;

    const result = advanceCampaignTurn(state, scenario, selected, scenarios);
    turns.push({
      scenarioId: scenario.id,
      scenarioTitle: scenario.title,
      choiceId: result.historyEntry.choiceId,
      crisisFor: result.historyEntry.crisisFor,
      divergence: result.historyEntry.divergence,
      directorRoute: result.directorRoute
    });

    state = result.state;
    scenario = result.nextScenario;
  }

  return {
    finalState: state,
    finalScenario: scenario,
    turns,
    campaignScore: calculateCampaignScore(state)
  };
}

export async function runHeadlessCampaignAsync({ scenarios, initialState = null, chooseChoice = null, maxTurns = 13 }) {
  if (!Array.isArray(scenarios) || !scenarios.length) {
    throw new Error('runHeadlessCampaignAsync requires a non-empty scenario array');
  }

  let state = clone(
    initialState || createFreshCampaignState(1861, scenarios.find((scenario) => scenario.turn === 1)?.id || scenarios[0].id)
  );
  let scenario = getScenarioForState(state, scenarios);
  const turns = [];

  while (scenario && !state.gameOver && turns.length < maxTurns) {
    const selected = chooseChoice
      ? await chooseChoice({ state: clone(state), scenario, step: turns.length })
      : scenario.choices?.[0]?.id;

    if (!selected) break;

    const result = advanceCampaignTurn(state, scenario, selected, scenarios);
    turns.push({
      scenarioId: scenario.id,
      scenarioTitle: scenario.title,
      choiceId: result.historyEntry.choiceId,
      crisisFor: result.historyEntry.crisisFor,
      divergence: result.historyEntry.divergence,
      directorRoute: result.directorRoute
    });

    state = result.state;
    scenario = result.nextScenario;
  }

  return {
    finalState: state,
    finalScenario: scenario,
    turns,
    campaignScore: calculateCampaignScore(state)
  };
}