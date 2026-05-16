import { execFile } from 'child_process';
import * as path from 'path';
import { ChangedFileRisk, CoverageSummary, QualityFinding, TestFile, TestProject } from '../models';
import { basenameWithoutKnownExtensions, isSourceFile, normalizePath } from '../utils/path';

export async function getChangedFiles(repoPath: string): Promise<string[]> {
  const diffFiles = await git(repoPath, ['diff', '--name-only', 'HEAD', '--']);
  const statusFiles = await git(repoPath, ['status', '--porcelain=v1']);
  const changed = new Set<string>();
  for (const line of diffFiles.split(/\r?\n/)) {
    if (line.trim()) {
      changed.add(path.join(repoPath, line.trim()));
    }
  }
  for (const line of statusFiles.split(/\r?\n/)) {
    if (line.trim()) {
      const file = line.slice(3).trim().split(' -> ').pop();
      if (file) {
        changed.add(path.join(repoPath, file));
      }
    }
  }
  return [...changed].filter(isSourceFile);
}

export function buildChangedFileRisks(
  changedFiles: string[],
  projects: TestProject[],
  tests: TestFile[],
  coverage: CoverageSummary[],
  findings: QualityFinding[]
): ChangedFileRisk[] {
  return changedFiles.map((filePath) => {
    const project = findOwningProject(filePath, projects);
    const relatedTests = findRelatedTests(filePath, project, tests);
    const projectCoverage = project ? coverage.find((summary) => summary.projectId === project.id) : undefined;
    const rel = project ? normalizePath(path.relative(project.rootPath, filePath)) : normalizePath(filePath);
    const coverageFile = projectCoverage?.files.find((file) => file.path === rel || file.path.endsWith(`/${rel}`));
    const fileFindings = findings.filter((finding) => finding.filePath === filePath);
    if (relatedTests.length === 0 && project) {
      fileFindings.push({
        id: `${project.id}:missing-related-test:${rel}`,
        kind: 'missing-related-test',
        severity: 'warning',
        message: 'No likely related tests found for changed source file.',
        filePath
      });
    }
    if (!coverageFile && projectCoverage) {
      fileFindings.push({
        id: `${project?.id}:missing-coverage:${rel}`,
        kind: 'missing-coverage',
        severity: 'warning',
        message: 'No coverage entry found for changed source file.',
        filePath
      });
    }
    return {
      path: filePath,
      projectId: project?.id,
      relatedTests,
      coverage: coverageFile,
      findings: fileFindings,
      recommendedCommand: project ? recommendCommand(project, relatedTests, filePath) : undefined
    };
  });
}

function findOwningProject(filePath: string, projects: TestProject[]): TestProject | undefined {
  return projects
    .filter((project) => filePath.startsWith(project.rootPath))
    .sort((a, b) => b.rootPath.length - a.rootPath.length)[0];
}

function findRelatedTests(filePath: string, project: TestProject | undefined, tests: TestFile[]): string[] {
  if (!project) {
    return [];
  }
  const sourceBase = basenameWithoutKnownExtensions(filePath);
  const sourceDir = normalizePath(path.dirname(path.relative(project.rootPath, filePath)));
  return tests
    .filter((test) => test.projectId === project.id)
    .filter((test) => {
      const testBase = basenameWithoutKnownExtensions(test.path);
      const relTestDir = normalizePath(path.dirname(path.relative(project.rootPath, test.path)));
      return (
        testBase === sourceBase ||
        testBase === `${sourceBase}_test` ||
        testBase === `test_${sourceBase}` ||
        relTestDir.includes(sourceDir) ||
        sourceDir.includes(relTestDir.replace(/(^|\/)(__tests__|tests?)$/, ''))
      );
    })
    .map((test) => test.path);
}

function recommendCommand(project: TestProject, relatedTests: string[], sourceFile: string): string {
  const firstTest = relatedTests[0];
  if (project.framework === 'flutter') {
    return firstTest ? `flutter test ${path.relative(project.rootPath, firstTest)}` : `flutter test`;
  }
  if (project.framework === 'django' || project.framework === 'fastapi') {
    return firstTest ? `pytest ${path.relative(project.rootPath, firstTest)}` : 'pytest';
  }
  if (project.framework === 'react') {
    return `npm test -- --findRelatedTests ${path.relative(project.rootPath, sourceFile)}`;
  }
  return firstTest ? `npm test -- ${path.relative(project.rootPath, firstTest)}` : 'npm test';
}

function git(cwd: string, args: string[]): Promise<string> {
  return new Promise((resolve) => {
    execFile('git', args, { cwd }, (error, stdout) => {
      resolve(error ? '' : stdout);
    });
  });
}
