import * as path from 'path';
import { TestProject } from '../models';
import { pathExists, walkFiles } from '../utils/fs';
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

export class FirebaseFunctionsAdapter extends BaseAdapter {
  id = 'firebase-functions' as const;
  label = 'Firebase Functions';

  async detectProjects(workspaceFolders: string[]): Promise<TestProject[]> {
    const projects: TestProject[] = [];
    for (const folder of workspaceFolders) {
      const firebaseFiles = await walkFiles(folder, { include: (filePath) => path.basename(filePath) === 'firebase.json' });
      for (const firebaseFile of firebaseFiles) {
        const firebaseRoot = path.dirname(firebaseFile);
        const functionsRoot = path.join(firebaseRoot, 'functions');
        const rootPath = (await pathExists(path.join(functionsRoot, 'package.json'))) ? functionsRoot : firebaseRoot;
        const pkg = await packageJsonAt(rootPath);
        if (!hasAnyDependency(pkg, ['firebase-functions', 'firebase-admin'])) {
          continue;
        }
        projects.push(
          makeProject({
            framework: this.id,
            rootPath,
            workspaceFolder: folder,
            label: projectLabel('Firebase functions', rootPath, folder),
            testCommand: scriptCommand(pkg, ['test', 'test:unit']),
            coverageCommand: coverageScriptCommand(pkg),
            configFiles: ['package.json', ...((await findConfigFiles(rootPath, ['jest.config.*', 'mocha.*', '.mocharc.*'])).filter(Boolean))]
          })
        );
      }
    }
    return projects;
  }

  discoverTests(project: TestProject) {
    return discoverByPatterns(project, (filePath) => {
      const normalized = filePath.split(path.sep).join('/');
      return /\.(test|spec)\.(ts|js)$/.test(normalized) || /\/test\/.*\.(ts|js)$/.test(normalized);
    });
  }
}
