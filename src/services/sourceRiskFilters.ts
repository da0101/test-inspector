import * as path from 'path';
import type { TestProject } from '../models';
import { normalizePath } from '../utils/path';

export function isRelevantSource(project: TestProject, filePath: string): boolean {
  const rel = normalizePath(path.relative(project.rootPath, filePath));
  if (
    /(\.d\.ts|setupTests?\.(js|ts)|testHelpers?\.(js|ts)|mock|fixture|stories\.|\.g\.dart|\.freezed\.dart|\.gr\.dart|\.mocks\.dart)$/.test(rel)
  ) {
    return false;
  }
  if (/^(coverage|dist|build|out|node_modules|\.next|\.turbo|public|storybook)\//.test(rel)) {
    return false;
  }
  if (/(\b|\/)(style|styles|icons?|types?|interfaces?)\.(ts|tsx|js|jsx)$/.test(rel)) {
    return false;
  }
  if (project.framework === 'node') {
    return /^(src|lib)\//.test(rel);
  }
  if (project.framework === 'react' || project.framework === 'firebase-functions') {
    if (/^src\/(assets|img|images|icons|styles|fonts)\//.test(rel)) {
      return false;
    }
    return /^(src|app|pages|components|lib|functions\/src)\//.test(rel);
  }
  if (project.framework === 'flutter') {
    if (
      /(^|\/)(generated|gen|l10n\/generated)\//.test(rel) ||
      /(^|\/)(app_localizations(?:_[a-z_]+)?|firebase_options|generated_plugin_registrant)\.dart$/.test(rel)
    ) {
      return false;
    }
    return /^lib\//.test(rel);
  }
  if (project.framework === 'django' || project.framework === 'fastapi') {
    return !/^tests?\//.test(rel) && !/(^|\/)(migrations)\//.test(rel);
  }
  return true;
}
