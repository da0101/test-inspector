import * as path from 'path';
import * as vscode from 'vscode';
import { ChangedFileRisk, CoverageFile, QualityFinding, TestFile, TestProject } from '../models';

export type InspectorTreeNode =
  | { type: 'project'; project: TestProject }
  | { type: 'testFile'; testFile: TestFile; project?: TestProject }
  | { type: 'testCase'; label: string; status: string; line?: number }
  | { type: 'coverageProject'; projectId: string; label: string; linesPct?: number }
  | { type: 'coverageFile'; coverage: CoverageFile; project?: TestProject }
  | { type: 'finding'; finding: QualityFinding }
  | { type: 'changedFile'; risk: ChangedFileRisk }
  | { type: 'detail'; label: string; description?: string; icon?: vscode.ThemeIcon };

export function toTreeItem(node: InspectorTreeNode): vscode.TreeItem {
  switch (node.type) {
    case 'project': {
      const item = new vscode.TreeItem(node.project.label, vscode.TreeItemCollapsibleState.Collapsed);
      item.description = node.project.framework;
      item.tooltip = node.project.rootPath;
      item.contextValue = 'testInspector.project';
      item.iconPath = new vscode.ThemeIcon('folder-library');
      return item;
    }
    case 'testFile': {
      const item = new vscode.TreeItem(path.basename(node.testFile.path), vscode.TreeItemCollapsibleState.Collapsed);
      item.description = `${node.testFile.testCases.length} tests`;
      item.tooltip = node.testFile.path;
      item.contextValue = 'testInspector.testFile';
      item.resourceUri = vscode.Uri.file(node.testFile.path);
      item.iconPath = statusIcon(node.testFile.status);
      return item;
    }
    case 'testCase': {
      const item = new vscode.TreeItem(node.label, vscode.TreeItemCollapsibleState.None);
      item.description = node.status;
      item.iconPath = statusIcon(node.status);
      return item;
    }
    case 'coverageProject': {
      const item = new vscode.TreeItem(node.label, vscode.TreeItemCollapsibleState.Collapsed);
      item.description = node.linesPct === undefined ? 'unknown' : `${node.linesPct}% lines`;
      item.iconPath = new vscode.ThemeIcon('graph');
      return item;
    }
    case 'coverageFile': {
      const item = new vscode.TreeItem(path.basename(node.coverage.path), vscode.TreeItemCollapsibleState.None);
      item.description = node.coverage.linesPct === undefined ? 'unknown' : `${node.coverage.linesPct}%`;
      item.tooltip = node.coverage.path;
      item.iconPath = coverageIcon(node.coverage.linesPct);
      return item;
    }
    case 'finding': {
      const item = new vscode.TreeItem(node.finding.message, vscode.TreeItemCollapsibleState.None);
      item.description = node.finding.kind;
      item.tooltip = `${node.finding.filePath}${node.finding.line ? `:${node.finding.line}` : ''}`;
      item.resourceUri = vscode.Uri.file(node.finding.filePath);
      item.iconPath = severityIcon(node.finding.severity);
      return item;
    }
    case 'changedFile': {
      const item = new vscode.TreeItem(path.basename(node.risk.path), vscode.TreeItemCollapsibleState.Collapsed);
      item.description = `${node.risk.relatedTests.length} related`;
      item.tooltip = node.risk.path;
      item.resourceUri = vscode.Uri.file(node.risk.path);
      item.iconPath = node.risk.findings.length ? new vscode.ThemeIcon('warning') : new vscode.ThemeIcon('check');
      return item;
    }
    case 'detail': {
      const item = new vscode.TreeItem(node.label, vscode.TreeItemCollapsibleState.None);
      item.description = node.description;
      item.iconPath = node.icon;
      return item;
    }
  }
}

function statusIcon(status: string): vscode.ThemeIcon {
  if (status === 'passed') {
    return new vscode.ThemeIcon('pass');
  }
  if (status === 'failed') {
    return new vscode.ThemeIcon('error');
  }
  if (status === 'skipped') {
    return new vscode.ThemeIcon('debug-step-over');
  }
  if (status === 'mixed') {
    return new vscode.ThemeIcon('warning');
  }
  return new vscode.ThemeIcon('circle-outline');
}

function severityIcon(severity: string): vscode.ThemeIcon {
  if (severity === 'error') {
    return new vscode.ThemeIcon('error');
  }
  if (severity === 'warning') {
    return new vscode.ThemeIcon('warning');
  }
  return new vscode.ThemeIcon('info');
}

function coverageIcon(linesPct: number | undefined): vscode.ThemeIcon {
  if (linesPct === undefined) {
    return new vscode.ThemeIcon('question');
  }
  if (linesPct < 50) {
    return new vscode.ThemeIcon('error');
  }
  if (linesPct < 80) {
    return new vscode.ThemeIcon('warning');
  }
  return new vscode.ThemeIcon('graph');
}
