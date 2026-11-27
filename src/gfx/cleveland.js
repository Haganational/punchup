// Pixel Cleveland: backdrops for the story scenes, all drawn in code.
// Each one is 256 x 150 and sits above the dialogue box.
import { W } from '../constants.js';
import { canvas, rng } from './textures.js';

const BH = 150;

// The downtown skyline: a pointed tower, a stepped tower, a slab, and filler.
function skyline(r, base, body, edge, lit, rand, lights = 0.3) {
  const win = (x, y, w, h) => {
    for (let yy = y + 3; yy < y + h - 2; yy += 4) {
      for (let xx = x + 2; xx < x + w - 2; xx += 3) if (rand() < lights) r(lit, xx, yy, 1, 2);
    }
  };
  const block = (x, w, h) => { r(body, x, base - h, w, h); r(edge, x, base - h, 1, h); win(x, base - h, w, h); };
  [[0, 16, 22], [14, 12, 34], [28, 18, 26], [44, 14, 40], [60, 20, 30], [176, 16, 38], [194, 20, 26], [212, 12, 44], [226, 18, 24], [242, 14, 32]]
    .forEach(([x, w, h]) => block(x, w, h));
  // stepped tower with a lantern top
  block(82, 22, 44); block(86, 14, 58); block(89, 8, 68); r(body, 92, base - 74, 2, 6); r(lit, 92, base - 70, 2, 2);
  // the tall one: shaft, pyramid crown, spire
  block(116, 24, 70);
  for (let i = 0; i < 10; i++) r(body, 118 + i, base - 71 - i, 20 - i * 2, 1);
  r(body, 127, base - 90, 2, 10); r('#f85858', 127, base - 91, 2, 1);
  // the slab
  block(148, 22, 56); r(edge, 148, base - 56, 22, 2);
}

function sky(r, bands) {
  let y = 0;
  bands.forEach(([color, h]) => { r(color, 0, y, W, h); y += h; });
}

function word(ctx, font, str, x, y, color, scale = 1) {
  const tmp = document.createElement('canvas');
  tmp.width = str.length * 8; tmp.height = 8;
  const t = tmp.getContext('2d');
  [...str].forEach((ch, i) => {
    const code = ch.charCodeAt(0) - 32;
    t.drawImage(font, (code % 16) * 8, Math.floor(code / 16) * 8, 8, 8, i * 8, 0, 8, 8);
  });
  t.globalCompositeOperation = 'source-in';
  t.fillStyle = color; t.fillRect(0, 0, tmp.width, 8);
  ctx.drawImage(tmp, x, y, tmp.width * scale, 8 * scale);
}

export function makeCleveland(scene) {
  const font = scene.textures.get('font8').getSourceImage();

  // ---- The lakefront at night ----
  canvas(scene, 'bg_lake', W, BH, (r) => {
    const rand = rng(216);
    sky(r, [['#080820', 30], ['#0c1038', 26], ['#141c58', 22], ['#202c78', 18]]);
    for (let i = 0; i < 60; i++) r(rand() < 0.2 ? '#fcfcfc' : '#7c8cd8', Math.floor(rand() * W), Math.floor(rand() * 70), 1, 1);
    r('#fcf0c0', 204, 14, 12, 12); r('#fcf0c0', 202, 16, 16, 8); r('#fcf0c0', 206, 12, 8, 16); r('#d8c890', 210, 17, 3, 3); r('#d8c890', 206, 21, 2, 2);
    skyline(r, 96, '#101430', '#283070', '#f8d878', rand, 0.34);
    // the lake, with the city and the moon shimmering on it
    r('#0c1840', 0, 96, W, 54); r('#283070', 0, 96, W, 1);
    for (let i = 0; i < 90; i++) {
      const x = Math.floor(rand() * W); const y = 98 + Math.floor(rand() * 36);
      r(x > 196 && x < 224 ? '#fcf0c0' : rand() < 0.3 ? '#f8d878' : '#1c2c68', x, y, 2 + Math.floor(rand() * 4), 1);
    }
    // pier, railing and a lamp
    r('#181818', 0, 134, W, 16); r('#383838', 0, 134, W, 1);
    r('#505050', 0, 122, W, 1); for (let x = 6; x < W; x += 18) r('#505050', x, 122, 1, 12);
    r('#303030', 40, 86, 2, 48); r('#303030', 36, 86, 10, 2); r('#fcf0c0', 36, 88, 4, 3); r('#f8d878', 35, 91, 6, 1);
  });

  // ---- The Flats: the river, a lift bridge and a neon bar ----
  canvas(scene, 'bg_flats', W, BH, (r, ctx) => {
    const rand = rng(440);
    sky(r, [['#100820', 26], ['#1c0c38', 22], ['#301050', 20], ['#481860', 14]]);
    for (let i = 0; i < 40; i++) r('#9878d8', Math.floor(rand() * W), Math.floor(rand() * 50), 1, 1);
    skyline(r, 82, '#180c30', '#402070', '#f8a8d0', rand, 0.28);
    // river
    r('#141040', 0, 82, W, 36);
    for (let i = 0; i < 70; i++) r(rand() < 0.4 ? '#f858a8' : '#2c2470', Math.floor(rand() * W), 84 + Math.floor(rand() * 32), 2 + Math.floor(rand() * 5), 1);
    // lift bridge: two towers and a raised truss span
    const steel = '#5c2c18'; const hi = '#a05030';
    [150, 232].forEach((x) => {
      r(steel, x, 28, 3, 62); r(steel, x + 9, 28, 3, 62); r(hi, x, 28, 1, 62);
      for (let y = 30; y < 88; y += 8) { r(steel, x, y, 12, 1); for (let i = 0; i < 8; i++) r(steel, x + 2 + i, y + i, 1, 1); }
      r(steel, x - 1, 26, 14, 3); r('#f85858', x + 5, 24, 2, 2);
    });
    r(steel, 162, 44, 70, 2); r(steel, 162, 56, 70, 3); r(hi, 162, 44, 70, 1);
    for (let x = 162; x < 232; x += 10) { r(steel, x, 44, 1, 12); for (let i = 0; i < 10; i++) r(steel, x + i, 46 + i, 1, 1); }
    // boardwalk and string lights
    r('#2c1c14', 0, 118, W, 32); r('#503020', 0, 118, W, 1);
    for (let x = 0; x < W; x += 14) r('#1c1008', x, 119, 1, 31);
    for (let x = 4; x < W; x += 12) { const y = 70 + Math.round(Math.sin(x / 20) * 3); r(['#f8d878', '#f858a8', '#58f8f8'][(x / 12) % 3 | 0], x, y, 2, 2); }
    // the bar: brick, a glowing door and a neon sign
    r('#481c14', 0, 60, 100, 60); r('#602820', 0, 60, 100, 2);
    for (let y = 64; y < 118; y += 4) for (let x = (y % 8 ? 0 : 4); x < 100; x += 8) r('#38140c', x, y, 7, 1);
    r('#f8b800', 68, 88, 18, 30); r('#fce0a8', 70, 90, 14, 12); r('#ac7c00', 76, 88, 2, 30);
    r('#201030', 8, 86, 50, 22); r('#58f8f8', 10, 88, 46, 18); r('#201030', 12, 90, 42, 14);
    r('#f8d878', 16, 100, 4, 4); r('#f8d878', 24, 99, 5, 5); r('#f8d878', 34, 100, 4, 4); r('#f8d878', 44, 99, 5, 5);
    r('#200818', 4, 64, 92, 16); r('#f858a8', 4, 64, 92, 1); r('#f858a8', 4, 79, 92, 1);
    word(ctx, font, 'THE FLATS', 15, 69, '#f858a8');
    word(ctx, font, 'PIEROGI', 17, 91, '#58f8f8', 0.5);
  });

  // ---- The theater district and its giant chandelier ----
  canvas(scene, 'bg_square', W, BH, (r, ctx) => {
    const rand = rng(1921);
    sky(r, [['#0c0818', 40], ['#181028', 40], ['#241838', 26]]);
    // buildings closing in on both sides
    [[0, 70, 0], [186, 70, 0]].forEach(([x, w]) => {
      r('#1c1428', x, 0, w, 106); r('#30243c', x === 0 ? w - 1 : x, 0, 1, 106);
      for (let y = 6; y < 60; y += 9) for (let xx = x + 5; xx < x + w - 6; xx += 9) r(rand() < 0.4 ? '#f8d878' : '#100c1c', xx, y, 5, 6);
    });
    r('#141020', 70, 40, 116, 66);
    for (let y = 46; y < 100; y += 8) for (let x = 76; x < 180; x += 8) if (rand() < 0.25) r('#f8d878', x, y, 3, 4);
    // marquees with chasing bulbs
    const marquee = (x, label, color) => {
      r('#681020', x, 66, 62, 20); r('#f8b800', x, 66, 62, 1); r('#f8b800', x, 85, 62, 1);
      for (let i = 0; i < 16; i++) { r(i % 2 ? '#fcfcfc' : '#f8d878', x + 1 + i * 4, 68, 2, 2); r(i % 2 ? '#f8d878' : '#fcfcfc', x + 1 + i * 4, 82, 2, 2); }
      word(ctx, font, label, x + 31 - label.length * 4, 72, color);
      r('#fce0a8', x + 6, 88, 50, 18); r('#f8b800', x + 6, 88, 50, 1); r('#681020', x + 30, 88, 2, 18);
    };
    marquee(4, 'TONIGHT', '#fcfcfc'); marquee(190, 'BOXING', '#f8d878');
    // the chandelier, hung over the street
    r('#585060', 70, 20, 116, 1); r('#585060', 127, 20, 2, 12);
    const gold = '#f8b800'; const glass = '#fcfcfc';
    r(gold, 122, 32, 12, 3); r(gold, 114, 35, 28, 2); r(gold, 106, 37, 44, 2);
    for (let i = 0; i < 9; i++) {
      const x = 107 + i * 5; const len = 16 - Math.abs(i - 4) * 3;
      for (let y = 0; y < len; y += 2) r(y % 4 ? glass : '#f8d878', x, 39 + y, 2, 1);
      r('#58f8f8', x, 39 + len, 2, 2);
    }
    r(glass, 126, 56, 4, 4); r('#f8d878', 127, 60, 2, 3);
    for (let i = 0; i < 24; i++) r('#f8d878', 96 + Math.floor(rand() * 64), 30 + Math.floor(rand() * 34), 1, 1);
    // wet street with reflections
    r('#181420', 0, 106, W, 44); r('#30283c', 0, 106, W, 1);
    for (let i = 0; i < 80; i++) {
      const x = Math.floor(rand() * W);
      r(x < 70 || x > 186 ? '#a8502c' : rand() < 0.5 ? '#806820' : '#242030', x, 108 + Math.floor(rand() * 40), 2 + Math.floor(rand() * 6), 1);
    }
    for (let x = 20; x < W; x += 40) r('#585060', x, 126, 14, 1);
  });

  // ---- Sunrise over the lake ----
  canvas(scene, 'bg_dawn', W, BH, (r) => {
    const rand = rng(77);
    sky(r, [['#281850', 18], ['#582868', 16], ['#a03868', 16], ['#e05850', 16], ['#f89048', 16], ['#f8c868', 14]]);
    r('#fcf0c0', 180, 78, 28, 18); r('#fcf0c0', 176, 84, 36, 12); r('#fcfcfc', 186, 84, 16, 12);
    for (let i = 0; i < 6; i++) r('#f8a0a0', 20 + i * 38 + Math.floor(rand() * 10), 20 + Math.floor(rand() * 30), 18 + Math.floor(rand() * 14), 2);
    skyline(r, 96, '#201038', '#482858', '#f8d878', rand, 0.08);
    r('#402868', 0, 96, W, 54); r('#f8c868', 0, 96, W, 1);
    for (let i = 0; i < 110; i++) {
      const x = Math.floor(rand() * W); const y = 98 + Math.floor(rand() * 38);
      r(Math.abs(x - 194) < 26 - (y - 98) / 3 ? '#fcf0c0' : rand() < 0.4 ? '#e05850' : '#583078', x, y, 2 + Math.floor(rand() * 5), 1);
    }
    r('#181018', 0, 134, W, 16); r('#382838', 0, 134, W, 1);
    r('#382838', 0, 122, W, 1); for (let x = 6; x < W; x += 18) r('#382838', x, 122, 1, 12);
    // gulls
    [[60, 40], [78, 34], [150, 26]].forEach(([x, y]) => { r('#fcfcfc', x, y, 3, 1); r('#fcfcfc', x + 4, y, 3, 1); r('#fcfcfc', x + 3, y + 1, 1, 1); });
  });
}
