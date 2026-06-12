"""Tests for the Titans Forge Social Science Rubric.

The rubric is a hard rule on every Titans Forge agent contribution. These
tests pin down the behaviour the project relies on: Zero Presentism is a
blocker on every proposal type, source notes need real citations, and the
power/complexity heuristics no longer pass on a single keyword.
"""

from __future__ import annotations

import sys
from pathlib import Path

try:
    import pytest
except ImportError:  # allow lightweight stdlib runs in environments without pytest
    pytest = None

REPO_ROOT = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(REPO_ROOT))

from tools.agents.social_science_rubric import (
    rubric_blockers,
    rubric_status,
    rubric_warnings,
    source_note_present,
)


def make_scenario(**overrides):
    base = {
        "type": "scenario_stage",
        "status": "draft",
        "agent": "test_agent",
        "content": {
            "scenario_id": "sample_turn",
            "title": "Sample Turn",
            "date": "May 5, 1863",
            "actor": "President Davis",
            "roleLabel": "Civil Executive",
            "description": (
                "Cabinet pressure is rising while the army worries about food, rail, "
                "and munitions. However, governors and treasury officials push back "
                "against fresh impressments. The compromise on enlistment terms has "
                "broken down while bond confidence is fraying. The cabinet must decide."
            ),
            "letterTarget": "the governors",
            "choices": [],
            "source_notes": (
                "OR ser. 1 vol. 25 pt. 1 pp. 100-200; Freeman, R.E. Lee vol. III ch. 4; "
                "Foote, The Civil War vol. II pp. 412-430."
            ),
        },
    }
    content_overrides = overrides.pop("content", {})
    base["content"].update(content_overrides)
    base.update(overrides)
    return base


def test_presentism_is_blocked_on_scenario():
    proposal = make_scenario(content={"description": "We must address systemic racism in 1862 Richmond."})
    blockers = rubric_blockers(proposal)
    assert any("systemic racism" in b.lower() for b in blockers)


def test_presentism_is_blocked_on_mechanic_upgrade():
    proposal = {
        "type": "mechanic_upgrade",
        "status": "draft",
        "agent": "test_agent",
        "content": {
            "title": "Equity tracker",
            "description": "Tracks equity across factions and centers marginalized voices.",
            "impact_area": "scoring",
            "affected_systems": ["scoring"],
        },
    }
    blockers = rubric_blockers(proposal)
    assert blockers, "Zero Presentism must apply to every proposal type."


def test_presentism_is_blocked_on_asset_request():
    proposal = {
        "type": "asset_request",
        "status": "draft",
        "agent": "test_agent",
        "content": {
            "asset_name": "lincoln_portrait",
            "scene_description": "A portrait centering whiteness in 1862 Washington.",
            "historical_period": "1862",
            "style": "portrait",
            "proposed_roles": ["theater"],
            "best_for_scenarios": ["fort_sumter"],
            "provenance_intent": "Generated media; reviewer must verify.",
            "rendering": {
                "preferred_backend": "flux2",
                "compatible_backends": ["flux2"],
                "prompt": "A portrait of President Lincoln in his cabinet room, 1862.",
                "aspect_ratio": "16:9",
            },
        },
    }
    assert rubric_blockers(proposal), "Asset requests must also be screened."


def test_clean_scenario_has_no_blockers():
    assert rubric_blockers(make_scenario()) == []


def test_source_note_requires_real_citation():
    weak = {"source_notes": "see secondary sources for context"}
    strong = {
        "source_notes": (
            "OR ser. 1 vol. 19 pt. 1 p. 142; Freeman, R.E. Lee vol. II ch. 25."
        )
    }
    assert not source_note_present(weak)
    assert source_note_present(strong)


def test_year_in_source_note_counts_as_real():
    assert source_note_present({"source_notes": "Lee's letterbook entry, June 1862, p. 78."})


def test_complexity_requires_multiple_terms():
    proposal = make_scenario(
        content={
            "description": (
                "However, this is the only complexity hint in this description otherwise "
                "the body avoids any other framing language entirely so we can confirm one "
                "marker alone is insufficient to satisfy the rubric heuristic."
            ),
            "source_notes": "OR ser. 1 vol. 1 p. 14; Channing 1905.",
        }
    )
    warnings = rubric_warnings(proposal)
    assert any("Complexity" in w for w in warnings)


def test_rubric_status_marks_savable_when_clean():
    status = rubric_status(make_scenario())
    assert status["savable"] is True
    assert status["blockers"] == []


def test_rubric_status_marks_unsavable_on_presentism():
    proposal = make_scenario(content={"description": "white privilege drove the bond panic."})
    status = rubric_status(proposal)
    assert status["savable"] is False


def test_controversy_without_scale_gets_proportionality_warning():
    proposal = make_scenario()
    proposal["content"]["historical_context"] = (
        "The exemption controversy produced outrage and resistance across the state. "
        "Army logistics, governor pressure, and enlistment policy shaped the dispute."
    )
    warnings = rubric_warnings(proposal)
    assert any("Proportionality" in warning for warning in warnings)


if __name__ == "__main__":
    if pytest is not None:
        pytest.main([__file__, "-v"])
    else:
        # Minimal stdlib-only test runner so the suite can be exercised in
        # environments where pytest is not installed.
        import traceback

        cases = [(name, obj) for name, obj in globals().items() if name.startswith("test_") and callable(obj)]
        passed = 0
        failed = []
        for name, fn in cases:
            try:
                fn()
            except Exception:
                failed.append((name, traceback.format_exc()))
            else:
                passed += 1
        print(f"{passed}/{len(cases)} passed")
        for name, tb in failed:
            print(f"FAIL: {name}\n{tb}")
        sys.exit(1 if failed else 0)
