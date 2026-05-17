import { spawn } from 'child_process';
import * as path from 'path';
import { TestFile, TestProject, TestRunResult } from '../models';
import { parseJestLikeJson } from './testResults';

export async function runCommand(
  project: TestProject,
  command: string,
  args: string[],
  parseOutput = true,
  options: { timeoutMs?: number; env?: NodeJS.ProcessEnv } = {}
): Promise<TestRunResult> {
  const startedAt = Date.now();
  const child = spawn(command, args, {
    cwd: project.rootPath,
    shell: false,
    env: { ...process.env, ...options.env }
  });
  let stdout = '';
  let stderr = '';
  let timedOut = false;
  const timeout = options.timeoutMs
    ? setTimeout(() => {
        timedOut = true;
        stderr += `\nCommand timed out after ${Math.round((options.timeoutMs ?? 0) / 1000)} seconds.`;
        child.kill('SIGTERM');
      }, options.timeoutMs)
    : undefined;
  child.stdout.on('data', (chunk: Buffer) => {
    stdout += chunk.toString();
  });
  child.stderr.on('data', (chunk: Buffer) => {
    stderr += chunk.toString();
  });

  const exitCode = await new Promise<number | null>((resolve) => {
    child.on('close', resolve);
    child.on('error', (error) => {
      stderr += error.message;
      resolve(null);
    });
  });
  if (timeout) {
    clearTimeout(timeout);
  }

  let parseError = '';
  const testFiles = parseOutput ? safeParseJestLikeJson(project, stdout, (message) => (parseError = message)) : [];
  return {
    projectId: project.id,
    command: [command, ...args].join(' '),
    exitCode: timedOut ? null : exitCode,
    stdout,
    stderr: parseError ? `${stderr}\n${parseError}`.trim() : stderr,
    testFiles,
    startedAt,
    endedAt: Date.now()
  };
}

export async function runCoverage(project: TestProject, onOutput?: (line: string) => void): Promise<TestRunResult> {
  const commands = coverageCommands(project);
  const startedAt = Date.now();
  let stdout = '';
  let stderr = '';
  let exitCode: number | null = 0;

  if (commands.length === 0) {
    return {
      projectId: project.id,
      command: 'No coverage command configured',
      exitCode: null,
      stdout: '',
      stderr: 'No explicit coverage script was found. Add a package.json coverage script or generate coverage outside Test Inspector.',
      testFiles: [],
      startedAt,
      endedAt: Date.now()
    };
  }

  for (const item of commands) {
    onOutput?.(`$ ${[item.command, ...item.args].join(' ')}`);
    const result = await runCommand(project, item.command, item.args, false, {
      timeoutMs: 10 * 60 * 1000,
      env: { CI: 'true', NODE_OPTIONS: '--max-old-space-size=4096' }
    });
    stdout += result.stdout ? `${result.stdout}\n` : '';
    stderr += result.stderr ? `${result.stderr}\n` : '';
    onOutput?.(result.stdout.trim());
    onOutput?.(result.stderr.trim());
    exitCode = result.exitCode;
    if (exitCode !== 0) {
      break;
    }
  }

  return {
    projectId: project.id,
    command: commands.map((item) => [item.command, ...item.args].join(' ')).join(' && '),
    exitCode,
    stdout,
    stderr,
    testFiles: [],
    startedAt,
    endedAt: Date.now()
  };
}

export function coverageCommandPreview(project: TestProject): string[] {
  return coverageCommands(project).map((item) => [item.command, ...item.args].join(' '));
}

function safeParseJestLikeJson(project: TestProject, stdout: string, onError: (message: string) => void): TestFile[] {
  try {
    return parseJestLikeJson(project, stdout);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    onError(message);
    return [];
  }
}

export function jsRunner(project: TestProject): { command: string; baseArgs: string[] } {
  const packageManager = 'npm';
  const script = project.testCommand?.startsWith('npm run ') ? project.testCommand.slice('npm run '.length) : 'test';
  return { command: packageManager, baseArgs: ['run', script, '--'] };
}

export function pythonRunner(project: TestProject): { command: string; baseArgs: string[] } {
  if (project.testCommand === 'python manage.py test') {
    return { command: 'python', baseArgs: ['manage.py', 'test'] };
  }
  return { command: 'pytest', baseArgs: [] };
}

export function flutterRunner(): { command: string; baseArgs: string[] } {
  return { command: 'flutter', baseArgs: ['test'] };
}

function coverageCommands(project: TestProject): Array<{ command: string; args: string[] }> {
  if (project.framework === 'flutter') {
    return [{ command: 'flutter', args: ['test', '--coverage'] }];
  }
  if (project.framework === 'django') {
    if (project.testCommand === 'python manage.py test') {
      return [
        { command: 'coverage', args: ['run', 'manage.py', 'test'] },
        { command: 'coverage', args: ['xml'] },
        { command: 'coverage', args: ['json'] }
      ];
    }
    return [
      { command: 'coverage', args: ['run', '-m', 'pytest'] },
      { command: 'coverage', args: ['xml'] },
      { command: 'coverage', args: ['json'] }
    ];
  }
  if (project.framework === 'fastapi') {
    return [
      { command: 'coverage', args: ['run', '-m', 'pytest'] },
      { command: 'coverage', args: ['xml'] },
      { command: 'coverage', args: ['json'] }
    ];
  }
  if (project.coverageCommand?.startsWith('npm run ')) {
    return [{ command: 'npm', args: ['run', project.coverageCommand.slice('npm run '.length)] }];
  }
  return [];
}

export function relativeArg(project: TestProject, filePath: string): string {
  return path.relative(project.rootPath, filePath);
}

export function emptyRun(project: TestProject, command: string): TestRunResult {
  const now = Date.now();
  return { projectId: project.id, command, exitCode: null, stdout: '', stderr: '', testFiles: [], startedAt: now, endedAt: now };
}

export function mergeRunResults(project: TestProject, result: TestRunResult, fallbackTests: TestFile[]): TestRunResult {
  return {
    ...result,
    testFiles: result.testFiles.length > 0 ? result.testFiles : fallbackTests
  };
}
