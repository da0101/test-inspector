# Gotchas

_Landmines found in this codebase. Each line = one thing a fresh agent should know before touching the related area. Appended automatically during `ab close <slug>` harvest._

**Severity tiers** (use the emoji prefix):
- 🔴 **never-forget** — breaks prod, loses data, or wastes hours. Always surfaced in `ab brief`.
- 🟡 **usually-matters** — trips up most new work in the area. Surfaced when relevant domains are active.
- 🟢 **minor** — worth mentioning, not worth interrupting flow.

Format: `🔴 [domain or file] — one-line gotcha (incident date if applicable)`

---

## Entries

<!-- agentboard:gotchas:begin -->
<!-- New entries go below, newest first. Keep entries to one line each. -->
🟡 [workspace-scope/reports] — Centralized-host report exports must default to the selected worktree, not the Test Inspector repo that happens to host the extension window (2026-05-17).
🟡 [coverage/lcov] — Node's compiled TypeScript LCOV includes CommonJS helper boilerplate under `out/src`; ignore generated helper lines/functions or the analyzer creates false Weak cards (2026-05-17).
<!-- agentboard:gotchas:end -->
