// Shared namespace, tiny helpers, icons and the demo data. Classic scripts (no modules) so the page
// works straight from the file system: double-click index.html.
(function () {
  const RS = (window.RS = { chapters: [] });

  RS.$ = (sel, el = document) => el.querySelector(sel);
  RS.$$ = (sel, el = document) => [...el.querySelectorAll(sel)];

  RS.esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  /** Text of a <script type="text/x-source"> block, without the leading/trailing blank lines. */
  RS.source = (id) => {
    const el = document.getElementById(id);
    if (!el) throw new Error(`source "${id}" not found`);
    return el.textContent.replace(/^\s*\n/, '').replace(/\s+$/, '');
  };

  RS.html = (markup) => {
    const t = document.createElement('template');
    t.innerHTML = markup.trim();
    return t.content.firstElementChild;
  };

  RS.wait = (ms) => new Promise((r) => setTimeout(r, ms));

  RS.reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const svg = (d, extra = '') => `<svg class="ico" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="square" ${extra}>${d}</svg>`;
  RS.icons = {
    arrow: svg('<path d="M4 12h15M14 6l6 6-6 6"/>'),
    back: svg('<path d="M20 12H5M10 6l-6 6 6 6"/>'),
    play: svg('<path d="M7 5l12 7-12 7z"/>'),
    reset: svg('<path d="M4 4v6h6"/><path d="M5.5 15a7 7 0 1 0 1.6-7.3L4 10"/>'),
    check: svg('<path d="M4.5 12.5l5 5 10-11"/>'),
    cross: svg('<path d="M6 6l12 12M18 6L6 18"/>'),
    download: svg('<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>'),
    bolt: svg('<path d="M13 3L5 14h6l-1 7 8-11h-6z"/>'),
    eye: svg('<path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12z"/><circle cx="12" cy="12" r="2.6"/>'),
    code: svg('<path d="M8 7l-5 5 5 5M16 7l5 5-5 5"/>'),
    focus: svg('<path d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5"/>'),
    layers: svg('<path d="M12 3l9 5-9 5-9-5z"/><path d="M3 13l9 5 9-5"/>'),
    key: svg('<circle cx="8" cy="12" r="3.5"/><path d="M11.5 12H21M17 12v3M20 12v2"/>'),
    warn: svg('<path d="M12 3l10 18H2z"/><path d="M12 10v5M12 17.5v.5"/>'),
  };

  // Four (or six) pizzas from the Trattoria menu. `art` drives the CSS pizza illustration.
  const art = (a, b, c) => `--t1:${a};--t2:${b};--t3:${c}`;
  RS.PRODUCTS = [
    { id: 1, name: 'Margherita', price: 12, art: art('#F6EFDF', '#3E7B3A', '#F6EFDF') },
    { id: 2, name: 'Prosciutto e Funghi', price: 15.5, art: art('#D9908C', '#A88462', '#E8D7B0') },
    { id: 3, name: 'Diavola', price: 13.5, art: art('#9E2A1F', '#B83324', '#3A2618') },
    { id: 4, name: 'Quattro Formaggi', price: 14, art: art('#F7E8B4', '#E5BF62', '#FFF6DC') },
    { id: 5, name: 'Vegetariana', price: 12.8, art: art('#3E7B3A', '#D8AE2E', '#6E2A7E') },
    { id: 6, name: 'Tonno', price: 13.9, art: art('#CBB89C', '#73588A', '#EFE6D0') },
  ];
  RS.byId = (id) => RS.PRODUCTS.find((p) => p.id === id);

  /** Count lines of real code (no blank lines). */
  RS.loc = (src) => src.split('\n').filter((l) => l.trim()).length;
})();
