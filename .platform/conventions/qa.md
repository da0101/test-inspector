# QA conventions — test-inspector

Last updated: 2026-05-16

> The extension has a real UI (Activity Bar + sidebar tree views + Dashboard webview + Investigation drilldowns). Every UI-affecting change needs a manual QA pass in the Extension Development Host. Unit tests cannot verify webview rendering, command surfacing, or activation event behavior.

---

## Required QA before merge

Every PR that changes the contributes block, a TreeDataProvider, a Webview HTML, a command handler, or settings MUST include a `## 🧪 Manual QA Plan` section in the PR description and the verification must be performed in the Extension Development Host.

## How to run the Extension Development Host

1. Open the repo in VS Code.
2. Press `F5` (`Run > Start Debugging`). VS Code launches a second window with the extension loaded.
3. Open one of the fixture workspaces under `test/fixtures/<stack>/` in the new window — or a real project of the relevant stack.
4. Click the Test Inspector icon in the Activity Bar.

## Golden-path QA matrix (run on a real React monorepo if possible)

Standard happy-path verification for any UI-touching change:

- [ ] Activity Bar icon present, opens the Test Inspector container
- [ ] **Projects** view lists at least one project per stack present in the workspace
- [ ] **Tests** view shows files + cases; status defaults to "unknown"
- [ ] **Coverage** view shows a bar; clicking a project drills in
- [ ] **Quality** view shows findings grouped by severity
- [ ] **Changed Files** view reflects the current Git diff
- [ ] **Dashboard** opens via title-bar action and the sidebar action — both routes work
- [ ] Dashboard KPIs render numerically (no `undefined`, no `NaN`)
- [ ] Coverage bar fills proportionally
- [ ] Risk table sortable + clickable
- [ ] Clicking a row's `Analyze` opens the Investigation drilldown
- [ ] `Export Test Report` produces a valid `.md` file at the chosen path
- [ ] `Export Latest Investigation` produces a valid `.md`
- [ ] No errors in the `Test Inspector` OutputChannel
- [ ] No errors in the **Help → Toggle Developer Tools → Console** for the webview

## Edge cases to verify on every dashboard-touching change

- [ ] Empty workspace (no projects) — friendly empty state, not a blank panel
- [ ] Workspace with one project — filters still work
- [ ] Monorepo with two projects sharing a feature name — features stay scoped per project
- [ ] Workspace with coverage script but no coverage file — setup blocker is visible
- [ ] Workspace with no Git — Changed Files panel shows friendly empty state
- [ ] Untrusted workspace — run commands refuse with a notice; read-only views still populate

## LLM-flow QA (when touching `services/llm.ts` or `configureLlm`)

- [ ] `Configure LLM` wizard runs end-to-end on a real provider
- [ ] API key persists across reload of the EDH window (SecretStorage)
- [ ] Privacy confirmation appears before the first call; "remember" persists per workspace
- [ ] OutputChannel shows the request URL but NO Authorization header content (grep for `Bearer`)
- [ ] Disconnecting the network mid-call falls back to the deterministic report; no UI freeze
- [ ] Setting `baseUrl` to a non-https value (other than localhost) shows a setup error and refuses to call

## Command surface QA

- [ ] Every command in `package.json` `contributes.commands` is invocable via the Command Palette
- [ ] Every activation event in `package.json` `activationEvents` actually wakes the extension
- [ ] Tooltips / titles match the casing used in the docs (`Test Inspector: <Title Case>`)

## Accessibility (Webview)

- [ ] Tab order through Dashboard controls is logical
- [ ] Focus rings are visible on interactive elements
- [ ] Severity badges have text labels in addition to color
- [ ] Color contrast meets WCAG AA for normal text (verify with the browser inspector's accessibility tab)

## What to capture as evidence

Attach the following to the PR description:

- Screenshot of the Dashboard on a fixture workspace, before and after the change
- For LLM changes: redacted OutputChannel snippet showing the request was made
- For Phase-9 runner changes: terminal capture showing the spawned argv list
- A one-liner of the QA environment (VS Code version, OS, fixture used)

## Definition of "QA passed"

- The golden-path matrix has zero failures in the relevant rows.
- All edge cases relevant to the change have been verified.
- No regressions in the unchanged surfaces (do a sanity sweep, not a full re-run).
- Evidence captured in the PR.
