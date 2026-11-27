// The fight card, in order. The current fight is kept in the game registry.
import gary from './gary.js';
import hannah from './hannah.js';
import tessa from './tessa.js';

export const ROSTER = [tessa, gary, hannah];
export const currentFight = (scene) => Math.min(ROSTER.length - 1, scene.registry.get('fightIndex') || 0);
export const currentOpponent = (scene) => ROSTER[currentFight(scene)];
