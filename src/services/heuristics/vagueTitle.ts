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
  // LLM-pattern names surfaced by the Ai-Interior-Design calibration (2026-05-16)
  /^should\s+have\s+\w/i,                  // "should have default values"
  /^should\s+create\s+(state\s+)?(with|on)/i, // "should create state with custom values"
];

// Verbs that signal a concrete action being verified — used to reject false
// positives like "renders the booking flow when the API returns 500" (specific).
const SPECIFIC_VERBS = /\b(rejects?|accepts?|persists?|loads?|saves?|fetches?|throws?|returns?|emits?|navigates?|transitions?|raises?|fails?\s+when|when\s+\w|on\s+\w+\s+error|after\s+\w|before\s+\w)\b/i;

function isVague(name: string): boolean {
  const trimmed = name.trim();
  if (trimmed.length === 0) return true;
  for (const re of VAGUE_PATTERNS) {
    if (re.test(trimmed)) return true;
  }
  // Short titles (<= 5 words) starting with weak verbs + no concrete action verb
  const wordCount = trimmed.split(/\s+/).length;
  if (wordCount <= 5 && /^(renders?|shows?|displays?|emits?|builds?)\s+\w/i.test(trimmed) && !SPECIFIC_VERBS.test(trimmed)) {
    return true;
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
