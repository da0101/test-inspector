import {
  ChangedFileRisk,
  CoverageSummary,
  FeatureArea,
  FeatureInvestigationReport,
  FindingSeverity,
  InspectorNotice,
  InvestigationReport,
  SetupIssue,
  SourceFileRisk,
  TestFile,
  TestProject
} from '../models';

export class InspectorState {
  projects: TestProject[] = [];
  testFiles: TestFile[] = [];
  coverage: CoverageSummary[] = [];
  changedFiles: ChangedFileRisk[] = [];
  sourceRisks: SourceFileRisk[] = [];
  featureAreas: FeatureArea[] = [];
  latestInvestigation: InvestigationReport | null = null;
  latestFeatureInvestigation: FeatureInvestigationReport | null = null;
  selectedProjectId: string | null = null;
  selectedFeatureId: string | null = null;
  notices: InspectorNotice[] = [];
  setupIssues: SetupIssue[] = [];

  setProjects(projects: TestProject[]): void {
    this.projects = projects;
    this.testFiles = this.testFiles.filter((testFile) => projects.some((project) => project.id === testFile.projectId));
    this.coverage = this.coverage.filter((summary) => projects.some((project) => project.id === summary.projectId));
    this.sourceRisks = this.sourceRisks.filter((risk) => projects.some((project) => project.id === risk.projectId));
    this.featureAreas = this.featureAreas.filter((area) => projects.some((project) => project.id === area.projectId));
    this.setupIssues = this.setupIssues.filter((issue) => projects.some((project) => project.id === issue.projectId));
    if (this.selectedProjectId && !projects.some((project) => project.id === this.selectedProjectId)) {
      this.selectedProjectId = null;
    }
    if (this.selectedFeatureId && !this.featureAreas.some((area) => area.id === this.selectedFeatureId)) {
      this.selectedFeatureId = null;
    }
  }

  setTests(projectId: string, testFiles: TestFile[]): void {
    this.testFiles = [...this.testFiles.filter((testFile) => testFile.projectId !== projectId), ...testFiles];
  }

  setCoverage(projectId: string, coverage: CoverageSummary | null): void {
    this.coverage = this.coverage.filter((summary) => summary.projectId !== projectId);
    if (coverage) {
      this.coverage.push(coverage);
    }
  }

  setSetupIssues(issues: SetupIssue[]): void {
    this.setupIssues = issues;
  }

  addNotice(input: { severity: FindingSeverity; message: string; detail?: string; projectId?: string }): void {
    const key = `${input.projectId ?? 'workspace'}:${input.severity}:${input.message}:${input.detail ?? ''}`;
    const notice: InspectorNotice = {
      id: key,
      severity: input.severity,
      message: input.message,
      detail: input.detail,
      projectId: input.projectId,
      createdAt: new Date().toISOString()
    };
    this.notices = [notice, ...this.notices.filter((item) => item.id !== key)].slice(0, 30);
  }

  clearNotices(): void {
    this.notices = [];
  }
}
