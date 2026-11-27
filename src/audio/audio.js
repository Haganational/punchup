// All sound is synthesized with the Web Audio API: square, triangle and noise
// channels, like an 8-bit console. No audio files.
const midi = (n) => 440 * Math.pow(2, (n - 69) / 12);

const SONGS = {
  title: {
    bpm: 112,
    lead: [
      72, 0, 0, 72, 76, 0, 79, 0, 84, 0, 0, 0, 79, 0, 0, 0,
      77, 0, 0, 77, 81, 0, 84, 0, 83, 0, 0, 0, 79, 0, 0, 0,
      72, 0, 76, 0, 79, 0, 84, 0, 88, 0, 84, 0, 79, 0, 76, 0,
      74, 0, 77, 0, 79, 0, 83, 0, 86, 0, 0, 0, 0, 0, 0, 0,
    ],
    bass: [
      48, 0, 0, 48, 0, 0, 55, 0, 48, 0, 0, 48, 0, 0, 55, 0,
      41, 0, 0, 41, 0, 0, 48, 0, 43, 0, 0, 43, 0, 0, 50, 0,
      45, 0, 0, 45, 0, 0, 52, 0, 45, 0, 0, 45, 0, 0, 52, 0,
      43, 0, 0, 43, 0, 0, 50, 0, 43, 0, 43, 0, 43, 43, 43, 43,
    ],
    drums: 'k...h...s...h...k...h...s...h.h.k...h...s...h...k...h...s.s.ssss',
  },
  story: {
    bpm: 96,
    lead: [
      0, 0, 69, 0, 72, 0, 0, 71, 0, 0, 67, 0, 0, 0, 0, 0,
      0, 0, 69, 0, 72, 0, 0, 76, 0, 0, 74, 0, 72, 0, 0, 0,
      0, 0, 65, 0, 69, 0, 0, 72, 0, 0, 71, 0, 0, 67, 0, 0,
      64, 0, 0, 67, 0, 0, 68, 0, 0, 0, 71, 0, 0, 0, 0, 0,
    ],
    bass: [
      45, 0, 0, 45, 0, 52, 0, 0, 43, 0, 0, 43, 0, 50, 0, 0,
      45, 0, 0, 45, 0, 52, 0, 0, 43, 0, 0, 43, 0, 50, 0, 47,
      41, 0, 0, 41, 0, 48, 0, 0, 43, 0, 0, 43, 0, 50, 0, 0,
      40, 0, 0, 40, 0, 47, 0, 0, 40, 0, 0, 44, 0, 47, 0, 0,
    ],
    drums: 'k..h..h.s..h..h.k..h..h.s..h.h.hk..h..h.s..h..h.k..h..h.s..hs.h.',
  },
  fight: {
    bpm: 152,
    lead: [
      69, 0, 69, 72, 0, 69, 0, 76, 0, 74, 0, 72, 0, 69, 67, 0,
      69, 0, 69, 72, 0, 69, 0, 79, 0, 76, 0, 74, 72, 0, 74, 0,
      65, 0, 65, 69, 0, 72, 0, 77, 0, 76, 0, 72, 0, 69, 65, 0,
      67, 0, 67, 71, 0, 74, 0, 79, 0, 77, 0, 74, 0, 71, 76, 0,
    ],
    bass: [
      45, 0, 45, 0, 57, 0, 45, 0, 45, 0, 45, 0, 57, 0, 45, 0,
      45, 0, 45, 0, 57, 0, 45, 0, 45, 0, 45, 0, 57, 0, 52, 0,
      41, 0, 41, 0, 53, 0, 41, 0, 41, 0, 41, 0, 53, 0, 41, 0,
      43, 0, 43, 0, 55, 0, 43, 0, 43, 0, 43, 0, 55, 0, 47, 0,
    ],
    drums: 'k.h.s.h.k.k.s.h.k.h.s.h.k.k.s.hhk.h.s.h.k.k.s.h.k.h.s.h.k.s.ssss',
  },
};

class AudioEngine {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.song = null;
    this.timer = null;
  }

  unlock() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.5;
      this.master.connect(this.ctx.destination);
      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = 0.45;
      this.musicGain.connect(this.master);
      const len = this.ctx.sampleRate;
      this.noiseBuf = this.ctx.createBuffer(1, len, len);
      const data = this.noiseBuf.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.master) this.master.gain.value = this.muted ? 0 : 0.5;
    return this.muted;
  }

  tone({ type = 'square', f = 440, f2 = null, t = 0.1, v = 0.2, delay = 0, at = null, out = null }) {
    if (!this.ctx) return;
    const t0 = (at ?? this.ctx.currentTime) + delay;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f, t0);
    if (f2) o.frequency.exponentialRampToValueAtTime(Math.max(20, f2), t0 + t);
    g.gain.setValueAtTime(v, t0);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + t);
    o.connect(g).connect(out || this.master);
    o.start(t0);
    o.stop(t0 + t + 0.02);
  }

  noise({ t = 0.1, v = 0.3, fc = 1200, fc2 = null, type = 'lowpass', delay = 0, at = null, out = null }) {
    if (!this.ctx) return;
    const t0 = (at ?? this.ctx.currentTime) + delay;
    const s = this.ctx.createBufferSource();
    s.buffer = this.noiseBuf;
    s.loop = true;
    const f = this.ctx.createBiquadFilter();
    f.type = type;
    f.frequency.setValueAtTime(fc, t0);
    if (fc2) f.frequency.exponentialRampToValueAtTime(fc2, t0 + t);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(v, t0);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + t);
    s.connect(f).connect(g).connect(out || this.master);
    s.start(t0, Math.random() * 0.5);
    s.stop(t0 + t + 0.02);
  }

  // ---- Sound effects ----
  swing() { this.noise({ t: 0.08, v: 0.15, fc: 600, fc2: 2400, type: 'bandpass' }); }
  hit() { this.noise({ t: 0.09, v: 0.5, fc: 1800, fc2: 300 }); this.tone({ type: 'triangle', f: 160, f2: 60, t: 0.1, v: 0.5 }); }
  bigHit() { this.noise({ t: 0.22, v: 0.6, fc: 2400, fc2: 150 }); this.tone({ type: 'triangle', f: 200, f2: 40, t: 0.25, v: 0.7 }); }
  block() { this.tone({ f: 300, f2: 220, t: 0.05, v: 0.15 }); this.noise({ t: 0.04, v: 0.2, fc: 3000, type: 'highpass' }); }
  dodge() { this.noise({ t: 0.14, v: 0.18, fc: 400, fc2: 3000, type: 'bandpass' }); }
  hurt() { this.noise({ t: 0.16, v: 0.55, fc: 900, fc2: 200 }); this.tone({ f: 220, f2: 70, t: 0.18, v: 0.3 }); }
  tell() { this.tone({ f: 660, t: 0.05, v: 0.14 }); this.tone({ f: 880, t: 0.06, v: 0.14, delay: 0.06 }); }
  tellBig() { [523, 659, 784, 1047].forEach((f, i) => this.tone({ f, t: 0.07, v: 0.16, delay: i * 0.06 })); }
  flash() { this.tone({ type: 'triangle', f: 1760, t: 0.05, v: 0.2 }); }
  star() { [784, 988, 1175, 1568].forEach((f, i) => this.tone({ f, t: 0.09, v: 0.2, delay: i * 0.05 })); }
  uppercut() { this.tone({ f: 200, f2: 1600, t: 0.3, v: 0.22 }); }
  winded() { this.tone({ f: 300, f2: 100, t: 0.4, v: 0.2 }); }
  count() { this.tone({ f: 440, t: 0.08, v: 0.2 }); }
  mash() { this.tone({ f: 520, t: 0.03, v: 0.1 }); }
  type() { this.tone({ type: 'square', f: 520, t: 0.02, v: 0.05 }); }
  blip() { this.tone({ f: 990, t: 0.05, v: 0.15 }); }
  bell(n = 1) {
    for (let i = 0; i < n; i++) {
      this.tone({ type: 'triangle', f: 1320, t: 0.5, v: 0.35, delay: i * 0.22 });
      this.tone({ type: 'sine', f: 1980, t: 0.4, v: 0.15, delay: i * 0.22 });
    }
  }
  crowd() { this.noise({ t: 1.2, v: 0.22, fc: 700, fc2: 1500, type: 'bandpass' }); }
  fall() { this.tone({ f: 520, f2: 70, t: 0.7, v: 0.22 }); }
  thud() { this.noise({ t: 0.3, v: 0.7, fc: 260, fc2: 80 }); this.tone({ type: 'triangle', f: 90, f2: 35, t: 0.3, v: 0.7 }); }
  fanfare(win) {
    const notes = win ? [523, 659, 784, 1047, 784, 1047, 1319] : [392, 370, 349, 330, 294, 262, 196];
    notes.forEach((f, i) => this.tone({ f, t: i === notes.length - 1 ? 0.5 : 0.13, v: 0.22, delay: i * 0.13 }));
  }

  // ---- Music: a tiny step sequencer ----
  playMusic(name) {
    this.stopMusic();
    if (!this.ctx || !SONGS[name]) { this.pending = name; return; }
    this.pending = null;
    this.song = SONGS[name];
    this.step = 0;
    this.nextTime = this.ctx.currentTime + 0.05;
    this.timer = setInterval(() => this.schedule(), 40);
  }

  stopMusic() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    this.song = null;
  }

  schedule() {
    const s = this.song;
    if (!s || !this.ctx) return;
    const stepLen = 60 / s.bpm / 4;
    while (this.nextTime < this.ctx.currentTime + 0.15) {
      const i = this.step % s.lead.length;
      const at = this.nextTime;
      const out = this.musicGain;
      if (s.lead[i]) this.tone({ f: midi(s.lead[i]), t: stepLen * 1.6, v: 0.13, at, out });
      if (s.bass[i]) this.tone({ type: 'triangle', f: midi(s.bass[i]), t: stepLen * 1.8, v: 0.3, at, out });
      const d = s.drums[i];
      if (d === 'k') this.tone({ type: 'triangle', f: 150, f2: 45, t: 0.09, v: 0.4, at, out });
      if (d === 's') this.noise({ t: 0.08, v: 0.2, fc: 2500, type: 'highpass', at, out });
      if (d === 'h') this.noise({ t: 0.025, v: 0.08, fc: 6000, type: 'highpass', at, out });
      this.nextTime += stepLen;
      this.step++;
    }
  }
}

export const audio = new AudioEngine();
