---
stream_id: stream-detective-redesign
slug: detective-redesign
type: feature
status: planning
agent_owner: claude-code
domain_slugs: [dashboard, investigation, quality, risk-scoring]
repo_ids: [test-inspector]
base_branch: develop
git_branch: feature/detective-redesign
created_at: 2026-05-16
updated_at: 2026-05-16
closure_approved: false
---

# detective-redesign

> **One-line goal:** strip Test Inspector down to a detective that tells the senior developer, in plain English, what works / what doesn't / what to fix — and delete everything else.

## Scope

- **In:** audit current implementation (dashboard, investigator pipeline, signal services, command surface); design a minimal detective UI; rewrite the investigator to produce a narrative ("X is risky BECAUSE …; the existing tests only prove Y; ADD test Z") instead of metric dumps; cut dead commands / tree views / vanity KPIs.
- **In:** keep the deterministic core smart enough on its own; LLM is a bonus accelerator, not the brain.
- **In:** the product thesis lens — every kept signal must help catch fake / flaky / LLM-generated / junior-written bad tests.
- **Out:** new framework adapters (Vue, Swift, C++ — see decisions.md deferred #2).
- **Out:** marketplace publish prep (separate stream).
- **Out:** any change to coverage-file format support (LCOV, coverage.py XML/JSON stay; Istanbul JSON deferred).

## Done criteria

- [ ] Audit complete and approved by Danil (this stream file's `## 🔍 Audit Report` section is filled and reviewed)
- [ ] Redesign proposal approved by Danil (in chat — no `.md` artifact)
- [ ] `src/views/dashboard.ts` split below 300 lines per file
- [ ] `src/extension.ts` split below 300 lines per file
- [ ] Investigator pipeline produces a single coherent "case file" narrative per source/feature, not 7 independent panels
- [ ] At least 8 commands and at least 2 tree views removed (placeholder targets — final count from audit)
- [ ] Unit tests cover the new investigator synthesis (golden master in `test/fixtures/`)
- [ ] Manual QA on a real React + Flutter monorepo verifies the new UI reads as "a paragraph, not a wall of cards"
- [ ] `.platform/memory/log.md` appended
- [ ] `decisions.md` updated — at least one product decision row for the detective framing
- [ ] `domains/dashboard.md`, `domains/investigation.md`, `domains/quality.md` updated to match new contract
- [ ] `STATUS.md` updated — old surfaces removed, new ones added

## Key decisions

_Append-only. Format: `YYYY-MM-DD — <decision> — <rationale>`_

- 2026-05-16 — Audit first, propose second, code third — Danil reframed product before any implementation; we need to know what to delete before we design the replacement.

## Worktree / Local environment

| Repo | Worktree path | Branch | Base | Dependencies | Local command | Localhost port(s) |
|---|---|---|---|---|---|---|
| test-inspector | _TODO — set during stage 1c, before implementation_ | `feature/detective-redesign` | _TODO — `develop` doesn't exist yet; confirm with user whether to branch from `main` or create `develop` first_ | _TODO — `npm ci` after worktree create_ | `npm run watch` (extension dev) · F5 (Extension Development Host) | n/a (VS Code extension; no http server) |

## Resume state

- **Last updated:** 2026-05-16 by claude-code
- **What just happened:** Phase A scaffold landed on `feature/detective-redesign` (off `develop` off `main`). Added `src/services/caseFile.ts` (types + stub `synthesizeCaseFile`), `src/views/caseFile/template.ts` (HTML renderer with strict CSP), `src/views/caseFile/panel.ts` (webview wrapper), `test/unit/caseFile.test.ts` (4 tests, all pass). Locked decisions D#12 (info-layer only — never mutate) and D#13 (LLM as ambient co-worker, not per-card enrichment). `npm run compile` and `npm test` both pass with 18/18.
- **Current focus:** awaiting user (Danil) to commit a baseline of the current state — `src/` is untracked, so the Phase A.5 deletions (drop 5 sidebars, dashboard.ts, 19 commands, etc.) cannot start without a recoverable baseline. The agent will not commit autonomously (user's global rule).
- **Next action:** once Danil commits the baseline, run Phase A.5 — package.json trim, view deletes, extension.ts split into `commands/index.ts` + `wiring.ts`. Then Phase B — real synthesis in `caseFile.ts` + the 3 new heuristic detectors (mocks-the-unit, mock-only-assertions, vague-title) with golden-master fixtures.
- **Blockers:** baseline commit required before any deletes; branch base is `feature/detective-redesign` off `develop` off `main`.

## Progress log

- 2026-05-16 — Phase A scaffold landed: caseFile types + stub synthesis + stub Webview panel + 4 passing unit tests. Compile + tests green at 18/18.
- 2026-05-16 — Decisions D#12 (info-layer only) and D#13 (LLM as ambient co-worker) locked in `.platform/memory/decisions.md`.
- 2026-05-16 — Branches: `develop` created from `main`; `feature/detective-redesign` created from `develop`. Worktree skipped per user.
- 2026-05-16 — Audit synthesized (4 parallel Explore agents) and pasted into `## 🔍 Audit Report` below.
- 2026-05-16 — Stream created from `detective-redesign` reframe. Audit dispatched: dashboard surface, detective pipeline, signal quality, command + entry surface.

## Open questions

- 1. Branch base — `main` (only branch present) or create `develop` first? The platform's worktree convention says feature branches come from `develop`. Awaiting Danil's call.
- 2. Hard cut vs. progressive cut — should we delete the old dashboard wholesale and ship a v2, or progressively trim while keeping a `legacy mode` for users who liked the cards? Recommend hard cut (pre-1.0, no shipped users yet) but Danil decides.
- 3. Does "explain like to a 5-year-old" mean two outputs (technical + plain-English) or one plain-English-first output that experts can drill into? Recommend the latter (one narrative, signals exposed on click) but Danil decides.

---

## 🔍 Audit Report

> **Required:** After every audit request, paste the full standardized report here.
> Do NOT leave the audit only in chat — it must be anchored here so the next session has it.
> Format: `.platform/workflow.md` → Stream / Feature Analysis Protocol → Step 4 template.
> After a clean re-audit (all 🟢), remove this section before stream closure.

# 📋 detective-redesign — Audit Snapshot

> **Stream:** `detective-redesign` · **Date:** 2026-05-16 · **Status:** 🟡 drifted from product thesis
> **Repos touched:** `test-inspector` (single repo)
> **Run via:** Stream / Feature Analysis Protocol — 4 parallel Explore agents (dashboard surface · detective pipeline · signal quality · command + entry).

---

## ⚡ At-a-Glance Scorecard

| | 🖥️ test-inspector |
|---|:---:|
| **Implementation** | 🟡 |
| **Tests** | 🔴 |
| **Security** | 🟢 |
| **Code Quality** | 🔴 |
| **Product alignment (vs ROADMAP "Definition of Actually Useful")** | 🔴 |

> **Bottom line:** The scaffolding (adapters, signals, parsers, webview) is in place and safely built. The load-bearing **synthesis layer** that turns signals into "BookingFlow.tsx is bullshit because X, Y, Z — delete this test, write this one instead" does not exist. Today the tool reports facts; the product needs to issue **verdicts**.

---

## 🔄 How the product *should* work (vs how it works today)

```
SHOULD: signals → SYNTHESIS → 1 paragraph verdict per file ("delete X, write Y, why")
                    ▲
                  (missing)

TODAY:  signals → 7 independent panels → user mentally synthesizes → gives up
```

---

## 🛡️ Security

| Severity | Finding |
|:---:|---|
| 🟢 Clean | All subprocess use `execFile` with arg arrays (services/runner.ts). No `exec`/`shell:true`/`execSync`. |
| 🟢 Clean | LLM key in VS Code SecretStorage only (services/llm.ts). |
| 🟡 Medium | Webview CSP / HTML-escape helper not yet audited end-to-end for the dashboard (38 KB file). Re-verify after redesign. |
| 🟡 Medium | `testInspector.llm.baseUrl` lacks https validation today (settings accept any URL). |

---

## 🧪 Test coverage

| Area | Tested? | File |
|---|:---:|---|
| Framework adapter detection | 🟡 Thin | test/unit/adapters.test.ts |
| Coverage parsers (LCOV / coverage.py) | 🟡 Thin | test/unit/coverage.test.ts |
| Feature grouping | 🟡 Thin | test/unit/features.test.ts |
| Report rendering | 🟡 Thin (1 golden) | test/unit/report.test.ts · test/fixtures/test-inspector-report.md |
| Setup diagnostics | 🟡 Thin | test/unit/setup.test.ts |
| Quality heuristics (per-heuristic) | 🔴 None | _missing — no `quality.test.ts`_ |
| Source risk scoring (per-signal) | 🔴 None | _missing — no `sourceRisk.test.ts`_ |
| Investigator synthesis | 🔴 None | _missing — no `investigator.test.ts`_ |
| Git changed-file mapping | 🔴 None | _missing — no `git.test.ts`_ |
| LLM provider (mocked) | 🔴 None | _missing — no `llm.test.ts`_ |

---

## ✅ Implementation status

| Component | Status | Location |
|---|:---:|---|
| Adapter registry | ✅ Done | src/adapters/index.ts · types.ts |
| React / Flutter / Python / Firebase adapters | ✅ Done (detection + discovery only; semantic depth missing) | src/adapters/*.ts |
| Vue.js adapter | ❌ Missing | _not in src/adapters/_ (decisions deferred #2) |
| Coverage parsers (LCOV, coverage.py JSON/XML) | ✅ Done | src/services/coverage.ts |
| Istanbul JSON / Vitest / Flutter path normalization | ❌ Missing | (Phase 5 deferred) |
| Quality heuristics (regex-based) | 🟡 Partial | src/services/quality.ts:81-156 |
| Quality heuristics — **catch LLM patterns** | ❌ Missing | _no detector for mocks-the-unit, mock-only-assertions, vague titles, render-didn't-throw_ |
| Risk scoring | 🟡 Partial — keyword regex, high false-positive rate | src/services/sourceRisk.ts:207-273 |
| Feature grouping | 🟡 Partial — folder-name guess; misses cross-cutting | src/services/features.ts:67-102 |
| Changed-file → related-test mapping | 🟡 Partial — basename only; no TS-alias / barrel / Python / Dart resolution | src/services/git.ts:75-95 |
| Investigator (deterministic) | 🔴 List-dump only, no synthesis | src/services/investigator.ts:22-24 + 77-136 |
| Feature investigator | 🔴 Same problem | src/services/featureInvestigator.ts |
| Investigation report (Markdown export) | 🟡 Pure enumeration — no narrative | src/services/investigationReport.ts:4-40 |
| LLM provider (OpenAI-compatible) | 🟡 Skeleton — no token budget, cache, retry, structured JSON | src/services/llm.ts |
| Test runner | 🟡 No cancellation, no JSON reporter integration | src/services/runner.ts · testController.ts · testResults.ts |
| Dashboard webview (28 surfaces) | 🔴 ~60% noise per surface audit | src/views/dashboard.ts (~38 KB) |
| 5 sidebar tree views | 🔴 4 of 5 duplicate the dashboard | src/views/{projects,tests,coverage,quality,changedFiles}View.ts |
| Investigation drilldown | 🟡 7 independent panels — no story | src/views/investigationView.ts · featureInvestigationView.ts |
| Extension entry / DI / command wiring | 🔴 Oversized (~36 KB) | src/extension.ts |
| Marketplace publish prep | ❌ Missing | (separate stream) |

---

## 🔧 Open issues

### 🔴 Must Fix (blocking the product thesis)

| # | Issue | Location | Why this blocks the thesis |
|---|---|---|---|
| 1 | Investigator outputs a list-dump, not the BookingFlow paragraph | src/services/investigator.ts:22-24, 77-136 | Without synthesis there is no detective |
| 2 | Missing "mocks the unit under test" detector | src/services/quality.ts:149-153 | Single most diagnostic LLM-fake-test pattern |
| 3 | Missing "mock-assertions-only" detector | src/services/quality.ts | Distinguishes `expect(spy).toHaveBeenCalled()` from real assertion |
| 4 | Missing "vague test title" detector | src/services/quality.ts | LLM-generated titles are uniformly vague |
| 5 | No "DELETE THIS TEST" verdict in any output | investigator.ts + quality.ts | User explicitly wants this — verdicts not facts |
| 6 | Dashboard has ~28 surfaces; ~60% are noise | src/views/dashboard.ts | Buries the signal |
| 7 | 4 of 5 sidebar tree views duplicate the dashboard | src/views/{projects,tests,coverage,changedFiles}View.ts | Three places for the same thing |
| 8 | `src/extension.ts` and `src/views/dashboard.ts` violate the 300-line cap | extension.ts · dashboard.ts | Blocks adding new code under any rule |
| 9 | No unit tests for the heuristics that ARE the product | quality · sourceRisk · investigator · git · llm | Every product-thesis bet currently untestable |

### 🟡 Should Fix Soon

| # | Issue | Location |
|---|---|---|
| 10 | Criticality signals are keyword regex with high false-positive rate | sourceRisk.ts:207-240 |
| 11 | Coverage weighted heavily despite high coverage ≠ good tests | sourceRisk.ts:266-269 |
| 12 | Source-to-test mapping basename-only — no TS alias / barrel / Python / Dart resolution | git.ts:75-95 (Phase 3) |
| 13 | Feature grouping is folder-name guesswork; misses utilities/cross-cutting | features.ts:67-102 |
| 14 | Coverage bar color logic is inverted-psychology | dashboard.ts:1042-1053 |
| 15 | `onView:*` activation events wake the extension on sidebar reveal | package.json:14-21 |
| 16 | `testInspector.llm.baseUrl` accepts any URL — no https validation | services/llm.ts |
| 17 | Investigation Markdown export is a flat enumeration, not a narrative | investigationReport.ts:4-40 |

### ⚪ Known limitations (document, don't block)

| # | Limitation |
|---|---|
| 18 | Vue.js adapter absent (decisions deferred #2) |
| 19 | Istanbul JSON / Vitest / Flutter URI path normalization deferred (Phase 5) |
| 20 | No persistence / trend history (Phase 11) |
| 21 | No bundler — Marketplace cold-start slow (decisions deferred #1) |

---

## 🎯 Close Checklist / Priority Order

  □  1. 🔍  Get audit approval from Danil
  □  2. 🧠  Propose the detective-mode redesign in chat (UI shape + investigator narrative contract + kill list) — no code
  □  3. ✅  Get redesign approval — single human gate before any code
  □  4. 🧪  Add unit tests for the new investigator synthesis (golden master fixtures, BookingFlow-style)
  □  5. 🐛  Build the missing "delete this test" verdict path (quality + investigator both contribute)
  □  6. 🪓  Cut 8+ commands and 3+ tree views (per the kill list)
  □  7. 🪓  Split `extension.ts` and `dashboard.ts` below 300 lines each
  □  8. 🔧  Add the 3 missing critical heuristics: mocks-the-unit · mock-only-assertions · vague-title
  □  9. 🪞  Replace dashboard with single narrative panel (1-paragraph verdict + signals on demand)
  □  10. 🧪  Re-audit; all 🟢 before closure
