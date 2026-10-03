// Instruments for the labs. They never touch mini-react itself: the DOM is watched from the outside with
// MutationObserver, and the virtual DOM is read from the root object the library already keeps.
(function () {
  const { esc } = RS;

  // ---------------------------------------------------------------- DOM operations

  const countNodes = (n) => {
    let c = n.nodeType === 1 || n.nodeType === 3 ? 1 : 0;
    n.childNodes.forEach((k) => { c += countNodes(k); });
    return c;
  };

  function summarize(records) {
    const added = new Set();
    const removed = new Set();
    const moved = new Set();
    const textNodes = new Set();
    const attrEls = new Set();
    records.forEach((r) => {
      if (r.type === 'childList') {
        r.removedNodes.forEach((n) => {
          if (added.has(n)) added.delete(n); // created and dropped in the same batch
          else removed.add(n);
        });
        r.addedNodes.forEach((n) => {
          if (removed.has(n)) { removed.delete(n); moved.add(n); } else added.add(n);
        });
      } else if (r.type === 'characterData') {
        if (r.oldValue !== r.target.nodeValue) textNodes.add(r.target);
      } else if (r.type === 'attributes') {
        attrEls.add(r.target);
      }
    });
    let created = 0;
    added.forEach((n) => { created += countNodes(n); });
    let deleted = 0;
    removed.forEach((n) => { deleted += countNodes(n); });
    const s = {
      created,
      deleted,
      moved: moved.size,
      text: textNodes.size,
      attrs: attrEls.size,
      addedNodes: [...added],
      movedNodes: [...moved],
      textNodes: [...textNodes],
      attrEls: [...attrEls],
    };
    s.total = s.created + s.deleted + s.moved + s.text + s.attrs;
    return s;
  }

  RS.observe = function observe(target, onBatch) {
    const mo = new MutationObserver((records) => onBatch(summarize(records)));
    mo.observe(target, { childList: true, subtree: true, characterData: true, characterDataOldValue: true, attributes: true });
    return () => mo.disconnect();
  };

  // ---------------------------------------------------------------- "highlight updates" overlay

  const rectOf = (n) => {
    if (!n.isConnected) return null;
    if (n.nodeType === 3) {
      if (!n.nodeValue.trim()) return null;
      const r = document.createRange();
      r.selectNodeContents(n);
      return r.getBoundingClientRect();
    }
    return n.nodeType === 1 ? n.getBoundingClientRect() : null;
  };

  RS.flash = function flash(layer, summary) {
    if (RS.reducedMotion()) return;
    const base = layer.getBoundingClientRect();
    const boxes = [];
    summary.addedNodes.forEach((n) => boxes.push([n, 'new']));
    summary.movedNodes.forEach((n) => boxes.push([n, 'move']));
    summary.textNodes.forEach((n) => boxes.push([n, 'text']));
    summary.attrEls.forEach((n) => boxes.push([n, 'attr']));
    boxes.slice(0, 120).forEach(([n, kind]) => {
      const r = rectOf(n);
      if (!r || (!r.width && !r.height)) return;
      const b = document.createElement('i');
      b.className = `flash flash--${kind}`;
      b.style.cssText = `left:${r.left - base.left - 2}px;top:${r.top - base.top - 2}px;width:${r.width + 4}px;height:${r.height + 4}px`;
      layer.appendChild(b);
      b.addEventListener('animationend', () => b.remove());
    });
  };

  // ---------------------------------------------------------------- snapshots: what changed in the tree?

  const attrSig = (el) => [...el.attributes].map((a) => `${a.name}=${a.value}`).join('|');

  RS.snapshot = function snapshot(container) {
    const s = { nodes: new Set(), text: new Map(), attr: new Map() };
    const walk = (n) => {
      s.nodes.add(n);
      if (n.nodeType === 3) s.text.set(n, n.nodeValue);
      else if (n.nodeType === 1) s.attr.set(n, attrSig(n));
      n.childNodes.forEach(walk);
    };
    container.childNodes.forEach(walk);
    return s;
  };

  function statusOf(dom, snap, moved) {
    if (!dom || !snap) return 'new';
    if (!snap.nodes.has(dom)) return 'new';
    if (moved && moved.has(dom)) return 'move';
    if (dom.nodeType === 3 && snap.text.get(dom) !== dom.nodeValue) return 'text';
    if (dom.nodeType === 1 && snap.attr.get(dom) !== attrSig(dom)) return 'attr';
    return 'same';
  }

  const STATUS_LABEL = { new: 'ახალი', text: 'ტექსტი', attr: 'ატრიბუტი', move: 'გადაადგ.', same: '' };

  const compName = (v) => v.type.displayName || v.type.name || 'Component';
  const trunc = (s, n = 26) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);

  /**
   * The virtual DOM as an indented list. Every row is coloured by what happened to its DOM node in the
   * last update (new / text / attribute / moved / untouched).
   */
  RS.vtreeHTML = function vtreeHTML(root, { snap, moved, numbered = false } = {}) {
    if (!root) return '<p class="vt-empty">ხე ჯერ არ არის</p>';
    const rows = [];
    let n = 0;
    const row = (depth, inner, status, extra = '') => {
      rows.push(`<div class="vt-row is-${status}" style="--d:${depth}" ${extra}>${numbered ? '<span class="vt-n"></span>' : ''}<span class="vt-node">${inner}</span><span class="vt-st">${STATUS_LABEL[status] || ''}</span></div>`);
    };
    const walk = (v, depth) => {
      if (!v) return;
      if (typeof v.type === 'function') {
        const props = Object.entries(v.props || {}).filter(([k]) => k !== 'key' && k !== 'children')
          .map(([k, val]) => `<span class="vt-attr">${esc(k)}</span>=<span class="vt-val">${esc(shortValue(val))}</span>`).join(' ');
        const key = v.key != null ? ` <span class="vt-key">key=${esc(String(v.key))}</span>` : '';
        row(depth, `<span class="vt-comp">&lt;${esc(compName(v))}</span>${key}${props ? ` ${props}` : ''}<span class="vt-comp">&gt;</span>`, 'comp');
        walk(v.rendered, depth + 1);
        return;
      }
      const status = statusOf(v.dom, snap, moved);
      const id = `data-vt="${n++}"`;
      if (v.type === '#text') {
        row(depth, `<span class="vt-text">"${esc(trunc(v.props.nodeValue))}"</span>`, status, id);
        return;
      }
      const cls = v.props && v.props.className ? `<span class="vt-cls">.${esc(String(v.props.className).split(' ').join('.'))}</span>` : '';
      row(depth, `<span class="vt-tag">&lt;${esc(v.type)}</span>${cls}<span class="vt-tag">&gt;</span>`, status, id);
      (v.children || []).forEach((c) => walk(c, depth + 1));
    };
    walk(root, 0);
    return rows.join('');
  };

  /** Vnodes in the same order as vtreeHTML's data-vt rows (to animate the build). */
  RS.vtreeOrder = function vtreeOrder(root) {
    const list = [];
    const walk = (v) => {
      if (!v) return;
      if (typeof v.type === 'function') { walk(v.rendered); return; }
      list.push(v);
      (v.children || []).forEach(walk);
    };
    walk(root);
    return list;
  };

  /** Count what the last update did to the tree. */
  RS.treeCounts = function treeCounts(root, snap, moved) {
    const c = { new: 0, text: 0, attr: 0, move: 0, same: 0 };
    RS.vtreeOrder(root).forEach((v) => { c[statusOf(v.dom, snap, moved)] += 1; });
    return c;
  };

  // ---------------------------------------------------------------- values

  function shortValue(v) {
    if (typeof v === 'function') return 'ƒ';
    if (typeof v === 'string') return JSON.stringify(trunc(v, 22));
    if (Array.isArray(v)) return `[${v.length}]`;
    if (v && typeof v === 'object') return v.name ? `{${trunc(String(v.name), 14)}}` : '{…}';
    return String(v);
  }
  RS.shortValue = shortValue;

  /** Pretty-print a vnode (or any value) as a JavaScript object literal — the "it's just objects" view. */
  RS.printValue = function printValue(value, indent = 0, seen = new WeakSet()) {
    const pad = '  '.repeat(indent);
    const pad1 = '  '.repeat(indent + 1);
    if (typeof value === 'function') return value.name ? `ƒ ${value.name}` : 'ƒ';
    if (typeof value === 'string') return JSON.stringify(value);
    if (value == null || typeof value !== 'object') return String(value);
    if (seen.has(value)) return '[circular]';
    seen.add(value);
    const inline = (s) => !s.includes('\n') && s.length + indent * 2 <= 60;
    if (Array.isArray(value)) {
      if (!value.length) return '[]';
      const items = value.map((x) => printValue(x, indent + 1, seen));
      const one = `[${items.join(', ')}]`;
      return inline(one) ? one : `[\n${items.map((x) => pad1 + x).join(',\n')}\n${pad}]`;
    }
    const keys = Object.keys(value).filter((k) => !['dom', 'rendered', 'instance'].includes(k) && value[k] !== undefined);
    if (!keys.length) return '{}';
    const items = keys.map((k) => `${/^[A-Za-z_$][\w$]*$/.test(k) ? k : JSON.stringify(k)}: ${printValue(value[k], indent + 1, seen)}`);
    const one = `{ ${items.join(', ')} }`;
    return inline(one) ? one : `{\n${items.map((x) => pad1 + x).join(',\n')}\n${pad}}`;
  };

  // ---------------------------------------------------------------- component instances

  /** Every component vnode with its instance, in tree order. */
  RS.instances = function instances(root) {
    const list = [];
    const walk = (v, depth) => {
      if (!v) return;
      if (typeof v.type === 'function') {
        list.push({ v, name: compName(v), depth, instance: v.instance });
        walk(v.rendered, depth + 1);
        return;
      }
      (v.children || []).forEach((c) => walk(c, depth));
    };
    walk(root, 0);
    return list;
  };

  // ---------------------------------------------------------------- the meter widget

  RS.meterHTML = () => `
    <div class="meter">
      <div class="meter-top">
        <span class="meter-big mono" data-m="total">0</span>
        <span class="meter-cap">DOM ოპერაცია<br><span class="muted">ბოლო განახლებაზე</span></span>
      </div>
      <dl class="meter-rows">
        <div class="m-new"><dt>შეიქმნა</dt><dd><i data-bar="created"></i><span data-m="created">0</span></dd></div>
        <div class="m-del"><dt>წაიშალა</dt><dd><i data-bar="deleted"></i><span data-m="deleted">0</span></dd></div>
        <div class="m-text"><dt>ტექსტი</dt><dd><i data-bar="text"></i><span data-m="text">0</span></dd></div>
        <div class="m-attr"><dt>ატრიბუტი</dt><dd><i data-bar="attrs"></i><span data-m="attrs">0</span></dd></div>
        <div class="m-move"><dt>გადაადგ.</dt><dd><i data-bar="moved"></i><span data-m="moved">0</span></dd></div>
      </dl>
      <div class="meter-hist" data-hist aria-hidden="true"></div>
      <p class="meter-foot mono"><span data-m="updates">0</span> განახლება · სულ <span data-m="sum">0</span> ოპ.</p>
    </div>`;

  RS.meter = function meter(el) {
    const q = (s) => el.querySelector(s);
    const hist = [];
    let updates = 0;
    let sum = 0;
    return {
      push(s) {
        updates += 1;
        sum += s.total;
        q('[data-m="total"]').textContent = s.total;
        q('[data-m="total"]').classList.toggle('is-high', s.total > 10);
        q('[data-m="total"]').classList.toggle('is-low', s.total > 0 && s.total <= 3);
        ['created', 'deleted', 'text', 'attrs', 'moved'].forEach((k) => {
          q(`[data-m="${k}"]`).textContent = s[k];
          q(`[data-bar="${k}"]`).style.width = `${Math.min(100, (s[k] / Math.max(10, s.total)) * 100)}%`;
        });
        q('[data-m="updates"]').textContent = updates;
        q('[data-m="sum"]').textContent = sum;
        hist.push(s.total);
        if (hist.length > 24) hist.shift();
        const max = Math.max(10, ...hist);
        q('[data-hist]').innerHTML = hist.map((t) => `<i style="height:${Math.max(4, (t / max) * 100)}%" class="${t > 10 ? 'is-high' : ''}" title="${t}"></i>`).join('');
      },
      reset() {
        hist.length = 0;
        updates = 0;
        sum = 0;
        this.push({ total: 0, created: 0, deleted: 0, text: 0, attrs: 0, moved: 0 });
        updates = 0;
        hist.length = 0;
        q('[data-m="updates"]').textContent = 0;
        q('[data-hist]').innerHTML = '';
      },
    };
  };

  // ---------------------------------------------------------------- focus watcher

  /** Remembers the focused field inside `container`; after an update tells whether it survived. */
  RS.focusWatch = function focusWatch(container, chip) {
    let last = null;
    let lost = 0;
    const paint = (state) => {
      chip.className = `chip chip--${state}`;
      chip.innerHTML = state === 'lost'
        ? `${RS.icons.warn}<span>focus დაიკარგა ×${lost}</span>`
        : state === 'kept' ? `${RS.icons.focus}<span>focus შენარჩუნდა</span>` : `${RS.icons.focus}<span>focus: —</span>`;
    };
    const onIn = (e) => { last = e.target; paint('kept'); };
    container.addEventListener('focusin', onIn);
    paint('idle');
    return {
      check() {
        if (!last) return;
        if (!last.isConnected) {
          lost += 1;
          last = null;
          paint('lost');
        } else if (document.activeElement === last) {
          paint('kept');
        }
      },
      destroy() { container.removeEventListener('focusin', onIn); },
    };
  };
})();
