// 03 · render(): objects → real DOM. The DOM API calls on the right are recorded live while mini-react
// runs (we wrap document.createElement & co. for the duration of one render) and then replayed slowly.
(function () {
  const { icons, esc } = RS;
  const SPEEDS = { slow: 420, fast: 130, now: 0 };

  function record(fn) {
    const calls = [];
    const doc = document;
    const origEl = doc.createElement;
    const origText = doc.createTextNode;
    const origAppend = Node.prototype.appendChild;
    const origReplace = Element.prototype.replaceChildren;
    const origListen = EventTarget.prototype.addEventListener;
    const tag = (n) => (n.nodeType === 3 ? '#text' : n.tagName.toLowerCase());
    doc.createElement = function (name, ...rest) {
      const node = origEl.call(doc, name, ...rest);
      calls.push({ op: 'create', node, text: `document.createElement("${name}")` });
      return node;
    };
    doc.createTextNode = function (value) {
      const node = origText.call(doc, value);
      calls.push({ op: 'text', node, text: `document.createTextNode(${JSON.stringify(value.length > 22 ? `${value.slice(0, 21)}…` : value)})` });
      return node;
    };
    Node.prototype.appendChild = function (child) {
      calls.push({ op: 'append', node: child, text: `${tag(this)}.appendChild(${tag(child)})` });
      return origAppend.call(this, child);
    };
    Element.prototype.replaceChildren = function (...nodes) {
      calls.push({ op: 'root', node: nodes[0], text: `container.replaceChildren(${nodes.map(tag).join(', ')})` });
      return origReplace.apply(this, nodes);
    };
    EventTarget.prototype.addEventListener = function (type, ...rest) {
      if (this.nodeType === 1) calls.push({ op: 'listen', node: this, text: `${tag(this)}.addEventListener("${type}", ƒ)` });
      return origListen.call(this, type, ...rest);
    };
    try { fn(); } finally {
      doc.createElement = origEl;
      doc.createTextNode = origText;
      Node.prototype.appendChild = origAppend;
      Element.prototype.replaceChildren = origReplace;
      EventTarget.prototype.addEventListener = origListen;
    }
    return calls;
  }

  RS.chapters.push({
    id: 'render',
    short: 'render',
    kicker: '03 · RENDER',
    title: 'ობიექტებიდან — ნამდვილი DOM',
    tocTitle: 'ობიექტებიდან — ნამდვილი DOM',
    lead: '<span class="mono">createDom()</span> ხეს ზემოდან ჩაუყვება: ტეგზე — <span class="mono">document.createElement</span>, ტექსტზე — <span class="mono">createTextNode</span>, props → თვისებები და listener-ები, შვილები → <span class="mono">appendChild</span>. კომპონენტს უბრალოდ <b>ვიძახებთ</b> და მის შედეგს ვაწყობთ. მარჯვნივ — ნამდვილი გამოძახებები, ჩაწერილი ახლახან.',
    tryit: [
      'დააჭირეთ <b>ააწყე</b> და მიჰყევით რიგს: ხე → გამოძახებები → ეკრანი.',
      'ის აწყობს იმას, რაც მე-2 თავში დაწერეთ — დაბრუნდით და შეცვალეთ.',
      'შეხედეთ <span class="mono">appendChild</span>-ის რიგს: შვილები მშობელში ჯერ "ჰაერში" ეწყობა, ეკრანზე კი ბოლოს ერთად ჩნდება.',
    ],
    code: [{ label: 'mini-react.js', lib: 3 }],
    lab: {
      title: 'createDom() — ნაბიჯ-ნაბიჯ',
      controls: `
        <span class="seg" data-speed>
          <button data-v="slow" class="is-on">ნელა</button><button data-v="fast">სწრაფად</button><button data-v="now">მყისიერად</button>
        </span>
        <button class="btn btn--solid" data-build>${icons.play}ააწყე</button>`,
      html: () => `
        <div class="rl">
          <section class="panel rl-tree">
            <header class="panel-h"><span>virtual DOM</span><span class="mono muted">რიგი = შექმნის რიგი</span></header>
            <div class="vt vt--numbered" data-tree></div>
          </section>
          <section class="panel rl-view">
            <header class="panel-h"><span>ეკრანი</span><span class="rl-count" data-count></span></header>
            <div class="stage-box"><div class="rs-app" data-app></div></div>
          </section>
          <section class="panel rl-log">
            <header class="panel-h"><span>DOM API — ჩაწერილი გამოძახებები</span><span class="mono muted" data-ncalls></span></header>
            <div class="panel-b"><ol class="calls" data-calls></ol></div>
          </section>
        </div>`,
      mount(el) {
        const lib = RS.lib.compile(3);
        const Price = RS.makePrice(lib.h);
        const p = RS.PRODUCTS[1];
        const add = (id) => RS.toast(`<span class="mono">add(${id})</span> — ღილაკი ნამდვილია: listener-ი createDom()-მა მიაბა.`);
        const app = el.querySelector('[data-app]');
        const treeEl = el.querySelector('[data-tree]');
        const callsEl = el.querySelector('[data-calls]');
        let speed = 'slow';
        let timers = [];

        el.querySelector('[data-speed]').addEventListener('click', (e) => {
          const b = e.target.closest('button');
          if (!b) return;
          speed = b.dataset.v;
          el.querySelectorAll('[data-speed] button').forEach((x) => x.classList.toggle('is-on', x === b));
        });

        function build() {
          timers.forEach(clearTimeout);
          timers = [];
          const src = RS.state && RS.state.cardJsx ? RS.state.cardJsx : RS.source('app-card-jsx');
          const r = RS.jsx.tryCompile(src);
          let v;
          try {
            if (r.error) throw new Error(`JSX: ${r.error} (გაასწორეთ მე-2 თავში)`);
            // eslint-disable-next-line no-new-func
            v = new Function('h', 'p', 'Price', 'add', `return (${r.code});`)(lib.h, p, Price, add);
          } catch (e) {
            app.innerHTML = `<div class="app-error"><b>ვერ ავაწყვე</b><pre>${esc(e.message)}</pre></div>`;
            return;
          }
          const calls = record(() => lib.render(v, app));
          // tree rows, mapped to DOM nodes
          treeEl.innerHTML = RS.vtreeHTML(v, { snap: RS.snapshot(app), numbered: true });
          const order = RS.vtreeOrder(v);
          const rowOf = new Map(order.map((node, i) => [node.dom, treeEl.querySelector(`[data-vt="${i}"]`)]));
          treeEl.querySelectorAll('.vt-row:not(.is-comp)').forEach((row) => row.classList.add('is-pending'));
          callsEl.innerHTML = calls.map((c) => `<li class="c-${c.op === 'create' ? 'create' : c.op === 'text' ? 'text' : c.op === 'root' ? 'root' : 'append'}">${esc(c.text)}</li>`).join('');
          const n = (op) => calls.filter((c) => c.op === op).length;
          el.querySelector('[data-ncalls]').textContent = `${calls.length} გამოძახება`;
          el.querySelector('[data-count]').textContent = `createElement ×${n('create')} · createTextNode ×${n('text')} · appendChild ×${n('append')}`;

          const items = [...callsEl.children];
          const step = SPEEDS[speed];
          app.classList.add('is-building');
          const finish = () => {
            app.classList.remove('is-building');
            app.querySelectorAll('.is-on').forEach((x) => x.classList.remove('is-on'));
            items.forEach((li) => { li.classList.add('is-on'); li.classList.remove('is-now'); });
            treeEl.querySelectorAll('.vt-row').forEach((row) => { row.classList.remove('is-pending', 'is-building'); row.classList.add('is-built'); });
          };
          if (!step) { finish(); return; }
          calls.forEach((c, i) => {
            timers.push(setTimeout(() => {
              items.forEach((li) => li.classList.remove('is-now'));
              items[i].classList.add('is-on', 'is-now');
              items[i].scrollIntoView({ block: 'nearest' });
              const row = rowOf.get(c.node);
              if ((c.op === 'create' || c.op === 'text') && row) {
                treeEl.querySelectorAll('.is-building').forEach((x) => { x.classList.remove('is-building'); x.classList.add('is-built'); });
                row.classList.remove('is-pending');
                row.classList.add('is-building');
                row.scrollIntoView({ block: 'nearest' });
              }
              if (c.op === 'create') c.node.classList.add('is-on');
              if (c.op === 'root') finish();
            }, i * step));
          });
        }

        el.querySelector('[data-build]').addEventListener('click', build);
        build();
        return () => timers.forEach(clearTimeout);
      },
    },
  });
})();
