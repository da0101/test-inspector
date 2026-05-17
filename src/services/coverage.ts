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
    lineCounts: Map<number, number>;
    functionLines: Array<{ line: number; name: string }>;
    functionHits: Array<{ name: string; hits: number }>;
    branches: Array<{ line: number; hits: number | null }>;
    uncoveredLines: number[];
  } | null = null;

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) {
      continue;
    }
    if (line.startsWith('SF:')) {
      current = {
        path: normalizeCoveragePath(line.slice(3), projectRoot),
        lineCounts: new Map(),
        functionLines: [],
        functionHits: [],
        branches: [],
        uncoveredLines: []
      };
    } else if (current && line.startsWith('DA:')) {
      const [lineNumberText, countText] = line.slice(3).split(',');
      const lineNumber = Number(lineNumberText);
      const count = Number(countText);
      if (Number.isFinite(lineNumber) && Number.isFinite(count) && !isGeneratedTypeScriptHelperLine(current.path ?? '', lineNumber)) {
        current.lineCounts.set(lineNumber, count);
        if (count === 0) {
          current.uncoveredLines.push(lineNumber);
        }
      }
    } else if (current && line.startsWith('FN:')) {
      const [lineNumberText, ...nameParts] = line.slice(3).split(',');
      const lineNumber = Number(lineNumberText);
      const name = nameParts.join(',');
      if (Number.isFinite(lineNumber) && !isGeneratedTypeScriptHelperLine(current.path ?? '', lineNumber, name)) {
        current.functionLines.push({ line: lineNumber, name });
      }
    } else if (current && line.startsWith('FNDA:')) {
      const [countText, ...nameParts] = line.slice(5).split(',');
      const count = Number(countText);
      if (Number.isFinite(count)) current.functionHits.push({ name: nameParts.join(','), hits: count });
    } else if (current && line.startsWith('BRDA:')) {
      const [lineNumberText, , , hitsText] = line.slice(5).split(',');
      const lineNumber = Number(lineNumberText);
      if (Number.isFinite(lineNumber) && !isGeneratedTypeScriptHelperLine(current.path ?? '', lineNumber)) {
        current.branches.push({ line: lineNumber, hits: hitsText === '-' ? null : Number(hitsText) });
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
      const lineStats = current.lineCounts.size > 0
        ? { found: current.lineCounts.size, hit: [...current.lineCounts.values()].filter((count) => count > 0).length }
        : { found: current.linesFound ?? 0, hit: current.linesHit ?? 0 };
      const functionStats = summarizeFunctions(current.functionLines, current.functionHits, current.functionsFound, current.functionsHit);
      const branchStats = current.branches.length > 0
        ? { found: current.branches.length, hit: current.branches.filter((branch) => branch.hits !== null && branch.hits > 0).length }
        : { found: current.branchesFound ?? 0, hit: current.branchesHit ?? 0 };
      totals.linesHit += lineStats.hit;
      totals.linesFound += lineStats.found;
      totals.functionsHit += functionStats.hit;
      totals.functionsFound += functionStats.found;
      totals.branchesHit += branchStats.hit;
      totals.branchesFound += branchStats.found;
      files.push({
        path: current.path ?? '',
        linesPct: pct(lineStats.hit, lineStats.found),
        branchesPct: pct(branchStats.hit, branchStats.found),
        functionsPct: pct(functionStats.hit, functionStats.found),
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

function summarizeFunctions(
  functions: Array<{ line: number; name: string }>,
  hits: Array<{ name: string; hits: number }>,
  fallbackFound?: number,
  fallbackHit?: number
): { found: number; hit: number } {
  if (functions.length === 0) return { found: fallbackFound ?? 0, hit: fallbackHit ?? 0 };
  const hitsByName = new Map<string, number[]>();
  for (const item of hits) {
    const values = hitsByName.get(item.name) ?? [];
    values.push(item.hits);
    hitsByName.set(item.name, values);
  }
  let hit = 0;
  for (const fn of functions) {
    const values = hitsByName.get(fn.name);
    const count = values?.shift() ?? 0;
    if (count > 0) hit++;
  }
  return { found: functions.length, hit };
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

function isGeneratedTypeScriptHelperLine(filePath: string, lineNumber: number, name = ''): boolean {
  const normalized = filePath.split(path.sep).join('/');
  if (!/^out\/src\/.*\.js$/.test(normalized)) {
    return false;
  }
  return lineNumber <= 34 || name.startsWith('__') || name === 'ownKeys';
}

function normalizeCoveragePath(filePath: string, projectRoot: string): string {
  if (!projectRoot || !path.isAbsolute(filePath)) {
    return filePath.split(path.sep).join('/');
  }
  return path.relative(projectRoot, filePath).split(path.sep).join('/');
}
