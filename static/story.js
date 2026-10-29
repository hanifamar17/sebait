(async () => {
  const data = JSON.parse(document.getElementById("data").textContent);
  const canvas = document.getElementById("story");
  const next = document.getElementById("story-next");
  const wrap = document.getElementById("story-wrap");
  const ctx = canvas.getContext("2d");

  const W = 1080, PAD = 96, GAP = 14;
  const BOTTOM = 175; // jarak tepi bawah → baris sumber (naikkan = lebih longgar)
  const SIZE_BY_RATIO = { "9:16": 84, "4:5": 72, "1:1": 62 };
  const SIZE_MIN = 26;
  const RATIOS = { "9:16": 1920, "4:5": 1350, "1:1": 1080 };
  const KEY = "sebait:rasio";

  let ratio = "9:16";
  try {
    const r = localStorage.getItem(KEY);
    if (RATIOS[r]) ratio = r;
  } catch {}

  let H, SOURCE_Y, MAX_H, L;

  try {
    await Promise.all([
      document.fonts.load("600 64px Newsreader"),
      document.fonts.load("italic 400 64px Newsreader"),
    ]);
  } catch {}

  const fontOf = (em, size) =>
    em
      ? `italic 400 ${size}px Newsreader, Georgia, serif`
      : `600 ${size}px Newsreader, Georgia, serif`;

  const runsOf = (line, i) =>
    data.runs ? data.runs[i] : [{ t: line, em: i > 0 }];

  function tokens(runs) {
    const out = [];
    let space = false;
    for (const r of runs) {
      for (const part of r.t.split(/(\s+)/)) {
        if (!part) continue;
        if (/^\s+$/.test(part)) space = true;
        else {
          out.push({ t: part, em: r.em, space: space && out.length > 0 });
          space = false;
        }
      }
    }
    return out;
  }

  function layout(size) {
    const lh = size * 1.3;
    const maxW = W - PAD * 2;
    const blocks = data.lines.map((line, i) => {
      const rows = [];
      let row = [], x = 0;
      for (const tk of tokens(runsOf(line, i))) {
        ctx.font = fontOf(tk.em, size);
        const w = ctx.measureText(tk.t).width;
        let gap = tk.space && row.length ? ctx.measureText(" ").width : 0;
        if (row.length && x + gap + w > maxW) {
          rows.push(row);
          row = [];
          x = 0;
          gap = 0;
        }
        row.push({ ...tk, x: x + gap });
        x += gap + w;
      }
      if (row.length) rows.push(row);
      return rows;
    });
    const total =
      blocks.reduce((s, rows) => s + rows.length * lh, 0) +
      GAP * (blocks.length - 1);
    return { size, lh, blocks, total };
  }

  function fit() {
    L = layout(SIZE_BY_RATIO[ratio]);
    for (let s = L.size - 2; L.total > MAX_H && s >= SIZE_MIN; s -= 2)
      L = layout(s);
  }

  function drawOn(c, Lref) {
    const css = getComputedStyle(document.documentElement);
    const v = (n) => css.getPropertyValue(n).trim();
    const col = {
      bg: v("--card"),
      fg: v("--foreground"),
      mute: v("--muted-foreground"),
      accent: v("--accent"),
    };
    const cx = c.getContext("2d");
    const h = c.height;
    const sourceY = h - BOTTOM;

    cx.fillStyle = col.bg;
    cx.fillRect(0, 0, W, h);

    let top = sourceY - 130 - Lref.total;
    for (const rows of Lref.blocks) {
      for (const row of rows) {
        for (const tk of row) {
          cx.font = fontOf(tk.em, Lref.size);
          cx.fillStyle = tk.em ? col.accent : col.fg;
          cx.fillText(tk.t, PAD + tk.x, top + Lref.lh * 0.78);
        }
        top += Lref.lh;
      }
      top += GAP;
    }

    cx.fillStyle = col.mute;
    if (data.source) {
      cx.font = "36px ui-sans-serif, system-ui, sans-serif";
      cx.fillText(data.source, PAD, sourceY);
    }
    if (data.site) {
      cx.font = "italic 400 44px Newsreader, Georgia, serif";
      cx.textAlign = "right";
      cx.fillText(data.site, W - PAD, sourceY);
      cx.textAlign = "left";
    }
  }

  function draw() {
    drawOn(canvas, L);
  }

  function prepare(r) {
    const h = RATIOS[r];
    const sourceY = h - BOTTOM;
    const maxH = sourceY - 130 - Math.round(h * 0.115);

    const prevH = H, prevMax = MAX_H;
    H = h;
    MAX_H = maxH;

    let L2 = layout(SIZE_BY_RATIO[r]);
    for (let s = L2.size - 2; L2.total > maxH && s >= SIZE_MIN; s -= 2)
      L2 = layout(s);

    H = prevH;
    MAX_H = prevMax;

    next.width = W;
    next.height = h;
    next.style.aspectRatio = `${W} / ${h}`;
    drawOn(next, L2);
    return { h, L2 };
  }

  const ratioBtns = [...document.querySelectorAll("[data-ratio]")];
  const mark = (r) =>
    ratioBtns.forEach((b) =>
      b.setAttribute("aria-pressed", String(b.dataset.ratio === r))
    );

  function setRatio(r) {
    ratio = r;
    H = RATIOS[r];
    SOURCE_Y = H - BOTTOM;
    MAX_H = SOURCE_Y - 130 - BOTTOM;
    canvas.width = W;
    canvas.height = H;
    canvas.style.aspectRatio = `${W} / ${H}`;
    wrap.style.aspectRatio = `${W} / ${H}`;
    mark(r);
    try {
      localStorage.setItem(KEY, r);
    } catch {}
    fit();
    draw();
    next.style.transition = "none";
    next.style.opacity = "0";
  }

  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let target = ratio, turn = 0;

  async function switchRatio(r) {
    if (r === target) return;
    target = r;
    mark(r);

    if (reduceMotion) {
      setRatio(r);
      return;
    }

    const mine = ++turn;
    const { h, L2 } = prepare(r);

    wrap.style.transition = "aspect-ratio 360ms cubic-bezier(.25,.8,.25,1)";
    wrap.style.aspectRatio = `${W} / ${h}`;

    next.style.transition = "opacity 280ms ease";
    next.style.opacity = "1";

    await new Promise((res) => setTimeout(res, 300));
    if (mine !== turn) return;

    ratio = r;
    H = h;
    SOURCE_Y = H - BOTTOM;
    MAX_H = SOURCE_Y - 130 - Math.round(H * 0.115);
    L = L2;
    canvas.width = W;
    canvas.height = H;
    canvas.style.aspectRatio = `${W} / ${H}`;
    draw();
    try {
      localStorage.setItem(KEY, r);
    } catch {}

    next.style.transition = "none";
    next.style.opacity = "0";
  }

  ratioBtns.forEach((b) =>
    b.addEventListener("click", () => switchRatio(b.dataset.ratio))
  );
  setRatio(ratio);
  window.addEventListener("themechange", draw);

  const toBlob = () => new Promise((r) => canvas.toBlob(r, "image/png"));
  const fileName = () =>
    `sebait-${data.seed}-${ratio.replace(":", "x")}.png`;

  document.getElementById("download").addEventListener("click", async () => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(await toBlob());
    a.download = fileName();
    a.click();
    URL.revokeObjectURL(a.href);
  });

  const shareBtn = document.getElementById("share");
  if (
    shareBtn &&
    navigator.canShare?.({
      files: [new File([""], "a.png", { type: "image/png" })],
    })
  ) {
    shareBtn.classList.remove("hidden");
    shareBtn.addEventListener("click", async () => {
      const file = new File([await toBlob()], fileName(), {
        type: "image/png",
      });
      try {
        await navigator.share({ files: [file], title: data.site || "" });
      } catch (e) {
        if (e.name !== "AbortError") console.error(e);
      }
    });
  }
})();