import * as path from 'path';
import { TestProject } from '../models';
import { pathExists, readTextIfExists, walkFiles } from '../utils/fs';
import { BaseAdapter, discoverByPatterns, makeProject, projectLabel, textContainsAny } from './shared';

const PY_TEST_PATTERN = (filePath: string) => {
  const base = path.basename(filePath);
  const normalized = filePath.split(path.sep).join('/');
  return base === 'tests.py' || /^test_.*\.py$/.test(base) || /_test\.py$/.test(base) || /\/tests\/test_.*\.py$/.test(normalized);
};

export class DjangoAdapter extends BaseAdapter {
  id = 'django' as const;
  label = 'Django';

  async detectProjects(workspaceFolders: string[]): Promise<TestProject[]> {
    const projects: TestProject[] = [];
    for (const folder of workspaceFolders) {
      const manageFiles = await walkFiles(folder, { include: (filePath) => path.basename(filePath) === 'manage.py' });
      for (const manageFile of manageFiles) {
        const rootPath = path.dirname(manageFile);
        const hasDjango = await dependencyTextContains(rootPath, ['django', 'pytest-django']);
        if (!hasDjango) {
          continue;
        }
        const usesPytest = await hasPytestConfig(rootPath);
        projects.push(
          makeProject({
            framework: this.id,
            rootPath,
            workspaceFolder: folder,
            label: projectLabel('Django app', rootPath, folder),
            testCommand: usesPytest ? 'pytest' : 'python manage.py test',
            coverageCommand: usesPytest ? 'coverage run -m pytest && coverage xml' : 'coverage run manage.py test && coverage xml',
            configFiles: await pythonConfigFiles(rootPath)
          })
        );
      }
    }
    return projects;
  }

  discoverTests(project: TestProject) {
    return discoverByPatterns(project, PY_TEST_PATTERN);
  }
}

export class FastApiAdapter extends BaseAdapter {
  id = 'fastapi' as const;
  label = 'FastAPI';

  async detectProjects(workspaceFolders: string[]): Promise<TestProject[]> {
    const projects: TestProject[] = [];
    for (const folder of workspaceFolders) {
      const roots = await candidatePythonRoots(folder);
      for (const rootPath of roots) {
        if (await pathExists(path.join(rootPath, 'manage.py'))) {
          continue;
        }
        const hasFastApi = await dependencyTextContains(rootPath, ['fastapi']) || (await sourceContains(rootPath, ['from fastapi import', 'import fastapi']));
        if (!hasFastApi) {
          continue;
        }
        projects.push(
          makeProject({
            framework: this.id,
            rootPath,
            workspaceFolder: folder,
            label: projectLabel('FastAPI service', rootPath, folder),
            testCommand: 'pytest',
            coverageCommand: 'coverage run -m pytest && coverage json',
            configFiles: await pythonConfigFiles(rootPath)
          })
        );
      }
    }
    return dedupe(projects);
  }

  discoverTests(project: TestProject) {
    return discoverByPatterns(project, PY_TEST_PATTERN);
  }
}

async function dependencyTextContains(rootPath: string, needles: string[]): Promise<boolean> {
  const files = ['pyproject.toml', 'requirements.txt', 'setup.cfg', 'Pipfile'].map((file) => path.join(rootPath, file));
  for (const file of files) {
    if (await textContainsAny(file, needles)) {
      return true;
    }
  }
  return false;
}

async function hasPytestConfig(rootPath: string): Promise<boolean> {
  return (
    (await pathExists(path.join(rootPath, 'pytest.ini'))) ||
    (await textContainsAny(path.join(rootPath, 'pyproject.toml'), ['[tool.pytest', 'pytest-django'])) ||
    (await textContainsAny(path.join(rootPath, 'setup.cfg'), ['[tool:pytest]']))
  );
}

async function pythonConfigFiles(rootPath: string): Promise<string[]> {
  const names = ['pyproject.toml', 'pytest.ini', 'setup.cfg', 'requirements.txt', 'manage.py'];
  const present: string[] = [];
  for (const name of names) {
    if (await pathExists(path.join(rootPath, name))) {
      present.push(name);
    }
  }
  return present;
}

async function candidatePythonRoots(folder: string): Promise<string[]> {
  const markers = await walkFiles(folder, {
    include: (filePath) => ['pyproject.toml', 'requirements.txt', 'pytest.ini'].includes(path.basename(filePath))
  });
  return [...new Set(markers.map((marker) => path.dirname(marker)))];
}

async function sourceContains(rootPath: string, needles: string[]): Promise<boolean> {
  const files = await walkFiles(rootPath, { maxFiles: 300, include: (filePath) => filePath.endsWith('.py') });
  for (const file of files) {
    const text = await readTextIfExists(file);
    if (text && needles.some((needle) => text.includes(needle))) {
      return true;
    }
  }
  return false;
}

function dedupe(projects: TestProject[]): TestProject[] {
  const unique = [...new Map(projects.map((project) => [project.id, project])).values()];
  return unique.filter(
    (project) =>
      !unique.some(
        (other) =>
          other.id !== project.id &&
          other.framework === project.framework &&
          project.rootPath.startsWith(`${other.rootPath}${path.sep}`) &&
          project.configFiles.length <= other.configFiles.length
      )
  );
}
