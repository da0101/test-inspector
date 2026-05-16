import * as path from 'path';
import { TestProject } from '../models';
import { walkFiles } from '../utils/fs';
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

export class ReactAdapter extends BaseAdapter {
  id = 'react' as const;
  label = 'React';

  async detectProjects(workspaceFolders: string[]): Promise<TestProject[]> {
    const projects: TestProject[] = [];
    for (const folder of workspaceFolders) {
      const packageFiles = await walkFiles(folder, { include: (filePath) => path.basename(filePath) === 'package.json' });
      for (const packageFile of packageFiles) {
        const rootPath = path.dirname(packageFile);
        const pkg = await packageJsonAt(rootPath);
        const hasReact = hasAnyDependency(pkg, ['react']);
        const hasTestRunner = hasAnyDependency(pkg, ['jest', 'vitest', '@testing-library/react']);
        if (!hasReact || !hasTestRunner) {
          continue;
        }
        projects.push(
          makeProject({
            framework: this.id,
            rootPath,
            workspaceFolder: folder,
            label: projectLabel('React app', rootPath, folder),
            testCommand: scriptCommand(pkg, ['test', 'test:unit']),
            coverageCommand: coverageScriptCommand(pkg),
            configFiles: await findConfigFiles(rootPath, ['jest.config.*', 'vitest.config.*', 'vite.config.*'])
          })
        );
      }
    }
    return projects;
  }

  discoverTests(project: TestProject) {
    return discoverByPatterns(project, (filePath) => {
      const normalized = filePath.split(path.sep).join('/');
      return /\.(test|spec)\.(ts|tsx|js|jsx)$/.test(normalized) || /\/__tests__\/.*\.(ts|tsx|js|jsx)$/.test(normalized);
    });
  }
}
