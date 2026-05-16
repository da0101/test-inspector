# Contributing to Test Inspector

Thanks for considering a contribution. This file describes the **Git Flow** the
project follows and the rules that every change must respect.

## Branch model

```
main      ────●────●────●────●─────●──────────────●─────────►   (production / tagged releases)
              ▲    ▲    ▲    ▲     ▲              ▲
              │    │    │    │     │              │
              └────┴────┴────┴─────┴──────────────┘
                                  │
develop   ────●────●────●─────●───●──────────────●─────────►   (integration)
              ▲    ▲    ▲     ▲   ▲              ▲
              │    │    │     │   │              │
        feature/  feature/  feature/        feature/
        login    payments  search          settings
        (merge to develop, never to main directly)
```

| Branch | Role | Who pushes | Merges into |
|---|---|---|---|
| `main` | Production. Every commit is a tagged release. | Maintainer (via merge from develop) | — |
| `develop` | Integration branch. Features land here first. | Anyone via PR from feature branches | `main` (at release time) |
| `feature/<slug>` | Single feature or bug fix. Branched from `develop`. | Author | `develop` (via PR) |
| `bugfix/<slug>` | Same as feature/ but for fixes. Branched from `develop`. | Author | `develop` (via PR) |
| `hotfix/<slug>` | Emergency fix branched directly from `main`. | Maintainer | `main` AND `develop` |

### Hard rules

1. **`main` is sacred.** Direct pushes to `main` are not allowed. Every change
   reaches `main` by merging `develop` into it (or, for emergencies only, a
   `hotfix/` branch into both `main` and `develop`).
2. **All feature work branches from `develop`.** Never from `main`. Never from
   another feature branch.
3. **Every change opens a PR.** No direct pushes to `develop` either.
4. **CODEOWNERS review is required.** See `.github/CODEOWNERS` — owners must
   approve before merge. Enable in repo settings → Branches → Protection
   rules → "Require review from Code Owners".
5. **Per-fix version bump in `package.json`.** Pre-1.0 used patch bumps
   (`0.0.1` → `0.0.2`) on every fix. Post-1.0 follows strict semver:
   - **patch** (`1.0.0` → `1.0.1`): bug fix, no behavior change for users
   - **minor** (`1.0.0` → `1.1.0`): new feature, backwards-compatible
   - **major** (`1.0.0` → `2.0.0`): breaking change to commands, settings,
     webview message protocol, or `CaseFileBundle` shape
6. **Tests must pass.** `npm test` is green before any merge.
7. **Stale branches deleted.** After a feature PR is merged, the source branch
   is deleted both locally and on the remote.

## Day-to-day workflow

### Start a new feature

```bash
git checkout develop
git pull origin develop
git checkout -b feature/<slug>
# … work …
git push -u origin feature/<slug>
# Open a PR against `develop` via GitHub
```

### Land your feature

After PR approval + green CI:

```bash
# Merge via the GitHub UI (or `gh pr merge --squash`)
# Then locally:
git checkout develop
git pull origin develop
git branch -d feature/<slug>                 # delete local
git push origin --delete feature/<slug>      # delete remote
```

### Cut a release

When `develop` has accumulated enough for a release:

```bash
git checkout develop
git pull origin develop
# Bump version in package.json (semver):
npm version minor   # or major / patch
# Open a PR develop → main on GitHub, get approval, merge with --no-ff.
# After merge:
git checkout main
git pull origin main
git tag v$(node -p "require('./package.json').version")
git push origin main --tags
```

### Emergency hotfix

```bash
git checkout main
git checkout -b hotfix/<slug>
# … fix …
npm version patch
git push -u origin hotfix/<slug>
# Open PR hotfix → main, merge.
# Then merge main back into develop so develop has the fix too:
git checkout develop
git pull origin develop
git merge main
git push origin develop
```

## Build, install, test

```bash
# Build + run the unit suite
npm test

# Build the .vsix and install into local VS Code
./scripts/install.sh

# Open the extension in dev mode
# Open VS Code on this repo, press F5 — opens an Extension Development Host
```

## Code conventions

- TypeScript strict mode. No `any` without a `// reviewed: <why>` comment.
- Max ~300 lines per file. Split before you grow past it.
- Subprocesses via `child_process.execFile` / `spawn` with **arg arrays**.
  Never `exec` / `shell: true` / `execSync`.
- Webview HTML through the `escapeHtml` helper. CSP is strict; no inline
  event handlers.
- LLM keys go in `vscode.SecretStorage` only. Never in `settings.json`, logs,
  or exported reports.
- Tests use Node's built-in `node --test` runner. No Jest, no Vitest.

See `.platform/conventions/` for the long form of each rule.

## Reporting bugs

Open an issue at https://github.com/da0101/test-inspector/issues with:

- Test Inspector version (from VS Code Extensions panel)
- VS Code version + OS
- A short reproduction (which project framework, what verdict was wrong, etc.)
- The relevant snippet from the `Test Inspector` OUTPUT channel
- If LLM-related: which provider + model

## Code of conduct

Be the kind of reviewer you'd want on your own PR.
