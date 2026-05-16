---
domain_id: dom-dashboard
slug: dashboard
status: active
repo_ids: [test-inspector]
related_domain_slugs: [risk-scoring, coverage, quality, investigation, changed-files]
created_at: 2026-05-16
updated_at: 2026-05-16
---

# dashboard

## What this domain does

The Dashboard is a VS Code Webview that aggregates everything — KPIs, coverage bar, project inventory, risk table, changed-file risk, quality findings, investigation priorities, and a plain-English health brief — into a single editor-tab UI. It is the marketing surface AND the daily work surface: open it once, see what to fix.

## Backend / source of truth

- **Webview implementation:** `src/views/dashboard.ts` — single file, ~38 KB, hosts HTML/CSS/JS string templates + render logic. This file is on the file-size violations list and MUST be split before being added to.
- **State:** `src/services/state.ts` — last-scan results, filters (project / feature), dismissed notices.
- **Setup diagnostics:** `src/services/setup.ts` — surfaces missing coverage script / missing dependencies / unreadable coverage as error-panel content.
- **Filter scoping:** monorepo support — features and projects scope each other so the same feature name in two projects does not collide.

## Frontend / clients

- The Dashboard webview is the single rendering target. Tree views (Projects / Tests / Coverage / Quality / Changed Files) are sidebar entry points that round-trip through commands; the Dashboard is where the synthesized picture lives.
- Commands: `openDashboard`, `refreshAll`, `analyzeTopRisk`, `selectProject`, `clearProjectFilter`, `selectFeature`, `clearFeatureFilter`, `clearNotices`.

## API contract locked

- Webview message protocol (postMessage) — DO NOT add fields silently; every message kind has a matching handler. New message kinds need both ends updated in one PR.
- All hyperlinks in the rendered HTML resolve via `command:` URIs (e.g. `command:testInspector.openFile?…`) — they MUST NOT navigate to external URLs.
- Generated HTML MUST escape every user-controlled value (file paths, test names, finding messages) — XSS-safe by construction. This is enforced by a single template helper; new code paths must use it.
- The webview's Content Security Policy MUST allow only the extension's local script and style — no inline event handlers, no remote fonts.
- The empty state for each panel ("no projects yet", "no coverage data", "no findings") is part of the contract — fix the empty state when you add a new panel, don't ship a blank space.

## Key files

- `src/views/dashboard.ts` (oversized — split target)
- `src/services/state.ts`
- `src/services/setup.ts`
- `src/views/items.ts` (for sidebar tree items shared between dashboard and views)
- `media/test-inspector.svg` (icon; Marketplace will need PNG + screenshots)

## Decisions locked

- The Dashboard is a Webview, not a TreeView, because the product needs charts, KPI cards, filter controls, and rich drilldowns — none of which fit a tree.
- HTML is generated in TypeScript template strings today. Migrating to a UI framework (Preact/Svelte) is deferred until file-size pain forces the move.
- All cross-cutting actions (refresh, analyze top risk, open dashboard) live in the dashboard's title-bar group AND the sidebar view title bar — same command, two entry points.
- File-size violation #2: `dashboard.ts` MUST be split (template / KPI / risk-table / setup-error-panel) before its next feature add. Tracked in STATUS.md.
- Severity colors and badges come from a single palette — adding a new severity = update the palette + every consumer, not a one-off inline color.
- "Last scan completed at" + "coverage source file shown" are Phase-1 stabilization deliverables; the dashboard must surface them once Phase 1 lands.
