import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  createCampaignSnapshot,
  createFreshCampaignState,
  loadCampaignSnapshot,
  restoreCampaignFromSnapshot,
  saveCampaignSnapshot
} from '../src/game/campaignStorage.js';
import {
  calculateCampaignScore,
  classifyCampaignEnding,
  deriveSeed,
  divergenceTier,
  mulberry32,
  resolveNextScenario,
  summarizeCabinetCrises,
  tickMetrics
} from '../src/game/simulationEngine.js';
import { advanceCampaignTurn, runHeadlessCampaign, runHeadlessCampaignAsync } from '../src/game/headlessCampaign.js';
import { resolveScenarioMediaSet } from '../src/game/mediaCatalog.js';

const baseState = {
  currentTurn: 1,
  seed: 1861,
  divergenceIndex: 0,
  metrics: {
    militaryStrength: 50,
    munitions: 50,
    treasury: 50,
    publicMorale: 50
  },
  shards: {
    hotspur: { alignment: 60, influence: 35 },
    fox: { alignment: 60, influence: 40 },
    wolf: { alignment: 60, influence: 25 }
  },
  history: []
};

const firstRoll = mulberry32(deriveSeed(1861, 1))();
const repeatedRoll = mulberry32(deriveSeed(1861, 1))();
assert.equal(firstRoll, repeatedRoll, 'seeded RNG must be reproducible for the same campaign seed and turn');

const successfulChoice = {
  successRate: 1,
  successEffects: {
    metrics: { militaryStrength: 10, munitions: -10, publicMorale: 5, divergenceIndex: 0.1 },
    shards: { hotspur: 10 }
  },
  successConsequence: 'The operation succeeded.'
};
const successfulTick = tickMetrics(baseState, successfulChoice);
assert.equal(successfulTick.choiceSucceeded, true, 'successRate 1 choices must always succeed');
assert.equal(successfulTick.metrics.militaryStrength, 60, 'successful choice effects should apply after turn decay');
assert.equal(successfulTick.metrics.munitions, 35, 'natural munitions decay and choice cost should both apply');
assert.equal(successfulTick.divergenceIndex, 0.1, 'divergence deltas should update the campaign index');
assert.equal(successfulTick.shards.hotspur.alignment, 70, 'shard effects should update alignment');

const failedChoice = {
  successRate: 0,
  failureEffects: {
    metrics: { militaryStrength: -500, publicMorale: 500, divergenceIndex: 2 },
    shards: { fox: -500 }
  },
  failureConsequence: 'The operation failed.'
};
const failedTick = tickMetrics(baseState, failedChoice);
assert.equal(failedTick.choiceSucceeded, false, 'successRate 0 choices must always fail');
assert.equal(failedTick.metrics.militaryStrength, 0, 'metrics should clamp at the lower bound');
assert.equal(failedTick.metrics.publicMorale, 100, 'metrics should clamp at the upper bound');
assert.equal(failedTick.shards.fox.alignment, 0, 'shard alignment should clamp at the lower bound');
assert.equal(failedTick.divergenceIndex, 1, 'divergence should clamp at 1.0');

const scenarios = [
  { id: 'linear_turn_2', turn: 2 },
  { id: 'branch_turn_2', turn: 2 },
  { id: 'high_divergence_branch', turn: 2 },
  { id: 'hotspur_cabinet_crisis', turn: 0, crisisFor: 'hotspur' },
  { id: 'fox_supply_crisis', turn: 0, crisisFor: 'fox' },
  { id: 'wolf_finance_crisis', turn: 0, crisisFor: 'wolf' }
];
assert.equal(
  resolveNextScenario(null, { next: 'branch_turn_2' }, 2, scenarios, 0)?.id,
  'branch_turn_2',
  'explicit choice.next should override linear turn routing'
);
assert.equal(
  resolveNextScenario(
    { branches: [{ minDivergence: 0.4, scenarioId: 'high_divergence_branch' }] },
    {},
    2,
    scenarios,
    0.5
  )?.id,
  'high_divergence_branch',
  'eligible divergence branches should override linear turn routing'
);
assert.equal(
  resolveNextScenario(
    { id: 'manassas_battlefield' },
    {},
    2,
    scenarios,
    0,
    {
      hotspur: { alignment: 22 },
      fox: { alignment: 60 },
      wolf: { alignment: 60 }
    }
  )?.id,
  'hotspur_cabinet_crisis',
  'low hotspur alignment should inject the corresponding cabinet crisis scenario'
);
assert.equal(
  resolveNextScenario(
    { id: 'hotspur_cabinet_crisis', crisisFor: 'hotspur' },
    {},
    2,
    scenarios,
    0,
    {
      hotspur: { alignment: 18 },
      fox: { alignment: 60 },
      wolf: { alignment: 60 }
    }
  )?.id,
  'linear_turn_2',
  'crisis scenarios should not recursively inject themselves on the very next resolution'
);

assert.equal(divergenceTier(0.7).tier, 'severed', 'high divergence should classify as a severed timeline');
assert.equal(calculateCampaignScore({ ...baseState, currentTurn: 13 }).breakdown.length, 5, 'campaign score should expose five components including crisis management');
assert.equal(
  classifyCampaignEnding({
    ...baseState,
    currentTurn: 6,
    metrics: { ...baseState.metrics, publicMorale: 5 }
  }).endingClass,
  'Home Front Fracture',
  'morale collapse should classify as home-front failure rather than a coup-state ending'
);
assert.equal(
  classifyCampaignEnding({
    ...baseState,
    currentTurn: 13,
    history: [{ scenarioId: 'greensboro_convention', choiceId: 'option_d' }],
    divergenceIndex: 0.7
  }).endingClass,
  'State Demobilization',
  'alternative final scenarios should produce specific ending classes'
);

const crisisState = {
  ...baseState,
  shards: {
    hotspur: { alignment: 28, influence: 35, name: 'Hotspur' },
    fox: { alignment: 60, influence: 40, name: 'Fox' },
    wolf: { alignment: 18, influence: 25, name: 'Wolf' }
  },
  history: [
    { crisisFor: 'hotspur', crisisResolved: true, crisisLabel: 'Hotspur Cabinet Crisis', turn: 3 },
    { crisisFor: 'wolf', crisisResolved: false, crisisLabel: 'Wolf Finance Crisis', turn: 6 }
  ]
};
const crisisSummary = summarizeCabinetCrises(crisisState);
assert.equal(crisisSummary.faced, 2, 'cabinet crisis summary should count all crisis sessions in history');
assert.equal(crisisSummary.resolved, 1, 'cabinet crisis summary should count resolved crises');
assert.equal(crisisSummary.activeAtEnd.length, 2, 'cabinet crisis summary should report factions still below the crisis threshold');

const headlessScenarios = [
  {
    id: 'opening',
    turn: 1,
    title: 'Opening',
    date: 'Day 1',
    choices: [
      {
        id: 'option_a',
        text: 'Trigger the Hotspur backlash.',
        proposer: 'hotspur',
        effects: {
          metrics: { divergenceIndex: 0.1 },
          shards: { hotspur: -40 }
        },
        consequence: 'The camps demand action.'
      }
    ]
  },
  {
    id: 'hotspur_cabinet_crisis',
    turn: 0,
    crisisFor: 'hotspur',
    title: 'Hotspur Cabinet Crisis',
    date: 'Emergency Session',
    choices: [
      {
        id: 'option_a',
        text: 'Placate the fire-eaters.',
        proposer: 'hotspur',
        effects: {
          metrics: { publicMorale: 5 },
          shards: { hotspur: +25 }
        },
        consequence: 'The cabinet steadies the camps.'
      }
    ]
  },
  {
    id: 'linear_turn_2',
    turn: 2,
    title: 'Turn Two',
    date: 'Day 2',
    choices: [
      {
        id: 'option_a',
        text: 'Continue the campaign.',
        proposer: 'fox',
        effects: {
          metrics: { publicMorale: 1 },
          shards: { fox: +1 }
        },
        consequence: 'The campaign continues.'
      }
    ]
  }
];
const headlessStart = {
  ...baseState,
  currentTurn: 1,
  scenarioId: 'opening',
  history: []
};
const firstAdvance = advanceCampaignTurn(headlessStart, headlessScenarios[0], 'option_a', headlessScenarios);
assert.equal(firstAdvance.nextScenario.id, 'hotspur_cabinet_crisis', 'headless turn advancement should inject crisis scenarios just like the UI flow');
const crisisAdvance = advanceCampaignTurn(firstAdvance.state, headlessScenarios[1], 'option_a', headlessScenarios);
assert.equal(crisisAdvance.historyEntry.crisisFor, 'hotspur', 'history entries should record which cabinet crisis was faced');
assert.equal(crisisAdvance.historyEntry.crisisResolved, true, 'history entries should record whether the crisis was stabilized');
const headlessRun = runHeadlessCampaign({
  scenarios: headlessScenarios,
  initialState: headlessStart,
  chooseChoice: ({ scenario }) => scenario.choices[0].id,
  maxTurns: 2
});
assert.equal(headlessRun.turns.length, 2, 'headless campaign runner should execute successive turns without the React app');
assert.equal(headlessRun.turns[1].crisisFor, 'hotspur', 'headless campaign runner should surface crisis turns in its execution log');
const asyncHeadlessRun = await runHeadlessCampaignAsync({
  scenarios: headlessScenarios,
  initialState: headlessStart,
  chooseChoice: async ({ scenario }) => scenario.choices[0].id,
  maxTurns: 2
});
assert.equal(asyncHeadlessRun.turns.length, 2, 'async headless campaign runner should support awaited choice providers for model benchmarking');
assert.equal(asyncHeadlessRun.turns[1].crisisFor, 'hotspur', 'async headless campaign runner should preserve crisis metadata');

const freshCampaign = createFreshCampaignState(12345, 'fort_sumter');
assert.equal(freshCampaign.seed, 12345, 'fresh campaign state should preserve the requested seed');
assert.equal(freshCampaign.currentTurn, 1, 'fresh campaign state should start at turn 1');

const snapshot = createCampaignSnapshot(
  { ...freshCampaign, currentTurn: 2, scenarioId: 'charleston_harbor_escape' },
  { id: 'charleston_harbor_escape', title: 'Charleston Harbor Escape', choices: [] },
  { selectedModel: 'llama3.2', aiPortalEngaged: true }
);
const restored = restoreCampaignFromSnapshot(snapshot, [
  { id: 'fort_sumter', turn: 1 },
  { id: 'charleston_harbor_escape', turn: 2, choices: [] }
]);
assert.equal(restored.state.seed, 12345, 'campaign snapshots should restore the saved seed');
assert.equal(restored.activeScenario.id, 'charleston_harbor_escape', 'campaign snapshots should restore the active scenario');
assert.equal(restored.state.scenarioId, 'charleston_harbor_escape', 'campaign snapshots should restore the scenario id');

const memoryStorage = new Map();
const storageAdapter = {
  getItem: (key) => memoryStorage.get(key) || null,
  setItem: (key, value) => memoryStorage.set(key, value)
};
assert.equal(saveCampaignSnapshot(snapshot, storageAdapter).ok, true, 'campaign snapshots should save through a storage adapter');
assert.equal(loadCampaignSnapshot(storageAdapter).state.seed, 12345, 'campaign snapshots should load through a storage adapter');

const scenariosSource = readFileSync(new URL('../src/game/scenarios.js', import.meta.url), 'utf8');
assert.equal(
  scenariosSource.includes('image: "/src/assets/images/'),
  false,
  'scenario cards should use imported Vite assets, not raw /src image strings'
);

const mappedTacticalMedia = resolveScenarioMediaSet('antietam').tacticalMap;
assert.equal(mappedTacticalMedia.kind, 'map', 'mapped tactical scenarios should use verified terrain maps');
assert.equal(
  mappedTacticalMedia.src.includes('map_antietam_sharpsburg_loc.jpg'),
  true,
  'Antietam tactical mode should use the Sharpsburg terrain map'
);

const proceduralTacticalMedia = resolveScenarioMediaSet('chickamauga').tacticalMap;
assert.equal(proceduralTacticalMedia.isProcedural, true, 'unmapped tactical scenarios should use procedural terrain');
assert.equal(proceduralTacticalMedia.src, '', 'procedural tactical fallback should not reuse theater/card art');

console.log('Smoke tests passed.');
