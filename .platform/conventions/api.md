# API conventions — test-inspector

Last updated: 2026-05-16

> "API" here means two things: (1) the **command surface** the extension exposes to VS Code (and therefore to users / keybindings / tasks), and (2) the **outbound HTTP API** the extension consumes (the optional OpenAI-compatible LLM).

---

## 1. Extension command surface

The contract is `package.json` `contributes.commands` + `activationEvents`. Every command appears in BOTH lists, and every command is registered in `extension.ts` via `vscode.commands.registerCommand`.

### Naming

- All commands use the `testInspector.` prefix (camelCase verb).
- The user-visible `title` is `Test Inspector: <Action In Title Case>`.
- The `category` is implicit in the prefix — no separate `category` field.

### Adding a command

A new command requires four edits in the same PR:

1. `package.json` → `contributes.commands` — entry with `command`, `title`, optional `icon`.
2. `package.json` → `activationEvents` — `onCommand:testInspector.<name>`.
3. `package.json` → `contributes.menus` if it should appear in a view title bar or context menu.
4. `src/extension.ts` — `context.subscriptions.push(vscode.commands.registerCommand('testInspector.<name>', handler))`.

Omitting any of those is a bug; the test for it is "the command shows up in the Command Palette" (manual QA).

### Removing a command

Pre-1.0 (today): just remove. Post-1.0: keep a backwards-compatible stub for one minor version that logs a deprecation notice and forwards to the new name, then remove.

### Settings

- All extension settings live under `testInspector.*`.
- Numeric settings have explicit minimums where 0 is invalid (e.g. `maxWorkspaceFiles` should not be 0).
- String settings backed by a URL go through validation (see `conventions/security.md` — `testInspector.llm.baseUrl`).
- Adding a setting requires the same package.json edit + a description that says what units / range — and an entry in this file if it changes behavior at a system level.

### Webview message protocol

The Dashboard webview communicates with the extension host via `postMessage` (`acquireVsCodeApi()` in the webview, `onDidReceiveMessage` in the host).

- Every message has a `type` (string-literal kind) and a typed payload.
- Both ends share the type union from a single TypeScript file (`src/views/dashboard-messages.ts` — to be created when the dashboard split happens).
- Unknown `type` values are logged and ignored — never thrown.
- The message bus is one-way for navigation actions and bidirectional only for refresh/state-sync flows.

## 2. Outbound HTTP — OpenAI-compatible LLM

### Endpoint contract

- Method: `POST {baseUrl}/chat/completions`
- Auth header: `Authorization: Bearer <key from SecretStorage>`
- Request body: OpenAI chat-completions schema (`model`, `messages`, `temperature?`, `response_format?`).
- Default base URL: `https://api.openai.com/v1`. User-configurable via `testInspector.llm.baseUrl`.
- Default model: `gpt-4.1-mini`. User-configurable via `testInspector.llm.model`.

### Hard rules

- The base URL MUST validate as https (or http for `localhost` / `127.0.0.1` only).
- Every call uses an `AbortController` with a default 60s timeout.
- Every call is retried at most twice on transient errors (429 / 5xx) with exponential backoff. Other errors do not retry.
- Every call goes through the OutputChannel with a redacted log line (URL + model, never headers or body).
- A failed call NEVER bubbles to the UI as an error toast. It degrades to "LLM unavailable; deterministic report only" with the OutputChannel as the diagnostic surface.

### Structured output

The Phase-7 prompt builder will request structured JSON via `response_format: { type: 'json_object' }` where the model supports it, with a Markdown fallback for models that don't. The structured shape is:

```ts
type LlmInvestigationEnrichment = {
  coveredBehaviors: string[]
  missingBehaviors: string[]
  weakAssertions: { test: string; reason: string }[]
  edgeCases: string[]
  suggestedTests: string[]
  riskSeverity: 'low' | 'medium' | 'high'
}
```

Adding fields is non-breaking. Renaming or removing fields is breaking — bump the response handler.

### Caching

- Phase 7 will key the cache by `sha256(sourceContent + testContent + promptTemplate + model)`.
- Cache lives under the extension's `globalStorageUri`, NOT in the workspace.
- Stale entries are evicted by content-hash divergence, not by TTL.

## 3. Versioning

- The extension itself uses SemVer. `package.json` `version` is the source of truth.
- Command names are part of the public surface — breaking a command name is a major version bump.
- Setting keys are part of the public surface — same rule.
- The webview message protocol is internal — not bound to SemVer.
