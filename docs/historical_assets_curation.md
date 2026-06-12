# Historical Assets Curation

This document records the current curated direction for Titans of War media. The machine-readable download and validation list lives in `src/game/historicalAssetManifest.js`.

## Audio Highlights

| Track | Target File | Use | Source | Rights |
| --- | --- | --- | --- | --- |
| Lorena | `public/audio/lorena_instrumental.mp3` | Low-morale and home-front turns | Library of Congress / Citizen DJ / American Folklife Center | Free to use and reuse; shipped as a trimmed performance-only extract |
| Shenandoah | `public/audio/shenandoah.mp3` | Letter, home-front, and quiet turns | Wikimedia Commons / U.S. Air Force Band | Public Domain |
| Battle Cry of Freedom | `public/audio/battle_cry_brass.mp3` | High-morale maneuvers | Library of Congress National Jukebox / Victor Military Band | Public Domain in the United States |
| When Johnny Comes Marching Home | `public/audio/fife_drum_march.mp3` | Standard tactical turns | Wikimedia Commons / West Point Band | Public Domain in the United States |
| Campfire Ambience | `public/audio/ambient_campfire.mp3` | Letter and quiet-command phases | Wikimedia Commons / PDSounds | Public Domain dedication |
| Taps (Appomattox Elegy) | `public/audio/elegy_final.mp3` | Concluding turns | Wikimedia Commons / U.S. Army Band | Public Domain in the United States |
| Battle Hymn of the Republic | `public/audio/battle_hymn_triumphant.mp3` | Union pressure and high morale | Wikimedia Commons / Library of Congress | Public Domain |
| The Yellow Rose of Texas | `public/audio/yellow_rose_march.mp3` | Movement and Southern camp cues | Wikimedia Commons | Public Domain |
| Tenting Tonight | `public/audio/tenting_tonight.mp3` | Winter camps and low morale | Wikimedia Commons | Public Domain |
| Just Before the Battle, Mother | `public/audio/just_before_battle_mother.mp3` | Letters and battle-eve cues | Library of Congress / Internet Archive file | Public Domain |

Important rule: the composition and the recording are separate rights. Each
shipped recording has an audited source and SHA-256 hash in
`src/game/historicalAssetManifest.js`. Keep other entries pending until the
actual recording, not merely the composition, has been audited.

## Cartographic Targets

| Scenario | Target File | Source Target | Status |
| --- | --- | --- | --- |
| Fort Sumter / Charleston Harbor Escape | `map_fort_sumter_charleston_harbor_loc.jpg` | Library of Congress IIIF map tile service | Curated |
| First Manassas | `map_first_manassas.png` | American Battlefield Trust / Library of Congress map resource | Needs exact image source review |
| Seven Days | `map_seven_days.png` | Local archive tactical map candidate | Needs source review |
| Second Manassas | `map_second_manassas_aug30_movements.png` | Library of Congress item 99439157 / GETARCHIVE mirror | Verified public domain |
| Antietam / Maryland Campaign | `map_antietam_sharpsburg_loc.jpg` | Library of Congress map of Sharpsburg and Dunker Church approaches | Verified |
| Chancellorsville | `map_chancellorsville.jpeg` | On-site battlefield interpretive map photograph | Project archive; underlying wayside rights need review |
| Gettysburg / Susquehanna branch | `map_gettysburg_cemetery_ridge_loc.jpg` | Cemetery Ridge and Round Tops elevation contours | Verified |
| Third Winchester | `map_third_winchester.png` | Local archive tactical map candidate | Needs source review |
| Wilderness | `map_wilderness_russell.jpg` | Robert E. L. Russell Atlas / Library of Congress | Verified |
| Petersburg | `map_petersburg_crater_loc.jpg` | Siege trenches and Crater detonation coordinates | Verified |
| Appomattox / Greensboro ending | `map_appomattox_retreat_lines_loc.jpg` | Lee retreat lines to Appomattox Station | Verified |

The unresolved local map candidates and
`map_virginia_campaigns_reference.jpeg` remain local-only and are ignored by
git. The game uses a procedural tactical layer when a scenario's candidate map
is marked `needs-review`.

The full desired campaign atlas should eventually contain one tactical map for each grand-campaign turn and branch turn. Locally sourced maps should remain `needs-review` until source URL and rights are recorded.

## Print And Photo Targets

Prioritize Library of Congress and National Archives public-domain images by Mathew Brady, Alexander Gardner, Timothy O'Sullivan, or their studios when they map directly to the turn:

- Fort Sumter: cannon-damaged walls, harbor fortification views, Charleston batteries.
- Gettysburg: artillery batteries, Cemetery Hill/Ridge views, Round Top terrain.
- Petersburg: trench interiors, timber supports, siege lines, Crater aftermath.
- Appomattox: surrender setting, courthouse area, retreat/supply-line imagery.

Each image needs:

- `sourceUrl`
- `sourceInstitution`
- `license`
- `historicalMedium`
- `assetRoles`
- `caption`
- `credit`
- `provenanceStatus`

Do not mark an asset `verified` until the source and rights have been recorded.

## Next Emplacement Pass

1. Tune `mapAnnotations.js` against the expanded tactical map set.
2. Add screenshot QA for Historical and Tactical modes.
3. Add source URLs and rights notes for the new local tactical map candidates.
4. Add print/photo theater assets for Sumter, Gettysburg, Petersburg, and Appomattox after source verification.
