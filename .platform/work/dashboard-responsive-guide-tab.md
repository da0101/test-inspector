---
stream_id: stream-dashboard-responsive-guide-tab
slug: dashboard-responsive-guide-tab
type: bugfix
status: in-progress
agent_owner: claude-code
domain_slugs: [dashboard]
repo_ids: [repo-primary]
base_branch: main
git_branch: bugfix/dashboard-responsive-guide-tab
created_at: 2026-05-18
updated_at: 2026-05-18
closure_approved: false
---

# dashboard-responsive-guide-tab

## Scope
- Fix Case File dashboard responsiveness: layout breaks when the VS Code panel is narrowed
- Move Metric guide out of the sticky hero header and into a dedicated "Guide" tab
- Fix scroll behaviour: the entire page should scroll, not just the test list
- Add tighter responsive breakpoints for the runtime strip, KPI strip, and hero padding at narrow widths
- OUT OF SCOPE: changes to scoring, adapters, or any non-dashboard feature

## Done criteria
- [ ] Narrowing the Case File panel no longer breaks/overflows the header
- [ ] Metric guide is accessible via a "Guide" tab, not a `<details>` inside the sticky hero
- [ ] Clicking Guide tab hides main cases + KPI strip; clicking any other tab restores them
- [ ] Guide tab state is persisted in VS Code webview state and restored on re-render
- [ ] The whole page scrolls normally; sticky header is as compact as possible
- [ ] All responsive breakpoints tested at ≈800px, ≈560px, ≈400px panel widths
- [ ] `.platform/memory/log.md` appended
- [ ] `decisions.md` updated if any architectural choices were made

## Key decisions
_Append-only. Format: `YYYY-MM-DD — <decision> — <rationale>`_
2026-05-18 — Move metric guide to a Guide tab (not a modal/tooltip) — matches the existing tab pattern; zero new UI primitives needed; keeps the header shorter

## Worktree / Local environment

| Repo | Worktree path | Branch | Base | Dependencies | Local command | Localhost port(s) |
|---|---|---|---|---|---|---|
| test-inspector | /Users/danilulmashev/Documents/GitHub/test-inspector | bugfix/dashboard-responsive-guide-tab | main | npm ci (run before compile) | F5 in VS Code (Extension Host) | n/a |

## Resume state
- **Last updated:** 2026-05-18 by claude-code
- **What just happened:** All planned work shipped and installed
- **Current focus:** n/a — awaiting user verification
- **Next action:** User to declare stream complete
- **Blockers:** none

## Progress log
2026-05-18 — Stream created; user reported three issues from screenshots: responsiveness, metric guide in header, scroll behaviour

## Open questions
_None_
