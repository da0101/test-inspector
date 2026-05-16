---
domain_id: dom-quality
slug: quality
status: active
repo_ids: [test-inspector]
related_domain_slugs: [test-discovery, risk-scoring, investigation]
created_at: 2026-05-16
updated_at: 2026-05-16
---

# quality

## What this domain does

Look at the static test inventory and flag tests that "exist" but don't prove behavior — skipped, focused, no-assertion, snapshot-only, trivial-assertion, shallow render-only, orphan, mock-heavy. This is the "ghost tests" signal that distinguishes Test Inspector from a runner: a test suite can be 100% green and still be 60% useless, and this domain says so.

**Why this domain matters more every year.** A growing share of new tests in modern codebases are produced by LLM assistants (Copilot, Cursor, Claude, etc.) or by less-experienced contributors. The failure modes are predictable: tests that match the file name and "look right" but mock the unit under test, assert that `render()` didn't throw, snapshot-match a string that nobody will read again, or `expect(mockFn).toHaveBeenCalled()` without checking inputs or outputs. This domain is the product's load-bearing answer to that — it ranks the suite by how much of it is real, surfaces the bad tests by name, and (Phase 4) will name the LLM/junior-author patterns explicitly via AST.

## Backend / source of truth

- **Detector entry:** `src/services/quality.ts` — runs every heuristic against every discovered `TestFile`.
- **Heuristics implemented today (regex-based):**
  - skipped-test (`.skip`, `xit`, `@pytest.mark.skip`, `@unittest.skip`, `xtest`)
  - focused-test (`.only`, `fit`, `fdescribe`)
  - no-assertion (no `expect` / `assert` / Testing Library matcher / `assertEquals` in the test body)
  - snapshot-only (`toMatchSnapshot` is the only assertion)
  - trivial-assertion (`expect(true).toBe(true)`, `expect(1).toBe(1)`)
  - shallow-render-only (`render(...)` with no subsequent assertion on the result)
  - orphan-test (test file imports zero local source files)
  - heavy-mock-light-assertion (mock count >> assertion count)
- **Planned upgrade (Phase 4):** swap regex for AST. Each heuristic becomes a typed visitor; per-test-case findings instead of per-file findings. New detectors land: asserts-implementation-detail, mocks-the-unit, never-exercises-interaction, async-without-await, only-verifies-mocks-called, stale (references deleted source), title-vs-body mismatch.

## Frontend / clients

- `src/views/qualityView.ts` — **Quality** tree view (severity-sorted findings per file).
- `src/views/dashboard.ts` — finding count KPI + weak-tests table.
- `src/services/sourceRisk.ts` — incorporates finding count into the risk score for related source files.
- `src/services/investigator.ts` — surfaces findings inside the per-file investigation drilldown.

## API contract locked

- `QualityFinding`: `{ id, severity, kind, message, filePath, line? }`. `kind` is a string-literal union — adding a new kind requires updating every consumer's switch (currently the dashboard renderer, the tree view item, and the report writer).
- `severity` is one of `'info' | 'warning' | 'error'`. Skipped / focused = warning, no-assertion = warning, parse-error = error.
- Findings are deterministic — same input MUST produce same finding set. No randomized IDs, no time-dependent kinds.
- A finding's `line` is best-effort; absent means "file-level".

## Key files

- `src/services/quality.ts`
- `src/models.ts` (`QualityFinding`)
- `src/views/qualityView.ts`
- `test/unit/adapters.test.ts` includes basic quality assertions; per-heuristic tests are sparse and will grow in Phase 4

## Decisions locked

- Findings are static-only. The runner output (red/green) is a separate signal carried by `TestFile.status`.
- Severity ranking is fixed: `error > warning > info`. The dashboard weights `error` findings strongest in the "ship readiness" summary.
- No-assertion detection MUST tolerate Testing Library and httpx-style assertions, not just `expect`. Adding a stack-specific assertion library = update this detector's allowlist, not work around it.
- Generated files (Flutter localization, Firebase options, etc.) are excluded from findings at the adapter layer, not by this domain. If they slip through, fix at the adapter layer.
- Phase 4 AST migration is a deliberate big-bang per language, NOT a per-detector trickle — switching detector by detector would leave the codebase with two parsers per language indefinitely.
