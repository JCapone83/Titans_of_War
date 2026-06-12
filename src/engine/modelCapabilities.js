const ENABLED_CAPABILITY_BADGES = [
  'TEXT GENERATION',
  'JSON SCENARIOS',
  'LETTER CLASSIFIER',
  'BENCHMARK CHOICES',
];

export const RECOMMENDED_LOCAL_MODEL = {
  displayName: 'Gemma 4 12B-it',
  huggingFaceId: 'google/gemma-4-12B-it',
  ollamaTag: 'gemma4:12b-it',
  role: 'Recommended local model for Titans of War agents and optional in-game local AI.',
  // Gemma 4 12B-it released only days before this build. The Ollama registry
  // typically lags upstream releases by several days. Until the tag is live,
  // the runtime will discover any installed chat model and adapt — Qwen,
  // Llama, Mistral, or Phi all work as interim contestants.
  availabilityNote: 'Gemma 4 12B-it is the right recommendation. The official Ollama tag may take a few days to publish after upstream release; until then, use any of the fallback families below.',
  fallbackFamilies: ['Qwen 7B/14B', 'Llama 8B', 'Mistral 7B', 'Phi on low-memory machines'],
};

const MODEL_RULES = [
  {
    pattern: /(gemma[-_: ]?4.*12b|gemma4.*12b|google\/gemma-4-12b-it)/i,
    familyLabel: 'Gemma 4 12B-it',
    knownGoodForTitans: true,
    recommendedForTitans: true,
    sortPriority: 130,
    accentColor: 'var(--accent-gold)',
    dotColor: '#facc15',
    statusPrefix: 'Gemma 4 12B recommended model active',
    supportNote: 'Recommended local model for normal PCs when available through your local runner. Titans uses text + JSON outputs only; vision and image generation are not wired into the product.',
  },
  {
    pattern: /gemma/i,
    familyLabel: 'Gemma',
    knownGoodForTitans: true,
    sortPriority: 100,
    accentColor: 'var(--accent-gold)',
    dotColor: '#d4af37',
    statusPrefix: 'Gemma active',
  },
  {
    pattern: /qwen/i,
    familyLabel: 'Qwen',
    knownGoodForTitans: true,
    sortPriority: 95,
    accentColor: 'var(--accent-blue)',
    dotColor: '#3b82f6',
    statusPrefix: 'Qwen active',
  },
  {
    pattern: /llama/i,
    familyLabel: 'Llama',
    knownGoodForTitans: true,
    sortPriority: 90,
    accentColor: 'var(--accent-green)',
    dotColor: '#10b981',
    statusPrefix: 'Llama active',
  },
  {
    pattern: /mistral/i,
    familyLabel: 'Mistral',
    knownGoodForTitans: true,
    sortPriority: 85,
    accentColor: 'var(--accent-blue)',
    dotColor: '#60a5fa',
    statusPrefix: 'Mistral active',
  },
  {
    pattern: /(deepseek|janus)/i,
    familyLabel: 'DeepSeek / Janus',
    knownGoodForTitans: true,
    sortPriority: 80,
    accentColor: 'var(--accent-blue)',
    dotColor: '#2563eb',
    statusPrefix: 'DeepSeek / Janus active',
  },
  {
    pattern: /phi/i,
    familyLabel: 'Phi',
    knownGoodForTitans: true,
    sortPriority: 75,
    accentColor: 'var(--accent-gold)',
    dotColor: '#eab308',
    statusPrefix: 'Phi active',
  },
];

const DEFAULT_PROFILE = {
  familyLabel: 'Other Local Model',
  knownGoodForTitans: false,
  sortPriority: 10,
  accentColor: 'var(--text-secondary)',
  dotColor: '#9ca3af',
  statusPrefix: 'Local model active',
};

function findRule(modelName) {
  return MODEL_RULES.find((rule) => rule.pattern.test(modelName || '')) || DEFAULT_PROFILE;
}

export function resolveModelProfile(modelName) {
  const rule = findRule(modelName);
  const capabilities = {
    textGeneration: true,
    jsonScenarioGeneration: true,
    letterClassification: true,
    visionUnderstanding: false,
    imageGeneration: false,
    benchmarkDecisionSelector: true,
    knownGoodForTitans: rule.knownGoodForTitans,
  };

  return {
    ...rule,
    modelName,
    capabilities,
    enabledCapabilityBadges: [...ENABLED_CAPABILITY_BADGES],
    limitations: ['NO VISION PIPELINE', 'NO IMAGE PIPELINE'],
    statusLine: `${rule.statusPrefix} — text scenario generation, structured JSON drafting, letter classification, and benchmark decision selection are available.`,
    supportNote: rule.supportNote || 'Titans currently calls Ollama through text + JSON outputs only; vision and image generation are not wired into the product yet.',
    recommendedForTitans: Boolean(rule.recommendedForTitans),
    recommendationLabel: rule.recommendedForTitans
      ? 'RECOMMENDED LOCAL MODEL'
      : rule.knownGoodForTitans
        ? 'SUPPORTED LOCAL MODEL'
        : 'UNTESTED LOCAL MODEL',
  };
}

export function compareModelProfiles(left, right) {
  if (left.recommendedForTitans !== right.recommendedForTitans) {
    return left.recommendedForTitans ? -1 : 1;
  }
  if (left.knownGoodForTitans !== right.knownGoodForTitans) {
    return left.knownGoodForTitans ? -1 : 1;
  }
  if (left.sortPriority !== right.sortPriority) {
    return right.sortPriority - left.sortPriority;
  }
  return left.modelName.localeCompare(right.modelName);
}
