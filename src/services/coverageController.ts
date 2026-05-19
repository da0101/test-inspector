import type { TestFrameworkAdapter } from '../adapters/types';
import type { CoverageError } from './caseFile';
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

export function coverageErrorForNoScript(skipped: TestProject[]): CoverageError {
  const names = skipped.map((p) => `${p.label} (${p.framework})`).join(', ');
  const steps: string[] = [];
  for (const p of skipped) {
    switch (p.framework) {
      case 'react':
        steps.push(`${p.label}: add to package.json → "coverage": "react-scripts test --coverage --watchAll=false"`);
        steps.push(`  or: "coverage": "jest --coverage"`);
        break;
      case 'node':
      case 'firebase-functions':
        steps.push(`${p.label}: add to package.json → "coverage": "jest --coverage"`);
        steps.push(`  or: "coverage": "vitest run --coverage"`);
        steps.push(`  or: "coverage": "c8 node --test"`);
        break;
      case 'flutter':
        steps.push(`${p.label}: run flutter test --coverage and confirm coverage/lcov.info is generated`);
        break;
      case 'django':
        steps.push(`${p.label}: pip install coverage, then run: coverage run manage.py test && coverage xml`);
        break;
      case 'fastapi':
        steps.push(`${p.label}: pip install coverage, then run: coverage run -m pytest && coverage xml`);
        break;
      default:
        steps.push(`${p.label}: add a "coverage" script to your package.json`);
    }
  }
  return { message: `No coverage script found for ${names}.`, steps };
}

export function coverageErrorForFailedRun(
  failed: Array<{ projectId: string; exitCode: number | null; stdout?: string; stderr?: string }>
): CoverageError {
  const run = failed[0];

  // Strip the framework prefix and path from projectId to get a readable label.
  // Format is "framework:/absolute/path" — take the last path segment.
  const rawId = run?.projectId ?? 'your project';
  const label = rawId.includes('/') ? rawId.split('/').filter(Boolean).pop() ?? rawId : rawId;

  // Prefer stderr for real error messages; ignore stdout because it usually just
  // contains npm's own "running script" banner, which is not an error.
  const realError = run?.stderr?.trim() ?? '';
  const errorLines = realError
    ? realError.split('\n').filter((l) => l.trim()).slice(0, 3)
    : [];

  if (errorLines.length > 0) {
    return {
      message: `Coverage failed in "${label}".`,
      steps: [
        ...errorLines,
        'Fix the error above, then click ♥︎ Generate Coverage again.',
      ],
    };
  }

  // No output — we genuinely don't know why it failed. Don't assume tests are
  // broken; the cause could be a Node flag, a reporter issue, or a test that
  // only fails under coverage instrumentation.
  return {
    message: `Coverage command failed in "${label}" — the cause is unclear.`,
    steps: [
      'Your tests may pass normally but fail differently under coverage instrumentation.',
      'Run this in your terminal to see the full error:',
      `  npm run coverage`,
      'Once you know what failed, fix it and click ♥︎ Generate Coverage again.',
    ],
  };
}

export function coverageErrorForMissingFile(): CoverageError {
  return {
    message: 'Coverage ran but did not produce a report file — nothing to display.',
    steps: [
      'Test Inspector looks for: coverage/lcov.info, coverage-summary.json, coverage.xml, or .coverage',
      'Run your coverage command in the terminal and confirm one of those files is created.',
      'If the file is in a different location, check your coverage script output and adjust accordingly.',
      'Once the file exists, click the ♥︎ Generate Coverage button again.',
    ],
  };
}

export function buildCoverageSetupHints(skipped: TestProject[]): string[] {
  const lines: string[] = ['[coverage] No coverage script found. Setup instructions:'];
  for (const p of skipped) {
    lines.push('');
    lines.push(`  Project : ${p.label}  (${p.framework})`);
    switch (p.framework) {
      case 'react':
        lines.push('  Problem : No "coverage", "test:coverage", "test:cov", or "coverage:unit" script in package.json.');
        lines.push('  Fix     : Add one of these to your package.json scripts:');
        lines.push('              "coverage": "react-scripts test --coverage --watchAll=false"');
        lines.push('              "coverage": "jest --coverage"');
        break;
      case 'node':
      case 'firebase-functions':
        lines.push('  Problem : No coverage script found in package.json.');
        lines.push('  Fix     : Add one of these to your package.json scripts:');
        lines.push('              "coverage": "jest --coverage"');
        lines.push('              "coverage": "vitest run --coverage"');
        lines.push('              "coverage": "c8 node --test"');
        break;
      case 'flutter':
        lines.push('  Problem : flutter test --coverage did not produce coverage/lcov.info.');
        lines.push('  Fix     : Run "flutter test --coverage" once manually and confirm');
        lines.push('              coverage/lcov.info is created, then retry.');
        break;
      case 'django':
        lines.push('  Problem : coverage.py is not installed or no coverage script is configured.');
        lines.push('  Fix     : pip install coverage, then run:');
        lines.push('              coverage run manage.py test && coverage xml');
        break;
      case 'fastapi':
        lines.push('  Problem : coverage.py is not installed or no coverage script is configured.');
        lines.push('  Fix     : pip install coverage, then run:');
        lines.push('              coverage run -m pytest && coverage xml');
        break;
      default:
        lines.push('  Fix     : Add a "coverage" script to your package.json.');
    }
  }
  return lines;
}
