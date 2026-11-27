import Phaser from 'phaser';
import { audio } from '../audio/audio.js';
import { W, H } from '../constants.js';
import { ROSTER, currentFight } from '../data/roster.js';
import { text } from '../gfx/text.js';
import { controls } from '../input/controls.js';

export class Title extends Phaser.Scene {
  constructor() { super('Title'); }

  create() {
    this.cameras.main.setBackgroundColor('#080818');
    // Spotlight beams
    const g = this.add.graphics();
    g.fillStyle(0x101030, 1);
    g.fillTriangle(40, 0, 0, H, 110, H);
    g.fillTriangle(216, 0, 146, H, W, H);

    this.add.image(W / 2, 202, 'portrait_new-mexico').setOrigin(0.5, 1);

    // Logo: chunky layered letters
    const logo = (dx, dy, tint) => text(this, W / 2 + dx, 22 + dy, 'PUNCHUP', tint, 0.5).setScale(4);
    logo(3, 3, 0x000000); logo(2, 2, 0x881400); logo(0, 0, 0xf8b800);
    text(this, W / 2, 58, 'STARRING MATEO SANDOVAL', 0xfcfcfc, 0.5);

    const panel = this.add.graphics();
    panel.fillStyle(0x000000, 0.85);
    panel.fillRect(0, 170, W, 70);
    this.prompt = text(this, W / 2, 173, 'PRESS Z TO START', 0xfcfcfc, 0.5);
    this.pick = text(this, W / 2, 182, '', 0x58f898, 0.5);
    this.showPick();
    text(this, W / 2, 192, 'Z / X  LEFT / RIGHT PUNCH', 0xbcbcbc, 0.5);
    text(this, W / 2, 201, 'HOLD UP TO AIM AT THE HEAD', 0xbcbcbc, 0.5);
    text(this, W / 2, 210, 'LEFT/RIGHT DODGE, HOLD = LONGER', 0xbcbcbc, 0.5);
    text(this, W / 2, 220, 'DOWN BLOCK   ENTER UPPERCUT', 0xf8b800, 0.5);
    text(this, W / 2, 231, 'M MUTE   ESC PAUSE', 0x7c7c7c, 0.5);

    this.blink = 0;
    audio.playMusic('title');
  }

  showPick() {
    const i = currentFight(this);
    this.pick.setText(`< FIGHT ${i + 1}: ${ROSTER[i].name} >`);
  }

  update(time, delta) {
    const step = controls.justDown('left') ? -1 : controls.justDown('right') ? 1 : 0;
    if (step) {
      this.registry.set('fightIndex', (currentFight(this) + step + ROSTER.length) % ROSTER.length);
      audio.blip();
      this.showPick();
    }
    this.blink += delta;
    this.prompt.setVisible(Math.floor(this.blink / 400) % 2 === 0);
    if (controls.justDown('mute')) audio.toggleMute();
    if (controls.confirm()) {
      audio.unlock();
      audio.blip();
      this.scene.start('Story');
    }
    controls.endFrame();
  }
}
