// mini-react.js grows chapter by chapter. Each version is assembled from the <script type="text/x-source">
// blocks in index.html and compiled with new Function — the code on screen is the code that runs.
(function () {
  const VERSIONS = {
    2: ['base', 'h@2', 'toNode'],
    3: ['base', 'h@2', 'toNode', 'dom@3', 'component@3', 'render@3'],
    4: ['base', 'h@2', 'toNode', 'dom@3', 'component@3', 'render@3', 'state@4'],
    5: ['base', 'h@2', 'toNode', 'dom@3', 'component@3', 'render@3', 'state@5', 'patch@5', 'children@5'],
    6: ['base', 'h@2', 'toNode', 'dom@3', 'component@6', 'render@3', 'state@5', 'patch@6', 'children@5', 'hooks@6'],
    7: ['base', 'h@7', 'toNode', 'dom@3', 'component@6', 'render@3', 'state@5', 'patch@6', 'children@7', 'hooks@6'],
  };
  const NAMES = { 2: 'JSX → ობიექტები', 3: 'render', 4: 'state', 5: 'reconciliation', 6: 'hooks', 7: 'key' };
  const EXPORTS = ['h', 'createDom', 'render', 'mount', 'rerender', 'patch', 'useState'];
  const cache = {};

  function source(v) {
    if (!cache[v]) cache[v] = VERSIONS[v].map((b) => RS.source(`lib-${b}`)).join('\n\n');
    return cache[v];
  }

  /** A fresh, isolated copy of mini-react (each lab gets its own root, hooks and queue). */
  function compile(v, src = source(v)) {
    const exportList = EXPORTS.map((n) => `${n}: typeof ${n} === 'function' ? ${n} : undefined`).join(', ');
    // eslint-disable-next-line no-new-func
    const lib = new Function(`${src}\n;return { ${exportList}, getRoot: () => (typeof root === 'undefined' ? null : root) };`)();
    lib.version = v;
    return lib;
  }

  RS.lib = {
    VERSIONS,
    NAMES,
    latest: 7,
    source,
    compile,
    label: (v) => `v0.${v}`,
    /** The final library as a standalone file (for the download button). */
    standalone() {
      return `// mini-react.js — v0.7 · ${RS.loc(source(7))} ხაზი
// "React შიგნიდან" გაკვეთილიდან. JSX-ისთვის: h(type, props, ...children).
// გამოყენება:  mount(App, document.getElementById('app'));

${source(7)}

export { h, render, mount, rerender, useState };
`;
    },
  };
})();
