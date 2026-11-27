// Mateo: the player's fighter, seen from behind. Reads the controls, runs a
// small state machine, and draws a puppet sprite like the opponent's.
import { audio } from '../audio/audio.js';
import { controls } from '../input/controls.js';
import { TUNE, num, PAL } from '../constants.js';
import { drawArm } from './arms.js';

const POSES = {
  idle: { lx: -22, ly: -6, rx: 22, ry: -6 },
  block: { lx: -8, ly: -16, rx: 8, ry: -16, by: 2 },
  bodyL: { lx: -6, ly: -46, ls: 0.85, rx: 20, ry: -2, bx: 3, by: -4, tilt: 7, z: 0.97 },
  bodyR: { lx: -20, ly: -2, rx: 6, ry: -46, rs: 0.85, bx: -3, by: -4, tilt: -7, z: 0.97 },
  headL: { lx: -4, ly: -76, ls: 0.75, rx: 20, ry: -2, bx: 3, by: -7, tilt: 8, z: 0.95 },
  headR: { lx: -20, ly: -2, rx: 4, ry: -76, rs: 0.75, bx: -3, by: -7, tilt: -8, z: 0.95 },
  dodgeL: { lx: -18, ly: -12, rx: 16, ry: -8, bx: -38, by: 6, tilt: -16 },
  dodgeR: { lx: -16, ly: -8, rx: 18, ry: -12, bx: 38, by: 6, tilt: 16 },
  hit: { lx: -26, ly: 2, rx: 26, ry: 2, by: 7 },
  winded: { lx: -24, ly: 10, rx: 24, ry: 10, by: 4 },
  // Star uppercut: sink and coil, scoop up through the middle, burst, follow through.
  upDip: { lx: -15, ly: -14, rx: 27, ry: 22, rs: 1.05, bx: 5, by: 13, tilt: 13, z: 1.06 },
  upRise: { lx: -19, ly: -4, rx: 13, ry: -26, rs: 0.98, bx: 1, by: 0, tilt: 3, z: 1.0 },
  upStrike: { lx: -23, ly: 4, rx: 1, ry: -88, rs: 0.88, bx: -2, by: -15, tilt: -9, z: 0.94 },
  upFollow: { lx: -25, ly: 6, rx: -9, ry: -72, rs: 0.84, bx: -4, by: -9, tilt: -14, z: 0.96 },
  victory: { lx: -22, ly: -44, rx: 22, ry: -44, by: -2 },
  sprawl: { lx: -32, ly: -22, rx: 32, ry: -18, by: 2 },
  corner: { lx: -20, ly: -6, rx: 20, ry: -6, bx: 78, by: 10 },
};
const BASE = { lx: 0, ly: 0, ls: 1, rx: 0, ry: 0, rs: 1, bx: 0, by: 0, tilt: 0, z: 1 };
const pose = (name) => ({ ...BASE, ...POSES[name] });

const PUNCH_IMPACT = 90;
const PUNCH_TOTAL = 240;
const DODGE_MIN = 340;      // a tap keeps Mateo safe this long
const DODGE_HOLD = 680;     // holding the direction keeps him leaning out this long
const DODGE_RECOVER = 80;   // time to come back to center
const BUFFER_MS = 180;      // a dodge pressed slightly early still comes out

export class Player {
  constructor(scene, x, y) {
    this.scene = scene;
    this.baseX = x;
    this.baseY = y;
    this.c = scene.add.container(x, y).setDepth(20);
    this.body = scene.add.image(0, -1, 'mateo_body').setOrigin(0.5, 0);
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
    this.fall = 0;
    this.fallT = 0;
    this.fallDir = 1;
    this.armStyle = {
      upper: 14, fore: 14, width: 7, upperWidth: 9, sleeveTo: 0,
      skin: 0xd09060, outline: 0x804820, cuff: 0xbcbcbc,
    };
    this.tintT = 0;
    this.fullReset();
  }

  fullReset() {
    this.hp = TUNE.playerHp;
    this.stars = 0;
    this.kdTotal = 0;
    this.roundReset();
  }

  roundReset() {
    this.buffered = null;
    this.gas = TUNE.gasMax;
    this.windedT = 0;
    this.kdRound = 0;
    this.fall = 0;
    this.toIdle();
  }

  get winded() { return this.windedT > 0; }
  setPose(name, rate = 20) { this.target = pose(name); this.rate = rate; }
  toIdle() { this.state = 'idle'; this.t = 0; this.queued = null; }
  dodgeSafe() { return this.state === 'dodge' && this.dodgeEnd == null; }

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
    // Remember a dodge press for a moment, so one pressed a hair early still happens.
    const pressedDodge = controls.justDown('left') ? 'L' : controls.justDown('right') ? 'R' : null;
    if (pressedDodge) this.buffered = { dir: pressedDodge, ms: BUFFER_MS };
    else if (this.buffered) { this.buffered.ms -= dt; if (this.buffered.ms <= 0) this.buffered = null; }
    const wantDodge = this.buffered ? this.buffered.dir : null;
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
        if (wantDodge) { this.startDodge(wantDodge); break; }   // a dodge always beats a punch
        if (this.t >= PUNCH_IMPACT + 50) this.setPose('idle', 22);
        if (this.t >= PUNCH_TOTAL) { const q = this.queued; this.toIdle(); this.queued = q; }
        break;

      case 'dodge': {
        // Weave straight into a dodge the other way.
        if (pressedDodge && pressedDodge !== this.dodgeDir) { this.startDodge(pressedDodge); break; }
        if (wantPunch) this.queued = { hand: wantPunch, zone };
        if (this.dodgeEnd == null) {
          const held = controls.isDown(this.dodgeDir === 'L' ? 'left' : 'right');
          const oppDone = ['open', 'stunned'].includes(this.scene.opponent.state);
          const counterNow = this.queued && oppDone && this.t >= 140;
          if (counterNow || this.t >= DODGE_HOLD || (this.t >= DODGE_MIN && !held)) {
            this.dodgeEnd = this.t;
            this.setPose('idle', 26);
            if (counterNow) { const q = this.queued; this.startPunch(q.hand, q.zone); break; }
          }
        } else if (this.t >= this.dodgeEnd + DODGE_RECOVER) {
          const q = this.queued; this.toIdle(); this.queued = q;
        }
        break;
      }

      case 'hit':
        if (this.t >= 220 && wantDodge) { this.startDodge(wantDodge); break; }
        if (this.t >= 340) this.toIdle();
        break;

      case 'uppercut':
        // Each beat blends into the next, so the arm travels one continuous arc.
        if (this.upStep === 0 && this.t >= 190) { this.upStep = 1; this.setPose('upRise', 30); }
        if (this.upStep === 1 && this.t >= 262) { this.upStep = 2; this.setPose('upStrike', 44); }
        if (!this.resolved && this.t >= 300) {
          this.resolved = true;
          this.scene.playerUppercut(this.starsSpent);
          if (this.state !== 'uppercut') break;
        }
        if (this.upStep === 2 && this.t >= 400) { this.upStep = 3; this.setPose('upFollow', 11); }
        if (this.upStep === 3 && this.t >= 540) { this.upStep = 4; this.setPose('idle', 10); }
        if (this.t >= 720) this.toIdle();
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
    this.buffered = null;
    this.dodgeDir = dir;
    this.dodgeEnd = null;
    this.setPose('dodge' + dir, 34);
    audio.dodge();
  }

  startUppercut() {
    this.state = 'uppercut';
    this.t = 0;
    this.resolved = false;
    this.starsSpent = this.stars;
    this.stars = 0;
    this.upStep = 0;
    this.setPose('upDip', 17);
    audio.uppercut();
  }

  // Called by the opponent when a punch arrives. Returns 'dodged' | 'blocked' | 'hit'.
  takeHit(strike) {
    if (this.state === 'down') return 'dodged';
    if (this.dodgeSafe()) {
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
    this.setPose('sprawl', 14);
    this.fallT = 0;
    this.landed_ = false;
    this.fallDir = Math.random() < 0.5 ? -1 : 1;
  }

  getUp(hpFraction) {
    this.hp = Math.round(TUNE.playerHp * hpFraction);
    this.gas = Math.round(TUNE.gasMax / 2);
    this.toIdle();
  }

  celebrate() { this.state = 'victory'; this.setPose('victory', 12); }

  // Step aside to a neutral corner while the opponent takes a count.
  toCorner() { this.state = 'corner'; this.t = 0; this.setPose('corner', 6); }
  fromCorner() { if (this.state === 'corner') this.toIdle(); }

  // ---------- drawing ----------
  animate(dt) {
    const k = 1 - Math.exp((-dt / 1000) * this.rate);
    for (const key of Object.keys(BASE)) this.cur[key] += (this.target[key] - this.cur[key]) * k;
    if (this.tintT > 0) { this.tintT -= dt; if (this.tintT <= 0) { this.body.clearTint(); this.head.clearTint(); } }

    // Knockdown: stagger, then topple back toward the camera and bounce.
    let stagger = 0; let bounceY = 0;
    if (this.state === 'down') {
      this.fallT += dt;
      const t = this.fallT;
      if (t < 280) stagger = Math.sin(t / 36) * 5;
      const u = Math.min(1, Math.max(0, (t - 280) / 420));
      this.fall = u * u;
      if (u >= 1 && !this.landed_) { this.landed_ = true; this.scene.thud(this.baseX, this.baseY + 30); }
      if (t > 700 && t < 920) bounceY = -5 * Math.sin((Math.PI * (t - 700)) / 220);
    } else if (this.fall > 0) {
      this.fall = Math.max(0, this.fall - dt / 400);
    }
    const f = this.fall;

    const idle = this.state === 'idle' || this.state === 'corner';
    const idleBob = idle ? Math.round(Math.sin(this.clock / 140) * 1.2) : 0;
    const pant = this.winded ? Math.round(Math.sin(this.clock / 60) * 1.5) : 0;
    let bounce = this.state === 'victory' ? -Math.abs(Math.sin(this.clock / 130)) * 6 : 0;
    // The uppercut lifts him off his toes at the top of the swing.
    if (this.state === 'uppercut' && this.t > 240 && this.t < 520) bounce = -7 * Math.sin((Math.PI * (this.t - 240)) / 280);
    const sway = idle ? Math.sin(this.clock / 190) * 1.5 : 0;
    const c = this.cur;
    this.c.setAngle(c.tilt * (1 - f) + this.fallDir * 80 * f + stagger);
    this.c.setScale(c.z);
    this.c.setPosition(
      Math.round(this.baseX + c.bx + this.fallDir * 14 * f),
      Math.round(this.baseY + c.by + idleBob + pant + bounce + f * 34 + bounceY),
    );
    const lx = c.lx; const ly = c.ly + sway;
    const rx = c.rx; const ry = c.ry - sway;
    this.gl.setPosition(Math.round(lx), Math.round(ly)).setScale(c.ls);
    this.gr.setPosition(Math.round(rx), Math.round(ry)).setScale(c.rs);

    // Motion trail on a punch.
    const upper = this.state === 'uppercut' && this.t > 180 && this.t < 430;
    if (this.state === 'punch' || upper) {
      this.ghostT = (this.ghostT || 0) - dt;
      if (this.ghostT <= 0 && (upper || this.t < 150)) {
        this.ghostT = upper ? 16 : 24;
        if (upper) this.scene.aura('twinkle', this.c.x + this.gr.x + Math.random() * 10 - 5, this.c.y + this.gr.y + Math.random() * 10 - 5, true, 21);
        const lead = upper ? this.gr : c.ly < c.ry ? this.gl : this.gr;
        this.scene.ghost('glove_mateo', this.c.x + lead.x, this.c.y + lead.y, lead.scale, lead.flipX, 19);
      }
    }

    this.arms.clear();
    drawArm(this.arms, -19, 6, lx, ly + 3, -1, this.armStyle, c.ls);
    drawArm(this.arms, 19, 6, rx, ry + 3, 1, this.armStyle, c.rs);

    // Sequins: a few pixels twinkle on the bodysuit.
    this.sparkT -= dt;
    if (this.sparkT <= 0) {
      this.sparkT = 140;
      this.sparkle.clear();
      this.sparkle.fillStyle(0xfcfcfc, 1);
      for (let i = 0; i < 5; i++) {
        this.sparkle.fillRect(-12 + Math.floor(Math.random() * 24), 33 + Math.floor(Math.random() * 11), 1, 1);
      }
    }
    const blue = this.winded && Math.floor(this.clock / 120) % 2 === 0;
    if (this.tintT <= 0) { if (blue) this.body.setTint(0x9cbcfc); else this.body.clearTint(); }
  }
}
