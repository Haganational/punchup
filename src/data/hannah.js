// Opponent #3 of the Mid-Major Circuit: the powerhouse. Slow, patient and very
// heavy-handed. Her haymakers can be ducked; her straight slam cannot.
export default {
  key: 'ball-state',
  name: 'HANNAH LINDQVIST',
  short: 'HANNAH',
  title: 'THE NEWS VAN',
  from: 'BALL STATE',
  hp: 165,
  aura: 'rose',      // little hearts drift off her gloves. Do not be fooled.

  colors: {
    shirt: '#b81028', shirtDark: '#780818', shirtLight: '#e84858',
    face: { eyes: [[17, 19], [26, 19]], mouth: [21, 28] },
    body: 'top', skinLight: '#fcd8c0',
    trim: '#fcfcfc',
    trunks: '#fcfcfc', trunksDark: '#bcbcbc', stripe: '#b81028',
    skin: '#f0c0a0', skinDark: '#c08868',
    glove: '#d01030', gloveDark: '#780818', gloveLight: '#f878a8',
    boots: '#b81028',
    pad: '#b81028', padLight: '#e84858', padTrim: '#fcfcfc',
    panel: 0x780818,
  },

  lines: {
    intro: 'I CARRY THE NEWS VAN\nUP THE STAIRS. YOU\nARE A LIGHT LUNCH.',
    taunt: 'LIFT WITH THE LEGS!',
    win: 'THAT IS A WRAP,\nSEQUINS.',
    lose: 'OKAY. YOU CAN SPOT\nME ANY TIME.',
  },

  tips: [
    'HER HAYMAKERS SWING HIGH, MY SON. DUCK THEM. BUT THE STRAIGHT SLAM YOU MUST DODGE.',
    'SHE IS STRONG BUT SLOW. WHEN SHE YELLS ABOUT THE VAN: DUCK, DODGE, DUCK. THEN UNLOAD.',
  ],

  guardSwitchMs: [1100, 1900],
  highGuardChance: 0.5,
  chipScale: 0.55,
  starDodge: 0.3,
  maxCombo: 5,
  stunMs: 540,
  stanceSwitchMs: [3200, 6000],

  knockdowns: [
    { upAt: 6, hp: 0.5 },
    { upAt: 8, hp: 0.35 },
  ],

  moves: {
    jabL: {
      label: 'JAB', tell: 620, tellPose: 'cockL', cue: 'tell',
      strikes: [{ at: 0, hand: 'L', dmg: 9, blockable: true }],
      openMiss: 800, bodyBonus: 1.3,
    },
    jabR: {
      label: 'JAB', tell: 620, tellPose: 'cockR', cue: 'tell',
      strikes: [{ at: 0, hand: 'R', dmg: 9, blockable: true }],
      openMiss: 800, bodyBonus: 1.3,
    },
    hook: {
      label: 'HAYMAKER', tell: 1000, tellPose: 'windR', cue: 'tell',
      strikes: [{ at: 0, hand: 'R', dmg: 18, blockable: false, hook: true }],
      openMiss: 1150, star: true,
      flash: { at: 480, len: 150, zone: 'body' },
    },
    slam: {
      label: 'SLAM', tell: 900, tellPose: 'flip', cue: 'tell',
      strikes: [{ at: 0, hand: 'L', dmg: 14, blockable: false }],
      openMiss: 1000, star: true,
      flash: { at: 420, len: 140, zone: 'head' },
    },
    signature: {
      label: 'NEWS VAN!', tell: 1150, tellPose: 'flip', cue: 'tellBig', announce: true, nod: true,
      strikes: [
        { at: 0, hand: 'R', dmg: 12, blockable: false, hook: true },
        { at: 520, hand: 'L', dmg: 12, blockable: false },
        { at: 1060, hand: 'R', dmg: 16, blockable: false, hook: true },
      ],
      openMiss: 1500, star: true,
      flash: { at: 600, len: 150, zone: 'head' },
    },
  },

  rounds: [
    { idle: [1500, 2300], tellScale: 1.0, weights: { jabL: 3, jabR: 3, hook: 3, slam: 2, signature: 0 } },
    { idle: [1200, 1800], tellScale: 0.92, weights: { jabL: 2, jabR: 2, hook: 3, slam: 3, signature: 2 } },
    { idle: [950, 1450], tellScale: 0.85, weights: { jabL: 2, jabR: 2, hook: 3, slam: 3, signature: 3 } },
  ],
};
