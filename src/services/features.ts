import * as path from 'path';
import { CoverageSummary, FeatureArea, SourceFileRisk, TestFile, TestProject } from '../models';
import { walkFiles } from '../utils/fs';
import { isSourceFile, isTestFile, normalizePath } from '../utils/path';

export async function analyzeFeatureAreas(
  projects: TestProject[],
  tests: TestFile[],
  coverage: CoverageSummary[],
  risks: SourceFileRisk[]
): Promise<FeatureArea[]> {
  const areas: FeatureArea[] = [];
  for (const project of projects) {
    const files = await walkFiles(project.rootPath, {
      include: (filePath) => (isSourceFile(filePath) || isTestFile(filePath)) && isFeatureCandidate(project, filePath)
    });
    const buckets = new Map<string, { rootPath: string; sourceFiles: string[]; testFiles: string[] }>();
    for (const file of files) {
      const key = featureKey(project, file);
      if (!key) {
        continue;
      }
      const bucket = buckets.get(key.id) ?? { rootPath: key.rootPath, sourceFiles: [], testFiles: [] };
      if (isTestFile(file)) {
        bucket.testFiles.push(file);
      } else {
        bucket.sourceFiles.push(file);
      }
      buckets.set(key.id, bucket);
    }

    const projectCoverage = coverage.find((summary) => summary.projectId === project.id);
    for (const [localId, bucket] of buckets) {
      if (bucket.sourceFiles.length === 0) {
        continue;
      }
      const id = `${project.id}:${localId}`;
      const featureRisks = risks.filter((risk) => risk.projectId === project.id && risk.path.startsWith(bucket.rootPath));
      const coverageValues = bucket.sourceFiles
        .map((file) => {
          const rel = normalizePath(path.relative(project.rootPath, file));
          return projectCoverage?.files.find((coverageFile) => coverageFile.path === rel || coverageFile.path.endsWith(`/${rel}`))?.linesPct;
        })
        .filter((value): value is number => typeof value === 'number');
      const signals = [...new Set(featureRisks.flatMap((risk) => risk.signals))].slice(0, 6);
      const riskScore = Math.max(
        featureRisks.length ? Math.round(featureRisks.reduce((sum, risk) => sum + risk.score, 0) / featureRisks.length) : 0,
        bucket.testFiles.length === 0 ? 50 : 0
      );
      areas.push({
        id,
        projectId: project.id,
        label: labelFromId(localId),
        rootPath: bucket.rootPath,
        sourceFiles: bucket.sourceFiles.sort(),
        testFiles: [...new Set([...bucket.testFiles, ...featureRisks.flatMap((risk) => risk.relatedTests)])].sort(),
        averageCoverage: average(coverageValues),
        riskScore,
        signals,
        recommendedCommand: recommendedCommand(project, [...new Set([...bucket.testFiles, ...featureRisks.flatMap((risk) => risk.relatedTests)])])
      });
    }
  }
  return areas.sort((a, b) => b.riskScore - a.riskScore || b.sourceFiles.length - a.sourceFiles.length);
}

function featureKey(project: TestProject, filePath: string): { id: string; rootPath: string } | null {
  const rel = normalizePath(path.relative(project.rootPath, filePath));
  const parts = rel.split('/');
  if (project.framework === 'firebase-functions') {
    if (parts[0] === 'src' && parts[1]) {
      const folder = parts.length > 2 ? parts[1] : 'root';
      return {
        id: `src/${folder}`,
        rootPath: folder === 'root' ? path.join(project.rootPath, 'src') : path.join(project.rootPath, 'src', folder)
      };
    }
  }
  if (project.framework === 'react' || project.framework === 'firebase-functions') {
    const featureRoots = ['features', 'pages', 'routes', 'modules', 'domains'];
    const rootIndex = parts.findIndex((part) => featureRoots.includes(part));
    if (rootIndex >= 0 && parts[rootIndex + 1]) {
      return {
        id: `${parts[rootIndex]}/${parts[rootIndex + 1]}`,
        rootPath: path.join(project.rootPath, ...parts.slice(0, rootIndex + 2))
      };
    }
    if (parts[0] === 'src' && parts[1] === 'js' && parts[2]) {
      return { id: `src/js/${parts[2]}`, rootPath: path.join(project.rootPath, 'src', 'js', parts[2]) };
    }
    if (parts[0] === 'src' && parts[1] === 'components' && parts[2]) {
      return { id: `components/${parts[2]}`, rootPath: path.join(project.rootPath, 'src', 'components', parts[2]) };
    }
  }
  if (project.framework === 'flutter' && parts[0] === 'lib' && parts[1]) {
    return { id: `lib/${parts[1]}`, rootPath: path.join(project.rootPath, 'lib', parts[1]) };
  }
  if ((project.framework === 'django' || project.framework === 'fastapi') && parts[0]) {
    return { id: parts[0], rootPath: path.join(project.rootPath, parts[0]) };
  }
  return null;
}

function isFeatureCandidate(project: TestProject, filePath: string): boolean {
  const rel = normalizePath(path.relative(project.rootPath, filePath));
  if (/(\.d\.ts|mock|fixture|stories\.|setupTests?|testHelpers?|\.g\.dart|\.freezed\.dart|\.gr\.dart|\.mocks\.dart)$/.test(rel)) {
    return false;
  }
  if (/^(coverage|dist|build|out|node_modules|\.next|\.turbo|public|storybook)\//.test(rel)) {
    return false;
  }
  if (
    project.framework === 'flutter' &&
    (/(^|\/)(generated|gen|l10n\/generated)\//.test(rel) ||
      /(^|\/)(app_localizations(?:_[a-z_]+)?|firebase_options|generated_plugin_registrant)\.dart$/.test(rel))
  ) {
    return false;
  }
  return true;
}

function recommendedCommand(project: TestProject, tests: string[]): string | undefined {
  if (!tests.length) {
    return project.testCommand;
  }
  const relTests = tests.slice(0, 12).map((test) => normalizePath(path.relative(project.rootPath, test)));
  if (project.framework === 'flutter') {
    return `flutter test ${relTests.join(' ')}`;
  }
  if (project.framework === 'django' || project.framework === 'fastapi') {
    return `pytest ${relTests.join(' ')}`;
  }
  return `npm test -- ${relTests.join(' ')}`;
}

function labelFromId(id: string): string {
  return id
    .split('/')
    .filter(Boolean)
    .slice(-2)
    .join(' / ');
}

function average(values: number[]): number | undefined {
  if (!values.length) {
    return undefined;
  }
  return Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 10) / 10;
}
