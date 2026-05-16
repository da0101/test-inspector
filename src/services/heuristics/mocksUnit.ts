import * as path from 'node:path';
import type { CaseSignal } from '../caseFile';

const JS_TEST_SUFFIX = /\.(test|spec)\.(ts|tsx|js|jsx)$/;
const PY_TEST_PREFIX = /^test_(.+)\.py$/;
const DART_TEST_SUFFIX = /_test\.dart$/;

function unitNameFromTestPath(testPath: string): string | null {
  const basename = path.basename(testPath);
  if (JS_TEST_SUFFIX.test(basename)) return basename.replace(JS_TEST_SUFFIX, '');
  const pyMatch = basename.match(PY_TEST_PREFIX);
  if (pyMatch && pyMatch[1]) return pyMatch[1];
  if (DART_TEST_SUFFIX.test(basename)) return basename.replace(DART_TEST_SUFFIX, '');
  return null;
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function detectMocksUnitUnderTest(testPath: string, content: string): CaseSignal | null {
  const unit = unitNameFromTestPath(testPath);
  if (!unit) return null;
  const esc = escapeRegExp(unit);
  const jsRegex = new RegExp(`(?:jest|vi)\\.mock\\(['"][^'"\\n]*?\\/${esc}(?:['"]|\\.(?:ts|tsx|js|jsx)['"])`);
  const pyRegex = new RegExp(`@patch\\(['"][^'"\\n]*?\\.${esc}(?:\\.|['"\\s])`);
  if (jsRegex.test(content) || pyRegex.test(content)) {
    return {
      name: 'mocks-unit-under-test',
      weight: 45,
      detail: `Test mocks "${unit}" — the very unit it claims to test. Its assertions can never fail meaningfully.`,
    };
  }
  return null;
}
