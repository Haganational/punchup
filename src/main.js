import Phaser from 'phaser';
import { audio } from './audio/audio.js';
import { W, H } from './constants.js';
import { controls } from './input/controls.js';
import { Boot } from './scenes/Boot.js';
import { Fight } from './scenes/Fight.js';
import { Intro } from './scenes/Intro.js';
import { Story } from './scenes/Story.js';
import { Title } from './scenes/Title.js';

const isTouch = controls.attach();
// Browsers only allow sound after the player presses something.
controls.onFirstInput = () => {
  audio.unlock();
  if (audio.pending) audio.playMusic(audio.pending);
};

// Scale by whole numbers only, so every game pixel stays perfectly square.
function bestZoom() {
  // On a phone, fill the full width (leaving room for the buttons) even when
  // that is not a whole number: a bigger picture matters more than perfect pixels.
  if (isTouch) {
    const z = Math.min(window.innerWidth / W, (window.innerHeight - 170) / H);
    return Math.max(0.5, z >= 2 ? Math.floor(z * 4) / 4 : z);
  }
  const z = Math.min(window.innerWidth / W, window.innerHeight / H);
  return Math.max(1, Math.floor(z));
}

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: W,
  height: H,
  backgroundColor: '#000000',
  render: { pixelArt: true, roundPixels: true, antialias: false },
  scale: { mode: Phaser.Scale.NONE, zoom: bestZoom() },
  audio: { noAudio: true },
  banner: false,
  scene: [Boot, Title, Story, Intro, Fight],
});

window.addEventListener('resize', () => game.scale.setZoom(bestZoom()));
// Handy for debugging from the browser console.
window.__punchup = { game, controls, audio };
