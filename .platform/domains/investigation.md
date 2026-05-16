---
domain_id: dom-investigation
slug: investigation
status: active
repo_ids: [test-inspector]
related_domain_slugs: [risk-scoring, coverage, quality, llm]
created_at: 2026-05-16
updated_at: 2026-05-16
---

# investigation

## What this domain does

Take one risky source file (or one feature area) and produce a focused drilldown: source summary, related tests, coverage gaps, weak-test findings, and a recommended-tests list. This is the "Analyze" button on a dashboard row. The drilldown is deterministic by default; if the user has configured an LLM, the same report is enriched with senior-reviewer-grade commentary.

## Backend / source of truth

- **Deterministic investigator:** `src/services/investigator.ts` — assembles the drilldown from already-computed risk + coverage + quality + related-tests data. NEVER recomputes the underlying signals — it composes them.
- **Feature-level investigator:** `src/services/featureInvestigator.ts` — same shape, scoped to a feature area (route/module group from `services/features.ts`).
- **Report rendering:** `src/services/investigationReport.ts` — produces the Markdown export consumed by `Export Latest Investigation` / `Export Latest Feature Investigation`.
- **LLM bridge:** `src/services/llm.ts` — interface called only when LLM is configured AND the user has acknowledged the privacy confirmation. Failure modes (no key, no network, rate limit) MUST degrade silently to the deterministic report.

## Frontend / clients

- `src/views/investigationView.ts` — per-file drilldown webview.
- `src/views/featureInvestigationView.ts` — per-feature drilldown webview.
- `src/views/dashboard.ts` — clickable "Analyze" buttons on each risk row + investigation priorities panel.
- Commands: `analyzeTopRisk`, `analyzeCurrentFile`, `analyzeFile`, `analyzeFeature`, `exportInvestigation`, `exportFeatureInvestigation`.

## API contract locked

- `InvestigationReport`: `{ targetPath, summary, coverageSummary?, relatedTests[], findings[], recommendations[], llmEnrichment? }`.
- `llmEnrichment` is optional and additive. Consumers MUST render the report correctly when it's absent.
- `recommendations` are concrete next-test suggestions in plain English. Each item is one suggestion, no nested structure.
- The deterministic path MUST produce the same `InvestigationReport` shape as the LLM-enriched path — only `llmEnrichment` differs. This is what makes "LLM optional" actually work.
- The Markdown exporter MUST be lossless: every field the dashboard shows must appear in the exported `.md` so the user can PR-ready the report.

## Key files

- `src/services/investigator.ts`
- `src/services/featureInvestigator.ts`
- `src/services/investigationReport.ts`
- `src/services/llm.ts`
- `src/views/investigationView.ts`
- `src/views/featureInvestigationView.ts`
- `src/models.ts` (`InvestigationReport` and friends)

## Decisions locked

- The drilldown is deterministic by default — LLM enrichment is opt-in and reversible. Users without an API key see a complete, useful report.
- The investigator composes existing signals; it does not own a parser or a scorer. If a signal is wrong, fix it in its home domain (risk-scoring / quality / coverage), not here.
- Privacy: before any LLM call, the user must confirm a one-time dialog listing exactly which file contents will leave their machine. This dialog text is reviewed against `conventions/security.md`.
- Failure of the LLM path is silent in the report and visible in the OutputChannel — never blocks the deterministic content.
- "Recommended tests" are Markdown-safe strings — the export format is the constraint, not the dashboard styling.
