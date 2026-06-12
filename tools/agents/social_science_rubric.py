"""Titans Forge social science rubric helpers for agent review."""

from __future__ import annotations

import re
from typing import Any

RUBRIC_NAME = "Titans Forge Social Science Rubric"

RUBRIC_RULES = (
    "Zero Presentism: explain period actors on their own terms; avoid modern moral or academic language.",
    "Use Real Sources First: prefer primary sources and high-quality historians, with source notes attached.",
    "Power Over Propaganda: identify incentives, political power, sectional interests, logistics, and structural realities.",
    "Proportionality: distinguish a real controversy from its scale before treating it as socially dominant.",
    "Language Fidelity: use period-appropriate language and categories.",
    "Complexity: show competing legitimate interests and where compromises broke down.",
)

# Terms that violate Zero Presentism. These are treated as BLOCKERS by default;
# a proposal containing any of them cannot save without an explicit override.
PRESENTISM_TERMS = (
    "systemic racism",
    "equity",
    "marginalized",
    "whiteness",
    "intersectional",
    "intersectionality",
    "decolonize",
    "decolonial",
    "social justice",
    "racial justice",
    "white privilege",
    "lived experience",
    "centering",
    "problematic",
    "othering",
)

# Historians and primary-source bodies that earn a bonus when cited in
# source_notes. Names span Civil War specialists and the broader scientific-
# social-history tradition the rubric prefers.
RECOMMENDED_HISTORIANS = (
    "channing",
    "freeman",
    "foote",
    "nevins",
    "mcpherson",
    "catton",
    "henderson",
    "bloch",
    "trevelyan",
    "official records",
    "battles and leaders",
    "lincoln papers",
    "chesnut",
    "grant",
    "sherman",
    "longstreet",
    "mosby",
    "hotchkiss",
    "davis papers",
    "stephens",
    "lee's dispatches",
    "lee's lieutenants",
)

# A source note must show at least one of: a year between 1820 and 1900,
# a recognized historian, the OR/Official Records, or a memoir reference.
SOURCE_QUALITY_PATTERNS = (
    re.compile(r"\b18[2-9]\d\b"),
    re.compile(r"\b190\d\b"),
    re.compile(r"\b(or|official records)\b", re.IGNORECASE),
)

SOURCE_FIELDS = (
    "historical_context",
    "source_notes",
    "sourceNotes",
    "primary_sources",
    "historian_sources",
    "bibliography",
    "reference_url",
)

POWER_TERMS = (
    "army",
    "blockade",
    "cabinet",
    "coalition",
    "cotton",
    "depot",
    "election",
    "enlistment",
    "food",
    "governor",
    "incentive",
    "logistics",
    "munitions",
    "newspaper",
    "rail",
    "sectional",
    "state",
    "treasury",
)

COMPLEXITY_TERMS = (
    "both",
    "but",
    "compromise",
    "faction",
    "however",
    "interest",
    "pressure",
    "tradeoff",
    "where",
    "while",
)

CONTROVERSY_TERMS = (
    "backlash",
    "class tension",
    "controversy",
    "corruption",
    "exemption",
    "grievance",
    "opposition",
    "outrage",
    "resistance",
    "riot",
)

PROPORTIONALITY_TERMS = (
    "evidence",
    "limited",
    "local",
    "minority",
    "most",
    "not the same",
    "proportion",
    "scale",
    "share",
    "should not obscure",
    "varied",
    "widespread",
)


def _flatten_text(value: Any) -> str:
    if isinstance(value, str):
        return value
    if isinstance(value, dict):
        return " ".join(_flatten_text(item) for item in value.values())
    if isinstance(value, list):
        return " ".join(_flatten_text(item) for item in value)
    return ""


def _gather_source_text(content: dict[str, Any]) -> str:
    parts: list[str] = []
    for field in SOURCE_FIELDS:
        value = content.get(field)
        if isinstance(value, str):
            parts.append(value)
        elif isinstance(value, list):
            for item in value:
                if isinstance(item, str):
                    parts.append(item)
                elif isinstance(item, dict):
                    parts.append(_flatten_text(item))
    rubric = content.get("social_science_rubric", {})
    if isinstance(rubric, dict):
        source_basis = rubric.get("source_basis") or rubric.get("sources")
        if isinstance(source_basis, str):
            parts.append(source_basis)
        elif isinstance(source_basis, list):
            parts.extend(str(item) for item in source_basis if isinstance(item, str))
    return " ".join(parts)


def source_note_present(content: dict[str, Any]) -> bool:
    """A source note must do more than exist; it must look like a real citation."""
    text = _gather_source_text(content).strip()
    if len(text) < 20:
        return False
    lowered = text.lower()
    if any(historian in lowered for historian in RECOMMENDED_HISTORIANS):
        return True
    return any(pattern.search(text) for pattern in SOURCE_QUALITY_PATTERNS)


def _has_complexity(text: str) -> bool:
    """Complexity is shown by at least two distinct framing terms in a body of
    substance, not by a single 'however' anywhere in the prose."""
    if len(text) < 80:
        return False
    distinct = {term for term in COMPLEXITY_TERMS if term in text}
    return len(distinct) >= 2


def _has_power_framing(text: str) -> bool:
    if len(text) < 80:
        return False
    distinct = {term for term in POWER_TERMS if term in text}
    return len(distinct) >= 2


def _needs_proportionality_context(text: str) -> bool:
    return any(term in text for term in CONTROVERSY_TERMS)


def _has_proportionality_context(text: str) -> bool:
    distinct = {term for term in PROPORTIONALITY_TERMS if term in text}
    return len(distinct) >= 2


def rubric_blockers(proposal: dict[str, Any]) -> list[str]:
    """Return hard blockers under the rubric. Applies to ALL proposal types.

    Currently: Zero Presentism. A proposal that imports modern academic
    vocabulary cannot save without an explicit override.
    """
    content = proposal.get("content", {})
    if not isinstance(content, dict):
        return []

    lowered = _flatten_text(content).lower()
    presentism_hits = sorted({term for term in PRESENTISM_TERMS if term in lowered})
    if not presentism_hits:
        return []
    return [
        "Zero Presentism: remove or rewrite modern academic terms: "
        + ", ".join(presentism_hits)
        + ". Explain period actors on their own terms."
    ]


def rubric_warnings(proposal: dict[str, Any]) -> list[str]:
    """Return softer rubric warnings. These include Zero-Presentism hits
    (also surfaced as blockers) so dashboards and CLIs that only read
    warnings still see every issue."""
    content = proposal.get("content", {})
    if not isinstance(content, dict):
        return ["Rubric could not inspect proposal content."]

    text = _flatten_text(content)
    lowered = text.lower()
    warnings: list[str] = list(rubric_blockers(proposal))

    if proposal.get("type") in {"scenario_stage", "scenario_revision", "advisor_voice", "historical_primer"}:
        if not source_note_present(content):
            warnings.append(
                "Use Real Sources First: add source_notes naming a primary source, the Official Records, or a recognized historian (Channing, Freeman, Foote, Nevins, Bloch, etc.)."
            )
        if not _has_power_framing(lowered):
            warnings.append(
                "Power Over Propaganda: clarify incentives, political power, logistics, sectional interests, or institutional constraints. At least two structural terms should appear in the body."
            )
        if not _has_complexity(lowered):
            warnings.append(
                "Complexity: show competing interests and where compromise or command consensus breaks down. Use at least two complexity terms (e.g. 'however', 'tradeoff', 'while')."
            )
        if _needs_proportionality_context(lowered) and not _has_proportionality_context(lowered):
            warnings.append(
                "Proportionality: the proposal emphasizes controversy, grievance, resistance, or exemption without establishing scale. Clarify whether the evidence is local, limited, widespread, or decisive before generalizing."
            )

    if proposal.get("type") == "asset_request":
        if not content.get("reference_url") and "generated" not in lowered:
            warnings.append(
                "Use Real Sources First: provide a reference_url or clearly label the request as generated media."
            )

    return warnings


def rubric_status(proposal: dict[str, Any]) -> dict[str, Any]:
    warnings = rubric_warnings(proposal)
    blockers = rubric_blockers(proposal)
    return {
        "name": RUBRIC_NAME,
        "rules": RUBRIC_RULES,
        "warnings": warnings,
        "blockers": blockers,
        "passes": not warnings,
        "savable": not blockers,
    }
