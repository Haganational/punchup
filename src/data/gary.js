// Opponent #2 of the Mid-Major Circuit: a patient veteran. He hits harder than
// Tessa, throws in pairs, and holds his big hook a beat longer than you expect.
export default {
  key: 'bowling-green',
  name: 'GARY MERCER',
  short: 'GARY',
  title: 'THE OLD PRO',
  from: 'BOWLING GREEN',
  hp: 140,
  aura: 'ember',     // his gloves smolder

  colors: {
    shirt: '#d8501c', shirtDark: '#9c3008', shirtLight: '#f88048',
    face: { eyes: [[15, 20], [24, 20]], mouth: [20, 30] },
    body: 'bare', skinLight: '#fcd0b0', chestHair: '#bcbcbc',
    trim: '#d8501c',
    trunks: '#58301c', trunksDark: '#381c0c', stripe: '#d8501c',
    skin: '#e8b090', skinDark: '#b87858',
    glove: '#7c4420', gloveDark: '#48240c', gloveLight: '#c08858',
    boots: '#381c0c',
    pad: '#58301c', padLight: '#9c6038', padTrim: '#f8b800',
    panel: 0x7c2c08,
  },

  lines: {
    intro: 'FORTY YEARS ON THE\nAIR, KID. I KNOW HOW\nTHIS STORY ENDS.',
    taunt: 'STAY TUNED!',
    win: 'AND THAT\'S THE\nFINAL SCORE.',
    lose: 'WELL... BACK TO\nYOU IN THE STUDIO.',
  },

  tips: [
    'HE HOLDS THAT BIG HOOK A LONG TIME, MY SON. WAIT FOR IT, THEN DUCK. TAP DOWN TWICE.',
    'HIS PUNCHES COME IN TWOS AND THREES. DODGE EVERY ONE BEFORE YOU SWING. HE GUARDS LOW, SO AIM HIGH.',
  ],

  guardSwitchMs: [1000, 1700],
  highGuardChance: 0.35,
  chipScale: 0.6,
  starDodge: 0.35,
  maxCombo: 5,
  stunMs: 580,

  knockdowns: [
    { upAt: 5, hp: 0.5 },
    { upAt: 8, hp: 0.3 },
  ],

  moves: {
    jabL: {
      label: 'JAB', tell: 540, tellPose: 'cockL', cue: 'tell',
      strikes: [{ at: 0, hand: 'L', dmg: 7, blockable: true }],
      openMiss: 700, bodyBonus: 1.3,
    },
    jabR: {
      label: 'JAB', tell: 540, tellPose: 'cockR', cue: 'tell',
      strikes: [{ at: 0, hand: 'R', dmg: 7, blockable: true }],
      openMiss: 700, bodyBonus: 1.3,
    },
    oneTwo: {
      label: 'ONE-TWO', tell: 640, tellPose: 'cockL', cue: 'tell',
      strikes: [
        { at: 0, hand: 'L', dmg: 6, blockable: true },
        { at: 400, hand: 'R', dmg: 7, blockable: true },
      ],
      openMiss: 850,
    },
    hook: {
      label: 'BIG HOOK', tell: 1250, tellPose: 'windR', cue: 'tell',
      strikes: [{ at: 0, hand: 'R', dmg: 16, blockable: false, hook: true }],
      openMiss: 1100, star: true,
      flash: { at: 620, len: 150, zone: 'body' },
    },
    signature: {
      label: 'TOP STORY!', tell: 1000, tellPose: 'flip', cue: 'tellBig', announce: true, nod: true,
      strikes: [
        { at: 0, hand: 'L', dmg: 7, blockable: false },
        { at: 430, hand: 'R', dmg: 7, blockable: false },
        { at: 980, hand: 'R', dmg: 13, blockable: false, hook: true },
      ],
      openMiss: 1400, star: true,
      flash: { at: 540, len: 150, zone: 'head' },
    },
  },

  rounds: [
    { idle: [1400, 2200], tellScale: 1.0, weights: { jabL: 3, jabR: 3, oneTwo: 2, hook: 2, signature: 0 } },
    { idle: [1100, 1700], tellScale: 0.9, weights: { jabL: 2, jabR: 2, oneTwo: 3, hook: 3, signature: 2 } },
    { idle: [850, 1350], tellScale: 0.82, weights: { jabL: 2, jabR: 2, oneTwo: 3, hook: 3, signature: 3 } },
  ],
};
