// The "app lab": compiles a JSX app with our own compiler, runs it on a chosen version of mini-react and
// wires up the instruments (DOM meter, update flashes, focus watcher, live virtual-DOM tree).
(function () {
  const { icons } = RS;

  RS.appLabHTML = ({ tree = true, treeTitle = 'virtual DOM — რა შეიცვალა', side = '', cls = '' } = {}) => `
    <div class="al ${tree ? '' : 'al--notree'} ${cls}">
      <section class="panel al-stage">
        <header class="panel-h">
          <span>ეკრანი</span>
          <span class="chip" data-focus></span>
          <span class="chip chip--muted" data-renders hidden></span>
        </header>
        <div class="stage-box">
          <div class="rs-app" data-app></div>
          <div class="flash-layer" data-flash aria-hidden="true"></div>
        </div>
      </section>
      <section class="panel al-meter">
        <header class="panel-h"><span>DOM მრიცხველი</span><span class="legend-flash"><i class="lf lf--new"></i>ახალი<i class="lf lf--text"></i>ტექსტი<i class="lf lf--move"></i>გადაადგ.</span></header>
        ${RS.meterHTML()}
      </section>
      ${tree ? `
      <section class="panel al-tree">
        <header class="panel-h"><span>${treeTitle}</span><span class="mono muted" data-tree-sum></span></header>
        <div class="vt" data-tree></div>
      </section>` : ''}
      ${side}
    </div>`;

  const EMPTY = { total: 0, created: 0, deleted: 0, text: 0, attrs: 0, moved: 0, addedNodes: [], movedNodes: [], textNodes: [], attrEls: [] };

  RS.appLab = function appLab(el, opts) {
    const container = el.querySelector('[data-app]');
    const layer = el.querySelector('[data-flash]');
    const treeEl = el.querySelector('[data-tree]');
    const treeSum = el.querySelector('[data-tree-sum]');
    const rendersEl = el.querySelector('[data-renders]');
    const meter = RS.meter(el.querySelector('.meter'));
    const focus = RS.focusWatch(container, el.querySelector('[data-focus]'));

    let o = { ...opts };
    let lib = null;
    let stop = null;
    let snap = null;
    let renders = 0;
    let renderSeq = 0;
    let batchSeq = 0;
    let destroyed = false;

    const root = () => (lib && lib.getRoot ? lib.getRoot() : null);

    function paintTree(moved = new Set()) {
      if (!treeEl) return;
      const r = root();
      treeEl.innerHTML = RS.vtreeHTML(r && r.v, { snap, moved });
      if (treeSum && r && r.v) {
        const c = RS.treeCounts(r.v, snap, moved);
        const total = Object.values(c).reduce((a, b) => a + b, 0);
        treeSum.textContent = `${total} კვანძი · ახალი ${c.new}`;
      }
    }

    function onBatch(s) {
      if (destroyed) return;
      batchSeq = renderSeq;
      meter.push(s);
      RS.flash(layer, s);
      focus.check();
      paintTree(new Set(s.movedNodes));
      snap = RS.snapshot(container);
      o.onUpdate?.(s, api);
    }

    function afterRender(seq) {
      if (destroyed) return;
      if (rendersEl) {
        rendersEl.hidden = false;
        rendersEl.innerHTML = `${icons.layers}<span>render ×${renders}</span>`;
      }
      o.onRender?.(api);
      // a render that changed nothing in the DOM is worth showing too: 0 operations
      setTimeout(() => { if (!destroyed && batchSeq !== seq && seq === renderSeq) onBatch(EMPTY); }, 0);
    }

    function showError(message) {
      container.innerHTML = `<div class="app-error"><b>შეცდომა</b><pre>${RS.esc(message)}</pre></div>`;
    }

    function start() {
      stop?.();
      stop = null;
      renders = 0;
      container.replaceChildren();
      const products = o.products || RS.PRODUCTS.slice(0, 4);

      if (o.version === 'vanilla') {
        lib = null;
        // a fresh host each time, so listeners from a previous run do not pile up
        const host = document.createElement('div');
        container.replaceChildren(host);
        try {
          // eslint-disable-next-line no-new-func
          new Function('app', 'PRODUCTS', o.source)(host, products);
        } catch (e) { showError(e.message); return false; }
      } else {
        lib = RS.lib.compile(o.version);
        const compiled = RS.jsx.tryCompile(o.source);
        if (compiled.error) {
          showError(`${compiled.line ? `ხაზი ${compiled.line}:${compiled.col} — ` : ''}${compiled.error}`);
          return false;
        }
        const scope = { h: lib.h, useState: lib.useState, rerender: lib.rerender, PRODUCTS: products, byId: RS.byId, ...(o.scope || {}) };
        let App;
        try {
          // eslint-disable-next-line no-new-func
          App = new Function(...Object.keys(scope), `${compiled.code}\n;return App;`)(...Object.values(scope));
        } catch (e) { showError(e.message); return false; }
        const Tracked = function (props) {
          renders += 1;
          renderSeq += 1;
          const seq = renderSeq;
          queueMicrotask(() => afterRender(seq));
          return App(props);
        };
        Object.defineProperty(Tracked, 'name', { value: 'App' });
        try { lib.mount(Tracked, container); } catch (e) { showError(e.message); return false; }
      }
      snap = RS.snapshot(container);
      batchSeq = renderSeq;
      paintTree();
      stop = RS.observe(container, onBatch);
      return true;
    }

    const api = {
      container,
      get lib() { return lib; },
      root,
      get renders() { return renders; },
      remount(next = {}) {
        o = { ...o, ...next };
        if (next.resetMeter !== false) meter.reset();
        return start();
      },
      destroy() {
        destroyed = true;
        stop?.();
        focus.destroy();
      },
    };

    meter.reset();
    start();
    return api;
  };
})();
