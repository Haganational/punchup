import Phaser from 'phaser';
import fontUrl from '../assets/fonts/font8.png';
import headTessa from '../assets/heads/toledo.png';
import headMateo from '../assets/heads/new-mexico.png';
import headGreg from '../assets/heads/mount-st-marys.png';
import portraitMateo from '../assets/portraits/new-mexico.png';
import portraitTessa from '../assets/portraits/toledo.png';
import headHannah from '../assets/heads/ball-state.png';
import portraitHannah from '../assets/portraits/ball-state.png';
import headRay from '../assets/heads/ohio.png';
import portraitRay from '../assets/portraits/ohio.png';
import headTrevor from '../assets/heads/central-michigan.png';
import portraitTrevor from '../assets/portraits/central-michigan.png';
import headGary from '../assets/heads/bowling-green.png';
import portraitGary from '../assets/portraits/bowling-green.png';
import { ROSTER, loadProgress } from '../data/roster.js';
import { makeCleveland } from '../gfx/cleveland.js';
import { registerFont } from '../gfx/text.js';
import { makeFx, makeMateo, makeOpponentBody, makeRing, outlineImage } from '../gfx/textures.js';

// Images are bundled into the page, so they are decoded directly instead of
// going through the network loader.
const IMAGES = {
  font8: fontUrl,
  head_toledo: headTessa,
  'head_mount-st-marys': headGreg,
  'head_new-mexico': headMateo,
  'portrait_new-mexico': portraitMateo,
  portrait_toledo: portraitTessa,
  'head_bowling-green': headGary,
  head_ohio: headRay,
  portrait_ohio: portraitRay,
  'head_central-michigan': headTrevor,
  'portrait_central-michigan': portraitTrevor,
  'head_ball-state': headHannah,
  'portrait_ball-state': portraitHannah,
  'portrait_bowling-green': portraitGary,
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
    ROSTER.forEach((f) => makeOpponentBody(this, f.key, f.colors));
    outlineImage(this, 'head_mount-st-marys');
    outlineImage(this, 'head_new-mexico');
    makeCleveland(this);
    const saved = loadProgress();
    this.registry.set('fightIndex', Math.min(ROSTER.length - 1, saved.fight));
    this.registry.set('champ', saved.champ);
    this.scene.start('Title');
  }
}
