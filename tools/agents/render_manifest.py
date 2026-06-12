#!/usr/bin/env python3
"""Generate backend-specific render manifests from asset requests."""

from __future__ import annotations

import argparse

from .contribute import ContributionRegistry
from .schemas import BACKEND_STATUS, DEFAULT_BACKEND


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate image/video render request manifests.")
    parser.add_argument("--backend", default=DEFAULT_BACKEND, choices=sorted(BACKEND_STATUS))
    parser.add_argument("--out", default="")
    args = parser.parse_args()

    registry = ContributionRegistry()
    output = registry.export_render_manifest(backend=args.backend, output=args.out or None)
    count = len(registry.render_requests(backend=args.backend))
    print(f"Generated {count} {args.backend} request(s): {output}")


if __name__ == "__main__":
    main()
