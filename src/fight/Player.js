// Mateo: the player's fighter, seen from behind. Reads the controls, runs a
// small state machine, and draws a puppet sprite like the opponent's.
import { audio } from '../audio/audio.js';
import { controls } from '../input/controls.js';
import { TUNE, num, PAL } from '../constants.js';

const POSES = {
  idle: { lx: -22, ly: -6, rx: 22, ry: -6 },
  block: { lx: -8, ly: -16, rx: 8, ry: -16, by: 2 },
  bodyL: { lx: -6, ly: -46, ls: 0.85, rx: 22, ry: -4, by: -3 },
  bodyR: { lx: -22, ly: -4, rx: 6, ry: -46, rs: 0.85, by: -3 },
  headL: { lx: -4, ly: -76, ls: 0.75, rx: 22, ry: -4, by: -5 },
  headR: { lx: -22, ly: -4, rx: 4, ry: -76, rs: 0.75, by: -5 },
  dodgeL: { lx: -20, ly: -2, rx: 20, ry: -2, bx: -34, by: 4 },
  dodgeR: { lx: -20, ly: -2, rx: 20, ry: -2, bx: 34, by: 4 },
  hit: { lx: -26, ly: 2, rx: 26, ry: 2, by: 7 },
  winded: { lx: -24, ly: 10, rx: 24, ry: 10, by: 4 },
  upWind: { lx: -20, ly: -8, rx: 28, ry: 16, by: 8 },
  upStrike: { lx: -20, ly: -6, rx: 2, ry: -84, rs: 0.9, by: -10 },
  victory: { lx: -22, ly: -44, rx: 22, ry: -44, by: -2 },
};
const BASE = { lx: 0, ly: 0, ls: 1, rx: 0, ry: 0, rs: 1, bx: 0, by: 0 };
const pose = (name) => ({ ...BASE, ...POSES[name] });

const PUNCH_IMPACT = 90;
const PUNCH_TOTAL = 240;
const DODGE_SAFE = 300;
const DODGE_TOTAL = 400;

export class Player {
  constructor(scene, x, y) {
    this.scene = scene;
    this.baseX = x;
    this.baseY = y;
    this.c = scene.add.container(x, y).setDepth(20);
    this.body = scene.add.image(0, 0, 'mateo_body').setOrigin(0.5, 0);
    this.head = scene.add.image(0, -17, 'mateo_head').setOrigin(0.5, 0);
    this.arms = scene.add.graphics();
    this.sparkle = scene.add.graphics();
    this.gl = scene.add.image(0, 0, 'glove_mateo');
    this.gr = scene.add.image(0, 0, 'glove_mateo').setFlipX(true);
    this.c.add([this.arms, this.body, this.sparkle, this.head, this.gl, this.gr]);
    this.cur = pose('idle');
    this.target = pose('idle');
    this.rate = 20;
    this.clock = 0;
    this.sparkT = 0;
    this.tintT = 0;
    this.sink = 0;
    this.fullReset();
  }

  fullReset() {
    this.hp = TUNE.playerHp;
    this.stars = 0;
    this.kdTotal = 0;
    this.roundReset();
  }

  roundReset() {
    this.gas = TUNE.gasMax;
    this.windedT = 0;
    this.kdRound = 0;
    this.sink = 0;
    this.toIdle();
  }

  get winded() { return this.windedT > 0; }
  setPose(name, rate = 20) { this.target = pose(name); this.rate = rate; }
  toIdle() { this.state = 'idle'; this.t = 0; this.queued = null; }

  spendGas(n) {
    if (this.winded) return;
    this.gas = Math.max(0, this.gas - n);
    if (this.gas === 0) {
      this.windedT = TUNE.windedMs;
      audio.winded();
      this.scene.popup('WINDED!', this.baseX, this.baseY - 40, 0x3cbcfc);
    }
  }

  gainGas(n) { if (!this.winded) this.gas = Math.min(TUNE.gasMax, this.gas + n); }

  // ---------- per-frame ----------
  update(dt, fighting) {
    this.clock += dt;
    if (fighting) this.think(dt);
    this.animate(dt);
  }

  think(dt) {
    this.t += dt;
    if (this.windedT > 0) {
      this.windedT -= dt;
      if (this.windedT <= 0) { this.windedT = 0; this.gas = Math.round(TUNE.gasMax / 2); }
    }
    const wantDodge = controls.justDown('left') ? 'L' : controls.justDown('right') ? 'R' : null;
    const wantPunch = controls.justDown('punchL') ? 'L' : controls.justDown('punchR') ? 'R' : null;
    const zone = controls.isDown('up') ? 'head' : 'body';

    switch (this.state) {
      case 'idle':
        if (wantDodge) this.startDodge(wantDodge);
        else if (controls.isDown('down')) { this.state = 'block'; this.t = 0; }
        else if (!this.winded && controls.justDown('star') && this.stars > 0) this.startUppercut();
        else if (!this.winded && (wantPunch || this.queued)) {
          const q = wantPunch ? { hand: wantPunch, zone } : this.queued;
          this.startPunch(q.hand, q.zone);
        } else this.setPose(this.winded ? 'winded' : 'idle', 16);
        break;

      case 'block':
        this.setPose('block', 26);
        if (wantDodge) this.startDodge(wantDodge);
        else if (!controls.isDown('down')) this.toIdle();
        break;

      case 'punch':
        if (!this.resolved && this.t >= PUNCH_IMPACT) {
          this.resolved = true;
          this.scene.playerPunch(this.hand, this.zone);
          if (this.state !== 'punch') break;
        }
        if (wantPunch) this.queued = { hand: wantPunch, zone };
        if (this.resolved && wantDodge) { this.startDodge(wantDodge); break; }
        if (this.t >= PUNCH_IMPACT + 50) this.setPose('idle', 22);
        if (this.t >= PUNCH_TOTAL) { const q = this.queued; this.toIdle(); this.queued = q; }
        break;

      case 'dodge':
        if (this.t >= DODGE_SAFE) this.setPose('idle', 18);
        if (this.t >= DODGE_TOTAL) this.toIdle();
        break;

      case 'hit':
        if (this.t >= 380) this.toIdle();
        break;

      case 'uppercut':
        if (!this.resolved && this.t >= 300) {
          this.resolved = true;
          this.setPose('upStrike', 36);
          this.scene.playerUppercut(this.starsSpent);
          if (this.state !== 'uppercut') break;
        }
        if (this.t >= 660) this.toIdle();
        break;

      default:
        break;
    }
  }

  startPunch(hand, zone) {
    this.state = 'punch';
    this.t = 0;
    this.hand = hand;
    this.zone = zone;
    this.resolved = false;
    this.queued = null;
    this.setPose((zone === 'head' ? 'head' : 'body') + hand, 38);
    audio.swing();
  }

  startDodge(dir) {
    this.state = 'dodge';
    this.t = 0;
    this.queued = null;
    this.setPose('dodge' + dir, 30);
    audio.dodge();
  }

  startUppercut() {
    this.state = 'uppercut';
    this.t = 0;
    this.resolved = false;
    this.starsSpent = this.stars;
    this.stars = 0;
    this.setPose('upWind', 22);
    audio.uppercut();
  }

  // Called by the opponent when a punch arrives. Returns 'dodged' | 'blocked' | 'hit'.
  takeHit(strike) {
    if (this.state === 'down') return 'dodged';
    if (this.state === 'dodge' && this.t < DODGE_SAFE) {
      this.scene.popup('DODGE!', this.baseX, this.baseY - 44, 0x58f898);
      return 'dodged';
    }
    if (this.state === 'block' && strike.blockable) {
      this.hp = Math.max(1, this.hp - strike.dmg * 0.2);
      this.spendGas(1);
      audio.block();
      this.scene.popup('BLOCK', this.baseX, this.baseY - 44, 0xbcbcbc);
      return 'blocked';
    }
    this.hp = Math.max(0, this.hp - strike.dmg);
    this.stars = Math.max(0, this.stars - 1);
    this.state = 'hit';
    this.t = 0;
    this.queued = null;
    this.setPose('hit', 30);
    this.tintT = 110;
    this.body.setTintFill(0xfcfcfc);
    this.head.setTintFill(0xfcfcfc);
    this.scene.playerWasHit(strike);
    this.spendGas(3);
    if (this.hp <= 0) this.scene.playerDown();
    return 'hit';
  }

  goDown() {
    this.state = 'down';
    this.t = 0;
    this.kdTotal++;
    this.kdRound++;
    this.windedT = 0;
    this.setPose('hit', 10);
  }

  getUp(hpFraction) {
    this.hp = Math.round(TUNE.playerHp * hpFraction);
    this.gas = Math.round(TUNE.gasMax / 2);
    this.toIdle();
  }

  celebrate() { this.state = 'victory'; this.setPose('victory', 12); }

  // ---------- drawing ----------
  animate(dt) {
    const k = 1 - Math.exp((-dt / 1000) * this.rate);
    for (const key of Object.keys(BASE)) this.cur[key] += (this.target[key] - this.cur[key]) * k;
    if (this.tintT > 0) { this.tintT -= dt; if (this.tintT <= 0) { this.body.clearTint(); this.head.clearTint(); } }

    const sinkTarget = this.state === 'down' ? 1 : 0;
    this.sink += (sinkTarget - this.sink) * (1 - Math.exp((-dt / 1000) * 7));

    const idleBob = this.state === 'idle' ? Math.round(Math.sin(this.clock / 140) * 1.2) : 0;
    const pant = this.winded ? Math.round(Math.sin(this.clock / 60) * 1.5) : 0;
    const bounce = this.state === 'victory' ? -Math.abs(Math.sin(this.clock / 130)) * 6 : 0;
    const c = this.cur;
    this.c.setPosition(
      Math.round(this.baseX + c.bx),
      Math.round(this.baseY + c.by + idleBob + pant + bounce + this.sink * 56),
    );
    this.gl.setPosition(Math.round(c.lx), Math.round(c.ly)).setScale(c.ls);
    this.gr.setPosition(Math.round(c.rx), Math.round(c.ry)).setScale(c.rs);

    const sleeve = num(PAL.cherry);
    this.arms.clear();
    this.arms.lineStyle(6, sleeve, 1);
    this.arms.lineBetween(-16, 6, Math.round(c.lx), Math.round(c.ly) + 4);
    this.arms.lineBetween(16, 6, Math.round(c.rx), Math.round(c.ry) + 4);

    // Sequins: a few pixels twinkle on the bodysuit.
    this.sparkT -= dt;
    if (this.sparkT <= 0) {
      this.sparkT = 140;
      this.sparkle.clear();
      this.sparkle.fillStyle(0xfcfcfc, 1);
      for (let i = 0; i < 5; i++) {
        this.sparkle.fillRect(-14 + Math.floor(Math.random() * 28), 3 + Math.floor(Math.random() * 38), 1, 1);
      }
    }
    const blue = this.winded && Math.floor(this.clock / 120) % 2 === 0;
    if (this.tintT <= 0) { if (blue) this.body.setTint(0x9cbcfc); else this.body.clearTint(); }
  }
}
