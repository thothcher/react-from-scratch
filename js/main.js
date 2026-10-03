// Navigation, chapter layout and the code panel (with the per-chapter diff of mini-react.js).
(function () {
  const { $, esc, icons, chapters } = RS;
  const stage = $('#stage');
  const progress = $('#progress');
  const count = $('#count');
  let index = -1;
  let cleanup = null;

  // ---------------------------------------------------------------- toast
  RS.toast = function toast(html) {
    document.querySelectorAll('.toast').forEach((t) => t.remove());
    const t = RS.html(`<div class="toast" role="status">${html}</div>`);
    document.body.appendChild(t);
    t.addEventListener('animationend', () => t.remove());
  };
  window.addEventListener('error', (e) => {
    if (!e.message) return;
    RS.toast(`<b>შეცდომა:</b> ${esc(e.message.replace(/^Uncaught\s+/, ''))}`);
  });

  // ---------------------------------------------------------------- code panel
  function codeLines(lines) {
    let n = 0;
    return lines.map((l) => {
      const num = l.type === 'del' ? '' : String(++n);
      const sign = l.type === 'add' ? '+' : l.type === 'del' ? '−' : '';
      return `<div class="cl is-${l.type}${l.mark ? ' is-mark' : ''}"><span class="cl-n">${num}</span><span class="cl-s">${sign}</span><span class="cl-c">${RS.highlight(l.text) || ' '}</span></div>`;
    }).join('');
  }

  function renderTab(panel, tab, ctx) {
    const body = panel.querySelector('.cp-body');
    const meta = panel.querySelector('.cp-meta');
    body.scrollTop = 0;
    body.scrollLeft = 0;
    ctx.editor = null;
    if (tab.editor) {
      body.innerHTML = '<div class="cp-ed"></div>';
      const host = body.firstElementChild;
      host.style.height = '100%';
      ctx.editor = RS.editor(host, { value: tab.value ?? RS.source(tab.source), onChange: (v) => { tab.value = v; }, onRun: tab.onRun ? (v) => tab.onRun(v, ctx) : undefined, label: tab.label });
      meta.innerHTML = `<span>რედაქტირებადი · <kbd>Ctrl</kbd> + <kbd>Enter</kbd> — გაშვება</span>`;
      return;
    }
    let lines;
    if (tab.lib) {
      const src = RS.lib.source(tab.lib);
      const prevV = tab.diff === false ? null : tab.lib - 1;
      if (prevV && RS.lib.VERSIONS[prevV]) {
        lines = RS.diffLines(RS.lib.source(prevV).split('\n'), src.split('\n'));
      } else {
        lines = src.split('\n').map((text) => ({ type: 'same', text }));
      }
      const added = lines.filter((l) => l.type === 'add').length;
      const removed = lines.filter((l) => l.type === 'del').length;
      meta.innerHTML = `
        <span>${RS.lib.label(tab.lib)} · ${RS.loc(src)} ხაზი</span>
        ${added || removed ? `<span><span class="plus">+${added}</span> <span class="minus">−${removed}</span></span>` : ''}
        <span class="cp-live">ეს კოდი ამ გვერდზე მუშაობს</span>`;
    } else {
      const src = tab.text ? tab.text() : RS.source(tab.source);
      const marks = new Set((typeof tab.mark === 'function' ? tab.mark() : tab.mark) || []);
      lines = src.split('\n').map((text, i) => ({ type: 'same', text, mark: marks.has(i + 1) }));
      meta.innerHTML = `<span>${RS.loc(src)} ხაზი</span>${tab.live === false ? '' : '<span class="cp-live">ეს კოდი ამ გვერდზე მუშაობს</span>'}`;
    }
    body.innerHTML = `<div class="code">${codeLines(lines)}</div>`;
    const first = body.querySelector('.cl.is-add, .cl.is-del, .cl.is-mark');
    if (first) requestAnimationFrame(() => { body.scrollTop = Math.max(0, first.offsetTop - body.clientHeight * 0.25); });
  }

  function codePanel(tabs, ctx) {
    const panel = RS.html(`
      <section class="codepanel" aria-label="კოდი">
        <div class="cp-tabs" role="tablist">
          ${tabs.map((t, i) => `<button class="cp-tab${i === 0 ? ' is-on' : ''}" role="tab" data-tab="${i}">${esc(t.label)}</button>`).join('')}
          <span class="cp-meta"></span>
        </div>
        <div class="cp-body"></div>
      </section>`);
    const select = (i) => {
      panel.querySelectorAll('.cp-tab').forEach((b, k) => b.classList.toggle('is-on', k === i));
      renderTab(panel, tabs[i], ctx);
    };
    panel.querySelector('.cp-tabs').addEventListener('click', (e) => {
      const b = e.target.closest('[data-tab]');
      if (b) select(Number(b.dataset.tab));
    });
    ctx.selectTab = select;
    return panel;
  }

  // ---------------------------------------------------------------- chapters

  function render(ch, dir) {
    const ctx = { chapter: ch, editor: null };
    if (ch.render) {
      const el = RS.html(ch.render());
      stage.replaceChildren(el);
      return ch.mount?.(el, ctx);
    }
    const el = RS.html(`
      <article class="chapter${dir < 0 ? ' is-back' : ''}" data-ch="${ch.id}">
        <div class="ch-left">
          <div class="ch-text">
            <p class="kicker">${esc(ch.kicker)}</p>
            <h1 class="ch-title">${ch.title}</h1>
            <p class="ch-lead">${ch.lead}</p>
            ${ch.tryit ? `<p class="try-h">სცადეთ</p><ol class="try">${ch.tryit.map((t) => `<li>${t}</li>`).join('')}</ol>` : ''}
          </div>
        </div>
        <div class="ch-right">
          <div class="lab">
            <div class="lab-bar"><span class="lab-label">ლაბორატორია</span><span class="lab-title">${ch.lab.title}</span>${ch.lab.controls || ''}</div>
            <div class="lab-body">${ch.lab.html()}</div>
          </div>
        </div>
      </article>`);
    if (ch.code) el.querySelector('.ch-left').appendChild(codePanel(ch.code, ctx));
    stage.replaceChildren(el);
    ctx.selectTab?.(0);
    return ch.lab.mount?.(el.querySelector('.lab'), ctx);
  }

  function go(i, { replace = false } = {}) {
    i = Math.max(0, Math.min(chapters.length - 1, i));
    if (i === index) return;
    const dir = i > index ? 1 : -1;
    try { cleanup?.(); } catch (e) { console.error(e); }
    cleanup = null;
    index = i;
    const ch = chapters[i];
    try { cleanup = render(ch, dir) || null; } catch (e) {
      console.error(e);
      RS.toast(`<b>შეცდომა:</b> ${esc(e.message)}`);
    }
    progress.querySelectorAll('a').forEach((a, k) => {
      a.classList.toggle('is-now', k === i);
      a.classList.toggle('is-done', k < i);
      if (k === i) a.setAttribute('aria-current', 'step'); else a.removeAttribute('aria-current');
    });
    count.textContent = `${String(i).padStart(2, '0')} / ${String(chapters.length - 1).padStart(2, '0')}`;
    document.title = i ? `${ch.short} — React შიგნიდან` : 'React შიგნიდან — ავაწყოთ საკუთარი React';
    const hash = `#/${i}`;
    if (location.hash !== hash) history[replace ? 'replaceState' : 'pushState'](null, '', hash);
  }
  RS.go = go;
  RS.next = () => go(index + 1);
  RS.prev = () => go(index - 1);

  progress.innerHTML = chapters.map((c, i) => `<a href="#/${i}" title="${esc(c.short)}">${i ? `${String(i).padStart(2, '0')} ${esc(c.short)}` : 'შესავალი'}</a>`).join('');
  progress.addEventListener('click', (e) => {
    const a = e.target.closest('a');
    if (!a) return;
    e.preventDefault();
    go([...progress.children].indexOf(a));
  });

  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const t = e.target;
    if (t.closest && t.closest('input, textarea, select, [contenteditable="true"]')) return;
    if (e.key === 'ArrowRight' || e.key === 'PageDown') { e.preventDefault(); RS.next(); }
    else if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); RS.prev(); }
    else if (e.key === 'Home') { e.preventDefault(); go(0); }
    else if (e.key === 'End') { e.preventDefault(); go(chapters.length - 1); }
  });

  const fromHash = () => {
    const m = /^#\/(\d+)/.exec(location.hash);
    return m ? Number(m[1]) : 0;
  };
  window.addEventListener('popstate', () => go(fromHash(), { replace: true }));

  const start = () => go(fromHash(), { replace: true });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(start, start); else start();
})();
