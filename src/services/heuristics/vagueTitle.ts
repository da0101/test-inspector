import type { TestCase } from '../../models';
import type { CaseSignal } from '../caseFile';

const VAGUE_PATTERNS: RegExp[] = [
  /^(works?|renders?|shows?|displays?|succeeds?|fails?|basic|default|empty|simple|generic)$/i,
  /^test\s*\d*$/i,
  /^handles?(\s+errors?|\s+it|\s+them)?$/i,
  /^does\s*(it|something|the\s+thing)?$/i,
  /^should\s*(work|render|exist|be|do\s*it|pass|succeed|return)?$/i,
  /^is\s+\w+$/i,
  /^has\s+\w+$/i,
  /^(returns|emits)\s+(true|false|null|undefined|value)$/i,
];

function isVague(name: string): boolean {
  const trimmed = name.trim();
  if (trimmed.length === 0) return true;
  for (const re of VAGUE_PATTERNS) {
    if (re.test(trimmed)) return true;
  }
  return false;
}

export function detectVagueTitles(testCases: TestCase[]): CaseSignal | null {
  if (testCases.length === 0) return null;
  const vague = testCases.filter((c) => isVague(c.name));
  if (vague.length === 0) return null;
  const examples = vague.slice(0, 3).map((c) => `"${c.name.trim()}"`).join(', ');
  const more = vague.length > 3 ? ` (and ${vague.length - 3} more)` : '';
  const firstWithLine = vague.find((c) => c.line !== undefined);
  return {
    name: 'vague-title',
    weight: Math.min(30, 8 * vague.length),
    detail: `${vague.length} of ${testCases.length} test name(s) describe nothing concrete: ${examples}${more}`,
    location: firstWithLine?.line !== undefined ? { file: firstWithLine.filePath, line: firstWithLine.line } : undefined,
  };
}
