#!/usr/bin/env python3
"""Generate local image outputs from agent render manifests."""

from __future__ import annotations

import argparse
import hashlib
import importlib.util
import json
import os
import shutil
from pathlib import Path
from typing import Any


REPO_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_MANIFEST = REPO_ROOT / "render_requests" / "flux2_art_requests.json"
DEFAULT_OUTPUT_DIR = REPO_ROOT / "render_requests" / "generated"
DEFAULT_OUTPUT_MANIFEST = REPO_ROOT / "render_requests" / "flux2_outputs.json"
LOCAL_FLUX_MODULE = Path(os.environ.get("TITANS_FORGE_FLUX_MODULE", str(Path.home() / "Vault" / "generate_flux.py")))


def load_manifest(path: Path) -> list[dict[str, Any]]:
    if not path.exists():
        raise FileNotFoundError(f"render manifest not found: {path}")
    data = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(data, list):
        raise ValueError(f"render manifest is not a list: {path}")
    return data


def load_flux_runtime(module_path: Path):
    if not module_path.exists():
        raise FileNotFoundError(
            f"Flux runtime not found at {module_path}. Set TITANS_FORGE_FLUX_MODULE to the local generate_flux.py path."
        )

    spec = importlib.util.spec_from_file_location("titans_forge_generate_flux", module_path)
    if spec is None or spec.loader is None:
        raise ImportError(f"unable to load flux runtime from {module_path}")

    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def infer_dimensions(aspect_ratio: str) -> tuple[int, int]:
    normalized = (aspect_ratio or "16:9").strip()
    if normalized == "16:9":
        return 1024, 576
    if normalized == "4:3":
        return 1024, 768
    if normalized == "1:1":
        return 1024, 1024
    return 1024, 576


def stable_seed(asset_name: str) -> int:
    digest = hashlib.sha1(asset_name.encode("utf-8")).hexdigest()[:8]
    return int(digest, 16)


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate local image outputs from agent render manifests.")
    parser.add_argument("--backend", default="flux2", choices=["flux2"])
    parser.add_argument("--manifest", default=str(DEFAULT_MANIFEST))
    parser.add_argument("--output-dir", default=str(DEFAULT_OUTPUT_DIR))
    parser.add_argument("--output-manifest", default=str(DEFAULT_OUTPUT_MANIFEST))
    parser.add_argument("--asset", default="", help="Generate only one asset_name from the manifest.")
    parser.add_argument("--limit", type=int, default=0, help="Maximum number of requests to render.")
    parser.add_argument("--steps", type=int, default=4)
    parser.add_argument("--guidance", type=float, default=1.0)
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    if args.backend != "flux2":
        raise SystemExit("Only flux2 generation is implemented.")

    manifest_path = Path(args.manifest)
    output_dir = Path(args.output_dir)
    output_manifest = Path(args.output_manifest)
    output_dir.mkdir(parents=True, exist_ok=True)

    requests = load_manifest(manifest_path)
    if args.asset:
        requests = [request for request in requests if request.get("asset_name") == args.asset]
    if args.limit > 0:
        requests = requests[:args.limit]

    if not requests:
        print("No matching render requests.")
        return

    if args.dry_run:
        for request in requests:
            print(f"[plan] {request['asset_name']} <- {request['prompt'][:96]}")
        return

    module_path = Path(LOCAL_FLUX_MODULE)
    runtime = load_flux_runtime(module_path)
    engine = runtime.FluxEngine(cooldown_seconds=5)
    results: list[dict[str, Any]] = []

    for request in requests:
        width, height = infer_dimensions(request.get("aspect_ratio", "16:9"))
        asset_name = request["asset_name"]
        seed = stable_seed(asset_name)
        render_request = runtime.RenderRequest(
            prompt=request["prompt"],
            width=width,
            height=height,
            steps=args.steps,
            guidance=args.guidance,
            seed=seed,
            backend="flux9b",
        )
        raw_output = Path(engine.generate(render_request))
        final_output = output_dir / f"{asset_name}.png"
        shutil.copy2(raw_output, final_output)
        results.append(
            {
                "proposal_id": request.get("proposal_id", ""),
                "asset_name": asset_name,
                "backend": "flux2",
                "prompt": request["prompt"],
                "aspect_ratio": request.get("aspect_ratio", "16:9"),
                "seed": seed,
                "steps": args.steps,
                "guidance": args.guidance,
                "raw_output": str(raw_output),
                "final_output": str(final_output),
                "review_status": "pending",
            }
        )
        print(f"[generated] {asset_name} -> {final_output}")

    output_manifest.write_text(json.dumps(results, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote generation manifest: {output_manifest}")


if __name__ == "__main__":
    main()
