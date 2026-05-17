import * as path from 'path';
import { TestProject } from '../models';
import {
  BaseAdapter,
  coverageScriptCommand,
  discoverByPatterns,
  findConfigFiles,
  hasAnyDependency,
  makeProject,
  packageJsonAt,
  projectLabel,
  scriptCommand
} from './shared';
import { walkFiles } from '../utils/fs';

export class NodeAdapter extends BaseAdapter {
  id = 'node' as const;
  label = 'Node.js';

  async detectProjects(workspaceFolders: string[]): Promise<TestProject[]> {
    const projects: TestProject[] = [];
    for (const folder of workspaceFolders) {
      const packageFiles = await walkFiles(folder, { include: (filePath) => path.basename(filePath) === 'package.json' });
      for (const packageFile of packageFiles) {
        const rootPath = path.dirname(packageFile);
        const pkg = await packageJsonAt(rootPath);
        if (!pkg?.scripts?.test || hasSpecificJsFramework(pkg)) {
          continue;
        }
        projects.push(
          makeProject({
            framework: this.id,
            rootPath,
            workspaceFolder: folder,
            label: projectLabel('Node.js project', rootPath, folder),
            testCommand: scriptCommand(pkg, ['test', 'test:unit']),
            coverageCommand: coverageScriptCommand(pkg),
            configFiles: await findConfigFiles(rootPath, ['tsconfig.json', 'jest.config.*', 'vitest.config.*', 'mocha.*', '.mocharc.*'])
          })
        );
      }
    }
    return projects;
  }

  discoverTests(project: TestProject) {
    return discoverByPatterns(project, (filePath) => {
      const normalized = filePath.split(path.sep).join('/');
      const rel = path.relative(project.rootPath, filePath).split(path.sep).join('/');
      if (rel === 'test/fixtures' || rel.startsWith('test/fixtures/')) {
        return false;
      }
      if (!/\.(test|spec)\.(ts|tsx|js|jsx|mjs|cjs)$/.test(normalized)) {
        return false;
      }
      return /(^|\/)(test|tests|__tests__)\//.test(normalized);
    });
  }
}

function hasSpecificJsFramework(pkg: NonNullable<Awaited<ReturnType<typeof packageJsonAt>>>): boolean {
  return hasAnyDependency(pkg, ['react', 'vue', 'firebase-functions', 'firebase-admin']);
}
