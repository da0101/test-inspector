---
domain_id: dom-adapters
slug: adapters
status: active
repo_ids: [test-inspector]
related_domain_slugs: [test-discovery, coverage, runner]
created_at: 2026-05-16
updated_at: 2026-05-16
---

# adapters

## What this domain does

Every framework Test Inspector supports — React, Flutter, Django, FastAPI, Firebase Functions (Vue.js planned) — is plugged in through a single `TestFrameworkAdapter` interface. The adapter is responsible for detecting projects of its stack in the workspace, finding test files, reading coverage artifacts, and running tests, so that the extension core never needs to know which framework it's dealing with.

## Backend / source of truth

- **Interface contract:** `src/adapters/types.ts` — the shape every adapter must implement (`id`, `label`, `detectProjects`, `discoverTests`, `runAll`, `runFile`, `runRelated`, `readCoverage`, `analyzeQuality`).
- **Registry:** `src/adapters/index.ts` — the canonical export list. Adding a new framework = export a new adapter here.
- **Shared utilities:** `src/adapters/shared.ts` — manifest readers, glob helpers, regex helpers reused by multiple adapters. Anything specific to one stack does NOT belong here.
- **Per-stack adapters:** `react.ts`, `flutter.ts`, `python.ts` (covers both Django and FastAPI), `firebase.ts`.

## Frontend / clients

- `src/extension.ts` consumes the registry to drive workspace scanning (`onView:testInspector.projects` activation event).
- `src/views/projectsView.ts` renders detected projects into the **Projects** tree view.
- All other services (coverage, quality, runner, risk) consume the `TestProject[]` produced here — they never look at a manifest themselves.

## API contract locked

- `TestProject` shape (see `src/models.ts`): `{ id, rootPath, framework, label, testCommand?, coverageCommand?, configFiles[] }`. Adding a field is fine; renaming or changing existing fields is a breaking change for every adapter.
- `framework` is a string-literal union: `'react' | 'flutter' | 'django' | 'fastapi' | 'firebase-functions'` (+ future entries). New values require updating downstream consumers' switch coverage.
- An adapter MUST return zero projects rather than throw when the stack isn't present. Throwing breaks the scan for every other adapter in the same workspace folder.
- Detection MUST be filesystem-only and read-only. No network calls. No spawning subprocesses for detection. (Spawning belongs in `runAll`/`runFile`/coverage, behind user confirmation when expensive.)

## Key files

- `src/adapters/types.ts`
- `src/adapters/index.ts`
- `src/adapters/shared.ts`
- `src/adapters/react.ts`
- `src/adapters/flutter.ts`
- `src/adapters/python.ts`
- `src/adapters/firebase.ts`
- `src/models.ts` (for `TestProject` and friends)
- `test/fixtures/{react,flutter,django,fastapi,firebase}/` — sample workspaces used by `test/unit/adapters.test.ts`

## Decisions locked

- Adapter isolation (D#2) — core never branches on framework identity; all stack-specific logic lives here.
- New framework = new adapter file + registry entry + fixture + unit test. Do not edit `extension.ts` or services to make room for a new stack.
- Detection is read-only and offline. Coverage / test execution is gated by workspace trust and explicit user commands.
- Python adapter currently covers BOTH Django and FastAPI; splitting is deferred until either stack's depth grows past what the shared file can host (see decisions.md deferred #2 for a parallel call on Vue.js).
- An adapter that doesn't yet have stack-specific quality heuristics SHOULD delegate to the shared regex set in `services/quality.ts` rather than ship its own clone.
