# Security conventions — test-inspector

Last updated: 2026-05-16

> The extension runs subprocesses in the user's workspace and (optionally) talks to an external LLM API. Both surfaces are real attack vectors. This file lists the non-negotiable rules.

---

## Threat model

1. **Workspace-controlled command injection.** File paths, project names, manifest values all come from the user's repository. A maliciously crafted path or `package.json` value MUST NOT be able to execute arbitrary shell commands when the extension exec's a coverage / test command.
2. **API key exfiltration.** A misuse of logging, reports, telemetry, or webview state could leak the user's LLM API key.
3. **Untrusted workspace code execution.** Test runs and coverage commands execute project-controlled code. Running those in an untrusted workspace lets a hostile clone trigger arbitrary code on the developer's machine.
4. **XSS in the Webview dashboard.** Anything rendered into the Dashboard HTML — file paths, test names, finding messages, LLM output — is potentially attacker-controlled. Unescaped output = code execution inside the webview.
5. **SSRF / malicious LLM endpoint.** `testInspector.llm.baseUrl` is user-controlled. A misconfigured value could send code to anywhere on the network.

## Hard rules

### Child processes

- **Never** `child_process.exec`, `execSync`, or `spawn` with `shell: true`.
- **Always** `child_process.execFile` or `spawn` with the argv array form.
- Build argv arrays in the adapter; pass through `services/runner.ts`; never concatenate flags into a single string at any layer.
- Reject any command whose argv array contains characters that look like shell metacharacters in positions where they cannot be argv-safe (defensive even when using `execFile`).
- Long-running or coverage-generating commands MUST prompt for confirmation before spawning.
- Refuse to spawn anything when `vscode.workspace.isTrusted === false`. Show a friendly notice.
- Mirror every spawn to the OutputChannel as `<command> [<arg1>, <arg2>, …]` — a list, not a reconstructed shell string. Logging it as a shell string trains users to copy-paste it into a terminal where the shell-escape rules differ.

### Secrets

- LLM API keys live in VS Code `SecretStorage` only. Never `settings.json`, never `process.env`, never workspace config files.
- Reads happen on demand inside `services/llm.ts`. The key is never assigned to a module-level constant.
- The OutputChannel MUST redact request bodies that include the `Authorization` header. Easiest path: log the URL + arg count, not the body.
- Exports (`services/report.ts`, `services/investigationReport.ts`) MUST defensively redact `Bearer …` strings even though they never enter the render path today.

### LLM endpoint hardening

- Validate `testInspector.llm.baseUrl` on read — require https (or http only for `localhost` / `127.0.0.1`). Anything else: refuse to call, surface a setup error.
- All LLM calls run inside a `Promise.race` with an abortable `AbortController` timeout (default 60s) so a hung endpoint cannot freeze the extension.
- Failure to reach the endpoint is a silent fallback to the deterministic report + a one-line OutputChannel note — NEVER a user-facing crash.

### Webview / Dashboard

- Strict Content Security Policy. No `unsafe-inline`. Scripts and styles served from the extension only.
- All injected values go through a single HTML-escape helper. New panels MUST use it.
- Hyperlinks in the rendered HTML are `command:` URIs (e.g. `command:testInspector.openFile?<encoded-path>`). External URLs are not permitted.
- The webview never receives the API key (it lives only in the extension host). All LLM calls happen in the extension host.

### Workspace trust

- Detection, discovery, coverage parsing, quality analysis, risk scoring, changed-file mapping, and report generation are all read-only and run regardless of trust.
- Anything that spawns a subprocess (run all / run file / run related / generate coverage) refuses to operate in an untrusted workspace.
- The setup wizard for the LLM is allowed in untrusted workspaces (it doesn't touch project code).

### Dependencies

- Audit every new `dependencies` add against the local `npm audit` baseline before merging.
- `devDependencies` are scrutinized too — anything that ships into the published VSIX is a supply-chain surface.
- Pin minor versions in `package.json` (`^` is acceptable; avoid `*` and `latest`).

## Verification checklist for any PR touching exec / secrets / webview

- [ ] No `exec`, `execSync`, or `shell: true` in the diff
- [ ] No new free-form string concatenation into command arguments
- [ ] No API key reads outside `services/llm.ts`
- [ ] No new value rendered into the webview without the HTML-escape helper
- [ ] If LLM-adjacent: the new path returns gracefully when `isConfigured()` is false
- [ ] If exec-adjacent: refuses to spawn in untrusted workspaces
- [ ] OutputChannel redaction holds (manually verified by running a configure flow and grepping the channel for `Bearer`)
