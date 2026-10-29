// Favorit di localStorage: tanpa akun, tanpa server. Item: {key, url, lines, source, theme}
window.Fav = (() => {
  const K = "sebait:fav";
  const read = () => { try { return JSON.parse(localStorage.getItem(K)) || []; } catch { return []; } };
  const write = a => { try { localStorage.setItem(K, JSON.stringify(a.slice(0, 100))); } catch {} document.dispatchEvent(new Event("favchange")); };
  const link = document.getElementById("fav-link");
  const sync = () => link && link.classList.toggle("hidden", !read().length);
  document.addEventListener("favchange", sync);
  sync();
  return {
    list: read,
    has: key => read().some(f => f.key === key),
    remove: key => write(read().filter(f => f.key !== key)),
    toggle(item) {  // true = baru disimpan
      const on = !this.has(item.key);
      write(on ? [item, ...read()] : read().filter(f => f.key !== item.key));
      return on;
    },
  };
})();