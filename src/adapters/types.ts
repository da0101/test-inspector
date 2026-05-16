import {
  CoverageSummary,
  QualityFinding,
  TestFile,
  TestProject,
  TestRunResult
} from '../models';

export interface TestFrameworkAdapter {
  id: TestProject['framework'];
  label: string;
  detectProjects(workspaceFolders: string[]): Promise<TestProject[]>;
  discoverTests(project: TestProject): Promise<TestFile[]>;
  runAll(project: TestProject): Promise<TestRunResult>;
  runFile(project: TestProject, filePath: string): Promise<TestRunResult>;
  runRelated(project: TestProject, sourceFilePath: string): Promise<TestRunResult | null>;
  readCoverage(project: TestProject): Promise<CoverageSummary | null>;
  analyzeQuality(project: TestProject, tests: TestFile[]): Promise<QualityFinding[]>;
}
