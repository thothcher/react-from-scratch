// 02 · JSX is a function call. Students edit JSX; our compiler turns it into h() calls; h() returns objects.
(function () {
  RS.state = RS.state || {};

  /** The Price component used in chapters 2–3, compiled by our own compiler. */
  RS.makePrice = (h) => {
    const { code } = RS.jsx.tryCompile(RS.source('app-price'));
    // eslint-disable-next-line no-new-func
    return new Function('h', `${code}\n;return Price;`)(h);
  };

  function countTree(v, c = { el: 0, text: 0, comp: 0 }) {
    if (!v || typeof v !== 'object') return c;
    if (typeof v.type === 'function') c.comp += 1;
    else if (v.type === '#text') c.text += 1;
    else c.el += 1;
    (v.children || []).forEach((k) => countTree(k, c));
    return c;
  }

  RS.chapters.push({
    id: 'jsx',
    short: 'JSX',
    kicker: '02 · JSX',
    title: 'JSX — უბრალოდ ფუნქციის გამოძახება',
    tocTitle: 'უბრალოდ ფუნქციის გამოძახება',
    lead: 'ბრაუზერს JSX არ ესმის. compiler თითოეულ ტეგს <span class="mono">h()</span>-ის გამოძახებად აქცევს, <span class="mono">h()</span> კი აბრუნებს <b>ჩვეულებრივ ობიექტს</b>: type, props, children. ამ ობიექტების ხეს <b>virtual DOM</b> ჰქვია. ეკრანზე ჯერ არაფერია — მხოლოდ მონაცემი.',
    tryit: [
      'შეცვალეთ JSX — compiler ცოცხლად მუშაობს. ესეც ჩვენი დაწერილია (~200 ხაზი, js/jsx.js).',
      'წაშალეთ <span class="mono">&lt;/h3&gt;</span> — და წაიკითხეთ შეცდომა.',
      'დაამატეთ <span class="mono">&lt;Price value={9} /&gt;</span>: კომპონენტიც ობიექტია, მხოლოდ მისი <span class="mono">type</span> ფუნქციაა.',
    ],
    code: [{ label: 'mini-react.js', lib: 2 }],
    lab: {
      title: 'JSX → h() → ობიექტი',
      controls: `<button class="btn" data-reset>${RS.icons.reset}საწყისი კოდი</button>`,
      html: () => `
        <div class="jl">
          <section class="panel jl-jsx">
            <header class="panel-h"><span>JSX — შეცვალეთ</span><span class="mono muted">p = PRODUCTS[1]</span></header>
            <div class="ed" data-ed></div>
            <p class="jl-ok" data-status></p>
          </section>
          <section class="panel jl-out">
            <header class="panel-h"><span>compiler-ის შედეგი — JavaScript</span></header>
            <div class="panel-b"><pre class="pre" data-out></pre></div>
          </section>
          <section class="panel jl-obj">
            <header class="panel-h"><span>h() აბრუნებს — უბრალოდ ობიექტი</span><span class="mono muted" data-count></span></header>
            <div class="panel-b"><pre class="pre" data-obj></pre></div>
          </section>
        </div>`,
      mount(el) {
        const lib = RS.lib.compile(2);
        const Price = RS.makePrice(lib.h);
        const p = RS.PRODUCTS[1];
        const add = (id) => RS.toast(`<span class="mono">add(${id})</span> — ამ თავში ღილაკი ჯერ არ მუშაობს: DOM ჯერ არ გვაქვს.`);
        const out = el.querySelector('[data-out]');
        const obj = el.querySelector('[data-obj]');
        const status = el.querySelector('[data-status]');
        const countEl = el.querySelector('[data-count]');
        const initial = RS.source('app-card-jsx');

        const run = (src) => {
          RS.state.cardJsx = src;
          const r = RS.jsx.tryCompile(src, { pretty: true });
          if (r.error) {
            status.className = 'jl-err';
            status.textContent = `${r.line ? `ხაზი ${r.line}:${r.col} — ` : ''}${r.error}`;
            out.classList.add('is-stale');
            obj.classList.add('is-stale');
            return;
          }
          out.innerHTML = RS.highlight(r.code);
          let value;
          try {
            // eslint-disable-next-line no-new-func
            value = new Function('h', 'p', 'Price', 'add', `return (${r.code.trim() || 'null'});`)(lib.h, p, Price, add);
          } catch (e) {
            status.className = 'jl-err';
            status.textContent = `JavaScript-ის შეცდომა: ${e.message}`;
            out.classList.remove('is-stale');
            obj.classList.add('is-stale');
            return;
          }
          out.classList.remove('is-stale');
          obj.classList.remove('is-stale');
          obj.innerHTML = RS.highlight(RS.printValue(value));
          const c = countTree(value);
          countEl.textContent = `${c.el} ელემენტი · ${c.text} ტექსტი · ${c.comp} კომპონენტი · DOM: 0`;
          status.className = 'jl-ok';
          status.textContent = 'compile — წარმატებით. ეს კოდი ახლა შესრულდა.';
        };

        let t = null;
        const ed = RS.editor(el.querySelector('[data-ed]'), {
          value: RS.state.cardJsx || initial,
          label: 'JSX',
          onChange: (v) => { clearTimeout(t); t = setTimeout(() => run(v), 140); },
        });
        run(ed.value);
        el.querySelector('[data-reset]').addEventListener('click', () => { ed.value = initial; run(initial); });
        return () => clearTimeout(t);
      },
    },
  });
})();
