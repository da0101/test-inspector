---
stream_id: stream-<stream-slug>
slug: <stream-slug>
type: feature
status: planning
agent_owner: claude-code
domain_slugs: [<domain-slug>]
repo_ids: [repo-primary]
base_branch: develop
git_branch: feature/<stream-slug>
created_at: YYYY-MM-DD
updated_at: YYYY-MM-DD
closure_approved: false
---

# <stream-slug>

_Metadata rules: `stream_id` must be `stream-<slug>`, `slug` must match the filename, `status` must match `work/ACTIVE.md`, and `updated_at` should change whenever ownership or state changes._

## Scope
- _TODO: 3–5 bullets describing what's in scope_
- _TODO: be explicit about what's OUT of scope too_

## Done criteria
- [ ] _TODO: measurable acceptance criterion_
- [ ] _TODO: tests pass (specify which suite)_
- [ ] _TODO: manual verification step_
- [ ] `.platform/memory/log.md` appended
- [ ] `decisions.md` updated if any architectural choices were made

## Key decisions
_Append-only. Format: `YYYY-MM-DD — <decision> — <rationale>`_

## Worktree / Local environment

| Repo | Worktree path | Branch | Base | Dependencies | Local command | Localhost port(s) |
|---|---|---|---|---|---|---|
| _TODO_ | _TODO_ | `feature/<stream-slug>` | `develop` | _TODO: installed / blocker_ | _TODO_ | _TODO_ |

## Resume state
_Overwritten by `ab checkpoint` — the compact payload the next agent reads first. Keep this block under ~10 lines._

- **Last updated:** — by —
- **What just happened:** _not set_
- **Current focus:** _not set_
- **Next action:** _not set_
- **Blockers:** none

## Progress log
_Append-only. `ab checkpoint` prepends a dated line and auto-trims to the last 10 entries. Format: `YYYY-MM-DD HH:MM — <what happened>`._

## Open questions
_Things blocked on user input. Remove when resolved._

---

## 🔍 Audit Report

> **Required:** After every audit request, paste the full standardized report here.
> Do NOT leave the audit only in chat — it must be anchored here so the next session has it.
> Format: `.platform/workflow.md` → Stream / Feature Analysis Protocol → Step 4 template.
> After a clean re-audit (all 🟢), remove this section before stream closure.

_Status: not yet run_
