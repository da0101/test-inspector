---
domain_id: dom-coverage
slug: coverage
status: active
repo_ids: [test-inspector]
related_domain_slugs: [adapters, risk-scoring, investigation]
created_at: 2026-05-16
updated_at: 2026-05-16
---

# coverage

## What this domain does

Read coverage artifacts produced by the user's existing test runner — never produce them ourselves unless the user explicitly invokes `Test Inspector: Generate Coverage Report` (which spawns the project's own coverage command with confirmation). Parse the result into a normalized `CoverageSummary` so the dashboard, risk scorer, and investigation drilldown can all reason about it uniformly.

## Backend / source of truth

- **Parser entry:** `src/services/coverage.ts` — orchestrates per-project coverage lookup. Calls `readCoverage(project)` on the adapter and normalizes whatever shape comes back.
- **Supported formats today:**
  - LCOV (`coverage/lcov.info`) — line + branch counts, uncovered line numbers.
  - coverage.py JSON (`.coverage.json` / explicit JSON output).
  - coverage.py XML (Cobertura-style).
- **Planned (deferred):** Istanbul `coverage-final.json`, Vitest coverage output, Flutter package URI path normalization, Python package path normalization.
- **Path normalization** is the biggest source of false-empties: coverage files reference paths relative to the test runner's working directory, not the workspace root. Each adapter is responsible for translating back to absolute paths.

## Frontend / clients

- `src/views/coverageView.ts` — **Coverage** tree view (per project + per file).
- `src/views/dashboard.ts` — coverage bar + low-coverage tables.
- `src/services/sourceRisk.ts` — combines line coverage with criticality to compute risk score.
- `src/services/investigator.ts` and `featureInvestigator.ts` — pull uncovered lines into the drilldown narrative.

## API contract locked

- `CoverageSummary`: `{ projectId, files[], totals: { linesPct?, branchesPct?, functionsPct?, statementsPct? } }`.
- `CoverageFile`: `{ path, linesPct?, branchesPct?, functionsPct?, statementsPct?, uncoveredLines? }`. `path` MUST be the absolute workspace path or it's invisible to risk scoring.
- Missing coverage is `undefined`, not `0` — distinguish "no data" from "covered nothing".
- If a coverage script is configured but the resulting file is missing or unreadable, surface it as a setup finding ("coverage command present but no readable coverage file") — do NOT silently report 0%.
- Stale coverage (older than the most recent source-file mtime) is a future quality finding; mark it but don't suppress display.

## Key files

- `src/services/coverage.ts`
- `src/services/setup.ts` — surfaces missing-coverage-script / unreadable-coverage diagnostics
- `src/adapters/{react,flutter,python,firebase}.ts` — each `readCoverage` implementation
- `src/utils/xml.ts` — XML helpers for Cobertura/coverage.py XML
- `src/views/coverageView.ts`
- `test/unit/coverage.test.ts`, `test/fixtures/<stack>/coverage/`

## Decisions locked

- The extension does NOT invent coverage commands (D#10). If a project has no documented coverage script, we degrade gracefully to a setup blocker.
- Generating coverage (when a script is declared) requires user confirmation — it's expensive and can mutate `coverage/` directories.
- Coverage paths normalize to absolute workspace paths before downstream consumers see them. Adapters that fail to normalize produce silent gaps in the risk map.
- LCOV is the canonical format priority; coverage.py JSON/XML are first-class for Python stacks. Istanbul JSON, Vitest, branch-level drilldown are Phase 5 deferred work.
- Stale coverage display is informational, never blocking — a stale value is still data the user can act on.
