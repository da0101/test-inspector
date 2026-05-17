import { execFile } from 'node:child_process';
import { promises as fs } from 'node:fs';
import * as path from 'node:path';
import type { CatalogSource, RepositorySummary, WorktreeSummary } from '../models';
import { pathExists, readTextIfExists } from '../utils/fs';
import { normalizePath } from '../utils/path';

export type CatalogInput = {
  trackedRepoPaths: string[];
  workspaceFolders: string[];
};

type RepoCandidate = {
  path: string;
  source: CatalogSource;
};

export async function discoverRepositoryCatalog(input: CatalogInput): Promise<RepositorySummary[]> {
  const candidates = uniqueCandidates([
    ...input.trackedRepoPaths.map((repoPath) => ({ path: repoPath, source: 'tracked' as const })),
    ...input.workspaceFolders.map((repoPath) => ({ path: repoPath, source: 'workspace' as const }))
  ]);

  const expanded: RepoCandidate[] = [...candidates];
  for (const candidate of candidates.filter((item) => item.source === 'tracked')) {
    expanded.push(...(await discoverAgentboardCandidates(candidate.path)));
  }

  const repos = await Promise.all(uniqueCandidates(expanded).map(summarizeRepository));
  return repos
    .filter((repo): repo is RepositorySummary => repo !== null)
    .sort((a, b) => a.name.localeCompare(b.name) || a.path.localeCompare(b.path));
}

export async function normalizeRepoRoot(inputPath: string): Promise<string | null> {
  try {
    const realPath = await fs.realpath(inputPath);
    const root = await git(realPath, ['rev-parse', '--show-toplevel']);
    return root || null;
  } catch {
    return null;
  }
}

export function parseWorktreePorcelain(raw: string, repoPath: string, source: CatalogSource): WorktreeSummary[] {
  const blocks = raw.trim().split(/\n\n+/).filter(Boolean);
  return blocks
    .map((block, index) => {
      const entries = new Map<string, string>();
      for (const line of block.split(/\r?\n/)) {
        const space = line.indexOf(' ');
        if (space > 0) {
          entries.set(line.slice(0, space), line.slice(space + 1));
        }
      }
      const worktreePath = entries.get('worktree');
      if (!worktreePath) {
        return null;
      }
      const branch = entries.get('branch')?.replace(/^refs\/heads\//, '') ?? '(detached)';
      return {
        id: `${normalizePath(repoPath)}::${normalizePath(worktreePath)}`,
        repoPath,
        path: worktreePath,
        branch,
        isMain: index === 0,
        source
      };
    })
    .filter((item): item is WorktreeSummary => item !== null);
}

export function parseAgentboardReposMarkdown(text: string, hubPath: string): string[] {
  const paths: string[] = [];
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed.startsWith('|') || trimmed.includes('---') || /Repo ID/i.test(trimmed)) {
      continue;
    }
    const cells = trimmed.split('|').map((cell) => cell.trim()).filter(Boolean);
    if (cells.length < 2) {
      continue;
    }
    const repoId = cells[0];
    const rawPath = cells[1].replace(/^`|`$/g, '');
    if (!rawPath || rawPath === 'Path' || repoId.startsWith('_') || rawPath.startsWith('_')) {
      continue;
    }
    paths.push(path.resolve(hubPath, rawPath));
  }
  return [...new Set(paths)];
}

async function summarizeRepository(candidate: RepoCandidate): Promise<RepositorySummary | null> {
  const repoRoot = await normalizeRepoRoot(candidate.path);
  if (!repoRoot) {
    return null;
  }
  const diagnostics: string[] = [];
  let worktrees: WorktreeSummary[] = [];
  try {
    worktrees = parseWorktreePorcelain(await git(repoRoot, ['worktree', 'list', '--porcelain']), repoRoot, candidate.source);
  } catch {
    diagnostics.push('Unable to read Git worktrees.');
  }
  if (worktrees.length === 0) {
    let branch = '(detached)';
    try {
      branch = (await git(repoRoot, ['branch', '--show-current'])) || '(detached)';
    } catch {
      diagnostics.push('Unable to read current Git branch.');
    }
    worktrees = [{
      id: `${normalizePath(repoRoot)}::${normalizePath(repoRoot)}`,
      repoPath: repoRoot,
      path: repoRoot,
      branch,
      isMain: true,
      source: candidate.source
    }];
  }
  return {
    id: normalizePath(repoRoot),
    name: path.basename(repoRoot),
    path: repoRoot,
    source: candidate.source,
    worktrees,
    diagnostics
  };
}

async function discoverAgentboardCandidates(repoPath: string): Promise<RepoCandidate[]> {
  const repoRoot = await normalizeRepoRoot(repoPath);
  if (!repoRoot) {
    return [];
  }
  const reposFile = path.join(repoRoot, '.platform', 'repos.md');
  if (!(await pathExists(reposFile))) {
    return [];
  }
  const text = await readTextIfExists(reposFile);
  if (!text) {
    return [];
  }
  const childPaths = parseAgentboardReposMarkdown(text, repoRoot).filter((childPath) => childPath !== repoRoot);
  return childPaths.map((childPath) => ({ path: childPath, source: 'agentboard' as const }));
}

function uniqueCandidates(candidates: RepoCandidate[]): RepoCandidate[] {
  const seen = new Map<string, RepoCandidate>();
  for (const candidate of candidates) {
    const key = normalizePath(path.resolve(candidate.path));
    const current = seen.get(key);
    if (!current || sourceRank(candidate.source) < sourceRank(current.source)) {
      seen.set(key, { ...candidate, path: path.resolve(candidate.path) });
    }
  }
  return [...seen.values()];
}

function sourceRank(source: CatalogSource): number {
  if (source === 'tracked') return 0;
  if (source === 'workspace') return 1;
  return 2;
}

function git(cwd: string, args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    execFile('git', ['-C', cwd, ...args], { timeout: 10_000, maxBuffer: 4 * 1024 * 1024 }, (error, stdout) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(stdout.trim());
    });
  });
}
