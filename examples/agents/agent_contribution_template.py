#!/usr/bin/env python3
"""Starter template for a Titans Forge agent contribution batch."""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from tools.agents import AgentContributor, ContributionRegistry


def main() -> None:
    agent = AgentContributor("your_agent_name")

    stage = agent.create_scenario_stage(
        scenario_id="example_campaign_stage",
        turn=15,
        title="Example Campaign Stage - Decision Name",
        date="Month Day, Year",
        actor="Historical commander or official",
        roleLabel="Player role label",
        description=(
            "Write the playable historical situation here. Explain the operational setting, "
            "the political pressure, what the player can still influence, and why the next "
            "choice matters. The description should be long enough to teach the moment."
        ),
        letterTarget="the person receiving the optional player letter",
        choices=[
            {
                "id": "option_a",
                "text": "Take the aggressive battlefield option with a clear operational purpose.",
                "proposer": "hotspur",
                "costDescription": "High combat cost, high morale upside.",
                "effects": {
                    "metrics": {"militaryStrength": -18, "munitions": -12, "publicMorale": 18},
                    "shards": {"hotspur": 25, "fox": -10},
                },
                "consequence": (
                    "The aggressive option creates a visible battlefield result, but it spends "
                    "men and ammunition that may be needed in the next stage."
                ),
            },
            {
                "id": "option_b",
                "text": "Choose the conservative logistical option that preserves the army.",
                "proposer": "fox",
                "costDescription": "Preserves strength, limited immediate glory.",
                "effects": {
                    "metrics": {"militaryStrength": 6, "munitions": 6, "publicMorale": -5},
                    "shards": {"fox": 25, "hotspur": -12},
                },
                "consequence": (
                    "The army remains more coherent, but newspapers and political allies may "
                    "read restraint as a missed opportunity."
                ),
            },
            {
                "id": "option_c",
                "text": "Turn the military situation into diplomatic or political leverage.",
                "proposer": "wolf",
                "costDescription": "Treasury cost, diplomatic upside, moderate divergence.",
                "effects": {
                    "metrics": {"treasury": -12, "publicMorale": 8, "divergenceIndex": 0.05},
                    "shards": {"wolf": 25, "hotspur": -5},
                },
                "consequence": (
                    "The move does not decide the battlefield by itself, but it changes how "
                    "foreign observers and domestic factions interpret the campaign."
                ),
            },
        ],
        historical_context="What happened historically and where this scenario diverges.",
        source_notes=(
            "List primary sources or historians used. Prefer period documents, official records, "
            "memoirs close to the event, and serious historians over modern ideological summaries."
        ),
        power_analysis=(
            "Name the actual incentives: command authority, railroads, food, treasury, governors, "
            "elections, sectional interests, foreign leverage, or army survival."
        ),
        complexity_note=(
            "Explain what each side or faction believed it was protecting, and where compromise "
            "or command consensus broke down."
        ),
        designer_notes=(
            "Apply the Titans Forge Social Science Rubric: zero presentism, real sources first, "
            "power over propaganda, period language, and complexity."
        ),
    )

    asset = agent.request_asset(
        asset_name="example_campaign_stage_theater",
        scene_description=(
            "A historically grounded wide theater image for the stage, showing the command "
            "problem without fake modern props or anachronistic uniforms."
        ),
        historical_period="Month Year",
        style="period-art",
        prompt=(
            "Civil War command scene, 1860s period illustration style, historically accurate "
            "uniforms and terrain, wide 16:9 composition, dramatic but readable battlefield "
            "atmosphere, no modern objects, no text, no watermark."
        ),
        proposed_roles=["theater", "chronicle"],
        best_for_scenarios=["example_campaign_stage"],
        preferred_backend="manual",
        compatible_backends=["manual"],
        provenance_intent="Generated media; reviewed before active use and labeled as generated art.",
        design_notes=(
            "Use period uniforms, weapons, terrain, and symbols. Do not use modern political visual language."
        ),
    )

    revision = agent.propose_scenario_revision(
        target_scenario_id="chancellorsville_maneuver",
        problem="The stage could use more explanation of the Lee/Jackson command split.",
        proposed_change=(
            "Add a stronger operational note about Sedgwick at Fredericksburg, Hooker's "
            "exposed right, and the danger of losing command control in the Wilderness."
        ),
    )

    for proposal in (stage, asset, revision):
        agent.save(proposal)

    print(agent.summary())
    ContributionRegistry().print_review_queue()


if __name__ == "__main__":
    main()
