#!/usr/bin/env python3
"""Build Punchup's pixel-art assets.

- Pulls anchor portraits and face crops from the public Hardwood Bricks repo
  (Haganational/mac-26-27) and converts them to low-res pixel art.
- Renders the Press Start 2P font (SIL Open Font License) into an 8x8 bitmap
  font sheet for Phaser's RetroFont.

Usage:  python3 tools/make_assets.py [anchor-key ...]
Needs:  pip install pillow fonttools   and   npm install --no-save @fontsource/press-start-2p
"""
import io
import sys
import urllib.request
from pathlib import Path

from PIL import Image, ImageFont

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "src" / "assets"
RAW = "https://raw.githubusercontent.com/Haganational/mac-26-27/main/anchors"

# Anchors used so far: the hero, the first opponent, and the cornerman.
DEFAULT_KEYS = ["new-mexico", "toledo", "mount-st-marys"]

HEAD_SIZE = 40           # in-ring head sprite, pixels square
PORTRAIT_SIZE = (72, 129)  # intro / cutscene portrait
COLORS = 20              # colors per sprite: a little more than an NES, on purpose


def fetch(url):
    with urllib.request.urlopen(url, timeout=30) as r:
        return Image.open(io.BytesIO(r.read())).convert("RGBA")


def pixelate(img, size, colors=COLORS):
    """Downscale, snap alpha to on/off, and reduce to a small palette."""
    small = img.resize(size, Image.LANCZOS)
    alpha = small.getchannel("A").point(lambda a: 255 if a >= 128 else 0)
    rgb = Image.new("RGB", size, (0, 0, 0))
    rgb.paste(small.convert("RGB"), mask=alpha)
    quant = rgb.quantize(colors=colors, method=Image.MEDIANCUT, dither=Image.NONE)
    out = quant.convert("RGBA")
    out.putalpha(alpha)
    return out


def build_anchor(key):
    head = pixelate(fetch(f"{RAW}/heads/{key}.webp"), (HEAD_SIZE, HEAD_SIZE))
    head.save(OUT / "heads" / f"{key}.png")
    portrait = pixelate(fetch(f"{RAW}/{key}.webp"), PORTRAIT_SIZE, colors=28)
    portrait.save(OUT / "portraits" / f"{key}.png")
    print("anchor", key)


def build_font():
    from fontTools.ttLib import TTFont

    src = ROOT / "node_modules/@fontsource/press-start-2p/files/press-start-2p-latin-400-normal.woff"
    tt = TTFont(src)
    tt.flavor = None
    buf = io.BytesIO()
    tt.save(buf)
    buf.seek(0)
    font = ImageFont.truetype(buf, 8)
    chars = [chr(c) for c in range(32, 127)]
    cols = 16
    rows = (len(chars) + cols - 1) // cols
    sheet = Image.new("RGBA", (cols * 8, rows * 8), (0, 0, 0, 0))
    for i, ch in enumerate(chars):
        cell = Image.new("L", (8, 8), 0)
        from PIL import ImageDraw

        d = ImageDraw.Draw(cell)
        d.fontmode = "1"  # no anti-aliasing: crisp pixels
        d.text((0, 0), ch, font=font, fill=255)
        white = Image.new("RGBA", (8, 8), (255, 255, 255, 255))
        white.putalpha(cell.point(lambda v: 255 if v > 127 else 0))
        sheet.paste(white, ((i % cols) * 8, (i // cols) * 8))
    sheet.save(OUT / "fonts" / "font8.png")
    print("font", sheet.size)


if __name__ == "__main__":
    for sub in ("heads", "portraits", "fonts"):
        (OUT / sub).mkdir(parents=True, exist_ok=True)
    keys = sys.argv[1:] or DEFAULT_KEYS
    for k in keys:
        build_anchor(k)
    build_font()
