---
stream_id: stream-branch-worktree-feature-targeting
slug: branch-worktree-feature-targeting
type: feature
status: done
agent_owner: codex
domain_slugs: [workspace-scope]
repo_ids: [repo-primary]
base_branch: develop
git_branch: feature/branch-worktree-feature-targeting
created_at: 2026-05-16
updated_at: 2026-05-17
closure_approved: true
---

# branch-worktree-feature-targeting

_Metadata rules: `stream_id` must be `stream-<slug>`, `slug` must match the filename, `status` must match `work/ACTIVE.md`, and `updated_at` should change whenever ownership or state changes._

## Scope
- Add a centralized, read-only repo/worktree catalog so Test Inspector can analyze any tracked existing checkout rather than assuming the current VS Code workspace equals one product state.
- Let users add any local Git repo to Test Inspector tracking; persist those repo roots so the catalog is available from any VS Code instance.
- For every tracked repo, discover and show that repo's existing Git worktrees.
- If a tracked repo is an Agentboard hub/project with `.platform/repos.md`, expand its managed repos and their worktrees into the catalog as discovered candidates, but do not require Agentboard.
- Add feature-focused targeting so users can inspect tests, coverage, quality, and risk for one feature slice such as a PDF upload/OCR/LLM/API workflow.
- Ensure scoped analysis works locally without an LLM key; LLM output may explain or enrich but cannot change deterministic scores.
- Make the active repo/worktree/branch and feature scope visible in Case File, investigation/reviewer output, and reports.
- Add report generation for deterministic local findings and optional AI-optimized feedback, with selectable case groups such as Theater + Missing.
- Out of scope: creating worktrees, switching branches, committing, stashing, merging, rebasing, mutating user repositories, inventing missing test commands, or replacing framework adapters with feature-specific branches.

## Done criteria
- [x] Repo/worktree catalog supports user-added repos, each repo's existing Git worktrees, optional Agentboard `.platform/repos.md` expansion, and multi-root VS Code workspaces using read-only commands and file reads only.
- [x] Known repos are available from any VS Code instance through Test Inspector extension state.
- [x] Adding an Agentboard hub repo discovers its managed child repos and their worktrees as candidates, similar to Worktree Diff, without making Agentboard the source of truth.
- [x] A user can choose an existing worktree/branch as the analysis target without Test Inspector performing any Git action.
- [x] A user can choose or define a feature target and see only related source files, tests, coverage, quality findings, risk, and changed-file signals.
- [x] Case File and reports clearly show the active branch/worktree and feature scope.
- [x] Reports can be generated in deterministic or AI-optimized mode for all visible case groups or selected groups.
- [x] Optional investigation includes scoped evidence without changing deterministic scores.
- [x] Unit tests cover scope detection, forbidden mutation boundaries, feature-to-test matching, fallback behavior, and scoped service inputs.
- [x] Manual verification completed in a sample branch/worktree with a feature slice.
- [x] `.platform/memory/log.md` appended
- [x] `decisions.md` updated if any architectural choices were made

## Key decisions
_Append-only. Format: `YYYY-MM-DD — <decision> — <rationale>`_

2026-05-16 — Read-only Git scope only — Test Inspector observes existing branches/worktrees and scans tests from selected targets; it does not create worktrees, switch branches, or perform commit-oriented Git actions.

2026-05-16 — Centralized catalog — Test Inspector's own tracked-repo registry is the cross-window source of truth; any repo can be added, every tracked repo contributes its existing worktrees, and Agentboard `.platform/repos.md` only expands an already tracked repo when present.

2026-05-16 — Self-scan over fixtures — Adapter fixture projects stay in the repository for unit coverage, but normal Case File scans skip `test/fixtures` support projects and use a first-class Node.js adapter for the Test Inspector repo itself.

2026-05-17 — Report generation modes — Deterministic reports remain fully local/offline; AI-optimized reports reuse the configured reviewer, require explicit confirmation before sending code, and add suggestions without changing deterministic verdicts.

2026-05-17 — Sidebar report controls — Report mode/group selection belongs in the Test Inspector sidebar, not VS Code QuickPick, so users stay inside the same activity-bar workflow.

2026-05-17 — Analyzer reliability before confidence — Dogfood reports are only useful if deterministic signals are calibrated first; fixture leakage, string-literal pseudo-tests, and unsupported assertion APIs are release blockers.

## Worktree / Local environment

| Repo | Worktree path | Branch | Base | Dependencies | Local command | Localhost port(s) |
|---|---|---|---|---|---|---|
| test-inspector | `/Users/danilulmashev/Documents/GitHub/test-inspector` | `feature/branch-worktree-feature-targeting` | `develop` | _TODO — install before implementation_ | `npm run watch` (extension dev) · F5 (Extension Development Host) | n/a (VS Code extension; no http server) |

## Release-ready reliable reviewer plan

### Goal
Make Test Inspector a reliable local-first test reviewer: deterministic findings first, optional AI support second, with branch/worktree/feature-scoped reports that engineers can trust.

### Phase 1 — Calibration Pass 3
- [x] Add domain-specific gap suggestions for `workspaceCatalog.ts`, `runner.ts`, `utils/fs.ts`, VS Code panel/webview files, and `reportController.ts`.
- [x] Reduce generic fallback suggestions in top findings.
- [x] Keep service/controller risk above pure string-rendering helpers unless the helper performs commands, file I/O, secrets, or external calls.
- [x] Regenerate the deterministic report and confirm the top 10 Weak findings are specific and actionable.

### Phase 2 — Critical Test Hardening
- [x] `reportController.ts`: deterministic success, selected groups, AI mode without provider, AI review failure, write failure.
- [x] `targetController.ts`: add repo success/failure, refresh failure, select worktree, feature scope changes, raw bundle publish/update.
- [x] `workspaceCatalog.ts`: invalid repo path, Git failure, malformed worktree output, duplicate repo/worktree dedupe, Agentboard child repo expansion.
- [x] `runner.ts`: command preview, run-file args, non-zero exit, stdout/stderr capture.
- [x] Regenerate coverage and confirm Weak count only drops because real gaps were closed.

### Phase 3 — Feature-Scoped Reliability
- [x] Verify feature scope filters source files, test files, verdict cards, reports, and AI context.
- [x] Add tests for folder-based features, query-based features, monorepo duplicate feature names, and no-match feature state.
- [x] Confirm selected feature reports do not leak unrelated app-wide noise.

### Phase 4 — Coverage Adapter Reliability
- [x] Add/verify fixture tests for Node `out/src/*.js -> src/*.ts`, Jest/Vitest/Istanbul-style paths, Flutter `lib/*.dart`, and Python package paths.
- [x] Ensure missing/unreadable coverage is surfaced as setup evidence, not silent false confidence.

### Phase 5 — AI Reviewer Grounding
- [x] Ensure AI prompt includes deterministic verdict, deterministic gaps, coverage evidence, and related tests.
- [x] Ensure AI output can agree/challenge, cite verified anchors, suggest concrete tests, and preserve uncertainty.
- [x] Keep AI unable to alter deterministic scores or display fabricated anchors.

### Phase 6 — UI / Report Trust Pass
- [x] Confirm dashboard metric guide and report wording distinguish test files, test cases, source files, coverage, Weak source files, and Strong test files.
- [x] Confirm report scope shows repo/worktree/branch/feature and selected groups clearly.

### Phase 7 — Manual VS Code QA
- [x] Open Test Inspector repo, generate coverage, refresh Case File, generate deterministic report, and ask AI reviewer on one card.
- [x] Open another real repo, add tracked repo, select existing worktree, select feature, refresh, and generate report.
- [x] Confirm no source mutation, no Git mutation, no broken commands, and persisted state survives reload.

### Release gate
- [x] `npm test` passes.
- [x] `npm run coverage` passes.
- [x] Dogfood deterministic report has no obvious nonsense in top findings.
- [x] Top 10 Weak cards are specific and actionable.
- [x] Branch coverage is around 72-75%, or remaining branch gaps are intentionally accepted.
- [x] Feature-scoped reports work.
- [x] AI review is optional, safe, and grounded.
- [x] Manual VS Code QA passes on at least 2 real repos.

## Resume state
_Overwritten by `ab checkpoint` — the compact payload the next agent reads first. Keep this block under ~10 lines._

- **Last updated:** 2026-05-17 by danilulmashev
- **What just happened:** Final audit passed after removing stale command alias, keeping modified files under 300 lines, and verifying npm test, coverage, command contract, and dogfood report at 0 weak/missing/theater.
- **Current focus:** —
- **Next action:** Commit audited changes and prepare PR summary.
- **Blockers:** none

## Progress log
_Append-only. `ab checkpoint` prepends a dated line and auto-trims to the last 10 entries. Format: `YYYY-MM-DD HH:MM — <what happened>`._

2026-05-17 13:13 — Final audit passed after removing stale command alias, keeping modified files under 300 lines, and verifying npm test, coverage, command contract, and dogfood report at 0 weak/missing/theater.

2026-05-17 13:11 — Completed final pre-PR audit: split oversized modified tests, kept generated reports ignored/untracked, verified npm test, coverage, and dogfood report at 0 weak/missing/theater.

2026-05-17 13:07 — Completed pre-PR audit cleanup: untracked generated report artifacts, split oversized tests, added final trusted command-flow branch coverage, reverified tests/coverage/dogfood report.

2026-05-17 12:50 — Dogfooded Test Inspector to zero weak findings by adding targeted tests, clarifying dashboard metrics, normalizing LCOV TypeScript helper noise, regenerating report, and reinstalling the VSIX.

2026-05-17 12:32 — Continued dogfood weak-card cleanup: added behavior coverage for coverage parsing/discovery, changed-file recommendations, quality analysis branches, Flutter quality, setup, targets/cases trees, registry, state/story/report; fixed snapshot-only and package-contract false positives. Weak count now 12, tests 214/214, coverage 89.3 line / 76.4 branch / 78.7 function, VSIX reinstalled.

2026-05-17 12:26 — Dogfooded Weak report and addressed real issues: fixed package.json contract false positive, added behavior tests across heuristics, report/state/story/tree/controller/setup/registry/flutter-quality paths; weak count dropped from 24 to 15, tests 205/205, coverage 88.8 line / 74.9 branch / 78.6 function, VSIX reinstalled.

2026-05-17 12:16 — Audited report export fix end-to-end: default save path now follows scanned worktree, regression test covers centralized-host workflow, generated report artifacts are removed from the Test Inspector repo and ignored going forward; npm test 183/183 and npm run coverage pass.

2026-05-17 12:07 — Fixed report export default path so reports for selected external worktrees default into that worktree instead of the Test Inspector host repo; added regression coverage; reinstalled VSIX.

2026-05-17 10:56 — Executed release-hardening pass: added focused behavioral tests for AI reviewer/configuration, LLM providers/registry, extension command safety, report/target controllers, runner, coverage controller, test result parsing, Git changed-file risk, setup, feature areas, and source filters; verified npm test 181/181, npm run coverage, regenerated deterministic report at 24 Weak / 37 Strong with 87.7 line / 72.1 branch / 76.4 function coverage, and reinstalled the VSIX.

2026-05-17 10:19 — (auto) 697f616: Update stream checkpoint after reviewer workflow commit

## Open questions
_Things blocked on user input. Remove when resolved._

- Should v1 auto-track Agentboard child repos immediately when a hub repo is added, or show them as discovered candidates that the user confirms into tracking?

---

## 🔍 Audit Report

## Code review: branch-worktree-feature-targeting re-audit

### Summary
The stream now implements the requested read-only tracked repo/worktree catalog, optional Agentboard hub expansion, target scanning, and feature-scoped Case File filtering with the audit blockers addressed. `extension.ts` has been reduced to 193 lines, target/scan/AI responsibilities are split into focused services, and Git-backed target discovery is gated by workspace trust.

### Axis 1 — Spec compliance: PASS
The feature matches the clarified model: Test Inspector owns tracked repos, discovers each repo's existing worktrees, optionally expands Agentboard hubs, and does not mutate Git state.

### Axis 2 — Code quality: PASS
New logic is split across focused files under 300 lines: `targetController`, `workspaceCatalog`, `caseFileScanner`, `aiReviewController`, and `caseFileStory`. `src/extension.ts` is now 193 lines. `sourceRisk.ts` was split back under the cap; the remaining known over-cap file is `caseFile/template/style.ts`, which is mostly styling.

### Axis 3 — Security (shallow): PASS
Git calls use `execFile` with argv arrays and no destructive commands. `TargetController.ensureTrusted()` now refuses target refresh/add discovery in untrusted workspaces before invoking Git-backed catalog discovery. Existing scan behavior already refused untrusted workspaces.

### Axis 4 — Test coverage: PASS
`npm test` passes: 74/74. Tests cover worktree porcelain parsing, Agentboard repo table expansion, feature-scope filtering, Node.js self-project detection, and fixture-project suppression during normal scans. User manually smoke-tested the extension flow successfully before this refactor; re-test in Extension Host is recommended because wiring moved.

### Findings

#### Critical (must fix before merge)
_None._

#### High (should fix before merge)
_None._

#### Medium (follow-up issue is fine)
1. `src/views/targetsView.ts:61` — Worktree labels use only `path.basename`, so similarly named worktrees are hard to distinguish in the compact tree. The tooltip helps, but a short parent/path hint in the description would improve scan-target confidence.

#### Low / nit
1. `src/views/caseFile/template.ts:43` — `escapeInline` duplicates the existing template escaping style. Prefer reusing the shared escape helper if available from the template constants/render layer.

### Verdict
APPROVE
