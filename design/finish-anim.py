# Joins frames from frames.mjs into looping animated WebPs in ../assets/v2.
# Usage: python design/finish-anim.py <framesRoot> <fps>
# Light/dark parts are flattened onto GitHub's page colour; the CTA keeps its transparent corners.
import glob, os, sys
from PIL import Image

root, fps = sys.argv[1], int(sys.argv[2])
out = os.path.join(os.path.dirname(__file__), "..", "assets", "v2")
for d in sorted(glob.glob(os.path.join(root, "*"))):
    name = os.path.basename(d)
    frames = []
    for f in sorted(glob.glob(os.path.join(d, "*.png"))):
        im = Image.open(f).convert("RGBA")
        if name.endswith("-light") or name.endswith("-dark"):
            bg = (255, 255, 255, 255) if name.endswith("-light") else (13, 17, 23, 255)
            flat = Image.new("RGBA", im.size, bg)
            flat.alpha_composite(im)
            im = flat.convert("RGB")
        frames.append(im)
    target = os.path.join(out, name + ".webp")
    frames[0].save(target, save_all=True, append_images=frames[1:], duration=round(1000 / fps), loop=0, quality=72, method=4, minimize_size=True, kmax=24)
    print(name, len(frames), "frames", os.path.getsize(target) // 1024, "KB")
