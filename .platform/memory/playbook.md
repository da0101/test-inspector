# Playbook

_How work actually gets done in this project. Shortcuts, commands, dev rituals that a 20-year employee would know. Appended during `ab close <slug>` harvest._

Format: `- **[area]** — one-line practice (why/when)`

---

## Entries

<!-- agentboard:playbook:begin -->
<!-- New entries go below, newest first. Keep each entry to one line. -->
- **[release-audit]** — Before PR, run `npm test`, `npm run coverage`, regenerate the dogfood deterministic report, check `git diff --check`, and verify generated reports are ignored/untracked.
- **[test-inspector-dogfood]** — Treat dogfood Weak/Missing/Theater cards as investigation prompts: fix real gaps, calibrate false positives only with regression tests, then rerun coverage and the report.
<!-- agentboard:playbook:end -->
