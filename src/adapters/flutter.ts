import * as path from 'path';
import { TestProject } from '../models';
import { pathExists, walkFiles } from '../utils/fs';
import { BaseAdapter, discoverByPatterns, makeProject, projectLabel, textContainsAny } from './shared';

export class FlutterAdapter extends BaseAdapter {
  id = 'flutter' as const;
  label = 'Flutter';

  async detectProjects(workspaceFolders: string[]): Promise<TestProject[]> {
    const projects: TestProject[] = [];
    for (const folder of workspaceFolders) {
      const pubspecs = await walkFiles(folder, { include: (filePath) => path.basename(filePath) === 'pubspec.yaml' });
      for (const pubspec of pubspecs) {
        const rootPath = path.dirname(pubspec);
        const hasFlutter = await textContainsAny(pubspec, ['flutter:']);
        const hasTests = await pathExists(path.join(rootPath, 'test'));
        if (!hasFlutter || !hasTests) {
          continue;
        }
        projects.push(
          makeProject({
            framework: this.id,
            rootPath,
            workspaceFolder: folder,
            label: projectLabel('Flutter app', rootPath, folder),
            testCommand: 'flutter test',
            coverageCommand: 'flutter test --coverage',
            configFiles: ['pubspec.yaml']
          })
        );
      }
    }
    return projects;
  }

  discoverTests(project: TestProject) {
    return discoverByPatterns(project, (filePath) => filePath.endsWith('_test.dart') && filePath.split(path.sep).includes('test'));
  }
}
