# Punchup

An original 8-bit style boxing game, built with [Phaser 3](https://phaser.io). You play Mateo Sandoval, a sequined sports anchor fighting his way through the anchor desk, one conference circuit at a time.

This is the first playable prototype: one three-round fight against Tessa Morales, "The Rookie".

## Play

```
npm install
npm run dev
```

Then open the link it prints. `npm run build` makes a single self-contained `dist/index.html` you can host anywhere.

## Controls

| Action | Keyboard |
| --- | --- |
| Left / right punch (body) | Z / X |
| Aim at the head | Hold Up while punching |
| Dodge | Left / Right arrows |
| Block | Hold Down |
| Star uppercut | Enter |
| Pause / mute | Esc / M |

On a phone or tablet, on-screen buttons appear under the game.

## How a fight works

- Every attack has a **tell**. Dodge it and she is wide open: counter, then alternate left and right for a combo.
- Dodging her **hook** or her **Hair Flip** double punch and countering earns a **star**. So does hitting her at the moment her gloves flash white.
- Spend stars on the **star uppercut**. More stars, bigger punch.
- Punches that get blocked drain your **gas**. Run out and Mateo is winded for a moment.
- Three rounds. Win by knockout, TKO (three knockdowns in a round) or the judges' decision.

## Project layout

- `src/data/` — one file per opponent: moves, tells, timings, lines. Tune fighters here.
- `src/fight/` — the player, the opponent state machine and the HUD.
- `src/scenes/` — title, pre-fight intro and the fight itself.
- `src/gfx/` — the ring, bodies and gloves, drawn in code as pixel art.
- `src/audio/` — sound effects and chiptune music, synthesized in the browser.
- `tools/make_assets.py` — turns anchor portraits into pixel art and builds the bitmap font.

## Credits

Characters are fictional AI personas from the Hardwood Bricks anchor desk. The pixel font is rendered from [Press Start 2P](https://fonts.google.com/specimen/Press+Start+2P) by CodeMan38, used under the SIL Open Font License.
