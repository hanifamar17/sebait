(async () => {
  const data = JSON.parse(document.getElementById("data").textContent);
  const canvas = document.getElementById("story");
  const ctx = canvas.getContext("2d");
  const W = 1080, H = 1920, PAD = 96, GAP = 14;
  const SIZE_MAX = 84, SIZE_MIN = 44;
  const SOURCE_Y = H - 150;
  const MAX_H = SOURCE_Y - 130 - 220; // tinggi teks yang tersedia (sisakan 220px di atas)
  canvas.width = W;
  canvas.height = H;

  try {
    await Promise.all([
      document.fonts.load("600 64px Newsreader"),
      document.fonts.load("italic 400 64px Newsreader"),
    ]);
  } catch {}

  // em=false: tebal roman, warna teks. em=true: miring, warna aksen. Sama dengan halaman.
  const fontOf = (em, size) => em
    ? `italic 400 ${size}px Newsreader, Georgia, serif`
    : `600 ${size}px Newsreader, Georgia, serif`;

  // gaya dari server (bait sendiri ber-tanda *), atau aturan bawaan: baris 1 tebal, sisanya miring
  const runsOf = (line, i) => data.runs ? data.runs[i] : [{ t: line, em: i > 0 }];

  // pecah jadi kata; ingat apakah ada spasi sebelumnya (kata bisa berganti gaya tanpa spasi)
  function tokens(runs) {
    const out = [];
    let space = false;
    for (const r of runs) {
      for (const part of r.t.split(/(\s+)/)) {
        if (!part) continue;
        if (/^\s+$/.test(part)) space = true;
        else { out.push({ t: part, em: r.em, space: space && out.length > 0 }); space = false; }
      }
    }
    return out;
  }

  function layout(size) {
    const lh = size * 1.3, maxW = W - PAD * 2;
    const blocks = data.lines.map((line, i) => {
      const rows = [];
      let row = [], x = 0;
      for (const tk of tokens(runsOf(line, i))) {
        ctx.font = fontOf(tk.em, size);
        const w = ctx.measureText(tk.t).width;
        let gap = tk.space && row.length ? ctx.measureText(" ").width : 0;
        if (row.length && x + gap + w > maxW) { rows.push(row); row = []; x = 0; gap = 0; }
        row.push({ ...tk, x: x + gap });
        x += gap + w;
      }
      if (row.length) rows.push(row);
      return rows;
    });
    const total = blocks.reduce((s, rows) => s + rows.length * lh, 0) + GAP * (blocks.length - 1);
    return { size, lh, blocks, total };
  }

  // teks panjang: kecilkan huruf sampai muat
  let L = layout(SIZE_MAX);
  for (let s = SIZE_MAX - 4; L.total > MAX_H && s >= SIZE_MIN; s -= 4) L = layout(s);

  function draw() {
    // warna dibaca dari token CSS aktif (palet + mode)
    const css = getComputedStyle(document.documentElement);
    const v = n => css.getPropertyValue(n).trim();
    const c = { bg: v("--card"), fg: v("--foreground"), mute: v("--muted-foreground"), accent: v("--accent") };

    ctx.fillStyle = c.bg;
    ctx.fillRect(0, 0, W, H);

    let top = SOURCE_Y - 130 - L.total;
    for (const rows of L.blocks) {
      for (const row of rows) {
        for (const tk of row) {
          ctx.font = fontOf(tk.em, L.size);
          ctx.fillStyle = tk.em ? c.accent : c.fg;
          ctx.fillText(tk.t, PAD + tk.x, top + L.lh * 0.78);
        }
        top += L.lh;
      }
      top += GAP;
    }

    ctx.fillStyle = c.mute;
    if (data.source) {
      ctx.font = "36px ui-sans-serif, system-ui, sans-serif";
      ctx.fillText(data.source, PAD, SOURCE_Y);
    }
    if (data.site) {  // kredit situs, rata kanan
      ctx.font = "italic 400 44px Newsreader, Georgia, serif";
      ctx.textAlign = "right";
      ctx.fillText(data.site, W - PAD, SOURCE_Y);
      ctx.textAlign = "left";
    }
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