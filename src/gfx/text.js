// Bitmap-font helpers. All text uses one 8x8 pixel font.
import Phaser from 'phaser';
export const FONT = 'font';

export function registerFont(scene) {
  let chars = '';
  for (let c = 32; c < 127; c++) chars += String.fromCharCode(c);
  const config = {
    image: 'font8', width: 8, height: 8, chars, charsPerRow: 16,
    offset: { x: 0, y: 0 }, spacing: { x: 0, y: 0 }, lineSpacing: 2,
  };
  scene.cache.bitmapFont.add(FONT, Phaser.GameObjects.RetroFont.Parse(scene, config));
}

export function text(scene, x, y, str, tint = 0xfcfcfc, originX = 0, originY = 0) {
  return scene.add.bitmapText(x, y, FONT, str).setOrigin(originX, originY).setTint(tint);
}

// Break a sentence into lines of at most `width` characters.
export function wrap(str, width) {
  const lines = [];
  let line = '';
  str.split(' ').forEach((word) => {
    if ((line + ' ' + word).trim().length > width) { lines.push(line); line = word; }
    else line = (line + ' ' + word).trim();
  });
  if (line) lines.push(line);
  return lines.join('\n');
}
