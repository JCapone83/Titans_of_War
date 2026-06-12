#!/usr/bin/env python3
"""Historian agent proposals for Western Theater and ending realism."""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from tools.agents import AgentContributor, ContributionRegistry


def main() -> None:
    historian = AgentContributor("historian_agent")

    shiloh = historian.create_scenario_stage(
        scenario_id="shiloh_army_of_tennessee",
        turn=5,
        title="Shiloh - The Army of Tennessee",
        date="April 6-7, 1862",
        actor="General Albert Sidney Johnston",
        roleLabel="Western Theater Commander",
        description=(
            "Grant's army is exposed near Pittsburg Landing, and Confederate columns have "
            "achieved surprise after a difficult concentration through the Tennessee woods. "
            "The opportunity is enormous: a decisive victory could throw Union forces back "
            "from the river, protect Western Tennessee, and give the Army of Tennessee a "
            "cohesive commander before the Western Theater fractures into missed chances. "
            "But the attack is disordered, corps commanders are hard to control, industry "
            "and rail access behind the army are already under pressure, and Johnston's own "
            "presence at the front risks the one leader who might hold the Western army together."
        ),
        letterTarget="President Jefferson Davis",
        choices=[
            {
                "id": "option_a",
                "text": "Press Johnston forward personally to drive Grant away from Pittsburg Landing.",
                "proposer": "hotspur",
                "costDescription": "High command risk, high chance of decisive battlefield shock.",
                "effects": {
                    "metrics": {"militaryStrength": -18, "munitions": -12, "publicMorale": 24, "divergenceIndex": 0.08},
                    "shards": {"hotspur": 28, "fox": -12},
                },
                "consequence": (
                    "The assault gains terrifying momentum, but the army's cohesion depends on "
                    "Johnston remaining alive and visible in the smoke. Victory and catastrophe "
                    "are now dangerously close together."
                ),
            },
            {
                "id": "option_b",
                "text": "Keep Johnston behind the main line and impose a tighter command reserve.",
                "proposer": "fox",
                "costDescription": "Less immediate shock, better chance of preserving Western command cohesion.",
                "effects": {
                    "metrics": {"militaryStrength": 6, "munitions": -6, "publicMorale": 4},
                    "shards": {"fox": 28, "hotspur": -10},
                },
                "consequence": (
                    "The attack loses some fury, but the army keeps a clearer chain of command. "
                    "The larger strategic prize is not just one field; it is whether the Western "
                    "army can become something more coherent than a temporary coalition."
                ),
            },
            {
                "id": "option_c",
                "text": "Exploit the victory narrative to seek European mediation and Northern peace pressure.",
                "proposer": "wolf",
                "costDescription": "Treasury cost, diplomatic divergence, limited tactical coordination.",
                "effects": {
                    "metrics": {"treasury": -14, "publicMorale": 10, "divergenceIndex": 0.06},
                    "shards": {"wolf": 26, "hotspur": -4},
                },
                "consequence": (
                    "Dispatches frame Shiloh as proof that the Union cannot easily conquer the "
                    "Mississippi Valley. Foreign recognition remains distant, but mediation talk "
                    "becomes easier when the Western war looks undecided."
                ),
            },
            {
                "id": "option_d",
                "text": "Prioritize river crossings, rail depots, and industrial evacuation over pursuit.",
                "proposer": "sovereign",
                "costDescription": "Lower glory, stronger Western logistics and industry preservation.",
                "effects": {
                    "metrics": {"munitions": 10, "treasury": 8, "publicMorale": -5},
                    "shards": {"fox": 14, "wolf": 8},
                },
                "consequence": (
                    "The army gives up part of the pursuit to protect what makes campaigning in "
                    "the West possible: river access, workshops, depots, and rail movement. It is "
                    "less dramatic than a battlefield rout, but strategically harder to replace."
                ),
            },
        ],
        historical_context=(
            "Shiloh exposed the stakes of the Western Theater. Albert Sidney Johnston's death "
            "and the failure to turn surprise into decisive theater control helped leave the "
            "Army of Tennessee without the cohesion Lee later achieved in Virginia."
        ),
        designer_notes=(
            "Use this as the first major Western Theater stage. It should feed Chickamauga, "
            "Chattanooga, Atlanta/election pressure, and late-war supply collapse."
        ),
    )

    ending_revision = historian.propose_scenario_revision(
        target_scenario_id="appomattox_decision",
        problem=(
            "The current ending options are playable, but future expansion needs a clearer "
            "distinction between full Confederate independence, negotiated peace, conditional "
            "reunion, parole, and fragmented resistance."
        ),
        proposed_change=(
            "Revise the ending model so full independence requires both decisive Confederate "
            "field success and British/French intervention or a major Northern political break. "
            "Marginal Confederate improvement should more often produce status quo peace, "
            "Peace Democrat armistice pressure, reunion with conditions, or ambiguous negotiated "
            "settlement. Add possible ending classes for Status Quo Peace, Foreign Mediation, "
            "Peace Democrat Armistice, Monroe Doctrine Diversion, Reunion with Conditions, and "
            "Recognized Independence."
        ),
        designer_notes=(
            "See docs/historical-design-brief.md. Avoid implying that doing somewhat better in "
            "the field automatically creates recognized Confederate sovereignty."
        ),
    )

    shiloh_asset = historian.request_asset(
        asset_name="shiloh_pittsburg_landing_theater",
        scene_description=(
            "A wide Western Theater battle image showing the wooded chaos near Shiloh and "
            "Pittsburg Landing, with Confederate columns pushing through smoke while river "
            "transports and Union defensive pressure remain visible in the distance."
        ),
        historical_period="April 1862",
        style="period-art",
        prompt=(
            "Battle of Shiloh April 1862, Western Theater Civil War battle in dense Tennessee "
            "woods, Confederate columns advancing through smoke, Pittsburg Landing riverboats "
            "in the distance, chaotic command scene, historically accurate uniforms, 19th "
            "century battlefield lithograph style, wide 16:9 composition, no modern objects, "
            "no text, no watermark."
        ),
        proposed_roles=["theater", "chronicle"],
        best_for_scenarios=["shiloh_army_of_tennessee"],
        preferred_backend="manual",
        compatible_backends=["manual"],
        provenance_intent="Generated art request; must be labeled generated and reviewed before active use.",
    )

    for proposal in (shiloh, ending_revision, shiloh_asset):
        historian.save(proposal)

    print(historian.summary())
    ContributionRegistry().print_review_queue()


if __name__ == "__main__":
    main()
