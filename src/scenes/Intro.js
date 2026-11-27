import Phaser from 'phaser';
import { audio } from '../audio/audio.js';
import { W } from '../constants.js';
import tessa from '../data/tessa.js';
import { text } from '../gfx/text.js';
import { controls } from '../input/controls.js';

// The pre-fight "tale of the tape" screen.
export class Intro extends Phaser.Scene {
  constructor() { super('Intro'); }

  create() {
    const opp = tessa;
    this.cameras.main.setBackgroundColor('#080818');
    const g = this.add.graphics();
    g.fillStyle(0x881400, 1); g.fillRect(0, 26, W / 2, 132);
    g.fillStyle(0x14204c, 1); g.fillRect(W / 2, 26, W / 2, 132);
    g.fillStyle(0xfcfcfc, 1); g.fillRect(0, 24, W, 2); g.fillRect(0, 158, W, 2);

    text(this, W / 2, 6, 'MID-MAJOR CIRCUIT', 0xf8b800, 0.5);
    text(this, W / 2, 15, 'FIGHT 1', 0xfcfcfc, 0.5);

    const left = this.add.image(-40, 158, 'portrait_new-mexico').setOrigin(0.5, 1);
    const right = this.add.image(W + 40, 158, `portrait_${opp.key}`).setOrigin(0.5, 1);
    this.tweens.add({ targets: left, x: 62, duration: 450, ease: 'Cubic.easeOut' });
    this.tweens.add({ targets: right, x: W - 62, duration: 450, ease: 'Cubic.easeOut' });

    const vs = text(this, W / 2, 86, 'VS', 0xfcfcfc, 0.5, 0.5).setScale(3).setAlpha(0);
    this.tweens.add({ targets: vs, alpha: 1, delay: 450, duration: 80, onStart: () => audio.bigHit() });

    text(this, 62, 164, 'MATEO', 0xfcfcfc, 0.5);
    text(this, 62, 174, 'SANDOVAL', 0xfcfcfc, 0.5);
    text(this, 62, 185, 'THE ANCHOR', 0xf87858, 0.5);
    const [first, last] = opp.name.split(' ');
    text(this, W - 62, 164, first, 0xfcfcfc, 0.5);
    text(this, W - 62, 174, last, 0xfcfcfc, 0.5);
    text(this, W - 62, 185, opp.title, 0xf8b800, 0.5);

    text(this, W / 2, 198, `${opp.short}:`, 0xf8b800, 0.5);
    text(this, W / 2, 207, opp.lines.intro.replace(/\n/g, ' '), 0xfcfcfc, 0.5).setMaxWidth(W - 8).setCenterAlign();
    this.prompt = text(this, W / 2, 231, 'PRESS Z', 0xbcbcbc, 0.5);
    this.clock = 0;
  }

  update(time, delta) {
    this.clock += delta;
    this.prompt.setVisible(this.clock > 700 && Math.floor(this.clock / 400) % 2 === 0);
    if (this.clock > 700 && controls.confirm()) {
      audio.blip();
      this.scene.start('Fight');
    }
    controls.endFrame();
  }
}
