# Feature Brief — test-inspector

> Read this first — every session, every agent (Claude, Codex, Gemini).
> 30-second orientation: what we're building, why, and where we stand.
> Replace entirely when the active feature changes. Keep ≤60 lines.

**Feature:** branch-worktree-feature-targeting — Test Inspector tracked-repo/worktree catalog plus feature-scoped test intelligence
**Status:** in-progress · v1 implemented; automated tests pass; manual VS Code Extension Host QA still needed
**Stream file:** `work/branch-worktree-feature-targeting.md`

---

## What we're building

**Test Inspector** — a local-first VS Code extension that scans a workspace (monorepo or multi-repo) for React / Vue / Flutter / Django / FastAPI / Firebase Functions / Node.js projects, statically discovers tests, parses coverage, scores source risk, surfaces weak / fake / flaky / LLM-generated tests, maps changed files to likely related tests, and (optionally) routes findings through an OpenAI-compatible LLM. The product narrative is "a senior test reviewer sitting inside VS Code".

## Why

**Tests written by LLMs and less-experienced developers often pass without proving anything** — `expect(true).toBe(true)`, mock-only assertions, snapshot-only files, render-didn't-throw widget tests, tests that mock the very unit under test. Existing VS Code test extensions run tests well but don't explain test quality, risk, or "what to test next", so these shallow tests reach `main` undetected and erode the suite's trustworthiness over time. Test Inspector exists to give teams visibility into which tests are real and traceability from changed source files to the (often weak) tests that supposedly cover them — so reviewers and authors catch the bad ones before they ship. Target distribution is the public VS Code Marketplace, open source.

## What done looks like

The product is "actually useful" (see ROADMAP § "Definition Of Actually Useful") when, on a real repo, it can:

- Identify a specific high-risk source file and the reasons (criticality + coverage + branching).
- List the existing related tests and the gaps in what they cover.
- Recommend specific next tests to write, in plain English.
- Show changed-file risk for the current Git diff.
- Export a Markdown PR-readiness report.
- Work entirely offline. The LLM, when configured, is additive.

## Architecture decisions locked

See `.platform/memory/decisions.md` for the full log. Top constraints anyone touching this code must respect:

- **Adapter isolation** (D#2) — framework specifics live behind `TestFrameworkAdapter`; core never branches on framework.
- **Safe command execution** (D#4) — `execFile`/`spawn` with arg arrays, no shell strings, no destructive commands.
- **Local-first / LLM optional** (D#3) — every core feature must work with no LLM key configured.
- **Never mutate source** (cross-component invariant #4) — read, score, report; don't edit user files.

## Current state

Post-`ab init` + activation. All 12 ROADMAP phases have partial implementation. Largest tech debt: `src/extension.ts` (~36 KB) and `src/views/dashboard.ts` (~38 KB) both violate the 300-line rule and must be split before adding to them. No CI, no bundler, no LICENSE, publisher ID is `local`. See `STATUS.md` § "Release blocklist" and § "Immediate priorities".

See `work/ACTIVE.md` for stream status (currently empty).

## Relevant context

> Only load the files listed here. Everything else is out of scope for this feature.
> Prefer `.platform/domains/<name>.md` files (cross-layer, focused) over repo-wide files.

- `.platform/domains/dashboard.md` — load when touching the dashboard webview / panels
- `.platform/domains/workspace-scope.md` — load when touching branch/worktree detection or feature-scoped filtering
- `.platform/domains/investigation.md` — load when touching the investigator pipeline / drilldown
- `.platform/domains/quality.md` — load when touching weak-test heuristics
- `.platform/domains/risk-scoring.md` — load when touching criticality / risk signals
- `.platform/domains/changed-files.md` — load when touching Git diff / changed-file targeting
- `.platform/STATUS.md` — current priorities + release blocklist
- `.platform/memory/decisions.md` — locked architectural / product / tooling decisions (esp. #11 product thesis)
- `ROADMAP.md` (repo root) — § "Definition Of Actually Useful" is the target output shape
- `test-inspector-extension-prompt.md` (repo root) — original product brief

**Do not load:** the full `src/` tree at session start — load only the files relevant to the chosen stream.
**Never load:** `work/archive/*`.

## Key files

The 3–6 most important files any agent needs to find quickly to start contributing.

- `src/extension.ts` — extension entry, command registration, DI wiring (oversized; split planned)
- `src/models.ts` — shared TypeScript types (`TestProject`, `TestFile`, `TestCase`, `CoverageSummary`, `QualityFinding`, etc.)
- `src/adapters/index.ts` — adapter registry; see also `src/adapters/types.ts` for the interface contract
- `src/services/sourceRisk.ts` — criticality + risk scoring engine
- `src/services/quality.ts` — weak/ghost test heuristics
- `src/views/dashboard.ts` — webview (oversized; split planned)
- `package.json` — `contributes.commands` + `activationEvents` define the extension's external surface
