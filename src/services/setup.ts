import * as path from 'path';
import { CoverageSummary, SetupIssue, TestFile, TestProject } from '../models';
import { pathExists, readJsonIfExists } from '../utils/fs';

type PackageJson = {
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
};

const JS_FRAMEWORKS = new Set<TestProject['framework']>(['node', 'react', 'firebase-functions']);

export async function analyzeSetupIssues(
  projects: TestProject[],
  testFiles: TestFile[],
  coverage: CoverageSummary[]
): Promise<SetupIssue[]> {
  const issues: SetupIssue[] = [];
  for (const project of projects) {
    const projectTests = testFiles.filter((testFile) => testFile.projectId === project.id);
    const projectCoverage = coverage.find((summary) => summary.projectId === project.id);
    const packageJson = JS_FRAMEWORKS.has(project.framework)
      ? await readJsonIfExists<PackageJson>(path.join(project.rootPath, 'package.json'))
      : null;

    if (!project.testCommand && projectTests.length === 0) {
      issues.push({
        id: `${project.id}:missing-test-command`,
        projectId: project.id,
        severity: 'warning',
        kind: 'missing-test-command',
        title: `${project.label} has no detected test command.`,
        detail: 'Test Inspector can scan files, but it cannot run this project until a test command is configured.',
        action: project.framework === 'flutter' ? 'Check that pubspec.yaml exists at the Flutter project root.' : 'Add a package.json test script or open the project root that contains it.'
      });
    }

    if (JS_FRAMEWORKS.has(project.framework) && projectTests.length > 0 && !project.coverageCommand) {
      issues.push({
        id: `${project.id}:missing-coverage-script`,
        projectId: project.id,
        severity: 'warning',
        kind: 'missing-coverage-script',
        title: `${project.label} has tests, but no coverage script.`,
        detail: `I found ${projectTests.length} test file${projectTests.length === 1 ? '' : 's'}, but there is no coverage, test:coverage, test:cov, coverage:unit, or test script with a coverage flag.`,
        action:
          project.framework === 'firebase-functions'
            ? 'Add "coverage": "jest --coverage --runInBand --watchman=false" to functions/package.json, then run Generate Coverage again.'
            : 'Add a package.json coverage script that writes LCOV or another supported coverage file, then run Generate Coverage again.'
      });
    }

    if (project.coverageCommand && !projectCoverage) {
      issues.push({
        id: `${project.id}:missing-coverage-file`,
        projectId: project.id,
        severity: 'info',
        kind: 'missing-coverage-file',
        title: `${project.label} coverage has not been read yet.`,
        detail: `A coverage command is configured (${project.coverageCommand}), but no supported coverage file was found in this scan.`,
        action: 'Run Generate Coverage, or confirm the command writes LCOV, coverage.py JSON, or coverage.py XML in a supported location.'
      });
    }

    if (packageJson && project.testCommand && !(await pathExists(path.join(project.rootPath, 'node_modules')))) {
      const hasDependencies = Boolean(Object.keys(packageJson.dependencies ?? {}).length || Object.keys(packageJson.devDependencies ?? {}).length);
      if (hasDependencies) {
        issues.push({
          id: `${project.id}:missing-node-modules`,
          projectId: project.id,
          severity: 'warning',
          kind: 'missing-node-modules',
          title: `${project.label} dependencies may not be installed.`,
          detail: 'npm scripts can fail with command not found when local dependencies are missing.',
          action: `Run npm install in ${project.workspacePath && project.workspacePath !== '.' ? project.workspacePath : path.basename(project.rootPath)}, then refresh Test Inspector.`
        });
      }
    }
  }
  return issues;
}
