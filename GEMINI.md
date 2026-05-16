<!-- agentboard:root-entry:begin v=1 -->
# test-inspector — Gemini CLI entry

**What this is:** A local-first VS Code extension that turns a monorepo or multi-repo workspace of React / Vue / Flutter / Django / FastAPI / Firebase Functions / Node.js projects into actionable test-quality intelligence — test inventory, coverage, weak/ghost tests, source risk, changed-file risk, and an optional LLM-driven investigation drilldown. Open source, public VS Code Marketplace as the distribution target.

> You are an AI agent reading this file (Gemini CLI). All mandatory protocols below apply to you exactly as they apply to Claude Code and Codex CLI.

## Stack

TypeScript 5.4 (strict) · `@types/vscode ^1.90` · Node 20 runtime · `tsc` build (no bundler yet — open decision #1) · `node --test` runner · OpenAI-compatible HTTPS endpoint for the optional LLM layer (key in VS Code SecretStorage).

## Repo structure

Single repo. The product itself operates across multi-repo and monorepo workspaces, but this source tree is one repo.

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

- **Adapter pattern is sacred.** Core never branches on framework. New stack = new adapter file + registry entry, not edits to `extension.ts` / services.
- **All scoring is deterministic.** Coverage → quality → risk → changed-file → investigation are pure functions. The optional LLM enriches but never alters scores.
- **Local-first or it doesn't ship.** Every core feature works with no LLM key. The LLM is strictly additive.
- **Dashboard is a Webview** for KPIs, charts, filters, drilldowns. Tree views are sidebar entry points only.
- **`package.json` contributes is the public contract.** Every command in `contributes.commands` + `activationEvents` + registered in `extension.ts`. Settings under `testInspector.*`.

## Workflow

See `.platform/workflow.md` for the 6-stage inline workflow (Triage → Interview → Research → Propose → Execute → Verify) and the mandatory new-stream / checkpoint / handoff / closure rituals.

**Session start (every session — mandatory):**
1. Run `ab brief` first — compact state-of-project view.
2. Read `.platform/work/BRIEF.md` then `.platform/work/ACTIVE.md`.
3. Resuming a stream? Run `ab handoff <slug>` for the previous agent's Resume state.

**Context handoff (before ending or switching providers — mandatory):**

```bash
ab checkpoint <slug> --what "<what just happened>" --next "<one sentence next>" \
  --cumulative-in <N> --cumulative-out <N> --provider gemini --model <id>
```

**Reasoning annotation (after significant edits — mandatory):**

```bash
ab log-reason [<file>] "<one sentence why>"
```

**Stream closure (mandatory harvest ritual):**

```bash
ab close <slug>            # step 1 — print harvest checklist; distill into memory/
ab close <slug> --confirm  # step 2 — archive after closure_approved: true
```

**Long session fallback:** `ab watch &` polls `git status` every 10 min and auto-checkpoints — the closest equivalent to Claude Code's hooks. Stop with `ab watch --stop`.

**Non-trivial task?** Register in `ACTIVE.md` → create / update `.platform/domains/<name>.md` → create `work/<slug>.md` → worktree from `develop` (or `master` only for explicit hotfix) → research → propose → execute. Trivial single-file fixes are the only exception.

**Stream closure — Only the human declares a stream complete.** Verify `closure_approved: true` in the stream file before archiving. Enforced by a git pre-commit hook on all CLIs.

## Reference pack

Load only what the current task touches. Never auto-load `work/archive/*`, `memory/learnings.md`, or `memory/BACKLOG.md`. Use `ab search <keywords>` before loading any domain or convention file in full.

- `.platform/STATUS.md` — current priorities, release blocklist, file-size violations, pinned gotchas
- `.platform/architecture.md` — components, data flow, invariants, architectural debt
- `.platform/repos.md` — single-repo layout, specialist routing, hard repo rules
- `.platform/memory/decisions.md` — 10 locked decisions + 8 deferred (with revisit triggers)
- `.platform/memory/log.md` — append-only session log
- `.platform/domains/` — adapters, test-discovery, coverage, quality, risk-scoring, changed-files, investigation, llm, runner, dashboard, reports
- `.platform/conventions/` — security, testing, qa, api, deployment, typescript, vscode-extension
- `.platform/workflow.md` — the 6-stage protocol
- `ROADMAP.md` — phased backlog (Phase 1–12)
- `test-inspector-extension-prompt.md` — original product brief

## Hard constraints (don't break these)

1. **Adapter isolation.** Core never branches on framework. New framework = new adapter.
2. **Safe command execution.** `execFile` / `spawn` with arg arrays only. No `exec`, no `shell: true`, no `execSync`. Confirmation required for expensive commands. Refuse to spawn in untrusted workspaces.
3. **Local-first / LLM optional.** Every core feature works without an LLM key.
4. **Never mutate source.** Read, score, report — don't edit user files.
5. **Secrets stay in VS Code SecretStorage.** Never `settings.json`, env, logs, or reports.
6. **No invented coverage commands.** Surface a setup blocker instead of guessing.
7. **300-line file size cap.** `extension.ts` and `views/dashboard.ts` violate this; split before adding.
8. **Webview XSS-safe by construction.** HTML-escape helper, strict CSP, `command:` URIs only.
9. **Only the human declares a stream complete.** `closure_approved: true` required before archiving.
<!-- agentboard:root-entry:end v=1 -->
