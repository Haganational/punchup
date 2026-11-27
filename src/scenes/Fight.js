import Phaser from 'phaser';
import { audio } from '../audio/audio.js';
import { W, H, TUNE } from '../constants.js';
import tessa from '../data/tessa.js';
import { Hud } from '../fight/Hud.js';
import { Opponent } from '../fight/Opponent.js';
import { Player } from '../fight/Player.js';
import { text, wrap } from '../gfx/text.js';
import { controls } from '../input/controls.js';

// The fight itself. `phase` says what is going on:
//   announce -> fight -> (count) -> fight ... -> roundEnd -> corner -> announce ...
//   and finally -> over (knockout, TKO or judges' decision).
export class Fight extends Phaser.Scene {
  constructor() { super('Fight'); }

  create() {
    this.data_ = tessa;
    this.add.image(0, 0, 'ring').setOrigin(0);
    this.flashes = this.add.group();

    this.opponent = new Opponent(this, this.data_, W / 2, 128);
    this.player = new Player(this, W / 2, 198);
    this.hud = new Hud(this, this.data_.short);

    this.bannerBox = this.add.graphics().setDepth(59);
    this.banner = text(this, W / 2, 96, '', 0xfcfcfc, 0.5, 0.5).setDepth(60).setScale(2);
    this.subBanner = text(this, W / 2, 116, '', 0xf8b800, 0.5, 0.5).setDepth(60);
    this.overlay = this.add.container(0, 0).setDepth(80).setVisible(false);
    this.mashG = this.add.graphics().setDepth(61);

    this.round = 1;
    this.scores = [];          // judges' cards, one entry per finished round
    this.hitstop = 0;
    this.paused = false;
    this.flashT = 0;
    this.startRound();
    audio.playMusic('fight');
  }

  // ---------- round flow ----------
  startRound() {
    this.phase = 'announce';
    this.phaseT = 0;
    this.roundMs = TUNE.roundRealMs;
    this.points = { p: 0, o: 0, pDowns: 0, oDowns: 0 };
    this.player.roundReset();
    this.opponent.roundReset(this.round - 1);
    this.overlay.setVisible(false);
    this.setBanner(`ROUND ${this.round}`, '');
    this.announced = false;
  }

  setBanner(main, sub = '', tint = 0xfcfcfc) {
    this.banner.setText(main).setTint(tint);
    this.subBanner.setText(sub);
    // A dark plate behind the words keeps them readable over the fighters.
    this.bannerBox.clear();
    if (main || sub) {
      const w = Math.max(this.banner.width, this.subBanner.width) + 12;
      this.bannerBox.fillStyle(0x000000, 0.8);
      this.bannerBox.fillRect(Math.round((W - w) / 2), 84, w, sub ? 40 : 24);
    }
  }

  endRound() {
    this.phase = 'roundEnd';
    this.phaseT = 0;
    audio.bell(3);
    this.setBanner('BELL!', '');
    const { p, o, pDowns, oDowns } = this.points;
    // 10-point must system: round winner gets 10, loser 9, minus one per knockdown.
    let ps = 10; let os = 10;
    if (p > o) os = 9; else if (o > p) ps = 9;
    ps = Math.max(7, ps - pDowns);
    os = Math.max(7, os - oDowns);
    this.scores.push({ p: ps, o: os });
  }

  showCorner() {
    this.phase = 'corner';
    this.phaseT = 0;
    this.setBanner('', '');
    const last = this.scores[this.scores.length - 1];
    const o = this.overlay.removeAll(true).setVisible(true);
    const g = this.add.graphics();
    g.fillStyle(0x000000, 0.93); g.fillRect(0, 34, W, H - 34);
    g.fillStyle(0xfcfcfc, 1); g.fillRect(8, 60, W - 16, 1); g.fillRect(8, 168, W - 16, 1);
    o.add(g);
    o.add(text(this, W / 2, 44, `END OF ROUND ${this.round}`, 0xf8b800, 0.5));
    o.add(this.add.image(34, 92, 'head_mount-st-marys'));
    o.add(text(this, 60, 68, 'FATHER GREG:', 0x3cbcfc));
    o.add(text(this, 60, 80, wrap(this.data_.tips[this.round - 1] || 'KEEP YOUR HANDS UP, MY SON.', 23)));
    o.add(text(this, W / 2, 178, 'JUDGES THIS ROUND', 0xbcbcbc, 0.5));
    o.add(text(this, W / 2, 190, `MATEO ${last.p} - ${last.o} ${this.data_.short}`, 0xfcfcfc, 0.5));
    this.cornerPrompt = text(this, W / 2, 216, 'PRESS Z FOR NEXT ROUND', 0xfcfcfc, 0.5);
    o.add(this.cornerPrompt);
  }

  // ---------- events from the fighters ----------
  popup(str, x, y, tint = 0xfcfcfc) {
    const t = text(this, Math.round(x), Math.round(y), str, tint, 0.5, 0.5).setDepth(55);
    const half = t.width / 2;
    t.x = Phaser.Math.Clamp(t.x, half + 2, W - half - 2);
    this.tweens.add({ targets: t, y: y - 14, alpha: 0, duration: 650, ease: 'Quad.easeIn', onComplete: () => t.destroy() });
  }

  spark(x, y, big = false) {
    const s = this.add.image(x, y, 'spark').setDepth(30).setScale(big ? 2 : 1);
    this.time.delayedCall(big ? 160 : 90, () => s.destroy());
  }

  playerPunch(hand, zone) {
    const base = zone === 'head' ? TUNE.punchHead : TUNE.punchBody;
    const result = this.opponent.receivePunch(hand, zone, base);
    const x = W / 2 + (hand === 'L' ? -5 : 5);
    const y = zone === 'head' ? 100 : 140;
    const p = this.player;
    switch (result) {
      case 'blocked':
        audio.block();
        p.spendGas(1);
        break;
      case 'hit':
        audio.hit(); this.spark(x, y); this.points.p += 1;
        break;
      case 'counter':
        audio.hit(); this.spark(x, y); this.points.p += 2; p.gainGas(2);
        this.popup('COUNTER!', W / 2, 74, 0x58f898);
        this.hitstop = 50;
        break;
      case 'star':
        audio.hit(); audio.star(); this.spark(x, y, true); this.points.p += 3; p.gainGas(2);
        p.stars = Math.min(TUNE.maxStars, p.stars + 1);
        this.popup('STAR!', W / 2, 74, 0xf8b800);
        this.hitstop = 70;
        break;
      case 'combo':
        audio.hit(); this.spark(x, y); this.points.p += 2;
        this.popup(`${this.opponent.combo} HITS`, W / 2, 74, 0xfcfcfc);
        break;
      case 'finisher':
        audio.bigHit(); this.spark(x, y, true); this.points.p += 3;
        this.popup('COMBO!', W / 2, 74, 0xf87858);
        this.cameras.main.shake(120, 0.012);
        this.hitstop = 80;
        break;
      default:
        break;
    }
  }

  playerUppercut(stars) {
    const dmg = TUNE.starBase * TUNE.starMult[stars - 1];
    const result = this.opponent.receiveUppercut(dmg);
    if (result === 'hit') {
      audio.bigHit();
      this.spark(W / 2, 96, true);
      this.cameras.main.shake(180, 0.02);
      this.cameras.main.flash(80, 252, 252, 252);
      this.hitstop = 110;
      this.points.p += 4;
      this.popup('STAR UPPERCUT!', W / 2, 70, 0xf8b800);
    } else {
      this.popup('MISSED!', W / 2, 74, 0xbcbcbc);
    }
  }

  playerWasHit(strike) {
    audio.hurt();
    this.points.o += strike.dmg >= 12 ? 3 : 2;
    this.cameras.main.shake(strike.dmg >= 12 ? 160 : 90, strike.dmg >= 12 ? 0.02 : 0.012);
    this.hitstop = 40;
  }

  opponentDown() {
    if (this.phase !== 'fight') return;
    this.opponent.goDown();
    this.points.oDowns++;
    this.beginCount('opponent', this.opponent.getUpPlan());
  }

  playerDown() {
    if (this.phase !== 'fight') return;
    this.player.goDown();
    this.points.pDowns++;
    const n = this.player.kdTotal;
    const canRise = this.player.kdRound < 3 && n <= TUNE.mashNeeded.length;
    this.beginCount('player', canRise ? { need: TUNE.mashNeeded[n - 1], hp: TUNE.playerGetUpHp[n - 1] } : null);
  }

  beginCount(who, plan) {
    this.phase = 'count';
    this.phaseT = 0;
    this.count = { who, plan, n: 0, t: -500, mash: 0, done: false };
    audio.fall();
    audio.crowd();
    this.crowdGoesWild(1500);
    this.cameras.main.shake(200, 0.015);
    this.setBanner('DOWN!', who === 'player' && plan ? 'MASH Z AND X TO GET UP!' : '', 0xf87858);
  }

  crowdGoesWild(ms) { this.flashT = ms; }

  updateCount(dt) {
    const c = this.count;
    if (c.done) return;
    c.t += dt;

    if (c.who === 'player' && c.plan) {
      if (controls.justDown('punchL') || controls.justDown('punchR')) { c.mash++; audio.mash(); }
      if (c.mash >= c.plan.need) {
        c.done = true;
        this.player.getUp(c.plan.hp);
        this.resumeAfterCount();
        return;
      }
    }

    if (c.t >= TUNE.countMs) {
      c.t = 0;
      c.n++;
      audio.count();
      this.setBanner(String(c.n), c.who === 'player' && c.plan ? 'MASH Z AND X TO GET UP!' : '');
      if (c.who === 'opponent' && c.plan && c.n >= c.plan.upAt) {
        c.done = true;
        this.opponent.getUp(c.plan.hp);
        this.resumeAfterCount();
        return;
      }
      if (c.n >= 10) {
        c.done = true;
        const tko = (c.who === 'player' ? this.player.kdRound : this.opponent.kdRound) >= 3;
        this.finish(c.who === 'opponent' ? 'win' : 'lose', tko ? 'TKO' : 'KNOCKOUT');
      }
    }
  }

  resumeAfterCount() {
    this.mashG.clear();
    this.setBanner('FIGHT!', '');
    this.phase = 'resume';
    this.phaseT = 0;
  }

  finish(outcome, how) {
    this.phase = 'over';
    this.phaseT = 0;
    this.outcome = outcome;
    this.mashG.clear();
    audio.stopMusic();
    audio.bell(3);
    audio.fanfare(outcome === 'win');
    if (outcome === 'win') { this.player.celebrate(); audio.crowd(); this.crowdGoesWild(4000); }
    else this.opponent.celebrate();
    this.setBanner(how, outcome === 'win' ? 'MATEO WINS!' : `${this.data_.short} WINS`, outcome === 'win' ? 0xf8b800 : 0xf87858);
    this.finishHow = how;
  }

  showResult() {
    const d = this.data_;
    const win = this.outcome === 'win';
    const o = this.overlay.removeAll(true).setVisible(true);
    const g = this.add.graphics();
    g.fillStyle(0x000000, 0.9); g.fillRect(0, 130, W, 110);
    g.fillStyle(0xfcfcfc, 1); g.fillRect(0, 130, W, 1);
    o.add(g);
    let y = 138;
    if (this.finishHow === 'DECISION') {
      const tp = this.scores.reduce((s, r) => s + r.p, 0);
      const to = this.scores.reduce((s, r) => s + r.o, 0);
      o.add(text(this, W / 2, y, `JUDGES: MATEO ${tp} - ${to} ${d.short}`, 0xbcbcbc, 0.5));
      y += 14;
    }
    o.add(text(this, W / 2, y, `${d.short}:`, 0xf8b800, 0.5));
    o.add(text(this, W / 2, y + 11, win ? d.lines.lose : d.lines.win, 0xfcfcfc, 0.5).setCenterAlign());
    o.add(text(this, W / 2, 206, win ? 'NEXT UP: GARY MERCER' : 'SHAKE IT OFF, MATEO', win ? 0x58f898 : 0x3cbcfc, 0.5));
    o.add(text(this, W / 2, 218, win ? '(COMING SOON)' : '', 0x7c7c7c, 0.5));
    o.add(text(this, W / 2, 229, 'Z REMATCH    X TITLE', 0xfcfcfc, 0.5));
    this.resultShown = true;
  }

  decide() {
    const tp = this.scores.reduce((s, r) => s + r.p, 0);
    const to = this.scores.reduce((s, r) => s + r.o, 0);
    // A draw goes to the challenger's opponent: Mateo has to take it from her.
    this.finish(tp > to ? 'win' : 'lose', 'DECISION');
  }

  // ---------- main loop ----------
  update(time, delta) {
    const dt = Math.min(delta, 50);
    if (controls.justDown('mute')) audio.toggleMute();

    if (controls.justDown('pause') && (this.phase === 'fight' || this.paused)) {
      this.paused = !this.paused;
      this.setBanner(this.paused ? 'PAUSED' : '', '');
    }
    if (this.paused) { controls.endFrame(); return; }

    // A few frozen frames on big hits make them feel heavy.
    if (this.hitstop > 0) { this.hitstop -= dt; return; }

    this.phaseT += dt;
    const fighting = this.phase === 'fight';

    switch (this.phase) {
      case 'announce':
        if (!this.announced && this.phaseT > 900) { this.announced = true; this.setBanner('FIGHT!', ''); audio.bell(1); }
        if (this.phaseT > 1500) { this.phase = 'fight'; this.setBanner('', ''); }
        break;
      case 'fight':
        this.roundMs -= dt;
        if (this.roundMs <= 0) this.endRound();
        break;
      case 'count':
        this.updateCount(dt);
        this.drawMash();
        break;
      case 'resume':
        if (this.phaseT > 600) { this.phase = 'fight'; this.setBanner('', ''); }
        break;
      case 'roundEnd':
        if (this.phaseT > 1400) {
          if (this.round >= TUNE.rounds) this.decide();
          else this.showCorner();
        }
        break;
      case 'corner':
        this.cornerPrompt.setVisible(Math.floor(this.phaseT / 400) % 2 === 0);
        if (this.phaseT > 500 && controls.confirm()) {
          audio.blip();
          // Both fighters catch their breath between rounds.
          const p = this.player; const o = this.opponent;
          p.hp = Math.min(TUNE.playerHp, p.hp + (TUNE.playerHp - p.hp) * 0.3);
          o.hp = Math.min(o.d.hp, o.hp + (o.d.hp - o.hp) * 0.3);
          this.round++;
          this.startRound();
        }
        break;
      case 'over':
        if (!this.resultShown && this.phaseT > 2200) this.showResult();
        if (this.resultShown) {
          if (controls.justDown('punchL') || controls.justDown('star')) { this.resultShown = false; this.scene.restart(); }
          else if (controls.justDown('punchR')) { this.resultShown = false; this.scene.start('Title'); }
        }
        break;
      default:
        break;
    }

    this.player.update(dt, fighting && this.phase === 'fight');
    this.opponent.update(dt, fighting && this.phase === 'fight');
    this.hud.update(dt, this.player, this.opponent, this.round, (this.roundMs / TUNE.roundRealMs) * TUNE.roundClockSecs);
    this.updateFlashes(dt);
    controls.endFrame();
  }

  drawMash() {
    const c = this.count;
    this.mashG.clear();
    if (!c || c.done || c.who !== 'player' || !c.plan) return;
    const w = 100; const x = (W - w) / 2; const y = 130;
    this.mashG.fillStyle(0xfcfcfc, 1); this.mashG.fillRect(x - 1, y - 1, w + 2, 8);
    this.mashG.fillStyle(0x000000, 1); this.mashG.fillRect(x, y, w, 6);
    this.mashG.fillStyle(0x58f898, 1); this.mashG.fillRect(x, y, Math.round(w * Math.min(1, c.mash / c.plan.need)), 6);
  }

  // Camera flashes pop in the crowd, more of them when something big happens.
  updateFlashes(dt) {
    this.flashT = Math.max(0, this.flashT - dt);
    const chance = this.flashT > 0 ? 0.35 : 0.02;
    if (Math.random() < chance) {
      const f = this.add.image(Phaser.Math.Between(4, W - 4), Phaser.Math.Between(40, 82), 'flashbulb').setDepth(1);
      this.time.delayedCall(70, () => f.destroy());
    }
  }
}
