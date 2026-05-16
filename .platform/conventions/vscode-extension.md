# VS Code extension conventions — test-inspector

Last updated: 2026-05-16

> Rules for using the VS Code Extension API in this codebase. Reflects what the existing code does and locks in patterns to keep new code consistent.

---

## Activation

- Activation events live in `package.json` → `activationEvents`. Every entry points at a real view ID (`onView:testInspector.<view>`) or command (`onCommand:testInspector.<name>`).
- Avoid `onStartupFinished` — it activates on every workspace open, defeats lazy loading, and hurts cold-start. Stick to view + command activation.
- The entry function is `activate(context: vscode.ExtensionContext)` in `src/extension.ts`. Register everything into `context.subscriptions` so it disposes cleanly on deactivate.

## Views

| Surface | Implementation | Notes |
|---|---|---|
| Activity Bar container | `package.json` `contributes.viewsContainers.activitybar` (`id: testInspector`) | Icon: `media/test-inspector.svg`. PNG variant required before Marketplace publish. |
| Tree views (Projects / Tests / Coverage / Quality / Changed Files) | `vscode.TreeDataProvider<T>` | One provider per view, in `src/views/*View.ts`. |
| Webview Dashboard | `vscode.window.createWebviewPanel` | Single panel; re-use the existing one rather than spawning duplicates. |
| Webview Investigation drilldown | Created on demand from Dashboard / commands | Lives in `src/views/investigationView.ts` and `featureInvestigationView.ts`. |

### TreeDataProvider checklist for new views

- Implements `getTreeItem` and `getChildren`.
- Fires `onDidChangeTreeData` after every refresh; do NOT mutate the tree silently.
- Stable `id` per `TreeItem` so VS Code preserves expansion state.
- Empty state goes via `contributes.viewsWelcome` (already used for `testInspector.projects` and `testInspector.tests`).

### Webview rules

- One webview = one HTML string assembled in TypeScript.
- Use `vscode.Uri.joinPath(context.extensionUri, 'media', '…')` for any local asset reference, then `webview.asWebviewUri(...)`.
- Strict CSP — see `conventions/security.md`. No inline scripts, no inline event handlers, no remote URLs.
- Escape every interpolated value through a single helper (`escapeHtml`).
- All navigation is `command:` URIs — webview opens VS Code commands, never `vscode.open` with an http URL.
- Persist transient UI state (selected project / feature filter, dismissed notices) via `services/state.ts`, not in the webview's local storage.

## Commands

- Every command is in `package.json` `contributes.commands` AND `activationEvents` AND registered in `extension.ts`. See `conventions/api.md` for the four-place rule.
- Handlers are pure orchestrators — wire services and surface a `vscode.window.showWarningMessage`/`showErrorMessage` for user-visible errors. Don't put business logic in the handler.
- Long-running command handlers wrap their work in `vscode.window.withProgress({ location: vscode.ProgressLocation.Notification, … })` so the user sees activity.
- Cancellable command handlers receive the `progress` and `token` from `withProgress` and propagate `token` into the service call.

## Configuration

- All keys are under `testInspector.*` (see `conventions/api.md`).
- Read via `vscode.workspace.getConfiguration('testInspector')` at the moment the value is needed, not at module init — workspace can switch configs mid-session.
- Listen for `onDidChangeConfiguration` only if a value changes derived state (e.g., `slowTestThresholdMs` affecting an in-memory finding cache).

## SecretStorage

- `services/llm.ts` is the ONLY consumer of `context.secrets`.
- Keys read on demand. Don't cache in module-level state — the user can revoke between calls.
- Storage key: `testInspector.llm.apiKey` (one key for the active provider).

## OutputChannel and StatusBar

- One OutputChannel: `Test Inspector` (`vscode.window.createOutputChannel('Test Inspector')`).
- Every spawned subprocess writes a "command + argv list" line to it.
- StatusBar progress: one StatusBarItem created lazily on first long-running command; updated, never recreated.

## Workspace trust

- Read `vscode.workspace.isTrusted` at the top of any spawn-bearing command handler.
- If untrusted: show a friendly notice + open the trust UI; do not spawn.
- Read-only views (Projects / Tests / Coverage parsing / Quality / Risk / Changed Files / Reports) populate normally in untrusted workspaces.

## URI handling

- Always use `vscode.Uri` to construct paths that VS Code consumes (`workspace.fs`, `commands.executeCommand('vscode.open', uri)`).
- Convert to / from filesystem paths via `Uri.file(...)` and `uri.fsPath`.
- Workspace-relative display uses `vscode.workspace.asRelativePath` — keep displayed paths short.

## Test Controller

- The VS Code Testing API integration lives in `services/testController.ts`. New stack-specific result parsers (Phase 9) feed it.
- Tests discovered by the adapter populate the Test Controller items. Runs invoked from the Test Explorer route back through `services/runner.ts` so the safety + logging rules are identical to runs invoked from our own commands.

## Don't reinvent VS Code

- Use `vscode.workspace.findFiles` for glob searches when the budget allows; fall back to `utils/fs.ts` walker only when you need fine-grained control or to enforce `maxWorkspaceFiles`.
- Use `vscode.window.showSaveDialog` / `showOpenDialog` for any file path the user picks. Don't roll your own.
- Use `vscode.window.showInformationMessage` / `showWarningMessage` / `showErrorMessage` for notifications — don't write text into the OutputChannel and expect the user to look at it.
