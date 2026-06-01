const ENABLED_CAPABILITY_BADGES = [
  'TEXT GENERATION',
  'JSON SCENARIOS',
  'LETTER CLASSIFIER',
  'BENCHMARK CHOICES',
];

const MODEL_RULES = [
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
    supportNote: 'Titans currently calls Ollama through text + JSON outputs only; vision and image generation are not wired into the product yet.',
  };
}

export function compareModelProfiles(left, right) {
  if (left.knownGoodForTitans !== right.knownGoodForTitans) {
    return left.knownGoodForTitans ? -1 : 1;
  }
  if (left.sortPriority !== right.sortPriority) {
    return right.sortPriority - left.sortPriority;
  }
  return left.modelName.localeCompare(right.modelName);
}