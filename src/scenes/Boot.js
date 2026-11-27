import Phaser from 'phaser';
import fontUrl from '../assets/fonts/font8.png';
import headTessa from '../assets/heads/toledo.png';
import headGreg from '../assets/heads/mount-st-marys.png';
import portraitMateo from '../assets/portraits/new-mexico.png';
import portraitTessa from '../assets/portraits/toledo.png';
import tessa from '../data/tessa.js';
import { registerFont } from '../gfx/text.js';
import { makeFx, makeMateo, makeOpponentBody, makeRing, outlineImage } from '../gfx/textures.js';

// Images are bundled into the page, so they are decoded directly instead of
// going through the network loader.
const IMAGES = {
  font8: fontUrl,
  head_toledo: headTessa,
  'head_mount-st-marys': headGreg,
  'portrait_new-mexico': portraitMateo,
  portrait_toledo: portraitTessa,
};

function decode(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export class Boot extends Phaser.Scene {
  constructor() { super('Boot'); }

  async create() {
    const entries = Object.entries(IMAGES);
    const imgs = await Promise.all(entries.map(([, src]) => decode(src)));
    entries.forEach(([key], i) => this.textures.addImage(key, imgs[i]));

    registerFont(this);
    makeRing(this);
    makeFx(this);
    makeMateo(this);
    makeOpponentBody(this, tessa.key, tessa.colors);
    outlineImage(this, 'head_mount-st-marys');
    this.scene.start('Title');
  }
}
