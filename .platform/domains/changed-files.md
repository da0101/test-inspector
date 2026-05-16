---
domain_id: dom-changed-files
slug: changed-files
status: active
repo_ids: [test-inspector]
related_domain_slugs: [risk-scoring, runner, reports]
created_at: 2026-05-16
updated_at: 2026-05-16
---

# changed-files

## What this domain does

Use the local Git CLI to determine which files have changed in the current working tree (and against `HEAD`), map each changed source file to its likely related tests, and surface the per-file picture: related test count, coverage, quality findings, recommended command to run. This is the "what should I run before I commit" signal.

## Backend / source of truth

- **Git wrapper:** `src/services/git.ts` — wraps `git status --porcelain=v1` and `git diff --name-only HEAD --`. Uses `execFile`, never composes shell strings.
- **Source-to-test mapping heuristics:**
  - Same basename (`Button.tsx` ↔ `Button.test.tsx`, `views.py` ↔ `test_views.py`, `user_service.py` ↔ `test_user_service.py`)
  - Same directory or sibling `__tests__` / `tests` folder
  - Flutter `lib/<area>/foo.dart` → `test/<area>/foo_test.dart`
  - Basic local-import mapping (test file imports the source file)
- **Planned (Phase 3, deferred):** tsconfig/jsconfig path alias resolution, barrel/index re-export resolution, Python package import resolution, Flutter/Dart package URI resolution, confidence levels per mapping.

## Frontend / clients

- `src/views/changedFilesView.ts` — **Changed Files** tree view with related-test, coverage, finding columns.
- `src/views/dashboard.ts` — changed-file risk area.
- `src/services/report.ts` — Markdown report's "Changed Files Risk" section.

## API contract locked

- `ChangedFile`: `{ path, status, projectId?, relatedTests[], coverage?, findings[], recommendedCommand? }`.
- `status` mirrors Git porcelain: `'modified' | 'added' | 'deleted' | 'renamed' | 'untracked'`.
- `recommendedCommand` is a single shell-safe string assembled via the adapter's `runRelated` or `runFile` path — consumers display it; they do NOT exec it. Execution always routes through `services/runner.ts`.
- A deleted file produces an entry but no recommended command (you can't run tests for a file that no longer exists).
- The Git wrapper MUST NOT mutate the working tree or stash — it is read-only.

## Key files

- `src/services/git.ts`
- `src/services/runner.ts` (target for the recommended command)
- `src/views/changedFilesView.ts`
- `src/services/report.ts` (Markdown report rendering)

## Decisions locked

- We use the local Git CLI, never GitHub APIs (D — local-first principle). No remote calls during scan.
- Source-to-test mapping is a published heuristic — when it's wrong, the answer is to improve the heuristic (or add Phase-3 alias resolution), not to add a manual override file. Manual overrides land as a deferred discussion.
- Recommended commands are advisory in this view; clicking "Run" in another surface routes through `runner.ts` with the confirmation policy intact.
- If the workspace is not a Git repo, the Changed Files view shows a friendly empty state — it does NOT throw or block other views.
- Renames (`R`) and copies (`C`) are treated as `modified` for mapping purposes; the old path is logged but not separately tracked in `ChangedFile`.
