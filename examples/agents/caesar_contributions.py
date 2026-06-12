#!/usr/bin/env python3
"""Example Caesar agent contribution batch for Titans of War."""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from tools.agents import AgentContributor, ContributionRegistry


def main() -> None:
    caesar = AgentContributor("caesar_agent")

    richmond_stage = caesar.create_scenario_stage(
        scenario_id="richmond_evacuation",
        turn=19,
        title="Richmond Evacuation - The Capital Burns",
        date="April 2-3, 1865",
        actor="General Robert E. Lee",
        roleLabel="Army Commander",
        description=(
            "The Petersburg line has cracked and Richmond can no longer be defended as a "
            "capital, depot, and symbol at the same time. Fires are spreading near the "
            "warehouses, government clerks are trying to move records south, and Davis needs "
            "the army preserved long enough to keep any national authority alive. Lee must "
            "decide whether Richmond is worth one more stand, whether the army should move "
            "immediately toward Amelia Court House, or whether the evacuation itself can be "
            "used to shape the final political terms of the war."
        ),
        letterTarget="President Jefferson Davis",
        choices=[
            {
                "id": "option_a",
                "text": "Hold a short rearguard defense at Richmond to buy the government more time.",
                "proposer": "hotspur",
                "costDescription": "Severe military cost, temporary morale and political cover.",
                "effects": {
                    "metrics": {"militaryStrength": -28, "munitions": -18, "publicMorale": 10},
                    "shards": {"hotspur": 25, "fox": -15},
                },
                "consequence": (
                    "The delay lets more officials escape, but every hour spent near the capital "
                    "risks trapping the Army of Northern Virginia against converging Union columns."
                ),
            },
            {
                "id": "option_b",
                "text": "Evacuate immediately and preserve the army for a linkup farther south.",
                "proposer": "fox",
                "costDescription": "Preserves strength, morale shock from abandoning the capital.",
                "effects": {
                    "metrics": {"militaryStrength": 8, "munitions": 4, "publicMorale": -18},
                    "shards": {"fox": 28, "hotspur": -15},
                },
                "consequence": (
                    "The army leaves Richmond before the roads fully close. The decision is bleak, "
                    "but it keeps organized command alive for at least one more march."
                ),
            },
            {
                "id": "option_c",
                "text": "Frame the evacuation as disciplined national continuity and seek mediated terms.",
                "proposer": "wolf",
                "costDescription": "Treasury cost, diplomatic divergence, limited battlefield relief.",
                "effects": {
                    "metrics": {"treasury": -15, "publicMorale": 6, "divergenceIndex": 0.08},
                    "shards": {"wolf": 30, "hotspur": -8},
                },
                "consequence": (
                    "Dispatches emphasize order rather than collapse. The military situation remains "
                    "desperate, but foreign and Northern political readers see a government still "
                    "trying to negotiate rather than dissolve."
                ),
            },
            {
                "id": "option_d",
                "text": "Destroy military stores, protect civilian corridors, and move by night.",
                "proposer": "sovereign",
                "costDescription": "Moderate supply loss, stronger civilian legitimacy.",
                "effects": {
                    "metrics": {"munitions": -12, "publicMorale": 12, "treasury": -8},
                    "shards": {"fox": 12, "wolf": 12},
                },
                "consequence": (
                    "The army loses stores it cannot carry, but fewer civilians are abandoned to the "
                    "fires and confusion. The retreat begins with more order than Richmond expected."
                ),
            },
        ],
        historical_context=(
            "Richmond fell on April 3, 1865 after the Petersburg breakthrough. This proposal "
            "creates a playable decision between Petersburg and Appomattox."
        ),
        designer_notes="Likely fits as a late-game branch or new stage before Appomattox.",
    )

    richmond_asset = caesar.request_asset(
        asset_name="richmond_evacuation_theater",
        scene_description=(
            "A wide Civil War theater image of Confederate columns leaving Richmond as warehouse "
            "fires glow behind them, with civilians and government wagons moving through smoky roads."
        ),
        historical_period="April 1865",
        style="period-art",
        prompt=(
            "Richmond evacuation April 1865, Confederate columns withdrawing at night, warehouse "
            "fires in the distance, government wagons, civilians on smoky roads, historically "
            "accurate 1860s uniforms, period lithograph style, dramatic wide 16:9 composition, "
            "no modern objects, no text, no watermark."
        ),
        proposed_roles=["theater", "chronicle"],
        best_for_scenarios=["richmond_evacuation"],
        preferred_backend="manual",
        compatible_backends=["manual"],
        reference_url="https://www.nps.gov/rich/learn/historyculture/the-fall-of-richmond.htm",
        provenance_intent="Generated art request; must be labeled generated and reviewed before active use.",
    )

    supply_upgrade = caesar.propose_mechanic_upgrade(
        title="Retreat Supply Integrity",
        description=(
            "Add a late-war supply integrity pressure that rises when the army retreats through "
            "broken rail nodes or loses depots. It would make Petersburg, Richmond evacuation, "
            "and Appomattox feel connected instead of isolated set pieces."
        ),
        impact_area="strategy",
        implementation_priority="normal",
        affected_systems=["simulationEngine", "scenarios", "App.jsx"],
        compatibility_notes="Should be optional or folded into existing treasury/munitions metrics for launch.",
        estimated_work="2-4 hours",
    )

    for proposal in (richmond_stage, richmond_asset, supply_upgrade):
        caesar.save(proposal)

    print(caesar.summary())
    ContributionRegistry().print_review_queue()


if __name__ == "__main__":
    main()
