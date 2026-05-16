# Test Inspector Roadmap

This roadmap defines the product we are actually building: a local-first test-quality investigator for real projects. The goal is not to duplicate Jest, pytest, Flutter test, or coverage reports. The goal is to answer:

- Which parts of this app are not tested well enough?
- Which tests are weak, fake, shallow, or disconnected from real behavior?
- Which files are risky because they are critical, changed often, or poorly covered?
- What should I test next, and why?
- Can an LLM review source/test pairs and produce useful test-improvement guidance?

## Current State

### Built

- VS Code extension scaffold in TypeScript.
- Activity Bar container named **Test Inspector**.
- Sidebar views:
  - Projects
  - Tests
  - Coverage
  - Quality
  - Changed Files
- Dashboard webview with:
  - project count
  - test file count
  - test case count
  - quality finding count
  - weak/untested file count
  - coverage bar
  - project table
  - source risk table
  - changed-file risk area
  - basic “what this means” summary
- Framework adapters:
  - React
  - Flutter
  - Django
  - FastAPI
  - Firebase Functions
- Project detection:
  - package.json/dependencies/config for React/Firebase
  - pubspec.yaml/test folder for Flutter
  - manage.py/pytest config/dependencies for Django
  - pyproject/requirements/source imports for FastAPI
- Static test discovery:
  - JS/TS test/spec files
  - React `__tests__`
  - Flutter `*_test.dart`
  - Python `tests.py`, `test_*.py`, `*_test.py`
- Static test case extraction:
  - `test(...)` / `it(...)`
  - Python `def test_*`
  - Flutter `test(...)` / `testWidgets(...)`
- Coverage parsing:
  - LCOV
  - coverage.py JSON
  - coverage.py XML
- Basic quality findings:
  - skipped tests
  - focused tests
  - no obvious assertion
  - snapshot-only tests
  - trivial assertions
  - shallow render-only tests
  - orphan tests that do not import local source
  - heavy mocking with few assertions
- Git changed-file detection.
- Changed source file to related test heuristics.
- Source risk scoring, currently based on:
  - criticality signals
  - related test count
  - line coverage
  - missing coverage entry
  - missing related test
- Criticality signals, currently including:
  - auth/session logic
  - permissions
  - clinical workflow
  - billing/payment logic
  - API/data flow
  - forms/validation
  - stateful UI logic
  - routing
  - async/error handling
  - exported public surface
  - branching behavior
- Noise reduction:
  - ignores assets/images/icons/styles/fonts
  - ignores setup helpers, mocks, fixtures, stories
  - avoids invented coverage commands for large React projects without explicit coverage scripts
- Safer command execution:
  - confirmation before slow all-test/coverage commands
  - output channel logging
  - status bar progress
  - timeout for generated coverage commands
- Setup diagnostics:
  - missing coverage scripts are shown as setup blockers
  - missing Node dependencies are shown separately from test-quality risk
  - coverage command present but no readable coverage file is explained in the dashboard
- Markdown report export.
- Unit fixtures and unit tests for:
  - adapter detection
  - discovery/quality basics
  - coverage parsers
  - report/risk mapping

### Partially Built

- Investigation workflow:
  - model types exist for `InvestigationReport`
  - deterministic investigation service exists
  - OpenAI-compatible provider interface exists
  - investigation webview exists
  - analyze top risk/current file/file commands are wired
  - dashboard opens investigation drilldowns
- Source-to-test mapping:
  - basename/directory heuristics exist
  - import-based mapping was started
  - alias support is minimal
  - TypeScript path alias support is missing
  - barrel-file/index re-export support is limited
- Weak-test detection:
  - basic heuristics exist
  - no AST parser yet
  - no per-test-case semantic classification yet
  - no “asserts implementation detail” detector yet
  - no “mocked everything” scoring beyond a simple count
- Coverage intelligence:
  - file-level coverage exists
  - uncovered lines are parsed for LCOV
  - no branch-level drilldown UI
  - no uncovered-line-to-function mapping
  - no “covered by weak tests only” analysis
- Dashboard:
  - has KPI cards and tables
  - lacks charts/trends
  - lacks filters/sorting/search
  - lacks clickable file drilldowns
  - lacks route/module grouping
- Test running:
  - can run commands
  - does not stream per-test progress
  - no cancel button yet
  - no custom Jest/Vitest reporter yet
  - no Flutter JSON reporter integration yet
  - no pytest report parser yet
- LLM layer:
  - provider skeleton exists
  - basic configure command exists
  - API key uses VS Code SecretStorage
  - no prompt budget management
  - no caching
  - no retry/rate-limit handling
  - no privacy confirmation UX

## Product North Star

Test Inspector should feel like a senior test reviewer sitting inside VS Code.

It should not merely say:

> Coverage is 54.1%.

It should say:

> `src/features/appointments/BookingFlow.tsx` is high risk. It controls clinical appointment booking, has branching and API mutation logic, only 31% line coverage, and the related tests only check the happy path render. Add tests for validation errors, API failure, permission denied state, and rescheduling behavior.

## Implementation Roadmap

### Phase 1: Stabilize The Existing App

Status: in progress.

Goal: prevent the extension from damaging developer workflow.

Tasks:

- [x] Do not invent dangerous full coverage commands.
- [x] Do not treat plain npm test scripts as coverage commands.
- [x] Ask for confirmation before expensive commands.
- [x] Log all commands to the Test Inspector output channel.
- [x] Show status bar progress.
- [x] Add command timeout for coverage.
- [ ] Add cancellation support for running commands.
- [ ] Add a visible “last scan completed at” timestamp.
- [ ] Add a visible “scan is running” state in the dashboard.
- [ ] Add a visible “coverage was read from this file” label.
- [x] Add an error panel in the dashboard instead of only output-channel logs.
- [x] Add setup guidance for missing coverage scripts, dependencies, and coverage files.
- [ ] Add workspace-size guardrails before scanning very large repos.
- [ ] Add settings for max scanned files and excluded paths.
- [x] Add regression test for coverage command detection.
- [ ] Add broader tests for command safety behavior.

### Phase 2: Make Risk Scoring Useful

Status: in progress.

Goal: produce fewer but more valuable findings.

Tasks:

- [x] Add criticality scoring from source/path signals.
- [x] Ignore obvious low-value assets and style files.
- [x] Sort source risks by score.
- [x] Add recommendation text per risky source file.
- [ ] Add configurable risk thresholds.
- [ ] Add route/page/component grouping.
- [x] Add initial feature/module grouping.
- [x] Add feature investigation drilldown.
- [ ] Add module ownership grouping.
- [ ] Add churn signal from Git history.
- [ ] Add changed-file boost from current branch diff.
- [ ] Add dependency fan-in/fan-out signal.
- [ ] Add exported API surface scoring.
- [ ] Add “critical workflow” keyword configuration.
- [ ] Add domain-specific default keywords for:
  - clinical workflows
  - auth/session
  - permissions
  - billing/payment
  - data mutation
  - forms/validation
- [ ] Add false-positive suppression:
  - ignore file
  - ignore folder
  - ignore finding kind
  - [x] ignore generated Flutter files
- [x] Add unit tests for generated-file filtering.
- [ ] Add broader unit tests for scoring thresholds.

### Phase 3: Improve Source-To-Test Mapping

Status: partial.

Goal: know which tests actually relate to which source files.

Tasks:

- [x] Same-basename mapping.
- [x] Same/sibling directory mapping.
- [x] Flutter folder mapping from `lib/<area>` to `test/<area>`.
- [x] Basic local import mapping.
- [ ] Parse `tsconfig.json` / `jsconfig.json` path aliases.
- [ ] Support aliases like `@/`, `src/`, `~`, project-specific roots.
- [ ] Resolve index/barrel files.
- [ ] Resolve re-exports.
- [ ] Resolve React component imports from folder names.
- [ ] Resolve Python imports to files/modules.
- [ ] Resolve Flutter/Dart package imports.
- [ ] Detect tests that import only mocks/helpers but not production source.
- [ ] Detect source files covered only through broad integration tests.
- [ ] Show confidence level for each source/test relationship.
- [ ] Add tests for alias and import resolution.

### Phase 4: Weak/Ghost Test Detection

Status: partial.

Goal: identify tests that technically exist but do not prove behavior.

Tasks:

- [x] Detect skipped tests.
- [x] Detect focused tests.
- [x] Detect no obvious assertions.
- [x] Detect snapshot-only tests.
- [x] Detect trivial assertions like `expect(true).toBe(true)`.
- [x] Detect shallow render-only tests.
- [x] Detect orphan tests with no local source import.
- [x] Detect heavy mocking with few assertions.
- [ ] Use an AST parser for JS/TS tests.
- [ ] Use Python AST for pytest/unittest.
- [ ] Use Dart analyzer or structured parser for Flutter tests.
- [ ] Classify assertion strength:
  - existence only
  - exact visible text
  - state transition
  - API call side effect
  - error handling
  - accessibility role/label
  - domain-specific behavior
- [ ] Detect tests that assert implementation details.
- [ ] Detect tests that mock the unit under test.
- [ ] Detect tests that never exercise user interaction.
- [ ] Detect async tests that do not await meaningful outcomes.
- [ ] Detect tests that only verify mocks were called.
- [ ] Detect duplicated tests.
- [ ] Detect stale tests for deleted/moved source files.
- [ ] Detect tests whose title promises behavior but body checks something else.
- [ ] Add per-test-case findings instead of only file-level findings.
- [ ] Add unit tests for each smell.

### Phase 5: Coverage Intelligence

Status: partial.

Goal: turn coverage from a percentage into actionable insight.

Tasks:

- [x] Parse LCOV line coverage.
- [x] Parse coverage.py JSON/XML.
- [x] Show average coverage.
- [x] Show low-coverage source files.
- [ ] Show exact uncovered lines in drilldown.
- [ ] Map uncovered lines to functions/components.
- [ ] Map uncovered branches to code paths.
- [x] Refresh feature/module coverage after generating coverage.
- [ ] Show coverage by folder/module.
- [ ] Show coverage by criticality tier.
- [ ] Show “high criticality + low coverage” as a top priority.
- [ ] Support Istanbul `coverage-final.json`.
- [ ] Support Vitest coverage output paths.
- [x] Support Flutter LCOV for standard `lib/...` paths.
- [ ] Support Flutter LCOV package URI path normalization.
- [ ] Support Python package path normalization.
- [ ] Detect stale coverage files.
- [ ] Show coverage file path and timestamp.
- [ ] Add coverage trend snapshots.
- [ ] Add tests for coverage path normalization.

### Phase 6: Investigation Drilldown

Status: started.

Goal: clicking a risky file opens an investigation page.

Tasks:

- [x] Create investigation report model.
- [x] Start deterministic investigator service.
- [x] Start investigation webview.
- [x] Wire `Test Inspector: Analyze Top Risk`.
- [x] Wire `Test Inspector: Analyze Current File`.
- [x] Add clickable “Analyze” buttons in dashboard risk rows.
- [ ] Show:
  - source summary
  - related tests
  - coverage gaps
  - weak-test findings
  - recommended tests
  - LLM review if available
- [x] Add links to open source/test files.
- [ ] Add “run related tests” action from drilldown.
- [x] Add feature-area targeted test command.
- [x] Add feature investigation markdown export.
- [ ] Add “copy suggested tests” action.
- [x] Add “export investigation markdown” action.
- [ ] Add tests for deterministic investigation output.

### Phase 7: LLM Investigator Layer

Status: skeleton started.

Goal: add the semantic brain that reviews source and tests like a senior engineer.

Tasks:

- [x] Add generic LLM provider interface.
- [x] Start OpenAI-compatible provider.
- [x] Store API key using VS Code SecretStorage instead of plain settings.
- [x] Add basic setup command:
  - choose provider
  - enter API key
  - choose model
  - test connection
- [x] Add privacy confirmation before sending code.
- [x] Add per-workspace enable/disable setting.
- [x] Add prompt builder with token budgeting.
- [ ] Chunk large source/test files safely.
- [ ] Cache LLM results by file hash.
- [ ] Add retry/backoff/rate-limit handling.
- [x] Add JSON output mode for structured findings.
- [ ] Add markdown fallback if JSON parsing fails.
- [x] Add LLM review for one source/test pair.
- [ ] Add LLM review for changed files.
- [ ] Add LLM review for top N risks.
- [ ] Add LLM review for weak tests.
- [ ] Ask LLM to classify:
  - covered behaviors
  - missing behaviors
  - weak assertions
  - edge cases
  - suggested tests
  - risk severity
- [x] Add tests using mocked LLM responses.

### Phase 8: Dashboard Productization

Status: early.

Goal: make the UI feel like a serious developer intelligence tool.

Tasks:

- [x] Dashboard webview exists.
- [x] KPI cards exist.
- [x] Coverage bar exists.
- [x] Investigation priorities section exists.
- [ ] Add meaningful charts:
  - coverage by folder
  - risk by folder
  - findings by type
  - weak test distribution
  - changed-file risk
- [ ] Add sorting/filtering for risk table.
- [ ] Add search by file/test/finding.
- [ ] Add filters:
  - high risk only
  - changed files only
  - no related tests
  - weak tests
  - low coverage
  - auth/clinical/API/form categories
- [ ] Add drilldown navigation.
- [x] Add plain-English health brief explaining what works, what needs attention, and next steps.
- [ ] Add empty states that explain exactly what to do next.
- [ ] Add loading states in the webview.
- [x] Add error states in the webview.
- [ ] Add “last scan” and “coverage source” metadata.
- [x] Add workspace/project selector for monorepos.
- [x] Add workspace/project dashboard filter for monorepos.
- [x] Add project-scoped feature identifiers for monorepos with repeated feature names.
- [x] Add regression test for project-scoped feature identifiers.
- [x] Add grouped dashboard command toolbar.
- [x] Add badges/severity colors.
- [ ] Add UX tests/screenshots.

### Phase 9: Test Runner Integration

Status: basic.

Goal: safely run targeted tests and show progress.

Tasks:

- [x] Run all tests command exists.
- [x] Run current file command exists.
- [x] Run related tests command exists for React-style runners.
- [x] Confirmation before all-test command.
- [ ] Add cancellable running process.
- [ ] Add per-test progress.
- [ ] Add Jest JSON output file parsing.
- [ ] Add custom Jest reporter or use stable JSON output.
- [ ] Add Vitest JSON/JUnit parser.
- [ ] Add Flutter JSON reporter parser.
- [ ] Add pytest JUnit parser.
- [ ] Add Django runner parser or fallback strategy.
- [ ] Add test duration tracking.
- [ ] Add slow-test findings.
- [ ] Add rerun failed tests.
- [ ] Add run top-risk related tests.
- [x] Add run selected feature tests command.
- [x] Keep feature areas scoped to detected projects in monorepos.
- [x] Use workspace-relative project labels and paths for monorepo clarity.
- [x] Sort detected projects by root path/framework.
- [ ] Add terminal/output viewer integration.
- [ ] Add tests for runner parsers.

### Phase 10: Reports

Status: basic.

Goal: produce useful artifacts before commits/PRs.

Tasks:

- [x] Basic markdown export.
- [ ] Add investigation report export.
- [ ] Add changed-files risk report.
- [ ] Add PR readiness report.
- [ ] Add executive summary:
  - top risks
  - coverage impact
  - weak tests
  - recommended next tests
- [ ] Add JSON export for automation.
- [ ] Add HTML export.
- [ ] Add report diff against previous scan.
- [ ] Add snapshot storage under `.test-inspector/`.

### Phase 11: Persistence And History

Status: not started.

Goal: show trends and avoid rescanning everything unnecessarily.

Tasks:

- [ ] Cache project detection.
- [ ] Cache discovered tests.
- [ ] Cache source risk results.
- [ ] Cache LLM investigations by content hash.
- [ ] Store scan snapshots.
- [ ] Show coverage trend over time.
- [ ] Show risk trend over time.
- [ ] Show newly introduced weak tests.
- [ ] Show risk delta for current branch.

### Phase 12: Framework-Specific Depth

Status: shallow.

Goal: make each supported stack feel first-class.

React tasks:

- [ ] Parse component exports.
- [ ] Detect hooks and state transitions.
- [ ] Detect Testing Library usage quality.
- [ ] Prefer accessibility role/name assertions.
- [ ] Detect snapshot-heavy suites.
- [ ] Detect tests that mock child components excessively.
- [ ] Detect missing interaction tests for interactive components.

Flutter tasks:

- [ ] Parse `flutter test --reporter json`.
- [ ] Detect widget tests with no meaningful expectations.
- [x] Map `lib/` files to `test/` folders.
- [ ] Detect golden-only tests.
- [ ] Detect missing widget interaction coverage.
- [x] Suppress generated localization and Firebase option files from risk ranking.

Django tasks:

- [ ] Detect models/views/serializers/forms/admin files.
- [ ] Score migrations/generated files low.
- [ ] Map URLs/views to tests.
- [ ] Detect missing permission tests.
- [ ] Detect missing validation tests.
- [ ] Parse pytest/Django results.

FastAPI tasks:

- [ ] Detect routes and dependencies.
- [ ] Map endpoints to API tests.
- [ ] Detect missing status-code/body assertions.
- [ ] Detect missing auth/error tests.
- [ ] Detect missing validation tests.

Firebase Functions tasks:

- [x] Detect basic feature areas under `functions/src/*`.
- [x] Show actionable notice when tests exist but Firebase coverage is not configured.
- [ ] Detect callable/http/background functions.
- [ ] Detect emulator-dependent tests.
- [ ] Detect missing emulator setup.
- [ ] Detect missing auth/context tests.
- [ ] Detect missing retry/error tests.

## Suggested Build Order From Here

1. Finish investigation command wiring.
2. Finish LLM setup with SecretStorage.
3. Add `Analyze Top Risk` and `Analyze Current File`.
4. Make dashboard rows clickable.
5. Add AST-based weak-test detection for React/Jest/Vitest.
6. Add per-test-case findings.
7. Add coverage drilldown with uncovered lines.
8. Add changed-files investigation mode.
9. Add charts and filters.
10. Add trend snapshots.

## Definition Of “Actually Useful”

The extension becomes useful when it can inspect a real project and produce output like:

```text
Top risk: src/features/appointments/BookingFlow.tsx
Why: clinical workflow, API mutation, validation, branching, 31% coverage.
Related tests: BookingFlow.test.tsx
Problem: tests only cover initial render and happy path.
Missing:
- validation errors for missing patient/date
- API failure state
- permission denied state
- reschedule flow
- loading state
Recommended next test:
simulate failed booking API response and assert error alert + retry action.
```

Until it can do that consistently, the product is not done.
