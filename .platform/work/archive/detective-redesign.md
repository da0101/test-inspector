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
closure_approved: true
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
_Overwritten by `ab checkpoint` — the compact payload the next agent reads first. Keep this block under ~10 lines._

- **Last updated:** 2026-05-16 by danilulmashev (auto)
- **What just happened:** (auto) 6c50138: v1.0.0 — official release: deterministic detective + LLM-grounded second opinion
- **Current focus:** —
- **Next action:** (auto-saved from commit — update next action manually)
- **Blockers:** none

## Progress log

2026-05-16 19:27 — (auto) 6c50138: v1.0.0 — official release: deterministic detective + LLM-grounded second opinion

2026-05-16 18:45 — v0.0.19 (uncommitted): Sidebar AI Reviewer webview replaces QuickPick — provider/model/key form inline in activity-bar container. Key field never sent back to webview; multiple provider keys storable simultaneously; per-provider Test button shows ok/error inline. New: `src/views/reviewer/{template,panel}.ts`. Tests 47/47.

2026-05-16 18:34 — v0.0.18 (uncommitted): Filter state persisted across re-renders via `vscode.setState`. Fixes "AI review on Weak card bounces to Theater" UX bug. Tests 47/47.

2026-05-16 18:27 — v0.0.17 (uncommitted): scrollY persisted across re-renders. Fixes scroll-to-top jump on AI review / Mark Reviewed / Rescan. Tests 47/47.

2026-05-16 18:26 — v0.0.16 (uncommitted): Inline spinner on aiReview + rescan buttons (CSS-only ring, prefers-reduced-motion). Tests 47/47.

2026-05-16 18:14 — v0.0.15 (uncommitted): 6000-token Gemini budget + truncation-tolerant JSON validator. Extracts prose explanation via regex when JSON is truncated; labels via `uncertaintyNotes`. Tests 47/47.

2026-05-16 18:01 — v0.0.14 (uncommitted): validateExplanation now hunts the largest `{...}` substring (catches prose-wrapped Gemini responses); raw response logged on enrichment failure for debugging. Tests 47/47.

2026-05-16 17:58 — v0.0.13 (uncommitted): `scripts/install.sh` now `rm -rf out` before tsc — root cause of every stale-cache "createProviderRegistry is not a function" was tsc not removing `out/src/services/llm.js` after `src/services/llm.ts` was deleted in favour of the `llm/` folder. Tests 47/47.

2026-05-16 17:27 — v0.0.12 (uncommitted): defensive try/catch around `createProviderRegistry` call in activate(); diagnostic logs at every activation step. Tests 47/47.

2026-05-16 17:25 — v0.0.8 → v0.0.11 (uncommitted): Phase D-1 LLM provider abstraction. New `src/services/llm/` folder with `types.ts`, `http.ts`, `openai.ts`, `claude.ts`, `gemini.ts`, `registry.ts`, `enrich.ts`, `index.ts`. Strict-JSON anti-hallucination prompt; line-anchor verification drops fabricated citations; per-card "Ask AI reviewer" button surfaces verified explanation + suggested fix. Per-provider key storage in VS Code SecretStorage. 7 new tests in `llm-enrich.test.ts`. Tests 47/47.

## Open questions

_None at the moment. Three resolved 2026-05-16: branch base → `develop` from `main`, then `feature/detective-redesign` from `develop`; cut depth → hard cut (Phase A.5 executed); "explain like 5yo" → one narrative with signals exposed via "Show evidence" button (D#13 / case-file template)._

---

## 🔍 Audit Report

> **Required:** After every audit request, paste the full standardized report here.
> Do NOT leave the audit only in chat — it must be anchored here so the next session has it.
> Format: `.platform/workflow.md` → Stream / Feature Analysis Protocol → Step 4 template.
> After a clean re-audit (all 🟢), remove this section before stream closure.

# 📋 detective-redesign — Audit Snapshot

> **Stream:** `detective-redesign` · **Date:** 2026-05-16 (release-readiness audit) · **Status:** 🟢 ready for release after closing Tier-1 test gap (CLOSED in this run)
> **Repos touched:** `test-inspector` (single repo)
> **Run via:** Stream / Feature Analysis Protocol — 2 parallel Explore agents (implementation+quality+security; test-coverage gaps).
> Supersedes the previous audit (drift snapshot at session start).

---

## ⚡ At-a-Glance Scorecard

| | 🖥️ test-inspector |
|---|:---:|
| **Implementation** | 🟢 |
| **Tests** | 🟢 59/59 (was 47/47 — added 12 Tier-1 LLM tests this run) |
| **Security** | 🟢 |
| **Code Quality** | 🟡 (one oversized file: views/caseFile/template.ts @ 999 lines — non-blocking) |
| **Product alignment (vs ROADMAP "Definition of Actually Useful")** | 🟢 |

> **Bottom line:** End-to-end shipped and verified by Danil on Ai-Interior-Design (Theater + Weak cards both producing real, line-anchored Gemini reviews). All Tier-1 gaps closed in this audit run. Ready for release commit after Danil's explicit go.

---

## 🛡️ Security

| Severity | Finding |
|:---:|---|
| 🟢 Clean | Subprocess use — `execFile`/`spawn` with arg arrays only. No `exec`/`shell:true`/`execSync`. OutputChannel logs argv as a list, not a reconstructed shell string. |
| 🟢 Clean | LLM API keys in `vscode.SecretStorage` only. Read on demand inside `provider.complete()` (openai.ts:32 / claude.ts:36 / gemini.ts:36). Never logged, never sent to webview, never exported in Markdown. |
| 🟢 Clean | LLM base URL validation — http.ts:24-25 rejects non-https URLs except localhost/127.0.0.1. |
| 🟢 Clean | Webview CSP / HTML escape — every interpolated value goes through `escapeHtml` (template.ts:5-14). Reviewer panel applies the same. |
| 🟡 Medium | Workspace trust not explicitly guarded in `scanWorkspace()` (extension.ts:177). Current scan is read-only so risk is low, but add a guard before test execution lands. |
| 🟡 Medium | `ReviewedStore.load()` silently swallows JSON parse errors (reviewed.ts:29-31). Acceptable fallback, but corruption is invisible. |

---

## 🧪 Test coverage

| Area | Tested? | File |
|---|:---:|---|
| Framework adapter detection | ✅ Good | test/unit/adapters.test.ts |
| Coverage parsers (LCOV / coverage.py) | ✅ Good | test/unit/coverage.test.ts |
| Feature grouping | ✅ Good | test/unit/features.test.ts |
| Markdown report renderer | ✅ Good | test/unit/report.test.ts |
| Setup diagnostics | ✅ Good | test/unit/setup.test.ts |
| Case file synthesis (test verdicts) | ✅ Good | test/unit/caseFile.test.ts |
| Heuristics: vague-title, mock-only, mocks-unit | ✅ Good | test/unit/heuristics.test.ts |
| Flutter trivial-assertion + render-only widget | ✅ Good (fixture-based) | test/unit/flutter-quality.test.ts |
| ReviewedStore content-hash | ✅ Good | test/unit/reviewed.test.ts |
| exportMarkdown | ✅ Good | test/unit/exportMarkdown.test.ts |
| LLM enrich prompt + validator (anchor verification, fallback parser) | ✅ Good | test/unit/llm-enrich.test.ts |
| **OpenAiProvider HTTP layer** | ✅ NEW | test/unit/llm-providers.test.ts |
| **ClaudeProvider HTTP layer** | ✅ NEW | test/unit/llm-providers.test.ts |
| **GeminiProvider HTTP layer** | ✅ NEW | test/unit/llm-providers.test.ts |
| **httpRequest helper (https-only validation, timeout, abort)** | ✅ NEW | test/unit/llm-http.test.ts |
| classifySourceFile MISSING/WEAK boundary at <5% | 🟡 Thin | _follow-up: add 4% / 49% / 50% boundary tests_ |
| createProviderRegistry + activeProvider lookup | 🟡 Thin | _follow-up: 2 tests, not release-blocking_ |
| ReviewerViewProvider message handlers | 🔴 None | _Tier-3, defer post-release_ |
| extension.ts helpers (recountTotals, readRelatedContent) | 🔴 None | _Tier-3, defer post-release_ |

---

## ✅ Implementation status

| Component | Status | Location |
|---|:---:|---|
| Adapter registry + 5 framework adapters | ✅ Done | src/adapters/ |
| Coverage parsers (LCOV + coverage.py) | ✅ Done | src/services/coverage.ts |
| Source-risk scoring | ✅ Done | src/services/sourceRisk.ts |
| Feature grouping | ✅ Done | src/services/features.ts |
| Quality heuristics (regex; JS + Flutter Dart) | ✅ Done | src/services/quality.ts (298 lines) |
| 3 LLM-pattern detectors | ✅ Done | src/services/heuristics/ |
| Case file synthesis | ✅ Done | src/services/caseFile.ts (327 lines) |
| MISSING promotion at <5% coverage | ✅ Done | caseFile.ts:139-223 |
| Markdown export | ✅ Done | src/services/exportMarkdown.ts |
| ReviewedStore (content-hash invalidation) | ✅ Done | src/services/reviewed.ts |
| LLM provider abstraction (OpenAI / Claude / Gemini) — now injectable httpRequest for testability | ✅ Done | src/services/llm/ (8 files) |
| Anti-hallucination prompt + line-anchor verifier + truncation-tolerant JSON fallback | ✅ Done | src/services/llm/enrich.ts (249 lines) |
| Case File webview (KPI tiles, tabs, filters, scroll+filter state persistence, spinner) | ✅ Done | src/views/caseFile/template.ts (**999 lines — OVERSIZED but functional**) |
| AI Reviewer sidebar webview view | ✅ Done | src/views/reviewer/ |
| Install script (clean rebuild, code --install-extension) | ✅ Done | scripts/install.sh (clean `rm -rf out` before tsc) |

---

## 🔧 Open issues

### 🔴 Must Fix (blocking release)

_None remaining. The Tier-1 LLM provider test gap was closed in this audit run (12 new tests added)._

### 🟡 Should Fix Soon (post-release ok)

| # | Issue | Location |
|---|---|---|
| 1 | `src/views/caseFile/template.ts` at **999 lines** — over 300-line cap. Should split into template-kpis / template-cases / template-filters / template-review. Functional but maintenance debt. | src/views/caseFile/template.ts |
| 2 | classifySourceFile MISSING/WEAK boundary tests at 4% / 49% / 50% coverage | src/services/caseFile.ts:139-223 |
| 3 | createProviderRegistry + activeProvider untested | src/services/llm/registry.ts |
| 4 | Workspace trust not guarded in scanWorkspace | src/extension.ts:177 |
| 5 | ReviewedStore.load() silently swallows JSON parse errors | src/services/reviewed.ts:29-31 |
| 6 | `reviewed.load()` fire-and-forget — load failure leaves cards un-hidden silently | src/extension.ts:50 |
| 7 | ReviewerViewProvider message handlers untested (VS Code WebviewViewProvider mocking is non-trivial) | src/views/reviewer/panel.ts |

### ⚪ Known limitations (document, don't block)

| # | Limitation |
|---|---|
| 8 | Vue.js adapter absent (decisions deferred #2) |
| 9 | Istanbul JSON / Vitest / Flutter URI normalization deferred (Phase 5) |
| 10 | No persistence / trend history beyond reviewed-state (Phase 11) |
| 11 | No bundler — Marketplace cold-start slow (decisions deferred #1) |

---

## 🎯 Close Checklist / Priority Order

  □  1. ✅ Tier-1 LLM provider tests landed — 12 new tests passing (59/59 total)
  □  2. ✅ Audit anchored in this stream file
  □  3. ⏳ Danil signs off the audit
  □  4. ⏳ Danil approves the release commit shape (single bundled commit vs. split per phase)
  □  5. 📝 Commit covers: v0.0.8 → v0.0.19 source changes + new tests
  □  6. 🏷️ Tag v0.0.19 in git
  □  7. 📋 Set `closure_approved: true` in stream frontmatter
  □  8. 🗄️ `ab close detective-redesign --confirm` archives the stream
  □  9. 📝 Append a one-liner to `.platform/memory/log.md`
  □  10. 💡 Distill non-obvious learnings into `.platform/memory/` (gotchas — esp. the `tsc never removes stale .js` gotcha that bit us 4 times tonight)
