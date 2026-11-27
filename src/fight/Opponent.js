// The opponent: a state machine driven by the fighter's data file, plus a
// puppet-style sprite (head, torso, legs, two gloves) that moves between poses.
import { audio } from '../audio/audio.js';
import { num } from '../constants.js';
import { drawArm } from './arms.js';

// Glove positions (lx,ly / rx,ry), glove scale (ls / rs), head and body offsets.
// "L" is the glove on the left side of the screen.
const POSES = {
  guardHigh: { lx: -16, ly: -13, rx: 16, ry: -13 },
  guardLow: { lx: -14, ly: 12, rx: 14, ry: 12 },
  blockHigh: { lx: -8, ly: -18, rx: 8, ry: -18 },
  blockLow: { lx: -8, ly: 10, rx: 8, ry: 10 },
  cockL: { lx: -34, ly: -20, rx: 14, ry: -10, bx: -4, by: -2, tilt: -5, z: 0.96 },
  cockR: { lx: -14, ly: -10, rx: 34, ry: -20, bx: 4, by: -2, tilt: 5, z: 0.96 },
  windR: { lx: -12, ly: -12, rx: 44, ry: -2, rs: 1.15, bx: 7, hx: 2, tilt: 9, z: 0.96 },
  flip: { lx: -30, ly: 6, rx: 30, ry: 6, hy: -4, by: -3, z: 0.95 },
  strikeL: { lx: -6, ly: 38, ls: 2.3, rx: 17, ry: -6, bx: 3, by: 6, hy: 3, tilt: 6, z: 1.1 },
  strikeR: { lx: -17, ly: -6, rx: 6, ry: 38, rs: 2.3, bx: -3, by: 6, hy: 3, tilt: -6, z: 1.1 },
  hookR: { lx: -14, ly: -10, rx: -12, ry: 34, rs: 2.5, bx: -6, by: 6, hy: 3, tilt: -10, z: 1.1 },
  open: { lx: -27, ly: 22, rx: 27, ry: 24, hy: 5, by: 4, z: 1.04 },
  stunned: { lx: -24, ly: 28, rx: 24, ry: 28, hy: 2 },
  sidestep: { lx: -16, ly: -13, rx: 16, ry: -13, bx: 30, tilt: 8 },
  sprawl: { lx: -34, ly: -30, rx: 34, ry: -26, hy: -5 },
  victory: { lx: -24, ly: -50, rx: 24, ry: -50, hy: -2 },
};
const BASE = { lx: 0, ly: 0, ls: 1, rx: 0, ry: 0, rs: 1, hx: 0, hy: 0, bx: 0, by: 0, tilt: 0, z: 1 };
const pose = (name) => ({ ...BASE, ...POSES[name] });

export class Opponent {
  constructor(scene, data, x, y) {
    this.scene = scene;
    this.d = data;
    this.baseX = x;
    this.baseY = y;
    const key = data.key;

    this.c = scene.add.container(x, y).setDepth(10);
    // The legs texture is cut into trunks and two separate legs so the feet can
    // stagger into a real boxing stance and bounce independently.
    const legsTex = scene.textures.get(`legs_${key}`);
    if (!legsTex.has('trunks')) {
      legsTex.add('trunks', 0, 0, 0, 42, 20);
      legsTex.add('legL', 0, 0, 19, 21, 25);
      legsTex.add('legR', 0, 21, 19, 21, 25);
    }
    this.legL = scene.add.image(-21, 51, `legs_${key}`, 'legL').setOrigin(0, 0);
    this.legR = scene.add.image(0, 51, `legs_${key}`, 'legR').setOrigin(0, 0);
    this.trunks = scene.add.image(-21, 32, `legs_${key}`, 'trunks').setOrigin(0, 0);
    this.stance = Math.random() < 0.5 ? -1 : 1;   // +1: the glove on screen-right leads
    this.st = this.stance;                        // smoothed stance, for fluid switches
    this.sw = 1;                                  // how much of the stance shows right now
    this.stanceT = 3000;
    this.torso = scene.add.image(0, -10, `torso_${key}`).setOrigin(0.5, 0);
    this.head = scene.add.image(0, -3, `head_${key}_o`).setOrigin(0.5, 1);
    this.arms = scene.add.graphics();
    this.gl = scene.add.image(0, 0, `glove_${key}`);
    this.gr = scene.add.image(0, 0, `glove_${key}`).setFlipX(true);
    // Stars that circle her head when she is dazed.
    this.dizzy = [0, 1, 2].map(() => scene.add.image(0, 0, 'dizzy').setVisible(false));
    this.padL = scene.add.image(-23, 0, `pad_${key}`);
    this.padR = scene.add.image(23, 0, `pad_${key}`).setFlipX(true);
    this.auraT = 0;
    this.c.add([this.legL, this.legR, this.trunks, this.torso, this.arms, this.padL, this.padR, this.head, ...this.dizzy, this.gl, this.gr]);
    this.ghostT = 0;

    this.cur = pose('guardHigh');
    this.target = pose('guardHigh');
    this.rate = 14;
    this.kick = { hx: 0, hy: 0, by: 0 };
    this.fall = 0;       // 0 = standing, 1 = flat on the canvas
    this.fallT = 0;
    this.fallDir = 1;
    this.armStyle = {
      upper: 15, fore: 15, width: 7, upperWidth: 10,
      skin: num(data.colors.skin), outline: num(data.colors.skinDark),
      sleeve: num(data.colors.shirt), sleeveOutline: num(data.colors.shirtDark), sleeveTo: data.colors.body ? 0 : 0.5,
    };
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
    this.fall = 0;
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
    // Jabs always come from the lead hand, so the stance tells you which side.
    const leadJab = this.stance > 0 ? 'jabR' : 'jabL';
    if (this.quickNext) return leadJab;
    const w = { ...this.round.weights };
    if (this.hp / this.d.hp < 0.4 && w.signature != null) w.signature += 2;
    if (this.lastMove === 'signature') w.signature = 0;
    const total = Object.values(w).reduce((s, v) => s + v, 0);
    let roll = Math.random() * total;
    for (const [name, weight] of Object.entries(w)) {
      roll -= weight;
      if (roll <= 0) return name === 'jabL' || name === 'jabR' ? leadJab : name;
    }
    return leadJab;
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
        // Now and then, hop and switch between orthodox and southpaw.
        this.stanceT -= dt;
        if (this.stanceT <= 0) {
          const [sa, sb] = this.d.stanceSwitchMs || [2400, 5200];
          this.stanceT = sa + Math.random() * (sb - sa);
          this.stance = -this.stance;
          this.kick.by = -5;
        }
        this.idleT -= dt;
        if (this.idleT <= 0) this.startMove(this.chooseMove());
        break;

      case 'tell': {
        const flashing = this.flashWindow();
        if (flashing && !this.flashOn) audio.flash();
        this.flashOn = flashing;
        this.setGloveFlash(flashing);
        if (this.move.headFlip) this.head.setFlipX(Math.floor(this.t / 110) % 2 === 1);
        if (this.t >= this.tellDur) {
          this.state = 'strike';
          this.t = 0;
          this.head.setFlipX(false);
          this.setGloveFlash(false);
          this.strikes = this.move.strikes.map((s) => ({ ...s, launched: false, resolved: false }));
          this.landed = 0; this.blocked = 0;
          // A feint: pull the punch, wait a beat, then throw the real one.
          if (this.move.feint) { this.setPose(this.guard === 'high' ? 'guardHigh' : 'guardLow', 20); this.scene.popup('FEINT!', this.baseX, this.baseY - 62, 0xbcbcbc); }
        }
        break;
      }

      case 'strike': {
        for (const s of this.strikes) {
          if (!s.launched && this.t >= s.at) {
            s.launched = true;
            this.setPose(s.hook ? 'hookR' : s.hand === 'L' ? 'strikeL' : 'strikeR', 24);
            audio.swing();
          }
          if (!s.resolved && this.t >= s.at + 170) {
            s.resolved = true;
            const result = player.takeHit(s);
            if (result === 'hit') this.landed++;
            else if (result === 'blocked') this.blocked++;
            // pull the glove back a little between multi-hit strikes
            this.setPose('guardHigh', 10);
          }
        }
        const last = this.strikes[this.strikes.length - 1];
        if (last.resolved && this.t >= last.at + 300) {
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
    this.ohT = 320;
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
    this.setPose('sprawl', 14);
    this.fallT = 0;
    this.landed_ = false;
    this.fallDir = this.kick.hx >= 0 ? 1 : -1;
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

    // Knockdown: stagger for a beat, topple over like a felled tree, bounce once.
    let stagger = 0; let bounceY = 0;
    if (this.state === 'down') {
      this.fallT += dt;
      const t = this.fallT;
      if (t < 300) stagger = Math.sin(t / 38) * 5;
      const u = Math.min(1, Math.max(0, (t - 300) / 460));
      this.fall = u * u;
      if (u >= 1 && !this.landed_) { this.landed_ = true; this.scene.thud(this.baseX + this.fallDir * 30, this.baseY + 62); }
      if (t > 760 && t < 1000) bounceY = -6 * Math.sin((Math.PI * (t - 760)) / 240);
    } else if (this.fall > 0) {
      this.fall = Math.max(0, this.fall - dt / 450);   // climbing back up
    }
    const f = this.fall;

    const idle = this.state === 'idle';
    const bob = idle || this.state === 'tell' ? Math.round(Math.sin(this.clock / 170) * 1.5) : 0;
    const wobble = this.state === 'stunned' ? Math.sin(this.clock / 45) * 3 : 0;
    const bounce = this.state === 'victory' ? -Math.abs(Math.sin(this.clock / 140)) * 5 : 0;
    // Little signs of life: gloves drift in the guard and tremble during a wind-up.
    const sway = idle ? Math.sin(this.clock / 230) * 1.5 : 0;
    const shake = this.state === 'tell' ? Math.sin(this.clock / 22) * 1 : 0;
    const nod = this.state === 'tell' && this.move && this.move.nod ? Math.round(Math.abs(Math.sin(this.t / 90)) * 4) : 0;
    const c = this.cur;

    // Stance: lead glove out front and low, rear glove tucked by the chin, body
    // turned, feet staggered. It fades out while punching and comes back after.
    const sk = 1 - Math.exp((-dt / 1000) * 9);
    this.st += (this.stance - this.st) * sk;
    const guardish = ['idle', 'chip', 'recover', 'sidestep'].includes(this.state) ? 1 : this.state === 'tell' ? 0.45 : 0;
    this.sw += (guardish - this.sw) * sk;
    const s = this.st * this.sw;
    const light = idle || this.state === 'tell';
    const step = Math.sin(this.clock / 150);
    const shuffle = Math.sin(this.clock / 720) * 5 * this.sw * (1 - f);
    this.legR.setPosition(Math.round(1.5 * s), Math.round(51 + 3 * s + (light ? Math.min(0, step) * 2 : 0))).setScale(1 + 0.07 * s);
    this.legL.setPosition(Math.round(-21 + 1.5 * s - 21 * (-0.07 * s)), Math.round(51 - 3 * s + (light ? Math.min(0, -step) * 2 : 0))).setScale(1 - 0.07 * s);
    this.trunks.x = Math.round(-21 + s);

    const angle = (c.tilt + 2.5 * s) * (1 - f) + this.fallDir * 86 * f + stagger;
    const hop = -12 * Math.sin(Math.PI * Math.min(1, f * 1.4)) * (f < 0.72 ? 1 : 0);
    this.c.setAngle(angle);
    this.c.setScale(c.z * (1 - 0.1 * f));
    this.c.setPosition(
      Math.round(this.baseX + c.bx * (1 - f) + shuffle + this.fallDir * 6 * f),
      Math.round(this.baseY + c.by + this.kick.by + bob + bounce + f * 44 + hop + bounceY),
    );
    this.head.setPosition(Math.round(c.hx + this.kick.hx + wobble + 1.5 * s), Math.round(-3 + c.hy + this.kick.hy + nod));
    const lx = c.lx + shake + 4 * s; const ly = c.ly + sway - 5 * s;
    const rx = c.rx - shake + 4 * s; const ry = c.ry - sway + 5 * s;
    this.gl.setPosition(Math.round(lx), Math.round(ly)).setScale(c.ls * (1 - 0.12 * s));
    this.gr.setPosition(Math.round(rx), Math.round(ry)).setScale(c.rs * (1 + 0.12 * s));
    // The glove closer to the camera draws on top.
    this.c.bringToTop(this.gl.scale >= this.gr.scale ? this.gl : this.gr);

    // The "OH!" face shows for a beat after every hit, and while dazed or down.
    if (this.ohT > 0) this.ohT -= dt;
    if (this.d.colors.face) {
      const oh = this.ohT > 0 || this.state === 'stunned' || this.state === 'down';
      const want = `head_${this.d.key}${oh ? '_hit' : ''}_o`;
      if (this.head.texture.key !== want) this.head.setTexture(want);
    }
    // Dazed: stars orbit her head. Hurt: her face flushes red.
    const dazed = this.state === 'stunned' || (this.state === 'down' && this.landed_);
    this.dizzy.forEach((d, i) => {
      const a = this.clock / 160 + (i * Math.PI * 2) / 3;
      d.setVisible(dazed).setPosition(Math.round(this.head.x + Math.cos(a) * 15), Math.round(this.head.y - 40 + Math.sin(a) * 4));
    });
    if (this.tintT <= 0) {
      if (this.hp / this.d.hp < 0.35 && this.state !== 'victory') this.head.setTint(0xfca0a0);
      else this.head.clearTint();
    }
    // Motion trail behind a glove that is flying at the camera.
    if (this.state === 'strike') {
      this.ghostT -= dt;
      if (this.ghostT <= 0) {
        this.ghostT = 28;
        const lead = c.ls >= c.rs ? this.gl : this.gr;
        if (lead.scale > 1.15) this.scene.ghost(lead.texture.key, this.c.x + lead.x * c.z, this.c.y + lead.y * c.z, lead.scale * c.z, lead.flipX, 11);
      }
    }

    // Aura: quiet in the guard, wild while a punch is charging or flying.
    if (this.d.aura && this.state !== 'down' && this.state !== 'stunned') {
      const hot = this.state === 'tell' || this.state === 'strike';
      this.auraT -= dt;
      if (this.auraT <= 0) {
        this.auraT = hot ? (this.move && this.move.announce ? 28 : 55) : 260;
        const glove = Math.random() < 0.5 ? this.gl : this.gr;
        const r = 7 * glove.scale + (hot ? 4 : 1);
        this.scene.aura(this.d.aura, this.c.x + (glove.x + (Math.random() * 2 - 1) * r) * c.z, this.c.y + (glove.y + (Math.random() * 2 - 1) * r) * c.z, hot);
      }
    }

    this.arms.clear();
    drawArm(this.arms, -21, 1, lx, ly, -1, this.armStyle, c.ls);
    drawArm(this.arms, 21, 1, rx, ry, 1, this.armStyle, c.rs);
  }
}
