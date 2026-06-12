# Local Model Guide

Titans of War is playable without any AI model. Local models are optional and are used only for agent contribution drafting, benchmark decision selection, letter classification, and in-game scenario generation through Ollama-compatible text APIs.

## Recommended

Gemma 4 12B-it is the recommended local model for Titans Forge workflows when it is available in your local runner.

- Model ID: `google/gemma-4-12B-it`
- Best use here: structured scenario drafting, JSON proposal generation, benchmark choice selection, and local agent review
- Why it fits: stronger reasoning than small models while still targeting ordinary enthusiast PC setups better than very large local models

## Good Alternatives

- Qwen 7B/14B: strong structured JSON and scenario drafting
- Llama 8B-class models: broad compatibility and easy local setup
- Mistral 7B: fast text generation on modest hardware
- Phi-class models: fallback for low-memory machines

## Benchmarking

Use the benchmark runner to compare installed local models against the scripted policy baselines:

```bash
npm run benchmark -- --models installed --seeds 1861,1862
```

You can also pass specific local model names exposed by your runner:

```bash
npm run benchmark -- --models gemma4:12b-it,qwen2.5:7b --seeds 1861,1862
```

If a model name is not available in your runner yet, keep the game in scripted mode and benchmark another installed chat model.
