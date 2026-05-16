import * as path from 'path';

export function normalizePath(filePath: string): string {
  return filePath.split(path.sep).join('/');
}

export function relativePath(rootPath: string, filePath: string): string {
  return normalizePath(path.relative(rootPath, filePath));
}

export function stableProjectId(framework: string, rootPath: string): string {
  return `${framework}:${normalizePath(rootPath)}`;
}

export function isSourceFile(filePath: string): boolean {
  return /\.(ts|tsx|js|jsx|py|dart)$/.test(filePath) && !isTestFile(filePath);
}

export function isTestFile(filePath: string): boolean {
  const normalized = normalizePath(filePath);
  return (
    /(^|\/)__tests__\//.test(normalized) ||
    /(^|\/)tests?\//.test(normalized) ||
    /\.(test|spec)\.(ts|tsx|js|jsx)$/.test(normalized) ||
    /(^|\/)test_.*\.py$/.test(normalized) ||
    /(^|\/).*_test\.py$/.test(normalized) ||
    /(^|\/)tests\.py$/.test(normalized) ||
    /_test\.dart$/.test(normalized)
  );
}

export function basenameWithoutKnownExtensions(filePath: string): string {
  return path
    .basename(filePath)
    .replace(/\.(test|spec)\.(ts|tsx|js|jsx)$/, '')
    .replace(/_test\.dart$/, '')
    .replace(/^test_/, '')
    .replace(/_test\.py$/, '')
    .replace(/\.(ts|tsx|js|jsx|py|dart)$/, '');
}
