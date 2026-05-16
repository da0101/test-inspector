# Active Work — test-inspector

> Read this at the start of every session BEFORE doing anything else.
> One row per active workstream. Load `work/<slug>.md` only if you need full context.

| Stream | Type | Status | Agent | Last updated |
|---|---|---|---|---|
| [detective-redesign](archive/detective-redesign.md) | feature | closed | claude-code | 2026-05-16 |

---

## Session start protocol

0. **Read `work/BRIEF.md` first** — 30-second narrative: what feature we're building, why, current state
1. If 1 stream → confirm with user: "Resuming **<stream>** — next action: <next>. Continue?"
2. If 2+ streams → ask user which one to work on
3. If 0 streams → proceed normally, ask what to work on
4. Load `work/<slug>.md` only if the user asks for detail or task is ambiguous

## Workstream lifecycle

| Status | Meaning | Who sets it |
|---|---|---|
| `planning` | Scoping, not yet executing | Agent |
| `in-progress` | Actively working | Agent |
| `blocked` | Waiting on external input or decision | Agent or user |
| `awaiting-verification` | Work done, needs user confirm | Agent only |
| `closed` | Archived — row kept for history | `ab close` |

**Done ritual** (when all done criteria met):
1. Agent flips status to `awaiting-verification`
2. Agent lists done criteria with ✅/❌ per item
3. User confirms: "yes this is done"
4. Agent moves `work/<slug>.md` → `work/archive/<slug>.md`
5. `ab close --confirm` updates row status to `closed` (row remains for history)
6. Agent appends one line to `.platform/memory/log.md`
7. Agent updates `memory/` if anything learned should persist
