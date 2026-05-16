---
domain_id: dom-risk-scoring
slug: risk-scoring
status: active
repo_ids: [test-inspector]
related_domain_slugs: [coverage, quality, changed-files, investigation]
created_at: 2026-05-16
updated_at: 2026-05-16
---

# risk-scoring

## What this domain does

Decide which source files (not test files) are the riskiest to ship today. The score combines criticality signals (auth, billing, clinical workflow, API, routing, validation, branching, exports) with empirical signals (line coverage gap, related test count, no related test at all) into a sortable ranking. The Dashboard's "Top Risk" table and the `Analyze Top Risk` command both pull from here.

## Backend / source of truth

- **Scorer:** `src/services/sourceRisk.ts` — the only place that knows the weights.
- **Criticality signals applied per file** (path heuristics + content keywords):
  - auth / session
  - permissions
  - clinical workflow
  - billing / payment
  - API / data flow
  - forms / validation
  - stateful UI logic
  - routing
  - async / error handling
  - exported public surface
  - branching behavior
- **Empirical signals:** line coverage %, related test count, missing coverage entry, missing related test.
- **Feature grouping:** `src/services/features.ts` clusters source files into feature areas (route/module groups) so risk can be presented per feature, not just per file.
- **Noise reduction:** assets / images / icons / styles / fonts / mocks / fixtures / stories / generated files are filtered out before scoring — they cannot be "high risk".

## Frontend / clients

- `src/views/dashboard.ts` — risk table with severity badges; investigation buttons hang off each row.
- `src/services/investigator.ts` — uses the per-file score + signals to build the drilldown narrative.
- `src/services/featureInvestigator.ts` — per-feature aggregate scoring + drilldown.
- `src/views/changedFilesView.ts` — risk score appears alongside each changed source file.

## API contract locked

- `SourceRiskScore` (in `src/models.ts`): `{ filePath, score, signals[], coverage?, relatedTests[], recommendations[] }`.
- `score` is a positive number, larger = riskier. Absolute scale is irrelevant; ranks are what consumers consume.
- Adding a new signal requires updating the weights AND adding a fixture to `test/fixtures/` plus a unit test in `test/unit/`.
- A file with no related test AND in a critical path MUST rank above the same file with related tests, all else equal — this is the product's core promise.
- Recommendations are short, human-readable strings (`"add tests for validation errors and API failure state"`); they are NOT prompts and MUST be useful with no LLM configured.

## Key files

- `src/services/sourceRisk.ts`
- `src/services/features.ts` — feature grouping (per-project feature identifiers for monorepo clarity)
- `src/models.ts` (`SourceRiskScore`, feature types)
- `src/views/dashboard.ts` (risk table renderer)
- `test/unit/features.test.ts`

## Decisions locked

- Risk is computed deterministically from inputs the user can inspect. There is no opaque "AI risk" — the LLM layer cannot influence the rank.
- File ignores (assets, mocks, generated) live at this domain's noise-reduction layer, NOT scattered across views. New ignore rules go here.
- Recommendation text MUST be usable as-is in a Markdown export — no formatting that breaks outside the dashboard.
- Configurable risk thresholds (Phase 2) will land via `testInspector.*` settings, not by changing weights in code per workspace.
- Feature identifiers are scoped per project to avoid collisions in monorepos with repeated feature names (e.g., two `auth` features in two projects).
