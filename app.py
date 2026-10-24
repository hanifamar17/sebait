import random
import re
from pathlib import Path

from flask import Flask, jsonify, redirect, render_template, request, url_for

BASE = Path(__file__).parent
app = Flask(__name__)

# Keluarga warna (terang + gelap ada di static/app.css). Tiap koleksi punya dua pilihan.
THEMES = ["embun", "senja", "lumut", "tanah"]
THEME_BY_SOURCE = {
    "hujan": ["embun", "lumut"],
    "malam": ["senja", "tanah"],
    "jalan-pulang": ["tanah", "senja"],
}

def load_bait() -> list[dict]:
    """bait/*.txt. Satu bait = blok baris, dipisah baris kosong.
    '# Judul'   -> judul koleksi (sumber yang tampil di bawah puisi)
    '— Penulis' -> sumber khusus untuk bait itu (mis. kutipan)
    File berawalan '_' diabaikan."""
    out = []
    for f in sorted((BASE / "bait").glob("*.txt")):
        if f.stem.startswith("_"):
            continue
        title = f.stem
        for block in re.split(r"\n\s*\n", f.read_text(encoding="utf-8-sig").strip()):
            lines, credit = [], None
            for row in (r.strip() for r in block.splitlines()):
                if not row:
                    continue
                if row.startswith("#"):
                    title = row.lstrip("# ").strip()
                elif row.startswith("—"):
                    credit = row.lstrip("— ").strip()
                else:
                    lines.append(row)
            if lines:
                out.append({"key": f.stem, "source": credit or title, "lines": lines})
    return out


BAIT = load_bait()
if not BAIT:
    raise SystemExit(
        f"Tidak ada bait. Taruh file .txt di {BASE / 'bait'} "
        "(contoh: bait/hujan.txt) lalu jalankan ulang."
    )
print(f"{len(BAIT)} bait dimuat dari {BASE / 'bait'}")


def make_poem(seed: int) -> dict:
    rng = random.Random(seed)  # seed sama = bait sama, di restart mana pun
    item = rng.choice(BAIT)
    theme = rng.choice(THEME_BY_SOURCE.get(item["key"], THEMES))
    return {"seed": seed, "source": item["source"], "theme": theme, "lines": item["lines"]}


def new_seed() -> int:
    return random.SystemRandom().randrange(100_000, 1_000_000)


@app.get("/")
def index():
    seed = request.args.get("s", type=int)
    if seed is None or not 0 < seed < 10**9:
        seed = new_seed()
    return render_template("index.html", p=make_poem(seed))


@app.get("/puisi/<int:seed>")
def puisi(seed: int):
    return render_template("puisi.html", p=make_poem(seed))


@app.get("/puisi")
def puisi_random():
    return redirect(url_for("puisi", seed=new_seed()))


@app.get("/api/puisi")
def api_puisi():
    return jsonify(make_poem(new_seed()))


if __name__ == "__main__":
    app.run(debug=True)