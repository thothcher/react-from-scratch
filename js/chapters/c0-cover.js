// 00 · Cover. The pipeline on the right is not an animation of React — it runs our own compiler and
// mini-react: the JSX is compiled live, h() builds the object, rerender() patches the badge.
(function () {
  const { esc, icons } = RS;
  const JSX = '<i className="badge">{cart}</i>';

  RS.chapters.push({
    id: 'cover',
    short: 'შესავალი',
    render() {
      const lines = RS.loc(RS.lib.source(RS.lib.latest));
      const toc = RS.chapters.slice(1).map((c, i) => `<li><a href="#/${i + 1}"><span>${String(i + 1).padStart(2, '0')}</span><span>${esc(c.short)} — ${c.tocTitle || c.title.replace(/<[^>]+>/g, '')}</span></a></li>`).join('');
      return `
        <section class="cover">
          <div>
            <p class="cv-kicker">ლექციის დანართი · vanilla JavaScript</p>
            <h1 class="cv-title">React <span>შიგნიდან</span></h1>
            <p class="cv-sub">ავაწყოთ <b>საკუთარი React</b> — ნულიდან, ${lines} ხაზში. JSX compiler, virtual DOM, reconciliation, hooks და key: ყველაფერი ამ გვერდზე ცოცხლად მუშაობს, და ყველაფრის გატეხვა შეიძლება.</p>
            <div class="cv-actions">
              <button class="btn btn--solid" data-start>დავიწყოთ ${icons.arrow}</button>
              <span class="cv-hint">ან <kbd>←</kbd> <kbd>→</kbd> ისრები</span>
            </div>
            <p class="cv-meta"><b>ეს გვერდი თავად vanilla JS-ითაა დაწერილი</b> — არც React, არც ბიბლიოთეკა, არც build. კოდის პანელში რასაც ხედავთ, ზუსტად ის სრულდება ლაბორატორიებში.</p>
            <ol class="toc">${toc}</ol>
          </div>
          <div>
            <div class="pipe" aria-label="JSX-დან ეკრანამდე">
              <div class="pipe-step" data-step="0"><span class="pipe-label"><b>JSX</b>ვწერთ ჩვენ</span><pre class="pipe-code" data-jsx></pre></div>
              <div class="pipe-step" data-step="1"><span class="pipe-label"><b>h()</b>compiler</span><pre class="pipe-code" data-js></pre></div>
              <div class="pipe-step" data-step="2"><span class="pipe-label"><b>ობიექტი</b>virtual DOM</span><pre class="pipe-code" data-obj></pre></div>
              <div class="pipe-step" data-step="3"><span class="pipe-label"><b>DOM</b>reconciliation</span><div data-dom></div></div>
            </div>
            <p class="pipe-cap mono" data-cap></p>
          </div>
        </section>`;
    },
    mount(el) {
      el.querySelector('[data-start]').addEventListener('click', () => RS.go(1));
      const steps = [...el.querySelectorAll('.pipe-step')];
      const $ = (s) => el.querySelector(s);
      $('[data-jsx]').innerHTML = RS.highlight(JSX);
      $('[data-js]').innerHTML = RS.highlight(RS.jsx.compile(JSX));

      // a real mini-react app: the header with the badge
      const lib = RS.lib.compile(RS.lib.latest);
      let cart = 3;
      const { h } = lib;
      const Header = () => h('div', { className: 'pipe-dom' }, h('span', null, 'Trattoria'), h('span', null, 'Cart ', h('i', { className: 'badge' }, cart)));
      const host = $('[data-dom]');
      lib.mount(Header, host);

      let ops = 0;
      const mo = new MutationObserver((records) => { ops = records.length; });
      mo.observe(host, { subtree: true, childList: true, characterData: true });

      const paintObj = () => {
        const v = h('i', { className: 'badge' }, cart);
        const text = v.children[0];
        $('[data-obj]').innerHTML = RS.highlight(`{ type: "${v.type}", props: { className: "badge" },\n  children: [{ type: "${text.type}", nodeValue: "`) + `<span class="tick">${cart}</span>` + RS.highlight('" }] }');
      };
      const tick = (s) => {
        const span = s.querySelector('.tick');
        if (span) { span.classList.remove('tick'); void span.offsetWidth; span.classList.add('tick'); }
      };

      let timers = [];
      const cycle = () => {
        cart = cart >= 9 ? 1 : cart + 1;
        steps.forEach((s) => s.classList.remove('is-on'));
        const at = (ms, fn) => timers.push(setTimeout(fn, RS.reducedMotion() ? 0 : ms));
        at(0, () => {
          steps[0].classList.add('is-on');
          $('[data-jsx]').innerHTML = RS.highlight('<i className="badge">{') + `<span class="tick">cart</span>` + RS.highlight('}</i>') + `<span class="t-com">   // cart = ${cart}</span>`;
        });
        at(520, () => { steps[1].classList.add('is-on'); tick(steps[1]); });
        at(1040, () => { steps[2].classList.add('is-on'); paintObj(); });
        at(1560, () => {
          steps[3].classList.add('is-on');
          lib.rerender();
          const badge = host.querySelector('.badge');
          badge.classList.remove('tick'); void badge.offsetWidth; badge.classList.add('tick');
          setTimeout(() => { $('[data-cap]').textContent = `rerender() → DOM-ში შეიცვალა ${ops} ტექსტური კვანძი. დანარჩენი — ხელუხლებელია.`; }, 0);
        });
      };
      paintObj();
      $('[data-cap]').textContent = 'ყოველ 3 წამში: cart + 1 → ახალი ობიექტი → patch().';
      cycle();
      const loop = setInterval(cycle, 3000);
      return () => { clearInterval(loop); timers.forEach(clearTimeout); timers = []; mo.disconnect(); };
    },
  });
})();
