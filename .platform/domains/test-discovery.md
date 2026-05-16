---
domain_id: dom-test-discovery
slug: test-discovery
status: active
repo_ids: [test-inspector]
related_domain_slugs: [adapters, quality, risk-scoring]
created_at: 2026-05-16
updated_at: 2026-05-16
---

# test-discovery

## What this domain does

Walk a detected project's filesystem and enumerate every test file plus the test cases inside it — without running anything. This is the cornerstone of the local-first promise: every other view (Tests, Quality, Coverage drilldown, Risk) consumes the discovery output.

## Backend / source of truth

- Adapter `discoverTests(project)` is the entry point per stack — it knows the path globs and test-case patterns for its language.
- Today's extraction is regex-based:
  - JS/TS: `test(...)` / `it(...)` / `describe(...)` (including `.only`, `.skip`)
  - Python: `def test_*(`, `@pytest.mark.skip`, `@unittest.skip`
  - Dart/Flutter: `test(...)` / `testWidgets(...)`
- The Phase-4 plan replaces regex with real AST parsing per language (TypeScript Compiler API for JS/TS, `ast` for Python, `analyzer` for Dart). Until that lands, false positives/negatives on dynamic test names are expected.
- `src/adapters/shared.ts` provides the glob walker honoring `testInspector.maxWorkspaceFiles` (default 8000) — this guardrail prevents runaway scans on huge monorepos.

## Frontend / clients

- `src/views/testsView.ts` renders the **Tests** tree view (file → test case).
- `src/views/items.ts` maps `TestFile` / `TestCase` to `vscode.TreeItem`.
- The Dashboard webview consumes counts (`testFiles.length`, sum of `testCases.length`) for KPIs.
- Quality findings (skipped / focused / no-assertion / etc.) are computed against the discovered set in `services/quality.ts`.

## API contract locked

- `TestFile`: `{ path, projectId, testCases[], status, durationMs?, qualityFindings[] }`. `status` defaults to `'unknown'` and only changes after a real run produces results (`services/testResults.ts`).
- `TestCase`: `{ id, name, filePath, line?, status, durationMs?, errorMessage? }`. `id` MUST be stable across scans of the same content so VS Code's TreeView state survives refreshes.
- Discovery MUST NOT spawn subprocesses. It is pure filesystem reads + regex/AST.
- A test file that fails to parse is reported as a `QualityFinding` of kind `'parse-error'` and excluded from counts — the scan does not throw.

## Key files

- `src/adapters/types.ts` — the `discoverTests` signature on the interface
- `src/adapters/{react,flutter,python,firebase}.ts` — per-stack patterns
- `src/adapters/shared.ts` — glob walker + workspace-file budget enforcement
- `src/models.ts` — `TestFile`, `TestCase` types
- `src/views/testsView.ts`, `src/views/items.ts`
- `test/unit/adapters.test.ts` — fixture-driven discovery tests

## Decisions locked

- Regex extraction is good enough for MVP; AST is the planned upgrade (decisions.md deferred #3).
- `testInspector.maxWorkspaceFiles` setting caps the scan; bumping it requires updating the doc and noting in `STATUS.md`.
- Discovery does not deduplicate by test-case name across files — each occurrence is its own `TestCase`. Tools that want "unique tests" must dedupe themselves.
- A test file that imports zero local source files is flagged as an orphan finding but NOT excluded from the inventory.
- Discovery output is the source of truth for "what tests exist" — the runner (`services/runner.ts`) MUST NOT add cases the discovery didn't see; if a run produces unknown cases that's a parser bug to fix here.
