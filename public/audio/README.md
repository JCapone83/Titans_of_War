# Titans of War Local Audio Archive

Place optional local recordings in this folder using these exact filenames:

- ambient_campfire.mp3
- lorena_instrumental.mp3
- lorena_melancholic.mp3
- battle_cry_brass.mp3
- fife_drum_march.mp3
- battle_hymn_instrumental.mp3
- dixie_instrumental.mp3
- bonnie_blue_flag_instrumental.mp3
- tenting_tonight.mp3
- aura_lea.mp3
- home_sweet_home.mp3
- elegy_final.mp3
- distant_artillery_ambience.mp3

Guidelines:

- Use royalty-free or public-domain source material only.
- Prefer instrumental-only tracks so the cabinet voice and scenario text stay readable.
- MP3 is the format currently indexed by the audio manager.
- Add or update the corresponding metadata in `src/game/audioCatalog.js`.
- Keep `licenseStatus` set to `recording-needed` until the recording, not just the composition, has been audited.
- Missing files are fine; the game falls back to the built-in procedural score automatically.
- Reload the app after adding files so the archive probe can index the new tracks.

Suggested repertoire:

- Lorena
- Battle Cry of Freedom
- When Johnny Comes Marching Home
- Dixie
- Battle Hymn of the Republic
- The Bonnie Blue Flag
- Tenting Tonight on the Old Camp Ground
- Aura Lea
- Home, Sweet Home
- Quiet campfire ambience
- Somber Appomattox elegy
- Distant artillery ambience
