import * as path from 'path';
import { CoverageFile, CoverageSummary, TestProject } from '../models';
import { pathExists, readJsonIfExists, readTextIfExists } from '../utils/fs';
import { parseXmlLite, findXmlNodes } from '../utils/xml';

export async function readProjectCoverage(project: TestProject): Promise<CoverageSummary | null> {
  const lcovPath = path.join(project.rootPath, 'coverage', 'lcov.info');
  if (await pathExists(lcovPath)) {
    const text = await readTextIfExists(lcovPath);
    if (text) {
      return parseLcov(text, project.id, project.rootPath);
    }
  }

  const coverageJsonPath = path.join(project.rootPath, 'coverage.json');
  if (await pathExists(coverageJsonPath)) {
    const json = await readJsonIfExists<CoveragePyJson>(coverageJsonPath);
    if (json) {
      return parseCoveragePyJson(json, project.id, project.rootPath);
    }
  }

  const pythonCoverageJsonPath = path.join(project.rootPath, 'htmlcov', 'coverage.json');
  if (await pathExists(pythonCoverageJsonPath)) {
    const json = await readJsonIfExists<CoveragePyJson>(pythonCoverageJsonPath);
    if (json) {
      return parseCoveragePyJson(json, project.id, project.rootPath);
    }
  }

  const xmlPath = path.join(project.rootPath, 'coverage.xml');
  if (await pathExists(xmlPath)) {
    const text = await readTextIfExists(xmlPath);
    if (text) {
      return parseCoveragePyXml(text, project.id, project.rootPath);
    }
  }

  return null;
}

export function parseLcov(text: string, projectId: string, projectRoot = ''): CoverageSummary {
  const files: CoverageFile[] = [];
  const totals = { linesHit: 0, linesFound: 0, functionsHit: 0, functionsFound: 0, branchesHit: 0, branchesFound: 0 };
  let current: {
    path?: string;
    linesFound?: number;
    linesHit?: number;
    functionsFound?: number;
    functionsHit?: number;
    branchesFound?: number;
    branchesHit?: number;
    uncoveredLines: number[];
  } | null = null;

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) {
      continue;
    }
    if (line.startsWith('SF:')) {
      current = { path: normalizeCoveragePath(line.slice(3), projectRoot), uncoveredLines: [] };
    } else if (current && line.startsWith('DA:')) {
      const [lineNumberText, countText] = line.slice(3).split(',');
      const lineNumber = Number(lineNumberText);
      const count = Number(countText);
      if (Number.isFinite(lineNumber) && count === 0) {
        current.uncoveredLines.push(lineNumber);
      }
    } else if (current && line.startsWith('LF:')) {
      current.linesFound = Number(line.slice(3));
    } else if (current && line.startsWith('LH:')) {
      current.linesHit = Number(line.slice(3));
    } else if (current && line.startsWith('FNF:')) {
      current.functionsFound = Number(line.slice(4));
    } else if (current && line.startsWith('FNH:')) {
      current.functionsHit = Number(line.slice(4));
    } else if (current && line.startsWith('BRF:')) {
      current.branchesFound = Number(line.slice(4));
    } else if (current && line.startsWith('BRH:')) {
      current.branchesHit = Number(line.slice(4));
    } else if (current && line === 'end_of_record') {
      totals.linesHit += current.linesHit ?? 0;
      totals.linesFound += current.linesFound ?? 0;
      totals.functionsHit += current.functionsHit ?? 0;
      totals.functionsFound += current.functionsFound ?? 0;
      totals.branchesHit += current.branchesHit ?? 0;
      totals.branchesFound += current.branchesFound ?? 0;
      files.push({
        path: current.path ?? '',
        linesPct: pct(current.linesHit, current.linesFound),
        branchesPct: pct(current.branchesHit, current.branchesFound),
        functionsPct: pct(current.functionsHit, current.functionsFound),
        uncoveredLines: current.uncoveredLines
      });
      current = null;
    }
  }

  return {
    projectId,
    files,
    totals: {
      linesPct: pct(totals.linesHit, totals.linesFound),
      functionsPct: pct(totals.functionsHit, totals.functionsFound),
      branchesPct: pct(totals.branchesHit, totals.branchesFound)
    }
  };
}

type CoveragePyJson = {
  totals?: {
    percent_covered?: number;
    num_statements?: number;
    covered_lines?: number;
    missing_lines?: number;
  };
  files?: Record<
    string,
    {
      summary?: {
        percent_covered?: number;
        num_statements?: number;
        covered_lines?: number;
      };
      missing_lines?: number[];
    }
  >;
};

export function parseCoveragePyJson(json: CoveragePyJson, projectId: string, projectRoot = ''): CoverageSummary {
  const files = Object.entries(json.files ?? {}).map(([filePath, value]) => ({
    path: normalizeCoveragePath(filePath, projectRoot),
    linesPct: value.summary?.percent_covered,
    uncoveredLines: value.missing_lines ?? []
  }));
  return {
    projectId,
    files,
    totals: {
      linesPct: json.totals?.percent_covered ?? summarizeCoverage(files).linesPct
    }
  };
}

export function parseCoveragePyXml(xml: string, projectId: string, projectRoot = ''): CoverageSummary {
  const root = parseXmlLite(xml);
  const classes = findXmlNodes(root, 'class');
  let totalLines = 0;
  let coveredLines = 0;
  const files = classes.map((node) => {
    const lineRate = Number(node.attributes['line-rate']);
    const lineNodes = findXmlNodes(node, 'line');
    totalLines += lineNodes.length;
    coveredLines += lineNodes.filter((line) => Number(line.attributes.hits) > 0).length;
    return {
      path: normalizeCoveragePath(node.attributes.filename ?? '', projectRoot),
      linesPct: Number.isFinite(lineRate) ? lineRate * 100 : undefined,
      branchesPct: asPct(node.attributes['branch-rate']),
      uncoveredLines: lineNodes
        .filter((line) => Number(line.attributes.hits) === 0)
        .map((line) => Number(line.attributes.number))
        .filter(Number.isFinite)
    };
  });
  return {
    projectId,
    files,
    totals: {
      ...summarizeCoverage(files),
      linesPct: pct(coveredLines, totalLines)
    }
  };
}

export function summarizeCoverage(files: CoverageFile[]): CoverageSummary['totals'] {
  return {
    linesPct: average(files.map((file) => file.linesPct)),
    branchesPct: average(files.map((file) => file.branchesPct)),
    functionsPct: average(files.map((file) => file.functionsPct)),
    statementsPct: average(files.map((file) => file.statementsPct))
  };
}

function pct(hit?: number, found?: number): number | undefined {
  if (found === undefined || hit === undefined || found <= 0) {
    return undefined;
  }
  return Math.round((hit / found) * 1000) / 10;
}

function asPct(value: string | undefined): number | undefined {
  if (value === undefined) {
    return undefined;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.round(parsed * 1000) / 10 : undefined;
}

function average(values: Array<number | undefined>): number | undefined {
  const present = values.filter((value): value is number => typeof value === 'number');
  if (present.length === 0) {
    return undefined;
  }
  return Math.round((present.reduce((sum, value) => sum + value, 0) / present.length) * 10) / 10;
}

function normalizeCoveragePath(filePath: string, projectRoot: string): string {
  if (!projectRoot || !path.isAbsolute(filePath)) {
    return filePath.split(path.sep).join('/');
  }
  return path.relative(projectRoot, filePath).split(path.sep).join('/');
}
