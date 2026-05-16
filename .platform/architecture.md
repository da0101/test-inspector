# test-inspector — Architecture

Last updated: 2026-05-16

> **Test Inspector** is a VS Code extension that scans a workspace, detects test projects per framework, statically discovers tests, parses coverage, scores source-file risk, surfaces weak/ghost tests, maps changed files to likely related tests, and (optionally) routes findings through an OpenAI-compatible LLM. Everything is local-first. **The product's reason for being:** the trust gap between "tests exist" and "tests prove behavior" — widened by LLMs and junior contributors who ship plausible-looking but shallow / fake / flaky tests. Test Inspector exists to catch those tests before they ship.

---

## 1. What this system does

**End-user view.** A developer opens VS Code on a repo (single repo or monorepo) using React / Vue / Flutter / Django / FastAPI / Firebase Functions / Node. The Test Inspector Activity Bar container appears. Without running anything, the extension already knows which projects exist, which tests are present, **which tests look weak / fake / LLM-generated**, where coverage is missing, and which changed files in the current Git diff are risky. Clicking a risky file opens an investigation drilldown that explains what to test next and why. An optional LLM layer can take a source/test pair and produce senior-reviewer-grade test improvement guidance.

**The product thesis in one paragraph.** Existing test extensions answer "did the tests pass?". Test Inspector answers "do the tests actually prove anything?". When 100% green can hide 60% useless tests — `expect(true).toBe(true)`, mock-only assertions, snapshot-only files, "render didn't throw" widget tests, tests that mock the very unit under test — somebody needs to flag that without running the suite. That somebody is this extension. It is calibrated for codebases where part of the test suite was written by LLMs (Copilot, Cursor, Claude, etc.) or by developers still building test taste, and where reviewers don't have time to read every test in every PR.

**Technical view.** Pure TypeScript VS Code extension targeting `vscode ^1.90`. No backend service, no remote state. All inputs come from the local filesystem (manifest files, source files, test files, coverage reports) and local Git. The only optional external service is an OpenAI-compatible HTTPS endpoint for the LLM investigator.

**Who uses it:** developers (the extension author dogfoods on their daily stack first; public Marketplace release is the goal).
**Who deploys it:** the maintainer publishes to the VS Code Marketplace; users install via VS Code.
**Hosting target:** VS Code extension host (Electron / Node.js process inside VS Code). No server.

## 2. High-level components

```
┌────────────────────────────────────────────────────────────────────────┐
│                         VS Code Extension Host                         │
│                                                                        │
│  ┌──────────────┐   ┌────────────────────────────────────────────┐    │
│  │  extension   │──▶│  Adapter Registry (src/adapters/index.ts)  │    │
│  │  .ts (entry) │   │  • react · flutter · python (django/      │    │
│  │              │   │    fastapi) · firebase · shared utilities │    │
│  └──────┬───────┘   └────────────────────────────────────────────┘    │
│         │                                                              │
│         ├──▶ Services (src/services/*)                                │
│         │     coverage · features · git · investigator · llm ·        │
│         │     quality · report · runner · setup · sourceRisk ·        │
│         │     state · testController · testResults                    │
│         │                                                              │
│         └──▶ Views (src/views/*)                                      │
│               TreeDataProviders: projects · tests · coverage ·        │
│               quality · changedFiles                                  │
│               Webviews: dashboard · investigation · feature drilldown │
└────────────────────────────────────────────────────────────────────────┘
            │                              │
            ▼                              ▼
   Local filesystem +           Optional OpenAI-compatible
   `git` CLI + workspace        chat completions endpoint
   coverage artifacts           (key in SecretStorage)
```

## 3. Tech stack (summary)

| Layer | Choice | Notes |
|---|---|---|
| Language | TypeScript 5.4 (strict) | `tsconfig.json` enforces strict, `noImplicitReturns`, `noFallthroughCasesInSwitch`, `esModuleInterop`, ES2022 target |
| Runtime | Node.js (VS Code extension host) | `@types/node ^20.12.12` — code may use Node 20 features |
| Extension API | `@types/vscode ^1.90.0` | Activity Bar container, TreeDataProvider, Webview, SecretStorage, OutputChannel, StatusBarItem |
| Build | `tsc -p ./` → `out/` | No bundler today. Open decision — Marketplace publish likely wants esbuild/rollup |
| Test runner | `node --test out/test/unit/*.test.js` | Node's built-in test runner; no Jest/Vitest dependency |
| Lint / format | _none configured yet_ | Add before public release (eslint, prettier) |
| External API | OpenAI-compatible Chat Completions | Configurable `baseUrl` + `model`; API key in VS Code SecretStorage |
| Git | local `git` CLI via `execFile` | No GitHub API dependency |
| Distribution | Public VS Code Marketplace (target) | `publisher` is `local` today; needs real identity before publish |

Per-stack conventions live in `conventions/{stack}.md` — see `typescript.md` and `vscode-extension.md`.

## 4. Data flow

```
1. Activation (onView / onCommand)
       │
       ▼
2. Workspace scan
   • For each workspace folder, each adapter detects projects via manifests
     (package.json, pubspec.yaml, manage.py, pyproject.toml, requirements.txt,
      firebase.json + functions/package.json).
   • Result: TestProject[] (one per detected project, distinct from folder).
       │
       ▼
3. Static test discovery
   • Each adapter discovers test files by pattern and extracts test cases
     (regex-based today; AST in Phase 4 roadmap).
   • Result: TestFile[] + TestCase[] (status `unknown` until a run produces results).
       │
       ▼
4. Coverage parse (when artifacts exist)
   • LCOV → services/coverage.ts
   • coverage.py JSON/XML → services/coverage.ts
   • Result: CoverageSummary per project, file-level + uncovered lines.
       │
       ▼
5. Quality analysis (services/quality.ts)
   • Skipped / focused / no-assertion / snapshot-only / trivial / orphan / mock-heavy.
   • Per-file QualityFinding[].
       │
       ▼
6. Source risk scoring (services/sourceRisk.ts)
   • Criticality signals (auth/clinical/billing/API/forms/state/routing/errors/exports/branches).
   • Combined with coverage gap + related test count.
   • Sorted SourceRiskScore[].
       │
       ▼
7. Changed-file analysis (services/git.ts)
   • `git status --porcelain=v1` + `git diff --name-only HEAD --`.
   • Each changed source file → related tests + coverage + findings + recommended command.
       │
       ▼
8. Rendering
   • TreeDataProviders fill the 5 sidebar views.
   • Dashboard webview renders KPIs + tables + investigation drilldowns.
   • State persisted via services/state.ts.
       │
       ▼
9. (Optional) Investigation drilldown
   • services/investigator.ts produces a deterministic InvestigationReport.
   • If LLM is configured (services/llm.ts), the report is enriched via an
     OpenAI-compatible call — only after the user confirms the privacy prompt.
   • Markdown export via services/investigationReport.ts.
```

## 5. Auth model

The extension has no auth boundary of its own — it runs as the user.

- **API key for the optional LLM provider** lives in VS Code SecretStorage, never in settings.json. The `testInspector.configureLlm` command is the only documented entry point for storing it.
- **No multi-tenant access** — single-user, single-machine.
- **Workspace trust** must be honored: do not execute any project command (test runs, coverage commands) in an untrusted workspace.

See `conventions/security.md` for the full secret-handling + trust-boundary rules.

## 6. External services

| Service | What it's used for | Where the secret lives |
|---|---|---|
| OpenAI-compatible Chat Completions | Optional Phase-7 LLM investigator (e.g. `https://api.openai.com/v1`) | VS Code SecretStorage (key: `testInspector.llm.apiKey`) |
| Local Git CLI | Changed-file detection | n/a (process arg, no secret) |

No telemetry. No analytics. No remote state. _(See open decision #4 — telemetry policy to confirm before Marketplace publish.)_

## 7. Deploy topology

**Build:** `tsc -p ./` produces `out/`. The `vscode:prepublish` script runs `npm run compile`.

**Package:** `vsce package` produces a `.vsix`. (`vsce` is not currently a dependency — add before first publish.)

**Publish:** `vsce publish` → public VS Code Marketplace under a real publisher identity.

**Environments:**
- **Dev** — open the workspace in VS Code, press `F5` for an Extension Development Host.
- **Staging** — `vsce package` produces a `.vsix` that can be installed manually for internal QA.
- **Prod** — published Marketplace version.

No CI yet. Adding a GitHub Actions workflow that runs `npm test` on PRs is on the release blocklist.

See `conventions/deployment.md` for the Marketplace publish + rollback playbook.

## 8. Cross-component invariants

The things that must stay true as the system evolves. Breaking any of these is a hard fail.

1. **Adapter isolation.** The extension core (`extension.ts`, services, views) never branches on framework identity. Framework-specific logic lives behind the `TestFrameworkAdapter` interface in `src/adapters/`. Adding a new framework means adding a new adapter, not editing core.
2. **Safe command execution.** Every child process uses `child_process.execFile` / `spawn` with arg arrays. No shell string interpolation. No destructive commands. Long-running or coverage-generating commands require user confirmation and route through `services/runner.ts` so the OutputChannel and StatusBar progress are consistent.
3. **Local-first / LLM optional.** Every core feature (detection, discovery, coverage, quality, risk, changed-file mapping, reports) must work with no LLM configured. The LLM layer is strictly additive.
4. **Never mutate source.** The extension reads, scores, reports. It does not edit the user's source files, test files, or configs without an explicit, scoped user command (none today).
5. **Secrets stay in SecretStorage.** API keys are never in `settings.json`, logs, or exported reports. The OutputChannel must redact request bodies that contain keys.
6. **No invented coverage commands.** If a project has no documented coverage script, the extension surfaces a setup blocker rather than guessing a command that might destroy state or waste minutes.
7. **Workspace trust honored.** Any command that executes project code (`runAll`, `runFile`, `runRelated`, coverage generation) refuses to run in an untrusted workspace.

## 9. Known architectural debt

| Area | Issue | Planned fix |
|---|---|---|
| `src/extension.ts` (~36 KB) | Single-file extension entry holds command registration + DI + lifecycle | Extract `commands/`, `wiring/`, and lifecycle modules; entry should fit on one screen |
| `src/views/dashboard.ts` (~38 KB) | Webview HTML/JS/CSS + render logic all colocated | Split: `dashboard/template.ts`, `dashboard/render.ts`, `dashboard/kpi.ts`, `dashboard/risk-table.ts` |
| `src/adapters/python.ts` | Single file covers both Django and FastAPI detection | Consider splitting once Django adapter gains real depth (Phase 12) |
| No AST layer | Quality + discovery rely on regex; produces false positives/negatives | Add `services/ast/` with stack-specific parsers (JS/TS, Python, Dart) — Phase 4 |
| No persistence | Every scan recomputes everything | Phase 11: cache project detection, discovery, risk by content hash |
| No bundler | Marketplace install size will be larger and cold start slower than necessary | Open decision #1 — pick esbuild before public publish |
| No CI | No automated gate on PRs | Add GitHub Actions workflow running `npm test` on every PR |
| No Vue adapter | User's stack includes Vue.js but `src/adapters/` has no Vue entry | Open decision #2 — Phase 12 framework-specific depth or earlier |
