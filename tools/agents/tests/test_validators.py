"""Tests for the agent contribution schema validators."""

from __future__ import annotations

import sys
from pathlib import Path

try:
    import pytest
except ImportError:
    pytest = None

REPO_ROOT = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(REPO_ROOT))

from tools.agents.validators import (
    validate_advisor_voice,
    validate_asset_request,
    validate_choice,
    validate_envelope,
    validate_scenario_stage,
)


def well_formed_choice(**overrides):
    base = {
        "id": "option_a",
        "text": "Force the line to hold at Henry Hill regardless of cost.",
        "proposer": "hotspur",
        "costDescription": "Heavy military cost, large morale upside",
        "consequence": "The line holds under heavy bombardment and the Confederate left stabilizes for the moment.",
        "effects": {
            "metrics": {"militaryStrength": -15, "publicMorale": 20},
            "shards": {"hotspur": 20, "fox": -5},
        },
    }
    base.update(overrides)
    return base


def test_envelope_requires_known_type():
    errors = validate_envelope({"type": "made_up", "status": "draft", "agent": "test_agent", "content": {}})
    assert any("type must be" in e for e in errors)


def test_envelope_requires_snake_case_agent():
    errors = validate_envelope({"type": "scenario_stage", "status": "draft", "agent": "BadName", "content": {}})
    assert any("agent must be snake_case" in e for e in errors)


def test_choice_proposer_must_be_known():
    errors = validate_choice(well_formed_choice(proposer="general"), 0)
    assert any("proposer must be one of" in e for e in errors)


def test_choice_metric_out_of_range_is_caught():
    bad = well_formed_choice(effects={"metrics": {"militaryStrength": 500}, "shards": {}})
    errors = validate_choice(bad, 0)
    assert any("metric militaryStrength" in e for e in errors)


def test_scenario_requires_hotspur_fox_wolf_when_three_or_more_choices():
    content = {
        "scenario_id": "test_stage",
        "title": "Test Stage",
        "date": "May 5, 1863",
        "actor": "President Davis",
        "roleLabel": "Civil Executive",
        "description": (
            "A scenario description that is long enough to pass the minimum description "
            "length validator imposed by validate_scenario_stage in the schema layer."
        ),
        "letterTarget": "the governors",
        "choices": [
            well_formed_choice(id="option_a", proposer="hotspur"),
            well_formed_choice(id="option_b", proposer="hotspur"),
            well_formed_choice(id="option_c", proposer="hotspur"),
        ],
    }
    errors = validate_scenario_stage(content, existing_ids=set())
    assert any("hotspur, fox, and wolf" in e for e in errors)


def test_scenario_choice_ids_must_be_unique():
    content = {
        "scenario_id": "test_stage_unique",
        "title": "Test Stage Unique",
        "date": "May 5, 1863",
        "actor": "President Davis",
        "roleLabel": "Civil Executive",
        "description": "A description of suitable length that easily clears the 160-character floor required of every authored scenario stage contributed by a Titans Forge agent.",
        "letterTarget": "the governors",
        "choices": [
            well_formed_choice(id="option_a", proposer="hotspur"),
            well_formed_choice(id="option_a", proposer="fox"),
        ],
    }
    errors = validate_scenario_stage(content, existing_ids=set())
    assert any("choice ids must be unique" in e for e in errors)


def test_advisor_voice_requires_each_voice():
    content = {
        "scenario_id": "fort_sumter",
        "voices": {"hotspur": "short", "fox": "", "wolf": ""},
    }
    errors = validate_advisor_voice(content, existing_ids={"fort_sumter"})
    assert sum(1 for e in errors if "voice" in e) >= 3


def test_asset_request_rejects_short_prompt():
    content = {
        "asset_name": "test_asset",
        "scene_description": "A scene description that is long enough to pass the minimum description threshold for assets.",
        "historical_period": "1862",
        "style": "period-art",
        "proposed_roles": ["theater"],
        "best_for_scenarios": ["antietam"],
        "provenance_intent": "Generated media; reviewer must verify provenance before active use.",
        "rendering": {
            "preferred_backend": "flux2",
            "compatible_backends": ["flux2"],
            "prompt": "too short",
            "aspect_ratio": "16:9",
        },
    }
    errors = validate_asset_request(content)
    assert any("prompt should be at least" in e for e in errors)


if __name__ == "__main__":
    if pytest is not None:
        pytest.main([__file__, "-v"])
    else:
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
