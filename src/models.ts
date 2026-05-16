export type FrameworkId = 'react' | 'flutter' | 'django' | 'fastapi' | 'firebase-functions';

export type TestStatus = 'unknown' | 'passed' | 'failed' | 'skipped' | 'mixed';

export type FindingSeverity = 'info' | 'warning' | 'error';

export type QualityFindingKind =
  | 'skipped-test'
  | 'focused-test'
  | 'no-assertion'
  | 'snapshot-only'
  | 'slow-test'
  | 'missing-related-test'
  | 'missing-coverage'
  | 'weak-test'
  | 'orphan-test'
  | 'trivial-assertion'
  | 'stale-test'
  | 'parse-error';

export type TestProject = {
  id: string;
  rootPath: string;
  workspacePath?: string;
  framework: FrameworkId;
  label: string;
  testCommand?: string;
  coverageCommand?: string;
  configFiles: string[];
};

export type TestFile = {
  path: string;
  projectId: string;
  testCases: TestCase[];
  status: TestStatus;
  durationMs?: number;
  qualityFindings: QualityFinding[];
};

export type TestCase = {
  id: string;
  name: string;
  filePath: string;
  line?: number;
  status: Exclude<TestStatus, 'mixed'>;
  durationMs?: number;
  errorMessage?: string;
};

export type CoverageSummary = {
  projectId: string;
  files: CoverageFile[];
  totals: {
    linesPct?: number;
    branchesPct?: number;
    functionsPct?: number;
    statementsPct?: number;
  };
};

export type CoverageFile = {
  path: string;
  linesPct?: number;
  branchesPct?: number;
  functionsPct?: number;
  statementsPct?: number;
  uncoveredLines?: number[];
};

export type QualityFinding = {
  id: string;
  severity: FindingSeverity;
  kind: QualityFindingKind;
  message: string;
  filePath: string;
  line?: number;
};

export type TestRunResult = {
  projectId: string;
  command: string;
  exitCode: number | null;
  stdout: string;
  stderr: string;
  testFiles: TestFile[];
  startedAt: number;
  endedAt: number;
};

export type InspectorNotice = {
  id: string;
  severity: FindingSeverity;
  message: string;
  detail?: string;
  projectId?: string;
  createdAt: string;
};

export type SetupIssueKind = 'missing-test-command' | 'missing-coverage-script' | 'missing-coverage-file' | 'missing-node-modules';

export type SetupIssue = {
  id: string;
  projectId: string;
  severity: FindingSeverity;
  kind: SetupIssueKind;
  title: string;
  detail: string;
  action: string;
};

export type ChangedFileRisk = {
  path: string;
  projectId?: string;
  relatedTests: string[];
  coverage?: CoverageFile;
  findings: QualityFinding[];
  recommendedCommand?: string;
};

export type SourceFileRisk = {
  path: string;
  projectId: string;
  relatedTests: string[];
  coverage?: CoverageFile;
  findings: QualityFinding[];
  score: number;
  criticality: number;
  signals: string[];
  recommendation: string;
};

export type FeatureArea = {
  id: string;
  projectId: string;
  label: string;
  rootPath: string;
  sourceFiles: string[];
  testFiles: string[];
  averageCoverage?: number;
  riskScore: number;
  signals: string[];
  recommendedCommand?: string;
};

export type InvestigationReport = {
  generatedAt: string;
  sourcePath: string;
  projectId: string;
  riskScore: number;
  criticality: number;
  coverage?: CoverageFile;
  relatedTests: string[];
  signals: string[];
  deterministicFindings: QualityFinding[];
  sourceSummary: string[];
  weakTestFindings: QualityFinding[];
  llmEnabled: boolean;
  llmSummary?: string;
  suggestedTests: TestSuggestion[];
};

export type FeatureInvestigationReport = {
  generatedAt: string;
  feature: FeatureArea;
  project: TestProject;
  risks: SourceFileRisk[];
  weakFindings: QualityFinding[];
  suggestedTests: TestSuggestion[];
  llmEnabled: boolean;
  llmSummary?: string;
};

export type TestSuggestion = {
  title: string;
  reason: string;
  example?: string;
};

export type TestInspectorReport = {
  generatedAt: string;
  projects: TestProject[];
  testFiles: TestFile[];
  coverage: CoverageSummary[];
  qualityFindings: QualityFinding[];
  changedFiles: ChangedFileRisk[];
};
