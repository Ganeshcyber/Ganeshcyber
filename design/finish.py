# Run after render.mjs: trims the buttons, flattens themed cards onto GitHub's page colour as JPEG, shrinks the CTA.
from PIL import Image
import glob, os

os.chdir(os.path.join(os.path.dirname(__file__), "..", "assets", "v2"))
for f in glob.glob("*.png"):
    im = Image.open(f).convert("RGBA")
    if f.startswith("btn-"):
        im.crop(im.getchannel("A").getbbox()).save(f, optimize=True)
    elif f == "cta.png":
        im.quantize(256, method=Image.Quantize.FASTOCTREE).save(f, optimize=True)
    else:
        bg = (255, 255, 255, 255) if f.endswith("-light.png") else (13, 17, 23, 255)
        flat = Image.new("RGBA", im.size, bg)
        flat.alpha_composite(im)
        flat.convert("RGB").save(f[:-4] + ".jpg", quality=86, optimize=True, progressive=True)
        os.remove(f)
