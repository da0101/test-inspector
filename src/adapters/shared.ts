import { promises as fs } from 'fs';
import * as path from 'path';
import { CoverageSummary, QualityFinding, TestFile, TestProject, TestRunResult } from '../models';
import { readProjectCoverage } from '../services/coverage';
import { analyzeQuality, testFileFromPath } from '../services/quality';
import { emptyRun, flutterRunner, jsRunner, pythonRunner, relativeArg, runCommand } from '../services/runner';
import { readJsonIfExists, readTextIfExists, walkFiles } from '../utils/fs';
import { relativePath, stableProjectId } from '../utils/path';
import { TestFrameworkAdapter } from './types';

export type PackageJson = {
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
};

export function hasAnyDependency(pkg: PackageJson | null, names: string[]): boolean {
  if (!pkg) {
    return false;
  }
  const deps = { ...(pkg.dependencies ?? {}), ...(pkg.devDependencies ?? {}) };
  return names.some((name) => Object.prototype.hasOwnProperty.call(deps, name));
}

export async function packageJsonAt(rootPath: string): Promise<PackageJson | null> {
  return readJsonIfExists<PackageJson>(path.join(rootPath, 'package.json'));
}

export function scriptCommand(pkg: PackageJson | null, preferred: string[]): string | undefined {
  for (const script of preferred) {
    if (pkg?.scripts?.[script]) {
      return script === 'test' ? 'npm run test' : `npm run ${script}`;
    }
  }
  return pkg?.scripts?.test ? 'npm run test' : undefined;
}

export function coverageScriptCommand(pkg: PackageJson | null): string | undefined {
  for (const script of ['coverage', 'test:coverage', 'test:cov', 'coverage:unit']) {
    if (pkg?.scripts?.[script]) {
      return `npm run ${script}`;
    }
  }
  if (pkg?.scripts?.test && /\b(--coverage|--collectCoverage|coverage)\b/.test(pkg.scripts.test)) {
    return 'npm run test';
  }
  return undefined;
}

export async function discoverByPatterns(project: TestProject, include: (filePath: string) => boolean): Promise<TestFile[]> {
  const files = await walkFiles(project.rootPath, { include });
  return Promise.all(
    files.map(async (filePath) => {
      const text = await fs.readFile(filePath, 'utf8');
      return testFileFromPath(project, filePath, text);
    })
  );
}

export abstract class BaseAdapter implements TestFrameworkAdapter {
  abstract id: TestProject['framework'];
  abstract label: string;
  abstract detectProjects(workspaceFolders: string[]): Promise<TestProject[]>;
  abstract discoverTests(project: TestProject): Promise<TestFile[]>;

  async runAll(project: TestProject): Promise<TestRunResult> {
    if (project.framework === 'flutter') {
      const runner = flutterRunner();
      return runCommand(project, runner.command, runner.baseArgs, false);
    }
    if (project.framework === 'django' || project.framework === 'fastapi') {
      const runner = pythonRunner(project);
      return runCommand(project, runner.command, runner.baseArgs, false);
    }
    const runner = jsRunner(project);
    return runCommand(project, runner.command, [...runner.baseArgs, '--json'], true);
  }

  async runFile(project: TestProject, filePath: string): Promise<TestRunResult> {
    if (project.framework === 'flutter') {
      const runner = flutterRunner();
      return runCommand(project, runner.command, [...runner.baseArgs, relativeArg(project, filePath)], false);
    }
    if (project.framework === 'django' || project.framework === 'fastapi') {
      const runner = pythonRunner(project);
      return runCommand(project, runner.command, [...runner.baseArgs, relativeArg(project, filePath)], false);
    }
    const runner = jsRunner(project);
    return runCommand(project, runner.command, [...runner.baseArgs, relativeArg(project, filePath), '--json'], true);
  }

  async runRelated(project: TestProject, sourceFilePath: string): Promise<TestRunResult | null> {
    if (project.framework === 'react') {
      const runner = jsRunner(project);
      return runCommand(project, runner.command, [...runner.baseArgs, '--findRelatedTests', relativeArg(project, sourceFilePath), '--json'], true);
    }
    return emptyRun(project, `No related-test runner for ${project.framework}`);
  }

  readCoverage(project: TestProject): Promise<CoverageSummary | null> {
    return readProjectCoverage(project);
  }

  analyzeQuality(project: TestProject, tests: TestFile[]): Promise<QualityFinding[]> {
    return analyzeQuality(project, tests);
  }
}

export function makeProject(input: {
  framework: TestProject['framework'];
  rootPath: string;
  workspaceFolder?: string;
  label: string;
  testCommand?: string;
  coverageCommand?: string;
  configFiles?: string[];
}): TestProject {
  const workspacePath = input.workspaceFolder ? relativePath(input.workspaceFolder, input.rootPath) || '.' : undefined;
  return {
    id: stableProjectId(input.framework, input.rootPath),
    rootPath: input.rootPath,
    workspacePath,
    framework: input.framework,
    label: input.label,
    testCommand: input.testCommand,
    coverageCommand: input.coverageCommand,
    configFiles: input.configFiles ?? []
  };
}

export function projectLabel(kind: string, rootPath: string, workspaceFolder: string): string {
  const rel = relativePath(workspaceFolder, rootPath);
  const suffix = rel && rel !== '.' ? rel : path.basename(rootPath);
  return `${kind}: ${suffix}`;
}

export async function findConfigFiles(rootPath: string, names: string[]): Promise<string[]> {
  const files = await walkFiles(rootPath, {
    include: (filePath) => names.some((name) => path.basename(filePath).match(globLikeToRegex(name)))
  });
  return files.map((filePath) => relativePath(rootPath, filePath));
}

function globLikeToRegex(pattern: string): RegExp {
  return new RegExp(`^${pattern.replace(/\./g, '\\.').replace(/\*/g, '.*')}$`);
}

export async function textContainsAny(filePath: string, needles: string[]): Promise<boolean> {
  const text = await readTextIfExists(filePath);
  return Boolean(text && needles.some((needle) => text.includes(needle)));
}
