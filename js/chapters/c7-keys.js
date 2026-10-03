// 07 · key. Each Row has its own state (liked). Without keys, patchChildren matches by position — remove the
// first row and every instance silently inherits its neighbour's product. The table makes the swap visible.
(function () {
  const { icons, esc } = RS;
  const keyLine = () => RS.source('app-keys').split('\n').findIndex((l) => l.includes('key={KEYS')) + 1;

  RS.chapters.push({
    id: 'keys',
    short: 'key',
    kicker: '07 · KEY',
    title: 'key: ვინ ვინაა სიაში',
    tocTitle: 'ვინ ვინაა სიაში',
    lead: 'key-ის გარეშე <span class="mono">patchChildren</span> შვილებს <b>პოზიციით</b> ადარებს: 0↔0, 1↔1. წაშალეთ პირველი — და ყოველი კომპონენტი მეზობლის state-ს "მიიღებს", რადგან მისი ინსტანსი იმავე ადგილას დარჩა. <span class="mono">key={p.id}</span>-ით შედარება <b>ვინაობით</b> ხდება: ინსტანსი თავის პროდუქტს მიჰყვება.',
    tryit: [
      'მოიწონეთ <b>Margherita</b>, შემდეგ — <b>წაშალე პირველი</b>. ვინ არის ახლა მოწონებული?',
      'ჩართეთ <span class="mono">key={p.id}</span> და გაიმეორეთ.',
      '<b>შეაბრუნე</b> key-ით: DOM კვანძები <b>გადაადგილდება</b> (ცისფერი), თავიდან არაფერი იქმნება.',
    ],
    code: [
      { label: 'mini-react.js', lib: 7 },
      { label: 'app.jsx', source: 'app-keys', mark: () => [keyLine()] },
    ],
    lab: {
      title: 'კალათა — mini-react v0.7',
      controls: `
        <label class="switch"><input type="checkbox" data-keys><span class="mono">key={p.id}</span></label>
        <button class="btn" data-reset>${icons.reset}თავიდან</button>`,
      html: () => RS.appLabHTML({
        tree: false,
        cls: 'al--hooks al--keys',
        side: `
          <section class="panel al-side">
            <header class="panel-h"><span>ინსტანსები — ვის ეკუთვნის state</span><span class="mono muted" data-mode></span></header>
            <div class="panel-b">
              <table class="it">
                <thead><tr><th>#</th><th>ეკრანზე</th><th>ინსტანსი</th><th>დაიბადა</th><th>liked</th></tr></thead>
                <tbody data-rows></tbody>
              </table>
              <p class="side-note" style="padding-top:.8rem" data-explain></p>
            </div>
          </section>`,
      }),
      mount(el) {
        const rowsEl = el.querySelector('[data-rows]');
        const explain = el.querySelector('[data-explain]');
        const modeEl = el.querySelector('[data-mode]');
        let keys = false;
        let ids = new WeakMap();
        let next = 1;

        function paint(lab) {
          const r = lab.root();
          if (!r || !r.v) return;
          const rows = RS.instances(r.v).filter((x) => x.name === 'Row' && x.instance);
          let mismatch = 0;
          rowsEl.innerHTML = rows.map((x, i) => {
            if (!ids.has(x.instance)) ids.set(x.instance, { id: next++, born: x.v.props.p.name });
            const meta = ids.get(x.instance);
            const own = meta.born === x.v.props.p.name;
            const liked = x.instance.hooks[0];
            if (!own && liked) mismatch += 1;
            const wrong = !own && liked;
            return `<tr class="${wrong ? 'is-wrong' : ''}">
              <td>${i}</td><td>${esc(x.v.props.p.name)}</td><td class="inst">#${meta.id}</td><td>${esc(meta.born)}</td>
              <td class="${liked ? 'liked' : ''}">${liked}${wrong ? ' <span class="flag">← სხვისი!</span>' : ''}</td></tr>`;
          }).join('');
          modeEl.textContent = keys ? 'შედარება: key' : 'შედარება: პოზიცია';
          explain.innerHTML = mismatch
            ? `<b>${mismatch} ბარათი სხვის მოწონებას აჩვენებს.</b> ინსტანსი #${ids.get(rows.find((x) => ids.get(x.instance).born !== x.v.props.p.name && x.instance.hooks[0]).instance).id} დაიბადა სხვა პიცისთვის, მაგრამ პოზიციამ იგი სხვას მიაკუთვნა.`
            : keys
              ? '<b>key ჩართულია:</b> ყოველი ინსტანსი თავის პროდუქტთან ერთად მოძრაობს — წაშლისას ქრება, შებრუნებისას გადაადგილდება.'
              : '<b>key გამორთულია:</b> React ბარათებს მხოლოდ რიგით ცნობს. სცადეთ: მოიწონეთ პირველი, შემდეგ წაშალეთ.';
        }

        const lab = RS.appLab(el, { version: 7, source: RS.source('app-keys'), scope: { KEYS: false }, products: RS.PRODUCTS, onRender: paint });
        paint(lab);
        const restart = () => {
          ids = new WeakMap();
          next = 1;
          lab.remount({ scope: { KEYS: keys } });
          paint(lab);
        };
        el.querySelector('[data-keys]').addEventListener('change', (e) => { keys = e.target.checked; restart(); });
        el.querySelector('[data-reset]').addEventListener('click', restart);
        return () => lab.destroy();
      },
    },
  });
})();
