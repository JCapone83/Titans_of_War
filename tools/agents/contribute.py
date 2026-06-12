"""Contributor API and registry operations for Titans Forge agents."""

from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path
from typing import Any

from .schemas import (
    BACKEND_STATUS,
    CONTRIBUTION_ROOT,
    DEFAULT_BACKEND,
    STATUS_DIRS,
    utc_timestamp,
)
from .social_science_rubric import RUBRIC_NAME, rubric_blockers, rubric_warnings
from .validators import validate_proposal


def make_id(agent: str, base: str) -> str:
    clean = "".join(ch if ch.isalnum() else "_" for ch in base.lower()).strip("_")
    suffix = hashlib.sha1(f"{agent}:{clean}".encode("utf-8")).hexdigest()[:8]
    return f"{clean}_{suffix}"


class AgentContributor:
    """Builder API used by Titans Forge agents."""

    def __init__(self, agent_name: str, root: str | Path = CONTRIBUTION_ROOT):
        self.agent_name = agent_name
        self.root = Path(root)
        for status in STATUS_DIRS:
            (self.root / status).mkdir(parents=True, exist_ok=True)
        self.proposals: list[dict[str, Any]] = []

    def _proposal(self, proposal_type: str, base: str, content: dict[str, Any]) -> dict[str, Any]:
        proposal = {
            "proposal_id": make_id(self.agent_name, base),
            "type": proposal_type,
            "status": "draft",
            "agent": self.agent_name,
            "created_at": utc_timestamp(),
            "content": content,
            "validation_errors": [],
            "rubric": RUBRIC_NAME,
            "rubric_warnings": [],
            "rubric_blockers": [],
            "is_valid": False,
            "comments": [],
        }
        proposal["validation_errors"] = validate_proposal(proposal)
        proposal["rubric_warnings"] = rubric_warnings(proposal)
        proposal["rubric_blockers"] = rubric_blockers(proposal)
        proposal["is_valid"] = not proposal["validation_errors"]
        self.proposals.append(proposal)
        return proposal

    def create_scenario_stage(self, **content: Any) -> dict[str, Any]:
        return self._proposal("scenario_stage", content.get("scenario_id", "scenario_stage"), content)

    def create_scenario(self, **content: Any) -> dict[str, Any]:
        """Legacy alias for older contribution scripts."""
        return self.create_scenario_stage(**content)

    def propose_scenario_revision(
        self,
        target_scenario_id: str,
        problem: str,
        proposed_change: str,
        replacement_fields: dict[str, Any] | None = None,
        designer_notes: str = "",
    ) -> dict[str, Any]:
        return self._proposal(
            "scenario_revision",
            target_scenario_id,
            {
                "target_scenario_id": target_scenario_id,
                "problem": problem,
                "proposed_change": proposed_change,
                "replacement_fields": replacement_fields or {},
                "designer_notes": designer_notes,
            },
        )

    def propose_advisor_voice(
        self,
        scenario_id: str,
        hotspur: str,
        fox: str,
        wolf: str,
        sovereign: str = "",
    ) -> dict[str, Any]:
        return self._proposal(
            "advisor_voice",
            scenario_id,
            {
                "scenario_id": scenario_id,
                "voices": {
                    "hotspur": hotspur,
                    "fox": fox,
                    "wolf": wolf,
                    "sovereign": sovereign,
                },
            },
        )

    def request_asset(
        self,
        asset_name: str,
        scene_description: str,
        historical_period: str,
        style: str,
        prompt: str,
        proposed_roles: list[str] | None = None,
        best_for_scenarios: list[str] | None = None,
        preferred_backend: str = DEFAULT_BACKEND,
        compatible_backends: list[str] | None = None,
        negative_prompt: str = "",
        aspect_ratio: str = "16:9",
        reference_url: str = "",
        provenance_intent: str = "Generated media; must be reviewed before active in-app use.",
        design_notes: str = "",
    ) -> dict[str, Any]:
        compatible = compatible_backends or [preferred_backend]
        return self._proposal(
            "asset_request",
            asset_name,
            {
                "asset_name": asset_name,
                "scene_description": scene_description,
                "historical_period": historical_period,
                "style": style,
                "proposed_roles": proposed_roles or ["theater"],
                "best_for_scenarios": best_for_scenarios or [],
                "reference_url": reference_url,
                "provenance_intent": provenance_intent,
                "design_notes": design_notes,
                "rendering": {
                    "preferred_backend": preferred_backend,
                    "compatible_backends": compatible,
                    "backend_status": {backend: BACKEND_STATUS[backend] for backend in compatible if backend in BACKEND_STATUS},
                    "prompt": prompt,
                    "negative_prompt": negative_prompt,
                    "aspect_ratio": aspect_ratio,
                },
            },
        )

    def request_artwork(
        self,
        asset_name: str,
        scene_description: str,
        historical_period: str,
        style: str,
        flux2_prompt: str,
        proposed_roles: list[str] | None = None,
        best_for_scenarios: list[str] | None = None,
        reference_url: str = "",
        design_notes: str = "",
    ) -> dict[str, Any]:
        """Legacy Flux2-shaped alias for older contribution scripts."""
        return self.request_asset(
            asset_name=asset_name,
            scene_description=scene_description,
            historical_period=historical_period,
            style=style,
            prompt=flux2_prompt,
            proposed_roles=proposed_roles,
            best_for_scenarios=best_for_scenarios,
            preferred_backend="flux2",
            compatible_backends=["flux2"],
            reference_url=reference_url,
            design_notes=design_notes,
        )

    def propose_mechanic_upgrade(self, **content: Any) -> dict[str, Any]:
        content.setdefault("implementation_priority", "normal")
        content.setdefault("affected_systems", [])
        return self._proposal("mechanic_upgrade", content.get("title", "mechanic_upgrade"), content)

    def propose_historical_primer(self, **content: Any) -> dict[str, Any]:
        """Author a topic-level sourced primer (naval tech, cotton diplomacy,
        Copperhead politics, etc.) for the in-game opt-in side panel and the
        local agent's ground-truth prompt context."""
        content.setdefault("relatedScenarios", [])
        return self._proposal("historical_primer", content.get("id", "primer"), content)

    def propose_upgrade(self, **content: Any) -> dict[str, Any]:
        """Legacy alias for older contribution scripts."""
        return self.propose_mechanic_upgrade(**content)

    def save(self, proposal: dict[str, Any], status: str = "submitted", *, allow_rubric_override: bool = False) -> bool:
        proposal["validation_errors"] = validate_proposal(proposal)
        proposal["rubric_warnings"] = rubric_warnings(proposal)
        proposal["rubric_blockers"] = rubric_blockers(proposal)
        proposal["is_valid"] = not proposal["validation_errors"]
        if not proposal["is_valid"]:
            print(f"Validation failed: {proposal['proposal_id']}")
            for error in proposal["validation_errors"]:
                print(f"  - {error}")
            return False

        if proposal["rubric_blockers"] and not allow_rubric_override:
            print(f"Rubric blocked: {proposal['proposal_id']}")
            for blocker in proposal["rubric_blockers"]:
                print(f"  - {blocker}")
            print("  (Pass allow_rubric_override=True only with explicit reviewer consent.)")
            return False

        proposal["status"] = status
        proposal[f"{status}_at"] = utc_timestamp()
        target = self.root / status / f"{self.agent_name}.json"
        existing = []
        if target.exists():
            existing = json.loads(target.read_text(encoding="utf-8"))
        existing = [entry for entry in existing if entry.get("proposal_id") != proposal["proposal_id"]]
        existing.append(proposal)
        target.write_text(json.dumps(existing, indent=2) + "\n", encoding="utf-8")
        print(f"Saved {proposal['proposal_id']} -> {target}")
        return True

    def validate_and_save(self, proposal: dict[str, Any]) -> bool:
        """Legacy alias for older contribution scripts."""
        return self.save(proposal, status="submitted")

    def save_all(self, status: str = "submitted") -> int:
        saved = 0
        for proposal in self.proposals:
            if self.save(proposal, status=status):
                saved += 1
        return saved

    def summary(self) -> dict[str, Any]:
        by_type: dict[str, int] = {}
        for proposal in self.proposals:
            by_type[proposal["type"]] = by_type.get(proposal["type"], 0) + 1
        return {
            "agent": self.agent_name,
            "total": len(self.proposals),
            "valid": sum(1 for proposal in self.proposals if proposal.get("is_valid")),
            "by_type": by_type,
        }

    def print_summary(self) -> None:
        print(json.dumps(self.summary(), indent=2))


class ContributionRegistry:
    """Central registry for loading, validating, and exporting proposals."""

    def __init__(self, root: str | Path = CONTRIBUTION_ROOT):
        self.root = Path(root)

    def load(self, statuses: tuple[str, ...] = STATUS_DIRS) -> list[dict[str, Any]]:
        proposals: list[dict[str, Any]] = []
        for status in statuses:
            status_dir = self.root / status
            if not status_dir.exists():
                continue
            for path in sorted(status_dir.glob("*.json")):
                proposals.extend(json.loads(path.read_text(encoding="utf-8")))
        return proposals

    def validate_all(self) -> list[str]:
        errors: list[str] = []
        for proposal in self.load():
            for error in validate_proposal(proposal):
                errors.append(f"{proposal.get('proposal_id')}: {error}")
        return errors

    def review_queue(self) -> list[dict[str, Any]]:
        return sorted(
            [proposal for proposal in self.load(("submitted", "approved")) if proposal["status"] in {"submitted", "approved"}],
            key=lambda proposal: proposal.get("submitted_at", proposal.get("created_at", "")),
        )

    def render_requests(self, backend: str = DEFAULT_BACKEND, statuses: tuple[str, ...] = ("submitted", "approved")) -> list[dict[str, Any]]:
        requests: list[dict[str, Any]] = []
        for proposal in self.load(statuses):
            if proposal["type"] != "asset_request":
                continue
            content = proposal["content"]
            rendering = content.get("rendering", {})
            compatible = set(rendering.get("compatible_backends", []))
            if backend != rendering.get("preferred_backend") and backend not in compatible:
                continue
            requests.append(
                {
                    "proposal_id": proposal["proposal_id"],
                    "agent": proposal["agent"],
                    "status": proposal["status"],
                    "backend": backend,
                    "asset_name": content["asset_name"],
                    "scene_description": content["scene_description"],
                    "historical_period": content["historical_period"],
                    "style": content["style"],
                    "proposed_roles": content["proposed_roles"],
                    "best_for_scenarios": content["best_for_scenarios"],
                    "reference_url": content.get("reference_url", ""),
                    "provenance_intent": content["provenance_intent"],
                    "prompt": rendering["prompt"],
                    "negative_prompt": rendering.get("negative_prompt", ""),
                    "aspect_ratio": rendering.get("aspect_ratio", "16:9"),
                    "flux2_prompt": rendering["prompt"] if backend == "flux2" else None,
                }
            )
        return requests

    def export_render_manifest(self, backend: str = DEFAULT_BACKEND, output: str | Path | None = None) -> Path:
        output_path = Path(output or f"render_requests/{backend}_art_requests.json")
        output_path.parent.mkdir(parents=True, exist_ok=True)
        requests = self.render_requests(backend=backend)
        output_path.write_text(json.dumps(requests, indent=2) + "\n", encoding="utf-8")
        return output_path

    def generate_art_request_manifest(self, output_file: str = "render_requests/flux2_art_requests.json") -> list[dict[str, Any]]:
        """Legacy alias that emits Flux2-compatible requests."""
        self.export_render_manifest(backend="flux2", output=output_file)
        return self.render_requests(backend="flux2")

    def export_approved_scenarios(self, output: str | Path = "src/game/agentContributedScenarios.js") -> Path:
        scenarios = [
            proposal["content"]
            for proposal in self.load(("approved", "integrated"))
            if proposal["type"] == "scenario_stage"
        ]
        output_path = Path(output)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        output_path.write_text(
            "// Auto-generated from approved Titans Forge agent proposals.\n"
            "// Review before importing into the playable campaign.\n\n"
            f"export const AGENT_CONTRIBUTED_SCENARIOS = {json.dumps(scenarios, indent=2)};\n",
            encoding="utf-8",
        )
        return output_path

    def print_review_queue(self) -> None:
        queue = self.review_queue()
        print(f"Review queue: {len(queue)} proposal(s)")
        for proposal in queue:
            warnings = rubric_warnings(proposal)
            suffix = f" | rubric warnings: {len(warnings)}" if warnings else ""
            print(f"[{proposal['status']}] {proposal['type']} {proposal['agent']} {proposal['proposal_id']}{suffix}")


def main() -> None:
    parser = argparse.ArgumentParser(description="Inspect Titans Forge agent contributions.")
    parser.add_argument("--validate", action="store_true", help="Validate all proposals.")
    parser.add_argument("--queue", action="store_true", help="Print submitted/approved review queue.")
    args = parser.parse_args()
    registry = ContributionRegistry()
    if args.validate:
        errors = registry.validate_all()
        if errors:
            print("Agent contribution validation failed:")
            for error in errors:
                print(f"  - {error}")
            raise SystemExit(1)
        print("Agent contribution validation OK")
    if args.queue or not args.validate:
        registry.print_review_queue()


if __name__ == "__main__":
    main()
