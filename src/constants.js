// Screen size matches the NES: 256 x 240 pixels.
export const W = 256;
export const H = 240;

// A small NES-flavored palette used for everything drawn in code.
export const PAL = {
  black: '#000000',
  white: '#fcfcfc',
  grey: '#bcbcbc',
  dkGrey: '#7c7c7c',
  navy: '#14204c',
  blue: '#0078f8',
  sky: '#3cbcfc',
  red: '#e40058',
  cherry: '#d01030',
  dkRed: '#881400',
  orange: '#f83800',
  gold: '#f8b800',
  yellow: '#f8d878',
  green: '#00b800',
  dkGreen: '#005800',
  purple: '#6844fc',
};

export const num = (css) => parseInt(css.slice(1), 16);

// Fight tuning shared by every bout.
export const TUNE = {
  roundRealMs: 80000,      // real time per round
  roundClockSecs: 120,     // what the clock shows (2:00, sped up)
  rounds: 3,
  playerHp: 100,
  gasMax: 20,
  windedMs: 2000,
  maxStars: 3,
  punchBody: 3,
  punchHead: 4,
  starBase: 7,
  starMult: [2, 3.5, 5],
  countMs: 750,            // time per number of a 10-count
  mashNeeded: [10, 16, 24, 34],
  playerGetUpHp: [0.5, 0.35, 0.25, 0.2],
};
