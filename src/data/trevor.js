// The boss of the Mid-Major Circuit. He has a bit of everybody's game: Tessa's
// speed, Gary's delayed hook, Hannah's slam and Ray's fakes.
export default {
  key: 'central-michigan',
  name: 'TREVOR HOLLOWAY',
  short: 'TREVOR',
  title: 'THE MAIN EVENT',
  from: 'CENTRAL MICHIGAN',
  boss: true,
  hp: 185,
  aura: 'gold',      // champion's glow

  colors: {
    shirt: '#681028', shirtDark: '#400818', shirtLight: '#982040',
    face: { eyes: [[15, 20], [26, 20]], mouth: [21, 29] },
    body: 'bare', skinLight: '#fcd0b0', bowtie: '#f8b800',
    trim: '#f8b800',
    trunks: '#681028', trunksDark: '#400818', stripe: '#f8b800',
    skin: '#e8b088', skinDark: '#b87850',
    glove: '#f8b800', gloveDark: '#ac7c00', gloveLight: '#fce0a8',
    boots: '#681028',
    pad: '#681028', padLight: '#982040', padTrim: '#f8b800',
    panel: 0x400818,
  },

  lines: {
    intro: 'I HAVE NEVER BLINKED\nON AIR. I DO NOT\nPLAN TO START NOW.',
    taunt: 'STILL ROLLING!',
    win: 'AND WE ARE CLEAR.\nGREAT SHOW, MATEO.',
    lose: 'I... BLINKED. TAKE\nTHE MIC. YOU EARNED IT.',
  },

  tips: [
    'HE HAS A LITTLE OF EVERYONE, MY SON. STRAIGHT PUNCHES YOU DODGE, HOOKS YOU DUCK, FAKES YOU WAIT OUT.',
    'BREAKING NEWS IS DUCK, DODGE, DODGE, DUCK. SAVE YOUR STARS AND SPEND THEM WHEN HE IS OPEN.',
  ],

  guardSwitchMs: [650, 1150],
  highGuardChance: 0.5,
  chipScale: 0.5,
  starDodge: 0.5,
  maxCombo: 5,
  stunMs: 500,
  stanceSwitchMs: [1500, 3000],

  knockdowns: [
    { upAt: 4, hp: 0.55 },
    { upAt: 7, hp: 0.4 },
  ],

  moves: {
    jabL: {
      label: 'JAB', tell: 460, tellPose: 'cockL', cue: 'tell',
      strikes: [{ at: 0, hand: 'L', dmg: 8, blockable: true }],
      openMiss: 650, bodyBonus: 1.3,
    },
    jabR: {
      label: 'JAB', tell: 460, tellPose: 'cockR', cue: 'tell',
      strikes: [{ at: 0, hand: 'R', dmg: 8, blockable: true }],
      openMiss: 650, bodyBonus: 1.3,
    },
    oneTwo: {
      label: 'ONE-TWO', tell: 600, tellPose: 'cockL', cue: 'tell',
      strikes: [
        { at: 0, hand: 'L', dmg: 7, blockable: true },
        { at: 380, hand: 'R', dmg: 8, blockable: true },
      ],
      openMiss: 800,
    },
    feint: {
      label: 'FEINT', tell: 500, tellPose: 'windR', cue: 'tell', feint: true,
      strikes: [{ at: 460, hand: 'L', dmg: 11, blockable: true }],
      openMiss: 900, star: true,
    },
    hook: {
      label: 'BIG HOOK', tell: 1150, tellPose: 'windR', cue: 'tell',
      strikes: [{ at: 0, hand: 'R', dmg: 17, blockable: false, hook: true }],
      openMiss: 1050, star: true,
      flash: { at: 560, len: 130, zone: 'body' },
    },
    slam: {
      label: 'SLAM', tell: 850, tellPose: 'flip', cue: 'tell',
      strikes: [{ at: 0, hand: 'L', dmg: 14, blockable: false }],
      openMiss: 950, star: true,
      flash: { at: 400, len: 130, zone: 'head' },
    },
    signature: {
      label: 'BREAKING NEWS!', tell: 1050, tellPose: 'flip', cue: 'tellBig', announce: true, nod: true,
      strikes: [
        { at: 0, hand: 'R', dmg: 10, blockable: false, hook: true },
        { at: 460, hand: 'L', dmg: 9, blockable: false },
        { at: 880, hand: 'R', dmg: 9, blockable: false },
        { at: 1380, hand: 'R', dmg: 16, blockable: false, hook: true },
      ],
      openMiss: 1500, star: true,
      flash: { at: 560, len: 140, zone: 'head' },
    },
  },

  rounds: [
    { idle: [1200, 1900], tellScale: 1.0, weights: { jabL: 3, jabR: 3, oneTwo: 2, feint: 2, hook: 2, slam: 2, signature: 0 } },
    { idle: [950, 1500], tellScale: 0.92, weights: { jabL: 2, jabR: 2, oneTwo: 2, feint: 2, hook: 3, slam: 3, signature: 2 } },
    { idle: [750, 1200], tellScale: 0.84, weights: { jabL: 2, jabR: 2, oneTwo: 2, feint: 3, hook: 3, slam: 3, signature: 3 } },
  ],
};
