# Historical Assets Curation

This document records the current curated direction for Titans of War media. The machine-readable download and validation list lives in `src/game/historicalAssetManifest.js`.

## Audio Highlights

| Track | Target File | Use | Source | Rights |
| --- | --- | --- | --- | --- |
| Lorena | `public/audio/lorena_instrumental.mp3` | Low-morale and home-front turns | North Atlantic Tune List | Site states content is not copyrighted; attribution preferred |
| Battle Cry of Freedom | `public/audio/battle_cry_brass.mp3` | High-morale maneuvers | Library of Congress National Jukebox / Victor Military Band | Public Domain in the United States |
| When Johnny Comes Marching Home | `public/audio/fife_drum_march.mp3` | Standard tactical turns | Wikimedia Commons / West Point Band | Public Domain in the United States |
| Campfire Ambience | `public/audio/ambient_campfire.mp3` | Letter and quiet-command phases | Wikimedia Commons / PDSounds | Public Domain dedication |
| Taps (Appomattox Elegy) | `public/audio/elegy_final.mp3` | Concluding turns | Wikimedia Commons / U.S. Army Band | Public Domain in the United States |

Important rule: the composition and the recording are separate rights. Keep catalog entries marked pending until the actual recording source URL and license have been audited.

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

`map_virginia_campaigns_reference.jpeg` is retained as a broad Virginia campaign reference map from an on-site battlefield interpretive display, but is not currently assigned to a scenario tactical view.

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
