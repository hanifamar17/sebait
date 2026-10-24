// Mode terang / gelap
(() => {
  const root = document.documentElement;
  const btn = document.getElementById("mode");
  const icon = document.getElementById("mode-icon");
  if (!btn || !icon) return;

  const moon = `<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>`;
  const sun = `
    <circle cx="12" cy="12" r="4"/>
    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
  `;

  const update = () => {
    const isDark = root.dataset.mode === "dark";
    icon.innerHTML = isDark ? sun : moon;
    btn.title = isDark ? "Mode terang" : "Mode gelap";
  };

  update();

  btn.addEventListener("click", () => {
    const next = root.dataset.mode === "dark" ? "light" : "dark";
    root.dataset.mode = next;
    try { localStorage.setItem("mode", next); } catch {}
    update();
    window.dispatchEvent(new Event("themechange"));
  });
})();

// Mode Fokus
(() => {
  const root = document.documentElement;
  const btn = document.getElementById("clean");
  const icon = document.getElementById("clean-icon");
  if (!btn || !icon) return;

  const expand = `<path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>`;
  const close = `
    <path d="M18 6L6 18M6 6l12 12"/>
  `;

  const isFullscreen = () => !!(document.fullscreenElement || document.webkitFullscreenElement);

  const updateIcon = () => {
    const active = root.dataset.clean === "true" || isFullscreen();
    icon.innerHTML = active ? close : expand;
    btn.title = active ? "Keluar mode fokus" : "Mode fokus";
  };

  const enterFocus = async () => {
    root.dataset.clean = "true";
    try {
      const el = document.documentElement;
      if (el.requestFullscreen) await el.requestFullscreen();
      else if (el.webkitRequestFullscreen) await el.webkitRequestFullscreen();
    } catch (e) {}
    updateIcon();
  };

  const exitFocus = async () => {
    root.dataset.clean = "false";
    try {
      if (document.exitFullscreen) await document.exitFullscreen();
      else if (document.webkitExitFullscreen) await document.webkitExitFullscreen();
    } catch (e) {}
    updateIcon();
  };

  btn.addEventListener("click", () => {
    if (root.dataset.clean === "true" || isFullscreen()) {
      exitFocus();
    } else {
      enterFocus();
    }
  });

  document.addEventListener("fullscreenchange", () => {
    if (!isFullscreen()) root.dataset.clean = "false";
    updateIcon();
  });
  document.addEventListener("webkitfullscreenchange", () => {
    if (!isFullscreen()) root.dataset.clean = "false";
    updateIcon();
  });

  updateIcon();
})();