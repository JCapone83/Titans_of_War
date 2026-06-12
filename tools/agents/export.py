#!/usr/bin/env python3
"""Export approved agent scenarios for manual game integration."""

from __future__ import annotations

import argparse

from .contribute import ContributionRegistry


def main() -> None:
    parser = argparse.ArgumentParser(description="Export approved agent-authored scenarios.")
    parser.add_argument("--out", default="src/game/agentContributedScenarios.js")
    args = parser.parse_args()

    output = ContributionRegistry().export_approved_scenarios(output=args.out)
    print(f"Exported approved scenarios: {output}")


if __name__ == "__main__":
    main()
