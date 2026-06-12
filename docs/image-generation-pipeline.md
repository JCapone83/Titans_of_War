# Image Generation Pipeline

Titans of War uses provider-neutral asset requests, but automated image
generation is not part of the public release workflow. Launch media is curated
manually from creator photographs, cleared historical archives, and reviewed
project-created images.

## Backend Policy

| Backend | Status | Use |
| --- | --- | --- |
| `manual` | Default | Cleared archive images, creator photos, and reviewed project media |
| `flux2` | Disabled for release | Local experiments only; verify the exact model license before use |
| `bernini` | Experimental | Future cinematic or video-heavy tests |
| `bonsai` | Retry-only | Revisit if the upstream issue is fixed |

## Release Boundary

The two existing local FLUX.2 Klein 9B experiments are excluded from git and
the public build. FLUX.2 Klein 9B uses the FLUX Non-Commercial License for
local inference; commercial use requires a separately permitted route. See
`MEDIA_RIGHTS.md`.

For release work:

- Do not commit model weights.
- Do not commit generated experiments until their provider terms and visual
  provenance are reviewed.
- Do not require an image model for setup or gameplay.
- Use `manual` as the preferred backend in contribution requests.

## Asset Request Shape

Agent asset requests use a neutral `rendering` object:

```json
{
  "asset_name": "richmond_evacuation_theater",
  "style": "period-art",
  "proposed_roles": ["theater", "chronicle"],
  "provenance_intent": "Generated art request; must be labeled generated and reviewed before active use.",
  "rendering": {
    "preferred_backend": "manual",
    "compatible_backends": [],
    "prompt": "Richmond evacuation April 1865...",
    "negative_prompt": "modern objects, text, watermark",
    "aspect_ratio": "16:9"
  }
}
```

The repository retains experimental manifest tooling for future evaluation:

```bash
npm run agents:render -- --backend flux2
```

Generated files remain local and ignored:

```bash
npm run agents:generate
```

The legacy local path assumes:

- `python3.11`
- `diffusers >= 0.37`
- a local runtime module such as `~/Vault/generate_flux.py`

If the runtime is stored elsewhere, set:

```bash
TITANS_FORGE_FLUX_MODULE=/absolute/path/to/generate_flux.py npm run agents:generate
```

An experimental Bernini manifest can be generated only for a separate,
license-reviewed test:

```bash
npm run agents:render -- --backend bernini
```

Generated files go under `render_requests/` and are ignored by git unless deliberately promoted.

## Media Review Standard

Before an asset becomes active in `src/game/mediaCatalog.js`, verify:

- It has a known source or is clearly labeled generated/creator-owned.
- It has an intended license/provenance note.
- It fits the target scenario in image and map view.
- It does not contain modern artifacts, text, watermarks, or obvious hallucinations.
- It is compressed to a repo-appropriate size.
