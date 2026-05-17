import type { TestFrameworkAdapter } from '../adapters/types';
import type { CoverageSummary, TestProject, TestRunResult } from '../models';
import { detectScannableProjects } from './caseFileScanner';
import { coverageCommandPreview, runCoverage } from './runner';

export type CoveragePlanItem = {
  project: TestProject;
  commands: string[];
};

export type CoverageGenerationResult = {
  projects: TestProject[];
  planned: CoveragePlanItem[];
  skipped: TestProject[];
  runs: TestRunResult[];
  coverage: CoverageSummary[];
};

export async function buildCoveragePlan(
  adapters: TestFrameworkAdapter[],
  folders: string[]
): Promise<{ projects: TestProject[]; planned: CoveragePlanItem[]; skipped: TestProject[]; skippedSupport: number }> {
  const { projects, skippedSupport } = await detectScannableProjects(adapters, folders);
  const planned: CoveragePlanItem[] = [];
  const skipped: TestProject[] = [];
  for (const project of projects) {
    const commands = coverageCommandPreview(project);
    if (commands.length > 0) {
      planned.push({ project, commands });
    } else {
      skipped.push(project);
    }
  }
  return { projects, planned, skipped, skippedSupport };
}

export async function generateCoverageForPlan(
  adapters: TestFrameworkAdapter[],
  plan: CoveragePlanItem[],
  onOutput?: (line: string) => void
): Promise<CoverageGenerationResult> {
  const runs: TestRunResult[] = [];
  const coverage: CoverageSummary[] = [];
  const skipped: TestProject[] = [];
  for (const item of plan) {
    const adapter = adapters.find((candidate) => candidate.id === item.project.framework);
    if (!adapter) {
      skipped.push(item.project);
      continue;
    }
    onOutput?.(`[coverage] ${item.project.label}`);
    const run = await runCoverage(item.project, onOutput);
    runs.push(run);
    if (run.exitCode !== 0) {
      continue;
    }
    const summary = await adapter.readCoverage(item.project);
    if (summary) {
      coverage.push(summary);
      onOutput?.(`[coverage] read ${summary.files.length} covered file(s) for ${item.project.label}`);
    } else {
      onOutput?.(`[coverage] no supported coverage file found for ${item.project.label}`);
    }
  }
  return {
    projects: plan.map((item) => item.project),
    planned: plan,
    skipped,
    runs,
    coverage
  };
}

export function formatCoveragePreview(plan: CoveragePlanItem[]): string {
  return plan
    .map((item) => `${item.project.label}: ${item.commands.join(' && ')}`)
    .join('\n');
}
