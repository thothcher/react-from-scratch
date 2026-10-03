// A small, dependency-free highlighter for JavaScript, JSX and HTML — good enough for teaching code.
(function () {
  const { esc } = RS;
  const KEYWORDS = 'const|let|var|function|return|if|else|for|of|in|new|typeof|while|break|continue|class|this|import|export|default|from|null|undefined|true|false';
  const RE = new RegExp([
    /(\/\/[^\n]*|\/\*[\s\S]*?\*\/|<!--[\s\S]*?-->)/.source, // 1 comment
    /("(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*'|`(?:\\.|[^`\\])*`)/.source, // 2 string
    /(=>|===|!==|&&|\|\||\?\?|\.\.\.)/.source, // 3 operator
    /(<\/?[A-Za-z][\w.-]*|\/>)/.source, // 4 tag
    `\\b(${KEYWORDS})\\b`, // 5 keyword
    /\b(\d+(?:\.\d+)?)\b/.source, // 6 number
    /([A-Za-z_$][\w$]*)(?=\s*\()/.source, // 7 call
    /(\s)([A-Za-z_][\w-]*)(?==)/.source, // 8,9 attribute
  ].join('|'), 'g');

  const CLS = { 1: 'com', 2: 'str', 3: 'op', 4: 'tag', 5: 'kw', 6: 'num', 7: 'fn' };

  RS.highlight = function highlight(code) {
    let out = '';
    let last = 0;
    RE.lastIndex = 0;
    let m;
    while ((m = RE.exec(code))) {
      if (m.index > last) out += esc(code.slice(last, m.index));
      if (m[9] !== undefined) {
        out += esc(m[8]) + `<span class="t-attr">${esc(m[9])}</span>`;
      } else {
        const g = [1, 2, 3, 4, 5, 6, 7].find((k) => m[k] !== undefined);
        out += `<span class="t-${CLS[g]}">${esc(m[0])}</span>`;
      }
      last = RE.lastIndex;
      if (m[0] === '') RE.lastIndex += 1;
    }
    return out + esc(code.slice(last));
  };

  /** Highlight line by line (used where single lines get their own row and markers). */
  RS.highlightLines = (code) => code.split('\n').map((l) => RS.highlight(l));
})();
