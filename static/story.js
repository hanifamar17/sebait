(async () => {
  const data = JSON.parse(document.getElementById("data").textContent);
  const canvas = document.getElementById("story");
  const ctx = canvas.getContext("2d");
  const W = 1080, H = 1920, PAD = 96, SIZE = 84, LH = SIZE * 1.3, GAP = 14;
  canvas.width = W;
  canvas.height = H;

  try {
    await Promise.all([
      document.fonts.load("600 64px Newsreader"),
      document.fonts.load("italic 400 64px Newsreader"),
    ]);
  } catch {}

  // baris pertama roman tebal, sisanya italic: sama dengan halaman
  const fontFor = i => i === 0
    ? `600 ${SIZE}px Newsreader, Georgia, serif`
    : `italic 400 ${SIZE}px Newsreader, Georgia, serif`;

  function wrap(text, maxW) {
    const out = [];
    let cur = "";
    for (const w of text.split(" ")) {
      const test = cur ? cur + " " + w : w;
      if (ctx.measureText(test).width > maxW && cur) { out.push(cur); cur = w; }
      else cur = test;
    }
    if (cur) out.push(cur);
    return out;
  }

  function draw() {
    // warna dibaca dari token CSS aktif (palet + mode)
    const css = getComputedStyle(document.documentElement);
    const v = n => css.getPropertyValue(n).trim();
    const c = { bg: v("--card"), fg: v("--foreground"), mute: v("--muted-foreground"), accent: v("--accent") };

    const blocks = data.lines.map((line, i) => {
      ctx.font = fontFor(i);
      return { i, rows: wrap(line, W - PAD * 2) };
    });
    const total = blocks.reduce((s, b) => s + b.rows.length * LH, 0) + GAP * (blocks.length - 1);

    ctx.fillStyle = c.bg;
    ctx.fillRect(0, 0, W, H);

    const sourceY = H - 150;
    let top = sourceY - 130 - total;
    for (const b of blocks) {
      ctx.font = fontFor(b.i);
      ctx.fillStyle = b.i === 0 ? c.fg : c.accent;
      for (const row of b.rows) {
        ctx.fillText(row, PAD, top + LH * 0.78);
        top += LH;
      }
      top += GAP;
    }

    ctx.fillStyle = c.mute;
    ctx.font = "36px ui-sans-serif, system-ui, sans-serif";
    ctx.fillText(data.source, PAD, sourceY);
  }

  draw();
  window.addEventListener("themechange", draw);

  document.getElementById("download").addEventListener("click", () => {
    canvas.toBlob(blob => {
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `puisi-${data.seed}.png`;
      a.click();
      URL.revokeObjectURL(a.href);
    }, "image/png");
  });
})();