// Titans of War — Core Historical Scenario Database (12-Turn Grand Campaign)
import { INITIAL_STATE } from './initialState.js';
import { resolveScenarioMedia } from './mediaCatalog.js';
import antietamCard from '../assets/images/antietam_card.jpg';
import appomattoxCard from '../assets/images/appomattox_card.jpg';
import chancellorsvilleCard from '../assets/images/chancellorsville_card.jpg';
import chickamaugaCard from '../assets/images/chickamauga_card.jpg';
import fortSumterCard from '../assets/images/fort_sumter_card.jpg';
import gettysburgCard from '../assets/images/gettysburg_card.jpg';
import manassasBattlefieldCard from '../assets/images/manassas_battlefield_card.jpg';
import petersburgCard from '../assets/images/petersburg_card.jpg';
import secondManassasCard from '../assets/images/second_manassas_card.jpg';
import sevenDaysCard from '../assets/images/seven_days_card.jpg';
import thirdWinchesterCard from '../assets/images/third_winchester_card.jpg';
import wildernessCard from '../assets/images/wilderness_card.jpg';

export { INITIAL_STATE };

export const STATIC_SCENARIOS = [
{
    id: "fort_sumter",
    turn: 1,
    date: "April 12, 1861",
    actor: "Major Robert Anderson",
    roleLabel: "Union Fort Commander",
    image: fortSumterCard,
    title: "The Crisis of Fort Sumter — Opening Shots",
    description: "Your supplies are almost gone. For 34 hours the secessionist batteries have poured shot and shell into the tiny masonry fort in Charleston Harbor. The relief fleet promised by Lincoln is still over the horizon. General Beauregard has sent a final demand: surrender or face annihilation. The eyes of Europe are watching. One wrong move and the war that has not yet officially begun will ignite in blood and fire.",
    letterTarget: "your wife Eba",
    choices: [
      {
        id: "option_a",
        text: "Refuse surrender and return fire aggressively. Hold the masonry.",
        proposer: "hotspur",
        costDescription: "Consumes 20 Military Strength, sparks total war.",
        successRate: 0.5,
        successEffects: {
          metrics: { militaryStrength: -10, munitions: -20, publicMorale: +30, divergenceIndex: +0.10 },
          shards: { hotspur: +35, fox: -5 }
        },
        successConsequence: "Miraculous defense! Sumter's masonry absorbs the shocks as your gunners execute brilliant counter-battery work, caving in Beauregard's mortars. A historic standoff cedes the harbor!",
        failureEffects: {
          metrics: { militaryStrength: -30, munitions: -30, publicMorale: +10 },
          shards: { hotspur: +15, fox: -15 }
        },
        failureConsequence: "The masonry crumbled under a 34-hour bombardment. Fort Sumter fell, but the Union was galvanized into action. The first shots of the war have been fired."
      },
      {
        id: "option_b",
        text: "Negotiate evacuation terms under protest. Preserve your garrison.",
        proposer: "fox",
        costDescription: "Saves military lives, but drops initial Public Morale.",
        effects: {
          metrics: { militaryStrength: -5, publicMorale: -25, treasury: +10 },
          shards: { hotspur: -20, fox: +25, wolf: +10 }
        },
        consequence: "The garrison marched out with honors of war. Lives were saved, but Northern crowds are furious at the surrender. The war begins with a perceived humiliation."
      },
      {
        id: "option_c",
        text: "Delay action by claiming technical valve failures, waiting for the relief fleet.",
        proposer: "wolf",
        costDescription: "Saves munitions, moderate risk of battery containment.",
        effects: {
          metrics: { munitions: -5, militaryStrength: -15, publicMorale: -5 },
          shards: { wolf: +25, hotspur: -10 }
        },
        consequence: "The fleet was driven off by coastal mortars. You held out 2 extra days, but surrender was eventually forced. The South claims a moral victory."
      },
      {
        id: "option_d",
        text: "Spike the heavy columbiad guns and execute a pre-dawn barge escape.",
        proposer: "sovereign",
        costDescription: "Destroys munitions, high tactical divergence.",
        next: "charleston_harbor_escape",
        effects: {
          metrics: { munitions: -40, treasury: -10, divergenceIndex: +0.2 },
          shards: { fox: +15, wolf: +10 }
        },
        consequence: "The barge escape was 100% successful under cover of fog. The columbiads were ruined, depriving the South of heavy artillery. History has already begun to diverge."
      }
    ]
  },

{
    id: "manassas_battlefield",
    turn: 2,
    date: "July 21, 1861",
    actor: "Brig. Gen. Thomas J. Jackson",
    roleLabel: "Confederate Brigade Commander",
    image: manassasBattlefieldCard,
    title: "First Battle of Manassas — Henry Hill Test Run",
    description: "The Virginia sun beats down on Henry Hill. Union columns under McDowell are swinging wide around Sudley Springs, threatening to roll up the Confederate left. General Bee's brigade is already breaking on Matthews Hill. The day is young, but the fate of the infant Confederacy may be decided in the next few hours. If the line collapses here, Richmond is open. If it holds, the South gains a legend.",
    letterTarget: "your wife Anna",
    choices: [
      {
        id: "option_a",
        text: "Charge! Advance Bee's brigade and smash the Union flank.",
        proposer: "hotspur",
        costDescription: "Consumes 20 Military Strength, increases Public Morale significantly.",
        successRate: 0.6,
        successEffects: {
          metrics: { militaryStrength: -10, munitions: -10, publicMorale: +35, divergenceIndex: +0.08 },
          shards: { hotspur: +25 }
        },
        successConsequence: "Flank rolled up! Jackson's charge was a sweeping, coordinated strike, capturing Ricketts' Union battery intact and forcing McDowell into a panicked retreat back across Bull Run!",
        failureEffects: {
          metrics: { militaryStrength: -30, munitions: -20, publicMorale: +10 },
          shards: { hotspur: +10, fox: -20 }
        },
        failureConsequence: "Bee was rallied by your stand, but the charge suffered heavy casualties under canister fire. The phrase 'There stands Jackson like a stone wall' is already spreading through the ranks."
      },
      {
        id: "option_b",
        text: "Hold Henry Hill. Form defensive blocks and let them come to us.",
        proposer: "fox",
        costDescription: "Saves Military Strength, increases defensive alignment.",
        effects: {
          metrics: { militaryStrength: -5, munitions: -5, publicMorale: +10 },
          shards: { hotspur: -10, fox: +25 }
        },
        consequence: "A solid defensive wall. You stood like a stone wall, repelling consecutive charges. The legend of 'Stonewall' Jackson is born in the smoke and heat of this ridge."
      },
      {
        id: "option_c",
        text: "Order tactical withdrawal to the Manassas junction rail depot.",
        proposer: "wolf",
        costDescription: "Saves resources, but drops Public Morale and Hotspur alignment.",
        effects: {
          metrics: { treasury: +10, publicMorale: -25, militaryStrength: 0 },
          shards: { hotspur: -20, fox: +10, wolf: +20 }
        },
        consequence: "The junction was secured cleanly, but the retreat triggered panic on the home front. Newspapers in Richmond are already screaming of betrayal."
      },
      {
        id: "option_d",
        text: "Deploy skirmishers to execute a diversionary flank ride.",
        proposer: "sovereign",
        costDescription: "Consumes 15 Munitions, minor risk, high technical upside.",
        effects: {
          metrics: { munitions: -20, militaryStrength: -10, publicMorale: +5 },
          shards: { fox: +10, wolf: +10 }
        },
        consequence: "The Union columns delayed their advance, confused by the flank scouts. A small tactical success, but one that could grow into something larger if the war drags on."
      }
    ]
  },

{
    id: "charleston_harbor_escape",
    turn: 2,
    date: "April 15, 1861",
    actor: "Major Robert Anderson",
    roleLabel: "Union Harbor Raider",
    image: fortSumterCard,
    title: "Charleston Harbor Escape — Guns in the Fog",
    description: "The barge columns slip out beneath a wet dawn haze while Confederate signal fires burn uselessly along Morris Island. Your garrison lives, the ruined columbiads cannot be turned against the relief fleet, and Washington suddenly possesses a propaganda victory instead of a martyrdom. The war still begins, but its opening chapter is no longer surrender at Sumter; it is an audacious escape that embarrasses Charleston and tempts Lincoln toward sharper coastal action.",
    letterTarget: "your wife Eba",
    choices: [
      {
        id: "option_a",
        text: "Raid the harbor batteries before Confederate crews can reset their guns.",
        proposer: "hotspur",
        costDescription: "High military and munitions cost, strong morale upside.",
        successRate: 0.45,
        successEffects: {
          metrics: { militaryStrength: -12, munitions: -18, publicMorale: +25, divergenceIndex: +0.08 },
          shards: { hotspur: +25, fox: -10 }
        },
        successConsequence: "The night raid wrecked two exposed harbor batteries and sent Charleston into a panic. Northern papers crown the escaped garrison as avengers, and foreign observers suddenly doubt Confederate coastal control.",
        failureEffects: {
          metrics: { militaryStrength: -28, munitions: -22, publicMorale: -5, divergenceIndex: +0.03 },
          shards: { hotspur: +5, fox: -15 }
        },
        failureConsequence: "The raid scattered under canister and searchlight glare. The garrison escaped Sumter only to bleed in the marsh approaches, muting the victory in Washington."
      },
      {
        id: "option_b",
        text: "Preserve the garrison and turn the escape into a disciplined Union recruiting symbol.",
        proposer: "fox",
        costDescription: "Moderate treasury cost, stabilizes morale and command legitimacy.",
        effects: {
          metrics: { treasury: -8, militaryStrength: +8, publicMorale: +12, divergenceIndex: +0.04 },
          shards: { fox: +25, hotspur: -10 }
        },
        consequence: "The survivors parade through Northern cities as proof that restraint and discipline can shame rebellion without squandering lives. Recruiting depots fill faster than expected."
      },
      {
        id: "option_c",
        text: "Send captured harbor charts to European envoys as evidence of Confederate instability.",
        proposer: "wolf",
        costDescription: "Consumes treasury, improves diplomatic leverage through scandal.",
        effects: {
          metrics: { treasury: -12, publicMorale: +4, divergenceIndex: +0.07 },
          shards: { wolf: +25, fox: +5, hotspur: -10 }
        },
        consequence: "British and French consuls receive copies of the harbor charts before Richmond can control the story. Charleston's boast of mastery looks brittle in European salons."
      },
      {
        id: "option_d",
        text: "Scatter the garrison into clandestine coastal teams to harass blockade runners.",
        proposer: "sovereign",
        costDescription: "Radical divergence; drains resources but opens a shadow-war track.",
        effects: {
          metrics: { militaryStrength: -10, munitions: -10, treasury: -8, divergenceIndex: +0.12 },
          shards: { wolf: +15, hotspur: +10, fox: -15 }
        },
        consequence: "Anderson's men disappear into inlet stations and loyalist safehouses. The coast war begins months ahead of schedule, severing the campaign from orthodox chronology."
      }
    ]
  },

  {
    id: "naval_technology",
    turn: 3,
    date: "March 8, 1862",
    actor: "Secretary Stephen Mallory",
    roleLabel: "Confederate Navy Secretary",
    image: chancellorsvilleCard,
    title: "Naval Technology — The Blockade & Experimental Warfare",
    description: "The Union blockade has tightened its iron grip on our ports, strangling commerce and isolating the Confederacy from Europe. In Richmond, the war cabinet debates how to break the naval stranglehold. Faction advisors urge vastly different technological solutions. Hotspur demands placing all available treasury into armored ironclads to challenge the Union navy directly in Hampton Roads. Fox advocates building heavy steam-propelled river ironclads and naval mines to defend the Mississippi. Wolf urges backing Singer's Secret Service corps to develop the H.L. Hunley, an experimental stealth submarine, to execute night raids on the blockade.",
    letterTarget: "your daughter Ruby",
    choices: [
      {
        id: "option_a",
        text: "Fund the ironclad CSS Virginia to break the blockade at Hampton Roads.",
        proposer: "hotspur",
        costDescription: "Consumes 20 Treasury, boosts Military Strength significantly.",
        successRate: 0.6,
        successEffects: {
          metrics: { treasury: -20, militaryStrength: +25, publicMorale: +15, divergenceIndex: +0.05 },
          shards: { hotspur: +25, fox: -10 }
        },
        successConsequence: "Breakthrough! The armored CSS Virginia steamrolls the Union fleet at Hampton Roads, sinking the Cumberland and Congress in fire. The world learns of the first ironclad clash!",
        failureEffects: {
          metrics: { treasury: -25, militaryStrength: -10, publicMorale: -10 },
          shards: { hotspur: +10, fox: -15 }
        },
        failureConsequence: "The CSS Virginia ran aground under heavy mortar fire. Though it proved the concept of armor, the blockade remains unbroken, and the vessel was burned to prevent capture."
      },
      {
        id: "option_b",
        text: "Deploy steam river ironclads and electric naval mines for Mississippi defense.",
        proposer: "fox",
        costDescription: "Consumes 15 Munitions and 10 Treasury, secures inland waterways.",
        effects: {
          metrics: { munitions: -15, treasury: -10, militaryStrength: +15, publicMorale: +10 },
          shards: { fox: +25, hotspur: -5, wolf: +5 }
        },
        consequence: "Heavy river batteries and contact mines successfully hold off Union ironclads on the Mississippi, securing Vicksburg's supply lines for another season."
      },
      {
        id: "option_c",
        text: "Quietly fund the H.L. Hunley submarine project for stealth torpedo operations.",
        proposer: "wolf",
        costDescription: "Consumes 25 Treasury, high strategic risk and divergence.",
        successRate: 0.4,
        successEffects: {
          metrics: { treasury: -25, militaryStrength: +10, publicMorale: +25, divergenceIndex: +0.15 },
          shards: { wolf: +30, hotspur: -5 }
        },
        successConsequence: "Historical stealth raid! The submarine H.L. Hunley successfully sinks the USS Housatonic with a spar torpedo in Charleston Harbor, inaugurating the age of submarine warfare!",
        failureEffects: {
          metrics: { treasury: -25, militaryStrength: -15, publicMorale: -15, divergenceIndex: +0.05 },
          shards: { wolf: +10, hotspur: -10 }
        },
        failureConsequence: "Tragedy in the harbor. The experimental submarine Hunley sank during a training run, claiming the lives of its crew, including its inventor Horace Hunley."
      },
      {
        id: "option_d",
        text: "Purchase state-of-the-art Whitworth rifled cannon from British manufacturers.",
        proposer: "sovereign",
        costDescription: "Consumes 30 Treasury, drastically increases Munitions.",
        effects: {
          metrics: { treasury: -30, munitions: +35, militaryStrength: +10 },
          shards: { fox: +15, wolf: +10 }
        },
        consequence: "The highly accurate Whitworth rifled guns arrive via blockade runners, transforming Confederate siege battery effectiveness across the theaters."
      }
    ]
  },

{
    id: "seven_days",
    turn: 4,
    date: "June 25, 1862",
    actor: "General Robert E. Lee",
    roleLabel: "Commander of Northern Virginia",
    image: sevenDaysCard,
    title: "The Seven Days Battles — Saving Richmond",
    description: "McClellan's massive Army of the Potomac — over 100,000 men — looms just six miles outside Richmond. The Confederate capital is in a state of near-panic. Hotspur demands immediate aggressive flank offensives across the Chickahominy to smash the Union right before it can dig in. Fox urges the rapid construction of heavy earthworks around the capital gates. Wolf whispers of back-channel peace feelers through Northern copperheads. The fate of the Confederacy may be decided in the next ten days of fighting.",
    letterTarget: "your wife Mary",
    choices: [
      {
        id: "option_a",
        text: "Launch aggressive assault on Fitz John Porter's right flank at Mechanicsville.",
        proposer: "hotspur",
        costDescription: "High Military Strength cost, saves Richmond from siege.",
        effects: {
          metrics: { militaryStrength: -25, munitions: -20, publicMorale: +25 },
          shards: { hotspur: +25, fox: -10 }
        },
        consequence: "A bloody repulse at Mechanicsville, but the sheer aggression and unexpected counter-attacks panicked McClellan, forcing his army into a retreat down the Peninsula. The Seven Days have begun in fire."
      },
      {
        id: "option_b",
        text: "Form heavy earthwork fortifications around the Richmond perimeter.",
        proposer: "fox",
        costDescription: "Saves resources, but allows Union heavy siege guns to deploy.",
        effects: {
          metrics: { militaryStrength: -5, munitions: -5, publicMorale: -15 },
          shards: { fox: +25, hotspur: -15 }
        },
        consequence: "Earthworks held, but McClellan successfully deployed siege mortars, pounding Richmond outskirts daily. The capital survived, but at terrible cost to civilian morale."
      },
      {
        id: "option_c",
        text: "Initiate back-channel peace proposals through northern copperheads.",
        proposer: "wolf",
        minDivergence: 0.12,
        costDescription: "Drains Treasury, high strategic divergence. Unlocked on Drifting timelines.",
        effects: {
          metrics: { treasury: -15, publicMorale: +15, divergenceIndex: +0.15 },
          shards: { wolf: +30, fox: -10 }
        },
        consequence: "Copperhead networks amplified the peace signals. Northern morale staggered, but McClellan's lines remained intact. The war continues, but the political landscape has shifted."
      },
      {
        id: "option_d",
        text: "Redirect Stuart's cavalry to execute a complete circular flank ride.",
        proposer: "sovereign",
        costDescription: "Consumes 15 Munitions, minor military payoff, massive intelligence gain.",
        effects: {
          metrics: { munitions: -15, militaryStrength: -5, publicMorale: +15 },
          shards: { fox: +15, wolf: +10 }
        },
        consequence: "Stuart successfully rode entirely around McClellan's army, capturing vital blueprints, logistics maps, and even McClellan's own dispatch book. A daring coup that will echo through the war."
      }
    ]
  },

{
    id: "second_manassas",
    turn: 5,
    date: "August 29, 1862",
    actor: "General Robert E. Lee",
    roleLabel: "Army Commander",
    image: secondManassasCard,
    title: "Second Battle of Manassas — The Trap",
    description: "Jackson has successfully lured Pope's Union army into attacking his hidden line along the Stony Ridge railway cut. For two days the 'foot cavalry' has absorbed the blows, drawing the enemy deeper into the trap. Longstreet's massive wing has arrived on Pope's exposed flank, but Longstreet hesitates, preferring a reconnaissance-in-force. The moment for the decisive blow is slipping away. If Pope realizes the danger and withdraws, the opportunity of the war may be lost. The eyes of the South are upon this ridge.",
    letterTarget: "your daughter Mildred",
    choices: [
      {
        id: "option_a",
        text: "Order Longstreet to launch an immediate, massive flank attack.",
        proposer: "hotspur",
        costDescription: "Consumes 25 Military Strength, sweeps Pope from the field.",
        effects: {
          metrics: { militaryStrength: -25, munitions: -20, publicMorale: +30 },
          shards: { hotspur: +30, fox: -15 }
        },
        consequence: "The largest flank attack of the war. Longstreet crushed the Union left, forcing Pope into a chaotic retreat to Washington. The South's greatest tactical victory of the war."
      },
      {
        id: "option_b",
        text: "Approve Longstreet's recon-in-force. Hold defensive positions until Sol 2 dawn.",
        proposer: "fox",
        maxDivergence: 0.40,
        costDescription: "Preserves military cores, but allows Pope to reinforce. Unavailable on highly diverged timelines.",
        effects: {
          metrics: { militaryStrength: -5, munitions: -10, publicMorale: +10 },
          shards: { fox: +25, hotspur: -20 }
        },
        consequence: "Pope detected the flank force and executed a structured night withdrawal, escaping the trap. The moment passed. The war will be longer for it."
      },
      {
        id: "option_c",
        text: "Request immediate diplomatic mediator signals via British consuls.",
        proposer: "wolf",
        costDescription: "Consumes 15 Treasury, boosts foreign leverage.",
        effects: {
          metrics: { treasury: -15, publicMorale: +5 },
          shards: { wolf: +25, hotspur: -10 }
        },
        consequence: "British consuls forwarded battle status to London, accelerating debate on potential mediation. Europe takes notice of the South's battlefield success."
      },
      {
        id: "option_d",
        text: "Order Stuart to execute a midnight raid on Pope's logistics depot at Catlett's Station.",
        proposer: "sovereign",
        costDescription: "Yields massive Munitions and Treasury.",
        effects: {
          metrics: { munitions: +35, treasury: +20, militaryStrength: -5 },
          shards: { fox: +15, hotspur: +10 }
        },
        consequence: "Incredible success. Stuart captured Pope's personal dispatch book and 300,000 dollars in treasury bonds. The intelligence haul will shape the next phase of the war."
      }
    ],
    branches: [
      { minDivergence: 0.22, scenarioId: "potomac_leverage_campaign" }
    ]
  },

{
    id: "antietam",
    turn: 6,
    date: "September 17, 1862",
    actor: "General Robert E. Lee",
    roleLabel: "Army Commander",
    image: antietamCard,
    title: "Battle of Antietam — Sharpsburg Threshold",
    description: "Your army is backed against the Potomac River near Sharpsburg. McClellan has discovered your lost order 191 and is launching massive, consecutive assaults on your left flank at the Cornfield and center at the Bloody Lane. Your lines are at breaking point. The sun rises on what will become the bloodiest single day in American history. A single mistake here could end the Confederate cause. Yet a victory could force European recognition and break the Union will. The weight of the nation rests on these corn rows and sunken roads.",
    letterTarget: "your wife Mary",
    choices: [
      {
        id: "option_a",
        text: "Stand firm in the Bloody Lane. Order a desperate bayonet counter-charge.",
        proposer: "hotspur",
        costDescription: "Catastrophic Military casualties, absolute survival threshold.",
        effects: {
          metrics: { militaryStrength: -35, munitions: -25, publicMorale: +10 },
          shards: { hotspur: +30, fox: -30 }
        },
        consequence: "The lane held by a thread, but the division was utterly mangled. The field is a slaughterhouse. The bloodiest day in American history ends in tactical stalemate."
      },
      {
        id: "option_b",
        text: "Order structured tactical withdrawal across the Potomac during the night.",
        proposer: "fox",
        costDescription: "Preserves the army core, but concludes the Northern invasion.",
        effects: {
          metrics: { militaryStrength: -5, publicMorale: -20, treasury: +5 },
          shards: { fox: +25, hotspur: -20 }
        },
        consequence: "Orderly retreat completed. The army survived to fight another day, but the retreat allowed Lincoln to issue the Emancipation Proclamation. The war has changed forever."
      },
      {
        id: "option_c",
        text: "Leverage the Maryland copperhead networks to delay Union supply trains.",
        proposer: "wolf",
        costDescription: "Consumes 20 Treasury, slightly reduces Union pressure.",
        effects: {
          metrics: { treasury: -20, munitions: +10, publicMorale: +5 },
          shards: { wolf: +25, fox: 0 }
        },
        consequence: "Train lines sabotaged, slowing McClellan's ammunition wagons and stabilizing the line. The battle ends in bloody stalemate, but the South lives to fight on."
      },
      {
        id: "option_d",
        text: "Execute a dangerous tactical flank march through the Potomac canal beds.",
        proposer: "sovereign",
        minDivergence: 0.15,
        costDescription: "High divergence, massive military risk. Unlocked on Drifting timelines.",
        effects: {
          metrics: { militaryStrength: -20, munitions: -10, divergenceIndex: +0.25 },
          shards: { hotspur: +10, wolf: +10 }
        },
        consequence: "Brilliant maneuver. You completely bypassed McClellan's right flank, slipping into his rear. A daring escape that preserves the army but cedes the strategic initiative."
      }
    ]
  },

{
    id: "potomac_leverage_campaign",
    turn: 6,
    date: "September 1862",
    actor: "General Robert E. Lee",
    roleLabel: "Army Commander",
    image: antietamCard,
    title: "The Potomac Leverage Campaign — Maryland In Doubt",
    description: "Victory at Second Manassas has not yet funneled you into the historical killing ground at Sharpsburg. Instead, the army is moving through a Maryland landscape full of frightened militia, wavering civilians, and vulnerable depots while Washington struggles to understand whether Lee means to strike Baltimore, sever the railroads, or merely loot and withdraw. The question is whether this wider shock can be converted into political leverage before shoes wear through, enlistments expire, and McClellan finally concentrates his masses.",
    letterTarget: "your wife Mary",
    choices: [
      {
        id: "option_a",
        text: "Drive hard for the Baltimore & Ohio corridor and force Maryland into open panic.",
        proposer: "hotspur",
        costDescription: "Heavy military strain, strong morale surge, major divergence.",
        effects: {
          metrics: { militaryStrength: -20, munitions: -15, publicMorale: +20, divergenceIndex: +0.12 },
          shards: { hotspur: +25, fox: -15 }
        },
        consequence: "Rail bridges and depots fall in quick succession, and Maryland politics tremble. The advance thrills the South, but every mile north worsens straggling and supply exhaustion."
      },
      {
        id: "option_b",
        text: "Consolidate around Frederick and force the Union to attack a prepared line.",
        proposer: "fox",
        costDescription: "Lower losses, steadier supply position, modest divergence.",
        effects: {
          metrics: { militaryStrength: -8, munitions: -8, publicMorale: +10, treasury: +5, divergenceIndex: +0.06 },
          shards: { fox: +25, hotspur: -10 }
        },
        consequence: "The army stops lunging for a decisive blow and begins acting like an occupying force with prepared positions. The campaign loses romance, but gains order."
      },
      {
        id: "option_c",
        text: "Flood European consuls and the Northern press with peace feelers while the invasion still shocks opinion.",
        proposer: "wolf",
        costDescription: "Treasury strain, diplomatic upside, strong political divergence.",
        effects: {
          metrics: { treasury: -18, publicMorale: +8, divergenceIndex: +0.15 },
          shards: { wolf: +30, fox: +5, hotspur: -10 }
        },
        consequence: "British and French observers begin treating the Maryland campaign as a political crisis rather than just another raid. Recognition still does not come, but the war's diplomatic tempo changes."
      },
      {
        id: "option_d",
        text: "Strip Maryland depots of shoes, grain, and horses, then slip back across the Potomac on your own timetable.",
        proposer: "sovereign",
        costDescription: "Moderate military cost, strong supply gain, continued divergence.",
        effects: {
          metrics: { militaryStrength: -10, munitions: +15, treasury: +20, divergenceIndex: +0.08 },
          shards: { fox: +15, wolf: +10 }
        },
        consequence: "The army leaves with wagons full of hard material instead of one climactic battlefield legend. It is less glorious than Antietam, but materially better for keeping the army alive."
      }
    ]
  },

{
    id: "chancellorsville_aftermath",
    turn: 7,
    date: "May 5, 1863",
    actor: "President Jefferson Davis",
    roleLabel: "President of the Confederacy",
    image: chancellorsvilleCard,
    title: "Politics Integrated — Chancellorsville Aftermath",
    description: "Chancellorsville is yours. Hooker is routed, Sedgwick is smashed, but Jackson mends from severe wounds. The greatest tactical victory of the war has been won at terrible cost. The North reels. Lincoln calls for 300,000 volunteers. Europe watches with growing interest. Yet the loss of Jackson's arm and the political infighting in Richmond threaten to squander the moment. This is the high-water mark of Confederate military success — and the moment when politics and personality may decide the fate of the nation.",
    letterTarget: "your wife Varina",
    choices: [
      {
        id: "option_a",
        text: "Bold Offensive. Authorize immediate tactical counter-invasion of Maryland.",
        proposer: "hotspur",
        costDescription: "Consumes 25 Military Strength, 20 Munitions. High divergence.",
        effects: {
          metrics: { militaryStrength: -25, munitions: -20, publicMorale: +25 },
          shards: { hotspur: +25, fox: -15 }
        },
        consequence: "The counter-invasion re-ignites home front zeal, but stretches logistics to the limit. The gamble of 1862 is repeated with higher stakes."
      },
      {
        id: "option_b",
        text: "Conscription Drive. Form defensive lines on the Rappahannock.",
        proposer: "fox",
        costDescription: "Increases Military Strength, but drains Treasury and Morale.",
        effects: {
          metrics: { militaryStrength: +20, treasury: -15, publicMorale: -15 },
          shards: { fox: +25, hotspur: -10 }
        },
        consequence: "Fresh conscripts fill the ranks, but civilian families are deeply disgruntled by drafts. The South's manpower crisis deepens."
      },
      {
        id: "option_c",
        text: "Envoys to Paris/London. Offer full trade access in exchange for recognition.",
        proposer: "wolf",
        costDescription: "Consumes 20 Treasury, boosts Diplomatic leverage.",
        effects: {
          metrics: { treasury: -20, publicMorale: +10 },
          shards: { wolf: +30, hotspur: -5 }
        },
        consequence: "British cabinet debates recognition, but demand structural proof of stability. The victory at Chancellorsville has bought time — and leverage."
      },
      {
        id: "option_d",
        text: "Divert all cotton stockpiles to seize the Baltimore & Ohio Railroad.",
        proposer: "sovereign",
        costDescription: "Generates massive Treasury, slight military risk.",
        effects: {
          metrics: { treasury: +35, militaryStrength: -10, munitions: -10 },
          shards: { fox: +15, wolf: -5 }
        },
        consequence: "B&O supply nodes seized. Massive cotton revenues flow into the war chest. A daring economic strike that could change the financial calculus of the war."
      }
    ],
    branches: [
      { minDivergence: 0.35, scenarioId: "susquehanna_offensive" }
    ]
  },

{
    id: "gettysburg_decision",
    turn: 8,
    date: "July 3, 1863",
    actor: "General Robert E. Lee",
    roleLabel: "Commander of Northern Virginia",
    image: gettysburgCard,
    title: "The Gettysburg Crisis — Cemetery Ridge",
    description: "Cemetery Ridge looms in the extreme summer heat. Day 2 flanking attacks have failed with heavy loss. Longstreet is nearly mutinous, urging immediate tactical withdrawal south before the army is destroyed. General Pickett's fresh division stands ready, awaiting your charge order. The entire war may turn on the next few hours. A successful assault could break the Union center and open the road to Washington. Failure will bleed the Army of Northern Virginia white on these Pennsylvania slopes.",
    letterTarget: "your wife Mary",
    choices: [
      {
        id: "option_a",
        text: "Charge Pickett's Division straight up the center.",
        proposer: "hotspur",
        costDescription: "Incurs catastrophic Military losses, high morale risk.",
        successRate: 0.35,
        successEffects: {
          metrics: { militaryStrength: -20, munitions: -20, publicMorale: +40, divergenceIndex: +0.40 },
          shards: { hotspur: +35, fox: -10 }
        },
        successConsequence: "The High Water Mark breached! Against all historical odds, Armistead's brigade pierces the stone wall at Cemetery Ridge, routing Webb's center. Meade's army retreats; Philadelphia lies open!",
        failureEffects: {
          metrics: { militaryStrength: -40, munitions: -30, publicMorale: -25 },
          shards: { hotspur: +10, fox: -35 }
        },
        failureConsequence: "The charge reached the copse of trees, but was utterly shredded by canister fire. A tactical disaster that will haunt the South for generations."
      },
      {
        id: "option_b",
        text: "Decline the charge. Reposition south to force Meade to attack us.",
        proposer: "fox",
        costDescription: "Preserves military core, shifts strategic coordinate.",
        effects: {
          metrics: { militaryStrength: -5, munitions: -5, publicMorale: +15 },
          shards: { fox: +25, hotspur: -20 }
        },
        consequence: "Meade declines to attack, forcing a stand-off. Pickett's division survives intact. The invasion ends, but the army lives to fight another day."
      },
      {
        id: "option_c",
        text: "Execute immediate orderly retreat to Virginia through Potomac passes.",
        proposer: "wolf",
        costDescription: "Saves resources, but caps campaign.",
        effects: {
          metrics: { treasury: +10, publicMorale: -20, militaryStrength: 0 },
          shards: { wolf: +25, hotspur: -20 }
        },
        consequence: "Orderly withdrawal completed. The invasion is over, but the army remains strong and ready. Foreign powers take note of the disciplined retreat."
      },
      {
        id: "option_d",
        text: "Deploy Stuart's Cavalry in a sweeping deep rear-guard raid.",
        proposer: "sovereign",
        costDescription: "Consumes 15 Munitions, moderate military payoff.",
        effects: {
          metrics: { munitions: -15, militaryStrength: -10, treasury: +15 },
          shards: { fox: +10, hotspur: +10 }
        },
        consequence: "Stuart disrupted Union communications lines, seizing 50 supply wagons and critical dispatches. A daring raid that buys time and intelligence, even as the main army withdraws."
      }
    ]
  },

{
    id: "susquehanna_offensive",
    turn: 8,
    date: "June 1863",
    actor: "General Robert E. Lee",
    roleLabel: "Commander of Northern Virginia",
    image: gettysburgCard,
    title: "The Susquehanna Offensive — Pennsylvania Panic",
    description: "The campaign has slipped off its historical rails. Instead of concentrating at Gettysburg, Confederate columns have spread alarm through south-central Pennsylvania, threatening the Susquehanna crossings and sending Harrisburg, York, and Philadelphia into political panic. Northern governors demand militia mobilization while Washington struggles to determine where Lee's true weight lies. The strategic question is no longer whether to assault Cemetery Ridge; it is whether this wider incursion can be converted into leverage before logistics, enlistments, and public patience begin to fail.",
    letterTarget: "your wife Mary",
    choices: [
      {
        id: "option_a",
        text: "Force the Susquehanna crossings and drive directly toward Harrisburg's depots.",
        proposer: "hotspur",
        costDescription: "Heavy military cost, sharp morale surge, major divergence.",
        effects: {
          metrics: { militaryStrength: -20, munitions: -20, publicMorale: +25, divergenceIndex: +0.18 },
          shards: { hotspur: +25, fox: -15 }
        },
        consequence: "The crossings are seized in violent confusion, sending militia and railroad officials fleeing west. The raid electrifies the South, but every mile deeper into Pennsylvania stretches supply and discipline thinner."
      },
      {
        id: "option_b",
        text: "Entrench along the river line and force Meade to attack on your terms.",
        proposer: "fox",
        costDescription: "Lower losses, steadier line, modest divergence gain.",
        effects: {
          metrics: { militaryStrength: -8, munitions: -8, publicMorale: +10, divergenceIndex: +0.08 },
          shards: { fox: +25, hotspur: -15 }
        },
        consequence: "Earthworks and river screens blunt the Union response. Pennsylvania remains under threat, but the campaign shifts from glorious gamble to disciplined positional pressure."
      },
      {
        id: "option_c",
        text: "Exploit the panic by floating an armistice proposal through British and French channels.",
        proposer: "wolf",
        costDescription: "Treasury strain, diplomatic upside, high political divergence.",
        effects: {
          metrics: { treasury: -20, publicMorale: +5, divergenceIndex: +0.15 },
          shards: { wolf: +30, fox: +5, hotspur: -10 }
        },
        consequence: "European papers fill with reports of Pennsylvania panic and northern militia confusion. No armistice comes at once, but the war's diplomatic geometry changes overnight."
      },
      {
        id: "option_d",
        text: "Strip the rail depots, seize shoes and grain, and withdraw before Meade can pin you down.",
        proposer: "sovereign",
        costDescription: "Moderate cost, major supply gain, continued divergence.",
        effects: {
          metrics: { militaryStrength: -10, munitions: +15, treasury: +20, divergenceIndex: +0.10 },
          shards: { fox: +15, wolf: +10 }
        },
        consequence: "The army pulls south with wagons full of shoes, rails, and flour instead of a single climactic battlefield victory. It is less glorious than Gettysburg, but materially better for keeping men in the ranks."
      }
    ]
  },

{
    id: "chickamauga",
    turn: 9,
    date: "September 19, 1863",
    actor: "General Braxton Bragg",
    roleLabel: "Army Commander",
    image: chickamaugaCard,
    title: "Battle of Chickamauga — River of Death",
    description: "Rosecrans' Union army has slipped into Georgia. You have intercepted them near Chickamauga Creek in heavy woods where visibility is zero. The 'River of Death' runs red before the fighting even begins. Longstreet's fresh divisions are arriving by rail from Virginia, but your relations with your own subordinates — especially the proud Longstreet — are completely toxic. One misstep in these tangled thickets and the entire Western theater could collapse. The South's last great chance to break the Union hold on Tennessee hangs in the balance.",
    letterTarget: "your wife Elise",
    choices: [
      {
        id: "option_a",
        text: "Launch aggressive frontal assaults through the dense undergrowth.",
        proposer: "hotspur",
        costDescription: "Heavy Military casualties, high risk.",
        effects: {
          metrics: { militaryStrength: -25, munitions: -20, publicMorale: +15 },
          shards: { hotspur: +25, fox: -15 }
        },
        consequence: "Severe casualties in the dense woods. The battle resolved into a chaotic brawl with no clear advantage. The Army of Tennessee bleeds for little gain."
      },
      {
        id: "option_b",
        text: "Deploy Longstreet's fresh division in a concentrated column attack through the center gap.",
        proposer: "fox",
        costDescription: "Consumes 15 Munitions, high tactical payoff.",
        effects: {
          metrics: { munitions: -15, militaryStrength: -10, publicMorale: +25 },
          shards: { fox: +30, hotspur: 0 }
        },
        consequence: "Incredible breakthrough! Longstreet exploited a major gap in the Union line, routing their entire right wing. One of the great tactical successes of the war — if only Bragg could capitalize on it."
      },
      {
        id: "option_c",
        text: "Request immediate strategic coordination and advice from Richmond war cabinet.",
        proposer: "wolf",
        costDescription: "Saves resources, but delays action.",
        effects: {
          metrics: { treasury: -10, publicMorale: +5 },
          shards: { wolf: +25, hotspur: -10 }
        },
        consequence: "Bragg spent crucial hours debating with Davis's envoys, allowing Rosecrans to fortify Chattanooga. The moment of victory slipped away in committee."
      },
      {
        id: "option_d",
        text: "Divert cavalry to sever the Chattanooga rail bridges completely.",
        proposer: "sovereign",
        costDescription: "Consumes 20 Munitions, isolates Union army.",
        effects: {
          metrics: { munitions: -20, militaryStrength: -5, treasury: +15 },
          shards: { fox: +15, wolf: +10 }
        },
        consequence: "The bridges were successfully burned, leaving Rosecrans' supply lines completely severed. A brilliant economy-of-force move that buys time for the Confederacy in the West."
      }
    ],
    branches: [
      { minDivergence: 0.35, scenarioId: "chattanooga_stranglehold" }
    ]
  },

{
    id: "wilderness",
    turn: 10,
    date: "May 6, 1864",
    actor: "General Robert E. Lee",
    roleLabel: "Army Commander",
    image: wildernessCard,
    title: "Battle of the Wilderness — The Burning Woods",
    description: "Grant has crossed the Rapahannock into the tangled secondary growth known as the Wilderness — a nightmare of dense brush, ravines, and second-growth timber where artillery is almost useless. Your numbers are half of his, but the terrain neutralizes his advantage. The dry undergrowth has caught fire from the fighting, and wounded men are burning alive in the flames. The air is thick with smoke and the screams of the dying. This is not a battle of lines and formations — it is a brutal, confused brawl in hell. Grant has sworn to fight it out on this line if it takes all summer.",
    letterTarget: "your wife Mary",
    choices: [
      {
        id: "option_a",
        text: "Order immediate flank assault through the burning brush under General Gordon.",
        proposer: "hotspur",
        costDescription: "High Military casualties, massive risk of smoke inhalation.",
        effects: {
          metrics: { militaryStrength: -25, munitions: -15, publicMorale: +15 },
          shards: { hotspur: +25, fox: -10 }
        },
        consequence: "The flank attack rolled up Grant's right wing, but the raging brushfire prevented complete destruction. The Wilderness remains a charnel house."
      },
      {
        id: "option_b",
        text: "Fortify along the Brock Road intersection. Force Grant to attack your earthworks.",
        proposer: "fox",
        costDescription: "Saves resources, holds vital crossroads.",
        effects: {
          metrics: { militaryStrength: -5, munitions: -10, publicMorale: +10 },
          shards: { fox: +25, hotspur: -15 }
        },
        consequence: "Grant launched bloody assaults against your earthworks, suffering massive casualties before shifting south. The Wilderness campaign has begun in earnest."
      },
      {
        id: "option_c",
        text: "Issue a public call for immediate humane truce to rescue wounded from the fire.",
        proposer: "wolf",
        minDivergence: 0.22,
        costDescription: "Boosts Public Morale, temporarily freezes conflict. Unlocked on Branching timelines.",
        effects: {
          metrics: { publicMorale: +25, militaryStrength: 0 },
          shards: { wolf: +30, hotspur: -20 }
        },
        consequence: "A noble truce was accepted. 800 wounded were saved, significantly boosting civilian morale on both sides. Even in the midst of horror, humanity prevailed — for a moment."
      },
      {
        id: "option_d",
        text: "Redirect Stuart's replacement cavalry to execute a raid on Grant's supply train at Belle Plain.",
        proposer: "sovereign",
        costDescription: "Yields massive Munitions.",
        effects: {
          metrics: { munitions: +30, treasury: +10, militaryStrength: -5 },
          shards: { fox: +15, wolf: +10 }
        },
        consequence: "The raid captured 120 supply wagons, alleviating the army's acute starvation. A daring strike that keeps the Army of Northern Virginia in the field a little longer."
      }
    ]
  },

{
    id: "chattanooga_stranglehold",
    turn: 10,
    date: "October 1863",
    actor: "General Braxton Bragg",
    roleLabel: "Army Commander",
    image: chickamaugaCard,
    title: "Chattanooga Stranglehold — The Rail Noose",
    description: "This campaign no longer follows the familiar slide from Chickamauga to Confederate drift. The crossings and rail approaches to Chattanooga are badly severed, Union recovery is slower, and the question in the Western Theater is whether this advantage can be converted into something larger before Grant restores order. Confederate leaders argue over whether to storm the heights, tighten the siege, weaponize the political shock in the North, or break eastward for more depots before the moment closes.",
    letterTarget: "President Davis",
    choices: [
      {
        id: "option_a",
        text: "Storm the Chattanooga heights before the Union can recover its nerve.",
        proposer: "hotspur",
        costDescription: "Heavy military losses, morale gain, major divergence.",
        effects: {
          metrics: { militaryStrength: -25, munitions: -20, publicMorale: +20, divergenceIndex: +0.12 },
          shards: { hotspur: +25, fox: -15 }
        },
        consequence: "The assault turns the siege into a brutal contest for the ridges. Victory seems possible, but only at the cost of exhausting the very army that created the opportunity."
      },
      {
        id: "option_b",
        text: "Tighten the rail siege, ration ammunition, and starve the garrison into retreat.",
        proposer: "fox",
        costDescription: "Modest losses, treasury gain, steadier control of the theater.",
        effects: {
          metrics: { militaryStrength: -10, munitions: -10, treasury: +10, publicMorale: +10, divergenceIndex: +0.08 },
          shards: { fox: +25, hotspur: -10 }
        },
        consequence: "The war in Tennessee becomes one of rails, depots, and patience rather than single-day glory. It is less theatrical than an assault, but more sustainable."
      },
      {
        id: "option_c",
        text: "Use the siege to fuel Northern peace agitation and an exchange-and-armistice campaign.",
        proposer: "wolf",
        costDescription: "Treasury cost, morale gain, strong political divergence.",
        effects: {
          metrics: { treasury: -15, publicMorale: +10, divergenceIndex: +0.14 },
          shards: { wolf: +30, hotspur: -10 }
        },
        consequence: "Newspapers in the North begin treating Chattanooga as a political embarrassment as much as a military one. No armistice arrives, but the siege now has a political front."
      },
      {
        id: "option_d",
        text: "Detach Longstreet eastward to strip Knoxville and the rail depots before Grant can restore the line.",
        proposer: "sovereign",
        costDescription: "Moderate military cost, strong supply upside, continued divergence.",
        effects: {
          metrics: { militaryStrength: -12, munitions: +10, treasury: +20, divergenceIndex: +0.10 },
          shards: { fox: +10, wolf: +15 }
        },
        consequence: "The theater fragments into simultaneous operations, but the material reward is immediate. More wagons, more rails, and more food now move under Confederate control."
      }
    ]
  },

{
    id: "third_winchester",
    turn: 11,
    date: "September 19, 1864",
    actor: "Lt. Gen. Jubal Early",
    roleLabel: "Valley District Commander",
    image: thirdWinchesterCard,
    title: "Third Winchester — The Valley Campaign",
    description: "Sheridan's massive Union army of 40,000 has cornered your force of 12,000 near Winchester in the Shenandoah Valley. Your lines are stretched dangerously thin across Opequon Creek. Sheridan's cavalry is executing sweeping maneuvers on your left flank, threatening to envelop your entire command. The Valley has been the breadbasket of the Confederacy; if it falls, Richmond's days are numbered. This is the last desperate stand of the Army of the Valley — and the moment when Early's reputation will be made or broken forever.",
    letterTarget: "General Lee",
    choices: [
      {
        id: "option_a",
        text: "Order desperate infantry charge on Sheridan's center at the Canyon.",
        proposer: "hotspur",
        costDescription: "Extreme Military losses, high risk of routing.",
        effects: {
          metrics: { militaryStrength: -30, munitions: -20, publicMorale: -5 },
          shards: { hotspur: +25, fox: -25 }
        },
        consequence: "The infantry charged gallantly, but Sheridan's massive reserves crushed the assault, forcing a retreat. The Valley is lost, and with it, the South's last great breadbasket."
      },
      {
        id: "option_b",
        text: "Fall back to the stone walls south of Winchester. Form tight defensive rings.",
        proposer: "fox",
        costDescription: "Saves Military core, retreats from Winchester.",
        effects: {
          metrics: { militaryStrength: -10, publicMorale: -15, munitions: -5 },
          shards: { fox: +25, hotspur: -10 }
        },
        consequence: "The stone walls held, preventing a total rout, but Winchester fell into Sheridan's hands. The Valley campaign has turned decisively against the Confederacy."
      },
      {
        id: "option_c",
        text: "Leverage copperhead networks to spread rumors of Sheridan's imminent defeat.",
        proposer: "wolf",
        costDescription: "Consumes 15 Treasury, minor morale boost.",
        effects: {
          metrics: { treasury: -15, publicMorale: +10 },
          shards: { wolf: +25, hotspur: -5 }
        },
        consequence: "The rumors caused panic in Washington, delaying Sheridan's advance for 3 crucial days. A small political victory in a campaign of military defeats."
      },
      {
        id: "option_d",
        text: "Execute a rapid tactical flank march through the Shenandoah caverns.",
        proposer: "sovereign",
        minDivergence: 0.12,
        costDescription: "High divergence, escape the trap cleanly. Unlocked on Drifting timelines.",
        effects: {
          metrics: { militaryStrength: -5, munitions: -5, divergenceIndex: +0.2 },
          shards: { fox: +15, wolf: +10 }
        },
        consequence: "Brilliant maneuver. The caverns allowed your force to slip away, evading Sheridan's cavalry trap. A daring escape that keeps the Army of the Valley in the field a little longer."
      }
    ]
  },

{
    id: "petersburg_siege",
    turn: 12,
    date: "November 1864",
    actor: "General Robert E. Lee",
    roleLabel: "Army Commander",
    image: petersburgCard,
    title: "The Siege of Petersburg — The Crater",
    description: "Your army is locked in a massive 30-mile network of cold, muddy trenches around Petersburg. For months the siege has ground on, turning the once-thriving rail hub into a charnel house of disease and despair. The Union has detonated an enormous gunpowder mine under your lines, creating a massive crater in your sector. Union forces are pouring into the breach like a flood. This is the moment when the entire defensive line could collapse — or when a desperate counterattack could buy the Confederacy a few more months of life.",
    letterTarget: "your wife Mary",
    choices: [
      {
        id: "option_a",
        text: "Launch an immediate, desperate counter-attack into the crater under Mahone.",
        proposer: "hotspur",
        costDescription: "Consumes 20 Military Strength, secures the breach.",
        successRate: 0.65,
        successEffects: {
          metrics: { militaryStrength: -15, munitions: -15, publicMorale: +25, divergenceIndex: +0.10 },
          shards: { hotspur: +30 }
        },
        successConsequence: "Total containment! Mahone trapped the Union divisions inside the crater, turning it into a complete tactical disaster for Grant. The Petersburg lines are stabilized.",
        failureEffects: {
          metrics: { militaryStrength: -30, munitions: -30, publicMorale: -15 },
          shards: { hotspur: +15, fox: -20 }
        },
        failureConsequence: "Fierce hand-to-hand combat. Mahone successfully trapped the Union troops inside the crater, securing the line. A momentary reprieve in a siege that will not end until the Confederacy does."
      },
      {
        id: "option_b",
        text: "Order immediate orderly evacuation of the Petersburg lines to Richmond.",
        proposer: "fox",
        costDescription: "Saves remaining military cores, but triggers fall of Richmond.",
        effects: {
          metrics: { militaryStrength: -5, publicMorale: -35, treasury: +15 },
          shards: { fox: +25, hotspur: -20 }
        },
        consequence: "The evacuation was completed, but surrendering Petersburg forced the immediate evacuation and burning of Richmond. The capital falls, and with it, the last hopes of the Confederacy."
      },
      {
        id: "option_c",
        text: "Send secret envoys to Lincoln's cabinet to propose a conditional ceasefire.",
        proposer: "wolf",
        costDescription: "Consumes 20 Treasury, high strategic divergence.",
        effects: {
          metrics: { treasury: -20, publicMorale: +10, divergenceIndex: +0.25 },
          shards: { wolf: +30, hotspur: -20 }
        },
        consequence: "Secret talks leaked. Northern public morale staggered, but Grant refused to stop the siege. The war grinds on toward its inevitable conclusion."
      },
      {
        id: "option_d",
        text: "Deploy automated iron mines and rail guns to shell the crater perimeter.",
        proposer: "sovereign",
        costDescription: "Consumes 30 Treasury, high tech alternative history.",
        effects: {
          metrics: { treasury: -30, munitions: -15, militaryStrength: -5 },
          shards: { fox: +15, wolf: +10 }
        },
        consequence: "The improvised rail guns successfully closed the breach with heavy iron shrapnel. A desperate technological innovation that buys a few more weeks of resistance in the trenches."
      }
    ],
    branches: [
      { minDivergence: 0.55, scenarioId: "greensboro_convention" }
    ]
  },

{
    id: "appomattox_decision",
    turn: 13,
    date: "April 9, 1865",
    actor: "General Robert E. Lee",
    roleLabel: "Army Commander",
    image: appomattoxCard,
    title: "Appomattox — Surrender vs. Insurgency",
    description: "Your army is surrounded at Appomattox Court House. The rations are exhausted, ammunition is gone, and the men are starving. General Grant has offered honorable surrender terms. Faction advisors are in fierce conflict over the final civilizational path. Hotspur screams for continued resistance in the mountains. Fox argues for preserving the lives of the men so they can return home and rebuild. Wolf sees a chance for conditional terms that might preserve some Southern sovereignty through international eyes. The eyes of history are upon this moment in a dusty Virginia courthouse.",
    letterTarget: "the Southern People",
    choices: [
      {
        id: "option_a",
        text: "Decline surrender. Disband the army into decentralized mountain guerrilla shards.",
        proposer: "hotspur",
        minDivergence: 0.35,
        costDescription: "Sparks indefinite domestic insurgency, drops Military Strength to zero.",
        effects: {
          metrics: { militaryStrength: -80, publicMorale: -40, treasury: -30, divergenceIndex: +0.6 },
          shards: { hotspur: +40, fox: -40, wolf: -40 }
        },
        consequence: "Formal surrender is rejected, but the army does not continue as a coherent national force. Commands splinter into holdouts, deserters, and partisan bands, trading organized campaigning for local violence and prolonged instability."
      },
      {
        id: "option_b",
        text: "Accept Grant's honorable surrender terms. Paroled men return home.",
        proposer: "fox",
        maxDivergence: 0.55,
        costDescription: "Preserves lives, concludes the war, restores civilian trust.",
        effects: {
          metrics: { militaryStrength: -5, publicMorale: +25, treasury: +20 },
          shards: { fox: +30, hotspur: -30, wolf: +20 }
        },
        consequence: "Lee signed the surrender at McLean House. Paroled soldiers returned home to rebuild, closing the war with solemn dignity. A model of reconciliation that will echo through the ages."
      },
      {
        id: "option_c",
        text: "Propose a special conditional annexation model under international arbitration.",
        proposer: "wolf",
        costDescription: "Consumes remaining Treasury, high diplomatic divergence.",
        effects: {
          metrics: { treasury: -30, publicMorale: +10, divergenceIndex: +0.4 },
          shards: { wolf: +30, hotspur: -20 }
        },
        consequence: "Arbitration rejected by Washington. Surrender was eventually signed, but with heavier civil penalties. The South's last diplomatic gambit failed, but the attempt itself became legend."
      },
      {
        id: "option_d",
        text: "Execute a final, desperate charge to break Grant's infantry circle.",
        proposer: "sovereign",
        costDescription: "Catastrophic casualty rate, absolute defeat.",
        effects: {
          metrics: { militaryStrength: -75, publicMorale: -20, munitions: -10 },
          shards: { hotspur: +10, fox: -30 }
        },
        consequence: "The final charge was utterly routed in minutes. The remnants were captured, leading to unconditional surrender. A last act of defiance that will be remembered as both noble and tragic."
      }
    ]
  },

{
    id: "greensboro_convention",
    turn: 13,
    date: "April 1865",
    actor: "President Jefferson Davis",
    roleLabel: "Civil Executive",
    image: appomattoxCard,
    title: "Greensboro Convention — Parole, Armistice, or Exhaustion",
    description: "This timeline has diverged too far to end neatly at Appomattox. Richmond has been abandoned, the field armies are still partly intact, but enlistments are expiring, bread riots and supply failures are spreading, and governors are asserting their own authority over men and food. In Greensboro, civilian and military leaders weigh whether to parole armies by department, seek a temporary armistice, or let the war decay into scattered state resistance. The issue is no longer just battlefield honor; it is whether any coherent civil order can outlast the war's exhaustion.",
    letterTarget: "the governors and people of the South",
    choices: [
      {
        id: "option_a",
        text: "Reject the convention and urge governors to continue resistance with whatever men remain under arms.",
        proposer: "hotspur",
        costDescription: "Sharp morale and military collapse, severe divergence.",
        effects: {
          metrics: { militaryStrength: -45, publicMorale: -25, treasury: -20, divergenceIndex: +0.35 },
          shards: { hotspur: +35, fox: -35, wolf: -20 }
        },
        consequence: "Some officers obey, but many soldiers simply drift home or vanish on the roads. What remains is resistance by fragments: raids, holdouts, and local vendettas rather than a national army in the field."
      },
      {
        id: "option_b",
        text: "Accept departmental paroles and organize food relief before the remaining armies melt away.",
        proposer: "fox",
        costDescription: "Preserves lives, steadies morale, and restores civil order.",
        effects: {
          metrics: { militaryStrength: -10, publicMorale: +20, treasury: +10 },
          shards: { fox: +30, hotspur: -25, wolf: +10 }
        },
        consequence: "The field armies are disbanded under supervision rather than shattered in one last campaign. Food wagons turn toward towns and farms, and governors regain something like ordinary civil responsibility."
      },
      {
        id: "option_c",
        text: "Seek a ninety-day armistice and relief convention with foreign consuls as witnesses.",
        proposer: "wolf",
        costDescription: "Treasury cost, diplomatic upside, strong divergence.",
        effects: {
          metrics: { treasury: -20, publicMorale: +15, divergenceIndex: +0.25 },
          shards: { wolf: +30, fox: +5, hotspur: -15 }
        },
        consequence: "Washington refuses formal recognition, but temporary ceasefire corridors and relief talks buy time. The war ends not in a single surrender scene, but in negotiation, exhaustion, and political ambiguity."
      },
      {
        id: "option_d",
        text: "Order soldiers home to harvest and preserve local order under state authority.",
        proposer: "sovereign",
        costDescription: "Reduces military power, stabilizes civilian endurance, moderate divergence.",
        effects: {
          metrics: { militaryStrength: -30, publicMorale: +10, treasury: +5, divergenceIndex: +0.15 },
          shards: { fox: +10, wolf: +15, hotspur: -10 }
        },
        consequence: "The armies do not evaporate in one moment; they unravel. Men leave for farms and families, governors reclaim militia authority, and the war ends through demobilization and weariness more than one final battlefield verdict."
      }
    ]
  },

{
    id: "hotspur_cabinet_crisis",
    turn: 0,
    crisisFor: "hotspur",
    date: "Emergency Session",
    actor: "President Jefferson Davis",
    roleLabel: "Civil Executive",
    image: secondManassasCard,
    title: "Cabinet Crisis — Fire-Eaters In Revolt",
    description: "Telegrams from the front and editorials from Richmond alike accuse the government of hesitation. Fire-eater politicians, hard-driving brigade officers, and restless newspaper men are demanding renewed offensive action while enlistments expire and stragglers drift home. Civil authority still governs the war, but if their anger is ignored, discipline in the field may give way to unauthorized raids, leave-taking, and open insubordination.",
    letterTarget: "the governors and generals",
    choices: [
      {
        id: "option_a",
        text: "Authorize a sharp offensive demonstration to satisfy the fire-eaters and steady the camps.",
        proposer: "hotspur",
        costDescription: "Military and munitions cost, restores Hotspur alignment, raises morale.",
        effects: {
          metrics: { militaryStrength: -12, munitions: -12, publicMorale: +15, divergenceIndex: +0.06 },
          shards: { hotspur: +35, fox: -10 }
        },
        consequence: "The order for action quieted the loudest agitators and brought stragglers back toward the colors, though at the price of another risky offensive temper in camp."
      },
      {
        id: "option_b",
        text: "Refuse theatrics. Rotate exhausted regiments, punish unauthorized leave, and rebuild the ranks deliberately.",
        proposer: "fox",
        costDescription: "Moderate treasury cost, strengthens discipline and restores mixed support.",
        effects: {
          metrics: { treasury: -10, militaryStrength: +8, publicMorale: +5 },
          shards: { hotspur: +15, fox: +25 }
        },
        consequence: "The camps resent another week without glory, but furlough schedules and strict discipline reduce straggling and keep the army from dissolving into grievance and rumor."
      },
      {
        id: "option_c",
        text: "Summon governors, clergy, and senior officers to publicly restate civilian control and the duty to remain under arms.",
        proposer: "wolf",
        costDescription: "Treasury cost, restores legitimacy and calms political agitation.",
        effects: {
          metrics: { treasury: -12, publicMorale: +10 },
          shards: { hotspur: +10, wolf: +25, fox: +10 }
        },
        consequence: "The proclamation campaign does not excite the camps, but it blunts the claim that Richmond has lost its grip and reasserts that the war remains under lawful civil authority."
      },
      {
        id: "option_d",
        text: "Clear bounty arrears and offer short harvest furloughs in exchange for renewed service pledges.",
        proposer: "sovereign",
        costDescription: "Treasury strain, stabilizes morale and slows desertion.",
        effects: {
          metrics: { treasury: -18, militaryStrength: +5, publicMorale: +12 },
          shards: { hotspur: +20, fox: +10, wolf: +5 }
        },
        consequence: "Paymasters and furlough papers calm the camps faster than rhetoric. More men remain with the army, even if only because they now believe Richmond remembers their families."
      }
    ]
  },

{
    id: "fox_supply_crisis",
    turn: 0,
    crisisFor: "fox",
    date: "Quartermaster Emergency",
    actor: "Secretary of War James Seddon",
    roleLabel: "War Department",
    image: petersburgCard,
    title: "Cabinet Crisis — Rail, Shoes, and Rations",
    description: "Quartermasters and governors are warning that the war can no longer be run on emergency improvisation alone. Shoes, fodder, salt meat, and rail capacity are failing at once, while state officials resist new impressments and local farmers hide grain from Confederate agents. If the practical bloc is ignored much longer, men will not necessarily mutiny; they will simply go hungry, drift home, and leave the colors one wagon at a time.",
    letterTarget: "the quartermasters and governors",
    choices: [
      {
        id: "option_a",
        text: "Impose emergency impressment and seize state depots before the armies starve in place.",
        proposer: "hotspur",
        costDescription: "Treasury gain, morale loss, partial supply recovery.",
        effects: {
          metrics: { treasury: +15, munitions: +10, publicMorale: -15 },
          shards: { hotspur: +20, fox: +10, wolf: -10 }
        },
        consequence: "The depots fill, but the countryside seethes. You save the campaign's immediate supply crisis at the cost of sharper resentment among civilians and state authorities."
      },
      {
        id: "option_b",
        text: "Centralize the railroads, ration offensives, and rebuild the commissary before asking for another battlefield gamble.",
        proposer: "fox",
        costDescription: "Treasury cost, major munitions recovery, restores Fox alignment.",
        effects: {
          metrics: { treasury: -10, munitions: +20, militaryStrength: +5 },
          shards: { fox: +35, hotspur: -10 }
        },
        consequence: "Rail schedules are finally subordinated to army need, shoes and ammunition begin reaching the ranks again, and the practical men in Richmond stop openly predicting collapse."
      },
      {
        id: "option_c",
        text: "Negotiate state supply quotas with governors and merchants instead of forcing another round of seizures.",
        proposer: "wolf",
        costDescription: "Treasury cost, morale gain, moderate supply recovery.",
        effects: {
          metrics: { treasury: -15, munitions: +12, publicMorale: +10 },
          shards: { fox: +20, wolf: +25 }
        },
        consequence: "The quotas arrive more slowly than seizure parties would like, but they arrive with less bitterness, and governors return to the table instead of denouncing Richmond from their capitals."
      },
      {
        id: "option_d",
        text: "Grant short harvest furloughs and local recruitment bonuses to keep soldiers tied to the colors through the next season.",
        proposer: "sovereign",
        costDescription: "Short-term military dip, morale gain, steadier reenlistment base.",
        effects: {
          metrics: { militaryStrength: -5, treasury: -8, publicMorale: +15 },
          shards: { fox: +15, hotspur: +5, wolf: +10 }
        },
        consequence: "Some officers complain about thinning the line, but more men return after furlough than had been staying under compulsion alone. The army holds together by concession rather than coercion."
      }
    ]
  },

{
    id: "wolf_finance_crisis",
    turn: 0,
    crisisFor: "wolf",
    date: "Confidential Finance Council",
    actor: "Judah P. Benjamin",
    roleLabel: "Diplomatic Secretary",
    image: chancellorsvilleCard,
    title: "Cabinet Crisis — Bonds, Blockade, and Civil Confidence",
    description: "The diplomatic and financial bloc is warning that confidence is collapsing faster than armies. Cotton bonds are faltering, blockade-running insurers are charging ruinous rates, and peace men in both North and South are beginning to say openly that the treasury is chasing a war the public can no longer feed. If nothing is done, the Confederacy will not be overthrown by decree; it will be hollowed out by unpaid notes, closed warehouses, and a civilian public that stops believing sacrifice will ever end.",
    letterTarget: "the financiers and consuls",
    choices: [
      {
        id: "option_a",
        text: "Seize speculative cotton stores and force emergency war-bond purchases from the commercial houses.",
        proposer: "hotspur",
        costDescription: "Treasury recovery, morale cost, limited diplomatic backlash.",
        effects: {
          metrics: { treasury: +20, publicMorale: -10 },
          shards: { hotspur: +20, wolf: +10, fox: -5 }
        },
        consequence: "The treasury refills for the moment, but merchants and editors denounce the heavy hand of Richmond. You buy cash quickly at the price of broader civilian trust."
      },
      {
        id: "option_b",
        text: "Publish an austerity program, protect rail payments, and prioritize bread and salt over prestige spending.",
        proposer: "fox",
        costDescription: "Moderate treasury gain, restores confidence through restraint.",
        effects: {
          metrics: { treasury: +10, publicMorale: +5, munitions: +5 },
          shards: { fox: +20, wolf: +15 }
        },
        consequence: "The program is grim, but credible. Bond confidence steadies because civilians can see that the state is still capable of sober administration rather than theatrical promises."
      },
      {
        id: "option_c",
        text: "Send commissioners abroad and circulate a conciliatory political message to reopen credit and peace pressure.",
        proposer: "wolf",
        costDescription: "Treasury cost, morale gain, diplomatic divergence.",
        effects: {
          metrics: { treasury: -15, publicMorale: +10, divergenceIndex: +0.06 },
          shards: { wolf: +35, hotspur: -10 }
        },
        consequence: "The commissioners do not guarantee recognition, but they slow the sense of financial isolation and give civilians a reason to imagine something other than endless exhaustion."
      },
      {
        id: "option_d",
        text: "Open relief kitchens in the hardest-hit towns and suspend selected impressments to restore civilian trust.",
        proposer: "sovereign",
        costDescription: "Treasury cost, strong morale recovery, moderate political stabilization.",
        effects: {
          metrics: { treasury: -12, publicMorale: +18 },
          shards: { wolf: +20, fox: +10, hotspur: -5 }
        },
        consequence: "The policy does not solve the blockade, but it cools town anger and bread-riot talk. Civilians continue to suffer, yet fewer believe they have been utterly abandoned by the government."
      }
    ]
  }
];

// --- Production-safe asset resolution -------------------------------------
// Battle-card images were referenced as bare "/src/assets/images/x.jpg" strings,
// which only resolve under `vite dev` and 404 in a production `vite build`.
// Vite's import.meta.glob hashes them properly for both dev and build.
// Guarded so the module still imports cleanly under plain Node (headless harness/tests).
try {
  if (typeof import.meta !== 'undefined' && typeof import.meta.glob === 'function') {
    const cardImages = import.meta.glob('../assets/images/*.jpg', { eager: true, import: 'default' });
    for (const scenario of STATIC_SCENARIOS) {
      if (scenario.image) {
        const file = scenario.image.split('/').pop();
        const resolved = cardImages[`../assets/images/${file}`];
        if (resolved) scenario.image = resolved;
      }
    }
  }
} catch {
  // Non-Vite runtime (Node): leave image strings as-is; they aren't rendered there.
}

// Derive historical image lookups from the shared media catalog.
export const HISTORIC_MAPS = Object.fromEntries(
  STATIC_SCENARIOS.map((scenario) => [scenario.id, resolveScenarioMedia(scenario.id).src])
);

// Map authentic clashing advisor opinions to the scenarios
export const HISTORIC_ADVISORS = {
  naval_technology: {
    hotspur: "Steel and fire! Armored ironclads are the future of naval warfare. Build the CSS Virginia and smash their wooden fleet at Hampton Roads!",
    fox: "Our rivers are our lifelines. Fortify the Mississippi with river ironclads and defensive mine barriers to deny them inland passage.",
    wolf: "The blockade is too vast to fight directly. Fund Singer's Secret Service corps and the Hunley's stealth submarine. One silent blow in the dark will shatter their resolve."
  },
  fort_sumter: {
    hotspur: "The secessionist batteries have dared block our supply! Return their fire and maintain the honor of the flag, whatever the cost in masonry!",
    fox: "Our men are starving, and the fort cannot withstand a prolonged siege. Negotiate a disciplined evacuation so we can fight again under better skies.",
    wolf: "The border states are watching. Delay action to show the world we are not the aggressors. Let the South fire the first shots and carry the blame in Europe."
  },
  charleston_harbor_escape: {
    hotspur: "The garrison has escaped! Turn this success into a storm: launch immediate counter-raids on their exposed batteries while they are in confusion!",
    fox: "Do not squander our survivors. Parade them as proof of Northern discipline and fill our recruiting depots while our credit is strong.",
    wolf: "Dispatch the harbor chart copies to European salons immediately. Let foreign eyes see how brittle the rebel hold on Charleston truly is."
  },
  manassas_battlefield: {
    hotspur: "Jackson holds Henry Hill like a stone wall! Charge their batteries on the flank and sweep the blue columns back across Bull Run in panic!",
    fox: "Hold our ground. Draw their forces onto our defensive lines and preserve our infantry reserves. Logistics wins this day, not wild charges.",
    wolf: "The retreat has begun! Send secret cavalry scouts to clear the roads, and prepare a diplomatic dispatch highlighting our victory to London."
  },
  seven_days: {
    hotspur: "Drive McClellan back to the James River! Aggressive frontal pressure will break their morale and free Richmond from the siege!",
    fox: "Let them waste their strength on our earthworks. Rebuild our supply trains and wait for them to bleed out in the swamps.",
    wolf: "Float trade concessions to the French consuls. A victory here is our best lever to secure recognition and break the blockade."
  },
  second_manassas: {
    hotspur: "Slam into Pope's flank while he is focused on Jackson! A decisive blow will smash the Union center and open the road to Maryland!",
    fox: "Hold the railway cut. Maintain defensive screens, preserve our munitions, and let their columns exhaust themselves in futile assaults.",
    wolf: "Send diplomatic envoys north. A victory here will shake the peace factions in Washington and force them to the negotiation table."
  },
  potomac_leverage_campaign: {
    hotspur: "We have crossed the Potomac! Drive aggressively toward Harrisburg, seize the state house, and force them into a final battlefield crisis!",
    fox: "Entrench along the Monocacy. Force McClellan to attack us on our own ground, saving our men and munitions.",
    wolf: "Establish contacts with the peace democrats in Baltimore. We must turn our military presence into immediate political leverage."
  },
  antietam: {
    hotspur: "Hold the Bloody Lane! Counter-attack their center with everything we have and drive McClellan back across the creek!",
    fox: "Withdraw our exposed divisions, fortify the high grounds, and slip back across the Potomac before we are pinned down.",
    wolf: "Make a public appeal to European observers. Show them our tactical resilience is proof of sovereign statehood."
  },
  chancellorsville_aftermath: {
    hotspur: "The victory is ours! Authorize an immediate counter-invasion of Maryland while the Union is in complete confusion!",
    fox: "Jackson is wounded and our ranks are thin. Rotate the regiments, conscript fresh men, and hold the Rappahannock line.",
    wolf: "Paris and London are watching. Dispatch envoys to offer trade treaties in exchange for immediate diplomatic recognition."
  },
  susquehanna_offensive: {
    hotspur: "Harrisburg lies open! Force the crossings and seize their main supply depots before their militia can organize!",
    fox: "Entrench along the river bends. Let them attack our fortifications while we harvest the Pennsylvania resources.",
    wolf: "Offer an armistice through British mediation. We hold their rail networks; this is our maximum leverage."
  },
  gettysburg_decision: {
    hotspur: "Charge Pickett's Division straight up the center! We will pierce their stone wall and break the union line forever!",
    fox: "Decline this suicidal charge. Reposition south, get between Meade and Washington, and force him to attack us.",
    wolf: "Withdraw in orderly columns. The invasion has achieved its purpose of stripping their depots. Save the army to fight in Virginia."
  },
  chickamauga: {
    hotspur: "Bragg! Launch immediate frontal assaults through the dense undergrowth and crush their vanguard before they can fortify!",
    fox: "Use Longstreet's concentrated column to pierce their center gap. It is a disciplined tactical strike that will shatter their right wing.",
    wolf: "Richmond has sent advice: coordinate with the war cabinet, avoid rash maneuvers, and wait for supply reinforcements."
  },
  chattanooga_stranglehold: {
    hotspur: "Storm the ridges! Turn the siege into an immediate battlefield assault before Grant can organize a relief force!",
    fox: "Tighten the rail siege. Preserve our munitions, starve their garrison, and maintain a disciplined grip on the theater.",
    wolf: "Use our victory at Chickamauga to fuel peace campaigns in the North. Turn their tactical defeat into a domestic political crisis."
  },
  wilderness: {
    hotspur: "Gordon's flank attack is ready! Sweep through the burning brush and roll up their right wing while the smoke blinds them!",
    fox: "Fortify along the Brock Road. Let them launch bloody assaults against our earthworks while we hold the vital crossroads.",
    wolf: "The horror is too great. Propose a temporary humanitarian truce to rescue the wounded burning alive in the fires."
  },
  third_winchester: {
    hotspur: "Charge Sheridan's center at the Canyon! We must show them the spirit of the Valley is not yet broken!",
    fox: "Fall back to the stone walls south of Winchester. Form tight defensive rings and save the core of the army.",
    wolf: "Spread rumors of Sheridan's defeat through copperhead networks to delay their advance and buy crucial time."
  },
  petersburg_siege: {
    hotspur: "Mahone is ready! Launch a desperate counter-attack into the Crater mine breach and trap their divisions inside the hole!",
    fox: "The Petersburg line is thin. Order an immediate, orderly evacuation to Richmond before Grant envelops our flank.",
    wolf: "Send secret peace envoys to Lincoln's cabinet. Propose a conditional ceasefire before our lines collapse completely."
  },
  greensboro_convention: {
    hotspur: "Reject all surrender terms! Urge the governors to continue resistance in the mountains with whatever men remain!",
    fox: "Accept departmental paroles. Organize food relief and save the lives of our men so they can rebuild their homes.",
    wolf: "Seek a ninety-day armistice and relief convention with foreign consuls as witnesses to avoid a chaotic ending."
  },
  appomattox_decision: {
    hotspur: "We must not surrender! Disband the army into the mountains and wage an indefinite guerrilla insurgency!",
    fox: "Grant's terms are honorable. Accept the parole, stack the arms, and let the men return home to rebuild their lives in peace.",
    wolf: "Propose a special conditional annexation model under international arbitration. Make one last bid for terms."
  }
};

for (const scenario of STATIC_SCENARIOS) {
  scenario.historicalImage = HISTORIC_MAPS[scenario.id] || '/images/cw_pictures/Unknown.jpg';
  if (!scenario.advisors && HISTORIC_ADVISORS[scenario.id]) {
    scenario.advisors = HISTORIC_ADVISORS[scenario.id];
  }
}

