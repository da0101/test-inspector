import type { CoverageSummary, TestFile, TestProject } from '../models';
import type { TestFrameworkAdapter } from '../adapters/types';
import * as path from 'path';
import {
  emptyBundle,
  synthesizeCaseFile,
  type CaseFile,
  type CaseFileBundle,
  type CaseVerdict
} from './caseFile';
import type { ReviewedStore } from './reviewed';
import { analyzeSourceRisks } from './sourceRisk';

export class CaseFileScanner {
  constructor(
    private readonly adapters: TestFrameworkAdapter[],
    private readonly output: { appendLine(value: string): void },
    private readonly reviewed: ReviewedStore | null
  ) {}

  async scan(folders: string[], scope?: CaseFileBundle['scope']): Promise<CaseFileBundle> {
    const publishEmpty = (): CaseFileBundle => {
      const bundle = emptyBundle();
      bundle.scope = scope;
      return bundle;
    };
    if (folders.length === 0) {
      this.output.appendLine('[refresh] no workspace folders open');
      return publishEmpty();
    }
    this.output.appendLine(`[refresh] scanning ${folders.length} workspace folder(s)`);

    const { projects, skippedSupport } = await detectScannableProjects(this.adapters, folders);
    if (skippedSupport > 0) {
      this.output.appendLine(`[refresh] skipped ${skippedSupport} support fixture project(s)`);
    }
    if (projects.length === 0) {
      this.output.appendLine('[refresh] no test projects detected in this workspace');
      return publishEmpty();
    }
    this.output.appendLine(`[refresh] ${projects.length} project(s): ${projects.map((p) => `${p.label}(${p.framework})`).join(', ')}`);

    const allTestFiles: TestFile[] = [];
    const allCoverage: CoverageSummary[] = [];
    const scannedProjects: TestProject[] = [];
    for (const project of projects) {
      const adapter = this.adapters.find((item) => item.id === project.framework);
      if (!adapter) {
        this.output.appendLine(`[refresh] no adapter for ${project.framework} — skipping ${project.label}`);
        continue;
      }
      try {
        const rawTests = await adapter.discoverTests(project);
        const findings = await adapter.analyzeQuality(project, rawTests);
        const withFindings: TestFile[] = rawTests.map((testFile) => ({
          ...testFile,
          qualityFindings: findings.filter((finding) => finding.filePath === testFile.path)
        }));
        allTestFiles.push(...withFindings);

        let coverageMsg = 'no coverage';
        try {
          const coverage = await adapter.readCoverage(project);
          if (coverage) {
            allCoverage.push(coverage);
            coverageMsg = `${coverage.files.length} file(s) covered`;
          }
        } catch (err) {
          coverageMsg = `coverage read failed: ${err instanceof Error ? err.message : String(err)}`;
        }
        scannedProjects.push(project);
        this.output.appendLine(`[refresh] ${project.label}: ${withFindings.length} test file(s), ${findings.length} static finding(s), ${coverageMsg}`);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        this.output.appendLine(`[refresh] ${project.label}: error during discovery — ${msg}`);
      }
    }

    let sourceRisks: Awaited<ReturnType<typeof analyzeSourceRisks>> = [];
    try {
      sourceRisks = await analyzeSourceRisks(scannedProjects, allTestFiles, allCoverage);
      this.output.appendLine(`[refresh] source-file risk: ${sourceRisks.length} source file(s) analyzed`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.output.appendLine(`[refresh] source-risk analysis failed: ${msg}`);
    }

    const bundle = await synthesizeCaseFile({
      testFiles: allTestFiles,
      coverageSummaries: allCoverage,
      sourceRisks,
      projects: scannedProjects
    });
    bundle.scope = scope;

    if (this.reviewed) {
      await hideReviewed(bundle, this.reviewed, this.output);
    }
    return bundle;
  }
}

export async function detectScannableProjects(
  adapters: TestFrameworkAdapter[],
  folders: string[]
): Promise<{ projects: TestProject[]; skippedSupport: number }> {
  const detectedProjects = (await Promise.all(adapters.map((adapter) => adapter.detectProjects(folders)))).flat();
  const projects = detectedProjects.filter((project) => !isSupportFixtureProject(project, folders));
  return { projects, skippedSupport: detectedProjects.length - projects.length };
}

function isSupportFixtureProject(project: TestProject, folders: string[]): boolean {
  return folders.some((folder) => {
    const rel = path.relative(folder, project.rootPath).split(path.sep).join('/');
    return rel === 'test/fixtures' || rel.startsWith('test/fixtures/') || rel === 'fixtures' || rel.startsWith('fixtures/');
  });
}

async function hideReviewed(
  bundle: CaseFileBundle,
  reviewed: ReviewedStore,
  output: { appendLine(value: string): void }
): Promise<void> {
  const visible: CaseFile[] = [];
  let hidden = 0;
  for (const item of bundle.cases) {
    if (await reviewed.shouldHide(item.target.path)) {
      hidden++;
      continue;
    }
    visible.push(item);
  }
  bundle.cases = visible;
  bundle.totals = recountTotals(visible);
  bundle.hiddenReviewedCount = hidden;
  if (hidden > 0) {
    output.appendLine(`[refresh] hidden as reviewed: ${hidden} case(s) (edit .test-inspector/reviewed.json to unhide)`);
  }
}

function recountTotals(cases: CaseFile[]): Record<CaseVerdict, number> {
  const totals: Record<CaseVerdict, number> = { THEATER: 0, WEAK: 0, MISSING: 0, STRONG: 0, OK: 0 };
  for (const item of cases) totals[item.verdict] += 1;
  return totals;
}
