// 08 · The result: the full Trattoria app on our own React, editable (Ctrl + Enter recompiles it with our
// compiler and remounts it on our library). Plus an honest list of what the real React adds.
(function () {
  const { icons } = RS;

  function download() {
    const blob = new Blob([RS.lib.standalone()], { type: 'text/javascript' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'mini-react.js';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    RS.toast('<span class="mono">mini-react.js</span> ჩამოიტვირთა — თქვენი პირველი React.');
  }

  RS.chapters.push({
    id: 'finale',
    short: 'შედეგი',
    kicker: '08 · შედეგი',
    get title() { return `ჩვენი React — ${RS.loc(RS.lib.source(RS.lib.latest))} ხაზი`; },
    tocTitle: 'ჩვენი React და ნამდვილი React',
    lead: 'JSX compiler, virtual DOM, render, reconciliation, hooks, batching და key — ყველაფერი, რაც ამ გვერდზე ნახეთ. მარცხნივ სრული აპია, ჩვენს React-ზე. შეცვალეთ და დააჭირეთ <kbd>Ctrl</kbd> + <kbd>Enter</kbd>: ჩვენი compiler თავიდან ააგებს, ჩვენი ბიბლიოთეკა თავიდან დაამონტაჟებს.',
    tryit: [
      'header-ში დაამატეთ <span class="mono">{count > 2 ? \' · გმადლობთ!\' : \'\'}</span> და გაუშვით.',
      'წაშალეთ <span class="mono">key={p.id}</span>, გაზარდეთ ერთი ბარათის რაოდენობა და მოძებნეთ რამე — ვისთან წავიდა qty?',
      'ჩამოტვირთეთ <span class="mono">mini-react.js</span> და გამოიყენეთ საკუთარ პროექტში.',
    ],
    code: [
      { label: 'app.jsx — შეცვალეთ', source: 'app-full', editor: true, onRun: (value, ctx) => ctx.run?.(value) },
      { label: 'mini-react.js', lib: 7, diff: false },
    ],
    lab: {
      title: 'Trattoria — ჩვენს React-ზე',
      controls: `
        <button class="btn" data-restore>${icons.reset}საწყისი კოდი</button>
        <button class="btn" data-download>${icons.download}mini-react.js</button>
        <button class="btn btn--solid" data-run>${icons.play}გაშვება</button>`,
      html: () => RS.appLabHTML({
        tree: false,
        cls: 'al--finale',
        side: `
          <section class="panel al-side">
            <header class="panel-h"><span>ჩვენი React და ნამდვილი</span></header>
            <div class="stats">
              <div><b data-loc></b><span>ხაზი — mini-react.js</span></div>
              <div><b data-app-loc></b><span>ხაზი — აპი, JSX-ით</span></div>
              <div><b>0</b><span>გარე ბიბლიოთეკა</span></div>
            </div>
            <ul class="more">
              <li><span><b>Fiber</b> — render-ი პატარა ნაწილებად იყოფა და შეიძლება შეჩერდეს: დიდი სია გვერდს არ ყინავს.</span></li>
              <li><span><b>Scheduler და concurrent rendering</b> — რა არის სასწრაფო (აკრეფა) და რა მოიცდის (ფილტრი).</span></li>
              <li><span><b>useEffect, useRef, useMemo, context</b> — გვერდითი ეფექტები, მითითებები, დამახსოვრება, გაზიარებული მონაცემი.</span></li>
              <li><span><b>Event delegation</b> — ერთი listener root-ზე, ათასობით ღილაკის ნაცვლად.</span></li>
              <li><span><b>ჭკვიანი reconciliation</b> — სიის გადაადგილების ოპტიმალური ალგორითმი, Fragment, Portal.</span></li>
              <li><span><b>SSR და hydration</b> — სერვერზე აწყობილი HTML, რომელსაც ბრაუზერი "აცოცხლებს" (Next.js).</span></li>
              <li><span><b>DevTools, Error Boundary, StrictMode</b> — და ათწლეულის edge case-ები.</span></li>
            </ul>
            <p class="closing">React არ არის მაგია. ეს არის ერთი იდეა — <b>UI = f(state)</b> — და კარგად დაწერილი reconciliation. ახლა თქვენც იცით, როგორ მუშაობს შიგნიდან.</p>
          </section>`,
      }),
      mount(el, ctx) {
        const lab = RS.appLab(el, { version: RS.lib.latest, source: RS.source('app-full'), products: RS.PRODUCTS });
        el.querySelector('[data-loc]').textContent = RS.loc(RS.lib.source(RS.lib.latest));
        const appLoc = el.querySelector('[data-app-loc]');
        appLoc.textContent = RS.loc(RS.source('app-full'));
        ctx.run = (value) => {
          const ok = lab.remount({ source: value, resetMeter: false });
          appLoc.textContent = RS.loc(value);
          RS.toast(ok ? 'აპი თავიდან აიგო ჩვენი compiler-ით და დამონტაჟდა ჩვენს React-ზე.' : '<b>შეცდომა</b> — ნახეთ ეკრანზე.');
        };
        el.querySelector('[data-run]').addEventListener('click', () => ctx.run(ctx.editor ? ctx.editor.value : RS.source('app-full')));
        el.querySelector('[data-restore]').addEventListener('click', () => {
          ctx.chapter.code[0].value = undefined;
          if (ctx.editor) ctx.editor.value = RS.source('app-full');
          lab.remount({ source: RS.source('app-full') });
          appLoc.textContent = RS.loc(RS.source('app-full'));
        });
        el.querySelector('[data-download]').addEventListener('click', download);
        return () => lab.destroy();
      },
    },
  });
})();
