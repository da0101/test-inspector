import { promises as fs } from 'fs';
import * as path from 'path';
import type { TestFile, TestProject } from '../models';
import { isSourceFile, normalizePath } from '../utils/path';
import { jsModuleSpecifiers } from './jsStatic';

export async function buildRelatedTestsByImportGraph(
  project: TestProject,
  tests: TestFile[]
): Promise<Map<string, string[]>> {
  const graph = new Map<string, string[]>();
  const related = new Map<string, Set<string>>();

  for (const test of tests.filter((item) => item.projectId === project.id)) {
    const text = await fs.readFile(test.path, 'utf8').catch(() => '');
    const roots: string[] = [];
    for (const specifier of jsModuleSpecifiers(text)) {
      const resolved = await resolveImport(project, test.path, specifier);
      if (resolved) roots.push(resolved);
    }
    for (const root of roots) {
      const reached = await reachableSources(project, root, graph);
      for (const sourcePath of reached) {
        const bucket = related.get(sourcePath) ?? new Set<string>();
        bucket.add(test.path);
        related.set(sourcePath, bucket);
      }
    }
  }

  return new Map([...related.entries()].map(([sourcePath, testPaths]) => [sourcePath, [...testPaths].sort()]));
}

async function reachableSources(
  project: TestProject,
  start: string,
  graph: Map<string, string[]>,
  seen = new Set<string>()
): Promise<Set<string>> {
  if (seen.has(start)) return seen;
  seen.add(start);
  const next = await importsForSource(project, start, graph);
  for (const imported of next) {
    await reachableSources(project, imported, graph, seen);
  }
  return seen;
}

async function importsForSource(project: TestProject, sourcePath: string, graph: Map<string, string[]>): Promise<string[]> {
  const cached = graph.get(sourcePath);
  if (cached) return cached;
  const text = await fs.readFile(sourcePath, 'utf8').catch(() => '');
  const imports: string[] = [];
  for (const specifier of jsModuleSpecifiers(text)) {
    const resolved = await resolveImport(project, sourcePath, specifier);
    if (resolved) imports.push(resolved);
  }
  const unique = [...new Set(imports)].sort();
  graph.set(sourcePath, unique);
  return unique;
}

async function resolveImport(project: TestProject, fromFile: string, specifier: string): Promise<string | null> {
  if (!specifier.startsWith('.') && !specifier.startsWith('@/')) return null;
  const base =
    specifier.startsWith('@/')
      ? path.join(project.rootPath, 'src', specifier.slice(2))
      : path.resolve(path.dirname(fromFile), specifier);
  const candidates = [
    base,
    `${base}.ts`,
    `${base}.tsx`,
    `${base}.js`,
    `${base}.jsx`,
    `${base}.py`,
    `${base}.dart`,
    path.join(base, 'index.ts'),
    path.join(base, 'index.tsx'),
    path.join(base, 'index.js'),
    path.join(base, 'index.jsx')
  ];
  for (const candidate of candidates) {
    if (!isInsideProject(project.rootPath, candidate)) continue;
    try {
      const stat = await fs.stat(candidate);
      if (stat.isFile() && isSourceFile(candidate)) {
        return candidate;
      }
    } catch {
      // Try next candidate.
    }
  }
  return null;
}

function isInsideProject(rootPath: string, candidate: string): boolean {
  const relative = path.relative(rootPath, candidate);
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
}
