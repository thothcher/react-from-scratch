// A code editor in ~60 lines: a transparent <textarea> over a highlighted <pre>, scrolled together.
(function () {
  RS.editor = function editor(host, { value = '', onChange, onRun, label = 'კოდი' } = {}) {
    host.classList.add('ed');
    host.innerHTML = `
      <pre class="ed-hl" aria-hidden="true"><code></code></pre>
      <textarea class="ed-ta" spellcheck="false" autocapitalize="off" autocomplete="off" autocorrect="off" wrap="off" aria-label="${RS.esc(label)}"></textarea>`;
    const ta = host.querySelector('textarea');
    const pre = host.querySelector('pre');
    const code = host.querySelector('code');

    const paint = () => { code.innerHTML = `${RS.highlight(ta.value)}\n`; };
    const sync = () => { pre.scrollTop = ta.scrollTop; pre.scrollLeft = ta.scrollLeft; };
    const insert = (text) => {
      ta.focus();
      // execCommand keeps the browser's undo history; setRangeText is the fallback
      if (!document.execCommand('insertText', false, text)) {
        ta.setRangeText(text, ta.selectionStart, ta.selectionEnd, 'end');
        ta.dispatchEvent(new Event('input'));
      }
    };

    ta.value = value;
    paint();
    ta.addEventListener('input', () => { paint(); sync(); onChange?.(ta.value); });
    ta.addEventListener('scroll', sync);
    ta.addEventListener('keydown', (e) => {
      if (e.key === 'Tab' && !e.shiftKey) { e.preventDefault(); insert('  '); return; }
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); onRun?.(ta.value); return; }
      if (e.key === 'Enter') {
        // keep the indentation of the current line
        const lineStart = ta.value.lastIndexOf('\n', ta.selectionStart - 1) + 1;
        const indent = /^\s*/.exec(ta.value.slice(lineStart, ta.selectionStart))[0];
        const before = ta.value.slice(lineStart, ta.selectionStart).trimEnd();
        const extra = /[({[>]$/.test(before) && !/<\/[^>]*>$/.test(before) && !/\/>$/.test(before) ? '  ' : '';
        e.preventDefault();
        insert(`\n${indent}${extra}`);
      }
    });

    return {
      el: ta,
      get value() { return ta.value; },
      set value(v) { ta.value = v; paint(); sync(); },
      focus() { ta.focus(); },
    };
  };
})();
