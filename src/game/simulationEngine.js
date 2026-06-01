// Titans of War — Core Game State & Physics Resolution Engine

// Clamps a metric between 0 and 100
const clamp = (val) => Math.max(0, Math.min(100, val));

// --- Seedable RNG (reproducible campaigns) -------------------------------
// Bare Math.random() made runs impossible to replay, share, or benchmark.
// mulberry32 is a tiny, fast, deterministic PRNG. A campaign stores one seed;
// each turn's roll is derived from (seed, turn) so the same campaign always
// resolves identically — the prerequisite for shareable runs and the
// headless model-tournament grader.
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Deterministically mixes a campaign seed with a turn number into a 32-bit seed.
export function deriveSeed(campaignSeed, turn) {
  const base = (campaignSeed >>> 0) || 0;
  return (base ^ Math.imul((turn | 0) + 1, 0x9e3779b1)) >>> 0;
}

export function tickMetrics(state, choice = null, successModifier = 0) {
  let nextMetrics = { ...state.metrics };
  let nextShards = JSON.parse(JSON.stringify(state.shards));
  let divergence = state.divergenceIndex;

  // 1. Natural turn decay / consumption
  nextMetrics.munitions = clamp(nextMetrics.munitions - 5);
  nextMetrics.treasury = clamp(nextMetrics.treasury - 5);
  
  if (nextMetrics.publicMorale < 40) {
    nextMetrics.militaryStrength = clamp(nextMetrics.militaryStrength - 8);
  }

  // Political backlash tickers (alignment < 30%)
  let activeRevolts = { hotspur: false, fox: false, wolf: false };
  
  if (state.shards.hotspur.alignment < 30) {
    activeRevolts.hotspur = true;
    nextMetrics.militaryStrength = clamp(nextMetrics.militaryStrength - 4);
  }
  if (state.shards.fox.alignment < 30) {
    activeRevolts.fox = true;
    nextMetrics.munitions = clamp(nextMetrics.munitions - 4);
  }
  if (state.shards.wolf.alignment < 30) {
    activeRevolts.wolf = true;
    nextMetrics.treasury = clamp(nextMetrics.treasury - 4);
  }

  // 1b. Divergence volatility — a timeline torn off the historical rails is
  // harder to govern. The further you diverge, the more reserves bleed each
  // turn. This makes the Divergence Index a real cost, not just a readout.
  if (divergence >= 0.35) {
    nextMetrics.treasury = clamp(nextMetrics.treasury - 3);
  }
  if (divergence >= 0.6) {
    nextMetrics.publicMorale = clamp(nextMetrics.publicMorale - 3);
  }

  // 2. Apply choice effects (Stochastic or Deterministic)
  let choiceSucceeded = null;
  let resolvedEffects = null;
  let resolvedConsequence = "";

  if (choice) {
    resolvedEffects = choice.effects;
    resolvedConsequence = choice.consequence;

    if (choice.successRate !== undefined) {
      // Deterministic roll: reproducible for a given (seed, turn).
      const rng = mulberry32(deriveSeed(state.seed ?? 0, state.currentTurn));
      const roll = rng();
      const effectiveSuccessRate = Math.min(1.0, choice.successRate + successModifier);
      if (roll < effectiveSuccessRate) {
        choiceSucceeded = true;
        resolvedEffects = choice.successEffects || choice.effects;
        resolvedConsequence = choice.successConsequence || choice.consequence;
      } else {
        choiceSucceeded = false;
        resolvedEffects = choice.failureEffects || {
          metrics: { militaryStrength: -20, publicMorale: -15 },
          shards: {}
        };
        resolvedConsequence = choice.failureConsequence || `The strategic operation failed: ${choice.consequence}`;
      }
    }

    if (resolvedEffects) {
      if (resolvedEffects.metrics) {
        Object.keys(resolvedEffects.metrics).forEach(key => {
          if (nextMetrics[key] !== undefined) {
            nextMetrics[key] = clamp(nextMetrics[key] + resolvedEffects.metrics[key]);
          }
        });
      }

      if (resolvedEffects.shards) {
        Object.keys(resolvedEffects.shards).forEach(key => {
          if (nextShards[key]) {
            nextShards[key].alignment = clamp(nextShards[key].alignment + resolvedEffects.shards[key]);
          }
        });
      }

      if (resolvedEffects.metrics && resolvedEffects.metrics.divergenceIndex !== undefined) {
        divergence = Math.max(0, Math.min(1.0, divergence + resolvedEffects.metrics.divergenceIndex));
      }
    }
  }

  // 3. Evaluate failure criteria / campaign ending
  let gameOver = false;
  let statusMessage = "";

  let won = false;
  const alternateTimeline = divergence >= 0.6;

  if (divergence >= 1.0) {
    gameOver = true;
    won = false;
    statusMessage = 'TIMELINE PERMANENTLY SEVERED — The cascade of counterfactual choices has driven the campaign entirely off the historical rails. The war you are fighting is no longer the American Civil War. History as written is gone. The timeline is yours alone.';
  } else if (state.currentTurn >= 13 && choice) {
    gameOver = true;
    won = nextMetrics.militaryStrength > 10 && nextMetrics.publicMorale > 10;
    statusMessage = finalTurnStatusMessage(state, choice, divergence);
  } else if (nextMetrics.militaryStrength <= 10) {
    gameOver = true;
    statusMessage = "DEFEAT: Desertion, straggling, expiring enlistments, and battlefield losses have left you without a field army capable of continuing the campaign.";
  } else if (nextMetrics.publicMorale <= 10) {
    gameOver = true;
    statusMessage = "DEFEAT: Bread riots, draft resistance, and collapsing civilian confidence have broken the home front. The war effort can no longer be sustained.";
  } else {
    statusMessage = `Turn ${state.currentTurn + (choice ? 1 : 0)} initialized. Recalibrating tactical grids.`;
  }

  return {
    currentTurn: state.currentTurn + (choice ? 1 : 0),
    metrics: nextMetrics,
    shards: nextShards,
    divergenceIndex: divergence,
    gameOver,
    won,
    alternateTimeline,
    statusMessage,
    choiceSucceeded,
    resolvedConsequence,
    activeRevolts
  };
}

// --- Divergence tiers (the index becomes narratively + mechanically meaningful) ---
export function divergenceTier(divergence) {
  const d = divergence || 0;
  if (d >= 0.6) return { tier: 'severed', label: 'Severed Timeline', note: 'Campaigns, diplomacy, and civilian endurance now unfold far outside the historical record.' };
  if (d >= 0.35) return { tier: 'branching', label: 'Branching Timeline', note: 'Counterfactual decisions are materially changing strategy, politics, and war-weariness.' };
  if (d >= 0.12) return { tier: 'drifting', label: 'Drifting Timeline', note: 'Localized deviations from the historical record.' };
  return { tier: 'tethered', label: 'Tethered to History', note: 'Events track the orthodox chronology.' };
}

function finalTurnStatusMessage(state, choice, divergence) {
  const key = `${state.scenarioId || 'campaign'}:${choice?.id || 'option'}`;

  switch (key) {
    case 'appomattox_decision:option_a':
      return 'CAMPAIGN CONCLUDED — surrender is refused. Organized armies give way to scattered resistance, desertion, and partisan violence as conventional war dissolves into local conflict.';
    case 'appomattox_decision:option_b':
      return 'CAMPAIGN CONCLUDED — Grant\'s parole terms are accepted. The Army of Northern Virginia lays down its arms, and the war closes in disciplined surrender rather than social collapse.';
    case 'appomattox_decision:option_c':
      return 'CAMPAIGN CONCLUDED — the arbitration gambit fails to avert surrender, but diplomacy reshapes the memory and settlement of the war.';
    case 'appomattox_decision:option_d':
      return 'CAMPAIGN CONCLUDED — the final breakout fails. Exhaustion, casualties, and capture end organized resistance in the field.';
    case 'greensboro_convention:option_a':
      return 'CAMPAIGN CONCLUDED — the convention breaks toward continued resistance, but expiring enlistments and straggling splinter the effort into state-level holdouts rather than a coherent national army.';
    case 'greensboro_convention:option_b':
      return 'CAMPAIGN CONCLUDED — departmental paroles and supervised demobilization preserve the remaining armies and avert a wider collapse of civil order.';
    case 'greensboro_convention:option_c':
      return 'CAMPAIGN CONCLUDED — a temporary armistice and relief convention interrupt the final collapse, sending the war into a negotiated and deeply unfamiliar ending.';
    case 'greensboro_convention:option_d':
      return 'CAMPAIGN CONCLUDED — soldiers are sent home under state authority as food networks and enlistments outrun the Confederate center. The war ends through demobilization and exhaustion more than battlefield annihilation.';
    default:
      return divergence >= 0.6
        ? `CAMPAIGN CONCLUDED — a new history is written. The war ended on a timeline ${(divergence * 100).toFixed(0)}% removed from our own.`
        : `CAMPAIGN CONCLUDED! You guided your army through the critical historical thresholds. Final Divergence Index: ${(divergence * 100).toFixed(0)}%.`;
  }
}

export function classifyCampaignEnding(state) {
  const metrics = state.metrics || {};
  const lastEntry = Array.isArray(state.history) && state.history.length
    ? state.history[state.history.length - 1]
    : null;

  if ((metrics.militaryStrength || 0) <= 10 && (state.currentTurn || 0) < 13) {
    return {
      endingClass: 'Army Exhausted',
      endingNote: 'Desertion, straggling, expiring enlistments, and battlefield attrition left no field army capable of continuing the campaign.'
    };
  }

  if ((metrics.publicMorale || 0) <= 10 && (state.currentTurn || 0) < 13) {
    return {
      endingClass: 'Home Front Fracture',
      endingNote: 'Bread riots, draft resistance, and evaporating civilian confidence broke the ability to sustain the war.'
    };
  }

  switch (`${lastEntry?.scenarioId || ''}:${lastEntry?.choiceId || ''}`) {
    case 'appomattox_decision:option_a':
      return {
        endingClass: 'Guerrilla Fragmentation',
        endingNote: 'Formal surrender is rejected, but coherent field armies do not survive. Commands splinter into deserters, holdouts, and local partisan violence.'
      };
    case 'appomattox_decision:option_b':
      return {
        endingClass: 'Parole and Reunion',
        endingNote: 'The campaign ends in formal surrender, paroles, and a return of soldiers to civilian life under American civil authority.'
      };
    case 'appomattox_decision:option_c':
      return {
        endingClass: 'Failed Arbitration',
        endingNote: 'Diplomatic maneuvering does not avert surrender, but it changes the political memory of the war\'s final settlement.'
      };
    case 'appomattox_decision:option_d':
      return {
        endingClass: 'Final Charge',
        endingNote: 'A last battlefield gamble fails, ending the campaign in exhaustion and capture rather than negotiated preservation.'
      };
    case 'greensboro_convention:option_a':
      return {
        endingClass: 'State Resistance',
        endingNote: 'Governors and commanders try to continue the struggle, but desertion and expiring enlistments reduce the war to scattered state-level resistance.'
      };
    case 'greensboro_convention:option_b':
      return {
        endingClass: 'Departmental Paroles',
        endingNote: 'The armies are paroled by department before the remaining rail and food networks collapse, preserving lives and civil order.'
      };
    case 'greensboro_convention:option_c':
      return {
        endingClass: 'Armistice Convention',
        endingNote: 'A temporary armistice and relief convention carry the war into an unfamiliar negotiated ending.'
      };
    case 'greensboro_convention:option_d':
      return {
        endingClass: 'State Demobilization',
        endingNote: 'Soldiers drift home under state authority as enlistments expire and harvest, relief, and civilian order take priority over continued campaigning.'
      };
    default: {
      const tier = divergenceTier(state.divergenceIndex);
      return { endingClass: tier.label, endingNote: tier.note };
    }
  }
}

export function summarizeCabinetCrises(state) {
  const history = Array.isArray(state?.history) ? state.history : [];
  const entries = history.filter((entry) => entry.crisisFor);
  const byFaction = {
    hotspur: { label: 'Hotspur', faced: 0, resolved: 0 },
    fox: { label: 'Fox', faced: 0, resolved: 0 },
    wolf: { label: 'Wolf', faced: 0, resolved: 0 }
  };

  entries.forEach((entry) => {
    if (!byFaction[entry.crisisFor]) return;
    byFaction[entry.crisisFor].faced += 1;
    if (entry.crisisResolved) {
      byFaction[entry.crisisFor].resolved += 1;
    }
  });

  const faced = entries.length;
  const resolved = entries.filter((entry) => entry.crisisResolved).length;
  const unresolved = faced - resolved;
  const activeAtEnd = Object.entries(state?.shards || {})
    .filter(([, shard]) => (shard?.alignment || 0) < 30)
    .map(([key, shard]) => ({ key, label: shard?.name || key, alignment: shard?.alignment || 0 }));

  return {
    faced,
    resolved,
    unresolved,
    activeAtEnd,
    byFaction,
    entries
  };
}

function labelPressure(value) {
  if (value >= 75) return 'critical';
  if (value >= 55) return 'severe';
  if (value >= 35) return 'elevated';
  return 'contained';
}

function labelConfidence(value) {
  if (value >= 70) return 'strong';
  if (value >= 50) return 'stable';
  if (value >= 30) return 'fragile';
  return 'panicked';
}

function labelCohesion(value) {
  if (value >= 70) return 'solid';
  if (value >= 50) return 'fraying';
  if (value >= 30) return 'brittle';
  return 'splintering';
}

function labelLegitimacy(value) {
  if (value >= 70) return 'secure';
  if (value >= 50) return 'strained';
  if (value >= 30) return 'contested';
  return 'breaking';
}

export function summarizePoliticalEconomy(state) {
  const metrics = state?.metrics || {};
  const shards = state?.shards || {};
  const hotspur = shards.hotspur?.alignment || 0;
  const fox = shards.fox?.alignment || 0;
  const wolf = shards.wolf?.alignment || 0;
  const divergence = state?.divergenceIndex || 0;
  const morale = metrics.publicMorale || 0;
  const treasury = metrics.treasury || 0;
  const munitions = metrics.munitions || 0;
  const militaryStrength = metrics.militaryStrength || 0;
  const averageAlignment = (hotspur + fox + wolf) / 3;
  const crisisSummary = summarizeCabinetCrises(state);
  const activeCrises = crisisSummary.activeAtEnd.length;

  const desertionPressureValue = clamp(Math.round(
    ((100 - militaryStrength) * 0.4)
    + ((100 - morale) * 0.3)
    + (Math.max(0, 35 - hotspur) * 1.2)
    + (divergence * 24)
  ));

  const governorResistanceValue = clamp(Math.round(
    ((100 - munitions) * 0.22)
    + ((100 - treasury) * 0.18)
    + (Math.max(0, 35 - fox) * 1.35)
    + ((100 - morale) * 0.14)
    + (activeCrises * 6)
  ));

  const bondConfidenceValue = clamp(Math.round(
    (treasury * 0.5)
    + (wolf * 0.24)
    + (morale * 0.12)
    + ((100 - (divergence * 100)) * 0.14)
    - (activeCrises * 5)
  ));

  const breadReliefPressureValue = clamp(Math.round(
    ((100 - morale) * 0.42)
    + ((100 - treasury) * 0.22)
    + ((100 - munitions) * 0.1)
    + (Math.max(0, 35 - fox) * 0.8)
    + (divergence * 14)
  ));

  const armyCohesionValue = clamp(Math.round(
    (militaryStrength * 0.35)
    + (morale * 0.25)
    + (hotspur * 0.18)
    + (fox * 0.12)
    + ((100 - (divergence * 100)) * 0.1)
    - (activeCrises * 5)
  ));

  const civilAuthorityLegitimacyValue = clamp(Math.round(
    (morale * 0.28)
    + (treasury * 0.18)
    + (averageAlignment * 0.28)
    + ((100 - (divergence * 100)) * 0.14)
    - (activeCrises * 8)
  ));

  const indicators = {
    desertionPressure: {
      value: desertionPressureValue,
      label: labelPressure(desertionPressureValue),
      note: 'Field strength, morale, and Hotspur alignment determine how close the army is to straggling and desertion.'
    },
    governorResistance: {
      value: governorResistanceValue,
      label: labelPressure(governorResistanceValue),
      note: 'Fox alignment, supply strain, and treasury weakness drive state-level resistance to new levies and requisitions.'
    },
    bondConfidence: {
      value: bondConfidenceValue,
      label: labelConfidence(bondConfidenceValue),
      note: 'Treasury health, Wolf alignment, and timeline stability determine whether Confederate finance still looks credible.'
    },
    breadReliefPressure: {
      value: breadReliefPressureValue,
      label: labelPressure(breadReliefPressureValue),
      note: 'Low morale and poor treasury capacity push the home front toward bread riots, relief demands, and civilian unrest.'
    },
    armyCohesion: {
      value: armyCohesionValue,
      label: labelCohesion(armyCohesionValue),
      note: 'Cohesion reflects whether armies still behave like disciplined field forces rather than disconnected local commands.'
    },
    civilAuthorityLegitimacy: {
      value: civilAuthorityLegitimacyValue,
      label: labelLegitimacy(civilAuthorityLegitimacyValue),
      note: 'Civil legitimacy measures whether Richmond and the state apparatus still command obedience across the war effort.'
    }
  };

  const dominantRisks = [
    { key: 'desertionPressure', urgency: indicators.desertionPressure.value },
    { key: 'governorResistance', urgency: indicators.governorResistance.value },
    { key: 'breadReliefPressure', urgency: indicators.breadReliefPressure.value },
    { key: 'bondConfidence', urgency: 100 - indicators.bondConfidence.value },
    { key: 'armyCohesion', urgency: 100 - indicators.armyCohesion.value },
    { key: 'civilAuthorityLegitimacy', urgency: 100 - indicators.civilAuthorityLegitimacy.value },
  ]
    .sort((left, right) => right.urgency - left.urgency)
    .slice(0, 3)
    .map((entry) => entry.key);

  const overview = `Desertion pressure is ${indicators.desertionPressure.label}, governor resistance is ${indicators.governorResistance.label}, bond confidence is ${indicators.bondConfidence.label}, bread relief pressure is ${indicators.breadReliefPressure.label}, army cohesion is ${indicators.armyCohesion.label}, and civil authority legitimacy is ${indicators.civilAuthorityLegitimacy.label}.`;

  const summaryLines = [
    `Desertion pressure ${indicators.desertionPressure.value}/100 (${indicators.desertionPressure.label})`,
    `Governor resistance ${indicators.governorResistance.value}/100 (${indicators.governorResistance.label})`,
    `Bond confidence ${indicators.bondConfidence.value}/100 (${indicators.bondConfidence.label})`,
    `Bread relief pressure ${indicators.breadReliefPressure.value}/100 (${indicators.breadReliefPressure.label})`,
    `Army cohesion ${indicators.armyCohesion.value}/100 (${indicators.armyCohesion.label})`,
    `Civil authority legitimacy ${indicators.civilAuthorityLegitimacy.value}/100 (${indicators.civilAuthorityLegitimacy.label})`
  ];

  return {
    indicators,
    overview,
    summaryLines,
    dominantRisks,
    activeCrises,
  };
}

// --- Strategic Stability Index (campaign score, 0-1000) ---------------------
// One transparent score so human runs AND model-tournament runs are comparable.
const STABILITY_METRIC_KEYS = ['militaryStrength', 'munitions', 'treasury', 'publicMorale'];

export function gradeForStability(total) {
  if (total >= 900) return 'S';
  if (total >= 800) return 'A';
  if (total >= 680) return 'B';
  if (total >= 540) return 'C';
  if (total >= 400) return 'D';
  return 'F';
}

export function calculateCampaignScore(state) {
  const m = state.metrics || {};
  const shards = state.shards || {};
  const turn = state.currentTurn || 0;
  const survived = turn >= 13 && (m.militaryStrength || 0) > 10 && (m.publicMorale || 0) > 10;
  const turnsCompleted = Math.min(13, turn);

  // Resource health: mean of the 4 metrics (already 0-100)
  const metricHealth =
    STABILITY_METRIC_KEYS.reduce((s, k) => s + (m[k] || 0), 0) / (STABILITY_METRIC_KEYS.length * 100);

  // Faction harmony: mean shard alignment
  const shardKeys = Object.keys(shards);
  const harmony = shardKeys.length
    ? shardKeys.reduce((s, k) => s + (shards[k].alignment || 0), 0) / (shardKeys.length * 100)
    : 0;

  // Command stability: penalise each faction currently in open political crisis (<30)
  const mutinies = shardKeys.filter((k) => (shards[k].alignment || 0) < 30).length;
  const commandStability = Math.max(0, 1 - mutinies / Math.max(1, shardKeys.length));
  const crisisSummary = summarizeCabinetCrises(state);
  const activeCrisisPenalty = crisisSummary.activeAtEnd.length / Math.max(1, shardKeys.length || 3);
  const crisisResolutionRatio = crisisSummary.faced === 0 ? 1 : crisisSummary.resolved / crisisSummary.faced;
  const crisisManagement = Math.max(0, Math.min(1, (crisisResolutionRatio * 0.75) + ((1 - activeCrisisPenalty) * 0.25)));

  const survivalPts = Math.round((turnsCompleted / 13) * 250 + (survived ? 150 : 0)); // max 400
  const metricPts = Math.round(metricHealth * 300);                                    // max 300
  const harmonyPts = Math.round(harmony * 200);                                        // max 200
  const crisisPts = Math.round(crisisManagement * 40);                                 // max 40
  const stabilityPts = Math.round(commandStability * 60);                              // max 60

  const total = survivalPts + metricPts + harmonyPts + crisisPts + stabilityPts;
  const ending = classifyCampaignEnding(state);

  return {
    total,
    grade: gradeForStability(total),
    survived,
    turnsCompleted,
    divergence: state.divergenceIndex || 0,
    endingClass: ending.endingClass,
    endingNote: ending.endingNote,
    crisisSummary,
    breakdown: [
      { label: 'Survival', points: survivalPts, max: 400 },
      { label: 'Resource Health', points: metricPts, max: 300 },
      { label: 'Faction Harmony', points: harmonyPts, max: 200 },
      { label: 'Crisis Management', points: crisisPts, max: 40 },
      { label: 'Command Stability', points: stabilityPts, max: 60 }
    ]
  };
}

// --- Branching resolver (deterministic-layer alternate history) -------------
const CABINET_CRISIS_SCENARIOS = {
  hotspur: 'hotspur_cabinet_crisis',
  fox: 'fox_supply_crisis',
  wolf: 'wolf_finance_crisis'
};

function resolveCabinetCrisisScenario(currentScenario, nextShards, scenarios) {
  if (!nextShards || currentScenario?.crisisFor) return null;

  const pending = Object.entries(CABINET_CRISIS_SCENARIOS)
    .map(([shard, scenarioId]) => ({
      shard,
      scenarioId,
      alignment: nextShards[shard]?.alignment ?? 100
    }))
    .filter((entry) => entry.alignment < 30)
    .sort((a, b) => a.alignment - b.alignment);

  if (!pending.length) return null;

  return scenarios.find((scenario) => scenario.id === pending[0].scenarioId) || null;
}

// Resolves which scenario comes next WITHOUT requiring the LLM. Supports:
//   - choice.next: explicit scenario id to branch to
//   - scenario.branches: [{ minDivergence, scenarioId }] divergence-gated forks
//   - forced cabinet crisis scenarios when a faction falls into open resistance
//   - default: linear by turn number
// Backward compatible: scenarios with neither field fall through to linear order.
export function resolveNextScenario(currentScenario, choice, nextTurn, scenarios, divergence = 0, nextShards = null) {
  const byId = (id) => scenarios.find((s) => s.id === id);

  if (choice && choice.next) {
    const target = byId(choice.next);
    if (target) return target;
  }

  if (currentScenario && Array.isArray(currentScenario.branches)) {
    const eligible = currentScenario.branches
      .filter((b) => (divergence || 0) >= (b.minDivergence || 0))
      .sort((a, b) => (b.minDivergence || 0) - (a.minDivergence || 0));
    if (eligible.length && eligible[0].scenarioId) {
      const target = byId(eligible[0].scenarioId);
      if (target) return target;
    }
  }

  const cabinetCrisis = resolveCabinetCrisisScenario(currentScenario, nextShards, scenarios);
  if (cabinetCrisis) return cabinetCrisis;

  return scenarios.find((s) => s.turn === nextTurn) || null;
}

// Interactive Offline Sentiment Parser
// Runs immediately in browser using keyword heuristics, matching the layout triggers
export function parseLetterSentimentOffline(text) {
  const clean = (text || "").toLowerCase().trim();
  if (!clean) return null;

  // Heartfelt terms
  const heartfeltKeywords = ["love", "dear", "heartfelt", "wife", "pray", "miss", "affection", "family", "darling", "beloved", "child", "home"];
  // Resolute / Cold terms
  const resoluteKeywords = ["duty", "combat", "orders", "war", "iron", "resolute", "fight", "defense", "secure", "victory", "force", "enemy"];
  // Melancholic / Fearful terms
  const melancholicKeywords = ["retreat", "fear", "dark", "blood", "death", "wound", "doom", "hopeless", "cold", "despair", "lost", "grave"];

  let heartfeltCount = 0;
  let resoluteCount = 0;
  let melancholicCount = 0;

  heartfeltKeywords.forEach(k => { if (clean.includes(k)) heartfeltCount++; });
  resoluteKeywords.forEach(k => { if (clean.includes(k)) resoluteCount++; });
  melancholicKeywords.forEach(k => { if (clean.includes(k)) melancholicCount++; });

  if (heartfeltCount > resoluteCount && heartfeltCount > melancholicCount) {
    return {
      tone: "Heartfelt",
      ideology: "Diplomatic",
      moraleMod: +5,
      strengthMod: 0,
      description: "A moving letter home. The cabinet is rallied by your warmth. (+5 Public Morale)"
    };
  }

  if (resoluteCount > heartfeltCount && resoluteCount > melancholicCount) {
    return {
      tone: "Resolute",
      ideology: "Practical",
      moraleMod: -5,
      strengthMod: +5,
      description: "A stoic, severe tactical briefly. Tactical focus hardens your military resolve. (+5 Military Strength, -5 Morale)"
    };
  }

  if (melancholicCount > 0) {
    return {
      tone: "Melancholic",
      ideology: "Radical",
      moraleMod: -10,
      strengthMod: 0,
      description: "A dark letter expressing heavy dread. Rumors of despair leak out, worrying the home front. (-10 Public Morale)"
    };
  }

  // Default Baseline
  return {
    tone: "Standard Brief",
    ideology: "Balanced",
    moraleMod: 0,
    strengthMod: 0,
    description: "A formal communication. Telemetry indices remain stable."
  };
}
