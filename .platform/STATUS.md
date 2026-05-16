# test-inspector — Current Status

Last updated: 2026-05-16

> **Test Inspector** — local-first VS Code extension that gives developers visibility and traceability into test quality across React, Vue, Flutter, Django, FastAPI, Firebase Functions, and Node.js codebases (mono- and multi-repo). The product exists to close the trust gap between **tests that exist** and **tests that actually prove behavior** — a gap that widens every time an LLM or a less-experienced contributor ships a plausible-looking but shallow / flaky / fake test. Test Inspector catches those tests before they ship.

---

## Feature areas

Mirrors the phased ROADMAP. Status reflects the scaffolded state after `ab init`.

| Area | Status | Last touched | Notes |
|---|---|---|---|
| Phase 1 — Stabilize existing app | ⚠ Flagged | 2026-05-16 | Cancellation, "scan running" state, workspace-size guardrails, broader command-safety tests still open |
| Phase 2 — Useful risk scoring | ⚠ Flagged | 2026-05-16 | Configurable thresholds, churn signal, exported API surface scoring still open |
| Phase 3 — Source-to-test mapping | ⚠ Flagged | 2026-05-16 | TS path aliases, barrel/index resolution, Python/Flutter import resolution all missing |
| Phase 4 — Weak/ghost test detection | ⚠ Flagged | 2026-05-16 | Heuristic-only today; AST parsing for JS/TS, Python, Dart all pending |
| Phase 5 — Coverage intelligence | ⚠ Flagged | 2026-05-16 | LCOV + coverage.py XML/JSON parsed; uncovered-lines drilldown, Istanbul JSON, branch mapping pending |
| Phase 6 — Investigation drilldown | 🔵 Exists | 2026-05-16 | Service + webview wired; needs source summary, recommended tests, run-related action |
| Phase 7 — LLM investigator | ⚠ Flagged | 2026-05-16 | OpenAI-compatible skeleton + SecretStorage + privacy confirmation exist; budgeting, caching, retries, structured JSON missing |
| Phase 8 — Dashboard productization | 🔵 Exists | 2026-05-16 | KPIs / risk tables / project filter exist; charts, search, drilldowns, filters pending |
| Phase 9 — Test runner integration | ⚠ Flagged | 2026-05-16 | Run all / current file / related works; no cancel, no progress streaming, no JSON reporters |
| Phase 10 — Reports | 🔵 Exists | 2026-05-16 | Markdown export works; investigation/PR-readiness/JSON/HTML reports pending |
| Phase 11 — Persistence & history | ⧗ Pending | — | No caching/snapshot/trend layer yet |
| Phase 12 — Framework-specific depth | ⚠ Flagged | 2026-05-16 | All 5 adapters detect + discover but lack first-class semantic depth; Vue.js adapter not yet present |
| Marketplace publishing | ⧗ Pending | — | Public Marketplace is the distribution target; publisher ID, icon polish, LICENSE, CONTRIBUTING, CI pipeline all open |

**Legend:**
- ✓ Done — shipped, tested, merged
- 🔵 Exists — in place but may need review
- ⧗ Pending — planned, not started
- ⚠ Flagged — known issue that needs attention
- 🔴 Deferred — decided to punt (reference `decisions.md` entry)

## Immediate priorities

User intent (2026-05-16): _everything is in scope — execute phases as parallel streams in separate worktrees once activated._

> **Prioritization lens.** The product exists to catch fake / flaky / LLM-generated tests (decision #11). Phases that close the trust gap (Phase 4 weak-test AST, Phase 3 source-to-test mapping that powers per-test-case findings, Phase 7 LLM enrichment) outrank phases that polish parts the user already trusts.

1. **Marketplace-readiness foundation** — open-source repo hygiene (LICENSE, CONTRIBUTING, publisher ID, icon, CI) is a hard prerequisite before any phase ships publicly.
2. **Phase 4 — AST-based weak-test detection** — the product's load-bearing feature; today's regex catches the obvious offenders but misses LLM-pattern fakes (mock-only assertions, "render didn't throw" widget tests, mocks of the unit under test, vague titles like `should work`). Per-test-case findings via real AST is the leap from "looks plausible" to "we can prove it's weak".
3. **Phase 3 — source-to-test mapping** — feeds Phase 4. Without TS path aliases / barrel resolution / Python+Flutter import resolution, per-test-case findings can't be tied back to the source they fail to cover.
4. **Phase 1 — stabilization** — cancellation, scan-running state, workspace-size guardrails, broader command-safety tests; must land before v0.1 and can run in parallel with #2 and #3.
5. **Phase 7 — LLM investigator hardening** — token budgeting, caching, retries, structured JSON; multiplies Phase 4 by giving each flagged weak test a senior-reviewer-grade explanation + rewrite suggestion.

## Open decisions

| # | Question | Deadline |
|---|---|---|
| 1 | Bundler vs raw `tsc`? VS Code Marketplace publishing typically prefers a single bundled file (esbuild/rollup) for size + startup. | Before first Marketplace publish |
| 2 | Add Vue.js adapter now or post-MVP? User listed Vue in their stack but no adapter exists yet. | Before promising Vue support publicly |
| 3 | What package manager + lockfile (npm / pnpm / yarn) for the OSS repo? `package-lock.json` is currently checked in. | Before merging the first external contribution |
| 4 | Telemetry policy for the published extension (none / opt-in only)? | Before Marketplace publish |
| 5 | CI provider — GitHub Actions vs nothing for v0.1? | Before public release |

## Release blocklist

Things that must be resolved before this project ships to the public VS Code Marketplace:

- [ ] LICENSE file (OSS — likely MIT or Apache-2.0)
- [ ] CONTRIBUTING.md with the adapter-extension recipe (since Swift/C++ etc. are deferred to community PRs)
- [ ] Publisher identity (`publisher` field in package.json is currently `local`)
- [ ] Marketplace-grade icon set + screenshots (`media/test-inspector.svg` exists; need 128px PNG + animated GIF demo)
- [ ] CHANGELOG.md seeded
- [ ] Bundler decision (open decision #1) and `vscode:prepublish` updated accordingly
- [ ] CI pipeline that runs `npm test` on every PR
- [ ] `src/extension.ts` (36 KB) split — violates the 300-line rule
- [ ] `src/views/dashboard.ts` (38 KB) split — violates the 300-line rule
- [ ] Cancellation support on long-running commands (Phase 1)
- [ ] Workspace-size guardrails on initial scan (Phase 1)
- [ ] Telemetry policy decided and documented (open decision #4)

## Known gotchas (pinned)

Things that will bite every new session if not flagged upfront.

- **Shell injection trap** — every external command MUST go through `child_process.execFile` / `spawn` with arg arrays. Never interpolate user paths into shell strings, never `execSync` a constructed command. Coverage commands generated by adapters route through `services/runner.ts` for this reason.
- **No invented coverage commands for large React projects** — already enforced in adapter; do not regress it. If `package.json` has no explicit coverage script, the extension surfaces a setup blocker, it does not guess.
- **`out/` paths in tests** — `npm test` runs `node --test out/test/unit/*.test.js`. Tests must be compiled first (`npm run compile` is in the test script). Don't import source via `src/` relative paths from compiled tests.
- **Activation events list in `package.json`** is the contract surface — adding a new command means adding both the `onCommand:` activation event AND the `contributes.commands` entry.
- **`extension.ts` and `dashboard.ts` are oversized** — when touching either, treat the touch as a split-and-extract opportunity (`workflow.md` step 2 enforces this for refactors).
- **SecretStorage is the only allowed home for the LLM API key** — never settings.json, never env from the workspace, never logs.

## File size violations

> Global rule: max ~300 lines per file. Track known offenders here so they get split before being added to.

- `src/extension.ts` — 36 KB (~900+ lines) — extract command registration + dependency wiring into focused modules
- `src/views/dashboard.ts` — 38 KB (~1000+ lines) — extract HTML template, KPI rendering, and risk-table rendering into separate files
- `src/services/sourceRisk.ts` — 11.7 KB — borderline; revisit if it grows
- `src/services/quality.ts` — 7.4 KB — under limit but watch as AST detection lands

---

_For per-layer status (if this becomes a multi-repo / multi-layer project), see STATUS-{layer}.md files alongside this one._
