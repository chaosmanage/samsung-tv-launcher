"""Derive single-ink (white + alpha) dock marks from the official app artwork in
assets/icons/dock/*.png, matching CleanFrame's monochrome mark style. Rendered with
CSS mask-image in currentColor, exactly like CleanFrame's SVG marks.
SmartThings (smartthings.svg) is the official Wikimedia Commons vector glyph; Samsung Internet (mono/browser.png) is keyed
from a 1024px render of the official 2025 SVG. Both come from the official Commons
vector logos; JioHotstar (mono/hotstar.png) is keyed from the 3027px official 2025 logo; Sony LIV (sonyliv.svg) is a
clean vector redraw of the liv mark. Only HDMI and ZEE5 are generated here."""
from pathlib import Path
from PIL import Image
import numpy as np
from scipy import ndimage
ICONS = Path(__file__).resolve().parents[1] / 'app/assets/icons'
def make(k, fn, max_x=None):
    im = np.asarray(Image.open(ICONS / f'dock/{k}.png').convert('RGBA')).astype(float)
    r, g, b, a = [im[..., i] for i in range(4)]
    al = np.clip(fn(r, g, b), 0, 1) * (a / 255)
    h, w = al.shape; yy, xx = np.mgrid[0:h, 0:w]; al[(xx < 14) | (yy < 14) | (xx > w - 15) | (yy > h - 15)] = 0
    if max_x:
        al[:250] = 0  # primary 'liv' mark only (the stacked SONY wordmark reads as clutter at dock size)
        al[260:, max_x:] = 0  # drop decorative background swoosh (below the SONY wordmark)
        low = al[260:]; al[260:] = np.maximum(low, ndimage.binary_fill_holes(ndimage.binary_closing(low > 0.5, iterations=4)) * 1.0)
    lab, n = ndimage.label(al > 0.5); sizes = ndimage.sum(np.ones_like(al), lab, range(1, n + 1))
    keep = np.isin(lab, [i + 1 for i, sz in enumerate(sizes) if sz >= 600]); al = al * ndimage.binary_dilation(keep, iterations=2)
    out = np.zeros((h, w, 4), np.uint8); out[..., :3] = 255; out[..., 3] = (al * 255).astype(np.uint8)
    o = Image.fromarray(out, 'RGBA'); o = o.crop(o.getchannel('A').point(lambda x: 255 if x > 40 else 0).getbbox())
    W, H = o.size; S = max(W, H) + 8; c = Image.new('RGBA', (S, S), (255, 255, 255, 0)); c.paste(o, ((S - W) // 2, (S - H) // 2))
    (ICONS / 'mono').mkdir(exist_ok=True); c.resize((256, 256), Image.LANCZOS).save(ICONS / f'mono/{k}.png')
mn = lambda r, g, b: np.minimum(np.minimum(r, g), b)
lum = lambda r, g, b: .3 * r + .59 * g + .11 * b
make('zee5', lambda r, g, b: (mn(r, g, b) - 150) / 40)
make('hdmi', lambda r, g, b: (mn(r, g, b) - 160) / 40)
make('samsunghome', lambda r, g, b: (mn(r, g, b) - 160) / 40)
