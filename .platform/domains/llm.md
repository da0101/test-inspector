---
domain_id: dom-llm
slug: llm
status: active
repo_ids: [test-inspector]
related_domain_slugs: [investigation]
created_at: 2026-05-16
updated_at: 2026-05-16
---

# llm

## What this domain does

Provide an optional "senior reviewer" enrichment layer that takes a source/test pair (or a feature aggregate) and returns structured suggestions: covered behaviors, missing behaviors, weak assertions, edge cases, suggested tests, risk severity. The provider interface is OpenAI-compatible Chat Completions so any compatible endpoint — OpenAI, Azure OpenAI, OpenRouter, local Ollama proxies — works without code changes.

## Backend / source of truth

- **Provider interface:** `src/services/llm.ts` — abstract surface. Currently one OpenAI-compatible implementation; pluggable for future providers.
- **Settings:** `testInspector.llm.baseUrl` (default `https://api.openai.com/v1`), `testInspector.llm.model` (default `gpt-4.1-mini`). API key lives in VS Code SecretStorage only.
- **Configure command:** `testInspector.configureLlm` — wizard for provider + key + model + connection test.
- **Privacy confirmation:** before any outbound call, the user sees a one-time dialog listing the file contents about to leave the machine. The choice is remembered per-workspace until the user revokes it.
- **Planned (Phase 7):** prompt builder with token budgeting, content chunking, response caching by file hash, retry + rate-limit handling, structured JSON output mode with Markdown fallback.

## Frontend / clients

- `src/services/investigator.ts` — the single consumer today.
- `src/views/investigationView.ts` and `featureInvestigationView.ts` — render `llmEnrichment` when present.

## API contract locked

- `LlmProvider` interface: `{ id, isConfigured(), summarizeFindings(report), suggestMissingTests(context) }` (subject to growth; existing signatures don't break).
- Every method returns a typed shape — no free-form strings as primary output (the prompt builder MUST request structured JSON; Markdown is a fallback).
- Calls MUST be timeboxed and abortable so a dead provider can never hang the extension UI.
- Errors NEVER throw to the UI — they degrade to "LLM unavailable; showing deterministic report" with a one-line OutputChannel entry. The deterministic report is always intact.
- The API key MUST never appear in OutputChannel logs, exported reports, or telemetry of any kind (telemetry is currently none — open decision #4).

## Key files

- `src/services/llm.ts`
- `src/services/investigator.ts` (consumer + privacy gate)
- `src/views/investigationView.ts` (renderer)
- `package.json` configuration block (`testInspector.llm.*`)

## Decisions locked

- OpenAI-compatible Chat Completions, configurable base URL (D#5). No vendor SDK is bundled.
- API key in VS Code SecretStorage only (D#6). Reads happen on demand; the key is never cached in module-level state.
- LLM is strictly additive (D#3). Every consumer MUST function correctly when `isConfigured()` returns false.
- Per-workspace privacy confirmation is required before the first call. Revocable.
- Per-file response caching (Phase 7) keys by content hash of source + tests + prompt template — changing any input invalidates.
- Costs are user-visible: the model + endpoint live in settings, and the configure wizard shows a one-line cost reminder.
- No telemetry on LLM usage until open decision #4 is resolved.
