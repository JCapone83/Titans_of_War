export const INITIAL_STATE = {
  currentTurn: 1,
  actor: 'Major Robert Anderson',
  roleLabel: 'Fort Commander',
  divergenceIndex: 0.0,
  seed: 1861,
  alternateTimeline: false,
  metrics: {
    militaryStrength: 85,
    munitions: 80,
    treasury: 75,
    foodSupply: 78,
    publicMorale: 80
  },
  shards: {
    hotspur: { name: 'Radical Attackers', alignment: 70, influence: 35 },
    fox: { name: 'Tactical Pragmatists', alignment: 70, influence: 40 },
    wolf: { name: 'Diplomatic Strategists', alignment: 60, influence: 25 }
  },
  letterText: '',
  letterSentiment: null,
  history: [],
  gameOver: false,
  statusMessage: 'Secession crisis resolved into flashpoint. Fort Sumter isolated in Charleston Harbor.'
};