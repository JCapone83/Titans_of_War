"""Validation rules for Titans Forge agent proposals."""

from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Any

from .schemas import (
    ASPECT_RATIOS,
    ASSET_REQUIRED_FIELDS,
    ASSET_ROLES,
    ASSET_STYLES,
    BACKEND_STATUS,
    CHOICE_REQUIRED_FIELDS,
    CONTRIBUTION_TYPES,
    METRIC_RANGES,
    PRIMER_REQUIRED_FIELDS,
    PROPOSAL_STATUSES,
    SCENARIO_REQUIRED_FIELDS,
    SHARD_RANGE,
    VALID_PROPOSERS,
)

SNAKE_CASE_RE = re.compile(r"^[a-z][a-z0-9_]*$")


def is_snake_case(value: str) -> bool:
    return bool(SNAKE_CASE_RE.match(value or ""))


def load_existing_scenario_ids(repo_root: Path = Path(".")) -> set[str]:
    scenarios_file = repo_root / "src" / "game" / "scenarios.js"
    if not scenarios_file.exists():
        return set()
    text = scenarios_file.read_text(encoding="utf-8")
    return set(re.findall(r'id:\s*"([a-zA-Z0-9_-]+)"', text))


def validate_envelope(proposal: dict[str, Any]) -> list[str]:
    errors: list[str] = []
    if proposal.get("type") not in CONTRIBUTION_TYPES:
        errors.append(f"type must be one of {sorted(CONTRIBUTION_TYPES)}")
    if proposal.get("status") not in PROPOSAL_STATUSES:
        errors.append(f"status must be one of {sorted(PROPOSAL_STATUSES)}")
    if not is_snake_case(proposal.get("agent", "")):
        errors.append("agent must be snake_case")
    if not isinstance(proposal.get("content"), dict):
        errors.append("content must be an object")
    return errors


def validate_choice(choice: dict[str, Any], index: int) -> list[str]:
    errors: list[str] = []
    missing = CHOICE_REQUIRED_FIELDS - set(choice)
    if missing:
        errors.append(f"choice {index}: missing fields {sorted(missing)}")

    if choice.get("proposer") not in VALID_PROPOSERS:
        errors.append(f"choice {index}: proposer must be one of {sorted(VALID_PROPOSERS)}")

    if not is_snake_case(choice.get("id", "")):
        errors.append(f"choice {index}: id must be snake_case")

    if len(choice.get("text", "")) < 20:
        errors.append(f"choice {index}: text should be at least 20 characters")
    if len(choice.get("consequence", "")) < 40:
        errors.append(f"choice {index}: consequence should be at least 40 characters")

    effects = choice.get("effects", {})
    if not isinstance(effects, dict):
        errors.append(f"choice {index}: effects must be an object")
        return errors

    metrics = effects.get("metrics", {})
    if metrics and not isinstance(metrics, dict):
        errors.append(f"choice {index}: effects.metrics must be an object")
    for key, value in metrics.items() if isinstance(metrics, dict) else []:
        if key not in METRIC_RANGES:
            errors.append(f"choice {index}: invalid metric {key}")
            continue
        low, high = METRIC_RANGES[key]
        if not isinstance(value, (int, float)) or value < low or value > high:
            errors.append(f"choice {index}: metric {key} must be between {low} and {high}")

    shards = effects.get("shards", {})
    if shards and not isinstance(shards, dict):
        errors.append(f"choice {index}: effects.shards must be an object")
    for key, value in shards.items() if isinstance(shards, dict) else []:
        if key not in VALID_PROPOSERS:
            errors.append(f"choice {index}: invalid shard target {key}")
            continue
        low, high = SHARD_RANGE
        if not isinstance(value, (int, float)) or value < low or value > high:
            errors.append(f"choice {index}: shard {key} must be between {low} and {high}")

    return errors


def validate_scenario_stage(content: dict[str, Any], existing_ids: set[str] | None = None, allow_existing: bool = False) -> list[str]:
    errors: list[str] = []
    missing = SCENARIO_REQUIRED_FIELDS - set(content)
    if missing:
        errors.append(f"missing scenario fields {sorted(missing)}")

    scenario_id = content.get("scenario_id", "")
    if not is_snake_case(scenario_id):
        errors.append("scenario_id must be snake_case")
    if existing_ids and scenario_id in existing_ids and not allow_existing:
        errors.append(f"scenario_id already exists in src/game/scenarios.js: {scenario_id}")

    turn = content.get("turn")
    if turn is not None and (not isinstance(turn, int) or turn < 1 or turn > 30):
        errors.append("turn must be an integer between 1 and 30")

    if len(content.get("description", "")) < 160:
        errors.append("description should be at least 160 characters")

    choices = content.get("choices", [])
    if not isinstance(choices, list) or not 2 <= len(choices) <= 4:
        errors.append("choices must contain 2-4 options")
    else:
        ids = [choice.get("id") for choice in choices if isinstance(choice, dict)]
        if len(ids) != len(set(ids)):
            errors.append("choice ids must be unique")
        proposers = {choice.get("proposer") for choice in choices if isinstance(choice, dict)}
        if len(choices) >= 3 and not {"hotspur", "fox", "wolf"}.issubset(proposers):
            errors.append("3+ choice scenarios should include hotspur, fox, and wolf voices")
        for index, choice in enumerate(choices):
            if not isinstance(choice, dict):
                errors.append(f"choice {index}: must be an object")
            else:
                errors.extend(validate_choice(choice, index))

    branches = content.get("branches", [])
    if branches and not isinstance(branches, list):
        errors.append("branches must be a list of {minDivergence, scenarioId} objects")
    for index, branch in enumerate(branches if isinstance(branches, list) else []):
        if not isinstance(branch, dict):
            errors.append(f"branch {index}: must be an object")
            continue
        if "scenarioId" not in branch:
            errors.append(f"branch {index}: missing scenarioId")
        if "minDivergence" in branch and not isinstance(branch["minDivergence"], (int, float)):
            errors.append(f"branch {index}: minDivergence must be numeric")

    return errors


def validate_scenario_revision(content: dict[str, Any], existing_ids: set[str] | None = None) -> list[str]:
    errors: list[str] = []
    target = content.get("target_scenario_id", "")
    if not is_snake_case(target):
        errors.append("target_scenario_id must be snake_case")
    if existing_ids is not None and target not in existing_ids:
        errors.append(f"target_scenario_id does not exist: {target}")
    if len(content.get("problem", "")) < 40:
        errors.append("problem should explain the issue being fixed")
    if len(content.get("proposed_change", "")) < 80:
        errors.append("proposed_change should describe the revision in detail")
    return errors


def validate_advisor_voice(content: dict[str, Any], existing_ids: set[str] | None = None) -> list[str]:
    errors: list[str] = []
    scenario_id = content.get("scenario_id", "")
    if existing_ids is not None and scenario_id not in existing_ids:
        errors.append(f"scenario_id does not exist: {scenario_id}")
    voices = content.get("voices", {})
    if not isinstance(voices, dict):
        errors.append("voices must be an object")
        return errors
    for voice in ("hotspur", "fox", "wolf"):
        if len(voices.get(voice, "")) < 40:
            errors.append(f"voice {voice} should be at least 40 characters")
    return errors


def validate_asset_request(content: dict[str, Any]) -> list[str]:
    errors: list[str] = []
    missing = ASSET_REQUIRED_FIELDS - set(content)
    if missing:
        errors.append(f"missing asset fields {sorted(missing)}")

    if not is_snake_case(content.get("asset_name", "")):
        errors.append("asset_name must be snake_case")
    if content.get("style") not in ASSET_STYLES:
        errors.append(f"style must be one of {sorted(ASSET_STYLES)}")

    roles = content.get("proposed_roles", [])
    if not isinstance(roles, list) or not roles:
        errors.append("proposed_roles must be a non-empty list")
    else:
        invalid = set(roles) - ASSET_ROLES
        if invalid:
            errors.append(f"invalid proposed_roles {sorted(invalid)}")

    if len(content.get("scene_description", "")) < 80:
        errors.append("scene_description should be at least 80 characters")
    if len(content.get("provenance_intent", "")) < 30:
        errors.append("provenance_intent should explain generated/curated/source handling")

    rendering = content.get("rendering", {})
    if not isinstance(rendering, dict):
        errors.append("rendering must be an object")
        return errors

    preferred = rendering.get("preferred_backend")
    if preferred not in BACKEND_STATUS:
        errors.append(f"rendering.preferred_backend must be one of {sorted(BACKEND_STATUS)}")
    compatible = rendering.get("compatible_backends", [])
    if compatible and (not isinstance(compatible, list) or set(compatible) - set(BACKEND_STATUS)):
        errors.append(f"rendering.compatible_backends may only use {sorted(BACKEND_STATUS)}")

    prompt = rendering.get("prompt", "")
    if len(prompt) < 40:
        errors.append("rendering.prompt should be at least 40 characters")
    if len(prompt) > 1800:
        errors.append("rendering.prompt must be 1800 characters or fewer")
    if rendering.get("aspect_ratio", "16:9") not in ASPECT_RATIOS:
        errors.append(f"rendering.aspect_ratio must be one of {sorted(ASPECT_RATIOS)}")

    return errors


def validate_historical_primer(content: dict[str, Any]) -> list[str]:
    """Historical primers must carry the same structural fields the rubric
    checks for on scenarios: a sourced period voice, a structural framing
    paragraph, a complexity note, and real citations."""
    errors: list[str] = []
    missing = PRIMER_REQUIRED_FIELDS - set(content)
    if missing:
        errors.append(f"missing primer fields {sorted(missing)}")

    primer_id = content.get("id", "")
    if not is_snake_case(primer_id):
        errors.append("primer id must be snake_case")

    if len(content.get("topic", "")) < 12:
        errors.append("topic should be at least 12 characters")
    if len(content.get("summary", "")) < 400:
        errors.append("summary should be at least 400 characters")
    if len(content.get("period_voice", "")) < 60:
        errors.append("period_voice should be at least 60 characters and include an attributed citation")
    if len(content.get("power_analysis", "")) < 200:
        errors.append("power_analysis should be at least 200 characters and frame incentives, logistics, or sectional interests")
    if len(content.get("complexity_note", "")) < 120:
        errors.append("complexity_note should be at least 120 characters and show where compromise broke down")
    if len(content.get("sourceNotes", "")) < 40:
        errors.append("sourceNotes should cite at least two real sources (OR, named historian, contemporaneous memoir)")

    related = content.get("relatedScenarios", [])
    if related and not isinstance(related, list):
        errors.append("relatedScenarios must be a list of scenario ids")

    return errors


def validate_mechanic_upgrade(content: dict[str, Any]) -> list[str]:
    errors: list[str] = []
    for field in ("title", "description", "impact_area", "affected_systems"):
        if field not in content:
            errors.append(f"missing upgrade field {field}")
    if len(content.get("description", "")) < 120:
        errors.append("description should be at least 120 characters")
    if content.get("implementation_priority") not in {None, "low", "normal", "high", "release-blocker"}:
        errors.append("implementation_priority must be low, normal, high, or release-blocker")
    return errors


def validate_proposal(proposal: dict[str, Any], repo_root: Path = Path(".")) -> list[str]:
    errors = validate_envelope(proposal)
    if errors:
        return errors

    existing_ids = load_existing_scenario_ids(repo_root)
    content = proposal["content"]
    proposal_type = proposal["type"]

    if proposal_type == "scenario_stage":
        errors.extend(validate_scenario_stage(content, existing_ids, allow_existing=proposal.get("status") == "integrated"))
    elif proposal_type == "scenario_revision":
        errors.extend(validate_scenario_revision(content, existing_ids))
    elif proposal_type == "advisor_voice":
        errors.extend(validate_advisor_voice(content, existing_ids))
    elif proposal_type == "asset_request":
        errors.extend(validate_asset_request(content))
    elif proposal_type == "mechanic_upgrade":
        errors.extend(validate_mechanic_upgrade(content))
    elif proposal_type == "historical_primer":
        errors.extend(validate_historical_primer(content))

    return errors


def validate_file(path: Path, repo_root: Path = Path(".")) -> tuple[int, list[str]]:
    data = json.loads(path.read_text(encoding="utf-8"))
    proposals = data if isinstance(data, list) else [data]
    errors: list[str] = []
    for index, proposal in enumerate(proposals):
        for error in validate_proposal(proposal, repo_root):
            errors.append(f"{path}:{index}: {error}")
    return len(proposals), errors
