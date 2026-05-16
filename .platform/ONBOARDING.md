# Onboarding — New Agent or Human

> **Audience:** a new Claude / Codex / Gemini session, or a new developer joining the project.
> **Goal:** be productive in 5 minutes without asking the founder to re-explain the project.
> **How to use:** read sections in order. Stop reading deeper files until your current task makes them relevant.

---

## Step 1 — Orient (2 minutes)

Read, in this exact order:

1. **`CLAUDE.md`** (or `AGENTS.md` / `GEMINI.md`) at the project root
   — What this project is, the constraints, the workflow.
2. **`.platform/STATUS.md`** — where are we right now
   — Per-layer status files (if present) hang off this index. Read the layer relevant to your task.
3. **`.platform/ONBOARDING.md`** — you are here.

After step 1 you know: what's shipped, what's in flight, what's blocked, what's forbidden.

## Step 2 — Understand the workflow (1 minute)

Read:

- **`.platform/workflow.md`** — the 6-stage inline workflow (Triage → Interview → Research → Propose → Execute → Verify + Learn)

Key rules:
- No `.md` artifacts unless reusable. Plans live in chat.
- Trivial tasks skip straight to execution.
- Parallelize subagents when they have distinct jobs.
- Every success appends one line to `.platform/memory/log.md`.

## Step 3 — Read the conventions for your area (as needed)

These are the cross-cutting rules. Read only the ones that touch your task.

| If you touch... | Read |
|---|---|
| Any HTTP / API endpoint | `conventions/api.md` |
| Anything security-sensitive | `conventions/security.md` |
| Any test or test infra | `conventions/testing.md` |
| Any deploy / infra change | `conventions/deployment.md` |
| Any release gate / QA pass | `conventions/qa.md` |
| Any product scope decision | `conventions/pm.md` |
| Auth, roles, permissions | `conventions/permissions.md` |
| Stack-specific (Django / React / C++ / iOS / Android / Unity / …) | `conventions/{stack}.md` |

**Rule of thumb:** if you touch 3+ files in a feature, read at least 2 conventions docs.

## Step 4 — Load the deep per-repo reference (only if needed)

These are **big files**. Read only when your task is deep enough to need them.

| Thing | File |
|---|---|
| System overview | `architecture.md` |
| Decision history | `decisions.md` |
| Session history | `log.md` |
| Per-repo deep reference | `{repo-slug}.md` (if multi-repo) |
| Deferred issues / tech debt | `BACKLOG.md` — **do not load at session start**; read only when user asks or you are appending a new entry |
| Bug post-mortems / hard-won patterns | `learnings.md` — **do not load at session start**; grep before diagnosing non-obvious bugs; append in Stage 6 when root cause was non-obvious |

## Step 5 — Execute

Follow the 6-stage workflow from `workflow.md`. Cheat sheet:

```
Task → Triage (type/scope/risk) → Interview (only if ambiguous) → Research (only if medium+)
     → Propose inline → Execute → Verify + Learn (append to log.md)
```

## Step 6 — Close out

If the stream is fully complete, run the **Stream Closure Protocol** from `workflow.md` (8 steps). Short version:

1. Tick all done criteria in the stream file
2. Update STATUS files for every repo touched
3. Update domain file + architecture.md if topology changed
4. Unblock downstream streams in `ACTIVE.md`
5. Archive stream file, reset `BRIEF.md`
6. Append to `log.md`, check `learnings.md`

If the session is ending but the stream is NOT complete:
- Append a progress note to the stream file (`## Current state` section)
- Ensure `ACTIVE.md` row is accurate
- Append to `log.md` with what was done and what's next

---

## What NOT to do on your first session

1. Do not rewrite established architectural contracts without reading `decisions.md` first.
2. Do not deploy anything without reading `conventions/deployment.md`.
3. Do not commit `.env`, credentials, or any secret file.
4. Do not create `.md` artifacts for plans. Plans live in chat.
5. Do not bureaucratize small tasks. Trivial tasks go straight to execution.
6. Do not assume a widget / sub-app / module is "small" — always read its deep reference if one exists.

---

Welcome. Now close this file and get to work.
