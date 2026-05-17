import assert from 'node:assert/strict';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import * as path from 'node:path';
import { test } from 'node:test';
import { createAdapters } from '../../src/adapters';
import { coverageScriptCommand } from '../../src/adapters/shared';

const fixtureRoot = path.resolve(process.cwd(), 'test/fixtures');

test('detects target framework projects from fixtures', async () => {
  const adapters = createAdapters();
  const projects = (await Promise.all(adapters.map((adapter) => adapter.detectProjects([fixtureRoot])))).flat();
  assert.deepEqual(
    projects.map((project) => project.framework).sort(),
    ['django', 'fastapi', 'firebase-functions', 'flutter', 'react']
  );
});

test('detects this extension as a Node.js test project', async () => {
  const node = createAdapters().find((adapter) => adapter.id === 'node');
  assert.ok(node);
  const projects = await node.detectProjects([process.cwd()]);
  const project = projects.find((item) => item.rootPath === process.cwd());

  assert.ok(project);
  assert.equal(project.framework, 'node');
  assert.equal(project.testCommand, 'npm run test');
  assert.equal(project.coverageCommand, 'npm run coverage');
});

test('Node.js self-scan excludes adapter fixture tests', async () => {
  const node = createAdapters().find((adapter) => adapter.id === 'node');
  assert.ok(node);
  const [project] = await node.detectProjects([process.cwd()]);
  assert.ok(project);
  const tests = await node.discoverTests(project);

  assert.equal(tests.some((item) => item.path.split(path.sep).join('/').includes('/test/fixtures/')), false);
});

test('discovers tests and basic quality findings', async () => {
  const react = createAdapters().find((adapter) => adapter.id === 'react');
  assert.ok(react);
  const [project] = await react.detectProjects([fixtureRoot]);
  const tests = await react.discoverTests(project);
  const findings = await react.analyzeQuality(project, tests);
  assert.equal(tests.length, 1);
  assert.equal(tests[0].testCases.length, 2);
  assert.ok(findings.some((finding) => finding.kind === 'skipped-test'));
});

test('discovers Firebase, Flutter, Django, and FastAPI fixture tests', async () => {
  const adapters = createAdapters();
  const projects = (await Promise.all(adapters.map((adapter) => adapter.detectProjects([fixtureRoot])))).flat();

  for (const framework of ['firebase-functions', 'flutter', 'django', 'fastapi'] as const) {
    const adapter = adapters.find((item) => item.id === framework);
    const project = projects.find((item) => item.framework === framework);
    assert.ok(adapter);
    assert.ok(project);

    const tests = await adapter.discoverTests(project);

    assert.ok(tests.length > 0, `${framework} should discover tests`);
    assert.equal(tests.every((item) => item.projectId === project.id), true);
  }
});

test('Firebase detection accepts functions/package.json and ignores projects without Firebase dependencies', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'test-inspector-firebase-detect-'));
  try {
    await mkdir(path.join(root, 'with-functions', 'functions'), { recursive: true });
    await mkdir(path.join(root, 'without-deps', 'functions'), { recursive: true });
    await writeFile(path.join(root, 'with-functions', 'firebase.json'), '{}');
    await writeFile(path.join(root, 'without-deps', 'firebase.json'), '{}');
    await writeFile(
      path.join(root, 'with-functions', 'functions', 'package.json'),
      JSON.stringify({ scripts: { test: 'jest', coverage: 'jest --coverage' }, dependencies: { 'firebase-functions': '^4.0.0' } })
    );
    await writeFile(path.join(root, 'without-deps', 'functions', 'package.json'), JSON.stringify({ scripts: { test: 'jest' } }));
    const firebase = createAdapters().find((adapter) => adapter.id === 'firebase-functions');
    assert.ok(firebase);

    const projects = await firebase.detectProjects([root]);

    assert.equal(projects.length, 1);
    assert.equal(projects[0]!.rootPath, path.join(root, 'with-functions', 'functions'));
    assert.equal(projects[0]!.coverageCommand, 'npm run coverage');
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('Flutter detection requires both a flutter pubspec and a test directory', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'test-inspector-flutter-detect-'));
  try {
    await mkdir(path.join(root, 'valid', 'test'), { recursive: true });
    await mkdir(path.join(root, 'missing-tests'), { recursive: true });
    await mkdir(path.join(root, 'plain-dart', 'test'), { recursive: true });
    await writeFile(path.join(root, 'valid', 'pubspec.yaml'), 'dependencies:\n  flutter:\n    sdk: flutter\n');
    await writeFile(path.join(root, 'missing-tests', 'pubspec.yaml'), 'dependencies:\n  flutter:\n    sdk: flutter\n');
    await writeFile(path.join(root, 'plain-dart', 'pubspec.yaml'), 'name: plain_dart\n');
    const flutter = createAdapters().find((adapter) => adapter.id === 'flutter');
    assert.ok(flutter);

    const projects = await flutter.detectProjects([root]);

    assert.deepEqual(projects.map((project) => path.basename(project.rootPath)), ['valid']);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('Python adapters choose pytest commands, skip Django roots from FastAPI, and detect source imports', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'test-inspector-python-detect-'));
  try {
    await mkdir(path.join(root, 'django-pytest'), { recursive: true });
    await mkdir(path.join(root, 'django-manage'), { recursive: true });
    await mkdir(path.join(root, 'fastapi-src', 'app'), { recursive: true });
    await writeFile(path.join(root, 'django-pytest', 'manage.py'), '');
    await writeFile(path.join(root, 'django-pytest', 'requirements.txt'), 'django\n');
    await writeFile(path.join(root, 'django-pytest', 'pytest.ini'), '[pytest]\n');
    await writeFile(path.join(root, 'django-manage', 'manage.py'), '');
    await writeFile(path.join(root, 'django-manage', 'requirements.txt'), 'django\n');
    await writeFile(path.join(root, 'fastapi-src', 'pyproject.toml'), '[project]\nname = "svc"\n');
    await writeFile(path.join(root, 'fastapi-src', 'app', 'main.py'), 'from fastapi import FastAPI\napp = FastAPI()\n');
    const adapters = createAdapters();
    const django = adapters.find((adapter) => adapter.id === 'django');
    const fastapi = adapters.find((adapter) => adapter.id === 'fastapi');
    assert.ok(django);
    assert.ok(fastapi);

    const djangoProjects = await django.detectProjects([root]);
    const fastapiProjects = await fastapi.detectProjects([root]);

    assert.equal(djangoProjects.length, 2);
    assert.equal(djangoProjects.find((project) => project.rootPath.endsWith('django-pytest'))?.testCommand, 'pytest');
    assert.equal(djangoProjects.find((project) => project.rootPath.endsWith('django-manage'))?.testCommand, 'python manage.py test');
    assert.deepEqual(fastapiProjects.map((project) => path.basename(project.rootPath)), ['fastapi-src']);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('coverage command detection does not fall back to plain test script', () => {
  assert.equal(coverageScriptCommand({ scripts: { test: 'jest --runInBand' } }), undefined);
  assert.equal(coverageScriptCommand({ scripts: { coverage: 'jest --coverage' } }), 'npm run coverage');
  assert.equal(coverageScriptCommand({ scripts: { test: 'jest --coverage --runInBand' } }), 'npm run test');
});

test('Node.js adapter runs a specific test file without Jest-only flags', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'test-inspector-node-run-file-'));
  try {
    await mkdir(path.join(root, 'test'), { recursive: true });
    const testPath = path.join(root, 'test', 'sample.test.js');
    await writeFile(path.join(root, 'package.json'), JSON.stringify({ scripts: { test: 'node --test' } }));
    await writeFile(
      testPath,
      "const test = require('node:test');\nconst assert = require('node:assert/strict');\ntest('sample passes', () => assert.equal(1, 1));\n"
    );
    const node = createAdapters().find((adapter) => adapter.id === 'node');
    assert.ok(node);
    const [project] = await node.detectProjects([root]);

    const result = await node.runFile(project, testPath);

    assert.equal(result.exitCode, 0);
    assert.match(result.command, /npm run test -- test\/sample\.test\.js/);
    assert.doesNotMatch(result.command, /--json/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
