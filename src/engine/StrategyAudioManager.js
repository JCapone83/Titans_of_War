/**
 * Titans of War — Strategy Audio Manager
 *
 * Implements a dual-layer audio engine for the immersive war cabinet.
 * 1. Primary: HTML5 Audio Player pointing to public domain recordings in /audio/.
 * 2. Fallback: Native Web Audio Procedural Synthesizer. If files are not present in the public folder,
 *    the engine procedurally synthesizes:
 *      - An ambient, crackling campfire loop (white noise bursts + bandpass filters).
 *      - Haunting solo fife/trumpet instrumentals of "Lorena" or "Battle Cry of Freedom".
 *
 * This guarantees immersive audio out-of-the-box with zero bandwidth/download requirements.
 */
import { AUDIO_TRACK_LIBRARY } from '../game/audioCatalog.js';

// Note frequencies (C4 to B5)
const NOTES = {
  REST: 0,
  C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.00, A4: 440.00, B4: 493.88,
  C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99, A5: 880.00, B5: 987.77,
  C6: 1046.50
};

// Melodies sheet data: [Frequency, Duration in beats]
const MELODIES = {
  // "Lorena" (Haunting, slow classical fife)
  lorena: [
    [NOTES.G4, 1], [NOTES.C5, 1], [NOTES.E5, 1], [NOTES.D5, 1.5], [NOTES.C5, 0.5], [NOTES.E5, 1],
    [NOTES.G5, 2], [NOTES.E5, 1], [NOTES.C5, 1.5], [NOTES.D5, 0.5], [NOTES.E5, 1], [NOTES.C5, 2],
    [NOTES.A4, 1], [NOTES.G4, 2], [NOTES.REST, 1],
    [NOTES.G4, 1], [NOTES.C5, 1], [NOTES.E5, 1], [NOTES.D5, 1.5], [NOTES.C5, 0.5], [NOTES.E5, 1],
    [NOTES.G5, 2], [NOTES.E5, 1], [NOTES.C5, 1.5], [NOTES.D5, 0.5], [NOTES.E5, 1], [NOTES.D5, 3]
  ],
  // "Battle Cry of Freedom" (Aggressive, upbeat brass)
  battle_cry: [
    [NOTES.C5, 1], [NOTES.E5, 1], [NOTES.G5, 1], [NOTES.G5, 1.5], [NOTES.F5, 0.5], [NOTES.E5, 1],
    [NOTES.D5, 2], [NOTES.E5, 1], [NOTES.F5, 2], [NOTES.E5, 1], [NOTES.D5, 1.5], [NOTES.C5, 0.5],
    [NOTES.D5, 1], [NOTES.E5, 3],
    [NOTES.C5, 1], [NOTES.E5, 1], [NOTES.G5, 1], [NOTES.G5, 1.5], [NOTES.F5, 0.5], [NOTES.E5, 1],
    [NOTES.D5, 2], [NOTES.E5, 1], [NOTES.C5, 2], [NOTES.REST, 1]
  ],
  // "When Johnny Comes Marching Home" (Standard fife march)
  march: [
    [NOTES.E4, 1], [NOTES.G4, 1], [NOTES.A4, 1], [NOTES.A4, 1.5], [NOTES.B4, 0.5], [NOTES.A4, 1],
    [NOTES.G4, 1.5], [NOTES.F4, 0.5], [NOTES.G4, 1], [NOTES.A4, 2], [NOTES.REST, 1],
    [NOTES.E4, 1], [NOTES.G4, 1], [NOTES.A4, 1], [NOTES.A4, 1.5], [NOTES.B4, 0.5], [NOTES.A4, 1],
    [NOTES.C5, 1.5], [NOTES.B4, 0.5], [NOTES.C5, 1], [NOTES.D5, 3]
  ],

  // "Battle Hymn of the Republic" (measured, triumphant)
  battle_hymn: [
    [NOTES.G4, 1], [NOTES.G4, 1], [NOTES.G4, 1], [NOTES.C5, 1], [NOTES.E5, 1.5], [NOTES.D5, 0.5],
    [NOTES.C5, 1], [NOTES.G4, 1], [NOTES.C5, 1], [NOTES.D5, 1], [NOTES.E5, 2], [NOTES.REST, 0.5],
    [NOTES.E5, 1], [NOTES.E5, 1], [NOTES.F5, 1], [NOTES.G5, 1], [NOTES.E5, 1], [NOTES.D5, 1],
    [NOTES.C5, 1], [NOTES.G4, 2]
  ],
  // "The Bonnie Blue Flag" (lilting parade tempo)
  bonnie_blue_flag: [
    [NOTES.E4, 1], [NOTES.G4, 1], [NOTES.A4, 1], [NOTES.B4, 1], [NOTES.C5, 1], [NOTES.B4, 1],
    [NOTES.A4, 1], [NOTES.G4, 1], [NOTES.E4, 2], [NOTES.REST, 0.5],
    [NOTES.A4, 1], [NOTES.B4, 1], [NOTES.C5, 1], [NOTES.D5, 1], [NOTES.C5, 1], [NOTES.B4, 1],
    [NOTES.A4, 1], [NOTES.G4, 1], [NOTES.E4, 2]
  ]
};

const PROCEDURAL_TRACK_INFO = {
  lorena: { title: 'Lorena', tempoBpm: 65 },
  battle_cry: { title: 'Battle Cry of Freedom', tempoBpm: 100 },
  march: { title: 'When Johnny Comes Marching Home', tempoBpm: 80 },
  battle_hymn: { title: 'Battle Hymn of the Republic', tempoBpm: 84 },
  bonnie_blue_flag: { title: 'The Bonnie Blue Flag', tempoBpm: 92 },
};

const FILE_TRACK_LIBRARY = AUDIO_TRACK_LIBRARY;
const BUS_BASE_LEVELS = {
  music: 1,
  ambience: 0.32,
  stinger: 0.95,
};
const DEFAULT_BUS_DUCK_MULTIPLIERS = {
  music: 1,
  ambience: 1,
  stinger: 1,
};
const DUCK_PRESETS = {
  stingerBarrage: {
    levels: { music: 0.48, ambience: 0.24, stinger: 1 },
    attackMs: 45,
    holdMs: 900,
    releaseMs: 900,
  },
  hotspurFlourish: {
    levels: { music: 0.62, ambience: 0.38, stinger: 1 },
    attackMs: 35,
    holdMs: 650,
    releaseMs: 700,
  },
  cabinetDebate: {
    levels: { music: 0.68, ambience: 0.52, stinger: 1 },
    attackMs: 180,
    holdMs: 2400,
    releaseMs: 1400,
  },
  letterWriting: {
    levels: { music: 0.42, ambience: 0.18, stinger: 1 },
    attackMs: 220,
    holdMs: 0,
    releaseMs: 900,
  },
};

export class StrategyAudioManager {
  constructor() {
    this.audioContext = null;
    this.campfireNode = null;
    this.sequencerInterval = null;
    this.isPlaying = false;
    this.volume = 0.4;
    this.isMuted = false;
    
    // Track references
    this.musicTrack = null;
    this.ambientCampfire = null;
    this.useProcedural = true;
    this.hasFileLibrary = false;
    this.availableFileTracks = [];
    this.availableFileTrackMap = new Map();
    this.initialized = false;
    this.statusListener = null;
    
    this.activeMelodyKey = null;
    this.manualTrackOverrideKey = null;
    this.tempoBpm = 80;
    this.masterGainNode = null;
    this.musicBusGainNode = null;
    this.ambienceBusGainNode = null;
    this.stingerBusGainNode = null;
    this.currentTrackTitle = 'Off';
    this.currentSourceMode = 'silent';
    this.currentTrackMeta = null;
    this.lastGameState = null;
    this.boundVisibilityHandler = null;
    this.boundPageShowHandler = null;
    this.fileCrossfadeInterval = null;
    this.fadingOutTrack = null;
    this.musicTrackMixLevel = 1;
    this.fadingOutTrackMixLevel = 1;
    this.ambientTrackMixLevel = 1;
    this.pendingEffectTimeouts = new Set();
    this.hotspurFlourishTimer = null;
    this.lastEffectAt = {
      distantArtillery: 0,
      hotspurFlourish: 0,
    };
    this.busDuckMultipliers = { ...DEFAULT_BUS_DUCK_MULTIPLIERS };
    this.activeBusDucks = new Map();
    this.busDuckTimers = new Map();
    this.mediaElementSourceMap = new WeakMap();
  }

  init() {
    if (this.initialized) return;
    this.initialized = true;
    this.attachLifecycleHandlers();
    this.probeFileLibrary();
  }

  attachLifecycleHandlers() {
    if (typeof document !== 'undefined' && !this.boundVisibilityHandler) {
      this.boundVisibilityHandler = () => {
        if (document.visibilityState === 'visible') {
          void this.recoverPlayback();
        }
      };
      document.addEventListener('visibilitychange', this.boundVisibilityHandler);
    }

    if (typeof window !== 'undefined' && !this.boundPageShowHandler) {
      this.boundPageShowHandler = () => {
        void this.recoverPlayback();
      };
      window.addEventListener('pageshow', this.boundPageShowHandler);
    }
  }

  setStatusListener(listener) {
    this.statusListener = listener;
  }

  emitStatus() {
    if (typeof this.statusListener === 'function') {
      this.statusListener(this.getStatusSnapshot());
    }
  }

  getStatusSnapshot() {
    return {
      isPlaying: this.isPlaying,
      isMuted: this.isMuted,
      volume: this.volume,
      useProcedural: this.useProcedural || !this.hasFileLibrary,
      hasFileLibrary: this.hasFileLibrary,
      trackLabel: this.currentTrackTitle,
      sourceMode: this.currentSourceMode,
      trackSource: this.currentTrackMeta?.sourceInstitution || '',
      trackLicense: this.currentTrackMeta?.licenseStatus || '',
      fileTrackCount: this.availableFileTracks.filter((track) => track.type === 'music').length,
      mixState: {
        realtimeGraph: this.hasRealtimeBusGraph(),
        activeDuckKeys: Array.from(this.activeBusDucks.keys()),
        busLevels: {
          music: this.getBusTargetLevel('music'),
          ambience: this.getBusTargetLevel('ambience'),
          stinger: this.getBusTargetLevel('stinger'),
        },
      },
    };
  }

  hasRealtimeBusGraph() {
    return Boolean(
      this.audioContext
      && this.masterGainNode
      && this.musicBusGainNode
      && this.ambienceBusGainNode
      && this.stingerBusGainNode,
    );
  }

  getBusGainNode(busKey) {
    switch (busKey) {
      case 'ambience':
        return this.ambienceBusGainNode;
      case 'stinger':
        return this.stingerBusGainNode;
      case 'music':
      default:
        return this.musicBusGainNode;
    }
  }

  getBusTargetLevel(busKey) {
    return (BUS_BASE_LEVELS[busKey] || 1) * (this.busDuckMultipliers[busKey] || 1);
  }

  getDirectElementVolume(busKey, mixLevel = 1) {
    const directVolume = (this.isMuted ? 0 : this.volume) * this.getBusTargetLevel(busKey) * mixLevel;
    return Math.max(0, Math.min(1, directVolume));
  }

  applyElementMixLevel(element, busKey, mixLevel = 1) {
    if (!element) return;

    if (this.hasRealtimeBusGraph()) {
      element.volume = this.isMuted ? 0 : Math.max(0, Math.min(1, mixLevel));
      return;
    }

    element.volume = this.getDirectElementVolume(busKey, mixLevel);
  }

  syncMediaElementLevels() {
    this.applyElementMixLevel(this.musicTrack, 'music', this.musicTrackMixLevel);
    this.applyElementMixLevel(this.fadingOutTrack, 'music', this.fadingOutTrackMixLevel);
    this.applyElementMixLevel(this.ambientCampfire, 'ambience', this.ambientTrackMixLevel);
  }

  setAudioParamTarget(param, target, now, rampMs = 0) {
    param.cancelScheduledValues(now);
    if (!rampMs) {
      param.setValueAtTime(target, now);
      return;
    }

    param.setValueAtTime(param.value, now);
    param.linearRampToValueAtTime(target, now + (rampMs / 1000));
  }

  applyBusLevels({ rampMs = 0 } = {}) {
    if (this.hasRealtimeBusGraph()) {
      const now = this.audioContext.currentTime;
      this.setAudioParamTarget(this.masterGainNode.gain, this.isMuted ? 0 : this.volume, now, rampMs);
      ['music', 'ambience', 'stinger'].forEach((busKey) => {
        const gainNode = this.getBusGainNode(busKey);
        if (!gainNode) return;
        this.setAudioParamTarget(gainNode.gain, this.getBusTargetLevel(busKey), now, rampMs);
      });
    }

    this.syncMediaElementLevels();
  }

  recomputeBusDuckMultipliers() {
    const nextMultipliers = { ...DEFAULT_BUS_DUCK_MULTIPLIERS };

    this.activeBusDucks.forEach((levels) => {
      Object.keys(nextMultipliers).forEach((busKey) => {
        nextMultipliers[busKey] = Math.min(nextMultipliers[busKey], levels[busKey] ?? 1);
      });
    });

    this.busDuckMultipliers = nextMultipliers;
  }

  applyDuckProfile(key, levels, { attackMs = 80, holdMs = 1200, releaseMs = 900 } = {}) {
    if (!this.isPlaying) return;

    const existingTimer = this.busDuckTimers.get(key);
    if (existingTimer) {
      clearTimeout(existingTimer);
      this.busDuckTimers.delete(key);
    }

    this.activeBusDucks.set(key, levels);
    this.recomputeBusDuckMultipliers();
    this.applyBusLevels({ rampMs: attackMs });
    this.emitStatus();

    if (!holdMs) {
      return;
    }

    const releaseTimer = setTimeout(() => {
      this.activeBusDucks.delete(key);
      this.busDuckTimers.delete(key);
      this.recomputeBusDuckMultipliers();
      this.applyBusLevels({ rampMs: releaseMs });
      this.emitStatus();
    }, holdMs);

    this.busDuckTimers.set(key, releaseTimer);
  }

  setPersistentDuck(key, levels, { attackMs = 120 } = {}) {
    this.applyDuckProfile(key, levels, { attackMs, holdMs: 0, releaseMs: 0 });
  }

  clearDuckProfile(key, { releaseMs = 900 } = {}) {
    const existingTimer = this.busDuckTimers.get(key);
    if (existingTimer) {
      clearTimeout(existingTimer);
      this.busDuckTimers.delete(key);
    }

    if (!this.activeBusDucks.has(key)) {
      return;
    }

    this.activeBusDucks.delete(key);
    this.recomputeBusDuckMultipliers();
    this.applyBusLevels({ rampMs: releaseMs });
    this.emitStatus();
  }

  clearBusDuckProfiles() {
    this.busDuckTimers.forEach((timerId) => clearTimeout(timerId));
    this.busDuckTimers.clear();
    this.activeBusDucks.clear();
    this.recomputeBusDuckMultipliers();
    this.applyBusLevels();
    this.emitStatus();
  }

  duckWithPreset(presetKey) {
    const preset = DUCK_PRESETS[presetKey];
    if (!preset) return;
    this.applyDuckProfile(presetKey, preset.levels, preset);
  }

  duckForCabinetDebate() {
    this.duckWithPreset('cabinetDebate');
  }

  engageLetterWritingDuck() {
    const preset = DUCK_PRESETS.letterWriting;
    this.setPersistentDuck('letterWriting', preset.levels, { attackMs: preset.attackMs });
  }

  releaseLetterWritingDuck() {
    const preset = DUCK_PRESETS.letterWriting;
    this.clearDuckProfile('letterWriting', { releaseMs: preset.releaseMs });
  }

  attachMediaElementToBus(element, busKey) {
    if (!element || !this.audioContext) return false;

    const busNode = this.getBusGainNode(busKey);
    if (!busNode) return false;

    let route = this.mediaElementSourceMap.get(element);
    if (!route) {
      try {
        route = {
          sourceNode: this.audioContext.createMediaElementSource(element),
          busKey: null,
        };
      } catch {
        return false;
      }
      this.mediaElementSourceMap.set(element, route);
    }

    if (route.busKey === busKey) {
      return true;
    }

    try {
      route.sourceNode.disconnect();
    } catch {
      // Safe to ignore if the source node was not previously connected.
    }

    route.sourceNode.connect(busNode);
    route.busKey = busKey;
    return true;
  }

  isTrackAllowed(track) {
    return !import.meta.env.PROD || track.licenseStatus !== 'recording-needed';
  }

  async probeTrack(track) {
    if (!this.isTrackAllowed(track)) {
      return null;
    }

    const validateResponse = async (response) => {
      if (!response?.ok) return null;

      const contentType = (response.headers.get('content-type') || '').toLowerCase();
      const looksLikeAudio = !contentType || contentType.startsWith('audio/');

      try {
        await response.body?.cancel?.();
      } catch {
        // Best-effort cancellation; some responses do not expose a cancelable body.
      }

      return looksLikeAudio ? track : null;
    };

    try {
      const headResponse = await fetch(track.src, {
        method: 'HEAD',
        headers: { Accept: 'audio/*' },
      });

      const headResult = await validateResponse(headResponse);
      if (headResult) {
        return headResult;
      }
    } catch {
      // Fall through to a range GET probe.
    }

    try {
      const rangeResponse = await fetch(track.src, {
        method: 'GET',
        headers: {
          Accept: 'audio/*',
          Range: 'bytes=0-0',
        },
      });

      return await validateResponse(rangeResponse);
    } catch {
      return null;
    }
  }

  async probeFileLibrary() {
    if (typeof window === 'undefined' || typeof fetch !== 'function') {
      this.emitStatus();
      return;
    }

    const checks = await Promise.all(FILE_TRACK_LIBRARY.map((track) => this.probeTrack(track)));

    this.availableFileTracks = checks.filter(Boolean);
    this.availableFileTrackMap = new Map(this.availableFileTracks.map((track) => [track.key, track]));
    this.hasFileLibrary = this.availableFileTracks.some((track) => track.type === 'music');

    if (!this.hasFileLibrary) {
      this.useProcedural = true;
      console.log('[Strategy Audio] No local recordings detected in /audio. Using public-domain procedural score.');
    } else if (import.meta.env.PROD) {
      const excluded = FILE_TRACK_LIBRARY.filter((track) => track.licenseStatus === 'recording-needed');
      if (excluded.length) {
        console.log(`[Strategy Audio] Production build excluded ${excluded.length} unverified archive track(s) still marked recording-needed.`);
      }
    }

    this.emitStatus();
  }

  pickContextualTrackKey(gameState) {
    const morale = gameState.metrics.publicMorale;
    const hotspur = gameState.shards.hotspur.alignment;
    const wolf = gameState.shards.wolf.alignment;
    const divergence = gameState.divergenceIndex || 0;

    if (gameState.gameOver && gameState.currentTurn >= 12) return 'elegy_final';
    if (gameState.gameOver) return 'lorena_alt';
    if (morale < 35) return 'lorena';
    if (morale < 50 && gameState.currentTurn >= 6) return 'tenting_tonight';
    if (divergence >= 0.55 || hotspur > 72) return 'dixie';
    if (wolf > 68 && gameState.metrics.treasury > 55) return 'bonnie_blue_flag';
    if (morale > 72 && divergence < 0.2) return 'battle_hymn';
    if (gameState.currentTurn >= 9) return 'home_sweet_home';
    if (gameState.currentTurn <= 2) return 'march';
    return 'battle_cry';
  }

  setUseProcedural(nextValue) {
    this.useProcedural = nextValue || !this.hasFileLibrary;
    this.emitStatus();
    return this.useProcedural;
  }

  start(gameState) {
    if (this.isPlaying) return;
    this.isPlaying = true;
    this.lastGameState = gameState;

    if (this.useProcedural || !this.hasFileLibrary) {
      void this.startProceduralPlayback(gameState);
    } else {
      void this.startFilePlayback(gameState);
    }
    this.emitStatus();
  }

  stop() {
    this.isPlaying = false;
    this.clearFileCrossfade();
    this.clearPendingEffectTimeouts();
    this.clearBusDuckProfiles();
    if (this.hotspurFlourishTimer) {
      clearTimeout(this.hotspurFlourishTimer);
      this.hotspurFlourishTimer = null;
    }
    this.stopProceduralMelody();
    if (this.campfireNode) {
      try { this.campfireNode.stop(); } catch {}
      this.campfireNode = null;
    }
    if (this.ambientCampfire) {
      this.ambientCampfire.pause();
    }
    if (this.musicTrack) {
      this.musicTrack.pause();
    }
    if (this.fadingOutTrack) {
      this.fadingOutTrack.pause();
      this.fadingOutTrack = null;
    }
    if (this.audioContext && this.audioContext.state === 'running') {
      this.audioContext.suspend().catch(() => {});
    }
    this.activeMelodyKey = null;
    this.musicTrackMixLevel = 1;
    this.fadingOutTrackMixLevel = 1;
    this.ambientTrackMixLevel = 1;
    this.currentTrackTitle = 'Off';
    this.currentSourceMode = 'silent';
    this.currentTrackMeta = null;
    this.emitStatus();
  }

  setVolume(val) {
    this.volume = Math.max(0, Math.min(1, val));
    this.applyBusLevels();
    this.emitStatus();
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    this.setVolume(this.volume);
    return this.isMuted;
  }

  getCurrentMusicVolume() {
    return this.hasRealtimeBusGraph() ? 1 : (this.isMuted ? 0 : this.volume);
  }

  clearFileCrossfade() {
    if (this.fileCrossfadeInterval) {
      clearInterval(this.fileCrossfadeInterval);
      this.fileCrossfadeInterval = null;
    }
  }

  clearPendingEffectTimeouts() {
    this.pendingEffectTimeouts.forEach((timeoutId) => clearTimeout(timeoutId));
    this.pendingEffectTimeouts.clear();
  }

  registerEffectTimeout(callback, delayMs) {
    const timeoutId = setTimeout(() => {
      this.pendingEffectTimeouts.delete(timeoutId);
      callback();
    }, delayMs);
    this.pendingEffectTimeouts.add(timeoutId);
    return timeoutId;
  }

  canTriggerEffect(effectKey, cooldownMs) {
    const now = Date.now();
    const lastTriggeredAt = this.lastEffectAt[effectKey] || 0;

    if (now - lastTriggeredAt < cooldownMs) {
      return false;
    }

    this.lastEffectAt[effectKey] = now;
    return true;
  }

  crossfadeFileTracks(incomingTrack, outgoingTrack) {
    this.clearFileCrossfade();

    if (!outgoingTrack) {
      this.musicTrackMixLevel = 1;
      this.applyElementMixLevel(incomingTrack, 'music', this.musicTrackMixLevel);
      this.fadingOutTrack = null;
      return;
    }

    this.fadingOutTrack = outgoingTrack;
    this.musicTrackMixLevel = 0;
    this.fadingOutTrackMixLevel = 1;
    this.applyElementMixLevel(incomingTrack, 'music', this.musicTrackMixLevel);
    this.applyElementMixLevel(outgoingTrack, 'music', this.fadingOutTrackMixLevel);

    const durationMs = 650;
    const stepMs = 50;
    const steps = Math.max(1, Math.round(durationMs / stepMs));
    let step = 0;

    this.fileCrossfadeInterval = setInterval(() => {
      step += 1;
      const progress = Math.min(1, step / steps);
      const eased = progress * progress * (3 - (2 * progress));

      this.musicTrackMixLevel = eased;
      this.fadingOutTrackMixLevel = 1 - eased;
      this.applyElementMixLevel(incomingTrack, 'music', this.musicTrackMixLevel);
      this.applyElementMixLevel(outgoingTrack, 'music', this.fadingOutTrackMixLevel);

      if (progress >= 1) {
        this.clearFileCrossfade();
        outgoingTrack.pause();
        this.musicTrackMixLevel = 1;
        this.fadingOutTrackMixLevel = 1;
        this.applyElementMixLevel(incomingTrack, 'music', this.musicTrackMixLevel);
        this.fadingOutTrack = null;
      }
    }, stepMs);
  }

  queueHotspurMartialFlourish(delayMs = 800) {
    if (this.hotspurFlourishTimer) {
      clearTimeout(this.hotspurFlourishTimer);
      this.hotspurFlourishTimer = null;
    }

    this.hotspurFlourishTimer = this.registerEffectTimeout(() => {
      this.hotspurFlourishTimer = null;
      this.playHotspurMartialFlourish();
    }, delayMs);
  }

  async ensureAudioContextRunning() {
    if (!this.audioContext) return false;

    if (this.audioContext.state === 'suspended') {
      try {
        await this.audioContext.resume();
      } catch {
        return false;
      }
    }

    return this.audioContext.state === 'running';
  }

  async startFilePlayback(gameState) {
    this.lastGameState = gameState || this.lastGameState;
    this.initWebAudio();
    await this.ensureAudioContextRunning();
    this.applyBusLevels();
    await this.startAmbientFileTrack();
    await this.playContextualFileTrack(this.lastGameState || gameState);
  }

  async startProceduralPlayback(gameState) {
    this.lastGameState = gameState || this.lastGameState;
    this.useProcedural = true;
    this.initWebAudio();

    const ready = await this.ensureAudioContextRunning();
    if (!ready || !this.isPlaying) return;

    this.applyBusLevels();
    if (!this.campfireNode) {
      this.startProceduralCampfire();
    }
    this.playContextualProceduralTrack(this.lastGameState || gameState);
    this.emitStatus();
  }

  async fallbackToProcedural(gameState, reason) {
    if (reason) {
      console.warn(`[Strategy Audio] ${reason}. Falling back to procedural score.`);
    }

    this.clearFileCrossfade();

    if (this.musicTrack) {
      this.musicTrack.pause();
      this.musicTrack = null;
    }

    if (this.fadingOutTrack) {
      this.fadingOutTrack.pause();
      this.fadingOutTrack = null;
    }

    if (this.ambientCampfire) {
      this.ambientCampfire.pause();
      this.ambientCampfire = null;
    }

    if (!this.isPlaying) {
      this.useProcedural = true;
      this.emitStatus();
      return;
    }

    await this.startProceduralPlayback(gameState || this.lastGameState);
  }

  async recoverPlayback() {
    if (!this.isPlaying || !this.lastGameState) return;

    if (this.useProcedural || !this.hasFileLibrary) {
      await this.startProceduralPlayback(this.lastGameState);
      return;
    }

    await this.startFilePlayback(this.lastGameState);
  }

  async startAmbientFileTrack() {
    const ambientTrack = this.availableFileTrackMap.get('ambient_campfire');
    if (!ambientTrack) return;

    if (!this.ambientCampfire || this.ambientCampfire.src !== new URL(ambientTrack.src, window.location.origin).toString()) {
      this.ambientCampfire = new Audio(ambientTrack.src);
      this.ambientCampfire.loop = true;
      this.ambientCampfire.preload = 'auto';
    }

    this.attachMediaElementToBus(this.ambientCampfire, 'ambience');
    this.ambientTrackMixLevel = 1;
    this.applyElementMixLevel(this.ambientCampfire, 'ambience', this.ambientTrackMixLevel);
    try {
      await this.ambientCampfire.play();
    } catch {
      // Ambient bed is optional; keep the main music path authoritative.
    }
  }

  // --- HTML5 Audio Track Switchers ---
  async playContextualFileTrack(gameState) {
    this.lastGameState = gameState || this.lastGameState;
    const targetKey = this.manualTrackOverrideKey || this.pickContextualTrackKey(gameState);
    const targetTrack = this.availableFileTrackMap.get(targetKey)
      || this.availableFileTrackMap.get('battle_cry')
      || this.availableFileTracks.find((track) => track.type === 'music');

    if (!targetTrack) {
      await this.fallbackToProcedural(gameState, 'No verified archive music was playable');
      return;
    }

    const targetSrc = targetTrack.src;
    if (this.musicTrack && this.musicTrack.src.endsWith(targetSrc)) {
      if (this.musicTrack.paused && this.isPlaying) {
        try {
          await this.musicTrack.play();
        } catch (err) {
          await this.fallbackToProcedural(
            gameState,
            `Archive playback restart failed for ${targetTrack.key} (${err?.message || 'unknown error'})`,
          );
          return;
        }
      }
      this.currentTrackTitle = `${targetTrack.title} (Local Archive)`;
      this.currentSourceMode = 'file';
      this.currentTrackMeta = targetTrack;
      this.emitStatus();
      return;
    }

    const previousTrack = this.musicTrack;

    const nextTrack = new Audio(targetSrc);
    nextTrack.loop = true;
    nextTrack.preload = 'auto';
    this.attachMediaElementToBus(nextTrack, 'music');
    this.musicTrackMixLevel = previousTrack ? 0 : 1;
    this.applyElementMixLevel(nextTrack, 'music', this.musicTrackMixLevel);
    nextTrack.addEventListener('error', () => {
      if (this.musicTrack === nextTrack && this.isPlaying) {
        void this.fallbackToProcedural(gameState, `Archive track load failed for ${targetTrack.key}`);
      }
    }, { once: true });

    try {
      await nextTrack.play();
    } catch (err) {
      await this.fallbackToProcedural(
        gameState,
        `Archive playback was blocked for ${targetTrack.key} (${err?.message || 'unknown error'})`,
      );
      return;
    }

    this.musicTrack = nextTrack;
    this.crossfadeFileTracks(nextTrack, previousTrack);
    this.currentTrackTitle = `${targetTrack.title} (Local Archive)`;
    this.currentSourceMode = 'file';
    this.currentTrackMeta = targetTrack;
    this.emitStatus();
  }

  // --- Procedural Synthesis Engine ---
  initWebAudio() {
    if (this.audioContext) return;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    this.audioContext = new AudioContextClass();

    this.masterGainNode = this.audioContext.createGain();
    this.musicBusGainNode = this.audioContext.createGain();
    this.ambienceBusGainNode = this.audioContext.createGain();
    this.stingerBusGainNode = this.audioContext.createGain();

    this.musicBusGainNode.connect(this.masterGainNode);
    this.ambienceBusGainNode.connect(this.masterGainNode);
    this.stingerBusGainNode.connect(this.masterGainNode);
    this.masterGainNode.connect(this.audioContext.destination);
    this.applyBusLevels();
  }

  startProceduralCampfire() {
    if (!this.audioContext) return;

    const bufferSize = this.audioContext.sampleRate * 2; // 2 seconds of buffer
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const data = buffer.getChannelData(0);

    // Generate White Noise
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noiseNode = this.audioContext.createBufferSource();
    noiseNode.buffer = buffer;
    noiseNode.loop = true;

    // Filter to isolate warm, crackling sounds (Bandpass around 400Hz)
    const bandpass = this.audioContext.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.value = 350;
    bandpass.Q.value = 1.0;

    // Gain to modulate crackles over time
    const gainNode = this.audioContext.createGain();
    gainNode.gain.value = 0.035;

    noiseNode.connect(bandpass);
    bandpass.connect(gainNode);
    gainNode.connect(this.getBusGainNode('ambience') || this.masterGainNode);

    noiseNode.start(0);
    this.campfireNode = noiseNode;
  }

  playContextualProceduralTrack(gameState) {
    if (!this.audioContext) return;
    let targetMelody = this.manualTrackOverrideKey || this.pickContextualTrackKey(gameState);
    if (targetMelody === 'dixie') {
      targetMelody = 'march';
    }
    this.tempoBpm = PROCEDURAL_TRACK_INFO[targetMelody]?.tempoBpm || 80;

    if (this.activeMelodyKey === targetMelody) return;
    this.activeMelodyKey = targetMelody;

    this.stopProceduralMelody();
    this.startProceduralMelodySequence(MELODIES[targetMelody]);
    this.currentTrackTitle = `${PROCEDURAL_TRACK_INFO[targetMelody]?.title || targetMelody} (Procedural Archive)`;
    this.currentSourceMode = 'procedural';
    this.currentTrackMeta = null;
    this.emitStatus();
  }

  startProceduralMelodySequence(notes) {
    let noteIndex = 0;
    const beatDuration = 60 / this.tempoBpm; // duration of 1 beat in seconds

    const playNextNote = () => {
      if (!this.isPlaying || !this.audioContext || !this.activeMelodyKey) return;

      const [freq, duration] = notes[noteIndex];
      const noteTime = duration * beatDuration;

      if (freq > 0) {
        // Create fife oscillator node
        const osc = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        // Fife timbre: Triangle oscillator with soft lowpass filter
        osc.type = 'triangle';
        osc.frequency.value = freq;

        // Envelope: soft attack, gentle decay
        gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.35, this.audioContext.currentTime + 0.08); // attack
        gainNode.gain.setValueAtTime(0.35, this.audioContext.currentTime + noteTime - 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + noteTime); // decay

        const filter = this.audioContext.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 1200; // Warm fife cut

        osc.connect(gainNode);
        gainNode.connect(filter);
        filter.connect(this.getBusGainNode('music') || this.masterGainNode);

        osc.start(0);
        osc.stop(this.audioContext.currentTime + noteTime);
      }

      noteIndex = (noteIndex + 1) % notes.length;
      this.sequencerInterval = setTimeout(playNextNote, noteTime * 1000);
    };

    playNextNote();
  }

  playDistantArtilleryBarrage() {
    if (!this.canTriggerEffect('distantArtillery', 2500)) return;
    if (!this.isPlaying || !this.audioContext || this.isMuted) return;

    this.duckWithPreset('stingerBarrage');

    // Helper to fire a single distant thud with stereo panning
    const fireShell = (delayMs, panValue) => {
      this.registerEffectTimeout(() => {
        if (!this.audioContext || this.audioContext.state === 'closed' || this.isMuted) return;
        
        const osc = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        const filter = this.audioContext.createBiquadFilter();

        osc.type = 'sine';
        const now = this.audioContext.currentTime;
        osc.frequency.setValueAtTime(55, now);
        osc.frequency.exponentialRampToValueAtTime(30, now + 1.2);

        // Exponential decay envelope
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(0.4, now + 0.05); // quick attack
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 1.2); // long decay

        // Muffled lowpass filter
        filter.type = 'lowpass';
        filter.frequency.value = 90;
        filter.Q.value = 1.0;

        osc.connect(gainNode);
        gainNode.connect(filter);

        // Safely check for and apply stereo panning node
        if (this.audioContext.createStereoPanner) {
          const panner = this.audioContext.createStereoPanner();
          panner.pan.setValueAtTime(panValue, now);
          filter.connect(panner);
          panner.connect(this.getBusGainNode('stinger') || this.masterGainNode);
        } else {
          filter.connect(this.getBusGainNode('stinger') || this.masterGainNode);
        }

        osc.start(now);
        osc.stop(now + 1.3);
      }, delayMs);
    };

    // Trigger 3 staggered shell thuds spatialized across the stereo soundstage
    fireShell(0, -0.75);   // Left flank battery
    fireShell(350, 0.75);  // Right flank return fire
    fireShell(800, -0.10);  // Near-center counter-battery thud
  }

  playHotspurMartialFlourish() {
    if (!this.canTriggerEffect('hotspurFlourish', 5000)) return;
    if (!this.isPlaying || !this.audioContext || this.isMuted) return;

    this.duckWithPreset('hotspurFlourish');

    const flourishNotes = [
      { freq: NOTES.C5, duration: 0.15 },
      { freq: NOTES.E5, duration: 0.15 },
      { freq: NOTES.G5, duration: 0.15 },
      { freq: NOTES.C6, duration: 0.40 }
    ];

    let accumDelay = 0;
    const now = this.audioContext.currentTime;

    flourishNotes.forEach((note) => {
      const osc = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();
      const filter = this.audioContext.createBiquadFilter();

      osc.type = 'triangle';
      osc.frequency.value = note.freq;

      const noteStart = now + accumDelay;
      const noteEnd = noteStart + note.duration;

      // Sharp fife envelopes at a fast tempo
      gainNode.gain.setValueAtTime(0, noteStart);
      gainNode.gain.linearRampToValueAtTime(0.35, noteStart + 0.02); // very fast attack
      gainNode.gain.setValueAtTime(0.35, noteStart + note.duration - 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.001, noteEnd);

      filter.type = 'lowpass';
      filter.frequency.value = 1800; // Bright martial flourish

      osc.connect(gainNode);
      gainNode.connect(filter);
      filter.connect(this.getBusGainNode('stinger') || this.masterGainNode);

      osc.start(noteStart);
      osc.stop(noteEnd + 0.05);

      accumDelay += note.duration + 0.02; // short gap
    });
  }

  playNextTrack(gameState) {
    if (!this.isPlaying) return;

    let tracks = [];
    let currentKey = null;

    if (this.useProcedural || !this.hasFileLibrary) {
      tracks = Object.keys(PROCEDURAL_TRACK_INFO);
      currentKey = this.activeMelodyKey;
    } else {
      tracks = this.availableFileTracks.filter((t) => t.type === 'music').map((t) => t.key);
      currentKey = this.manualTrackOverrideKey || this.pickContextualTrackKey(gameState);
    }

    if (tracks.length === 0) return;

    let nextIndex = 0;
    if (currentKey) {
      const currentIndex = tracks.indexOf(currentKey);
      if (currentIndex !== -1) {
        nextIndex = (currentIndex + 1) % tracks.length;
      }
    }

    const nextKey = tracks[nextIndex];
    this.manualTrackOverrideKey = nextKey;

    if (this.useProcedural || !this.hasFileLibrary) {
      this.activeMelodyKey = null; // force reload
      this.playContextualProceduralTrack(gameState);
    } else {
      this.playContextualFileTrack(gameState);
    }
  }

  stopProceduralMelody() {
    if (this.sequencerInterval) {
      clearTimeout(this.sequencerInterval);
      this.sequencerInterval = null;
    }
  }
}
