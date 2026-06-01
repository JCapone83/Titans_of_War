export const MAP_CANVAS_SIZE = {
  width: 600,
  height: 320,
};

const DEFAULT_PLATE_CAPTION = 'Plate IX: General Tactical Mapping, Alternate Chronology Division, 1861.';

const DEFAULT_ANNOTATION = {
  plateCaption: DEFAULT_PLATE_CAPTION,
  inspectorPins: [],
  topography: {
    type: 'contours',
    shape: 'arc',
    centerX: 340,
    centerY: 170,
    radius: 35,
    layers: 4,
  },
  waterways: [],
  labels: [],
  troops: null,
  maneuvers: {},
};

export const MAP_PLATE_CAPTIONS = {
  fort_sumter: 'Plate I: Plan of Charleston Outer Harbor & Fortifications, US Army Engineers, March 1861.',
  charleston_harbor_escape: 'Plate I-B: Barge Escape Route, Surveyed under Cover of Fog, April 1861.',
  naval_technology: 'Plate Technology: Hampton Roads ironclad designs and Merrimack conversion schematics, Bureau of Ordnance, March 1862.',
  hotspur_cabinet_crisis: 'Plate Emergency: Congressional session on frontline movements, Richmond Cabinet, 1862.',
  fox_supply_crisis: 'Plate Emergency II: Rail supply blockage nodes, Quartermaster General Survey, 1863.',
  wolf_finance_crisis: 'Plate Emergency III: Sovereign debt gold reserve ledger, Treasury Auditor report, 1864.',
  manassas_battlefield: "Plate II: Survey of Henry House Hill & Bull Run Creek, Beauregard's Headquarters, July 1861.",
  seven_days: "Plate III: Swamps of the Chickahominy River, Lee's Headquarters Map, June 1862.",
  second_manassas: 'Plate IV: Combat Sector of the Railway Cut, Army of Northern Virginia, August 1862.',
  potomac_leverage_campaign: 'Plate IV-B: Maryland Invasion corridor & Potomac approaches, Sept. 1862.',
  antietam: "Plate V: Topography of the Bloody Lane & Dunker Church sectors, Army of the Potomac, Sept. 1862.",
  chancellorsville_aftermath: "Plate VI: Wilderness crossings & Jackson's flank march route, May 1863.",
  susquehanna_offensive: 'Plate VI-B: Susquehanna River crossings and Pennsylvania rail approaches, June 1863.',
  gettysburg_decision: "Plate VII: Cemetery Ridge and Little Round Top elevation contours, Meade's Headquarters, July 1863.",
  chickamauga: "Plate VIII: Forest thickets along the River of Death, Bragg's Headquarters Map, Sept. 1863.",
  chattanooga_stranglehold: 'Plate VIII-B: Rail blockade coordinates of Chattanooga siege, Oct. 1863.',
  wilderness: "Plate IX: The Tangled Woods and Brock Road crossroad sectors, Lee's Headquarters, May 1864.",
  third_winchester: "Plate X: Valley cavaliers sweep across Opequon Creek, Sheridan's Division Map, Sept. 1864.",
  petersburg_siege: 'Plate XI: Trench defensive lines and mine detonation Crater breach, Petersburg siege, Nov. 1864.',
  greensboro_convention: 'Plate XII: Departmental Parole boundaries and rail relief channels, Greensboro, April 1865.',
  appomattox_decision: "Plate XII-B: General Lee's final retreat lines to Appomattox Courthouse, April 1865.",
};

export const MAP_INSPECTOR_PINS = {
  fort_sumter: [
    { x: 50, y: 50, label: 'Fort Sumter', desc: 'Federal masonry fort isolated in Charleston Harbor.' },
    { x: 22, y: 78, label: 'Cummings Point', desc: 'Confederate ironclad battery shelling Sumter\'s gorge wall.' },
    { x: 78, y: 25, label: 'Fort Moultrie', desc: 'Secessionist sand-bagged batteries pouring mortar shell into Sumter.' },
  ],
  naval_technology: [
    { x: 35, y: 45, label: 'Gosport Navy Yard', desc: 'Where the burned steam frigate Merrimack is raised and rebuilt as the CSS Virginia.' },
    { x: 65, y: 55, label: 'Hampton Roads Channel', desc: 'Waterway where the first clash of ironclad ships will change naval warfare forever.' },
    { x: 80, y: 30, label: 'James River Defense', desc: 'Crucial shipping channel protected by experimental electric torpedoes and battery piles.' },
  ],
  manassas_battlefield: [
    { x: 55, y: 48, label: 'Henry House Hill', desc: 'Where Jackson stood like a stone wall, halting the Union advance.' },
    { x: 35, y: 20, label: 'Sudley Ford', desc: 'Union flanking column crossing Bull Run Creek.' },
    { x: 75, y: 70, label: 'Manassas Junction', desc: 'Manassas railroad depots bringing Johnston\'s Valley reinforcements.' },
  ],
  antietam: [
    { x: 52, y: 50, label: 'Bloody Lane', desc: 'A sunken farm road where over 5,000 soldiers fell in four hours.' },
    { x: 45, y: 22, label: 'The Cornfield', desc: 'Scene of catastrophic charges and counter-charges at dawn.' },
    { x: 58, y: 82, label: 'Burnside Bridge', desc: 'A narrow stone bridge defended by a handful of Georgia riflemen.' },
  ],
  gettysburg_decision: [
    { x: 50, y: 42, label: 'Cemetery Ridge', desc: 'The Union center, target of Pickett\'s desperate charge.' },
    { x: 35, y: 82, label: 'Little Round Top', desc: 'Key rocky hill anchored by the 20th Maine, saving the Union flank.' },
    { x: 48, y: 15, label: 'Cemetery Hill', desc: 'Heavy Union artillery concentration holding the Baltimore Pike.' },
  ],
  petersburg_siege: [
    { x: 50, y: 50, label: 'The Crater Breach', desc: 'Breach blown by 8,000 lbs of gunpowder detonated under Confederate fort.' },
    { x: 28, y: 42, label: 'Union Siege Lines', desc: 'Intricate trench works extending over thirty miles.' },
    { x: 72, y: 58, label: 'Mahone\'s Counter-Attack', desc: 'Confederate infantry charge sealing the crater breach.' },
  ],
  appomattox_decision: [
    { x: 50, y: 48, label: 'McLean House', desc: 'The quiet parlor where Lee met Grant to sign the honorable parole terms.' },
    { x: 25, y: 35, label: 'Appomattox Station', desc: 'Where Sheridan\'s cavalry intercepted Lee\'s final supply trains.' },
    { x: 75, y: 62, label: 'Custer\'s Cavalry Circle', desc: 'Union horsemen forming a ring of steel around the Confederate remnants.' },
  ],
};

const MANASSAS_ANNOTATION = {
  waterways: [
    {
      type: 'bezier',
      start: [0, 40],
      cp1: [200, 20],
      cp2: [350, 70],
      end: [600, 20],
      label: { text: 'BULL RUN CREEK', x: 420, y: 35 },
    },
  ],
  labels: [{ text: 'HENRY HOUSE HILL', x: 220, y: 185 }],
  troops: {
    union: { x: 230, y: 70, label: 'UNION FORCES', width: 65 },
    confederate: { x: 320, y: 250, label: 'CONFED. FORCE', width: 70 },
  },
};

export const MAP_ANNOTATIONS = {
  fort_sumter: {
    topography: {
      type: 'harbor-fort',
      waveSpacing: 20,
      polygon: [
        [260, 145],
        [310, 130],
        [350, 165],
        [310, 200],
        [260, 185],
      ],
    },
    labels: [
      { text: 'CHARLESTON HARBOR', x: 40, y: 40 },
      { text: 'FORT SUMTER (MASONRY)', x: 250, y: 120, color: 'rgba(212, 175, 55, 0.5)' },
    ],
    troops: {
      union: { x: 268, y: 157, label: 'US GARRISON', width: 65 },
      confederate: { x: 40, y: 260, label: 'CS BATTERIES', width: 70 },
    },
  },
  naval_technology: {
    topography: {
      type: 'contours',
      shape: 'arc',
      centerX: 300,
      centerY: 160,
      radius: 40,
      layers: 3,
    },
    waterways: [
      {
        type: 'bezier',
        start: [100, 200],
        cp1: [250, 180],
        cp2: [400, 240],
        end: [600, 200],
        label: { text: 'HAMPTON ROADS CHANNEL', x: 280, y: 220 },
      },
    ],
    labels: [
      { text: 'IRONCLAD SHIPYARDS', x: 80, y: 120 },
      { text: 'SUBMARINE DEVELOPMENT COVE', x: 380, y: 100 }
    ],
    troops: {
      union: { x: 450, y: 140, label: 'UNION BLOCKADE', width: 75 },
      confederate: { x: 120, y: 150, label: "MALLORY'S YARDS", width: 75 },
    },
  },
  manassas_battlefield: MANASSAS_ANNOTATION,
  second_manassas: MANASSAS_ANNOTATION,
  seven_days: {
    waterways: [
      {
        type: 'bezier',
        start: [0, 20],
        cp1: [150, 80],
        cp2: [300, 30],
        end: [600, 70],
        label: { text: 'CHICKAHOMINY RIVER', x: 450, y: 85 },
      },
    ],
    labels: [{ text: 'RICHMOND OUTSKIRTS', x: 30, y: 290 }],
    troops: {
      union: { x: 450, y: 80, label: 'UNION FORCES', width: 65 },
      confederate: { x: 80, y: 230, label: 'CONFED. FORCE', width: 70 },
    },
  },
  antietam: {
    topography: {
      type: 'contours',
      shape: 'ellipse',
      centerX: 260,
      centerY: 180,
      radiusX: 35,
      radiusY: 18,
      rotation: 0.2,
      layers: 4,
    },
    waterways: [
      {
        type: 'bezier',
        start: [200, 0],
        cp1: [230, 80],
        cp2: [180, 160],
        end: [220, 320],
        label: { text: 'ANTIETAM CREEK', x: 130, y: 100 },
      },
    ],
    labels: [{ text: 'BLOODY LANE SECTOR', x: 340, y: 190 }],
    troops: {
      union: { x: 340, y: 60, label: 'UNION FORCES', width: 65 },
      confederate: { x: 260, y: 240, label: 'CONFED. FORCE', width: 70 },
    },
  },
  chancellorsville_aftermath: {
    waterways: [
      {
        type: 'bezier',
        start: [0, 150],
        cp1: [200, 190],
        cp2: [400, 120],
        end: [600, 170],
        label: { text: 'RAPPAHANNOCK RIVER', x: 250, y: 145 },
      },
    ],
  },
  chickamauga: {
    waterways: [
      {
        type: 'bezier',
        start: [300, 0],
        cp1: [250, 80],
        cp2: [350, 160],
        end: [300, 320],
        label: { text: 'CHICKAMAUGA CREEK', x: 180, y: 140 },
      },
    ],
    troops: {
      union: { x: 180, y: 80, label: 'UNION FORCES', width: 65 },
      confederate: { x: 340, y: 230, label: 'CONFED. FORCE', width: 70 },
    },
  },
  third_winchester: {
    waterways: [
      {
        type: 'bezier',
        start: [220, 0],
        cp1: [260, 100],
        cp2: [200, 180],
        end: [270, 320],
        label: { text: 'OPEQUON CREEK', x: 190, y: 110 },
      },
    ],
    troops: {
      union: { x: 360, y: 80, label: 'UNION FORCES', width: 65 },
      confederate: { x: 170, y: 230, label: 'CONFED. FORCE', width: 70 },
    },
  },
  gettysburg_decision: {
    topography: {
      type: 'contours',
      shape: 'ellipse',
      centerX: 300,
      centerY: 170,
      radiusX: 45,
      radiusY: 20,
      rotation: 0,
      layers: 4,
    },
    labels: [{ text: "CEMETERY RIDGE (PICKETT'S TARGET)", x: 210, y: 145 }],
    troops: {
      union: { x: 268, y: 170, label: 'UNION FORCES', width: 65 },
      confederate: { x: 268, y: 265, label: 'CONFED. FORCE', width: 70 },
    },
    maneuvers: {
      option_c: { endOffsetX: 150 },
    },
  },
  wilderness: {
    topography: {
      type: 'forest-fire',
      forestGrid: { startX: 30, startY: 20, stepX: 60, stepY: 45, radius: 18 },
      fireZones: [{ x: 380, y: 150, radius: 60, color: 'rgba(239, 68, 68, 0.03)' }],
    },
    labels: [
      { text: 'BROCK ROAD CROSSROADS', x: 40, y: 290 },
      { text: 'BRUSHFIRE SECTOR', x: 330, y: 80, color: 'rgba(239, 68, 68, 0.5)' },
    ],
    troops: {
      union: { x: 210, y: 90, label: 'UNION FORCES', width: 65 },
      confederate: { x: 340, y: 230, label: 'CONFED. FORCE', width: 70 },
    },
  },
  petersburg_siege: {
    topography: {
      type: 'trench-crater',
      trench: { startY: 30, stepY: 40, xStep: 25, amplitude: 15 },
      crater: { x: 300, y: 160, radius: 28 },
    },
    labels: [
      { text: 'BATTLE OF CRATER TRENCHES', x: 40, y: 30 },
      { text: 'THE CRATER BREACH', x: 250, y: 125, color: 'rgba(239, 68, 68, 0.6)' },
    ],
    troops: {
      union: { x: 190, y: 148, label: 'UNION FORCES', width: 65 },
      confederate: { x: 340, y: 148, label: 'CONFED. FORCE', width: 70 },
    },
  },
  appomattox_decision: {
    labels: [{ text: 'MCLEAN HOUSE (APPOMATTOX C.H.)', x: 230, y: 145 }],
    troops: {
      union: { x: 160, y: 148, label: 'UNION FORCES', width: 65 },
      confederate: { x: 360, y: 148, label: 'CONFED. FORCE', width: 70 },
    },
  },
};

export function getMapAnnotation(scenarioId) {
  const annotation = MAP_ANNOTATIONS[scenarioId] || {};

  return {
    ...DEFAULT_ANNOTATION,
    ...annotation,
    plateCaption: annotation.plateCaption || MAP_PLATE_CAPTIONS[scenarioId] || DEFAULT_PLATE_CAPTION,
    inspectorPins: annotation.inspectorPins || MAP_INSPECTOR_PINS[scenarioId] || [],
    topography: {
      ...DEFAULT_ANNOTATION.topography,
      ...(annotation.topography || {}),
    },
    waterways: annotation.waterways || [],
    labels: annotation.labels || [],
    troops: annotation.troops || null,
    maneuvers: annotation.maneuvers || {},
  };
}