import base64
import json
import random
import re
import zlib
from pathlib import Path

from flask import Flask, abort, jsonify, redirect, render_template, request, url_for

BASE = Path(__file__).parent
app = Flask(__name__)

SITE_NAME = "Sebait"  # tampil sebagai kredit di halaman dan kartu story
app.config["MAX_CONTENT_LENGTH"] = 16 * 1024  # form kecil; tolak body besar

# Keluarga warna (terang + gelap ada di static/app.css). Tiap koleksi punya dua pilihan.
THEMES = ["embun", "senja", "lumut", "tanah"]
THEME_BY_SOURCE = {
    "hujan": ["embun", "lumut"],
    "malam": ["senja", "tanah"],
    "jalan-pulang": ["tanah", "senja"],
}

# Batas tulis bait sendiri. Ubah di sini.
# Kartu story mengecilkan huruf otomatis kalau teks panjang, jadi aman sampai ratusan karakter.
MAX_CHARS = 160   # jumlah karakter (Enter tidak dihitung)
MAX_LINES = 8     # jumlah baris
MARK = "_"        # penanda gaya: _kata_ = miring berwarna (tidak dihitung sebagai karakter)
MARK_MAX = 24     # jumlah tanda


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


# ---- bait tulisan pengguna -------------------------------------------------
# Tidak disimpan di server: bait + sumber dikodekan ke dalam URL (base64url JSON),
# jadi link bisa dibagikan dan halaman story digambar ulang dari link itu.

SOURCE_MAX = 40


def validate_bait(text: str) -> tuple[list[str], str | None]:
    """Bersihkan lalu validasi. Balik (baris, pesan_error | None).
    MARK membungkus teks miring berwarna: 'aku _rindu_ kamu'. Tanda tidak dihitung."""
    text = (text or "").replace("\r\n", "\n").replace("\r", "\n")
    text = re.sub(r"[\x00-\x08\x0b-\x1f\x7f]", "", text)  # buang karakter kontrol
    lines = [re.sub(r"\s+", " ", l).strip() for l in text.split("\n")]
    lines = [l for l in lines if l.replace(MARK, "").strip()]  # buang baris kosong / hanya tanda
    total = sum(len(l.replace(MARK, "")) for l in lines)
    if not lines:
        return lines, "Tulis dulu minimal satu baris."
    if total < 3:
        return lines, "Terlalu pendek."
    if len(lines) > MAX_LINES:
        return lines, f"Maksimal {MAX_LINES} baris."
    if sum(l.count(MARK) for l in lines) > MARK_MAX:
        return lines, f"Terlalu banyak tanda {MARK}, maksimal {MARK_MAX}."
    if total > MAX_CHARS:
        return lines, f"Terlalu panjang: {total} dari {MAX_CHARS} karakter."
    return lines, None


def style_runs(line: str) -> list[dict]:
    """'aku _rindu_ kamu' -> [{aku, em:F}, {rindu, em:T}, {kamu, em:F}]. Tanda dihitung per baris."""
    return [{"t": t, "em": i % 2 == 1} for i, t in enumerate(line.split(MARK)) if t]


def validate_source(text: str) -> tuple[str, str | None]:
    """Sumber opsional, satu baris. Kosong = tidak ditampilkan."""
    s = re.sub(r"[\x00-\x1f\x7f]", " ", text or "")
    s = re.sub(r"\s+", " ", s).strip()
    if len(s) > SOURCE_MAX:
        return s, f"Sumber maksimal {SOURCE_MAX} karakter."
    return s, None


def encode_bait(lines: list[str], source: str = "", theme: str = "") -> str:
    payload = {"l": lines, "s": source}
    if theme in THEMES:
        payload["c"] = theme
    raw = json.dumps(payload, ensure_ascii=False, separators=(",", ":"))
    return base64.urlsafe_b64encode(raw.encode("utf-8")).decode("ascii").rstrip("=")


def decode_bait(token: str) -> tuple[list[str], str, str] | None:
    if not token or len(token) > 1600:
        return None
    try:
        data = json.loads(base64.urlsafe_b64decode(token + "=" * (-len(token) % 4)).decode("utf-8"))
        text, src, theme = "\n".join(data["l"]), data.get("s", ""), data.get("c", "")
    except (ValueError, UnicodeDecodeError, KeyError, TypeError):
        return None
    lines, err = validate_bait(text)
    source, serr = validate_source(src if isinstance(src, str) else "")
    return None if err or serr else (lines, source, theme if theme in THEMES else "")


def make_custom(token: str) -> dict | None:
    res = decode_bait(token)
    if res is None:
        return None
    lines, source, theme = res
    h = zlib.crc32(token.encode("ascii", "ignore"))
    poem = {
        "seed": 100_000 + h % 900_000,  # hanya untuk nama file PNG
        "token": token,
        "source": source,
        "theme": theme or THEMES[h % len(THEMES)],  # pilihan pengguna, atau acak dari isi
        "lines": lines,
    }
    # semua teks lurus dan tebal; penulis sendiri yang memilih bagian miring berwarna
    poem["markup"] = True
    poem["runs"] = [style_runs(l) for l in lines]
    return poem


def with_links(p: dict) -> dict:
    """Tautan 'jadikan story' dan 'kembali', sesuai jenis puisi (acak / tulisan sendiri)."""
    p["site"] = SITE_NAME
    if p.get("token"):
        p["story"] = url_for("puisi_custom", token=p["token"])
        p["back"] = url_for("tulis", t=p["token"])  # kembali ke form, terisi
        p["edit"] = p["back"]
    else:
        p["story"] = url_for("puisi", seed=p["seed"])
        p["back"] = url_for("index", s=p["seed"])
        p["edit"] = url_for("tulis")
    return p


# ---- route -----------------------------------------------------------------

@app.get("/")
def index():
    token = request.args.get("t")
    if token:
        p = make_custom(token)
        if p:
            return render_template("index.html", p=with_links(p))
        return redirect(url_for("index"))
    seed = request.args.get("s", type=int)
    if seed is None or not 0 < seed < 10**9:
        seed = new_seed()
    return render_template("index.html", p=with_links(make_poem(seed)))


@app.get("/puisi/<int:seed>")
def puisi(seed: int):
    return render_template("puisi.html", p=with_links(make_poem(seed)))


@app.get("/puisi/b/<token>")
def puisi_custom(token: str):
    p = make_custom(token)
    if p is None:
        abort(404)
    return render_template("puisi.html", p=with_links(p))


@app.get("/tersimpan")
def tersimpan():
    return render_template("tersimpan.html")


@app.get("/puisi")
def puisi_random():
    return redirect(url_for("puisi", seed=new_seed()))


@app.context_processor
def inject_themes():
    return {"THEMES": THEMES, "SITE_NAME": SITE_NAME}


@app.route("/tulis", methods=["GET", "POST"])
def tulis():
    ctx = {"max_chars": MAX_CHARS, "max_lines": MAX_LINES, "source_max": SOURCE_MAX, "mark": MARK, "mark_max": MARK_MAX,
           "text": "", "sumber": "", "tema": THEMES[0], "error": None}
    if request.method == "POST":
        text, sumber = request.form.get("bait", ""), request.form.get("sumber", "")
        tema = request.form.get("tema", "")
        tema = tema if tema in THEMES else THEMES[0]
        lines, err = validate_bait(text)
        source, serr = validate_source(sumber)
        if not (err or serr):
            token = encode_bait(lines, source, tema)
            if request.form.get("aksi") == "story":  # tombol "Jadikan story"
                return redirect(url_for("puisi_custom", token=token))
            return redirect(url_for("index", t=token))  # default: tampil seperti beranda
        ctx.update(text=text, sumber=sumber, tema=tema, error=err or serr)
    else:  # dari tombol Kembali di halaman story: isi ulang form
        res = decode_bait(request.args.get("t", ""))
        if res:
            ctx.update(text="\n".join(res[0]), sumber=res[1], tema=res[2] or THEMES[0])
    return render_template("tulis.html", p={"theme": ctx["tema"]}, **ctx)


@app.get("/api/puisi")
def api_puisi():
    return jsonify(make_poem(new_seed()))


if __name__ == "__main__":
    app.run(debug=True)