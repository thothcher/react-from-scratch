// A tiny JSX compiler: JSX → h(type, props, ...children) calls. Enough for teaching (elements, components,
// "string" and {expression} attributes, {...spread}, nested JSX inside expressions, React's whitespace rules).
// Errors carry a position and a Georgian message, so students can break things and learn from it.
(function () {
  class JsxError extends Error {
    constructor(message, pos) {
      super(message);
      this.pos = pos;
    }
  }

  const isIdStart = (c) => /[A-Za-z_$]/.test(c || '');
  const isIdChar = (c) => /[\w$]/.test(c || '');
  const ENTITIES = { '&nbsp;': ' ', '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'" };
  const decode = (s) => s.replace(/&(nbsp|amp|lt|gt|quot|#39);/g, (m) => ENTITIES[m]);

  /** End index (exclusive) of the string/template literal starting at i. */
  function skipString(src, i) {
    const q = src[i];
    let j = i + 1;
    while (j < src.length) {
      const c = src[j];
      if (c === '\\') { j += 2; continue; }
      if (q === '`' && c === '$' && src[j + 1] === '{') { j = matchBrace(src, j + 1) + 1; continue; }
      if (c === q) return j + 1;
      if (c === '\n' && q !== '`') break;
      j += 1;
    }
    throw new JsxError('სტრიქონი არ დაიხურა', i);
  }

  /** Index of the "}" matching the "{" at i (skips strings and comments). */
  function matchBrace(src, i) {
    let depth = 0;
    for (let j = i; j < src.length; j += 1) {
      const c = src[j];
      if (c === '"' || c === "'" || c === '`') { j = skipString(src, j) - 1; continue; }
      if (c === '/' && src[j + 1] === '/') { j = src.indexOf('\n', j); if (j < 0) break; continue; }
      if (c === '/' && src[j + 1] === '*') { j = src.indexOf('*/', j + 2) + 1; if (j <= 0) break; continue; }
      if (c === '{') depth += 1;
      else if (c === '}') {
        depth -= 1;
        if (depth === 0) return j;
      }
    }
    throw new JsxError('ფიგურული ფრჩხილი { არ დაიხურა', i);
  }

  const skipWs = (src, i) => {
    while (i < src.length && /\s/.test(src[i])) i += 1;
    return i;
  };

  /** Is the "<" at i the start of JSX (and not "less than")? */
  function jsxStarts(src, i, out) {
    if (!isIdStart(src[i + 1]) && src[i + 1] !== '>') return false;
    const prev = out.replace(/\s+$/, '');
    if (!prev) return true;
    if (/(^|[^\w$])return$/.test(prev)) return true;
    const p = prev[prev.length - 1];
    if (p === '>') return prev.endsWith('=>');
    return '(,=:?[{&|!;'.includes(p);
  }

  /** React's JSX text rules: lines are trimmed, blank lines dropped, the rest joined with a space. */
  function jsxText(raw) {
    if (!raw.includes('\n')) return decode(raw);
    const lines = raw.split('\n');
    const parts = lines.map((line, k) => {
      let s = line.replace(/\t/g, ' ');
      if (k > 0) s = s.replace(/^\s+/, '');
      if (k < lines.length - 1) s = s.replace(/\s+$/, '');
      return s;
    }).filter(Boolean);
    return decode(parts.join(' '));
  }

  function parseElement(src, start, base) {
    let i = start + 1;
    const fail = (msg, at = i) => { throw new JsxError(msg, base + at); };
    if (src[i] === '>') fail('Fragment-ი (<>…</>) ამ მინი-compiler-ში არ გვაქვს — გამოიყენეთ <div>', start);

    const readName = () => {
      const s = i;
      while (i < src.length && /[\w$.\-:]/.test(src[i])) i += 1;
      return src.slice(s, i);
    };

    const name = readName();
    if (!name) fail('ტეგის სახელი აკლია', start);
    const node = { name, props: [], children: [] };

    // attributes
    for (;;) {
      i = skipWs(src, i);
      if (i >= src.length) fail(`ტეგი <${name}> არ დასრულდა — აკლია > ან />`, start);
      if (src.startsWith('/>', i)) return { node, end: i + 2 };
      if (src[i] === '>') { i += 1; break; }
      if (src[i] === '{') {
        const e = matchBrace(src, i);
        const inner = src.slice(i + 1, e).trim();
        if (!inner.startsWith('...')) fail('ტეგის შიგნით {…} მხოლოდ {...spread}-ის სახით შეიძლება');
        node.props.push({ spread: compile(inner.slice(3), {}, base + i + 4).trim() });
        i = e + 1;
        continue;
      }
      if (!isIdStart(src[i])) fail(`მოულოდნელი სიმბოლო "${src[i]}" ტეგში <${name}>`);
      const attrStart = i;
      while (i < src.length && /[\w$\-:]/.test(src[i])) i += 1;
      const attr = src.slice(attrStart, i);
      i = skipWs(src, i);
      if (src[i] !== '=') { node.props.push({ name: attr, value: 'true' }); continue; }
      i = skipWs(src, i + 1);
      const q = src[i];
      if (q === '"' || q === "'") {
        const e = src.indexOf(q, i + 1);
        if (e < 0) fail(`${attr}-ის მნიშვნელობა არ დაიხურა`);
        node.props.push({ name: attr, value: JSON.stringify(decode(src.slice(i + 1, e))) });
        i = e + 1;
      } else if (q === '{') {
        const e = matchBrace(src, i);
        const inner = src.slice(i + 1, e);
        if (!inner.trim()) fail(`${attr}={} ცარიელია`);
        node.props.push({ name: attr, value: compile(inner, {}, base + i + 1).trim() });
        i = e + 1;
      } else {
        fail(`${attr}= -ის შემდეგ საჭიროა "ტექსტი" ან {გამოსახულება}`);
      }
    }

    // children
    for (;;) {
      if (i >= src.length) fail(`<${name}> არ დაიხურა — აკლია </${name}>`, start);
      if (src.startsWith('</', i)) {
        const closeAt = i;
        i = skipWs(src, i + 2);
        const close = readName();
        i = skipWs(src, i);
        if (src[i] !== '>') fail(`დახურვის ტეგს </${close}> აკლია >`);
        if (close !== name) fail(`</${close}> არ ემთხვევა <${name}>-ს`, closeAt);
        return { node, end: i + 1 };
      }
      if (src[i] === '<') {
        if (!isIdStart(src[i + 1]) && src[i + 1] !== '>') fail('"<" ტექსტში — დაწერეთ {"<"}');
        const r = parseElement(src, i, base);
        node.children.push(r.node);
        i = r.end;
        continue;
      }
      if (src[i] === '{') {
        const e = matchBrace(src, i);
        const inner = src.slice(i + 1, e);
        if (inner.replace(/\/\*[\s\S]*?\*\//g, '').trim()) node.children.push({ expr: compile(inner, {}, base + i + 1).trim() });
        i = e + 1;
        continue;
      }
      let j = i;
      while (j < src.length && src[j] !== '<' && src[j] !== '{') j += 1;
      const text = jsxText(src.slice(i, j));
      if (text) node.children.push({ text });
      i = j;
    }
  }

  const propKey = (k) => (/^[A-Za-z_$][\w$]*$/.test(k) ? k : JSON.stringify(k));

  function genProps(props) {
    if (!props.length) return 'null';
    return `{ ${props.map((p) => (p.spread ? `...${p.spread}` : `${propKey(p.name)}: ${p.value}`)).join(', ')} }`;
  }

  const genTag = (name) => (/^[a-z][\w-]*$/.test(name) ? JSON.stringify(name) : name);

  function genChild(c, pretty, level) {
    if (c.text !== undefined) return JSON.stringify(c.text);
    if (c.expr !== undefined) return c.expr;
    return pretty ? genPretty(c, level) : genCompact(c);
  }

  function genCompact(node) {
    const args = [genTag(node.name), genProps(node.props), ...node.children.map((c) => genChild(c, false))];
    return `h(${args.join(', ')})`;
  }

  /** Readable output for the JSX lab: short calls stay on one line, longer ones put each child on its own line. */
  function genPretty(node, level) {
    const compact = genCompact(node);
    if (!node.children.length || compact.length + level * 2 <= 58) return compact;
    const pad = '  '.repeat(level + 1);
    const kids = node.children.map((c) => pad + genChild(c, true, level + 1));
    return `h(${genTag(node.name)}, ${genProps(node.props)},\n${kids.join(',\n')}\n${'  '.repeat(level)})`;
  }

  /** Compile a piece of JavaScript that may contain JSX. */
  function compile(src, { pretty = false } = {}, base = 0) {
    let out = '';
    let i = 0;
    while (i < src.length) {
      const c = src[i];
      if (c === '/' && src[i + 1] === '/') {
        const e = src.indexOf('\n', i);
        const end = e < 0 ? src.length : e;
        out += src.slice(i, end);
        i = end;
        continue;
      }
      if (c === '/' && src[i + 1] === '*') {
        const e = src.indexOf('*/', i + 2);
        const end = e < 0 ? src.length : e + 2;
        out += src.slice(i, end);
        i = end;
        continue;
      }
      if (c === '"' || c === "'" || c === '`') {
        let end;
        try { end = skipString(src, i); } catch (err) { err.pos = base + i; throw err; }
        out += src.slice(i, end);
        i = end;
        continue;
      }
      if (c === '<' && jsxStarts(src, i, out)) {
        const { node, end } = parseElement(src, i, base);
        out += pretty ? genPretty(node, 0) : genCompact(node);
        i = end;
        continue;
      }
      out += c;
      i += 1;
    }
    return out;
  }

  /** 1-based line/column of a position. */
  function lineCol(src, pos) {
    const before = src.slice(0, Math.max(0, pos));
    const lines = before.split('\n');
    return { line: lines.length, col: lines[lines.length - 1].length + 1 };
  }

  RS.jsx = {
    compile,
    JsxError,
    lineCol,
    /** Compile, and on error return a friendly { error, line, col }. */
    tryCompile(src, opts) {
      try {
        return { code: compile(src, opts) };
      } catch (e) {
        if (!(e instanceof JsxError)) return { error: e.message, line: null, col: null };
        const { line, col } = lineCol(src, e.pos ?? 0);
        return { error: e.message, line, col };
      }
    },
  };
})();
