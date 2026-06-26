// Titans of War — Main App Coordinator (Dual Basic & AI Mode)
import React, { useState, useEffect, useRef } from 'react';
import { Shield, Coins, Users, Swords, PenTool, Radio, HelpCircle, Compass, RotateCcw, AlertTriangle, BookOpen, Share2 } from 'lucide-react';
import { INITIAL_STATE, STATIC_SCENARIOS } from './game/scenarios';
import { CAMPAIGN_FINAL_TURN, parseLetterSentimentOffline, calculateCampaignScore, divergenceTier, getChoiceAvailability } from './game/simulationEngine';
import { createCampaignSnapshot, createFreshCampaignState, getCampaignSnapshotCompatibility, loadCampaignSnapshotResult, restoreCampaignFromSnapshot, saveCampaignSnapshot } from './game/campaignStorage';
import { advanceCampaignTurn, getScenarioForState } from './game/headlessCampaign';
import ScenarioTheater from './components/ScenarioTheater';
import HistoricalPrimerPanel from './components/HistoricalPrimerPanel';
import { getPrimerIdsForScenario, HISTORICAL_PRIMERS } from './game/historicalPrimers';
import { generateAdvisorDebate } from './game/advisorDebate';
import { buildCampaignBundle } from './game/campaignBundle';
import { buildCampaignChronicle } from './game/chronicleExporter';
import { resolveCampaignEndingMedia } from './game/mediaCatalog';
import { publicAssetUrl } from './game/publicPath';
import { generateNextScenario, listOllamaModels, classifyLetterSentiment } from './engine/ollamaGenerator';
import { compareModelProfiles, RECOMMENDED_LOCAL_MODEL, resolveModelProfile } from './engine/modelCapabilities';
import { StrategyAudioManager } from './engine/StrategyAudioManager';


function loadInitialCampaign() {
  const loaded = loadCampaignSnapshotResult();
  if (loaded.error) {
    return {
      state: createFreshCampaignState(undefined, STATIC_SCENARIOS[0]?.id || null),
      activeScenario: STATIC_SCENARIOS[0],
      archiveMessage: `${loaded.error} New campaign initialized.`
    };
  }

  const compatibility = loaded.snapshot ? getCampaignSnapshotCompatibility(loaded.snapshot) : null;
  const restored = restoreCampaignFromSnapshot(loaded.snapshot, STATIC_SCENARIOS);
  if (restored) {
    const migrationNote = restored.migratedFromVersion
      ? ` Migrated save version ${restored.migratedFromVersion} to version 2.`
      : '';
    return {
      ...restored,
      archiveMessage: `Loaded auto-save from turn ${restored.state.currentTurn}.${migrationNote}`
    };
  }

  return {
    state: createFreshCampaignState(undefined, STATIC_SCENARIOS[0]?.id || null),
    activeScenario: STATIC_SCENARIOS[0],
    archiveMessage: compatibility && !compatibility.ok
      ? `${compatibility.reason} New campaign initialized without deleting the old save.`
      : 'Auto-save ready. New campaign initialized.'
  };
}

const DEMO_ROUTE_DECISIONS = [
  { scenarioId: 'fort_sumter', choiceId: 'option_b' },
  { scenarioId: 'manassas_battlefield', choiceId: 'option_b' },
  { scenarioId: 'naval_technology', choiceId: 'option_d' },
  { scenarioId: 'shiloh_army_of_tennessee', choiceId: 'option_b' },
  { scenarioId: 'first_winchester', choiceId: 'option_b' },
  { scenarioId: 'seven_days', choiceId: 'option_b' },
  { scenarioId: 'second_manassas', choiceId: 'option_b' },
  { scenarioId: 'potomac_leverage_campaign', choiceId: 'option_b' },
  { scenarioId: 'fredericksburg_winter_politics', choiceId: 'option_b' },
  { scenarioId: 'chancellorsville_maneuver', choiceId: 'option_a' },
  { scenarioId: 'chancellorsville_aftermath', choiceId: 'option_b' },
  { scenarioId: 'gettysburg_with_jackson_setup', choiceId: 'option_b' },
  { scenarioId: 'gettysburg_with_jackson', choiceId: 'option_a', choiceSucceeded: true },
  { scenarioId: 'gettysburg_recognition_crisis', choiceId: 'option_b' },
  { scenarioId: 'chickamauga', choiceId: 'option_b' },
  { scenarioId: 'chattanooga_stranglehold', choiceId: 'option_b' },
  { scenarioId: 'wilderness_opening', choiceId: 'option_b' },
  { scenarioId: 'wilderness', choiceId: 'option_b' },
  { scenarioId: 'new_market', choiceId: 'option_b' },
  { scenarioId: 'cold_harbor', choiceId: 'option_c' },
  { scenarioId: 'atlanta_election_pressure', choiceId: 'option_b' },
  { scenarioId: 'atlanta_holds_october', choiceId: 'option_b' },
  { scenarioId: 'third_winchester', choiceId: 'option_d' },
];

function buildDemoHistory(scenarios) {
  return DEMO_ROUTE_DECISIONS
    .map((decision, index) => {
      const scenario = scenarios.find((entry) => entry.id === decision.scenarioId);
      const choice = scenario?.choices?.find((entry) => entry.id === decision.choiceId);
      if (!scenario || !choice) return null;
      const choiceSucceeded = decision.choiceSucceeded ?? null;
      const consequence = choiceSucceeded === true
        ? choice.successConsequence
        : choiceSucceeded === false
          ? choice.failureConsequence
          : choice.consequence;
      const effects = choiceSucceeded === true
        ? choice.successEffects
        : choiceSucceeded === false
          ? choice.failureEffects
          : choice.effects;

      return {
        turn: scenario.turn,
        scenarioId: scenario.id,
        date: scenario.date,
        scenarioTitle: scenario.title,
        choiceId: choice.id,
        choiceText: choice.text,
        choiceProposer: choice.proposer,
        scoreCard: choice.scoreCard || null,
        metricEffects: { ...(effects?.metrics || {}) },
        choiceSucceeded,
        consequence: consequence || 'Decision resolved in the demo route.',
        divergence: Math.min(0.74, Number(((index + 1) * 0.035).toFixed(3))),
        crisisFor: null,
        crisisLabel: null,
        crisisAlignmentBefore: null,
        crisisAlignmentAfter: null,
        crisisResolved: false
      };
    })
    .filter(Boolean);
}

function buildCampaignShareText(state, score) {
  const currentScore = score || calculateCampaignScore(state);
  const recentDecisions = (state.history || [])
    .slice(-3)
    .map((entry) => `- Turn ${entry.turn}: ${entry.scenarioTitle} -> ${entry.choiceText}`)
    .join('\n');

  return [
    'Titans of War campaign result',
    '',
    `Outcome: ${currentScore.survived ? 'Campaign survived' : 'Campaign collapsed'}`,
    `Ending: ${currentScore.endingClass}`,
    `Composite score: ${currentScore.total}/1000 (${currentScore.grade})`,
    `Tactical smarts: ${currentScore.reportCards.tacticalSmarts.score}/100 (${currentScore.reportCards.tacticalSmarts.grade})`,
    `Strategic brilliance: ${currentScore.reportCards.strategicBrilliance.score}/100 (${currentScore.reportCards.strategicBrilliance.grade})`,
    `Timeline fidelity: ${currentScore.reportCards.timelineFidelity.score}/100 (${currentScore.reportCards.timelineFidelity.grade})`,
    `Divergence: ${((state.divergenceIndex || 0) * 100).toFixed(0)}%`,
    `Decisions enacted: ${(state.history || []).length}/${CAMPAIGN_FINAL_TURN}`,
    `Seed: ${state.seed}`,
    '',
    'Final state:',
    `- Military: ${state.metrics?.militaryStrength ?? 0}/100`,
    `- Munitions: ${state.metrics?.munitions ?? 0}/100`,
    `- Treasury: ${state.metrics?.treasury ?? 0}/100`,
    `- Food: ${state.metrics?.foodSupply ?? 0}/100`,
    `- Morale: ${state.metrics?.publicMorale ?? 0}/100`,
    '',
    recentDecisions ? `Recent decisions:\n${recentDecisions}` : 'Recent decisions: none yet',
    '',
    'Built by Titans Forge',
    'Open-source historical strategy prototype'
  ].join('\n');
}

const TUTORIAL_STEPS = [
  {
    title: "Step 1: Track Campaign Progress",
    text: "Use the campaign progress panel to see your current turn, campaign phase, and the next likely milestone. It is the fastest way to tell how deep you are into the war and what is coming next.",
    highlightId: "progress-panel"
  },
  {
    title: "Step 2: Manage The Factions",
    text: "These are your political factions. Each group represents a wing of your cabinet. Keep their alignments above 30% or you will trigger cabinet crises and lose resources every turn.",
    highlightId: "shards-panel"
  },
  {
    title: "Step 3: Read The Theater",
    text: "Use the scenario theater to switch between image and tactical map views. The image frames the moment; the map and tactical overlay help you read terrain and battlefield geometry.",
    highlightId: "cartography-panel"
  },
  {
    title: "Step 4: Write The Letter",
    text: "Draft a letter home before you choose a strategy. The sentiment pass can change morale or military posture for the turn and helps explain the emotional state of the campaign.",
    highlightId: "letter-panel"
  },
  {
    title: "Step 5: Commit The Decision",
    text: "Review the cabinet debate and action cards, then commit one strategy. Locked options tell you whether the blocker is political resistance or a divergence threshold.",
    highlightId: "choices-panel"
  }
];

const CAMPAIGN_PHASES = [
  {
    start: 1,
    end: 4,
    label: 'Secession and Opening Shock',
    note: 'Fort Sumter through the first tests in Virginia and the West.',
  },
  {
    start: 5,
    end: 9,
    label: 'Valley Maneuver and Invasion',
    note: 'Jackson, Maryland, Fredericksburg, and Chancellorsville reshape the war.',
  },
  {
    start: 10,
    end: 14,
    label: 'Gettysburg and Western Pressure',
    note: 'Pennsylvania, Chickamauga, and the first great cracks in Confederate momentum.',
  },
  {
    start: 15,
    end: 20,
    label: 'Overland and the 1864 Campaigns',
    note: 'Wilderness, New Market, Cold Harbor, Atlanta, and the Crater turn maneuver into exhaustion.',
  },
  {
    start: 21,
    end: 24,
    label: 'Atlanta Falls and the Nation Votes',
    note: 'Atlanta, Winchester, Cedar Creek, and the presidential election decide whether Northern politics can still change the war.',
  },
  {
    start: 25,
    end: CAMPAIGN_FINAL_TURN,
    label: 'Collapse and Settlement',
    note: 'Colored Troops, Five Forks, Richmond, Appomattox, and the last settlement terms.',
  },
];

function getCampaignPhase(turn) {
  return CAMPAIGN_PHASES.find((phase) => turn >= phase.start && turn <= phase.end) || CAMPAIGN_PHASES[CAMPAIGN_PHASES.length - 1];
}

export default function App() {

  const [initialCampaign] = useState(loadInitialCampaign);
  const [gameState, setGameState] = useState(initialCampaign.state);
  const [activeScenario, setActiveScenario] = useState(initialCampaign.activeScenario);
  const [letterDraft, setLetterDraft] = useState('');
  const [sentimentResult, setSentimentResult] = useState(null);
  const [selectedChoiceId, setSelectedChoiceId] = useState(null);
  const [hoveredChoiceId, setHoveredChoiceId] = useState(null);
  const [showTutorial, setShowTutorial] = useState(false);

  // AI-Mode state parameters
  const [aiPortalEngaged, setAiPortalEngaged] = useState(false);
  const [aiStatus, setAiStatus] = useState('Idle. Scripted campaign active.');
  const [aiLog, setAiLog] = useState('');
  const [isLoadingModel, setIsLoadingModel] = useState(false);
  const [exportSuccessMessage, setExportSuccessMessage] = useState('');
  const [availableModels, setAvailableModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState('');
  // When the AI portal is engaged, default behavior is to AUGMENT the authored
  // spine: scripted scenarios run whenever one exists for the current turn,
  // and the local model is only invoked beyond the authored catalog or when
  // the player explicitly opts into divergent free play.
  const [aiFreePlayMode, setAiFreePlayMode] = useState(false);

  // Historical primer side panel — opt-in topical context for the active turn.
  // `consultedPrimerIds` is a Set of primer ids the player viewed this run;
  // it feeds the chronicle export so a finished campaign shows the research
  // path the player followed, not only the decisions they made.
  const [primerPanelOpen, setPrimerPanelOpen] = useState(false);
  const [consultedPrimerIds, setConsultedPrimerIds] = useState(() => new Set());
  const [archiveMessage, setArchiveMessage] = useState(initialCampaign.archiveMessage);
  const skipNextScenarioEffect = useRef(true);

  // Undo & Chrono-Rewind state
  const [undoStack, setUndoStack] = useState([]);

  // Audio state parameters
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [audioMuted, setAudioMuted] = useState(false);
  const [audioVolume, setAudioVolume] = useState(0.4);
  const [audioTrackLabel, setAudioTrackLabel] = useState('Off');
  const [audioUseProcedural, setAudioUseProcedural] = useState(false);
  const [audioHasFileLibrary, setAudioHasFileLibrary] = useState(false);
  const [audioFileTrackCount, setAudioFileTrackCount] = useState(0);
  const [audioTrackSource, setAudioTrackSource] = useState('');
  const [audioTrackLicense, setAudioTrackLicense] = useState('');
  const [audioBusLevels, setAudioBusLevels] = useState({ music: 1, ambience: 0.32, stinger: 0.95 });
  const [audioActiveDuckKeys, setAudioActiveDuckKeys] = useState([]);
  const [audioHasRealtimeBusGraph, setAudioHasRealtimeBusGraph] = useState(false);
  const [isLetterWriting, setIsLetterWriting] = useState(false);

  // Tutorial state parameters
  const [tutorialStep, setTutorialStep] = useState(0);

  // Gameplay safety and shortcuts panel state
  const [confirmExecution, setConfirmExecution] = useState(false);
  const [showHotkeysHelp, setShowHotkeysHelp] = useState(false);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);


  const audioManagerRef = useRef(null);
  if (!audioManagerRef.current) {
    audioManagerRef.current = new StrategyAudioManager();
    audioManagerRef.current.init();
  }

  const syncAudioConsole = (snapshot = audioManagerRef.current?.getStatusSnapshot()) => {
    if (!snapshot) return;
    setAudioPlaying(snapshot.isPlaying);
    setAudioMuted(snapshot.isMuted);
    setAudioVolume(snapshot.volume);
    setAudioTrackLabel(snapshot.trackLabel);
    setAudioUseProcedural(snapshot.useProcedural);
    setAudioHasFileLibrary(snapshot.hasFileLibrary);
    setAudioFileTrackCount(snapshot.fileTrackCount || 0);
    setAudioTrackSource(snapshot.trackSource || '');
    setAudioTrackLicense(snapshot.trackLicense || '');
    setAudioBusLevels(snapshot.mixState?.busLevels || { music: 1, ambience: 0.32, stinger: 0.95 });
    setAudioActiveDuckKeys(snapshot.mixState?.activeDuckKeys || []);
    setAudioHasRealtimeBusGraph(Boolean(snapshot.mixState?.realtimeGraph));
  };

  useEffect(() => {
    const manager = audioManagerRef.current;
    if (!manager) return undefined;
    manager.setStatusListener((snapshot) => {
      syncAudioConsole(snapshot);
    });
    syncAudioConsole();
    return () => manager.setStatusListener(null);
  }, []);


  const updateContextualMusic = (state = gameState) => {
    const manager = audioManagerRef.current;
    if (!manager || !manager.isPlaying) return;
    if (manager.useProcedural) {
      manager.playContextualProceduralTrack(state);
    } else {
      manager.playContextualFileTrack(state);
    }
    
    // Check if the militaristic Hotspur shard is highly aligned (> 70)
    if (state?.shards?.hotspur?.alignment > 70) {
      manager.queueHotspurMartialFlourish?.(800);
    }
    
    syncAudioConsole();
  };

  const handleToggleAudioPlay = () => {
    const manager = audioManagerRef.current;
    if (!manager) return;
    if (audioPlaying) {
      manager.stop();
    } else {
      manager.start(gameState);
    }
  };

  const handleSkipTrack = () => {
    const manager = audioManagerRef.current;
    if (!manager || !audioPlaying) return;
    manager.playNextTrack?.(gameState);
    syncAudioConsole();
  };

  const handleToggleAudioMute = () => {
    const manager = audioManagerRef.current;
    if (!manager) return;
    manager.toggleMute();
    syncAudioConsole();
  };

  const handleAudioVolumeChange = (e) => {
    const manager = audioManagerRef.current;
    if (!manager) return;
    const vol = parseFloat(e.target.value);
    manager.setVolume(vol);
    syncAudioConsole();
  };

  const handleToggleAudioProcedural = () => {
    const manager = audioManagerRef.current;
    if (!manager) return;
    manager.setUseProcedural(!manager.useProcedural);
    if (audioPlaying) {
      manager.stop();
      manager.start(gameState);
    }
    syncAudioConsole();
  };

  const logLine = (line) => setAiLog(prev => `${prev}${line}\n`);

  const handleUndo = () => {
    if (undoStack.length === 0) return;
    const previous = undoStack[undoStack.length - 1];
    setUndoStack(prev => prev.slice(0, -1));
    
    // Apply penalty: spend political capital (-10 treasury) or add timeline divergence (+0.05 index)
    const penalisedState = {
      ...previous.state,
      divergenceIndex: Math.min(1.0, previous.state.divergenceIndex + 0.05),
      metrics: {
        ...previous.state.metrics,
        treasury: Math.max(0, previous.state.metrics.treasury - 10)
      },
      statusMessage: `Chronology rewound! The timeline shifts (+5% Divergence), and repairs cost -10 Treasury.`
    };
    
    setGameState(penalisedState);
    setActiveScenario(previous.activeScenario);
    setSelectedChoiceId(null);
    setSentimentResult(null);
    setLetterDraft('');
    
    // Sync music back
    setTimeout(() => {
      updateContextualMusic(penalisedState);
    }, 100);
  };

  const handleResolveCabinetCrisis = (factionKey) => {
    if (gameState.metrics.treasury < 25) return;

    setGameState(prev => {
      const updatedShards = { ...prev.shards };
      if (updatedShards[factionKey]) {
        updatedShards[factionKey] = {
          ...updatedShards[factionKey],
          alignment: 50
        };
      }

      return {
        ...prev,
        metrics: {
          ...prev.metrics,
          treasury: Math.max(0, prev.metrics.treasury - 25)
        },
        divergenceIndex: Math.min(1.0, prev.divergenceIndex + 0.10),
        shards: updatedShards,
        statusMessage: `Council Compromise! Placed cabinet faction ${factionKey.toUpperCase()} at 50% alignment. Spent -25 Treasury and triggered +10% Divergence.`
      };
    });
  };



  useEffect(() => {
    setNeedsConfirmation(false);
  }, [selectedChoiceId]);

  useEffect(() => {

    const result = saveCampaignSnapshot(createCampaignSnapshot(gameState, activeScenario, { aiPortalEngaged, selectedModel }));
    if (result.ok) {
      setArchiveMessage(`Auto-saved turn ${gameState.currentTurn} · seed ${gameState.seed}.`);
    } else {
      setArchiveMessage(`Auto-save unavailable: ${result.error}.`);
    }
  }, [gameState, activeScenario, aiPortalEngaged, selectedModel]);

  useEffect(() => {
    if (skipNextScenarioEffect.current) {
      skipNextScenarioEffect.current = false;
      return;
    }

    // Precedence:
    //   1. Authored nextScenarioId (explicit branch or crisis route)
    //   2. Authored scenario for the current turn (the curated spine)
    //   3. Procedural generation, only when no authored turn matches AND the
    //      player has opted into "free play" beyond the spine. This restores
    //      the authored Civil War campaign even when the AI portal is engaged,
    //      and reserves the local model for genuine extension of the graph.
    const authoredForTurn = STATIC_SCENARIOS.find((scenario) => scenario.turn === gameState.currentTurn);
    if (gameState.nextScenarioId) {
      loadScenarioForTurn(gameState.currentTurn, gameState);
    } else if (authoredForTurn) {
      loadScenarioForTurn(gameState.currentTurn, gameState);
    } else if (aiPortalEngaged && aiFreePlayMode && gameState.currentTurn > 1) {
      handleProceduralGenerate();
    } else {
      loadScenarioForTurn(gameState.currentTurn, gameState);
    }
  }, [gameState.currentTurn, gameState.nextScenarioId]);

  const loadScenarioForTurn = (turnNum, state) => {
    const sc = getScenarioForState({ ...state, currentTurn: turnNum }, STATIC_SCENARIOS);
    if (sc) {
      setActiveScenario(sc);
      setGameState(prev => ({
        ...prev,
        scenarioId: sc.id,
        nextScenarioId: null,
        actor: sc.actor,
        roleLabel: sc.roleLabel,
        statusMessage: turnNum === 1 
          ? "Secession crisis resolved into flashpoint. Fort Sumter isolated in Charleston Harbor."
          : prev.statusMessage
      }));
    }
    setLetterDraft('');
    setSentimentResult(null);
    setSelectedChoiceId(null);
  };

  // Applies a sentiment result's resource mods to the state vector.
  const applySentimentMods = (result) => {
    if (!result || (!result.moraleMod && !result.strengthMod)) return;
    setGameState(prev => ({
      ...prev,
      metrics: {
        ...prev.metrics,
        publicMorale: Math.max(0, Math.min(100, prev.metrics.publicMorale + (result.moraleMod || 0))),
        militaryStrength: Math.max(0, Math.min(100, prev.metrics.militaryStrength + (result.strengthMod || 0)))
      }
    }));
  };

  // Sentiment analyzer — real local-model classification when connected, honest keyword fallback otherwise.
  const handleAnalyzeLetter = async () => {
    if (!letterDraft.trim()) return;

    if (aiPortalEngaged && selectedModel) {
      setIsLoadingModel(true);
      setAiStatus(`Classifying letter via ${selectedModel}…`);
      logLine(`[ollama] Sentiment classify → ${selectedModel}`);

      const aiResult = await classifyLetterSentiment(letterDraft, selectedModel);
      setIsLoadingModel(false);

      if (aiResult && !aiResult.error) {
        setSentimentResult(aiResult);
        applySentimentMods(aiResult);
        setAiStatus('Letter classified by local model.');
        logLine(`[ollama] Tone: ${aiResult.tone} · Ideology: ${aiResult.ideology} · Morale ${aiResult.moraleMod >= 0 ? '+' : ''}${aiResult.moraleMod}`);
        return;
      }

      // Honest fallback: say it was keywords, not the model.
      const offline = parseLetterSentimentOffline(letterDraft);
      setSentimentResult(offline ? { ...offline, source: 'fallback:keywords' } : offline);
      applySentimentMods(offline);
      setAiStatus('Model unavailable — used offline keyword analysis.');
      logLine(`[fallback] Model classify failed (${aiResult?.error || 'no response'}); used keyword heuristic.`);
      return;
    }

    // Basic mode: offline keyword heuristic.
    const result = parseLetterSentimentOffline(letterDraft);
    setSentimentResult(result);
    applySentimentMods(result);
  };

  // Submit decision
  const handleExecuteChoice = () => {
    if (!selectedChoiceId) return;
    
    if (confirmExecution && !needsConfirmation) {
      setNeedsConfirmation(true);
      return;
    }

    setNeedsConfirmation(false);
    
    // Save current state on the undo stack before executing!
    setUndoStack(prev => [...prev, { state: gameState, activeScenario }]);

    // Calculate Tactical Planning Bonus from positive letter sentiments
    let successModifier = 0;
    let statusNote = "";
    if (sentimentResult && !sentimentResult.skipped) {
      if (sentimentResult.tone === 'Heartfelt' || sentimentResult.tone === 'Resolute') {
        successModifier = 0.10; // +10% Tactical Planning Bonus!
        statusNote = " (Field correspondence provided a +10% Tactical Planning success modifier on this turn's actions!)";
      } else if (sentimentResult.tone === 'Standard Brief') {
        successModifier = 0.05; // +5% standard letter bonus
        statusNote = " (Field correspondence provided a +5% Tactical Planning success modifier on this turn's actions!)";
      }
      // Melancholic tone: no bonus (morale already docked on submission)
    }

    const result = advanceCampaignTurn(gameState, activeScenario, selectedChoiceId, STATIC_SCENARIOS, successModifier);
    const finalState = {
      ...result.state,
      statusMessage: result.state.statusMessage + statusNote
    };
    setGameState(finalState);
    if (result.nextScenario && result.nextScenario.id !== activeScenario.id) {
      setActiveScenario(result.nextScenario);
      setLetterDraft('');
      setSentimentResult(null);
      setSelectedChoiceId(null);
      setNeedsConfirmation(false);
    }

    // Emit campaign director routing trace to the AI log for transparency
    if (result.directorRoute && result.directorRoute !== 'linear') {
      logLine(`[director] Turn ${gameState.currentTurn} → next: ${result.nextScenario?.id || 'end'} via ${result.directorRoute}`);
    }

    // Sync contextual music
    setTimeout(() => {
      updateContextualMusic(result.state);
    }, 100);
  };



  // Export Alternate Chronicles Timeline directly into Obsidian-friendly format
  const exportChroniclesToObsidian = () => {
    if (gameState.history.length === 0) return;
    const chronicle = buildCampaignChronicle(gameState, {
      mediaEmbedFormat: 'obsidian',
      includeMediaEmbeds: true,
      scenarios: STATIC_SCENARIOS,
      consultedPrimerIds: Array.from(consultedPrimerIds),
    });

    const blob = new Blob([chronicle.markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = chronicle.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    setExportSuccessMessage(`Chronicles successfully exported! Look for ${chronicle.filename} in your Downloads folder.`);
    setTimeout(() => setExportSuccessMessage(''), 8000);
  };

  // Toggle AI Portal — real local Ollama discovery (no fabricated logs).
  const toggleAiPortal = async () => {
    if (aiPortalEngaged) {
      setAiPortalEngaged(false);
      setAiStatus('Idle. Scripted campaign active.');
      return;
    }

    setAiPortalEngaged(true);
    setIsLoadingModel(true);
    setAiStatus('Querying local Ollama at localhost:11434…');
    logLine(`[ollama] GET /api/tags — discovering installed models…`);

    const { ok, models, error } = await listOllamaModels();
    setIsLoadingModel(false);

    if (ok && models.length > 0) {
      const mapped = models
        .map((name) => {
          const profile = resolveModelProfile(name);
          return {
            name,
            profile,
            knownGood: profile.knownGoodForTitans,
          };
        })
        .sort((a, b) => compareModelProfiles(a.profile, b.profile));

      setAvailableModels(mapped);
      setSelectedModel(mapped[0]?.name || '');
      setAiStatus(`Connected · ${mapped.length} model${mapped.length > 1 ? 's' : ''} available · using ${mapped[0]?.name}`);
      logLine(`[ollama] Discovered: ${models.join(', ')}`);
      logLine(`[ollama] Active model → ${mapped[0]?.name}. Procedural generation live.`);
    } else {
      setAvailableModels([]);
      setSelectedModel('');
      setAiStatus('Ollama not reachable — running scripted scenarios offline.');
      logLine(`[ollama] No local models reachable (${error || 'none installed'}).`);
      logLine(`[hint] Start Ollama and install ${RECOMMENDED_LOCAL_MODEL.displayName} when its Ollama tag publishes (a few days behind the upstream release). Until then, Qwen, Llama, Mistral, or Phi all work as fallbacks.`);
    }
  };

  const applyCampaignArchive = (snapshot, message) => {
    const compatibility = getCampaignSnapshotCompatibility(snapshot);
    if (!compatibility.ok) {
      setArchiveMessage(`Campaign archive rejected: ${compatibility.reason}`);
      return false;
    }

    const restored = restoreCampaignFromSnapshot(snapshot, STATIC_SCENARIOS);
    if (!restored) {
      setArchiveMessage('Campaign archive rejected: the campaign state is incomplete or invalid.');
      return false;
    }

    skipNextScenarioEffect.current = true;
    setGameState(restored.state);
    setActiveScenario(restored.activeScenario);
    setLetterDraft('');
    setSentimentResult(null);
    setSelectedChoiceId(null);
    setArchiveMessage(
      restored.migratedFromVersion
        ? `${message} Migrated save version ${restored.migratedFromVersion} to version 2.`
        : message
    );
    return true;
  };

  const handleExportCampaignSave = () => {
    const snapshot = createCampaignSnapshot(gameState, activeScenario, { aiPortalEngaged, selectedModel });
    const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const filename = `Titans_of_War_Save_Seed_${gameState.seed}_Turn_${gameState.currentTurn}.json`;
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setArchiveMessage(`Exported campaign save: ${filename}.`);
  };

  const handleExportCampaignBundle = () => {
    const bundle = buildCampaignBundle(gameState, activeScenario, { aiPortalEngaged, selectedModel, scenarios: STATIC_SCENARIOS });
    const blob = new Blob([JSON.stringify(bundle.payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = bundle.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setArchiveMessage(`Exported campaign bundle: ${bundle.filename}. Includes campaign.json, chronicle.md, and media-manifest.json.`);
  };

  const handleDownloadShareCard = () => {
    const shareText = buildCampaignShareText(gameState, campaignScore);
    const blob = new Blob([shareText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const filename = `Titans_of_War_Share_Seed_${gameState.seed}_Turn_${gameState.currentTurn}.txt`;
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setExportSuccessMessage(`Share card exported: ${filename}.`);
    setArchiveMessage(`Share card exported: ${filename}.`);
    setTimeout(() => setExportSuccessMessage(''), 8000);
  };

  const handleCopyShareCard = async () => {
    const shareText = buildCampaignShareText(gameState, campaignScore);
    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error('Clipboard API unavailable');
      }
      await navigator.clipboard.writeText(shareText);
      setExportSuccessMessage('Share card copied to clipboard.');
      setArchiveMessage('Share card copied to clipboard.');
    } catch (err) {
      setExportSuccessMessage(`Clipboard unavailable. Use DOWNLOAD SHARE CARD instead. ${err.message}`);
      setArchiveMessage('Clipboard unavailable. Download the share card instead.');
    }
    setTimeout(() => setExportSuccessMessage(''), 8000);
  };

  const handleImportCampaignSave = (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const snapshot = JSON.parse(reader.result);
        applyCampaignArchive(snapshot, `Imported campaign save from ${file.name}.`);
      } catch (err) {
        setArchiveMessage(`Import failed: ${err.message}.`);
      }
    };
    reader.onerror = () => setArchiveMessage('Import failed: browser could not read the file.');
    reader.readAsText(file);
  };

  const handleLoadAutoSave = () => {
    const loaded = loadCampaignSnapshotResult();
    if (loaded.error) {
      setArchiveMessage(loaded.error);
      return;
    }
    if (!loaded.snapshot) {
      setArchiveMessage('No auto-save found in this browser.');
      return;
    }
    applyCampaignArchive(loaded.snapshot, 'Loaded latest browser auto-save.');
  };

  const handleLoadDemoRoute = () => {
    const scenario = STATIC_SCENARIOS.find((entry) => entry.id === 'cedar_creek') || STATIC_SCENARIOS.find((entry) => entry.turn === 23);
    if (!scenario) {
      setArchiveMessage('Demo route unavailable: Cedar Creek scenario is missing.');
      return;
    }

    const demoState = {
      ...createFreshCampaignState(1864, scenario.id),
      currentTurn: scenario.turn,
      actor: scenario.actor,
      roleLabel: scenario.roleLabel,
      scenarioId: scenario.id,
      nextScenarioId: null,
      divergenceIndex: 0.74,
      alternateTimeline: true,
      metrics: {
        militaryStrength: 62,
        munitions: 48,
        treasury: 52,
        foodSupply: 66,
        publicMorale: 74
      },
      shards: {
        hotspur: { name: 'Radical Attackers', alignment: 64, influence: 35 },
        fox: { name: 'Tactical Pragmatists', alignment: 78, influence: 40 },
        wolf: { name: 'Diplomatic Strategists', alignment: 74, influence: 25 }
      },
      history: buildDemoHistory(STATIC_SCENARIOS),
      gameOver: false,
      statusMessage: 'Headline demo loaded at Cedar Creek. Win the Valley decision, then resolve the McClellan settlement.'
    };

    skipNextScenarioEffect.current = true;
    setGameState(demoState);
    setActiveScenario(scenario);
    setLetterDraft('');
    setSentimentResult(null);
    setSelectedChoiceId(null);
    setUndoStack([]);
    setArchiveMessage('Loaded headline demo: Cedar Creek to the McClellan settlement.');
  };

  const handleProceduralGenerate = async () => {
    setAiStatus(selectedModel ? `${selectedModel} is drafting the next crisis…` : 'Generating next turn…');
    setIsLoadingModel(true);
    logLine(`[ollama] Sending State Vector${sentimentResult ? ' + letter sentiment' : ''} → ${selectedModel || 'fallback'}`);

    try {
      const next = await generateNextScenario(
        gameState,
        sentimentResult, // passes tone + ideology so it colors the next prompt
        selectedModel || undefined,
        activeScenario, // surfaces primerTags as sourced ground-truth context
      );

      // Map generator output into the UI shape (title + description + advisors + choices)
      const mapped = {
        ...next,
        description: next.narrative || next.description,
      };

      setActiveScenario(mapped);
      setGameState(prev => ({
        ...prev,
        scenarioId: mapped.id || prev.scenarioId,
        nextScenarioId: null,
        actor: mapped.actor || prev.actor,
        roleLabel: mapped.roleLabel || prev.roleLabel
      }));

      if (next.live) {
        const t = next.telemetry || {};
        setAiStatus(`Live turn generated by ${t.model}`);
        logLine(`[ollama] "${next.title}" · ${t.latencyMs}ms${t.outputTokens ? ` · ${t.outputTokens} tok` : ''}${t.tokensPerSec ? ` · ${t.tokensPerSec} tok/s` : ''}`);
      } else {
        setAiStatus('Ollama unavailable — used scripted scenario for this turn.');
        logLine(`[fallback] Scripted scenario (${next.telemetry?.reason || 'no model'}).`);
      }

      setLetterDraft('');
      setSentimentResult(null);
      setSelectedChoiceId(null);
    } catch (e) {
      setAiStatus('Generator error — see log.');
      logLine(`[error] ${e.message}`);
    } finally {
      setIsLoadingModel(false);
    }
  };

  const handleReset = () => {
    const fresh = createFreshCampaignState(undefined, STATIC_SCENARIOS[0]?.id || null);
    skipNextScenarioEffect.current = true;
    setGameState(fresh);
    setActiveScenario(STATIC_SCENARIOS[0]);
    setLetterDraft('');
    setSentimentResult(null);
    setSelectedChoiceId(null);
    setArchiveMessage(`New campaign initialized · seed ${fresh.seed}.`);
  };

  const campaignScore = gameState.gameOver ? calculateCampaignScore(gameState) : null;
  const endingMedia = gameState.gameOver ? resolveCampaignEndingMedia(gameState) : null;
  const divergenceState = divergenceTier(gameState.divergenceIndex);
  const campaignPhase = getCampaignPhase(gameState.currentTurn);
  const resolvedTurnCount = gameState.history.length;
  const campaignProgressPercent = Math.max(0, Math.min(100, Math.round((resolvedTurnCount / CAMPAIGN_FINAL_TURN) * 100)));
  const nextMilestone = gameState.gameOver
    ? null
    : gameState.nextScenarioId
      ? STATIC_SCENARIOS.find((scenario) => scenario.id === gameState.nextScenarioId) || null
      : STATIC_SCENARIOS
        .filter((scenario) => scenario.turn > gameState.currentTurn)
        .sort((left, right) => left.turn - right.turn)[0] || null;
  const gradeColor = (g) => (g === 'A' || g === 'B' ? 'var(--accent-green)' : g === 'C' || g === 'D' ? 'var(--accent-gold)' : 'var(--accent-red)');
  const getProjectedMetric = (key) => {
    if (!hoveredChoiceId) return null;
    const choice = activeScenario?.choices?.find(c => c.id === hoveredChoiceId);
    if (!choice) return null;
    const effects = choice.successEffects || choice.effects;
    if (!effects || !effects.metrics || effects.metrics[key] === undefined) return null;
    return Math.max(0, Math.min(100, gameState.metrics[key] + effects.metrics[key]));
  };
  const selectedModelProfile = selectedModel
    ? availableModels.find((model) => model.name === selectedModel)?.profile || resolveModelProfile(selectedModel)
    : null;
  const audioSourceLabel = audioHasFileLibrary
    ? (audioUseProcedural ? 'Synthesized fallback' : 'Historical recordings')
    : 'Synthesized fallback';
  const audioModeHelp = audioHasFileLibrary
    ? (audioUseProcedural
      ? `Using synthesized fallback. ${audioFileTrackCount} verified recording${audioFileTrackCount === 1 ? '' : 's'} available.`
      : `Using verified archive recordings first. ${audioFileTrackCount} recording${audioFileTrackCount === 1 ? '' : 's'} available.`)
    : 'No verified archive recordings detected locally. Synthesized fallback is active.';
  const choiceAvailabilityById = Object.fromEntries(
    (activeScenario?.choices || []).map((choice) => {
      return [choice.id, getChoiceAvailability(choice, activeScenario, gameState)];
    })
  );
  const advisorDebate = activeScenario
    ? generateAdvisorDebate(gameState, activeScenario, aiPortalEngaged ? selectedModel : null)
    : null;
  const duckLabelByKey = {
    stingerBarrage: 'Battle barrage',
    hotspurFlourish: 'Hotspur flourish',
    cabinetDebate: 'Cabinet debate',
    letterWriting: 'Letter writing',
  };

  useEffect(() => {
    const manager = audioManagerRef.current;
    if (!manager || !audioPlaying || !activeScenario?.id) return;
    manager.duckForCabinetDebate?.();
  }, [audioPlaying, activeScenario?.id]);

  useEffect(() => {
    const manager = audioManagerRef.current;
    if (!manager) return;

    if (audioPlaying && isLetterWriting && !sentimentResult) {
      manager.engageLetterWritingDuck?.();
    } else {
      manager.releaseLetterWritingDuck?.();
    }
  }, [audioPlaying, isLetterWriting, sentimentResult]);

  useEffect(() => {
    setIsLetterWriting(false);
    audioManagerRef.current?.releaseLetterWritingDuck?.();
  }, [activeScenario?.id]);

  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      // Ignore key binds if user is actively writing a letter or typing in a field
      if (document.activeElement.tagName === 'TEXTAREA' || document.activeElement.tagName === 'INPUT') {
        return;
      }

      const activeChoices = activeScenario?.choices || [];
      const choiceA = activeChoices[0];
      const choiceB = activeChoices[1];
      const choiceC = activeChoices[2];
      const choiceD = activeChoices[3];

      if (e.key === '1' && choiceA && !choiceAvailabilityById[choiceA.id]?.locked) {
        setSelectedChoiceId(choiceA.id);
      } else if (e.key === '2' && choiceB && !choiceAvailabilityById[choiceB.id]?.locked) {
        setSelectedChoiceId(choiceB.id);
      } else if (e.key === '3' && choiceC && !choiceAvailabilityById[choiceC.id]?.locked) {
        setSelectedChoiceId(choiceC.id);
      } else if (e.key === '4' && choiceD && !choiceAvailabilityById[choiceD.id]?.locked) {
        setSelectedChoiceId(choiceD.id);
      } else if (e.key === ' ' && selectedChoiceId) {
        e.preventDefault(); // Stop page scrolling
        handleExecuteChoice();
      } else if (e.key.toLowerCase() === 'l') {
        const textarea = document.getElementById('letter-textarea');
        if (textarea) {
          e.preventDefault();
          textarea.focus();
        }
      } else if (e.key.toLowerCase() === 'm') {
        e.preventDefault();
        handleToggleAudioMute();
      } else if (e.key.toLowerCase() === 'n') {
        e.preventDefault();
        handleSkipTrack();
      } else if (e.key.toLowerCase() === 'u') {
        e.preventDefault();
        handleUndo();
      } else if (e.key.toLowerCase() === 'p') {
        e.preventDefault();
        handleToggleAudioPlay();
      } else if (e.key === 'Escape') {
        // Close any open overlay (hotkeys help, etc.)
        setShowHotkeysHelp(false);
      }
    };


    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [activeScenario, choiceAvailabilityById, selectedChoiceId, gameState, audioPlaying]);

  return (
    <div className={`app-container ${gameState.divergenceIndex >= 0.6 ? 'severed-timeline' : ''}`}>
      {/* Opt-in historical primer side panel — rendered at the root so it
          overlays the entire game shell when the player opens it. */}
      <HistoricalPrimerPanel
        scenario={activeScenario}
        open={primerPanelOpen}
        onClose={() => setPrimerPanelOpen(false)}
        onPrimerConsulted={(primerId) => {
          setConsultedPrimerIds((previous) => {
            if (previous.has(primerId)) return previous;
            const next = new Set(previous);
            next.add(primerId);
            return next;
          });
        }}
      />
      {/* Header bar */}
      <header className="game-header">
        <div className="brand-section">
          <h1>Titans of <span>War</span></h1>
          <p>// ALTERNATE-HISTORY STRATEGY ENGINE v0.3.1</p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button 
            onClick={toggleAiPortal}
            className={`tactical-button active-ai ${aiPortalEngaged ? 'engaged' : ''}`}
            style={{ fontSize: '0.75rem' }}
          >
            {aiPortalEngaged ? <span className="ai-status-pulse"></span> : '📡 '}
            {aiPortalEngaged ? 'PROCEDURAL MODE (local)' : 'ENGAGE LOCAL AI'}
          </button>
          
          {undoStack.length > 0 && (
            <button 
              onClick={handleUndo}
              className="tactical-button"
              style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '0.5rem 0.75rem', fontSize: '0.75rem', color: 'var(--accent-gold)', borderColor: 'var(--accent-gold)' }}
              title="Chrono-Rewind (Undo one turn) [U]"
            >
              ⏳ UNDO [U]
            </button>
          )}
          
          <button 
            onClick={() => setShowHotkeysHelp(prev => !prev)}
            className="tactical-button"
            style={{ display: 'flex', alignItems: 'center', gap: '3px', padding: '0.5rem 0.65rem', fontSize: '0.75rem', color: showHotkeysHelp ? 'var(--accent-gold)' : 'var(--text-secondary)' }}
            title="Tactical Keyboard Commands"
          >
            <span>⌨️ KEYS</span>
          </button>

          <button
            onClick={() => {
              setTutorialStep(0);
              setShowTutorial(true);
            }}
            className="tactical-button"
            style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '0.5rem 0.65rem', fontSize: '0.75rem', color: showTutorial ? 'var(--accent-gold)' : 'var(--text-secondary)' }}
            title="Open the guided walkthrough"
          >
            <HelpCircle size={14} />
            <span>WALKTHROUGH</span>
          </button>

          <button 
            onClick={handleReset}
            className="tactical-button"
            style={{ display: 'flex', alignItems: 'center', padding: '0.5rem' }}
            title="Reboot Campaign"
          >
            <RotateCcw size={14} />
          </button>


        </div>
      </header>

      {/* Main layout */}
      <main className="game-layout">
        
        {/* Left Column: Politics & Divergence */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Faction/Advisor Shards */}
          <div className="tactical-card">
            <div className="card-title">
              🤝 Senate Shards (Political Advisors)
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {Object.keys(gameState.shards).map(key => {
                const shard = gameState.shards[key];
                return (
                  <div 
                    key={key} 
                    style={{ 
                      background: 'rgba(0,0,0,0.2)', 
                      padding: '0.65rem 0.8rem', 
                      borderRadius: '4px',
                      borderLeft: `2px solid ${key === 'hotspur' ? 'var(--accent-red)' : (key === 'fox' ? 'var(--accent-gold)' : 'var(--accent-blue)')}`
                    }}
                  >
                    <div style={{ display: 'flex', justifyItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '0.15rem' }}>
                      <span>{shard.name}</span>
                      <span style={{ color: shard.alignment < 40 ? 'var(--accent-red)' : 'var(--accent-green)' }}>{shard.alignment}%</span>
                    </div>
                    <div style={{ display: 'flex', justifyItems: 'center', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                      <span>Influence Weight</span>
                      <span>{shard.influence}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Divergence Index */}
          <div className="tactical-card" style={{ background: 'rgba(212, 175, 55, 0.02)' }}>
            <div className="card-title">
              🧭 Divergence Matrix
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', textAlign: 'center' }}>
              <div style={{ position: 'relative', width: '100px', height: '100px', borderRadius: '50%', border: '2px dashed var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Compass size={40} style={{ color: 'var(--accent-gold)', transform: `rotate(${gameState.divergenceIndex * 360}deg)`, transition: 'transform 1s ease' }} />
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--accent-gold)', marginTop: '0.5rem' }}>
                {(gameState.divergenceIndex * 100).toFixed(0)}% Divergence
              </div>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', lineHeight: '1.3', margin: 0 }}>
                <strong style={{ color: 'var(--accent-gold)' }}>{divergenceState.label}.</strong> {divergenceState.note}
              </p>

              {/* Timeline Branching SVG Tree */}
              <div style={{ width: '100%', height: '80px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(212,175,55,0.08)', borderRadius: '4px', marginTop: '0.4rem', padding: '0.4rem', position: 'relative', overflow: 'hidden' }}>
                <svg width="100%" height="100%" viewBox="0 0 200 60" preserveAspectRatio="none">
                  {/* Grid background markers */}
                  <line x1="0" y1="30" x2="200" y2="30" stroke="rgba(255,255,255,0.02)" strokeWidth="1" />
                  
                  {/* Orthodox Timeline (straight green dashed line) */}
                  <line 
                    x1="10" 
                    y1="30" 
                    x2="190" 
                    y2="30" 
                    stroke="rgba(16, 185, 129, 0.25)" 
                    strokeWidth="1.5" 
                    strokeDasharray="4,4" 
                  />
                  <text x="12" y="24" fill="rgba(16, 185, 129, 0.4)" fontSize="6" fontFamily="var(--font-mono)">ORTHODOX PATH</text>
                  
                  {/* Divergent Timeline (curving teal/gold line) */}
                  {(() => {
                    const startX = 10;
                    const startY = 30;
                    const endX = 190;
                    const deviation = (gameState.divergenceIndex || 0) * 22;
                    const endY = 30 - deviation;
                    const cp1X = 70;
                    const cp1Y = 30;
                    const cp2X = 130;
                    const cp2Y = 30 - deviation * 0.75;
                    
                    return (
                      <>
                        <path 
                          d={`M ${startX} ${startY} C ${cp1X} ${cp1Y}, ${cp2X} ${cp2Y}, ${endX} ${endY}`} 
                          fill="none" 
                          stroke={gameState.divergenceIndex > 0.45 ? 'var(--accent-red)' : 'var(--accent-gold)'} 
                          strokeWidth="2" 
                          style={{ filter: 'drop-shadow(0 0 3px rgba(212, 175, 55, 0.45))' }}
                        />
                        
                        {/* Current Timeline head pointer */}
                        <circle cx={endX} cy={endY} r="3" fill="#ffffff" stroke="var(--accent-gold)" strokeWidth="1.5" />
                        
                        {/* Turn history nodes */}
                        {(gameState.history || []).map((entry, index) => {
                          const t = (index + 1) / Math.max(1, gameState.currentTurn);
                          const nodeX = startX + (endX - startX) * t;
                          const nodeDeviation = (entry.divergenceIndex || 0) * 22;
                          const nodeY = 30 - nodeDeviation;
                          
                          return (
                            <circle 
                              key={index} 
                              cx={nodeX} 
                              cy={nodeY} 
                              r="2" 
                              fill={entry.choiceSucceeded ? 'var(--accent-green)' : 'rgba(212, 175, 55, 0.85)'} 
                              title={`Turn ${entry.turn}: ${entry.scenarioTitle}`}
                            />
                          );
                        })}
                      </>
                    );
                  })()}
                </svg>
                <div style={{ position: 'absolute', bottom: '2px', right: '6px', fontSize: '5.5px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Chronology Divergence Tree
                </div>
              </div>
            </div>
          </div>

          {/* Soundscape Console */}
          <div className="tactical-card" id="soundscape-console" style={{ marginTop: '0.5rem', background: 'rgba(212, 175, 55, 0.01)' }}>
            <div className="card-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>🎶 Soundscape Console</span>
              <span style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.6rem',
                background: audioPlaying ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                color: audioPlaying ? 'var(--accent-green)' : 'var(--accent-red)',
                padding: '1px 6px',
                borderRadius: '3px',
                border: `1px solid ${audioPlaying ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
              }}>
                {audioPlaying ? 'ACTIVE' : 'OFFLINE'}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {/* Current track display */}
              <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.5rem 0.65rem', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.03)' }}>
                <div style={{ fontSize: '0.6rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Current Recording
                </div>
                <div style={{ fontSize: '0.75rem', fontFamily: 'var(--font-display)', color: audioPlaying ? 'var(--accent-gold)' : 'var(--text-secondary)', fontWeight: 'bold', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {audioPlaying ? audioTrackLabel : 'Soundscape offline — press Play to begin.'}
                </div>
                <div style={{ fontSize: '0.56rem', color: 'rgba(212,175,55,0.58)', marginTop: '3px', fontFamily: 'var(--font-mono)' }}>
                  source: {audioSourceLabel}
                </div>
                {audioPlaying && audioTrackSource && (
                  <div style={{ fontSize: '0.56rem', color: 'rgba(156,163,175,0.65)', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {audioTrackSource}{audioTrackLicense ? ` · ${audioTrackLicense}` : ''}
                  </div>
                )}
                {audioPlaying && audioActiveDuckKeys.length > 0 && (
                  <div style={{ fontSize: '0.54rem', color: 'rgba(212,175,55,0.5)', marginTop: '3px', fontFamily: 'var(--font-mono)' }}>
                    ducking: {audioActiveDuckKeys.map((key) => duckLabelByKey[key] || key).join(' · ')}
                  </div>
                )}
              </div>

              {/* Transport controls */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <button
                  onClick={handleToggleAudioPlay}
                  className="tactical-button"
                  style={{ flex: 2, padding: '3px 6px', fontSize: '0.65rem', fontFamily: 'var(--font-mono)', background: audioPlaying ? 'rgba(239, 68, 68, 0.08)' : 'rgba(212, 175, 55, 0.08)', borderColor: audioPlaying ? 'var(--accent-red)' : 'var(--accent-gold)', color: audioPlaying ? 'var(--accent-red)' : 'var(--accent-gold)' }}
                >
                  {audioPlaying ? '⏸️ PAUSE' : '▶️ PLAY'}
                </button>
                <button
                  onClick={handleToggleAudioMute}
                  className="tactical-button"
                  style={{ flex: 1.2, padding: '3px 6px', fontSize: '0.65rem', fontFamily: 'var(--font-mono)', background: audioMuted ? 'rgba(239, 68, 68, 0.1)' : 'rgba(0,0,0,0.3)', borderColor: audioMuted ? 'var(--accent-red)' : 'rgba(212,175,55,0.2)', color: audioMuted ? 'var(--accent-red)' : '#ffffff' }}
                >
                  {audioMuted ? '🔊 ON' : '🔇 MUTE'}
                </button>
                <button
                  onClick={handleSkipTrack}
                  disabled={!audioPlaying}
                  className="tactical-button"
                  style={{ flex: 1.2, padding: '3px 6px', fontSize: '0.65rem', fontFamily: 'var(--font-mono)', opacity: audioPlaying ? 1 : 0.5, cursor: audioPlaying ? 'pointer' : 'not-allowed' }}
                >
                  ⏭️ NEXT
                </button>
              </div>

              {/* Volume slider */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                  <span>VOLUME</span>
                  <span>{Math.round(audioVolume * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={audioVolume}
                  onChange={handleAudioVolumeChange}
                  style={{ width: '100%', accentColor: 'var(--accent-gold)', height: '4px', borderRadius: '2px', outline: 'none', cursor: 'pointer', background: 'rgba(255,255,255,0.1)' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.45rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                  <span style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', fontSize: '0.62rem' }}>
                    {audioSourceLabel}
                  </span>
                  {audioHasFileLibrary && (
                    <button
                      onClick={handleToggleAudioProcedural}
                      className="tactical-button"
                      style={{
                        padding: '0.2rem 0.55rem',
                        fontSize: '0.58rem',
                        fontFamily: 'var(--font-mono)',
                        color: audioUseProcedural ? 'var(--accent-red)' : 'var(--accent-gold)',
                        borderColor: audioUseProcedural ? 'rgba(239,68,68,0.35)' : 'rgba(212,175,55,0.35)',
                        background: audioUseProcedural ? 'rgba(239,68,68,0.08)' : 'rgba(212,175,55,0.08)',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {audioUseProcedural ? 'USE RECORDINGS' : 'USE SYNTH FALLBACK'}
                    </button>
                  )}
                </div>
                <div style={{ fontSize: '0.58rem', color: 'rgba(156,163,175,0.75)', lineHeight: '1.35' }}>
                  {audioModeHelp}
                </div>
              </div>

              <div style={{ fontSize: '0.56rem', color: 'rgba(212, 175, 55, 0.4)', textAlign: 'center', fontStyle: 'italic' }}>
                ⌨️ [P] Play/Pause · [M] Mute · [N] Next track
              </div>
            </div>
          </div>

        </section>


        {/* Center Column: Scenarios, Letter & Action Console */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {gameState.gameOver ? (
            <div className="tactical-card campaign-report-card" style={{ textAlign: 'center', padding: '3rem 2rem', borderColor: 'var(--accent-gold)', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ color: 'var(--accent-gold)', fontSize: '2.5rem' }}>⚔️</div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', textTransform: 'uppercase' }}>Campaign Report</h2>
              <p className="atmospheric-log">{gameState.statusMessage}</p>

              {endingMedia && (
                <div style={{ position: 'relative', borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(212,175,55,0.22)', background: '#090c10', height: 'clamp(280px, 42vw, 430px)' }}>
                  <img
                    src={publicAssetUrl(endingMedia.src)}
                    alt={endingMedia.title}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: endingMedia.cropMode === 'contain' ? 'contain' : 'cover',
                      objectPosition: `${endingMedia.cropFocus.x * 100}% ${endingMedia.cropFocus.y * 100}%`,
                      opacity: endingMedia.theaterOpacity,
                    }}
                  />
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(9,12,16,0.88), rgba(9,12,16,0.1) 58%, rgba(9,12,16,0))', pointerEvents: 'none' }} />
                  <div style={{ position: 'absolute', left: '0.85rem', right: '0.85rem', bottom: '0.75rem', textAlign: 'left' }}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: 'var(--accent-gold)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.2rem' }}>
                      Campaign Ending Art
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'rgba(212,175,55,0.85)', lineHeight: 1.35, fontStyle: 'italic' }}>
                      {endingMedia.caption}
                    </div>
                    <div style={{ fontSize: '0.58rem', color: 'rgba(156,163,175,0.5)', marginTop: '0.15rem' }}>
                      {endingMedia.credit}
                    </div>
                  </div>
                </div>
              )}
              
              <div className="campaign-summary-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '6px' }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>FINAL DIVERGENCE</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--accent-gold)' }}>{(gameState.divergenceIndex * 100).toFixed(0)}%</div>
                </div>
                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '6px' }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>DECISIONS ENACTED</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--accent-gold)' }}>{gameState.history.length}</div>
                </div>
              </div>

              {/* Campaign report card */}
              {campaignScore && (
                <div style={{ background: 'rgba(0,0,0,0.3)', border: `1px solid ${gradeColor(campaignScore.grade)}`, borderRadius: '8px', padding: '1.25rem', textAlign: 'left' }}>
                  <div className="campaign-grade-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
                    {Object.values(campaignScore.reportCards).map((card) => (
                      <div key={card.label} style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${gradeColor(card.grade)}`, borderRadius: '8px', padding: '0.8rem' }}>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>{card.label}</div>
                        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '0.75rem', marginTop: '0.45rem' }}>
                          <div style={{ fontSize: '1.45rem', fontWeight: 'bold', color: 'var(--accent-gold)', fontFamily: 'var(--font-mono)', lineHeight: 1 }}>{card.score}<span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}> / 100</span></div>
                          <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: gradeColor(card.grade), lineHeight: 1 }}>{card.grade}</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>Campaign Composite</div>
                      <div style={{ fontSize: '2.2rem', fontWeight: 'bold', color: 'var(--accent-gold)', fontFamily: 'var(--font-mono)', lineHeight: 1 }}>
                        {campaignScore.total}<span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}> / 1000</span>
                      </div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>GRADE</div>
                      <div style={{ fontSize: '2.4rem', fontWeight: 'bold', color: gradeColor(campaignScore.grade), lineHeight: 1 }}>{campaignScore.grade}</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', marginBottom: '0.85rem' }}>
                    {campaignScore.breakdown.map((b) => (
                      <div key={b.label}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '2px' }}>
                          <span>{b.label}</span>
                          <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>{b.points} / {b.max}</span>
                        </div>
                        <div style={{ height: '5px', background: 'rgba(255,255,255,0.07)', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ width: `${Math.round((b.points / b.max) * 100)}%`, height: '100%', background: 'var(--accent-gold)' }}></div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: '1.4', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '0.6rem' }}>
                    <strong style={{ color: gradeColor(campaignScore.grade) }}>{campaignScore.survived ? 'Campaign survived' : 'Campaign collapsed'}</strong> · Ending: <strong>{campaignScore.endingClass}</strong>. {campaignScore.endingNote}
                    <br />
                    <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted, var(--text-secondary))' }}>Timeline divergence recorded as fidelity score: {(gameState.divergenceIndex * 100).toFixed(0)}% divergence → {campaignScore.reportCards.timelineFidelity.grade}</span>
                    <br />
                    <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted, var(--text-secondary))' }}>Cabinet crises faced/resolved: {campaignScore.crisisSummary.faced} / {campaignScore.crisisSummary.resolved}</span>
                    <br />
                    <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted, var(--text-secondary))' }}>Campaign seed: {gameState.seed} · reproducible run</span>
                  </div>

                  <div style={{ marginTop: '0.85rem', background: 'rgba(212,175,55,0.04)', border: '1px solid rgba(212,175,55,0.12)', borderRadius: '6px', padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
                      <div>
                        <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-gold)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                          Titans Forge Share Card
                        </div>
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', lineHeight: '1.35', marginTop: '0.15rem' }}>
                          Export a compact result summary for X, LinkedIn, Discord, or a release thread.
                        </div>
                      </div>
                      <Share2 size={18} color="var(--accent-gold)" />
                    </div>
                    <div className="campaign-share-actions" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                      <button onClick={handleCopyShareCard} className="tactical-button" style={{ fontSize: '0.68rem', padding: '0.45rem 0.65rem' }}>
                        COPY SHARE TEXT
                      </button>
                      <button onClick={handleDownloadShareCard} className="tactical-button" style={{ fontSize: '0.68rem', padding: '0.45rem 0.65rem' }}>
                        DOWNLOAD SHARE CARD
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Campaign Chronicles Timeline scroll box */}
              {gameState.history.length > 0 && (
                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1.25rem', borderRadius: '6px', textAlign: 'left', maxHeight: '200px', overflowY: 'auto', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: '0.75rem', margin: '0.5rem 0' }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--accent-gold)', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.35rem', textTransform: 'uppercase', display: 'flex', justifyContent: 'space-between' }}>
                    <span>📜 Campaign Chronicles</span>
                    <span>Tether Branch: {(gameState.divergenceIndex * 100).toFixed(0)}%</span>
                  </div>
                  {gameState.history.map((h, idx) => (
                    <div key={idx} style={{ fontSize: '0.75rem', lineHeight: '1.4' }}>
                      <span style={{ color: 'var(--accent-gold)', fontWeight: 'bold' }}>Turn {h.turn} ({h.date}):</span> <strong>{h.scenarioTitle}</strong>
                      <div style={{ color: 'var(--text-secondary)', paddingLeft: '0.5rem', borderLeft: '1px solid rgba(255,255,255,0.05)', marginTop: '0.2rem' }}>
                        👉 <em>Command: {h.choiceText}</em> {h.choiceSucceeded !== null && h.choiceSucceeded !== undefined && (
                          <strong style={{ color: h.choiceSucceeded ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                            ({h.choiceSucceeded ? 'SUCCESS' : 'FAILED'})
                          </strong>
                        )}
                        <br />
                        📝 <em>Resolution: {h.consequence}</em>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {exportSuccessMessage && (
                <div style={{ fontSize: '0.75rem', color: 'var(--accent-green)', fontFamily: 'var(--font-mono)', background: 'rgba(16, 185, 129, 0.05)', padding: '0.5rem', borderRadius: '4px', border: '1px solid rgba(16, 185, 129, 0.15)' }}>
                  📝 {exportSuccessMessage}
                </div>
              )}

              <div className="campaign-report-actions" style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '0.5rem' }}>
                <button onClick={exportChroniclesToObsidian} className="tactical-button" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  📑 EXPORT CHRONICLES
                </button>
                <button onClick={handleExportCampaignBundle} className="tactical-button" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  💾 EXPORT BUNDLE
                </button>
                <button onClick={handleDownloadShareCard} className="tactical-button" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Share2 size={14} /> SHARE CARD
                </button>
                <button onClick={handleReset} className="tactical-button primary" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <RotateCcw size={14} /> REBOOT THE FRONT
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Cabinet Backlash Warning Banner */}
              {(gameState.shards.hotspur.alignment < 30 || gameState.shards.fox.alignment < 30 || gameState.shards.wolf.alignment < 30) && (
                <div className="tactical-card" style={{ borderColor: 'var(--accent-red)', background: 'rgba(239, 68, 68, 0.03)', padding: '0.8rem 1.2rem', display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-red)', fontWeight: 'bold', fontSize: '0.85rem', fontFamily: 'var(--font-mono)' }}>
                    <AlertTriangle size={16} /> ⚠️ CABINET CRISIS ACTIVE
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {gameState.shards.hotspur.alignment < 30 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid rgba(239, 68, 68, 0.08)', paddingBottom: '0.4rem' }}>
                        <span style={{ lineHeight: '1.4' }}>• <strong>Radical Attackers (Hotspur) Crisis:</strong> Fire-eaters are openly resisting caution. <strong>Strength declines by 4 per turn.</strong></span>
                        <button 
                          onClick={() => handleResolveCabinetCrisis('hotspur')} 
                          disabled={gameState.metrics.treasury < 25} 
                          className="tactical-button"
                          style={{ padding: '0.2rem 0.5rem', fontSize: '0.6rem', whiteSpace: 'nowrap', borderColor: gameState.metrics.treasury >= 25 ? 'var(--accent-gold)' : 'rgba(255,255,255,0.1)', color: gameState.metrics.treasury >= 25 ? 'var(--accent-gold)' : 'var(--text-secondary)' }}
                        >
                          🤝 Compromise (Cost: 25 Treasury, +10% Div)
                        </button>
                      </div>
                    )}
                    {gameState.shards.fox.alignment < 30 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid rgba(239, 68, 68, 0.08)', paddingBottom: '0.4rem' }}>
                        <span style={{ lineHeight: '1.4' }}>• <strong>Tactical Pragmatists (Fox) Crisis:</strong> Governors resist new levies. <strong>Munitions fall by 4 per turn.</strong></span>
                        <button 
                          onClick={() => handleResolveCabinetCrisis('fox')} 
                          disabled={gameState.metrics.treasury < 25} 
                          className="tactical-button"
                          style={{ padding: '0.2rem 0.5rem', fontSize: '0.6rem', whiteSpace: 'nowrap', borderColor: gameState.metrics.treasury >= 25 ? 'var(--accent-gold)' : 'rgba(255,255,255,0.1)', color: gameState.metrics.treasury >= 25 ? 'var(--accent-gold)' : 'var(--text-secondary)' }}
                        >
                          🤝 Compromise (Cost: 25 Treasury, +10% Div)
                        </button>
                      </div>
                    )}
                    {gameState.shards.wolf.alignment < 30 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem', paddingBottom: '0.2rem' }}>
                        <span style={{ lineHeight: '1.4' }}>• <strong>Diplomatic Strategists (Wolf) Crisis:</strong> Financiers withhold support. <strong>Treasury slips by 4 per turn.</strong></span>
                        <button 
                          onClick={() => handleResolveCabinetCrisis('wolf')} 
                          disabled={gameState.metrics.treasury < 25} 
                          className="tactical-button"
                          style={{ padding: '0.2rem 0.5rem', fontSize: '0.6rem', whiteSpace: 'nowrap', borderColor: gameState.metrics.treasury >= 25 ? 'var(--accent-gold)' : 'rgba(255,255,255,0.1)', color: gameState.metrics.treasury >= 25 ? 'var(--accent-gold)' : 'var(--text-secondary)' }}
                        >
                          🤝 Compromise (Cost: 25 Treasury, +10% Div)
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Scenario brief */}
              <div className="tactical-card">
                <div className="card-title" style={{ display: 'flex', justifyItems: 'center', justifyContent: 'space-between' }}>
                  <span>⚔️ Active Scenarios</span>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>{activeScenario.date}</span>
                </div>
                
                <ScenarioTheater
                  scenario={activeScenario}
                  gameState={gameState}
                  selectedChoiceId={selectedChoiceId}
                />

                {/* Opt-in historical context — surfaces sourced primers tagged on
                    this turn (naval tech, cotton diplomacy, Copperhead politics,
                    etc.) without auto-popping or competing with the decision UI. */}
                {(() => {
                  const primerIds = getPrimerIdsForScenario(activeScenario);
                  if (!primerIds.length) return null;
                  return (
                    <div style={{ display: 'flex', justifyContent: 'flex-end', margin: '0.35rem 0 0.1rem' }}>
                      <button
                        type="button"
                        onClick={() => setPrimerPanelOpen(true)}
                        title="Open source-backed historical primers for this turn."
                        style={{
                          background: 'rgba(212, 175, 55, 0.06)',
                          border: '1px solid rgba(212, 175, 55, 0.28)',
                          color: 'var(--accent-gold)',
                          padding: '0.35rem 0.7rem',
                          fontSize: '0.7rem',
                          borderRadius: '3px',
                          cursor: 'pointer',
                          fontFamily: 'var(--font-mono)',
                          letterSpacing: '0.04em',
                        }}
                      >
                        📜 Historical context ({primerIds.length})
                      </button>
                    </div>
                  );
                })()}

                {/* Cabinet debate */}
                <div style={{ background: 'rgba(0,0,0,0.15)', border: '1px solid rgba(255,255,255,0.02)', padding: '0.8rem', borderRadius: '4px', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.6rem' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--accent-gold)', fontFamily: 'var(--font-mono)', fontWeight: 'bold' }}>🗣️ CABINET DEBATE</div>
                    <div style={{ fontSize: '0.58rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                      {advisorDebate?.source === 'deterministic-fallback' ? 'Deterministic fallback' : 'Deterministic synthesis'}
                    </div>
                  </div>

                  {advisorDebate && ['hotspur', 'fox', 'wolf'].map((key) => {
                    const entry = advisorDebate[key];
                    const meta = choiceAvailabilityById[entry.choiceId] || {};
                    const accent = key === 'hotspur' ? 'var(--accent-red)' : (key === 'fox' ? 'var(--accent-gold)' : 'var(--accent-blue)');
                    const isSelected = selectedChoiceId === entry.choiceId;

                    return (
                      <button
                        key={key}
                        type="button"
                        aria-pressed={isSelected}
                        aria-label={`${entry.speaker} backs ${entry.choiceLabel}${meta.locked ? `. Locked: ${meta.lockReason}` : ''}`}
                        onClick={() => { if (!meta.locked && entry.choiceId) setSelectedChoiceId(entry.choiceId); }}
                        disabled={meta.locked || !entry.choiceId}
                        title={meta.locked ? meta.lockReason : `Back ${entry.choiceLabel}`}
                        style={{
                          textAlign: 'left',
                          background: isSelected ? 'rgba(212,175,55,0.08)' : 'rgba(255,255,255,0.02)',
                          borderTop: `1px solid ${isSelected ? 'rgba(212,175,55,0.35)' : 'rgba(255,255,255,0.04)'}`,
                          borderRight: `1px solid ${isSelected ? 'rgba(212,175,55,0.35)' : 'rgba(255,255,255,0.04)'}`,
                          borderBottom: `1px solid ${isSelected ? 'rgba(212,175,55,0.35)' : 'rgba(255,255,255,0.04)'}`,
                          borderLeft: `3px solid ${accent}`,
                          borderRadius: '4px',
                          padding: '0.65rem 0.75rem',
                          color: 'inherit',
                          cursor: meta.locked ? 'not-allowed' : 'pointer',
                          opacity: meta.locked ? 0.5 : 1,
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.35rem', alignItems: 'center' }}>
                          <strong style={{ textTransform: 'capitalize', color: accent, fontSize: '0.72rem' }}>{entry.speaker}</strong>
                          <span style={{ fontSize: '0.62rem', color: meta.locked ? 'var(--accent-red)' : 'var(--accent-gold)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}>
                            backs {entry.choiceLabel}{meta.locked ? ' · locked' : ''}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.73rem', color: 'var(--text-secondary)', lineHeight: '1.45' }}>
                          {entry.argument}
                        </div>
                      </button>
                    );
                  })}

                  {advisorDebate && (
                    <div style={{ fontSize: '0.63rem', color: 'var(--text-secondary)', lineHeight: '1.45', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.45rem' }}>
                      <div style={{ marginBottom: '0.2rem' }}>{advisorDebate.summary}</div>
                      <div>Political economy: {advisorDebate.politicalEconomy.overview}</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Sentiment Letter box */}
              <div className="tactical-card" style={{ background: 'rgba(212, 175, 55, 0.01)' }}>
                <div className="card-title">
                  <PenTool size={14} /> Letter home to {activeScenario.letterTarget}
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.75rem', lineHeight: '1.3' }}>
                  Dictate or write your personal letter. Heartfelt sentiment rallies home-front morale (+5), while a cold briefs hardens tactical focus (+5 Military).
                </p>

                <textarea
                  id="letter-textarea"
                  rows="3"
                  className="letter-textarea"
                  value={letterDraft}
                  onChange={(e) => setLetterDraft(e.target.value)}
                  onFocus={() => setIsLetterWriting(true)}
                  onBlur={() => setIsLetterWriting(false)}
                  placeholder="Pen it now (or skip)... E.g., 'My dearest Anna, the fog rises over Matthews Hill. Jackson is standing firm. Keep the faith.'"
                  disabled={!!sentimentResult}
                />

                <div style={{ display: 'flex', justifyItems: 'center', justifyContent: 'space-between', marginTop: '0.75rem', alignItems: 'center' }}>
                  {sentimentResult ? (
                    <div style={{ fontSize: '0.75rem', color: 'var(--accent-gold)', fontFamily: 'var(--font-mono)' }}>
                      📝 {sentimentResult.description}
                    </div>
                  ) : (
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Awaiting dictation...</div>
                  )}

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button 
                      onClick={() => setSentimentResult({ skipped: true, description: 'Letter skipped. Strategic assessment bypassed this turn.' })} 
                      disabled={!!sentimentResult} 
                      className="tactical-button" 
                      style={{ padding: '0.35rem 0.75rem', fontSize: '0.7rem' }}
                    >
                      Skip
                    </button>
                    <button 
                      onClick={handleAnalyzeLetter} 
                      disabled={!!sentimentResult || !letterDraft.trim()} 
                      className="tactical-button primary" 
                      style={{ padding: '0.35rem 0.75rem', fontSize: '0.7rem' }}
                    >
                      Sign & Send
                    </button>
                  </div>
                </div>
              </div>

              {/* Action Console choices */}
              <div className="tactical-card">
                <div className="card-title">
                  ⚔️ Strategic Action Console
                </div>
                <div className="choices-container">
                  {activeScenario.choices.map(choice => {
                    const availability = choiceAvailabilityById[choice.id] || {};
                    const { advisor, alignmentLocked, divergenceLocked, locked, lockReason } = availability;

                    return (
                    <button
                      key={choice.id}
                      type="button"
                      aria-pressed={selectedChoiceId === choice.id}
                      aria-label={`${choice.id.replace('option_', 'Option ').toUpperCase()}: ${choice.text}. Cost: ${choice.costDescription}${locked ? `. Locked: ${lockReason}` : ''}`}
                      onClick={() => { if (!locked) setSelectedChoiceId(choice.id); }}
                      onMouseEnter={() => {
                        if (!locked) {
                          setHoveredChoiceId(choice.id);
                          if (choice.successRate !== undefined && choice.successRate < 0.80) {
                            audioManagerRef.current?.playDistantArtilleryBarrage?.();
                          }
                        }
                      }}
                      onMouseLeave={() => setHoveredChoiceId(null)}
                      disabled={locked}
                      title={locked ? lockReason : undefined}
                      className={`choice-box ${selectedChoiceId === choice.id ? 'selected' : ''}`}
                      style={locked ? { opacity: 0.45, cursor: 'not-allowed' } : undefined}
                    >
                      <div className="choice-title-row">
                        <span className="choice-label">{choice.id.replace('option_', '').toUpperCase()}</span>
                        <span className="choice-proposer">
                          {alignmentLocked ? '⛔ bloc in resistance' : divergenceLocked ? '🔒 timeline locked' : `${choice.proposer} advisor`}
                        </span>
                      </div>
                      <div className="choice-text">{choice.text}</div>
                      <div className="choice-impact" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', marginTop: '0.4rem', color: 'var(--text-secondary)' }}>
                        <span>Cost: {choice.costDescription}</span>
                        {choice.successRate !== undefined && (
                          <span style={{ color: 'var(--accent-gold)', fontWeight: 'bold', fontFamily: 'var(--font-mono)' }}>
                            🎲 SUCCESS: {(choice.successRate * 100).toFixed(0)}%
                          </span>
                        )}
                      </div>
                    </button>
                    );
                  })}
                </div>

                <button
                  onClick={handleExecuteChoice}
                  disabled={!selectedChoiceId}
                  className="tactical-button primary"
                  style={{ 
                    width: '100%', 
                    marginTop: '1.25rem', 
                    fontWeight: 'bold',
                    background: needsConfirmation ? 'rgba(239, 68, 68, 0.25)' : '',
                    borderColor: needsConfirmation ? 'var(--accent-red)' : '',
                    color: needsConfirmation ? 'var(--accent-red)' : '',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {needsConfirmation ? '⚠️ CONFIRM STRATEGIC EXECUTION [Press Space]' : 'EXECUTE STRATEGIC ACTION ➡️'}
                </button>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.65rem', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', userSelect: 'none' }}>
                    <input 
                      type="checkbox" 
                      checked={confirmExecution} 
                      onChange={(e) => {
                        setConfirmExecution(e.target.checked);
                        setNeedsConfirmation(false);
                      }}
                      style={{ cursor: 'pointer', accentColor: 'var(--accent-gold)' }}
                    />
                    <span>Require confirmation check before committing strategy</span>
                  </label>
                </div>
              </div>

            </>
          )}

        </section>

        {/* Right Column: Telemetry & AI Monitor */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          <div className="tactical-card" id="progress-panel" style={{ background: 'rgba(212, 175, 55, 0.02)' }}>
            <div className="card-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>🧭 Campaign Progress</span>
              <span style={{ color: 'var(--accent-gold)', fontFamily: 'var(--font-mono)', fontSize: '0.72rem' }}>
                Turn {gameState.currentTurn} / {CAMPAIGN_FINAL_TURN}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.66rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', marginBottom: '0.25rem' }}>
                  <span>Resolved Decisions</span>
                  <span>{resolvedTurnCount} / {CAMPAIGN_FINAL_TURN}</span>
                </div>
                <div style={{ height: '7px', background: 'rgba(255,255,255,0.06)', borderRadius: '999px', overflow: 'hidden' }}>
                  <div style={{ width: `${campaignProgressPercent}%`, height: '100%', background: 'linear-gradient(90deg, var(--accent-gold), #d97706)' }}></div>
                </div>
              </div>

              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '0.6rem 0.7rem', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.04)' }}>
                <div style={{ fontSize: '0.62rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                  Current Phase
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--accent-gold)', fontWeight: 'bold', marginTop: '0.15rem' }}>
                  {campaignPhase.label}
                </div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', lineHeight: '1.35', marginTop: '0.15rem' }}>
                  {campaignPhase.note}
                </div>
              </div>

              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '0.6rem 0.7rem', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.04)' }}>
                <div style={{ fontSize: '0.62rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                  {gameState.gameOver ? 'Campaign Concluded' : 'Next Likely Milestone'}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-primary)', fontWeight: 'bold', marginTop: '0.15rem', lineHeight: '1.35' }}>
                  {gameState.gameOver
                    ? campaignScore?.endingClass
                    : nextMilestone
                      ? nextMilestone.title
                      : 'Final settlement window reached'}
                </div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                  {gameState.gameOver
                    ? 'No further non-AI campaign stage follows this settlement.'
                    : nextMilestone
                      ? `${nextMilestone.date} · turn ${nextMilestone.turn}`
                      : 'No authored milestone remains beyond the current front.'}
                </div>
              </div>

              <button
                onClick={() => {
                  setTutorialStep(0);
                  setShowTutorial(true);
                }}
                className="tactical-button"
                style={{ fontSize: '0.68rem', padding: '0.45rem 0.65rem', color: 'var(--accent-gold)', borderColor: 'var(--accent-gold)' }}
              >
                OPEN WALKTHROUGH
              </button>
            </div>
          </div>
          
            {/* Telemetry metrics */}
            <div className="tactical-card">
              <div className="card-title">
                📊 Core Telemetry Indicators
              </div>
              
              {(() => {
                const milProj = getProjectedMetric('militaryStrength');
                const milCur = gameState.metrics.militaryStrength;
                const munProj = getProjectedMetric('munitions');
                const munCur = gameState.metrics.munitions;
                const treProj = getProjectedMetric('treasury');
                const treCur = gameState.metrics.treasury;
                const foodProj = getProjectedMetric('foodSupply');
                const foodCur = gameState.metrics.foodSupply;
                const morProj = getProjectedMetric('publicMorale');
                const morCur = gameState.metrics.publicMorale;

                return (
                  <>
                    {/* Metric 1 */}
                    <div className="metric-row">
                      <div className="metric-info">
                        <span className="metric-label"><Swords size={12} style={{ display: 'inline', marginRight: '0.2rem' }} /> Military Strength</span>
                        <span className="metric-value" style={{ color: 'var(--text-primary)' }}>
                          {milCur} %
                          {milProj !== null && milProj !== milCur && (
                            <span style={{ marginLeft: '0.4rem', color: milProj > milCur ? 'var(--accent-green)' : 'var(--accent-red)', fontWeight: 'bold', fontFamily: 'var(--font-mono)', fontSize: '0.7rem' }}>
                              ({milProj > milCur ? '+' : ''}{milProj - milCur}%)
                            </span>
                          )}
                        </span>
                      </div>
                      <div className="metric-bar-container" role="progressbar" aria-label="Military Strength" aria-valuemin="0" aria-valuemax="100" aria-valuenow={milCur} aria-valuetext={milProj !== null && milProj !== milCur ? `${milCur}, projected ${milProj}` : `${milCur}`} style={{ position: 'relative' }}>
                        {milProj === null ? (
                          <div className="metric-bar-fill" style={{ width: `${milCur}%`, background: 'var(--accent-red)' }}></div>
                        ) : milProj > milCur ? (
                          <>
                            <div className="metric-bar-fill" style={{ width: `${milCur}%`, background: 'var(--accent-red)', position: 'absolute', left: 0, top: 0, bottom: 0 }}></div>
                            <div className="metric-bar-fill" style={{ width: `${milProj}%`, background: 'rgba(16, 185, 129, 0.45)', position: 'absolute', left: 0, top: 0, bottom: 0, zIndex: 5, animation: 'pulse 1.5s infinite' }}></div>
                          </>
                        ) : (
                          <>
                            <div className="metric-bar-fill" style={{ width: `${milProj}%`, background: 'var(--accent-red)', position: 'absolute', left: 0, top: 0, bottom: 0 }}></div>
                            <div style={{ left: `${milProj}%`, width: `${milCur - milProj}%`, background: 'rgba(239, 68, 68, 0.6)', position: 'absolute', top: 0, bottom: 0, zIndex: 5, animation: 'pulse 1.5s infinite' }}></div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Metric 2 */}
                    <div className="metric-row">
                      <div className="metric-info">
                        <span className="metric-label"><Shield size={12} style={{ display: 'inline', marginRight: '0.2rem' }} /> Munitions Stockpiles</span>
                        <span className="metric-value" style={{ color: 'var(--text-primary)' }}>
                          {munCur} / 100
                          {munProj !== null && munProj !== munCur && (
                            <span style={{ marginLeft: '0.4rem', color: munProj > munCur ? 'var(--accent-green)' : 'var(--accent-red)', fontWeight: 'bold', fontFamily: 'var(--font-mono)', fontSize: '0.7rem' }}>
                              ({munProj > munCur ? '+' : ''}{munProj - munCur})
                            </span>
                          )}
                        </span>
                      </div>
                      <div className="metric-bar-container" role="progressbar" aria-label="Munitions Stockpiles" aria-valuemin="0" aria-valuemax="100" aria-valuenow={munCur} aria-valuetext={munProj !== null && munProj !== munCur ? `${munCur}, projected ${munProj}` : `${munCur}`} style={{ position: 'relative' }}>
                        {munProj === null ? (
                          <div className="metric-bar-fill" style={{ width: `${munCur}%`, background: 'var(--accent-blue)' }}></div>
                        ) : munProj > munCur ? (
                          <>
                            <div className="metric-bar-fill" style={{ width: `${munCur}%`, background: 'var(--accent-blue)', position: 'absolute', left: 0, top: 0, bottom: 0 }}></div>
                            <div className="metric-bar-fill" style={{ width: `${munProj}%`, background: 'rgba(16, 185, 129, 0.45)', position: 'absolute', left: 0, top: 0, bottom: 0, zIndex: 5, animation: 'pulse 1.5s infinite' }}></div>
                          </>
                        ) : (
                          <>
                            <div className="metric-bar-fill" style={{ width: `${munProj}%`, background: 'var(--accent-blue)', position: 'absolute', left: 0, top: 0, bottom: 0 }}></div>
                            <div style={{ left: `${munProj}%`, width: `${munCur - munProj}%`, background: 'rgba(239, 68, 68, 0.6)', position: 'absolute', top: 0, bottom: 0, zIndex: 5, animation: 'pulse 1.5s infinite' }}></div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Metric 3 */}
                    <div className="metric-row">
                      <div className="metric-info">
                        <span className="metric-label"><Coins size={12} style={{ display: 'inline', marginRight: '0.2rem' }} /> Treasury Res</span>
                        <span className="metric-value" style={{ color: 'var(--text-primary)' }}>
                          {treCur} / 100
                          {treProj !== null && treProj !== treCur && (
                            <span style={{ marginLeft: '0.4rem', color: treProj > treCur ? 'var(--accent-green)' : 'var(--accent-red)', fontWeight: 'bold', fontFamily: 'var(--font-mono)', fontSize: '0.7rem' }}>
                              ({treProj > treCur ? '+' : ''}{treProj - treCur})
                            </span>
                          )}
                        </span>
                      </div>
                      <div className="metric-bar-container" role="progressbar" aria-label="Treasury Reserves" aria-valuemin="0" aria-valuemax="100" aria-valuenow={treCur} aria-valuetext={treProj !== null && treProj !== treCur ? `${treCur}, projected ${treProj}` : `${treCur}`} style={{ position: 'relative' }}>
                        {treProj === null ? (
                          <div className="metric-bar-fill" style={{ width: `${treCur}%`, background: 'var(--accent-gold)' }}></div>
                        ) : treProj > treCur ? (
                          <>
                            <div className="metric-bar-fill" style={{ width: `${treCur}%`, background: 'var(--accent-gold)', position: 'absolute', left: 0, top: 0, bottom: 0 }}></div>
                            <div className="metric-bar-fill" style={{ width: `${treProj}%`, background: 'rgba(16, 185, 129, 0.45)', position: 'absolute', left: 0, top: 0, bottom: 0, zIndex: 5, animation: 'pulse 1.5s infinite' }}></div>
                          </>
                        ) : (
                          <>
                            <div className="metric-bar-fill" style={{ width: `${treProj}%`, background: 'var(--accent-gold)', position: 'absolute', left: 0, top: 0, bottom: 0 }}></div>
                            <div style={{ left: `${treProj}%`, width: `${treCur - treProj}%`, background: 'rgba(239, 68, 68, 0.6)', position: 'absolute', top: 0, bottom: 0, zIndex: 5, animation: 'pulse 1.5s infinite' }}></div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Metric 4 */}
                    <div className="metric-row">
                      <div className="metric-info">
                        <span className="metric-label">🌾 Food Stores</span>
                        <span className="metric-value" style={{ color: 'var(--text-primary)' }}>
                          {foodCur} / 100
                          {foodProj !== null && foodProj !== foodCur && (
                            <span style={{ marginLeft: '0.4rem', color: foodProj > foodCur ? 'var(--accent-green)' : 'var(--accent-red)', fontWeight: 'bold', fontFamily: 'var(--font-mono)', fontSize: '0.7rem' }}>
                              ({foodProj > foodCur ? '+' : ''}{foodProj - foodCur})
                            </span>
                          )}
                        </span>
                      </div>
                      <div className="metric-bar-container" role="progressbar" aria-label="Food Stores" aria-valuemin="0" aria-valuemax="100" aria-valuenow={foodCur} aria-valuetext={foodProj !== null && foodProj !== foodCur ? `${foodCur}, projected ${foodProj}` : `${foodCur}`} style={{ position: 'relative' }}>
                        {foodProj === null ? (
                          <div className="metric-bar-fill" style={{ width: `${foodCur}%`, background: '#8a9d3b' }}></div>
                        ) : foodProj > foodCur ? (
                          <>
                            <div className="metric-bar-fill" style={{ width: `${foodCur}%`, background: '#8a9d3b', position: 'absolute', left: 0, top: 0, bottom: 0 }}></div>
                            <div className="metric-bar-fill" style={{ width: `${foodProj}%`, background: 'rgba(16, 185, 129, 0.45)', position: 'absolute', left: 0, top: 0, bottom: 0, zIndex: 5, animation: 'pulse 1.5s infinite' }}></div>
                          </>
                        ) : (
                          <>
                            <div className="metric-bar-fill" style={{ width: `${foodProj}%`, background: '#8a9d3b', position: 'absolute', left: 0, top: 0, bottom: 0 }}></div>
                            <div style={{ left: `${foodProj}%`, width: `${foodCur - foodProj}%`, background: 'rgba(239, 68, 68, 0.6)', position: 'absolute', top: 0, bottom: 0, zIndex: 5, animation: 'pulse 1.5s infinite' }}></div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Metric 5 */}
                    <div className="metric-row">
                      <div className="metric-info">
                        <span className="metric-label"><Users size={12} style={{ display: 'inline', marginRight: '0.2rem' }} /> Public Morale</span>
                        <span className="metric-value" style={{ color: 'var(--text-primary)' }}>
                          {morCur} %
                          {morProj !== null && morProj !== morCur && (
                            <span style={{ marginLeft: '0.4rem', color: morProj > morCur ? 'var(--accent-green)' : 'var(--accent-red)', fontWeight: 'bold', fontFamily: 'var(--font-mono)', fontSize: '0.7rem' }}>
                              ({morProj > morCur ? '+' : ''}{morProj - morCur}%)
                            </span>
                          )}
                        </span>
                      </div>
                      <div className="metric-bar-container" role="progressbar" aria-label="Public Morale" aria-valuemin="0" aria-valuemax="100" aria-valuenow={morCur} aria-valuetext={morProj !== null && morProj !== morCur ? `${morCur}, projected ${morProj}` : `${morCur}`} style={{ position: 'relative' }}>
                        {morProj === null ? (
                          <div className="metric-bar-fill" style={{ width: `${morCur}%`, background: 'var(--accent-green)' }}></div>
                        ) : morProj > morCur ? (
                          <>
                            <div className="metric-bar-fill" style={{ width: `${morCur}%`, background: 'var(--accent-green)', position: 'absolute', left: 0, top: 0, bottom: 0 }}></div>
                            <div className="metric-bar-fill" style={{ width: `${morProj}%`, background: 'rgba(16, 185, 129, 0.45)', position: 'absolute', left: 0, top: 0, bottom: 0, zIndex: 5, animation: 'pulse 1.5s infinite' }}></div>
                          </>
                        ) : (
                          <>
                            <div className="metric-bar-fill" style={{ width: `${morProj}%`, background: 'var(--accent-green)', position: 'absolute', left: 0, top: 0, bottom: 0 }}></div>
                            <div style={{ left: `${morProj}%`, width: `${morCur - morProj}%`, background: 'rgba(239, 68, 68, 0.6)', position: 'absolute', top: 0, bottom: 0, zIndex: 5, animation: 'pulse 1.5s infinite' }}></div>
                          </>
                        )}
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>

          {/* Campaign Archive */}
          <div className="tactical-card">
            <div className="card-title">
              💾 Campaign Archive
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                <div><strong style={{ color: 'var(--accent-gold)' }}>Seed:</strong> {gameState.seed}</div>
                <div><strong style={{ color: 'var(--accent-gold)' }}>Turn:</strong> {gameState.currentTurn}</div>
                <div><strong style={{ color: 'var(--accent-gold)' }}>Scenario:</strong> {gameState.scenarioId || activeScenario.id || activeScenario.title}</div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.45rem' }}>
                <button onClick={handleExportCampaignSave} className="tactical-button" style={{ fontSize: '0.68rem', padding: '0.45rem 0.65rem' }}>
                  EXPORT SAVE JSON
                </button>
                <button onClick={handleExportCampaignBundle} className="tactical-button" style={{ fontSize: '0.68rem', padding: '0.45rem 0.65rem' }}>
                  EXPORT CAMPAIGN BUNDLE
                </button>
                <button onClick={handleCopyShareCard} className="tactical-button" style={{ fontSize: '0.68rem', padding: '0.45rem 0.65rem' }}>
                  COPY SHARE TEXT
                </button>
                <button onClick={handleDownloadShareCard} className="tactical-button" style={{ fontSize: '0.68rem', padding: '0.45rem 0.65rem' }}>
                  DOWNLOAD SHARE CARD
                </button>
                <label className="tactical-button" style={{ fontSize: '0.68rem', padding: '0.45rem 0.65rem' }}>
                  IMPORT SAVE JSON
                  <input type="file" accept="application/json,.json" onChange={handleImportCampaignSave} style={{ display: 'none' }} />
                </label>
                <button onClick={handleLoadAutoSave} className="tactical-button" style={{ fontSize: '0.68rem', padding: '0.45rem 0.65rem' }}>
                  LOAD AUTO-SAVE
                </button>
                <button onClick={handleLoadDemoRoute} className="tactical-button" style={{ fontSize: '0.68rem', padding: '0.45rem 0.65rem', color: 'var(--accent-gold)', borderColor: 'rgba(212,175,55,0.45)' }}>
                  LOAD HEADLINE DEMO
                </button>
              </div>

              <div role="status" aria-live="polite" style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', lineHeight: '1.35', background: 'rgba(0,0,0,0.2)', padding: '0.5rem', borderRadius: '4px' }}>
                {archiveMessage}
              </div>
            </div>
          </div>

          {/* AI Terminal Monitor */}
          <div className="tactical-card" style={{ borderColor: aiPortalEngaged ? 'var(--accent-blue)' : 'var(--border-color)' }}>
            <div className="card-title" style={{ color: aiPortalEngaged ? 'var(--accent-blue)' : 'var(--accent-gold)' }}>
              <Radio size={14} /> AI Portals Console
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ fontSize: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.4rem', color: aiPortalEngaged ? 'var(--accent-blue)' : 'var(--text-secondary)' }}>
                Status: <strong>{aiStatus}</strong>
              </div>

              {aiPortalEngaged && (
                <>
                  {availableModels.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>Model:</span>
                        <select
                          value={selectedModel}
                          onChange={(e) => setSelectedModel(e.target.value)}
                          style={{ flex: 1, background: 'rgba(9, 12, 16, 0.9)', border: '1px solid var(--border-color)', color: 'var(--accent-blue)', fontFamily: 'var(--font-mono)', fontSize: '0.7rem', padding: '3px', borderRadius: '3px' }}
                        >
                          {availableModels.some((m) => m.knownGood) && (
                            <optgroup label="KNOWN GOOD FOR TITANS" style={{ background: '#11161d', color: 'var(--accent-gold)' }}>
                              {availableModels.filter((m) => m.knownGood).map((m) => (
                                <option key={m.name} value={m.name} style={{ color: 'var(--accent-gold)' }}>{m.name} ({m.profile.familyLabel})</option>
                              ))}
                            </optgroup>
                          )}
                          
                          {availableModels.some((m) => !m.knownGood) && (
                            <optgroup label="OTHER INSTALLED MODELS" style={{ background: '#11161d', color: '#9ca3af' }}>
                              {availableModels.filter((m) => !m.knownGood).map((m) => (
                                <option key={m.name} value={m.name} style={{ color: '#f3f4f6' }}>{m.name}</option>
                              ))}
                            </optgroup>
                          )}
                        </select>
                      </div>

                      {selectedModelProfile && (
                        <div style={{
                          fontSize: '0.62rem',
                          background: 'rgba(255, 255, 255, 0.02)',
                          border: '1px solid rgba(255, 255, 255, 0.05)',
                          padding: '0.45rem 0.6rem',
                          borderRadius: '3px',
                          color: selectedModelProfile.accentColor,
                          fontFamily: 'var(--font-mono)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.35rem'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <span className="ai-status-pulse" style={{ width: '5px', height: '5px', background: selectedModelProfile.dotColor }}></span>
                            <span>{selectedModelProfile.recommendationLabel} · {selectedModelProfile.statusLine}</span>
                          </div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                            {selectedModelProfile.enabledCapabilityBadges.map((badge) => (
                              <span key={badge} style={{ border: '1px solid rgba(255,255,255,0.08)', borderRadius: '999px', padding: '1px 6px', color: selectedModelProfile.accentColor }}>
                                {badge}
                              </span>
                            ))}
                            {selectedModelProfile.limitations.map((badge) => (
                              <span key={badge} style={{ border: '1px solid rgba(255,255,255,0.08)', borderRadius: '999px', padding: '1px 6px', color: 'var(--text-secondary)' }}>
                                {badge}
                              </span>
                            ))}
                          </div>
                          <div style={{ color: 'var(--text-secondary)', lineHeight: '1.35' }}>
                            {selectedModelProfile.supportNote}
                          </div>
                        </div>
                      )}

                      {!availableModels.some((m) => m.knownGood) && (
                        <div style={{ fontSize: '0.62rem', color: 'var(--accent-gold)', background: 'rgba(212, 175, 55, 0.04)', border: '1px dashed rgba(212, 175, 55, 0.2)', padding: '0.4rem', borderRadius: '3px', display: 'flex', gap: '0.3rem', alignItems: 'center' }}>
                          <span>💡</span>
                          <span>Recommended local model: <code>{RECOMMENDED_LOCAL_MODEL.displayName}</code>. Its Ollama tag (<code>{RECOMMENDED_LOCAL_MODEL.ollamaTag}</code>) typically publishes a few days after upstream release; until then, Qwen, Llama, Mistral, or Phi all work as fallbacks. Titans currently uses text + JSON outputs only.</span>
                        </div>
                      )}
                    </div>
                  )}

                  <pre
                    style={{
                      height: '100px',
                      background: 'rgba(0,0,0,0.3)',
                      padding: '0.5rem',
                      borderRadius: '4px',
                      fontSize: '0.65rem',
                      fontFamily: 'var(--font-mono)',
                      color: 'var(--text-secondary)',
                      overflowY: 'auto',
                      whiteSpace: 'pre-wrap'
                    }}
                  >
                    {aiLog}
                  </pre>

                  <button
                    onClick={handleProceduralGenerate}
                    disabled={isLoadingModel || gameState.currentTurn >= CAMPAIGN_FINAL_TURN}
                    className="tactical-button active-ai engaged"
                    style={{ fontSize: '0.75rem', fontWeight: 'bold' }}
                  >
                    {isLoadingModel
                      ? 'WORKING…'
                      : selectedModel
                        ? `GENERATE NEXT TURN (${selectedModel})`
                        : 'GENERATE NEXT TURN (scripted — no model)'}
                  </button>
                </>
              )}

              {!aiPortalEngaged && (
                <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', lineHeight: '1.3' }}>
                  Engage to discover the models actually installed in your local Ollama (queries localhost:11434/api/tags). Pick one and it will generate each turn from the live State Vector, colored by your letter sentiment. If none are found, the campaign runs the authored scenarios offline.
                </p>
              )}
            </div>
          </div>

        </section>

      </main>

      {/* Aide-de-Camp Guided Tutorial Overlay */}

      {showTutorial && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(9, 12, 16, 0.85)',
          zIndex: 2000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.5rem',
          backdropFilter: 'blur(3px)'
        }}>
          <div className="tactical-card" style={{
            width: '100%',
            maxWidth: '500px',
            background: '#11161d',
            border: '2px solid var(--accent-gold)',
            boxShadow: '0 10px 40px rgba(0,0,0,0.6)',
            padding: '1.75rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
            position: 'relative'
          }}>
            {/* Ribbon */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(212,175,55,0.15)', paddingBottom: '0.6rem' }}>
              <h3 style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--accent-gold)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold' }}>
                GUIDED CAMPAIGN WALKTHROUGH
              </h3>
              <button 
                onClick={() => setShowTutorial(false)}
                style={{ background: 'transparent', border: '1px solid rgba(212, 175, 55, 0.25)', color: 'var(--accent-gold)', borderRadius: '3px', padding: '2px 8px', fontSize: '0.6rem', cursor: 'pointer', fontFamily: 'var(--font-mono)' }}
              >
                CLOSE
              </button>
            </div>

            {/* Content Area */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', color: 'var(--text-primary)', fontSize: '0.85rem', lineHeight: '1.45' }}>
              <div style={{ fontWeight: 'bold', color: 'var(--accent-gold)', fontFamily: 'var(--font-mono)', fontSize: '0.95rem' }}>
                {TUTORIAL_STEPS[tutorialStep].title}
              </div>
              <p style={{ margin: 0, opacity: 0.9 }}>
                {TUTORIAL_STEPS[tutorialStep].text}
              </p>
            </div>

            {/* Stepper indicators */}
            <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', margin: '0.25rem 0' }}>
              {TUTORIAL_STEPS.map((_, idx) => (
                <div 
                  key={idx} 
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: tutorialStep === idx ? 'var(--accent-gold)' : 'rgba(255,255,255,0.1)',
                    transition: '0.2s'
                  }}
                />
              ))}
            </div>

            {/* Footer controls */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.85rem' }}>
              <button
                disabled={tutorialStep === 0}
                onClick={() => setTutorialStep(prev => prev - 1)}
                className="tactical-button"
                style={{ 
                  padding: '4px 12px', 
                  fontSize: '0.7rem', 
                  fontFamily: 'var(--font-mono)', 
                  opacity: tutorialStep === 0 ? 0.3 : 1,
                  cursor: tutorialStep === 0 ? 'not-allowed' : 'pointer'
                }}
              >
                ◀ PREVIOUS
              </button>

              <button
                onClick={() => {
                  if (tutorialStep < TUTORIAL_STEPS.length - 1) {
                    setTutorialStep(prev => prev + 1);
                  } else {
                    setShowTutorial(false);
                  }
                }}
                className="tactical-button"
                style={{ 
                  padding: '4px 16px', 
                  fontSize: '0.7rem', 
                  fontFamily: 'var(--font-mono)', 
                  background: 'rgba(212, 175, 55, 0.12)', 
                  borderColor: 'var(--accent-gold)', 
                  color: 'var(--accent-gold)',
                  fontWeight: 'bold'
                }}
              >
                {tutorialStep === TUTORIAL_STEPS.length - 1 ? "DISMISS & BEGIN" : "NEXT STEP ▶"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Keyboard Hotkeys Help Modal */}
      {showHotkeysHelp && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(9, 12, 16, 0.9)',
          zIndex: 2000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.5rem',
          backdropFilter: 'blur(3px)'
        }}>
          <div className="tactical-card" style={{
            width: '100%',
            maxWidth: '450px',
            background: '#11161d',
            border: '2px solid var(--accent-gold)',
            boxShadow: '0 10px 40px rgba(0,0,0,0.6)',
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            position: 'relative'
          }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(212,175,55,0.15)', paddingBottom: '0.6rem' }}>
              <h3 style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--accent-gold)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold' }}>
                ⌨️ KEYBOARD COMMAND MATRIX
              </h3>
              <button 
                onClick={() => setShowHotkeysHelp(false)}
                style={{ background: 'transparent', border: '1px solid rgba(212, 175, 55, 0.25)', color: 'var(--accent-gold)', borderRadius: '3px', padding: '2px 8px', fontSize: '0.6rem', cursor: 'pointer', fontFamily: 'var(--font-mono)' }}
              >
                CLOSE [ESC]
              </button>
            </div>

            {/* List of shortcuts */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.8rem', color: 'var(--text-primary)' }}>
              <p style={{ margin: 0, opacity: 0.85, lineHeight: 1.4, marginBottom: '0.25rem' }}>
                Command the Alternate-History Campaign rapidly using standard tactical key mappings:
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.2)', padding: '0.4rem 0.6rem', borderRadius: '4px' }}>
                  <span style={{ fontWeight: 'bold' }}>Select Choice A, B, C, or D</span>
                  <span style={{ fontFamily: 'var(--font-mono)', background: 'var(--accent-gold)', color: '#000000', padding: '1px 6px', borderRadius: '3px', fontSize: '0.7rem', fontWeight: 'bold' }}>1, 2, 3, 4</span>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.2)', padding: '0.4rem 0.6rem', borderRadius: '4px' }}>
                  <span style={{ fontWeight: 'bold' }}>Execute Strategy Choice</span>
                  <span style={{ fontFamily: 'var(--font-mono)', background: 'var(--accent-gold)', color: '#000000', padding: '1px 6px', borderRadius: '3px', fontSize: '0.7rem', fontWeight: 'bold' }}>Spacebar</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.2)', padding: '0.4rem 0.6rem', borderRadius: '4px' }}>
                  <span style={{ fontWeight: 'bold' }}>Focus Telegram/Letter Box</span>
                  <span style={{ fontFamily: 'var(--font-mono)', background: 'var(--accent-gold)', color: '#000000', padding: '1px 6px', borderRadius: '3px', fontSize: '0.7rem', fontWeight: 'bold' }}>L</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.2)', padding: '0.4rem 0.6rem', borderRadius: '4px' }}>
                  <span style={{ fontWeight: 'bold' }}>Play / Pause Soundscape</span>
                  <span style={{ fontFamily: 'var(--font-mono)', background: 'var(--accent-gold)', color: '#000000', padding: '1px 6px', borderRadius: '3px', fontSize: '0.7rem', fontWeight: 'bold' }}>P</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.2)', padding: '0.4rem 0.6rem', borderRadius: '4px' }}>
                  <span style={{ fontWeight: 'bold' }}>Mute / Unmute Soundscape</span>
                  <span style={{ fontFamily: 'var(--font-mono)', background: 'var(--accent-gold)', color: '#000000', padding: '1px 6px', borderRadius: '3px', fontSize: '0.7rem', fontWeight: 'bold' }}>M</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.2)', padding: '0.4rem 0.6rem', borderRadius: '4px' }}>
                  <span style={{ fontWeight: 'bold' }}>Skip to Next Track</span>
                  <span style={{ fontFamily: 'var(--font-mono)', background: 'var(--accent-gold)', color: '#000000', padding: '1px 6px', borderRadius: '3px', fontSize: '0.7rem', fontWeight: 'bold' }}>N</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.2)', padding: '0.4rem 0.6rem', borderRadius: '4px' }}>
                  <span style={{ fontWeight: 'bold' }}>Chrono-Rewind (Undo Turn)</span>
                  <span style={{ fontFamily: 'var(--font-mono)', background: 'var(--accent-gold)', color: '#000000', padding: '1px 6px', borderRadius: '3px', fontSize: '0.7rem', fontWeight: 'bold' }}>U</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.2)', padding: '0.4rem 0.6rem', borderRadius: '4px' }}>
                  <span style={{ fontWeight: 'bold' }}>Close Any Active Overlay/Loupe</span>
                  <span style={{ fontFamily: 'var(--font-mono)', background: 'var(--accent-gold)', color: '#000000', padding: '1px 6px', borderRadius: '3px', fontSize: '0.7rem', fontWeight: 'bold' }}>Escape</span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.6rem', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowHotkeysHelp(false)}
                className="tactical-button"
                style={{ padding: '4px 12px', fontSize: '0.7rem', fontFamily: 'var(--font-mono)', background: 'rgba(212, 175, 55, 0.08)', borderColor: 'var(--accent-gold)', color: 'var(--accent-gold)' }}
              >
                DISMISS
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
