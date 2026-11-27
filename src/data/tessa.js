// Opponent #1 of the Mid-Major Circuit. Everything about a fighter lives in data
// like this, so new opponents can be added and tuned without touching game code.
export default {
  key: 'toledo',
  name: 'TESSA MORALES',
  short: 'TESSA',
  title: 'THE ROOKIE',
  from: 'TOLEDO',
  hp: 120,
  aura: 'bolt',      // lightning crackles around her gloves

  colors: {
    shirt: '#14204c', shirtDark: '#0c1434', shirtLight: '#24347c',
    face: { eyes: [[15, 18], [25, 18]], mouth: [20, 27] },
    body: 'top', skinLight: '#f8c8a0',
    trim: '#f8b800',
    trunks: '#f8b800', trunksDark: '#ac7c00', stripe: '#14204c',
    skin: '#e0a078', skinDark: '#b87850',
    glove: '#f8b800', gloveDark: '#ac7c00', gloveLight: '#fce0a8',
    boots: '#14204c',
    pad: '#14204c', padLight: '#3c54b4', padTrim: '#f8b800',
  },

  lines: {
    intro: 'I GREW UP WATCHING\nYOU ON TV. NOW\nWATCH THIS!',
    taunt: 'TOO SLOW!',
    win: 'BREAKING NEWS:\nYOU\'RE DOWN!',
    lose: 'OKAY... BACK TO THE\nHIGHLIGHT DESK.',
  },

  // Father Greg's corner advice after rounds 1 and 2.
  tips: [
    'SHE DROPS HER HANDS AFTER EVERY JAB, MY SON. DODGE IT, THEN GO TO THE BODY.',
    'WHEN SHE FLIPS THAT HAIR, TWO PUNCHES ARE COMING. DODGE BOTH AND MAKE HER PAY.',
  ],

  // How she behaves when nobody is throwing.
  guardSwitchMs: [800, 1400],
  highGuardChance: 0.6,
  chipScale: 0.75,     // damage scale for punches that sneak past her guard
  starDodge: 0.25,     // chance she sidesteps a star uppercut thrown at her guard
  maxCombo: 5,
  stunMs: 620,         // how long each landed combo punch keeps her stunned

  // After knockdown 1 and 2 she gets up; the third one is a knockout.
  knockdowns: [
    { upAt: 4, hp: 0.45 },
    { upAt: 7, hp: 0.3 },
  ],

  // tell: wind-up time in ms.  flash: a short window in the tell where a punch to
  // that zone interrupts her and earns a star.  openMiss: how long she is wide
  // open after you dodge.  star: dodging it and countering earns a star.
  moves: {
    jabL: {
      label: 'JAB', tell: 600, tellPose: 'cockL', cue: 'tell',
      strikes: [{ at: 0, hand: 'L', dmg: 6, blockable: true }],
      openMiss: 750, bodyBonus: 1.5,
    },
    jabR: {
      label: 'JAB', tell: 600, tellPose: 'cockR', cue: 'tell',
      strikes: [{ at: 0, hand: 'R', dmg: 6, blockable: true }],
      openMiss: 750, bodyBonus: 1.5,
    },
    hook: {
      label: 'HOOK', tell: 860, tellPose: 'windR', cue: 'tell',
      strikes: [{ at: 0, hand: 'R', dmg: 11, blockable: false, hook: true }],
      openMiss: 950, star: true,
      flash: { at: 320, len: 150, zone: 'head' },
    },
    signature: {
      label: 'HAIR FLIP!', tell: 980, tellPose: 'flip', cue: 'tellBig', announce: true, headFlip: true,
      strikes: [
        { at: 0, hand: 'L', dmg: 8, blockable: false },
        { at: 500, hand: 'R', dmg: 8, blockable: false },
      ],
      openMiss: 1300, star: true,
      flash: { at: 520, len: 150, zone: 'body' },
    },
  },

  // Round-by-round behavior: time between attacks, tell speed, and move mix.
  rounds: [
    { idle: [1500, 2400], tellScale: 1.0, weights: { jabL: 4, jabR: 4, hook: 2, signature: 0 } },
    { idle: [1100, 1800], tellScale: 0.88, weights: { jabL: 3, jabR: 3, hook: 3, signature: 2 } },
    { idle: [900, 1400], tellScale: 0.78, weights: { jabL: 3, jabR: 3, hook: 3, signature: 3 } },
  ],
};
