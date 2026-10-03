// Line diff (longest common subsequence) — shows what each chapter adds to mini-react.js.
(function () {
  RS.diffLines = function diffLines(a, b) {
    const n = a.length;
    const m = b.length;
    const dp = Array.from({ length: n + 1 }, () => new Uint16Array(m + 1));
    for (let i = n - 1; i >= 0; i -= 1) {
      for (let j = m - 1; j >= 0; j -= 1) {
        dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
      }
    }
    const out = [];
    let i = 0;
    let j = 0;
    while (i < n && j < m) {
      if (a[i] === b[j]) { out.push({ type: 'same', text: b[j] }); i += 1; j += 1; }
      else if (dp[i + 1][j] >= dp[i][j + 1]) { out.push({ type: 'del', text: a[i] }); i += 1; }
      else { out.push({ type: 'add', text: b[j] }); j += 1; }
    }
    while (i < n) out.push({ type: 'del', text: a[i++] });
    while (j < m) out.push({ type: 'add', text: b[j++] });
    // a blank line on its own is never news
    out.forEach((l) => { if (l.type === 'add' && !l.text.trim()) l.type = 'same'; });
    return out.filter((l) => !(l.type === 'del' && !l.text.trim()));
  };
})();
