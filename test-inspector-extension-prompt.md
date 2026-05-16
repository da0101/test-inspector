# Prompt: Build a VS Code Test Inspector Extension for My Daily Stack

You are Codex acting as a senior product-minded engineer. Your task is to research, design, plan, and implement a VS Code extension that helps me understand and improve the quality of unit/integration tests across the frameworks I use day to day.

## Product Idea

Build a VS Code extension tentatively called **Test Inspector**.

The extension should help a developer answer:

- How many tests exist in this repo or workspace?
- Which frameworks/projects are present?
- Which tests are passing, failing, skipped, slow, flaky, stale, or weak?
- What is the test coverage?
- Which changed/source files have missing or weak test coverage?
- Which tests are relevant to the file I am editing or the files I changed?
- Are there tests that do not assert anything meaningful?
- Are there source files that should have tests but do not?
- Can I generate a clear local report before I commit or open a PR?

This should start with my actual daily stack, not a generic all-framework tool.

## Frameworks To Support First

Prioritize these adapters:

1. **React**
   - Jest
   - Vitest
   - React Testing Library
   - Coverage through LCOV or JSON output

2. **Flutter**
   - `flutter test`
   - `flutter test --coverage`
   - `coverage/lcov.info`

3. **Django**
   - pytest-django
   - Django test runner if present
   - coverage.py XML or JSON

4. **FastAPI**
   - pytest
   - httpx/TestClient-style tests
   - coverage.py XML or JSON

5. **Firebase Functions**
   - Jest or Mocha depending on project config
   - Firebase emulator-based tests when detectable
   - Coverage through Istanbul/LCOV if available

Do not try to support every test framework at first. Make the extension excellent for these five ecosystems.

## Why This Should Exist

Existing VS Code test views are useful for running tests, but they do not give enough product-level insight into test health. GitHub Desktop shows code changes well, but it does not explain test risk. Coverage tools show percentages, but not whether the tests are useful or related to the current work.

This extension should become a local-first test intelligence tool. The core value is not just running tests. The value is turning a messy test suite into an understandable map:

- What exists
- What passed/failed
- What changed
- What is covered
- What is suspicious
- What should be tested next

The extension should be useful without AI. An optional LLM layer may be added later for deeper analysis and suggestions, but the core product must work from local test files, test commands, coverage files, and Git metadata.

## High-Level UX

Create a VS Code Activity Bar view called **Test Inspector**.

The UI should feel like a professional developer tool, not a marketing page. It should be dense, scannable, and useful inside a sidebar.

Suggested views:

1. **Projects**
   - Shows detected test projects grouped by framework.
   - Example:
     - React app: `web/`
     - Flutter app: `mobile/`
     - Django app: `backend/`
     - FastAPI service: `api/`
     - Firebase functions: `functions/`

2. **Tests**
   - Tree of test files and test cases.
   - Show pass/fail/skipped/unknown status.
   - Show duration when available.
   - Allow run file, run suite, run all, run related tests.

3. **Coverage**
   - Show coverage summary per project.
   - Show file-level coverage.
   - Highlight files changed in Git with low or missing coverage.

4. **Quality**
   - Show warnings such as:
     - skipped tests
     - focused tests (`only`, `fit`, `describe.only`, etc.)
     - no assertions
     - snapshot-only tests
     - very slow tests
     - stale tests that target deleted/moved source files
     - source files with no obvious related tests

5. **Changed Files**
   - Use Git to detect changed files.
   - For each changed source file, show:
     - related tests found
     - coverage if known
     - quality warnings
     - recommended command to run

## Core Design Requirement

Use an adapter-based architecture.

Each framework adapter should implement a common interface like:

```ts
interface TestFrameworkAdapter {
  id: string
  label: string
  detectProjects(workspaceFolders: vscode.WorkspaceFolder[]): Promise<TestProject[]>
  discoverTests(project: TestProject): Promise<TestFile[]>
  runAll(project: TestProject): Promise<TestRunResult>
  runFile(project: TestProject, filePath: string): Promise<TestRunResult>
  runRelated(project: TestProject, sourceFilePath: string): Promise<TestRunResult | null>
  readCoverage(project: TestProject): Promise<CoverageSummary | null>
  analyzeQuality(project: TestProject, tests: TestFile[]): Promise<QualityFinding[]>
}
```

The extension core should not know framework details. The core should:

- load adapters
- call project detection
- normalize results
- render VS Code tree views/webviews
- store recent run state
- manage commands
- coordinate Git changed-file detection

## Data Model Ideas

Use normalized internal types similar to:

```ts
type TestProject = {
  id: string
  rootPath: string
  framework: 'react' | 'flutter' | 'django' | 'fastapi' | 'firebase-functions'
  label: string
  testCommand?: string
  coverageCommand?: string
  configFiles: string[]
}

type TestFile = {
  path: string
  projectId: string
  testCases: TestCase[]
  status: 'unknown' | 'passed' | 'failed' | 'skipped' | 'mixed'
  durationMs?: number
  qualityFindings: QualityFinding[]
}

type TestCase = {
  id: string
  name: string
  filePath: string
  line?: number
  status: 'unknown' | 'passed' | 'failed' | 'skipped'
  durationMs?: number
  errorMessage?: string
}

type CoverageSummary = {
  projectId: string
  files: CoverageFile[]
  totals: {
    linesPct?: number
    branchesPct?: number
    functionsPct?: number
    statementsPct?: number
  }
}

type CoverageFile = {
  path: string
  linesPct?: number
  branchesPct?: number
  functionsPct?: number
  statementsPct?: number
  uncoveredLines?: number[]
}

type QualityFinding = {
  id: string
  severity: 'info' | 'warning' | 'error'
  kind:
    | 'skipped-test'
    | 'focused-test'
    | 'no-assertion'
    | 'snapshot-only'
    | 'slow-test'
    | 'missing-related-test'
    | 'missing-coverage'
    | 'stale-test'
    | 'parse-error'
  message: string
  filePath: string
  line?: number
}
```

## Framework Detection Details

### React Adapter

Detect React/Jest/Vitest projects using:

- `package.json`
- dependencies/devDependencies:
  - `react`
  - `jest`
  - `vitest`
  - `@testing-library/react`
- config files:
  - `jest.config.*`
  - `vitest.config.*`
  - `vite.config.*`

Test file patterns:

- `**/*.test.ts`
- `**/*.test.tsx`
- `**/*.spec.ts`
- `**/*.spec.tsx`
- `__tests__/**/*.{js,jsx,ts,tsx}`

Quality checks:

- `.only`
- `.skip`
- `fit`, `xit`
- tests without `expect`, `assert`, or Testing Library assertions
- snapshot-only tests
- excessive snapshots maybe as warning

Coverage:

- Prefer `coverage/lcov.info`
- Also support `coverage/coverage-final.json` if easy

### Flutter Adapter

Detect Flutter projects using:

- `pubspec.yaml`
- `test/` directory

Test file patterns:

- `test/**/*_test.dart`

Commands:

- `flutter test`
- `flutter test --coverage`

Coverage:

- `coverage/lcov.info`

Quality checks:

- skipped tests
- tests with empty bodies
- tests with no obvious expectations
- slow tests from machine-readable output if available

Research how to get structured Flutter test output. Prefer official or stable JSON reporter if available.

### Django Adapter

Detect Django projects using:

- `manage.py`
- `settings.py`
- `pyproject.toml`
- `pytest.ini`
- `requirements.txt`
- dependencies such as `django`, `pytest-django`

Test file patterns:

- `**/tests.py`
- `**/tests/test_*.py`
- `**/test_*.py`

Commands:

- Prefer project-defined scripts if present.
- Otherwise use `pytest` when pytest config exists.
- Fall back to `python manage.py test` when appropriate.

Coverage:

- `coverage xml`
- `coverage json`
- `.coverage` if available

Quality checks:

- `@pytest.mark.skip`
- `unittest.skip`
- tests with no assertions
- tests that only instantiate objects and never assert
- stale tests importing missing modules

### FastAPI Adapter

Detect FastAPI projects using:

- `pyproject.toml`
- `requirements.txt`
- imports/dependencies containing `fastapi`
- common app files like `main.py`, `app/main.py`

Test patterns same as pytest:

- `tests/test_*.py`
- `test_*.py`

Quality checks:

- same pytest checks
- optionally detect route files with no API tests
- detect tests that call endpoints but never assert status/body

Coverage same as Python coverage.py.

### Firebase Functions Adapter

Detect Firebase Functions projects using:

- `firebase.json`
- `functions/package.json`
- dependencies:
  - `firebase-functions`
  - `firebase-admin`
  - Jest/Mocha/ts-jest

Test file patterns:

- `functions/**/*.test.ts`
- `functions/**/*.spec.ts`
- `functions/test/**/*`

Commands:

- Use `functions/package.json` scripts first.
- Common scripts: `npm test`, `npm run test`, `npm run test:unit`.

Coverage:

- Istanbul/LCOV from `functions/coverage/lcov.info`

Quality checks:

- skipped/focused tests
- no assertions
- emulator tests not configured when functions appear to require emulator

## Git Integration

Use local Git to detect changed files.

Do not depend on GitHub APIs.

Recommended commands:

```bash
git -C <repo> status --porcelain=v1
git -C <repo> diff --name-only HEAD --
git -C <repo> ls-files
```

The extension should map changed source files to likely tests using heuristics:

- Same basename:
  - `Button.tsx` -> `Button.test.tsx`
  - `views.py` -> `test_views.py`
  - `user_service.py` -> `test_user_service.py`
- Same directory or sibling `__tests__` / `tests` folder
- Import graph if cheap and reliable
- Coverage file if available

## Commands To Expose

Add VS Code commands:

- `Test Inspector: Refresh Projects`
- `Test Inspector: Discover Tests`
- `Test Inspector: Run All Tests`
- `Test Inspector: Run Tests In Current File`
- `Test Inspector: Run Related Tests For Current File`
- `Test Inspector: Generate Coverage Report`
- `Test Inspector: Show Changed File Test Risk`
- `Test Inspector: Export Test Report`

## Reports

The extension should generate a readable report, preferably as Markdown first.

Example sections:

```md
# Test Inspector Report

## Summary
- Projects detected: 3
- Test files: 128
- Test cases: 920
- Passing: 880
- Failing: 6
- Skipped: 34
- Coverage: 72% lines

## Changed Files Risk
| File | Related Tests | Coverage | Findings |
|---|---:|---:|---|
| src/foo.ts | 0 | 0% | missing related test |

## Quality Findings
- warning: `src/Button.test.tsx` has snapshot-only coverage
- error: `tests/test_users.py` has focused/skipped test

## Recommended Commands
```bash
npm test -- Button.test.tsx
pytest tests/test_users.py
flutter test test/widget_test.dart
```
```

## Optional LLM Layer

The core extension must work without AI.

Add AI later as an optional provider interface:

```ts
interface LlmProvider {
  id: string
  summarizeFindings(report: TestInspectorReport): Promise<string>
  suggestMissingTests(context: MissingTestContext): Promise<TestSuggestion[]>
}
```

Support provider configuration later:

- OpenAI API key
- Anthropic API key
- local model endpoint

AI should never be required for test discovery, running tests, coverage parsing, or basic quality findings.

## Technical Requirements

- Build as a VS Code extension in TypeScript.
- Prefer local filesystem and process APIs.
- Use `child_process.execFile` or spawn with argument arrays, not shell string interpolation.
- Never run destructive commands.
- Do not mutate source files unless the user explicitly asks.
- Cache discovered test inventory, but make refresh obvious.
- Keep all commands local-first.
- Design adapters so new frameworks can be added later.
- Keep the first version practical and shippable.

## Research Requirement

Before implementing, do extensive research.

Research at least:

1. VS Code extension APIs for:
   - Tree views
   - Test controller API
   - Webviews if needed
   - Commands and task execution

2. Machine-readable test outputs for:
   - Jest
   - Vitest
   - Flutter test
   - Pytest
   - Django test runner
   - Firebase Functions test setups

3. Coverage formats:
   - LCOV
   - coverage.py XML/JSON
   - Istanbul JSON

4. Existing VS Code test extensions:
   - What they do well
   - What they do not cover
   - How this extension should differ

5. Static test-quality heuristics:
   - skipped tests
   - focused tests
   - no assertions
   - snapshot-only tests
   - stale/missing related tests

After research, write a concise research summary before planning.

## Planning Requirement

After research, produce a plan before coding.

The plan must include:

- proposed architecture
- extension folder structure
- adapter interface
- first implementation milestone
- test strategy
- risks and mitigations
- what will be deferred
- exact files to create/change

Do not start coding until the plan is coherent.

## Suggested MVP Scope

MVP should include:

1. VS Code extension skeleton
2. Project detection for React, Flutter, Django, FastAPI, Firebase Functions
3. Tree view listing detected projects and test files
4. Basic changed-file detection from Git
5. Basic quality findings:
   - skipped tests
   - focused tests
   - no assertions where detectable
6. Coverage parser for LCOV and coverage.py XML/JSON if feasible
7. Commands to refresh, run all, run current file, run related tests
8. Markdown report export

Defer:

- LLM integration
- full import graph analysis
- complex flaky-test detection
- Marketplace polish
- every possible framework adapter

## Definition Of Done

The first version is done when:

- It detects at least one project from each target framework using sample fixtures or real repos.
- It lists test files in the VS Code UI.
- It can run tests for at least React/Vitest or Jest and Python/pytest.
- It can parse at least LCOV coverage.
- It can show changed files with likely related tests.
- It can flag skipped/focused tests.
- It can export a Markdown report.
- It has unit tests for adapter detection and parsers.
- README explains setup, commands, supported frameworks, and limitations.

## Important Product Principle

Build for real daily developer use.

The tool should help me make decisions faster:

- what to run
- what broke
- what is untested
- what is risky
- what tests are suspicious

Do not overbuild the AI layer. Do not build a generic framework. Build the local test intelligence workflow first.
