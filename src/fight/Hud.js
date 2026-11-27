// The score bug across the top of the screen: names, health, stars, gas, clock.
import { W, TUNE } from '../constants.js';
import { text } from '../gfx/text.js';

const BAR_W = 92;

export class Hud {
  constructor(scene, opponentName) {
    this.scene = scene;
    this.g = scene.add.graphics().setDepth(50);
    text(scene, 4, 3, 'MATEO').setDepth(51);
    text(scene, W - 4, 3, opponentName, 0xfcfcfc, 1).setDepth(51);
    this.roundText = text(scene, W / 2, 3, 'R1', 0xf8b800, 0.5).setDepth(51);
    this.clockText = text(scene, W / 2, 13, '2:00', 0xfcfcfc, 0.5).setDepth(51);
    text(scene, 40, 24, 'GAS', 0x3cbcfc).setDepth(51);
    this.stars = [0, 1, 2].map((i) => scene.add.image(8 + i * 11, 28, 'star_off').setDepth(51));
    this.kd = text(scene, W - 4, 24, '', 0xf87858, 1).setDepth(51);
    this.shownP = 1;
    this.shownO = 1;
  }

  update(dt, player, opponent, round, clockSecs) {
    // Health bars drain smoothly toward the real value.
    const pf = player.hp / TUNE.playerHp;
    const of = opponent.hp / opponent.d.hp;
    const k = 1 - Math.exp((-dt / 1000) * 10);
    this.shownP += (pf - this.shownP) * k;
    this.shownO += (of - this.shownO) * k;

    const g = this.g;
    g.clear();
    g.fillStyle(0x000000, 1);
    g.fillRect(0, 0, W, 34);
    this.bar(4, 13, this.shownP, pf, false);
    this.bar(W - 4 - BAR_W, 13, this.shownO, of, true);

    // Gas meter
    g.fillStyle(0x7c7c7c, 1); g.fillRect(66, 25, 30, 6);
    g.fillStyle(0x000000, 1); g.fillRect(67, 26, 28, 4);
    const gasFrac = player.winded ? 0 : player.gas / TUNE.gasMax;
    g.fillStyle(gasFrac > 0.3 ? 0x3cbcfc : 0xf83800, 1);
    g.fillRect(67, 26, Math.round(28 * gasFrac), 4);

    this.stars.forEach((s, i) => s.setTexture(i < player.stars ? 'star' : 'star_off'));
    this.roundText.setText(`ROUND ${round}`);
    const secs = Math.max(0, Math.ceil(clockSecs));
    this.clockText.setText(`${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`);
    this.kd.setText(opponent.kdTotal ? `DOWNS ${opponent.kdTotal}` : '');
  }

  bar(x, y, shown, real, rightAligned) {
    const g = this.g;
    g.fillStyle(0xfcfcfc, 1); g.fillRect(x - 1, y - 1, BAR_W + 2, 9);
    g.fillStyle(0x000000, 1); g.fillRect(x, y, BAR_W, 7);
    const wShown = Math.round(BAR_W * Math.max(0, shown));
    const wReal = Math.round(BAR_W * Math.max(0, real));
    const color = real > 0.5 ? 0x00b800 : real > 0.25 ? 0xf8b800 : 0xe40058;
    // The white sliver shows damage just taken.
    g.fillStyle(0xfcfcfc, 1);
    g.fillRect(rightAligned ? x + BAR_W - wShown : x, y, wShown, 7);
    g.fillStyle(color, 1);
    g.fillRect(rightAligned ? x + BAR_W - wReal : x, y, Math.min(wReal, wShown), 7);
  }
}
