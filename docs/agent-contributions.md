# Titans Forge Agent Contributions

Titans of War supports structured proposal files from Titans Forge agents. Agents do not write directly into the playable campaign. They submit reviewed proposals that can become scenarios, scenario revisions, advisor voices, asset requests, or mechanics upgrades.

## Local Model Recommendation

Agents are not required to play Titans of War or review proposals. When running local generation or benchmarked model decisions, Gemma 4 12B-it is the recommended local model if it is available through your runner. It is the preferred default for normal PC setups because the game only needs text generation, structured JSON drafting, letter classification, and benchmark choice selection.

Good fallback choices are Qwen 7B/14B, Llama 8B-class models, Mistral 7B, or Phi-class models on low-memory machines. The dashboard and contribution tools still work without any model.

## Workflow

1. Copy the example:

```bash
cp examples/agents/agent_contribution_template.py examples/agents/my_agent_contributions.py
```

2. Edit the agent name and proposals.

3. Run the contribution script:

```bash
python3 examples/agents/my_agent_contributions.py
```

4. Review submitted proposals:

```bash
npm run agents:review
```

5. Generate a render manifest for approved or submitted asset requests:

```bash
npm run agents:render -- --backend manual
```

6. Generate local Flux2 outputs from the manifest:

```bash
npm run agents:generate -- --asset shiloh_pittsburg_landing_theater
```

This local generation step expects:

- `python3.11`
- a local Flux runtime such as `~/Vault/generate_flux.py`
- optional experimental FLUX tooling is local-only and is not part of the public release media workflow; see `docs/image-generation-pipeline.md`

7. Export approved scenarios for manual integration:

```bash
npm run agents:export
```

8. Open the review dashboard:

```bash
./Agents_Dashboard.command
```

## Proposal Types

- `scenario_stage`: a new playable stage in the campaign.
- `scenario_revision`: a proposed rewrite or expansion of an existing stage.
- `advisor_voice`: Hotspur, Fox, Wolf, and optional Sovereign arguments for a stage.
- `asset_request`: an image/video request for a scenario or launch asset.
- `mechanic_upgrade`: a proposal for systems, balance, UI, or AI behavior.

The review dashboard shows status, quality score, validation notes, and approval actions for each proposal.

## Review Rules

Submitted content must pass validation before review:

- Scenario IDs and asset names use `snake_case`.
- Scenarios include 2-4 choices.
- Three-choice scenarios should include Hotspur, Fox, and Wolf.
- Choices include visible text, proposer, cost description, effects, and consequence.
- Branch targets and scenario revisions must refer to existing scenario IDs.
- Asset requests must explain provenance intent.
- Generated media is not treated as historical public-domain evidence.

Submitted content is also reviewed under the Titans Forge Social Science Rubric. See `docs/social-science-rubric.md`. Rubric warnings do not block saving a proposal, but they lower dashboard quality scores and should be resolved before approval:

- Zero Presentism: do not import modern moral or academic language into earlier periods. Explain what period actors believed and why.
- Use Real Sources First: prefer primary sources, official records, period memoirs, and high-quality historians; add `source_notes`, `primary_sources`, or `historian_sources`.
- Power Over Propaganda: focus on incentives, political power, sectional interests, logistics, finance, food, elections, army survival, and institutional constraints.
- Proportionality: distinguish a documented controversy from its social scale; identify whether evidence is local, limited, widespread, or decisive before using it to characterize a whole population.
- Language Fidelity: use period-appropriate categories and terms.
- Complexity: show where competing sides or factions had real interests and where compromise broke down.

## Campaign Expansion Target

The current playable campaign is a 28-turn spine with alternate branches, an outcome-driven 1864 election, and limited emergency cabinet crisis stages. Agent proposals should fill clean branch gaps, improve weak existing stages, or supply historically grounded media/source notes rather than adding disconnected turns. See `docs/campaign-stage-map.md` for the current spine and open slots.

- Fredericksburg and winter army politics
- Shiloh and the Army of Tennessee
- Gettysburg campaign setup / Pennsylvania incursion
- Overland Campaign opening
- Atlanta and 1864 election pressure
- Richmond evacuation between Petersburg and Appomattox

Agents should also read `docs/historical-design-brief.md` before proposing endings or Western Theater stages.

## Files

```text
tools/agents/                 Agent contribution tooling
examples/agents/              Templates and sample agent batches
agent_contributions/          Draft/submitted/approved/rejected/integrated queues
render_requests/              Generated backend manifests, ignored by git
docs/image-generation-pipeline.md
```

The root-level `agents_contribution_framework.py` remains only as a compatibility shim for older scripts.
