// Opponent #4 of the Mid-Major Circuit: the gentleman counter-puncher. He is
// quick, he fakes, and he never loosens the bow tie.
export default {
  key: 'ohio',
  name: 'RAY ABERNATHY',
  short: 'RAY',
  title: 'THE GENTLEMAN',
  from: 'OHIO',
  hp: 150,
  aura: 'twinkle',   // a little sparkle off the cufflinks

  colors: {
    shirt: '#fcfcfc', shirtDark: '#bcbcbc', shirtLight: '#fcfcfc',
    face: { eyes: [[16, 18], [25, 18]], mouth: [20, 27] },
    body: 'bare', skinLight: '#f8c8a0', chestHair: '#9c9c9c', bowtie: '#0c4c2c',
    trim: '#0c4c2c',
    trunks: '#fcfcfc', trunksDark: '#bcbcbc', stripe: '#0c4c2c',
    skin: '#d8a078', skinDark: '#a87048',
    glove: '#1c7c4c', gloveDark: '#0c4c2c', gloveLight: '#58c888',
    boots: '#0c4c2c',
    pad: '#0c4c2c', padLight: '#1c7c4c', padTrim: '#fcfcfc',
    panel: 0x0c4c2c,
  },

  lines: {
    intro: 'I WILL TRY TO KEEP\nTHE JACKET CLEAN.\nIT IS A RENTAL.',
    taunt: 'DO KEEP UP.',
    win: 'GOOD NIGHT, AND\nGOOD LUCK.',
    lose: 'WELL PLAYED. MIND\nTHE BOW TIE.',
  },

  tips: [
    'HE FAKES, MY SON. WHEN YOU SEE FEINT, DO NOT JUMP. WAIT FOR THE REAL PUNCH, THEN MOVE.',
    'LAST CALL IS FOUR PUNCHES. THREE STRAIGHT ONES TO DODGE, THEN A HOOK TO DUCK.',
  ],

  guardSwitchMs: [700, 1200],
  highGuardChance: 0.5,
  chipScale: 0.5,
  starDodge: 0.45,
  maxCombo: 5,
  stunMs: 520,
  stanceSwitchMs: [1600, 3200],

  knockdowns: [
    { upAt: 5, hp: 0.5 },
    { upAt: 8, hp: 0.35 },
  ],

  moves: {
    jabL: {
      label: 'JAB', tell: 470, tellPose: 'cockL', cue: 'tell',
      strikes: [{ at: 0, hand: 'L', dmg: 7, blockable: true }],
      openMiss: 650, bodyBonus: 1.3,
    },
    jabR: {
      label: 'JAB', tell: 470, tellPose: 'cockR', cue: 'tell',
      strikes: [{ at: 0, hand: 'R', dmg: 7, blockable: true }],
      openMiss: 650, bodyBonus: 1.3,
    },
    feint: {
      label: 'FEINT', tell: 520, tellPose: 'windR', cue: 'tell', feint: true,
      strikes: [{ at: 470, hand: 'L', dmg: 10, blockable: true }],
      openMiss: 900, star: true,
    },
    hook: {
      label: 'HOOK', tell: 880, tellPose: 'windR', cue: 'tell',
      strikes: [{ at: 0, hand: 'R', dmg: 14, blockable: false, hook: true }],
      openMiss: 950, star: true,
      flash: { at: 400, len: 130, zone: 'body' },
    },
    signature: {
      label: 'LAST CALL!', tell: 950, tellPose: 'flip', cue: 'tellBig', announce: true, nod: true,
      strikes: [
        { at: 0, hand: 'L', dmg: 6, blockable: false },
        { at: 340, hand: 'R', dmg: 6, blockable: false },
        { at: 680, hand: 'L', dmg: 6, blockable: false },
        { at: 1150, hand: 'R', dmg: 14, blockable: false, hook: true },
      ],
      openMiss: 1400, star: true,
      flash: { at: 500, len: 140, zone: 'head' },
    },
  },

  rounds: [
    { idle: [1200, 1900], tellScale: 1.0, weights: { jabL: 3, jabR: 3, feint: 3, hook: 2, signature: 0 } },
    { idle: [950, 1500], tellScale: 0.92, weights: { jabL: 2, jabR: 2, feint: 3, hook: 3, signature: 2 } },
    { idle: [750, 1250], tellScale: 0.85, weights: { jabL: 2, jabR: 2, feint: 3, hook: 3, signature: 3 } },
  ],
};
