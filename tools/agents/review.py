#!/usr/bin/env python3
"""Validate and print the Titans Forge agent review queue."""

from __future__ import annotations

from .contribute import ContributionRegistry


def main() -> None:
    registry = ContributionRegistry()
    errors = registry.validate_all()
    if errors:
        print("Agent contribution validation failed:")
        for error in errors:
            print(f"  - {error}")
        raise SystemExit(1)
    print("Agent contribution validation OK")
    registry.print_review_queue()


if __name__ == "__main__":
    main()
