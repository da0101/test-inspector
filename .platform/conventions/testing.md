# Testing conventions — test-inspector

Last updated: 2026-05-16

> Test Inspector tests its own tests. The bar is "every heuristic, parser, mapping, and scoring rule has at least one fixture + one assertion".

---

## Tooling

- **Runner:** Node's built-in `node --test` against compiled output (`out/test/unit/*.test.js`).
- **No Jest, no Vitest, no Mocha.** Adding any of them is a decision-log entry, not a casual import. The reason `node --test` was chosen is in `decisions.md` #7.
- **Compile-then-test:** `npm test` runs `npm run compile && node --test out/test/unit/*.test.js`. Always compile before manually invoking the runner.
- **Assertion library:** Node's `node:assert/strict` only. No `expect`, no `chai`, no `assert.equal` (use `strict`).

## Where tests live

```
test/
├── fixtures/                  # Read-only sample workspaces, one folder per stack
│   ├── react/
│   ├── flutter/
│   ├── django/
│   ├── fastapi/
│   ├── firebase/
│   └── test-inspector-report.md   # Golden master for report.test.ts
└── unit/                      # *.test.ts — compiled to out/test/unit/*.test.js
    ├── adapters.test.ts
    ├── coverage.test.ts
    ├── features.test.ts
    ├── report.test.ts
    └── setup.test.ts
```

## Bar per feature type

| Feature type | Required test |
|---|---|
| New adapter (framework) | Detection fixture + at least one positive detection + at least one negative case (wrong-folder file should not detect) |
| New coverage parser | Sample artifact in `fixtures/<stack>/coverage/` + parsed-output assertion + path-normalization assertion |
| New quality heuristic | Positive fixture (heuristic fires) + negative fixture (heuristic does not fire on a known-good test) |
| New risk-scoring signal | Fixture file demonstrating the signal + assertion the score reflects it + assertion non-signal files don't get boosted |
| New source-to-test mapping rule (Phase 3) | Fixture pair (source + test) + assertion the mapping is found + assertion an unrelated file is NOT mapped |
| Report renderer change | Golden master in `fixtures/test-inspector-report.md` updated in the same PR |
| LLM-adjacent change | Mock provider test exercising both `isConfigured()` true and false paths; never call a real endpoint from a unit test |
| Bug fix | Regression test that reproduces the bug, fails before the fix, passes after |

## What NOT to test

- The VS Code Extension Host integration itself (TreeView rendering, Webview message round-trip). Those need integration tests with `@vscode/test-electron`; we don't run them in CI yet (Phase 1 deferred).
- Live LLM endpoints. Stub `LlmProvider` for any test that touches `services/investigator.ts`.
- Filesystem-state side effects. Tests MUST be hermetic — read from `test/fixtures/`, write only to `os.tmpdir()`.

## Fixtures discipline

- Every fixture is a minimum reproducer for ONE rule. A fixture is not a "sample app" — it's the smallest tree that exercises the rule.
- Fixtures are checked in. They never depend on `npm install` / `pip install` / `flutter pub get`.
- Coverage artifacts are real format examples (LCOV, coverage.py JSON/XML) — not hand-rolled approximations.

## Naming

- Test files: `<thing-under-test>.test.ts`. Mirror the source path where reasonable.
- Inside a test file, use `node --test`'s `test('describes the behavior', () => {…})`. Avoid `describe`/`it` style.
- Group related tests with a top-level `test('<area>', async (t) => { await t.test(…) })` if subgrouping helps; otherwise keep flat.

## Performance

- The entire `npm test` run should finish in < 10 seconds on a developer laptop. If a test takes > 1s, it's probably reaching the filesystem in a non-fixture way — investigate.
- No `setTimeout`-based waits. If async ordering matters, await promises explicitly.

## Pre-PR checklist

- [ ] `npm test` passes (compile + run)
- [ ] New heuristic / parser / mapping has both a positive and a negative test
- [ ] Fixtures added to `test/fixtures/`, not committed inline as strings in the test file
- [ ] If renderer changed: golden fixture updated and reviewed
- [ ] No real network calls in tests; LLM mocked
