import Phaser from 'phaser';
import { audio } from '../audio/audio.js';
import { W, H } from '../constants.js';
import { currentFight } from '../data/roster.js';
import { CHAPTERS, ENDING } from '../data/story.js';
import { text, wrap } from '../gfx/text.js';
import { controls } from '../input/controls.js';

const TYPE_MS = 22;   // per letter

// Story cutscenes: a Cleveland backdrop on top, a talking head and typed
// dialogue below. Start with { ending: true } for the closing chapter.
export class Story extends Phaser.Scene {
  constructor() { super('Story'); }

  create(data) {
    this.ending = !!(data && data.ending);
    this.chapter = this.ending ? ENDING : CHAPTERS[currentFight(this)];
    if (!this.chapter) { this.leave(); return; }
    this.cameras.main.setBackgroundColor('#000000');
    this.bg = this.add.image(0, 0, `bg_${this.chapter.panels[0].bg}`).setOrigin(0);
    this.twinkles = this.add.graphics();
    this.place = text(this, 4, 4, '', 0xfcfcfc);
    this.placeBox = this.add.graphics();

    const box = this.add.graphics();
    box.fillStyle(0x080818, 1); box.fillRect(0, 150, W, H - 150);
    box.fillStyle(0xfcfcfc, 1); box.fillRect(0, 150, W, 1);
    box.fillStyle(0xf8b800, 1); box.fillRect(0, 152, W, 1);
    this.head = this.add.image(27, 194, 'head_toledo_o').setVisible(false);
    this.nameText = text(this, 54, 158, '', 0xf8b800);
    this.body = text(this, 54, 170, '', 0xfcfcfc);
    this.narration = text(this, W / 2, 166, '', 0xbcbcbc, 0.5).setCenterAlign();
    this.prompt = text(this, W - 4, H - 10, 'Z', 0xfcfcfc, 1);
    this.skip = text(this, 4, H - 10, 'X SKIP', 0x7c7c7c);

    // Chapter card
    this.card = this.add.container(0, 0).setDepth(10);
    const cg = this.add.graphics();
    cg.fillStyle(0x000000, 1); cg.fillRect(0, 0, W, H);
    this.card.add([cg, text(this, W / 2, 96, this.chapter.title, 0xf8b800, 0.5, 0.5).setScale(2), text(this, W / 2, 122, this.chapter.sub, 0xfcfcfc, 0.5, 0.5)]);
    this.cardT = 1700;

    this.panelIndex = 0;
    this.lineIndex = -1;
    this.clock = 0;
    this.typeT = 0;
    this.full = '';
    this.setPanel(0);
    audio.playMusic('story');
  }

  setPanel(i) {
    this.panelIndex = i;
    const p = this.chapter.panels[i];
    this.bg.setTexture(`bg_${p.bg}`);
    this.place.setText(p.place);
    this.placeBox.clear();
    this.placeBox.fillStyle(0x000000, 0.7); this.placeBox.fillRect(0, 0, p.place.length * 8 + 8, 16);
    this.children.bringToTop(this.place);
    this.cameras.main.fadeIn(350, 0, 0, 0);
    this.lineIndex = -1;
    this.nextLine();
  }

  nextLine() {
    const p = this.chapter.panels[this.panelIndex];
    this.lineIndex++;
    if (this.lineIndex >= p.lines.length) {
      if (this.panelIndex + 1 < this.chapter.panels.length) this.setPanel(this.panelIndex + 1);
      else this.leave();
      return;
    }
    const line = p.lines[this.lineIndex];
    const narr = line.who === 'narrator';
    this.head.setVisible(!narr);
    if (!narr) this.head.setTexture(`head_${line.who}_o`);
    this.nameText.setText(narr ? '' : `${line.name}:`);
    this.speaker = narr ? null : line.who;
    this.full = wrap(line.text, narr ? 30 : 24);
    this.shown = 0;
    this.typeT = 0;
    this.body.setText(''); this.narration.setText('');
    this.target = narr ? this.narration : this.body;
  }

  leave() {
    audio.blip();
    if (this.ending) { this.registry.set('fightIndex', 0); this.scene.start('Title'); }
    else this.scene.start('Intro');
  }

  update(time, delta) {
    this.clock += delta;
    if (controls.justDown('mute')) audio.toggleMute();
    if (!this.chapter) { controls.endFrame(); return; }

    if (this.cardT > 0) {
      this.cardT -= delta;
      if (controls.confirm()) this.cardT = Math.min(this.cardT, 0);
      if (this.cardT <= 0) { this.card.setVisible(false); this.cameras.main.fadeIn(350, 0, 0, 0); }
      controls.endFrame();
      return;
    }

    // City lights flicker over the backdrop.
    if (Math.floor(this.clock / 260) !== this.twinkleStep) {
      this.twinkleStep = Math.floor(this.clock / 260);
      this.twinkles.clear();
      this.twinkles.fillStyle(0xfcf0c0, 1);
      for (let i = 0; i < 5; i++) this.twinkles.fillRect(Phaser.Math.Between(0, W - 1), Phaser.Math.Between(26, 132), 1, 1);
    }

    // Typewriter
    const typing = this.shown < this.full.length;
    if (typing) {
      this.typeT += delta;
      while (this.typeT >= TYPE_MS && this.shown < this.full.length) {
        this.typeT -= TYPE_MS;
        this.shown++;
        if (this.shown % 3 === 0 && this.full[this.shown - 1] !== ' ') audio.type();
      }
      this.target.setText(this.full.slice(0, this.shown));
    }
    // The speaker's head bobs while they talk.
    this.head.y = 194 + (typing && Math.floor(this.clock / 110) % 2 ? -1 : 0);
    this.prompt.setVisible(!typing && Math.floor(this.clock / 350) % 2 === 0);

    if (controls.justDown('punchR')) { this.leave(); controls.endFrame(); return; }
    if (controls.justDown('punchL') || controls.justDown('star')) {
      if (typing) { this.shown = this.full.length; this.target.setText(this.full); }
      else { audio.blip(); this.nextLine(); }
    }
    controls.endFrame();
  }
}
