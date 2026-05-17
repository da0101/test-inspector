---
stream_id: stream-branch-worktree-feature-targeting
slug: branch-worktree-feature-targeting
type: feature
status: in-progress
agent_owner: codex
domain_slugs: [workspace-scope]
repo_ids: [repo-primary]
base_branch: develop
git_branch: feature/branch-worktree-feature-targeting
created_at: 2026-05-16
updated_at: 2026-05-16
closure_approved: false
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
- [ ] Repo/worktree catalog supports user-added repos, each repo's existing Git worktrees, optional Agentboard `.platform/repos.md` expansion, and multi-root VS Code workspaces using read-only commands and file reads only.
- [ ] Known repos are available from any VS Code instance through Test Inspector extension state.
- [ ] Adding an Agentboard hub repo discovers its managed child repos and their worktrees as candidates, similar to Worktree Diff, without making Agentboard the source of truth.
- [ ] A user can choose an existing worktree/branch as the analysis target without Test Inspector performing any Git action.
- [ ] A user can choose or define a feature target and see only related source files, tests, coverage, quality findings, risk, and changed-file signals.
- [ ] Case File and reports clearly show the active branch/worktree and feature scope.
- [x] Reports can be generated in deterministic or AI-optimized mode for all visible case groups or selected groups.
- [ ] Optional investigation includes scoped evidence without changing deterministic scores.
- [x] Unit tests cover scope detection, forbidden mutation boundaries, feature-to-test matching, fallback behavior, and scoped service inputs.
- [ ] Manual verification completed in a sample branch/worktree with a feature slice.
- [ ] `.platform/memory/log.md` appended
- [ ] `decisions.md` updated if any architectural choices were made

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

## Resume state
_Overwritten by `ab checkpoint` — the compact payload the next agent reads first. Keep this block under ~10 lines._

- **Last updated:** 2026-05-16 by danilulmashev
- **What just happened:** Added import-graph source-risk reliability: barrel and entrypoint imports now provide indirect related-test evidence; dogfood Missing dropped from 36 to 19 while Theater/Weak stayed 0; npm test passes 82/82.
- **Current focus:** —
- **Next action:** Regenerate deterministic report in the Extension Host and review the remaining 19 Missing cards for controller/UI coverage strategy.
- **Blockers:** none

## Progress log
_Append-only. `ab checkpoint` prepends a dated line and auto-trims to the last 10 entries. Format: `YYYY-MM-DD HH:MM — <what happened>`._

2026-05-16 23:26 — Added import-graph source-risk reliability: barrel and entrypoint imports now provide indirect related-test evidence; dogfood Missing dropped from 36 to 19 while Theater/Weak stayed 0; npm test passes 82/82.

2026-05-16 23:11 — Hardened Node.js analyzer reliability after dogfooding: no fixture leakage, no string-fixture pseudo-tests, node:assert methods recognized, multiline imports handled, low-behavior source noise reduced. npm test passes 81/81.

2026-05-16 22:46 — Moved report mode/group selection into a compact Reports sidebar webview and removed top-center AI report progress notifications. npm test passes 76/76.

2026-05-17 00:40 — Reliability hardening after dogfood report: added JS lexical masking, node:assert recognition, multiline local import detection, Node fixture-test exclusion, and low-behavior source-risk filtering. Dogfood scan now shows 18 test files, 0 fixture cases, 0 no-assertion false positives, 0 Weak/Theater; npm test passes 81/81.

2026-05-16 22:37 — Added Generate Report flow with deterministic and AI-optimized modes, selectable verdict groups, suite/coverage summary fields, and per-case AI suggestions. npm test passes 76/76.

2026-05-17 00:16 — Replaced QuickPick report selection with a Reports sidebar webview: mode segmented control, verdict checkboxes, case/test summary, and inline report status/progress. Generate Report now focuses the sidebar view. npm test passes 76/76.

2026-05-16 22:27 — Added Node.js self-scan support and filtered support fixture projects from normal scans so Test Inspector analyzes its own real unit suite; npm test passes 74/74.

2026-05-17 00:05 — Added Test Inspector: Generate Report command with deterministic and AI-optimized modes plus multi-select verdict groups. Reports include scope, project/test/coverage summary, filtered case groups, and per-case AI feedback when requested. npm test passes 76/76.

2026-05-16 22:10 — Audited stream after user manual smoke test. Verdict REQUEST CHANGES: implementation matches spec and tests pass, but before merge split new target wiring out of oversized extension.ts and fix/document workspace-trust handling for Git-spawning target refreshes.

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
