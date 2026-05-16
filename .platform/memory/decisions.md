# test-inspector — Decision Log

Last updated: 2026-05-16

> **Purpose:** capture the _why_ behind architectural, product, and tooling decisions so future AI sessions and developers don't have to re-derive them (or undo them).

---

## Format

Each decision is one row. **Locked** decisions are final until a new decision supersedes them. **Deferred** decisions are explicit non-decisions with a trigger for when to revisit.

| # | Date | Status | Topic | Decision | Why | Rejected alternatives |
|---|---|---|---|---|---|---|

---

## Locked decisions

_Decisions that are final. If you want to change one of these, write a new decision row that supersedes it — don't silently overwrite._

| # | Date | Topic | Decision | Why | Rejected alternatives |
|---|---|---|---|---|---|
| 1 | 2026-05-16 | Implementation tech | TypeScript VS Code extension targeting `vscode ^1.90` | Tightest integration with the editor surface and the published distribution channel the user actually wants (VS Code Marketplace) | A standalone CLI (no editor surface), a web app (no local FS / Git access), a JetBrains plugin (wrong distribution) |
| 2 | 2026-05-16 | Architecture pattern | Adapter-based — every framework hides behind `TestFrameworkAdapter` | Lets the core stay framework-agnostic, allows community contributors to add Swift / C++ / Vue later without core edits | Per-framework forks; a megaclass with `if (framework === …)` branches; one all-purpose pattern matcher |
| 3 | 2026-05-16 | Product principle | Local-first; LLM is strictly additive | Core value (detection, discovery, coverage, quality, risk, changed-file mapping, reports) must work offline and free; LLM is a senior-reviewer upgrade, not a dependency | LLM-required design (would gate the product on an API key); LLM-by-default (would surprise users with network/cost) |
| 4 | 2026-05-16 | Child process safety | All external commands via `child_process.execFile` / `spawn` with arg arrays; never shell strings | Prevents command injection from workspace-controlled paths and adapter-built commands; matches OWASP guidance for tools that exec on behalf of users | `exec`/`execSync` with composed strings; `shell: true` in spawn options |
| 5 | 2026-05-16 | LLM provider | OpenAI-compatible Chat Completions endpoint (configurable base URL + model) | Maximizes provider portability — same code targets OpenAI, Azure OpenAI, OpenRouter, local Ollama proxies, etc. | Vendor-locked OpenAI SDK; Anthropic-only client; building a custom protocol |
| 6 | 2026-05-16 | API key storage | VS Code SecretStorage only | OS-keychain backed, scoped per extension; never in settings.json, env files, or logs | `settings.json` (visible in workspace, syncs to Settings Sync), env vars (leak risk), prompted-on-use (UX) |
| 7 | 2026-05-16 | Test runner | Node's built-in `node --test` runner against compiled JS in `out/` | Zero added dependency for the consumer; runs on Node 20 which is already a baseline; keeps install footprint small | Jest (heavy dep, transformer overhead), Vitest (extra runtime), Mocha (legacy ergonomics) |
| 8 | 2026-05-16 | Distribution channel | Public VS Code Marketplace, open source | User's explicit goal; open-source enables community-added framework adapters | Private VSIX only (limits adoption), OpenVSX only (smaller reach), local-only (defeats the marketplace goal) |
| 9 | 2026-05-16 | Workspace trust | Honor VS Code workspace trust; refuse to exec project commands in untrusted workspaces | Test runs and coverage generation execute project-controlled code; trust must gate this | Always run regardless of trust (security hole) |
| 10 | 2026-05-16 | No invented commands | Adapter never fabricates a coverage command when none is declared in the project's manifest | Burned in past: synthetic coverage commands wasted minutes on huge React projects and could mutate state; we explicitly degrade to "setup blocker" output instead | Best-effort guessing (high false-positive cost), always-run a generic `--coverage` flag (cost + correctness risk) |
| 11 | 2026-05-16 | Product thesis / reason for being | The product exists to close the trust gap between "tests exist" and "tests prove behavior" — driven by LLM-generated and junior-written tests that pass without proving anything | This is the load-bearing motivation that should bias every prioritization call: features that help catch fake/flaky/shallow tests beat features that polish parts the user already trusts. Without this lens, the product drifts into being yet another runner | Generic "test productivity" framing (too broad — produces no priorities); "AI test generator" framing (wrong direction — would create the problem the product solves); "coverage tool" framing (insufficient — 100% green still hides 60% useless) |
| 12 | 2026-05-16 | Information layer only — never mutate source | Test Inspector identifies, names, and suggests. It NEVER deletes, edits, creates, or rewrites the user's source/test/config files. The user applies fixes manually; the tool rescans and re-evaluates afterwards | Stated explicitly by Danil during detective-redesign planning. Preserves trust (a false-positive verdict that auto-deletes a real test is catastrophic), keeps blast radius zero, matches architecture.md cross-component invariant #4 ("Never mutate source"), and removes a class of confirmation-dialog UX that would muddy the detective framing | Move-to-trash on a "delete" verdict (still mutation, still risky); auto-fix on rewrite suggestions (user must approve every edit — too noisy); generate test-stub neighbors on "missing" verdicts (creates files the user didn't ask for) |
| 13 | 2026-05-16 | LLM as ambient co-worker, not per-card enrichment | When configured, the LLM appears as a persistent "Reviewer notes" panel inside the Case File — it watches the whole bundle, detects cross-card patterns, comments on trends between scans, and hosts an "Ask the reviewer" chat scoped to the case file. It does NOT enrich individual cards | Stated explicitly by Danil during detective-redesign planning. The deterministic synthesis is strong enough alone for the per-card verdict; the LLM does work the deterministic layer can't — cross-case pattern detection ("3 KILL cards share the same anti-pattern"), trend commentary, and freeform Q&A. Preserves the local-first invariant; case file is fully functional without a key | Per-card "Explain ↓" enrichment (treats LLM as polish on the same content — duplicative); LLM-first synthesis (rejected — D#3 says LLM is strictly additive); LLM as a separate Activity Bar entry (orphans it from the case file context it's meant to observe) |

---

## Deferred decisions

_Explicit non-decisions. Each has a trigger for when to revisit._

| # | Date | Topic | Current non-decision | Trigger to revisit |
|---|---|---|---|---|
| 1 | 2026-05-16 | Bundler | Stay on raw `tsc` → `out/` for development | Before first VS Code Marketplace publish (size + cold start matter) |
| 2 | 2026-05-16 | Vue.js adapter | Not built yet — user's stack lists Vue but adapter is absent | When the user starts dogfooding on a Vue project, or when a community PR offers it |
| 3 | 2026-05-16 | AST parser stack | Heuristic regex parsing for now | Phase 4 (weak-test detection) — pick TypeScript Compiler API for JS/TS, `ast` module for Python, `analyzer` package for Dart |
| 4 | 2026-05-16 | Telemetry | None today | Before Marketplace publish — decide opt-in usage telemetry or none-ever |
| 5 | 2026-05-16 | Linter / formatter | None configured | Before opening to outside contributors |
| 6 | 2026-05-16 | CI pipeline | None today | Before public Marketplace release — GitHub Actions running `npm test` on PRs |
| 7 | 2026-05-16 | Persistence layer | No caching/snapshot today; everything recomputes per scan | Phase 11 (history & trends); content-hash keyed cache under `.test-inspector/` |
| 8 | 2026-05-16 | License | Not chosen yet — OSS but `LICENSE` file missing | Before pushing publicly with external contributors — pick MIT or Apache-2.0 |

---

## How to add a decision

1. Use the highest unused `#`.
2. Fill date, status, topic, decision, why, rejected alternatives.
3. If this supersedes a prior decision, reference it: "Supersedes #N".
4. If it's deferred, include a trigger condition.
5. Commit with message: `Record decision #N: <topic>`.
