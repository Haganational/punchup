// The fight card, in order. The current fight is kept in the game registry.
import gary from './gary.js';
import hannah from './hannah.js';
import ray from './ray.js';
import tessa from './tessa.js';
import trevor from './trevor.js';

export const ROSTER = [tessa, gary, hannah, ray, trevor];
export const currentFight = (scene) => Math.min(ROSTER.length - 1, scene.registry.get('fightIndex') || 0);
// Progress survives a reload when the browser allows storage.
export function loadProgress() {
  try { return { fight: Number(localStorage.getItem('punchup_fight')) || 0, champ: localStorage.getItem('punchup_champ') === '1' }; }
  catch (e) { return { fight: 0, champ: false }; }
}
export function saveProgress(fight, champ) {
  try {
    localStorage.setItem('punchup_fight', String(fight));
    if (champ) localStorage.setItem('punchup_champ', '1');
  } catch (e) { /* storage is optional */ }
}
export const currentOpponent = (scene) => ROSTER[currentFight(scene)];
