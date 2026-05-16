import type { CaseSignal } from '../caseFile';

const MOCK_ASSERTION = /\bverify(Never)?\s*\(|\.toHaveBeenCalled(With|Times)?\b|\.assert_(?:called|called_with|called_once|not_called|called_once_with)\b|\bexpect\(\s*\w+\s*\)\.toHaveBeenCalled/g;
const ANY_ASSERTION = /\bexpect\(|\bassert\s+|\bassert\.|\bawait\s+expect\(/g;

export function detectMockOnlyAssertions(content: string): CaseSignal | null {
  const mockCount = (content.match(MOCK_ASSERTION) ?? []).length;
  if (mockCount === 0) return null;
  const allAssertions = (content.match(ANY_ASSERTION) ?? []).length;
  const behaviorCount = Math.max(0, allAssertions - mockCount);
  if (mockCount >= 1 && behaviorCount <= 1) {
    return {
      name: 'mock-only-assertions',
      weight: 30,
      detail: `${mockCount} mock-call assertion(s), only ${behaviorCount} behavior assertion(s) — the test passes whether the unit works or is broken`,
    };
  }
  return null;
}
