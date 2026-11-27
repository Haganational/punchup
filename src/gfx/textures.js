// Every sprite that isn't a portrait is drawn here in code, pixel by pixel,
// into small canvas textures. No image files needed for the ring or the bodies.
import { W, H, PAL } from '../constants.js';

function canvas(scene, key, w, h, draw) {
  if (scene.textures.exists(key)) scene.textures.remove(key);
  const tex = scene.textures.createCanvas(key, w, h);
  const ctx = tex.getContext();
  const r = (color, x, y, rw = 1, rh = 1) => { ctx.fillStyle = color; ctx.fillRect(x, y, rw, rh); };
  draw(r, ctx);
  tex.refresh();
}

// Small deterministic random generator so the crowd looks the same every time.
function rng(seed) {
  let a = seed;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function bitmap(r, rows, colors, ox = 0, oy = 0) {
  rows.forEach((row, y) => {
    [...row].forEach((ch, x) => { if (colors[ch]) r(colors[ch], ox + x, oy + y); });
  });
}

export function makeGlove(scene, key, base, dark, light) {
  canvas(scene, key, 16, 16, (r) => {
    r(dark, 3, 0, 10, 16); r(dark, 1, 2, 14, 11); r(dark, 0, 4, 16, 7);
    r(base, 3, 1, 10, 13); r(base, 1, 3, 14, 9); r(base, 2, 2, 12, 11);
    r(light, 4, 2, 4, 2); r(light, 3, 4, 2, 2);
    r(dark, 11, 5, 1, 6); r(dark, 2, 11, 12, 1);
    r(PAL.white, 4, 14, 8, 2); r(PAL.grey, 4, 15, 8, 1);
  });
}

export function makeOpponentBody(scene, key, c) {
  // Torso: a polo shirt seen from the front.
  canvas(scene, `torso_${key}`, 48, 44, (r) => {
    r(c.shirt, 5, 0, 38, 6); r(c.shirt, 1, 3, 46, 11); r(c.shirt, 6, 6, 36, 38);
    r(c.shirtLight, 9, 8, 30, 3); r(c.shirtLight, 22, 6, 4, 16);
    r(c.shirtDark, 6, 14, 3, 30); r(c.shirtDark, 39, 14, 3, 30); r(c.shirtDark, 9, 36, 30, 2);
    r(c.skin, 20, 0, 8, 4); r(c.skinDark, 20, 3, 8, 1);
    r(c.trim, 16, 0, 4, 6); r(c.trim, 28, 0, 4, 6); r(c.trim, 18, 5, 3, 3); r(c.trim, 27, 5, 3, 3);
    r(c.trim, 1, 13, 6, 1); r(c.trim, 41, 13, 6, 1);
    r(c.trim, 30, 14, 6, 2);
    r(c.trim, 6, 41, 36, 3);
  });
  // Trunks, legs and boots.
  canvas(scene, `legs_${key}`, 40, 42, (r) => {
    r(c.trunks, 3, 0, 34, 17); r(c.trunksDark, 3, 15, 34, 2);
    r(PAL.white, 3, 0, 34, 3);
    r(c.stripe, 3, 3, 3, 14); r(c.stripe, 34, 3, 3, 14); r(c.trunksDark, 19, 9, 2, 8);
    r(c.skin, 7, 17, 10, 14); r(c.skin, 23, 17, 10, 14);
    r(c.skinDark, 15, 17, 2, 14); r(c.skinDark, 31, 17, 2, 14);
    r(c.boots, 6, 30, 12, 12); r(c.boots, 22, 30, 12, 12);
    r(PAL.white, 9, 32, 6, 1); r(PAL.white, 9, 35, 6, 1); r(PAL.white, 25, 32, 6, 1); r(PAL.white, 25, 35, 6, 1);
  });
  makeGlove(scene, `glove_${key}`, c.glove, c.gloveDark, c.gloveLight);
}

export function makeMateo(scene) {
  const red = PAL.cherry; const dk = '#880018'; const sil = PAL.grey; const hi = PAL.white;
  // Back of the torso: cherry-red bodysuit with silver swirls.
  canvas(scene, 'mateo_body', 40, 46, (r) => {
    r(red, 4, 0, 32, 8); r(red, 0, 4, 40, 12); r(red, 5, 8, 30, 38);
    r(dk, 5, 16, 3, 30); r(dk, 32, 16, 3, 30); r(dk, 19, 4, 2, 42);
    // silver sequin chevrons running down the back
    for (let row = 0; row < 5; row++) {
      const y = 7 + row * 7;
      for (let i = 0; i < 6; i++) {
        r(sil, 19 - 2 - i * 2, y + i, 2, 2);
        r(sil, 21 + i * 2, y + i, 2, 2);
      }
      r(hi, 17, y, 1, 1); r(hi, 22, y, 1, 1);
    }
    r(sil, 1, 10, 4, 2); r(sil, 35, 10, 4, 2);
    r(sil, 5, 42, 30, 4); r(hi, 5, 42, 30, 1);
  });
  // Back of the head: dark faded haircut.
  canvas(scene, 'mateo_head', 18, 20, (r) => {
    const hair = '#181818'; const fade = '#503000'; const skin = '#d09060'; const skinDk = '#a86838';
    r(hair, 3, 0, 12, 13); r(hair, 2, 1, 14, 10); r(hair, 1, 3, 16, 6);
    r('#383838', 5, 1, 6, 2);
    r(fade, 2, 10, 14, 3); r(skin, 3, 12, 12, 2);
    r(skin, 0, 6, 1, 4); r(skin, 17, 6, 1, 4);
    r(skin, 5, 13, 8, 7); r(skinDk, 5, 13, 8, 1); r(skinDk, 11, 14, 2, 6);
  });
  makeGlove(scene, 'glove_mateo', PAL.red, '#880018', '#f878a8');
}

export function makeRing(scene) {
  canvas(scene, 'ring', W, H, (r) => {
    const rand = rng(1987);
    r('#080818', 0, 0, W, H);
    // Crowd: rows of little heads and shoulders.
    r('#101030', 0, 36, W, 62);
    const shirts = ['#503000', '#7c7c7c', '#881400', '#004058', '#940084', '#bcbcbc', '#0058f8', '#ac7c00'];
    const skins = ['#f0d0b0', '#d09060', '#a86838', '#fca044'];
    for (let row = 0; row < 6; row++) {
      const y = 40 + row * 9;
      for (let x = (row % 2) * 4 - 2; x < W; x += 8) {
        const s = shirts[Math.floor(rand() * shirts.length)];
        const k = skins[Math.floor(rand() * skins.length)];
        r(k, x + 2, y, 3, 3);
        r(s, x, y + 3, 7, 5);
      }
    }
    // Dim the crowd so the fighters pop.
    r('rgba(8,8,32,0.45)', 0, 36, W, 62);
    // Overhead light rig.
    r('#383838', 0, 34, W, 3);
    for (let x = 12; x < W; x += 40) { r(PAL.yellow, x, 35, 10, 2); r(PAL.white, x + 3, 35, 4, 1); }

    // Mat: a trapezoid that widens toward the camera.
    for (let y = 112; y < H; y++) {
      const t = (y - 112) / (H - 112);
      const xl = Math.round(22 - 46 * t);
      const xr = Math.round(234 + 46 * t);
      r(y % 16 < 8 ? '#3890d8' : '#3488cc', xl, y, xr - xl, 1);
    }
    r('#58b0f0', 22, 112, 212, 2);
    // Center circle on the mat.
    for (let a = 0; a < 360; a += 3) {
      const rad = (a * Math.PI) / 180;
      r('#58b0f0', Math.round(128 + Math.cos(rad) * 60), Math.round(172 + Math.sin(rad) * 20), 2, 1);
    }

    // Far ropes and corner posts.
    const ropes = [[86, PAL.red], [96, PAL.white], [106, PAL.blue]];
    ropes.forEach(([y, col]) => { r(col, 26, y, 204, 2); r('rgba(0,0,0,0.35)', 26, y + 2, 204, 1); });
    r(PAL.white, 24, 80, 5, 34); r(PAL.red, 24, 80, 5, 4); r(PAL.dkGrey, 28, 84, 1, 30);
    r(PAL.white, 227, 80, 5, 34); r(PAL.blue, 227, 80, 5, 4); r(PAL.dkGrey, 231, 84, 1, 30);
    // Side ropes running toward the camera.
    ropes.forEach(([y, col], i) => {
      const endY = 126 + i * 28;
      for (let s = 0; s <= 26; s++) {
        const yy = Math.round(y + ((endY - y) * s) / 26);
        r(col, 26 - s, yy, 1, 2);
        r(col, 229 + s, yy, 1, 2);
      }
    });
  });

  // Camera flashes that pop in the crowd.
  canvas(scene, 'flashbulb', 5, 5, (r) => {
    r(PAL.white, 2, 0, 1, 5); r(PAL.white, 0, 2, 5, 1); r(PAL.yellow, 1, 1, 3, 3); r(PAL.white, 2, 2, 1, 1);
  });
}

export function makeFx(scene) {
  const starRows = [
    '....#....',
    '....#....',
    '...###...',
    '#########',
    '.#######.',
    '..#####..',
    '..#####..',
    '.###.###.',
    '.#.....#.',
  ];
  canvas(scene, 'star', 9, 9, (r) => bitmap(r, starRows, { '#': PAL.gold }));
  canvas(scene, 'star_off', 9, 9, (r) => bitmap(r, starRows, { '#': '#383838' }));
  canvas(scene, 'spark', 17, 17, (r) => {
    for (let i = -8; i <= 8; i++) { r(PAL.yellow, 8 + i, 8); r(PAL.yellow, 8, 8 + i); }
    for (let i = -5; i <= 5; i++) { r(PAL.white, 8 + i, 8 + i); r(PAL.white, 8 + i, 8 - i); }
    r(PAL.yellow, 5, 5, 7, 7); r(PAL.white, 6, 6, 5, 5);
  });
  canvas(scene, 'pixel', 1, 1, (r) => r(PAL.white, 0, 0));
}
