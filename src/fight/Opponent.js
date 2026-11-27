// The opponent: a state machine driven by the fighter's data file, plus a
// puppet-style sprite (head, torso, legs, two gloves) that moves between poses.
import { audio } from '../audio/audio.js';
import { num } from '../constants.js';

// Glove positions (lx,ly / rx,ry), glove scale (ls / rs), head and body offsets.
// "L" is the glove on the left side of the screen.
const POSES = {
  guardHigh: { lx: -16, ly: -13, rx: 16, ry: -13 },
  guardLow: { lx: -14, ly: 12, rx: 14, ry: 12 },
  blockHigh: { lx: -8, ly: -18, rx: 8, ry: -18 },
  blockLow: { lx: -8, ly: 10, rx: 8, ry: 10 },
  cockL: { lx: -32, ly: -24, rx: 14, ry: -10, bx: -3 },
  cockR: { lx: -14, ly: -10, rx: 32, ry: -24, bx: 3 },
  windR: { lx: -12, ly: -12, rx: 42, ry: -4, rs: 1.15, bx: 5, hx: 2 },
  flip: { lx: -28, ly: 8, rx: 28, ry: 8, hy: -4, by: -2 },
  strikeL: { lx: -8, ly: 40, ls: 2.3, rx: 16, ry: -8, by: 4, hy: 3 },
  strikeR: { lx: -16, ly: -8, rx: 8, ry: 40, rs: 2.3, by: 4, hy: 3 },
  hookR: { lx: -14, ly: -10, rx: -10, ry: 36, rs: 2.5, bx: -4, by: 4, hy: 3 },
  open: { lx: -26, ly: 24, rx: 26, ry: 24, hy: 4, by: 2 },
  stunned: { lx: -24, ly: 28, rx: 24, ry: 28, hy: 2 },
  sidestep: { lx: -16, ly: -13, rx: 16, ry: -13, bx: 30 },
  victory: { lx: -24, ly: -50, rx: 24, ry: -50, hy: -2 },
};
const BASE = { lx: 0, ly: 0, ls: 1, rx: 0, ry: 0, rs: 1, hx: 0, hy: 0, bx: 0, by: 0 };
const pose = (name) => ({ ...BASE, ...POSES[name] });

export class Opponent {
  constructor(scene, data, x, y) {
    this.scene = scene;
    this.d = data;
    this.baseX = x;
    this.baseY = y;
    const key = data.key;

    this.c = scene.add.container(x, y).setDepth(10);
    this.legs = scene.add.image(0, 32, `legs_${key}`).setOrigin(0.5, 0);
    this.torso = scene.add.image(0, -10, `torso_${key}`).setOrigin(0.5, 0);
    this.head = scene.add.image(0, -4, `head_${key}`).setOrigin(0.5, 1);
    this.arms = scene.add.graphics();
    this.gl = scene.add.image(0, 0, `glove_${key}`);
    this.gr = scene.add.image(0, 0, `glove_${key}`).setFlipX(true);
    this.c.add([this.legs, this.torso, this.arms, this.head, this.gl, this.gr]);

    this.cur = pose('guardHigh');
    this.target = pose('guardHigh');
    this.rate = 14;
    this.kick = { hx: 0, hy: 0, by: 0 };
    this.sink = 0;       // 0 = standing, 1 = flat on the canvas
    this.clock = 0;
    this.fullReset();
  }

  fullReset() {
    this.hp = this.d.hp;
    this.kdTotal = 0;
    this.roundReset(0);
  }

  roundReset(roundIndex) {
    this.round = this.d.rounds[Math.min(roundIndex, this.d.rounds.length - 1)];
    this.kdRound = 0;
    this.sink = 0;
    this.lastMove = null;
    this.head.setFlipX(false);
    this.setGloveFlash(false);
    this.enterIdle();
  }

  // ---------- state changes ----------
  setPose(name, rate = 14) { this.target = pose(name); this.rate = rate; }

  enterIdle(quick = false) {
    this.state = 'idle';
    this.t = 0;
    this.move = null;
    this.combo = 0;
    this.idleHits = 0;
    this.blockShow = 0;
    this.quickNext = quick;
    const [a, b] = this.round.idle;
    this.idleT = quick ? 260 : a + Math.random() * (b - a);
    this.guard = Math.random() < this.d.highGuardChance ? 'high' : 'low';
    this.resetGuardTimer();
    this.clearTint();
  }

  resetGuardTimer() {
    const [a, b] = this.d.guardSwitchMs;
    this.guardT = a + Math.random() * (b - a);
  }

  chooseMove() {
    if (this.quickNext) return Math.random() < 0.5 ? 'jabL' : 'jabR';
    const w = { ...this.round.weights };
    if (this.hp / this.d.hp < 0.4) w.signature += 2;
    if (this.lastMove === 'signature') w.signature = 0;
    const total = Object.values(w).reduce((s, v) => s + v, 0);
    let roll = Math.random() * total;
    for (const [name, weight] of Object.entries(w)) {
      roll -= weight;
      if (roll <= 0) return name;
    }
    return 'jabL';
  }

  startMove(name) {
    this.moveName = name;
    this.lastMove = name;
    this.move = this.d.moves[name];
    this.tellScale = this.round.tellScale * (this.quickNext ? 0.62 : 1) * (this.hp / this.d.hp < 0.35 ? 0.9 : 1);
    this.tellDur = this.move.tell * this.tellScale;
    this.state = 'tell';
    this.t = 0;
    this.flashOn = false;
    this.quickNext = false;
    this.setPose(this.move.tellPose, 16);
    audio[this.move.cue]();
    if (this.move.announce) this.scene.popup(this.move.label, this.baseX, this.baseY - 62, 0xf8b800);
  }

  flashWindow() {
    const f = this.move && this.move.flash;
    if (!f || this.state !== 'tell') return false;
    const a = f.at * this.tellScale;
    return this.t >= a && this.t <= a + f.len;
  }

  // ---------- per-frame ----------
  update(dt, fighting) {
    this.clock += dt;
    if (fighting) this.think(dt);
    this.animate(dt);
  }

  think(dt) {
    const player = this.scene.player;
    this.t += dt;
    switch (this.state) {
      case 'idle':
        this.guardT -= dt;
        if (this.guardT <= 0) { this.guard = this.guard === 'high' ? 'low' : 'high'; this.resetGuardTimer(); }
        if (this.blockShow > 0) this.blockShow -= dt;
        else this.setPose(this.guard === 'high' ? 'guardHigh' : 'guardLow', 12);
        this.idleT -= dt;
        if (this.idleT <= 0) this.startMove(this.chooseMove());
        break;

      case 'tell': {
        const flashing = this.flashWindow();
        if (flashing && !this.flashOn) audio.flash();
        this.flashOn = flashing;
        this.setGloveFlash(flashing);
        if (this.moveName === 'signature') this.head.setFlipX(Math.floor(this.t / 110) % 2 === 1);
        if (this.t >= this.tellDur) {
          this.state = 'strike';
          this.t = 0;
          this.head.setFlipX(false);
          this.setGloveFlash(false);
          this.strikes = this.move.strikes.map((s) => ({ ...s, launched: false, resolved: false }));
          this.landed = 0; this.blocked = 0;
        }
        break;
      }

      case 'strike': {
        for (const s of this.strikes) {
          if (!s.launched && this.t >= s.at) {
            s.launched = true;
            this.setPose(s.hook ? 'hookR' : s.hand === 'L' ? 'strikeL' : 'strikeR', 34);
            audio.swing();
          }
          if (!s.resolved && this.t >= s.at + 120) {
            s.resolved = true;
            const result = player.takeHit(s);
            if (result === 'hit') this.landed++;
            else if (result === 'blocked') this.blocked++;
            // pull the glove back a little between multi-hit strikes
            this.setPose('guardHigh', 10);
          }
        }
        const last = this.strikes[this.strikes.length - 1];
        if (last.resolved && this.t >= last.at + 260) {
          if (this.scene.phase !== 'fight') { this.enterRecover(400); break; }
          if (this.landed > 0) {
            this.enterRecover(520);
            if (Math.random() < 0.35) this.scene.popup(this.d.lines.taunt, this.baseX, this.baseY - 62, 0xfcfcfc);
          } else if (this.blocked > 0) {
            this.enterRecover(360);
          } else {
            this.state = 'open';
            this.t = 0;
            this.openDur = this.move.openMiss;
            this.setPose('open', 14);
          }
        }
        break;
      }

      case 'open':
        if (this.t >= this.openDur) this.enterIdle();
        break;

      case 'stunned':
        this.stunT -= dt;
        if (this.stunT <= 0) this.enterRecover(380);
        break;

      case 'chip':
        if (this.t >= 200) {
          const hits = this.idleHits;
          const guard = this.guard;
          this.enterIdle(hits >= 2);
          this.idleHits = hits;
          this.guard = guard;
        }
        break;

      case 'recover':
        if (this.t >= this.recoverDur) this.enterIdle();
        break;

      case 'sidestep':
        if (this.t >= 380) this.enterIdle(true);
        break;

      default:
        break;
    }
  }

  enterRecover(ms) {
    this.state = 'recover';
    this.t = 0;
    this.recoverDur = ms;
    this.combo = 0;
    this.setPose('blockHigh', 16);
  }

  // ---------- getting punched ----------
  // Returns what happened: 'blocked' | 'hit' | 'counter' | 'star' | 'combo' | 'finisher'
  receivePunch(hand, zone, base) {
    const d = this.d;
    switch (this.state) {
      case 'idle':
      case 'chip': {
        const guarded = (this.guard === 'high') === (zone === 'head');
        if (guarded) {
          this.setPose(zone === 'head' ? 'blockHigh' : 'blockLow', 30);
          this.blockShow = 160;
          return 'blocked';
        }
        this.damage(base * d.chipScale, zone, hand);
        if (this.state === 'down') return 'hit';
        this.state = 'chip';
        this.t = 0;
        this.idleHits++;
        this.guard = zone === 'head' ? 'high' : 'low';
        return 'hit';
      }
      case 'tell': {
        const f = this.move.flash;
        if (this.flashWindow() && f.zone === zone) {
          this.head.setFlipX(false);
          this.setGloveFlash(false);
          this.beginStun(hand, 1);
          this.damage(base * 1.5, zone, hand);
          return 'star';
        }
        return 'blocked';
      }
      case 'open': {
        const starMove = !!this.move.star;
        this.openBonus = zone === 'body' && this.move.bodyBonus ? this.move.bodyBonus : 1;
        this.beginStun(hand, this.openBonus);
        this.damage(base * this.openBonus, zone, hand);
        return starMove ? 'star' : 'counter';
      }
      case 'stunned': {
        if (hand !== this.lastHand && this.combo < d.maxCombo) {
          this.combo++;
          this.lastHand = hand;
          this.stunT = d.stunMs;
          let dmg = (base + 0.5 * (this.combo - 1)) * (zone === 'body' ? this.openBonus : 1);
          const finisher = this.combo === d.maxCombo;
          if (finisher) { dmg += 4; this.stunT = 160; }
          this.damage(dmg, zone, hand);
          return finisher ? 'finisher' : 'combo';
        }
        this.stunT = Math.min(this.stunT, 120);
        this.damage(base, zone, hand);
        return 'hit';
      }
      default:
        return 'blocked';
    }
  }

  beginStun(hand, bonus) {
    this.state = 'stunned';
    this.t = 0;
    this.combo = 1;
    this.lastHand = hand;
    this.openBonus = bonus;
    this.stunT = this.d.stunMs + 80;
    this.setPose('stunned', 18);
  }

  // Returns 'hit' or 'dodged'.
  receiveUppercut(dmg) {
    if (this.state === 'strike' || this.state === 'recover' || this.state === 'sidestep') return 'dodged';
    if (this.state === 'idle' && Math.random() < this.d.starDodge) {
      this.state = 'sidestep';
      this.t = 0;
      this.setPose('sidestep', 26);
      return 'dodged';
    }
    this.head.setFlipX(false);
    this.setGloveFlash(false);
    this.kick.hy = -12;
    this.kick.by = -6;
    this.enterRecover(650);
    this.setPose('stunned', 18);
    this.damage(dmg, 'head', 'R');
    return 'hit';
  }

  damage(amount, zone, hand) {
    this.hp = Math.max(0, this.hp - amount);
    const dir = hand === 'L' ? 1 : -1;
    if (zone === 'head') { this.kick.hx = 6 * dir; this.kick.hy = Math.min(this.kick.hy, -3); }
    else { this.kick.by = -4; this.kick.hy = 3; }
    this.tintT = 90;
    (zone === 'head' ? this.head : this.torso).setTintFill(0xfcfcfc);
    if (this.hp <= 0) this.scene.opponentDown();
  }

  clearTint() { this.head.clearTint(); this.torso.clearTint(); this.tintT = 0; }

  setGloveFlash(on) {
    if (on) { this.gl.setTintFill(0xfcfcfc); this.gr.setTintFill(0xfcfcfc); }
    else { this.gl.clearTint(); this.gr.clearTint(); }
  }

  // ---------- knockdowns ----------
  goDown() {
    this.state = 'down';
    this.t = 0;
    this.kdTotal++;
    this.kdRound++;
    this.head.setFlipX(false);
    this.setGloveFlash(false);
    this.setPose('stunned', 10);
  }

  // null means she stays down for the full count.
  getUpPlan() {
    if (this.kdRound >= 3) return null;
    return this.d.knockdowns[this.kdTotal - 1] || null;
  }

  getUp(hpFraction) {
    this.hp = Math.round(this.d.hp * hpFraction);
    this.enterRecover(700);
  }

  celebrate() {
    this.state = 'victory';
    this.head.setFlipX(false);
    this.setGloveFlash(false);
    this.clearTint();
    this.setPose('victory', 10);
  }

  // ---------- drawing ----------
  animate(dt) {
    const k = 1 - Math.exp((-dt / 1000) * this.rate);
    for (const key of Object.keys(BASE)) this.cur[key] += (this.target[key] - this.cur[key]) * k;

    // hit recoil eases back to zero
    const decay = Math.exp((-dt / 1000) * 12);
    this.kick.hx *= decay; this.kick.hy *= decay; this.kick.by *= decay;
    if (this.tintT > 0) { this.tintT -= dt; if (this.tintT <= 0) { this.head.clearTint(); this.torso.clearTint(); } }

    // dropping to the canvas and getting back up
    const sinkTarget = this.state === 'down' ? 1 : 0;
    this.sink += (sinkTarget - this.sink) * (1 - Math.exp((-dt / 1000) * 7));

    const bob = this.state === 'idle' || this.state === 'tell' ? Math.round(Math.sin(this.clock / 170) * 1.5) : 0;
    const wobble = this.state === 'stunned' ? Math.sin(this.clock / 45) * 3 : 0;
    const bounce = this.state === 'victory' ? -Math.abs(Math.sin(this.clock / 140)) * 5 : 0;
    const c = this.cur;
    const bx = c.bx; const by = c.by + this.kick.by + bob;

    this.c.setPosition(Math.round(this.baseX + bx), Math.round(this.baseY + by + this.sink * 46 + bounce));
    this.c.setScale(1, 1 - 0.7 * this.sink);
    this.head.setPosition(Math.round(c.hx + this.kick.hx + wobble), Math.round(-4 + c.hy + this.kick.hy));
    this.gl.setPosition(Math.round(c.lx), Math.round(c.ly)).setScale(c.ls);
    this.gr.setPosition(Math.round(c.rx), Math.round(c.ry)).setScale(c.rs);
    // The glove closer to the camera draws on top.
    this.c.bringToTop(c.ls >= c.rs ? this.gl : this.gr);

    const skin = num(this.d.colors.skin);
    this.arms.clear();
    this.arms.lineStyle(6, skin, 1);
    this.arms.lineBetween(-21, 2, Math.round(c.lx), Math.round(c.ly));
    this.arms.lineBetween(21, 2, Math.round(c.rx), Math.round(c.ry));
  }
}
