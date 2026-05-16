import { promises as fs } from 'fs';
import * as path from 'path';

const DEFAULT_EXCLUDES = new Set([
  '.git',
  '.hg',
  '.svn',
  'node_modules',
  'dist',
  'build',
  'out',
  'coverage',
  '.dart_tool',
  '.venv',
  'venv',
  '__pycache__',
  '.pytest_cache'
]);

export async function pathExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function readTextIfExists(filePath: string): Promise<string | null> {
  try {
    return await fs.readFile(filePath, 'utf8');
  } catch {
    return null;
  }
}

export async function readJsonIfExists<T = unknown>(filePath: string): Promise<T | null> {
  const text = await readTextIfExists(filePath);
  if (!text) {
    return null;
  }
  return JSON.parse(text) as T;
}

export async function walkFiles(
  rootPath: string,
  options: { maxFiles?: number; include?: (filePath: string) => boolean } = {}
): Promise<string[]> {
  const maxFiles = options.maxFiles ?? 8000;
  const files: string[] = [];

  async function walk(current: string): Promise<void> {
    if (files.length >= maxFiles) {
      return;
    }

    let entries;
    try {
      entries = await fs.readdir(current, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      if (files.length >= maxFiles || DEFAULT_EXCLUDES.has(entry.name)) {
        continue;
      }

      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        await walk(fullPath);
      } else if (!options.include || options.include(fullPath)) {
        files.push(fullPath);
      }
    }
  }

  await walk(rootPath);
  return files;
}

export async function findUp(fileName: string, startPath: string, stopPath: string): Promise<string | null> {
  let current = startPath;
  while (current.startsWith(stopPath)) {
    const candidate = path.join(current, fileName);
    if (await pathExists(candidate)) {
      return candidate;
    }
    const next = path.dirname(current);
    if (next === current) {
      break;
    }
    current = next;
  }
  return null;
}
