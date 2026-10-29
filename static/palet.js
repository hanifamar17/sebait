// Pilih palet: ganti data-theme di <html>, isi input tersembunyi #tema (kalau ada),
// dan kabari story.js supaya kartu digambar ulang.
(() => {
  const root = document.documentElement;
  const picks = [...document.querySelectorAll("[data-pick]")];
  const input = document.getElementById("tema");
  const mark = t => picks.forEach(b => b.setAttribute("aria-pressed", String(b.dataset.pick === t)));

  mark(root.dataset.theme);
  window.addEventListener("themechange", () => mark(root.dataset.theme));  // mis. 'Puisi lain' mengganti palet
  picks.forEach(b => b.addEventListener("click", () => {
    root.dataset.theme = b.dataset.pick;
    if (input) input.value = b.dataset.pick;
    mark(b.dataset.pick);
    window.dispatchEvent(new Event("themechange"));
  }));
})();