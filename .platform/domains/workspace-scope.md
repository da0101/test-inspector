---
domain_id: dom-workspace-scope
slug: workspace-scope
status: active
repo_ids: [repo-primary]
related_domain_slugs: [test-discovery, changed-files, coverage, quality, risk-scoring, investigation, dashboard]
created_at: 2026-05-16
updated_at: 2026-05-16
---

# workspace-scope

_Metadata rules: `domain_id` must be `dom-<slug>`, `slug` must match the filename, `repo_ids` should name the repos this domain touches, and `updated_at` should change whenever contracts or touch-points change._

## What this domain does

Workspace scope lets Test Inspector analyze the right existing checkout and the right slice of a codebase instead of treating the currently opened app as one flat test universe. It covers a centralized, read-only repo/worktree catalog plus feature-focused filtering so a user can inspect only the tests and source files relevant to one feature stream from any VS Code window.

## Backend / source of truth

- New source-of-truth service should maintain Test Inspector's read-only catalog of tracked repositories, their current branch, main worktree path, and related existing worktrees without mutating user repos.
- Any local Git repo can be added to Test Inspector tracking. For every tracked repo, Test Inspector discovers that repo's existing worktrees.
- Catalog inputs should support:
  - extension-persisted user-added repo roots as the cross-window source of truth,
  - currently opened VS Code workspace folders as candidates,
  - optional expansion from an added Agentboard hub/project registry in `.platform/repos.md`,
  - optional future import from sibling tools such as `git-worktree-diff` without making that extension a hard dependency.
- Agentboard is not the source of truth. If an added repo happens to be an Agentboard hub that manages multiple repos, Test Inspector should discover those child repos and their worktrees as additional tracked candidates, similar to Worktree Diff's expansion behavior.
- Product responsibility is observation and test intelligence only: list known repos/worktrees, let the user select one as an analysis target, then retrieve projects/tests/coverage/risk from that filesystem path.
- Feature targeting should resolve a named feature scope to source files, test files, and changed files through deterministic local signals first.
- The scope model should feed test discovery, coverage matching, quality scoring, risk scoring, changed-file risk, investigation, and reports as a filter/context object rather than special-case framework branches.
- LLM enrichment may help describe or infer a feature boundary, but deterministic scope resolution must work without an LLM key.

## Frontend / clients

- The current UI surface is the Case File webview and Cases tree; the older Dashboard domain is stale after the detective redesign and should not be used as the first implementation target.
- Case File needs a persistent repo/worktree browser plus an analysis-target selector and a feature scope selector/filter.
- Selecting a worktree changes what Test Inspector scans; it must not switch branches or create/delete worktrees.
- Users should be able to open any VS Code repo/window and still see the centralized known repo/worktree catalog.
- Tree views should respect the selected scope when showing cases and entry points.
- Reviewer/LLM output should include the active scope in prompts and evidence, but it must not allow the LLM to alter scores.
- Reports should state which branch/worktree and feature scope were analyzed.

## API contract locked

- Scope filtering must be explicit and visible in all user-facing output; hidden global filters are not acceptable.
- Scope objects should identify catalog source, repo id/name, repository root, worktree path, branch name, and optional feature target metadata.
- A repository may have many worktrees; a worktree may have many feature targets; the model must not collapse repo root, worktree path, branch, and feature target into one ambiguous string.
- Agentboard `.platform/repos.md` parsing is read-only and tolerant: only expands an already tracked/added repo, ignores placeholder rows and unresolved paths, and surfaces diagnostics for broken concrete rows.
- If no branch/worktree data is available, the extension must degrade to the current workspace root and show a setup blocker or unknown state rather than guessing.
- No Git mutation and no source mutation: detection and targeting are read-only.
- Forbidden product commands include `git worktree add`, `git worktree remove`, `git switch`, `git checkout`, `git stash`, `git commit`, `git merge`, `git rebase`, and branch creation/deletion.
- Allowed Git commands are read-only discovery commands such as `rev-parse`, `branch --show-current`, `worktree list --porcelain`, `status --porcelain`, `diff --name-only`, and related file-inspection commands.
- Safe command execution still applies: Git commands must use `execFile` or `spawn` with argument arrays, never shell strings.

## Key files

- `src/models.ts`
- `src/extension.ts`
- `src/services/changedFiles.ts`
- `src/services/investigator.ts`
- `src/services/quality.ts`
- `src/services/sourceRisk.ts`
- `src/views/caseFile/panel.ts`
- `src/views/caseFile/template.ts`
- `src/views/caseFile/template/render.ts`
- `src/views/casesView.ts`
- `src/views/testTree.ts`
- `package.json`

## Decisions locked

- Scope is a cross-cutting context object passed into existing deterministic services, not a framework adapter.
- Branch/worktree detection must support centralized multi-repo catalogs, user-added repos, each repo's existing worktrees, multi-root VS Code workspaces, and optional Agentboard hub expansion.
- Test Inspector does not manage Git. It observes existing branches/worktrees only so it can do better test analysis.
- The target workflow is centralized: "from any repo, any worktree, any feature, any VS Code instance" the user can choose the analysis target and run Test Inspector's normal job.
- Feature targeting starts with local deterministic evidence: branch diff, touched files, path/name hints, imports, test references, and coverage paths.
- LLM-assisted scope description is optional and additive only.
- Case File must make the active scope obvious so users do not confuse scoped results with whole-app results.
