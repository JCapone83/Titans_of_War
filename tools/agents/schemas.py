"""Shared constants for agent contribution proposals."""

from __future__ import annotations

from datetime import datetime, timezone
from pathlib import Path


def utc_timestamp() -> str:
    """Return a UTC ISO-8601 timestamp ending in 'Z', second precision.

    datetime.utcnow() is deprecated as of Python 3.12. This helper is the
    single source of truth for agent-side timestamps so contribute.py and
    dashboard_server.py cannot drift apart.
    """
    return (
        datetime.now(timezone.utc)
        .replace(microsecond=0)
        .isoformat()
        .replace("+00:00", "Z")
    )


CONTRIBUTION_ROOT = Path("agent_contributions")
STATUS_DIRS = ("drafts", "submitted", "approved", "rejected", "integrated")

PROPOSAL_STATUSES = {
    "draft",
    "submitted",
    "review",
    "approved",
    "rejected",
    "integrated",
}

CONTRIBUTION_TYPES = {
    "scenario_stage",
    "scenario_revision",
    "advisor_voice",
    "asset_request",
    "mechanic_upgrade",
    "historical_primer",
}

VALID_PROPOSERS = {"hotspur", "fox", "wolf", "sovereign"}

METRIC_RANGES = {
    "militaryStrength": (-50, 50),
    "munitions": (-50, 50),
    "treasury": (-100, 100),
    "foodSupply": (-50, 50),
    "publicMorale": (-50, 50),
    "divergenceIndex": (-0.5, 0.5),
}

SHARD_RANGE = (-50, 50)

ASSET_STYLES = {
    "period-art",
    "battlefield-photo",
    "portrait",
    "map",
    "monument",
    "artifact",
    "cinematic",
}

ASSET_ROLES = {
    "theater",
    "tactical-underlay",
    "card",
    "chronicle",
    "launch-media",
}

DEFAULT_BACKEND = "manual"

BACKEND_STATUS = {
    "flux2": "disabled-release-experimental-only",
    "bernini": "experimental-heavy-video-image",
    "bonsai": "optional-retry-only",
    "manual": "default-human-curated",
}

ASPECT_RATIOS = {"16:9", "4:3", "3:2", "1:1", "9:16"}

SCENARIO_REQUIRED_FIELDS = {
    "scenario_id",
    "title",
    "date",
    "actor",
    "roleLabel",
    "description",
    "letterTarget",
    "choices",
}

CHOICE_REQUIRED_FIELDS = {
    "id",
    "text",
    "proposer",
    "costDescription",
    "effects",
    "consequence",
}

ASSET_REQUIRED_FIELDS = {
    "asset_name",
    "scene_description",
    "historical_period",
    "style",
    "proposed_roles",
    "best_for_scenarios",
    "provenance_intent",
    "rendering",
}

PRIMER_REQUIRED_FIELDS = {
    "id",
    "topic",
    "summary",
    "period_voice",
    "power_analysis",
    "complexity_note",
    "sourceNotes",
}
