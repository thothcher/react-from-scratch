// 06 · Hooks: useState is an array and a cursor. The inspector reads each component's instance, and a
// switch moves one useState into an if — the classic "rules of hooks" bug, live.
(function () {
  const { icons, esc } = RS;
  const BROKEN_LINES = [3, 4, 5];

  const normalSource = () => RS.source('app-hooks');
  const brokenSource = () => normalSource().replace(
    '  const [cart, setCart] = useState(0);\n',
    "  const [cart, setCart] = useState(0);\n  if (cart === 0) {\n    const [hint] = useState('კალათა ცარიელია');   // წესის დარღვევა!\n  }\n",
  );

  /** useState names inside App(), in source order; the ones inside an if are "conditional". */
  function hookLabels(src) {
    const app = src.slice(src.indexOf('function App'), src.indexOf('\nfunction ', src.indexOf('function App') + 1));
    const out = [];
    const re = /^(\s*)const \[(\w+)[^\]]*\]\s*=\s*useState/gm;
    let m;
    while ((m = re.exec(app))) out.push({ name: m[2], conditional: m[1].length > 2 });
    return out;
  }

  const fmt = (v) => esc(RS.shortValue(v));

  RS.chapters.push({
    id: 'hooks',
    short: 'hooks',
    kicker: '06 · HOOKS',
    title: 'useState = მასივი + რიგითი ნომერი',
    tocTitle: 'useState = მასივი + რიგითი ნომერი',
    lead: 'ყოველ კომპონენტს თავისი <b>ინსტანსი</b> აქვს — ობიექტი <span class="mono">hooks</span> მასივით. <span class="mono">useState</span> ყოველ render-ზე შემდეგ უჯრას იღებს: პირველი გამოძახება → [0], მეორე → [1]. ცვლადების სახელები React-მა არ იცის — მხოლოდ <b>რიგი</b>. აქედან მოდის წესი: hook-ი არასდროს <span class="mono">if</span>-ში.',
    tryit: [
      '+ / − ბარათებზე: თითო ბარათს საკუთარი ინსტანსი და საკუთარი უჯრა აქვს.',
      '<b>+3</b> header-ში: სამი <span class="mono">setState</span> → ერთი render (batching). უყურეთ render-ის მრიცხველს.',
      'ჩართეთ <b>წესის დარღვევა</b>, შემდეგ დააჭირეთ <b>Add</b>-ს — და ნახეთ, რა ჩაიწერება ძიების ველში.',
    ],
    code: [
      { label: 'mini-react.js', lib: 6 },
      { label: 'app.jsx', source: 'app-hooks' },
    ],
    lab: {
      title: 'Trattoria — mini-react v0.6',
      controls: `
        <label class="switch switch--danger"><input type="checkbox" data-break><span>წესის დარღვევა: useState if-ში</span></label>
        <button class="btn" data-reset>${icons.reset}თავიდან</button>`,
      html: () => RS.appLabHTML({
        tree: false,
        cls: 'al--hooks',
        side: `
          <section class="panel al-side">
            <header class="panel-h"><span>hooks — კომპონენტების ინსტანსები</span><span class="mono muted" data-hk-sum></span></header>
            <div class="hk" data-hooks></div>
            <p class="hk-legend">უჯრები ციმციმებს რიგით — ზუსტად ისე, როგორც <span class="mono">cursor</span> გადის მათზე ყოველ render-ზე.</p>
          </section>`,
      }),
      mount(el, ctx) {
        const hooksEl = el.querySelector('[data-hooks]');
        const sumEl = el.querySelector('[data-hk-sum]');
        let broken = false;
        let owners = null;

        function paintHooks(lab) {
          const r = lab.root();
          if (!r || !r.v) return;
          const list = RS.instances(r.v);
          const labels = hookLabels(broken ? brokenSource() : normalSource());
          const html = [];
          const app = list.find((x) => x.name === 'App');
          if (app && app.instance) {
            const inst = app.instance;
            const calls = inst.cursor;
            const now = calls >= labels.length ? labels : labels.filter((l) => !l.conditional);
            if (!owners) owners = now.map((l) => l.name);
            let wrong = null;
            const cells = inst.hooks.map((val, i) => {
              const label = i < calls ? (now[i] ? now[i].name : '?') : null;
              const isWrong = label && owners[i] && owners[i] !== label;
              if (isWrong && !wrong) wrong = { label, owner: owners[i], i };
              return `<div class="hk-cell${isWrong ? ' is-wrong' : ''}${label ? '' : ' is-orphan'}" style="--i:${i}">
                <span class="hk-slot">[${i}] <b>${label || 'ობოლი'}</b>${isWrong ? ` ← ${owners[i]}-ის უჯრა` : ''}</span>
                <span class="hk-val">${fmt(val)}</span></div>`;
            }).join('');
            html.push(`<div class="hk-comp">
              <div class="hk-head"><span class="hk-name">&lt;App&gt;</span><span>useState ×${calls} ამ render-ზე</span><span class="hk-sub">render #${lab.renders}</span></div>
              <div class="hk-cells">${cells}</div>
              ${wrong ? `<p class="hk-warn"><b>${wrong.label}</b> კითხულობს უჯრა [${wrong.i}]-ს, რომელიც <b>${wrong.owner}</b>-ს ეკუთვნოდა. if-მა ერთი გამოძახება გამოტოვა — და ყველა შემდეგი hook ერთით აიწია.</p>` : ''}
            </div>`);
          }
          const cards = list.filter((x) => x.name === 'Card' && x.instance);
          if (cards.length) {
            html.push(`<div class="hk-comp">
              <div class="hk-head"><span class="hk-name">&lt;Card&gt; ×${cards.length}</span><span>თითოეულს — თავისი ინსტანსი</span></div>
              <div class="hk-list">${cards.map((c) => `<div class="hk-mini"><span>${esc(c.v.props.p.name)}</span><span>[0] qty = <b>${fmt(c.instance.hooks[0])}</b></span></div>`).join('')}</div>
            </div>`);
          }
          const plain = list.filter((x) => x.instance && !x.instance.hooks.length).map((x) => x.name);
          if (plain.length) html.push(`<p class="hk-legend">hook-ების გარეშე: ${[...new Set(plain)].map((n) => `&lt;${n}&gt;`).join(', ')} — ინსტანსი აქვთ, მასივი ცარიელია.</p>`);
          hooksEl.innerHTML = html.join('');
          const total = list.reduce((s, x) => s + (x.instance ? x.instance.hooks.length : 0), 0);
          sumEl.textContent = `${list.length} ინსტანსი · ${total} უჯრა`;
        }

        const lab = RS.appLab(el, { version: 6, source: normalSource(), onRender: paintHooks });
        paintHooks(lab);

        const codeTab = ctx.chapter.code[1];
        el.querySelector('[data-break]').addEventListener('change', (e) => {
          broken = e.target.checked;
          owners = null;
          codeTab.text = broken ? brokenSource : null;
          codeTab.mark = broken ? BROKEN_LINES : null;
          lab.remount({ source: broken ? brokenSource() : normalSource() });
          paintHooks(lab);
          ctx.selectTab?.(1);
          if (broken) RS.toast('წესი დაირღვა: <span class="mono">useState</span> ახლა <span class="mono">if</span>-შია. დააჭირეთ <b>Add</b>-ს.');
        });
        el.querySelector('[data-reset]').addEventListener('click', () => { owners = null; lab.remount(); paintHooks(lab); });
        return () => {
          codeTab.text = null;
          codeTab.mark = null;
          lab.destroy();
        };
      },
    },
  });
})();
