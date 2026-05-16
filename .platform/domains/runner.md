---
domain_id: dom-runner
slug: runner
status: active
repo_ids: [test-inspector]
related_domain_slugs: [adapters, coverage, changed-files]
created_at: 2026-05-16
updated_at: 2026-05-16
---

# runner

## What this domain does

Execute the user's test commands safely and consistently. Wraps `child_process.execFile`/`spawn` with arg arrays (never shell strings), confirms expensive commands, logs every command to the Test Inspector OutputChannel, shows StatusBar progress, and surfaces results back into the dashboard. This is the only domain allowed to spawn long-running subprocesses.

## Backend / source of truth

- **Runner orchestrator:** `src/services/runner.ts` — single entry for any test or coverage subprocess.
- **VS Code Test Controller bridge:** `src/services/testController.ts` — integrates with the native VS Code Testing API so results appear in the Test Explorer too.
- **Result parser:** `src/services/testResults.ts` — maps tool-specific output to `TestRunResult` (status, durations, error messages). Today minimal; per-tool parsers (Jest JSON, Vitest, Flutter JSON reporter, pytest JUnit) are Phase 9 deferred work.
- **Adapter contract:** every adapter's `runAll` / `runFile` / `runRelated` builds an arg array and delegates to the runner. The adapter never spawns directly.

## Frontend / clients

- Commands: `runAll`, `runCurrentFile`, `runRelated`, `runFeatureTests`, `generateCoverage`.
- StatusBar progress item + OutputChannel `Test Inspector`.
- Result population flows into `TestFile.status` / `TestCase.status` via `testResults.ts`.

## API contract locked

- `TestRunResult`: `{ projectId, command, exitCode, durationMs, cases[]? }`.
- Every public runner method takes a `vscode.CancellationToken`. Cancellation is wired today only partially — completing it is Phase 1.
- Confirmation: any command estimated as expensive (run-all, coverage generation) MUST prompt the user via `vscode.window.showWarningMessage` before spawning.
- Workspace trust: if the workspace is untrusted, the runner refuses to spawn and surfaces a friendly notice. No exceptions.
- The runner MUST NOT spawn from detection / discovery / quality / risk paths. Those are read-only by contract.

## Key files

- `src/services/runner.ts`
- `src/services/testController.ts`
- `src/services/testResults.ts`
- `src/adapters/*.ts` (each adapter's run methods build arg arrays here)
- `package.json` `contributes.configuration.testInspector.slowTestThresholdMs` — controls the "slow test" finding threshold

## Decisions locked

- `child_process.execFile` / `spawn` with arg arrays only — never `exec`, never `shell: true`, never `execSync`. This is D#4.
- A long-running command must be cancellable from a single point (the cancel button is Phase 1's biggest open task).
- Coverage generation goes through this domain even though it produces a `CoverageSummary` (consumed in domain `coverage`) — the spawn lives here, the parse lives there.
- Stream-per-test progress is a Phase 9 deferred — current implementation reports start/end, not per-test ticks. Adding it requires custom Jest/Vitest reporters or stable JSON output flags.
- Output is always mirrored to the OutputChannel so the user can see exactly what was executed (a printed "command + args" line, not a reconstructed shell string).
