import { QualityFinding, TestProject } from '../models';
import { relativePath } from '../utils/path';

export function findFlutterSmells(project: TestProject, filePath: string, text: string): QualityFinding[] {
  const findings: QualityFinding[] = [];
  const trivialDart: Array<[RegExp, string]> = [
    [
      /\bexpect\s*\(\s*[^,()]+?\s*,\s*(?:true|false|null|0|''|""|\[\s*\]|\{\s*\})\s*\)/g,
      "Trivial literal assertion (expect(x, true/false/null/0/empty)); verify a meaningful outcome instead.",
    ],
    [
      /\bexpect\s*\(\s*[^,()]+?\s*,\s*(?:isTrue|isFalse|isNull|isNotNull|isEmpty|isNotEmpty|anything|isMap|isList)\s*\)/g,
      "Trivial matcher assertion (isTrue/isFalse/isNull/anything); verify a specific observable outcome.",
    ],
  ];
  for (const [regex, message] of trivialDart) {
    let match: RegExpExecArray | null;
    while ((match = regex.exec(text))) {
      findings.push(finding(project, 'trivial-assertion', 'warning', filePath, message, lineOf(text, match.index)));
    }
  }

  const widgetTest = /testWidgets?\s*\(\s*['"`]([^'"`]+)['"`]/g;
  const interaction = /\.(?:tap|enterText|drag|longPress|fling|press|sendKeyEvent)\s*\(|tester\.(?:tap|enterText|drag|longPress|fling)\b/;
  const finder = /\bfind\.(?:text|byKey|byType|byIcon|widgetWithText|byTooltip|byWidget)\b/;
  let widgetMatch: RegExpExecArray | null;
  while ((widgetMatch = widgetTest.exec(text))) {
    const body = extractBody(text, widgetMatch.index + widgetMatch[0].length);
    if (!body) continue;
    if (/\bpumpWidget\s*\(/.test(body) && finder.test(body) && !interaction.test(body)) {
      findings.push(
        finding(
          project,
          'weak-test',
          'warning',
          filePath,
          `Render-only widget test "${widgetMatch[1]}" — pumps a widget and checks for elements, but never taps / enters text / drags. It will pass even if the widget is broken.`,
          lineOf(text, widgetMatch.index),
        ),
      );
    }
  }

  const verifyCount = (text.match(/\bverify(?:Never)?\s*\(\s*\(\s*\)\s*=>/g) ?? []).length;
  const expectCount = (text.match(/\bexpect\s*\(/g) ?? []).length;
  if (verifyCount >= 2 && expectCount === 0) {
    findings.push(
      finding(
        project,
        'weak-test',
        'warning',
        filePath,
        `Mock-only test — ${verifyCount} verify(...) calls and zero behavior assertions on returned state, emitted values, or rendered output.`,
      ),
    );
  }

  return findings;
}

function extractBody(text: string, start: number): string | null {
  const braceStart = text.indexOf('{', start);
  if (braceStart === -1) return null;
  let depth = 1;
  let i = braceStart + 1;
  while (i < text.length && depth > 0) {
    const c = text[i];
    if (c === '{') depth++;
    else if (c === '}') depth--;
    i++;
  }
  return depth === 0 ? text.slice(braceStart + 1, i - 1) : null;
}

function finding(
  project: TestProject,
  kind: QualityFinding['kind'],
  severity: QualityFinding['severity'],
  filePath: string,
  message: string,
  line?: number
): QualityFinding {
  const rel = relativePath(project.rootPath, filePath);
  return { id: `${project.id}:${kind}:${rel}:${line ?? 0}`, kind, severity, message, filePath, line };
}

function lineOf(text: string, index: number): number {
  return text.slice(0, index).split(/\r?\n/).length;
}
