# test-inspector — Repos & Specialist Routing

Last updated: 2026-05-16

---

## Repos

Single-repo project.

| Repo ID | Path | Role / stack hint | Deep reference |
|---|---|---|---|
| test-inspector | `.` | VS Code extension / TypeScript | n/a (this is the only repo) |

The product is itself designed to operate across multi-repo and monorepo workspaces — but the extension's source code lives in one repo.

## Conventions — which file governs which area

| Area you're touching | Read first |
|---|---|
| Adapter interface / framework detection | `domains/adapters.md` + `conventions/vscode-extension.md` |
| TypeScript source style | `conventions/typescript.md` |
| VS Code API patterns (TreeDataProvider, Webview, contributes) | `conventions/vscode-extension.md` |
| Child process / coverage commands / shell safety | `conventions/security.md` |
| Unit tests + fixtures | `conventions/testing.md` |
| Webview / dashboard / drilldown manual verification | `conventions/qa.md` |
| Extension command surface + LLM HTTP API consumption | `conventions/api.md` |
| Marketplace publish / VSIX / versioning | `conventions/deployment.md` |

## Specialist routing (if you use Claude Code skills)

| When you touch... | Use skill |
|---|---|
| New framework adapter | `ab-architect` first (lock invariants), then `ab-test-writer` |
| Coverage parsing (LCOV / coverage.py XML/JSON / Istanbul) | `ab-research` (check format spec) → implement → `ab-test-writer` |
| Risk scoring / criticality signals | `ab-architect` (signal weights) → `ab-test-writer` (regression cases) |
| Weak-test heuristics → AST upgrade | `ab-architect` → `ab-research` (parser choice) → `ab-test-writer` |
| LLM provider / prompt builder | `ab-research` (token budgeting) → `ab-architect` → `ab-security` (key handling, redaction) |
| Dashboard webview UX | `ab-architect` (split first if >300 LOC) → `ab-qa` |
| Marketplace publish prep | `ab-review` + `ab-security` |
| Bug investigation | `ab-debug` |
| Pre-PR review | `ab-review` |

Fill this table out further as new skills are introduced. Delete rows you don't use.

## Hard repo rules

These apply throughout this repo:

1. Max ~300 lines per file. `extension.ts` and `views/dashboard.ts` violate this today — track in `STATUS.md` "File size violations" and split before adding to them.
2. No secrets in code, logs, OutputChannel, or committed files. API keys live in VS Code SecretStorage only.
3. No `child_process.exec` or `execSync` with shell strings. Use `execFile`/`spawn` with arg arrays.
4. No destructive commands run on behalf of the user without explicit confirmation.
5. Adapter isolation — core never branches on framework identity. New framework = new adapter, not edits to `extension.ts` / services.
6. Local-first — every core feature must work with the LLM disabled.
7. Every new heuristic or parser ships with at least one unit test and at least one fixture under `test/fixtures/<stack>/`.
8. Every new command added to `package.json` `contributes.commands` MUST also have a matching `activationEvents` entry and be registered in `extension.ts`.
