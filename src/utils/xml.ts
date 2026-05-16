export type XmlNode = {
  name: string;
  attributes: Record<string, string>;
  children: XmlNode[];
  text: string;
};

export function parseXmlLite(xml: string): XmlNode {
  const root: XmlNode = { name: 'root', attributes: {}, children: [], text: '' };
  const stack: XmlNode[] = [root];
  const tokenRe = /<[^>]+>|[^<]+/g;
  let match: RegExpExecArray | null;

  while ((match = tokenRe.exec(xml))) {
    const token = match[0];
    const parent = stack[stack.length - 1];
    if (token.startsWith('<?') || token.startsWith('<!--') || token.startsWith('<!')) {
      continue;
    }
    if (token.startsWith('</')) {
      stack.pop();
      continue;
    }
    if (token.startsWith('<')) {
      const selfClosing = token.endsWith('/>');
      const body = token.slice(1, selfClosing ? -2 : -1).trim();
      const space = body.search(/\s/);
      const name = space === -1 ? body : body.slice(0, space);
      const attrText = space === -1 ? '' : body.slice(space + 1);
      const node: XmlNode = { name, attributes: parseAttributes(attrText), children: [], text: '' };
      parent.children.push(node);
      if (!selfClosing) {
        stack.push(node);
      }
      continue;
    }
    parent.text += decodeXml(token.trim());
  }

  return root;
}

export function findXmlNodes(node: XmlNode, name: string): XmlNode[] {
  const matches: XmlNode[] = [];
  for (const child of node.children) {
    if (child.name === name) {
      matches.push(child);
    }
    matches.push(...findXmlNodes(child, name));
  }
  return matches;
}

function parseAttributes(text: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  const attrRe = /([:\w-]+)\s*=\s*"([^"]*)"/g;
  let match: RegExpExecArray | null;
  while ((match = attrRe.exec(text))) {
    attrs[match[1]] = decodeXml(match[2]);
  }
  return attrs;
}

function decodeXml(text: string): string {
  return text
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}
