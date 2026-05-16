<!-- agentboard:root-entry:begin v=1 -->
# test-inspector

**What this is:** A local-first VS Code extension that turns a monorepo or multi-repo workspace of React / Vue / Flutter / Django / FastAPI / Firebase Functions / Node.js projects into actionable test-quality intelligence — test inventory, coverage, weak/ghost tests, source risk, changed-file risk, and an optional LLM-driven investigation drilldown. Open source, public VS Code Marketplace as the distribution target.

## Stack

TypeScript 5.4 (strict) · `@types/vscode ^1.90` · Node 20 runtime · `tsc` build (no bundler yet — open decision #1) · `node --test` runner · OpenAI-compatible HTTPS endpoint for the optional LLM layer (key in VS Code SecretStorage).

## Repo structure

Single repo. The product itself is designed to operate across multi-repo and monorepo workspaces, but this source tree is one repo.

```
src/
├── extension.ts            entry, command registration, DI wiring (OVERSIZED — split target)
├── models.ts               shared TS types
├── adapters/               framework adapters (react, flutter, python, firebase, shared)
├── services/               coverage, quality, risk, runner, investigator, llm, state, …
├── views/                  TreeDataProviders + Webview Dashboard / Investigation (dashboard.ts OVERSIZED)
└── utils/                  fs, path, xml helpers
test/
├── fixtures/<stack>/       per-stack sample workspaces
└── unit/                   node --test specs
```

## How this project actually works

- **Adapter pattern is sacred.** The extension core never branches on framework identity. Adding React-specific or Flutter-specific behavior happens behind the `TestFrameworkAdapter` interface in `src/adapters/types.ts`. New stack = new adapter file + registry entry, not edits to `extension.ts` / services.
- **All scoring is deterministic.** Coverage → quality → risk → changed-file → investigation are pure functions over scanned state. The optional LLM enriches but never alters the underlying scores or the report shape.
- **Local-first or it doesn't ship.** Every core feature (detection, discovery, coverage, quality, risk, changed-file, reports) must work with no LLM key configured. The LLM is strictly additive.
- **The Dashboard is the marketing AND the daily surface.** It's a Webview, not a TreeView, because the product needs KPIs, charts, filter controls, and rich drilldowns. Tree views are sidebar entry points only.
- **The `package.json` contributes block is the public contract.** Every command appears in `contributes.commands`, `activationEvents`, and is registered in `extension.ts`. Settings live under `testInspector.*`. Webview message protocol is internal.

## Workflow

See `.platform/workflow.md` for the 6-stage inline workflow (Triage → Interview → Research → Propose → Execute → Verify) and the mandatory new-stream / checkpoint / handoff / closure rituals. The `SessionStart` hook also surfaces active-stream status and hard rules automatically.

**Non-trivial task?** Run `ab brief` → read `.platform/work/BRIEF.md` + `ACTIVE.md` → check / create a `.platform/domains/<name>.md` → create `work/<slug>.md` → research → propose → execute. Never skip directly to code.

**Closing a stream?** Only the human/owner declares completion. Run `ab close <slug>` (Step 1 — harvest), distill memory under `.platform/memory/`, then `ab close <slug> --confirm` after `closure_approved: true` is set on the stream file.

## Reference pack

Load only what the current task touches. Never auto-load `work/archive/*`, `memory/learnings.md`, or `memory/BACKLOG.md`.

- `.platform/STATUS.md` — current priorities, release blocklist, file-size violations, pinned gotchas
- `.platform/architecture.md` — components, data flow, invariants, architectural debt
- `.platform/repos.md` — single-repo layout, specialist routing, hard repo rules
- `.platform/memory/decisions.md` — 10 locked decisions + 8 deferred (with revisit triggers)
- `.platform/memory/log.md` — append-only session log
- `.platform/domains/` — adapters, test-discovery, coverage, quality, risk-scoring, changed-files, investigation, llm, runner, dashboard, reports
- `.platform/conventions/` — security, testing, qa, api, deployment, typescript, vscode-extension
- `.platform/workflow.md` — the 6-stage protocol (load before any multi-step protocol)
- `.platform/ONBOARDING.md` — the 7-step onboarding path for future sessions
- `ROADMAP.md` — phased backlog (Phase 1–12); the source of truth for what's left
- `test-inspector-extension-prompt.md` — original product brief

## Subagent model assignment (Claude Code)

Before every `Task` dispatch, print the manifest block with model emoji (🔵 sonnet · 🟣 opus · 🟡 haiku). Default mapping: research / audit / exploration / doc writing / code review / test writing / security audit → 🔵 `sonnet`; code implementation / hard architectural decisions → 🟣 `opus`; mechanical narrow operations → 🟡 `haiku`. Always pass `model` explicitly on every `Task` call — never omit it. Full rule in `.platform/agents/subagent-dispatch.md`.

## Hard constraints (don't break these)

1. **Adapter isolation.** Core never branches on framework identity. New framework = new adapter, not edits to `extension.ts` / services.
2. **Safe command execution.** `child_process.execFile` / `spawn` with arg arrays only. Never `exec`, never `shell: true`, never `execSync` with composed strings. No destructive commands. Coverage / run-all commands require explicit user confirmation. Refuse to spawn in untrusted workspaces.
3. **Local-first / LLM optional.** Every core feature must work with no LLM key. The LLM layer is strictly additive.
4. **Never mutate source.** Test Inspector reads, scores, reports. It does not edit the user's source / test / config files.
5. **Secrets stay in VS Code SecretStorage.** Never `settings.json`, never `process.env`, never OutputChannel logs, never exported reports.
6. **No invented coverage commands.** If a project has no documented coverage script, surface a setup blocker — do not guess.
7. **300-line file size cap.** `src/extension.ts` and `src/views/dashboard.ts` violate this today; split before adding to them.
8. **Webview XSS-safe by construction.** All injected values go through the HTML-escape helper; CSP is strict; hyperlinks are `command:` URIs only.
9. **Only the human declares a stream complete.** Stream closure requires `closure_approved: true` in the stream file; enforced by `platform-closure-gate.js` (Claude Code) and the git pre-commit hook (all CLIs).
<!-- agentboard:root-entry:end v=1 -->
