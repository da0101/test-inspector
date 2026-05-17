export function maskJsCode(text: string): string {
  let out = '';
  let i = 0;
  let mode: 'code' | 'single' | 'double' | 'template' | 'lineComment' | 'blockComment' = 'code';

  while (i < text.length) {
    const c = text[i]!;
    const n = text[i + 1];

    if (mode === 'code') {
      if (c === "'") {
        mode = 'single';
        out += ' ';
      } else if (c === '"') {
        mode = 'double';
        out += ' ';
      } else if (c === '`') {
        mode = 'template';
        out += ' ';
      } else if (c === '/' && n === '/') {
        mode = 'lineComment';
        out += '  ';
        i++;
      } else if (c === '/' && n === '*') {
        mode = 'blockComment';
        out += '  ';
        i++;
      } else {
        out += c;
      }
      i++;
      continue;
    }

    if (mode === 'lineComment') {
      if (c === '\n') {
        mode = 'code';
        out += c;
      } else {
        out += ' ';
      }
      i++;
      continue;
    }

    if (mode === 'blockComment') {
      if (c === '*' && n === '/') {
        mode = 'code';
        out += '  ';
        i += 2;
      } else {
        out += c === '\n' ? '\n' : ' ';
        i++;
      }
      continue;
    }

    const quote = mode === 'single' ? "'" : mode === 'double' ? '"' : '`';
    if (c === '\\') {
      out += ' ';
      if (n !== undefined) {
        out += n === '\n' ? '\n' : ' ';
        i += 2;
      } else {
        i++;
      }
      continue;
    }
    if (c === quote) {
      mode = 'code';
      out += ' ';
    } else {
      out += c === '\n' ? '\n' : ' ';
    }
    i++;
  }

  return out;
}

export function discoverJsTestCalls(text: string): Array<{ name: string; index: number }> {
  const masked = maskJsCode(text);
  const calls: Array<{ name: string; index: number }> = [];
  const regex = /\b(?:it|test)\s*(?:\.\s*(?:only|skip|todo|concurrent))?\s*\(/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(masked))) {
    const openIndex = masked.indexOf('(', match.index);
    const name = readFirstStringArgument(text, openIndex + 1);
    if (name !== null) {
      calls.push({ name, index: match.index });
    }
  }
  return calls;
}

export function hasJsAssertion(text: string): boolean {
  const code = maskJsCode(text);
  return /\bexpect\s*\(/.test(code) ||
    /\bassert(?:\s*\(|\s*\.\s*(?:ok|equal|notEqual|deepEqual|notDeepEqual|strictEqual|notStrictEqual|match|doesNotMatch|throws|rejects|doesNotThrow|doesNotReject|ifError)\s*\()/.test(code) ||
    /\bscreen\.(?:get|find|query)By/.test(code) ||
    /\btoMatch(?:Inline)?Snapshot\s*\(/.test(code);
}

export function hasLocalJsImport(text: string): boolean {
  const masked = maskJsCode(text);
  const importRegex = /\bimport\b/g;
  let match: RegExpExecArray | null;
  while ((match = importRegex.exec(masked))) {
    const statementEnd = statementBoundary(masked, match.index);
    const statement = text.slice(match.index, statementEnd);
    if (/\bfrom\s+['"](?:\.|@\/)/.test(statement) || /\bimport\s+['"](?:\.|@\/)/.test(statement)) {
      return true;
    }
  }
  const requireRegex = /\brequire\s*\(/g;
  while ((match = requireRegex.exec(masked))) {
    const openIndex = masked.indexOf('(', match.index);
    const specifier = readFirstStringArgument(text, openIndex + 1);
    if (specifier?.startsWith('.') || specifier?.startsWith('@/')) {
      return true;
    }
  }
  return false;
}

function readFirstStringArgument(text: string, start: number): string | null {
  let i = start;
  while (/\s/.test(text[i] ?? '')) i++;
  const quote = text[i];
  if (quote !== "'" && quote !== '"' && quote !== '`') {
    return null;
  }
  i++;
  let value = '';
  while (i < text.length) {
    const c = text[i]!;
    if (c === '\\') {
      if (text[i + 1] !== undefined) {
        value += text[i + 1];
        i += 2;
      } else {
        i++;
      }
      continue;
    }
    if (c === quote) {
      return value;
    }
    value += c;
    i++;
  }
  return null;
}

function statementBoundary(text: string, start: number): number {
  const semi = text.indexOf(';', start);
  const line = text.indexOf('\n', start);
  if (semi !== -1) return semi + 1;
  return line === -1 ? text.length : line;
}
