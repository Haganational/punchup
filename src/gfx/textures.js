// Every sprite that isn't a portrait is drawn here in code, pixel by pixel,
// into small canvas textures. No image files needed for the ring or the bodies.
import { W, H, PAL } from '../constants.js';

const INK = '#080818';   // the dark outline color around every sprite

// Draw into a new canvas texture. With `outline`, the sprite gets a 1-pixel
// dark contour (the canvas grows by 1px on each side to make room).
function canvas(scene, key, w, h, draw, outline = null) {
  if (scene.textures.exists(key)) scene.textures.remove(key);
  const pad = outline ? 1 : 0;
  const tex = scene.textures.createCanvas(key, w + pad * 2, h + pad * 2);
  const ctx = tex.getContext();
  ctx.imageSmoothingEnabled = false;
  const r = (color, x, y, rw = 1, rh = 1) => { ctx.fillStyle = color; ctx.fillRect(x + pad, y + pad, rw, rh); };
  draw(r, ctx, pad);
  if (outline) addOutline(ctx, w + 2, h + 2, outline);
  tex.refresh();
}

function addOutline(ctx, w, h, color) {
  const img = ctx.getImageData(0, 0, w, h);
  const d = img.data;
  const solid = (x, y) => x >= 0 && y >= 0 && x < w && y < h && d[(y * w + x) * 4 + 3] > 127;
  const edge = [];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (!solid(x, y) && (solid(x - 1, y) || solid(x + 1, y) || solid(x, y - 1) || solid(x, y + 1))) edge.push([x, y]);
    }
  }
  ctx.fillStyle = color;
  edge.forEach(([x, y]) => ctx.fillRect(x, y, 1, 1));
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
    // rounded mitt
    r(base, 4, 0, 8, 14); r(base, 2, 1, 12, 12); r(base, 1, 2, 14, 10); r(base, 0, 4, 16, 6);
    // shading on the lower right, shine on the upper left
    r(dark, 12, 9, 3, 3); r(dark, 9, 11, 5, 2); r(dark, 4, 13, 8, 1); r(dark, 14, 6, 2, 4);
    r(light, 3, 2, 5, 2); r(light, 2, 4, 2, 3); r(PAL.white, 4, 3, 2, 1);
    // thumb and seam
    r(dark, 10, 4, 1, 6); r(dark, 11, 4, 2, 1);
    r(base, 11, 5, 3, 4); r(light, 12, 5, 1, 2);
    // laced cuff
    r(PAL.white, 4, 14, 8, 2); r(PAL.grey, 4, 15, 8, 1); r(dark, 6, 14, 1, 1); r(dark, 9, 14, 1, 1);
  }, INK);
}

export function makeOpponentBody(scene, key, c) {
  // Torso: a polo shirt seen from the front, with rounded shoulders and shading.
  canvas(scene, `torso_${key}`, 48, 44, (r) => {
    r(c.shirt, 8, 0, 32, 4); r(c.shirt, 4, 2, 40, 6); r(c.shirt, 1, 5, 46, 9); r(c.shirt, 6, 12, 36, 32);
    r(c.shirt, 7, 40, 34, 4);
    // light from above: bright shoulders and chest
    r(c.shirtLight, 6, 3, 10, 2); r(c.shirtLight, 32, 3, 10, 2); r(c.shirtLight, 3, 6, 6, 2); r(c.shirtLight, 39, 6, 6, 2);
    r(c.shirtLight, 12, 12, 9, 2); r(c.shirtLight, 27, 12, 9, 2); r(c.shirtLight, 11, 14, 4, 4);
    // shadow under the arms, down the sides and under the chest
    r(c.shirtDark, 6, 14, 3, 30); r(c.shirtDark, 39, 14, 3, 30);
    r(c.shirtDark, 1, 12, 5, 2); r(c.shirtDark, 42, 12, 5, 2);
    r(c.shirtDark, 12, 24, 24, 1); r(c.shirtDark, 14, 25, 20, 1);
    r(c.shirtDark, 10, 34, 2, 6); r(c.shirtDark, 36, 34, 2, 6); r(c.shirtDark, 16, 37, 16, 1);
    // neck, collar and placket
    r(c.skin, 19, 0, 10, 4); r(c.skinDark, 19, 3, 10, 1); r(c.skinDark, 22, 4, 4, 2);
    r(c.trim, 14, 0, 5, 5); r(c.trim, 29, 0, 5, 5); r(c.trim, 16, 5, 5, 2); r(c.trim, 27, 5, 5, 2); r(c.trim, 19, 7, 3, 2); r(c.trim, 26, 7, 3, 2);
    r(c.shirtLight, 23, 8, 2, 12); r(PAL.white, 23, 11, 2, 1); r(PAL.white, 23, 15, 2, 1);
    if (c.yoke) {
      // quarter-zip pullover: dark yoke across the shoulders, stand collar, zipper
      r(c.yoke, 8, 0, 32, 4); r(c.yoke, 4, 2, 40, 6); r(c.yoke, 1, 5, 46, 6);
      r(c.yokeLight, 6, 3, 10, 2); r(c.yokeLight, 32, 3, 10, 2);
      r(c.skin, 20, 0, 8, 3); r(c.skinDark, 20, 2, 8, 1);
      r(c.shirt, 15, 0, 5, 6); r(c.shirt, 28, 0, 5, 6); r(c.shirtLight, 15, 0, 2, 5); r(c.shirtDark, 31, 0, 2, 6);
      r(c.shirt, 20, 4, 8, 7); r(PAL.grey, 23, 3, 2, 16); r(PAL.white, 23, 18, 2, 2);
    }
    // sleeve hems, chest badge and hem
    r(c.trim, 1, 13, 6, 1); r(c.trim, 41, 13, 6, 1);
    r(c.trim, 30, 15, 7, 2); r(c.shirtLight, 31, 15, 2, 1);
    r(c.trim, 7, 42, 34, 2);
  }, INK);

  // Trunks, legs and boots.
  canvas(scene, `legs_${key}`, 40, 42, (r) => {
    r(c.trunks, 3, 0, 34, 16); r(c.trunks, 4, 16, 14, 2); r(c.trunks, 22, 16, 14, 2);
    r(PAL.white, 3, 0, 34, 3); r(PAL.grey, 3, 2, 34, 1); r(c.stripe, 17, 0, 6, 3);
    r(c.stripe, 3, 3, 3, 15); r(c.stripe, 34, 3, 3, 15);
    r(c.trunksDark, 18, 8, 4, 10); r(c.trunksDark, 8, 15, 8, 1); r(c.trunksDark, 24, 15, 8, 1);
    r('#fce0a8', 8, 5, 6, 2); r('#fce0a8', 26, 5, 6, 2);
    // legs with a knee highlight and inner shadow
    r(c.skin, 7, 18, 10, 13); r(c.skin, 23, 18, 10, 13);
    r(c.skinDark, 15, 18, 2, 13); r(c.skinDark, 23, 18, 2, 13); r(c.skinDark, 7, 18, 10, 1); r(c.skinDark, 23, 18, 10, 1);
    r('#f8c8a0', 9, 22, 3, 3); r('#f8c8a0', 27, 22, 3, 3);
    // boots: tongue, laces, sole
    r(c.boots, 6, 30, 12, 11); r(c.boots, 22, 30, 12, 11); r(c.boots, 5, 37, 14, 4); r(c.boots, 21, 37, 14, 4);
    r(PAL.white, 6, 30, 12, 1); r(PAL.white, 22, 30, 12, 1);
    r(PAL.white, 10, 32, 4, 1); r(PAL.white, 10, 34, 4, 1); r(PAL.white, 10, 36, 4, 1);
    r(PAL.white, 26, 32, 4, 1); r(PAL.white, 26, 34, 4, 1); r(PAL.white, 26, 36, 4, 1);
    r(PAL.grey, 5, 41, 14, 1); r(PAL.grey, 21, 41, 14, 1);
  }, INK);
  // Armored shoulder: a round plate with a bright rim and a horn. Mirrored for the other side.
  canvas(scene, `pad_${key}`, 15, 15, (r) => {
    const base = c.pad || c.shirtDark; const lit = c.padLight || c.shirt; const rim = c.padTrim || c.trim;
    r(rim, 2, 0, 3, 2); r(rim, 3, 2, 3, 2); r(PAL.white, 2, 0, 1, 1);
    r(base, 4, 4, 8, 11); r(base, 2, 5, 12, 9); r(base, 0, 7, 15, 6);
    r(lit, 4, 5, 6, 2); r(lit, 2, 7, 4, 2); r(PAL.white, 5, 6, 2, 1);
    r(rim, 0, 12, 15, 1); r(rim, 2, 13, 12, 1); r(rim, 4, 14, 8, 1);
    r(rim, 7, 8, 2, 2);
  }, INK);
  makeGlove(scene, `glove_${key}`, c.glove, c.gloveDark, c.gloveLight);
  outlineImage(scene, `head_${key}`);
}

// Give a loaded image (a pixel-art head) the same dark contour as the drawn sprites.
export function outlineImage(scene, key) {
  const src = scene.textures.get(key).getSourceImage();
  const w = src.width; const h = src.height;
  canvas(scene, `${key}_o`, w, h, (r, ctx, pad) => ctx.drawImage(src, pad, pad), INK);
}

export function makeMateo(scene) {
  const red = PAL.cherry; const dk = '#880018'; const sil = PAL.grey; const hi = PAL.white;
  const skin = '#d09060'; const skDk = '#a86838'; const skLt = '#eab888';
  // Ring gear: bare, muscled back with a silver sequin harness and cherry-red
  // sequined trunks under a wide silver belt.
  canvas(scene, 'mateo_body', 46, 46, (r) => {
    // silhouette: thick traps, wide shoulders, tapering to a narrow waist
    r(skin, 15, 0, 16, 3); r(skin, 7, 1, 32, 4); r(skin, 2, 3, 42, 6); r(skin, 0, 5, 46, 8);
    r(skin, 3, 13, 40, 6); r(skin, 6, 19, 34, 6); r(skin, 9, 25, 28, 5); r(skin, 11, 30, 24, 4);
    // light on the traps, shoulders and the wings of the back
    r(skLt, 16, 1, 5, 1); r(skLt, 25, 1, 5, 1); r(skLt, 3, 5, 7, 2); r(skLt, 36, 5, 7, 2); r(skLt, 1, 7, 3, 3); r(skLt, 42, 7, 3, 3);
    r(skLt, 12, 13, 6, 2); r(skLt, 28, 13, 6, 2); r(skLt, 8, 19, 4, 3); r(skLt, 34, 19, 4, 3);
    // shadow: spine, shoulder blades, under the lats, lower back
    r(skDk, 22, 2, 2, 31);
    r(skDk, 12, 9, 8, 1); r(skDk, 26, 9, 8, 1); r(skDk, 11, 10, 1, 5); r(skDk, 34, 10, 1, 5); r(skDk, 13, 16, 6, 1); r(skDk, 27, 16, 6, 1);
    r(skDk, 0, 12, 4, 1); r(skDk, 42, 12, 4, 1); r(skDk, 3, 14, 2, 5); r(skDk, 41, 14, 2, 5);
    r(skDk, 6, 20, 2, 5); r(skDk, 38, 20, 2, 5); r(skDk, 9, 26, 2, 4); r(skDk, 35, 26, 2, 4);
    r(skDk, 18, 28, 2, 2); r(skDk, 26, 28, 2, 2); r(skDk, 15, 23, 5, 1); r(skDk, 26, 23, 5, 1);
    // harness: two sequin straps crossing over a gold star medallion
    for (let i = 0; i < 15; i++) {
      const y = 3 + i * 2; const x = Math.round(9 + i * 1.75);
      r(sil, x, y, 3, 2); r(sil, 43 - x, y, 3, 2);
      if (i % 3 === 0) { r(hi, x, y, 1, 1); r(hi, 45 - x, y, 1, 1); }
    }
    r(PAL.gold, 20, 15, 6, 6); r(PAL.gold, 22, 13, 2, 10); r(PAL.gold, 18, 17, 10, 2); r(PAL.yellow, 22, 16, 2, 3); r(hi, 22, 17, 1, 1);
    // trunks
    r(red, 10, 34, 26, 12); r(red, 9, 38, 28, 8);
    r(dk, 9, 38, 2, 8); r(dk, 35, 38, 2, 8); r(dk, 22, 39, 2, 7);
    for (let y = 39; y < 46; y += 2) for (let x = 12 + (y % 4); x < 35; x += 4) r(sil, x, y, 1, 1);
    r(sil, 10, 33, 26, 5); r(hi, 10, 33, 26, 1); r(PAL.dkGrey, 10, 37, 26, 1); r(PAL.gold, 19, 34, 8, 3); r(PAL.yellow, 21, 35, 4, 1);
  }, INK);
  // Back of the head: dark faded haircut.
  canvas(scene, 'mateo_head', 18, 20, (r) => {
    const hair = '#181818'; const fade = '#503000'; const skin = '#d09060'; const skinDk = '#a86838';
    r(hair, 4, 0, 10, 13); r(hair, 2, 1, 14, 11); r(hair, 1, 3, 16, 7);
    r('#404040', 5, 1, 6, 1); r('#303030', 4, 2, 3, 2);
    r(fade, 2, 10, 14, 2); r(skin, 3, 12, 12, 2); r(skinDk, 3, 13, 12, 1);
    r(skin, 0, 6, 1, 4); r(skin, 17, 6, 1, 4); r(skinDk, 0, 9, 1, 1); r(skinDk, 17, 9, 1, 1);
    r(skin, 5, 14, 8, 6); r(skinDk, 5, 14, 8, 1); r(skinDk, 11, 15, 2, 5);
  }, INK);
  makeGlove(scene, 'glove_mateo', PAL.red, '#880018', '#f878a8');
}

// The crowd is its own strip so it can bounce. `frame` 0 and 1 bob alternate
// people; frame 2 has arms in the air for big moments.
function makeCrowd(scene, key, frame) {
  canvas(scene, key, W, 64, (r) => {
    const rand = rng(1987);
    r('#101030', 0, 0, W, 64);
    const shirts = ['#503000', '#7c7c7c', '#881400', '#004058', '#940084', '#bcbcbc', '#0058f8', '#ac7c00', '#005800'];
    const skins = ['#f0d0b0', '#d09060', '#a86838', '#fca044'];
    for (let row = 0; row < 6; row++) {
      const y0 = 5 + row * 9;
      let i = 0;
      for (let x = (row % 2) * 4 - 2; x < W; x += 8, i++) {
        const s = shirts[Math.floor(rand() * shirts.length)];
        const k = skins[Math.floor(rand() * skins.length)];
        const jumpy = rand() < 0.5;
        const up = frame === 2 ? (jumpy ? 2 : 1) : frame === 1 ? ((i + row) % 2 ? 1 : 0) : ((i + row) % 2 ? 0 : 1);
        const y = y0 - up;
        r(k, x + 2, y, 3, 3);
        r(s, x, y + 3, 7, 5 + up);
        if (frame === 2 && jumpy) { r(k, x, y - 2, 1, 4); r(k, x + 6, y - 2, 1, 4); }
      }
    }
    // Dim the crowd so the fighters pop; the back rows fade into the dark.
    r('rgba(8,8,32,0.4)', 0, 0, W, 64);
    r('rgba(8,8,32,0.35)', 0, 0, W, 14);
    r('rgba(8,8,32,0.25)', 0, 14, W, 12);
  });
}

export function makeRing(scene) {
  makeCrowd(scene, 'crowd0', 0);
  makeCrowd(scene, 'crowd1', 1);
  makeCrowd(scene, 'crowd2', 2);

  const font = scene.textures.get('font8').getSourceImage();
  canvas(scene, 'ring', W, H, (r, ctx) => {
    r('#080818', 0, 0, W, H);
    ctx.clearRect(0, 36, W, 64);   // a window: the animated crowd shows through here
    // Overhead light rig.
    r('#282838', 0, 32, W, 5); r('#484858', 0, 32, W, 1);
    for (let x = 12; x < W; x += 40) { r(PAL.yellow, x, 34, 10, 3); r(PAL.white, x + 2, 34, 6, 1); }
    // Low wall between the crowd and the ring.
    r('#181828', 0, 100, W, 12); r('#383850', 0, 100, W, 1);

    // Mat: a trapezoid that widens toward the camera, lit from the middle.
    for (let y = 112; y < H; y++) {
      const t = (y - 112) / (H - 112);
      const xl = Math.round(22 - 46 * t);
      const xr = Math.round(234 + 46 * t);
      r('#2c78c0', xl, y, xr - xl, 1);
      const lw = Math.round((90 + 60 * t) * (1 - Math.abs(t - 0.45) * 0.9));
      r('#3890d8', 128 - lw, y, lw * 2, 1);
      const cw = Math.round(lw * 0.55);
      r('#48a0e8', 128 - cw, y, cw * 2, 1);
    }
    r('#70c0f8', 22, 112, 212, 1); r('#1c5898', 22, 113, 212, 1);
    // Center ring and the game's name painted on the canvas.
    for (let a = 0; a < 360; a += 2) {
      const rad = (a * Math.PI) / 180;
      r('#70c0f8', Math.round(128 + Math.cos(rad) * 62), Math.round(172 + Math.sin(rad) * 21), 2, 1);
    }
    const word = 'PUNCHUP';
    ctx.globalAlpha = 0.55;
    [...word].forEach((ch, i) => {
      const code = ch.charCodeAt(0) - 32;
      ctx.drawImage(font, (code % 16) * 8, Math.floor(code / 16) * 8, 8, 8, 128 - word.length * 6 + i * 12, 150, 12, 8);
    });
    ctx.globalAlpha = 1;

    // Far ropes, corner posts and turnbuckle pads.
    const ropes = [[86, PAL.red], [96, PAL.white], [106, PAL.blue]];
    ropes.forEach(([y, col]) => { r(col, 26, y, 204, 2); r('rgba(0,0,0,0.4)', 26, y + 2, 204, 1); });
    [[24, PAL.red], [227, PAL.blue]].forEach(([x, col]) => {
      r(PAL.white, x, 80, 5, 34); r(PAL.dkGrey, x + 4, 82, 1, 32); r(INK, x - 1, 80, 1, 34); r(INK, x + 5, 80, 1, 34);
      r(col, x - 1, 78, 7, 4);
      ropes.forEach(([y]) => { r(col, x - 2, y - 2, 9, 6); r('rgba(255,255,255,0.35)', x - 1, y - 2, 7, 1); });
    });
    // Side ropes running toward the camera.
    ropes.forEach(([y, col], i) => {
      const endY = 126 + i * 28;
      for (let s = 0; s <= 26; s++) {
        const yy = Math.round(y + ((endY - y) * s) / 26);
        r(col, 26 - s, yy, 1, 2); r('rgba(0,0,0,0.4)', 26 - s, yy + 2, 1, 1);
        r(col, 229 + s, yy, 1, 2); r('rgba(0,0,0,0.4)', 229 + s, yy + 2, 1, 1);
      }
    });
    // Darken the edges of the mat so the eye stays on the fighters.
    for (let i = 0; i < 5; i++) { r('rgba(0,0,24,0.1)', 0, 112, 16 + i * 10, H - 112); r('rgba(0,0,24,0.1)', W - 16 - i * 10, 112, 16 + i * 10, H - 112); }
  });

  // Camera flashes that pop in the crowd.
  canvas(scene, 'flashbulb', 5, 5, (r) => {
    r(PAL.white, 2, 0, 1, 5); r(PAL.white, 0, 2, 5, 1); r(PAL.yellow, 1, 1, 3, 3); r(PAL.white, 2, 2, 1, 1);
  });
  // Soft shadow a fighter casts on the mat.
  canvas(scene, 'shadow', 64, 12, (r) => {
    for (let y = 0; y < 12; y++) {
      const half = Math.round(32 * Math.sqrt(1 - ((y - 5.5) / 6) ** 2));
      r('rgba(0,0,32,0.35)', 32 - half, y, half * 2, 1);
    }
  });
}

export function makeFx(scene) {
  // Aura bits that crackle or burn around a fighter's gloves.
  canvas(scene, 'aura_bolt', 5, 9, (r) => bitmap(r, ['...##', '..##.', '.##..', '####.', '.####', '..##.', '.##..', '##...', '#....'], { '#': PAL.yellow }));
  canvas(scene, 'aura_ember', 5, 6, (r) => bitmap(r, ['..o..', '.oo..', '.oyo.', 'oyyo.', 'oywyo', '.oyo.'], { o: PAL.orange, y: PAL.gold, w: PAL.white }));
  canvas(scene, 'aura_twinkle', 5, 5, (r) => bitmap(r, ['..#..', '..#..', '##w##', '..#..', '..#..'], { '#': PAL.white, w: PAL.yellow }));
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
  canvas(scene, 'star', 9, 9, (r) => bitmap(r, starRows, { '#': PAL.gold }), INK);
  canvas(scene, 'star_off', 9, 9, (r) => bitmap(r, starRows, { '#': '#383838' }));
  canvas(scene, 'dizzy', 5, 5, (r) => {
    r(PAL.yellow, 2, 0, 1, 5); r(PAL.yellow, 0, 2, 5, 1); r(PAL.white, 2, 2, 1, 1); r(PAL.gold, 1, 1, 1, 1); r(PAL.gold, 3, 3, 1, 1); r(PAL.gold, 3, 1, 1, 1); r(PAL.gold, 1, 3, 1, 1);
  });
  // Comic-book impact burst: a spiky star with a hot center.
  const burst = (key, spikes, rot) => canvas(scene, key, 27, 27, (r) => {
    const layers = [[13, 6, PAL.red], [11, 5, PAL.gold], [8, 3.5, PAL.yellow], [5, 2.5, PAL.white]];
    layers.forEach(([outer, inner, color]) => {
      for (let y = 0; y < 27; y++) {
        for (let x = 0; x < 27; x++) {
          const dx = x - 13; const dy = y - 13;
          const a = Math.atan2(dy, dx) + rot;
          const frac = ((a / (2 * Math.PI)) * spikes) % 1;
          const tri = Math.abs(((frac + 1) % 1) - 0.5) * 2;      // 0 at a spike tip, 1 between spikes
          const limit = inner + (outer - inner) * (1 - tri);
          if (Math.hypot(dx, dy) <= limit) r(color, x, y);
        }
      }
    });
  }, INK);
  burst('spark', 8, 0);
  burst('spark2', 7, 0.4);
  canvas(scene, 'pixel', 1, 1, (r) => r(PAL.white, 0, 0));
}
