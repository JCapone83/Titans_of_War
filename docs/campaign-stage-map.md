# Campaign Stage Map

The playable campaign runs a 28-turn main spine with alternate branches, historical interludes, and limited emergency cabinet crises. Agent proposals should strengthen a defined branch, stage, source note, or mechanic rather than add disconnected encounters.

## Current Playable Spine

| Turn | Scenario | Status |
| --- | --- | --- |
| 1 | Fort Sumter | playable |
| 2 | First Manassas / Charleston Harbor / Radical Republicans branch | playable |
| 3 | Naval Technology and Blockade | playable |
| 4 | Shiloh and the Army of Tennessee | playable |
| 5 | First Winchester and Valley supply pressure | playable |
| 6 | Seven Days | playable |
| 7 | Second Manassas | playable |
| 8 | Antietam / Potomac leverage branch | playable |
| 9 | Fredericksburg and Winter Camps | playable |
| 10 | Chancellorsville Maneuver | playable |
| 11 | Chancellorsville Breakthrough / Jackson survives branch | playable |
| 12 | Pennsylvania campaign setup / Jackson-survives setup | playable |
| 13 | Gettysburg / Jackson-survives / Susquehanna branch | playable |
| 14 interlude | International recognition after the Johnston-Jackson-Gettysburg victory chain | playable terminal-or-continue branch |
| 14 | Chickamauga | playable |
| 15 | Wilderness Crisis / Chattanooga branch | playable |
| 16 | Wilderness Aftermath | playable |
| 17 | New Market | playable |
| 18 | Cold Harbor | playable |
| 19 | March to Atlanta and election pressure | playable |
| 20 | Petersburg and the Crater | playable |
| 21 | Fall of Atlanta | playable |
| 22 | Third Winchester | playable |
| 23 | Cedar Creek | playable |
| 24 | Election of 1864: Lincoln or McClellan outcome | playable branch |
| 25 | Colored Troops debate and Richmond Congress | playable |
| 26 | Five Forks | playable |
| 27 | Richmond Evacuation | playable |
| 28 | Appomattox / Greensboro / rare independence branch | playable endings |

## Director Rules

- Cedar Creek resolves the election branch from accumulated Cold Harbor, Atlanta, Petersburg, and Valley results.
- A successful Jackson flank assault at Gettysburg opens the recognition interlude only when Albert Sidney Johnston also survived Shiloh. The player may accept the Anglo-French armistice and end the campaign or continue to Chickamauga with recognition recorded but final peace unsecured.
- A McClellan victory requires an unusually strong Confederate political-military sequence. Continuing the war or bargaining for an armistice proceeds to turn 25; accepting conditional reunion under McClellan ends non-AI campaign play at turn 24.
- Divergence below 55% routes to Appomattox. Divergence of 55% or more routes to Greensboro unless the rare ending gate is satisfied.
- The rare peace-crisis ending requires at least 72% divergence, Johnston surviving Shiloh, Jackson surviving Chancellorsville, a successful flank assault on the Jackson-at-Gettysburg branch, a McClellan election victory, and qualifying Atlanta and Valley decisions. No other Gettysburg or McClellan-only route can reach it.
- Cabinet crises trigger below 30 alignment, can occur no more than once per faction, and stop injecting after turn 19 so the final campaign sequence remains intact.
- The Colored Troops debate routes directly to Five Forks so late-war cabinet interruptions do not displace the final campaign.

## Next Agent Assignments

Highest-value proposal targets:

- `spotsylvania_branch`: optional Overland branch only if it adds a distinct operational decision not covered by Wilderness and Cold Harbor.
- `valley_supply_crisis_revision`: factual polish for New Market, Third Winchester, and Cedar Creek food and transport consequences.
- `kentucky_loyalty_branch` or `british_recognition_branch`: alternate-history branches only when they attach cleanly to an existing early or mid-war turn.
- `late_war_source_audit`: primary-source and period-language review for Atlanta, the election, Colored Troops, Five Forks, and the evacuation.

Ending proposals must follow `docs/historical-design-brief.md`. Marginally better Confederate performance should normally route to armistice, conditional reunion, parole, or ambiguous negotiated peace rather than automatic independence.

## Integration Rule

Run content validation, smoke tests, agent tests, and a production build after every change to the campaign spine. Promote agent proposals from `submitted` to `integrated` only after they are playable, sourced, mechanically connected, and reviewed under the Titans Forge Social Science Rubric.
