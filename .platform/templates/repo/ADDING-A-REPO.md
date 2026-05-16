# Adding a New Repo to the Platform

> **When to use this:** you're creating a new repository that will join the RestoHub platform — a new embeddable widget, a new standalone app, a new admin tool, a new backend service, a new Flutter/iOS/Android client, whatever. Any repo that needs to consume the same context as the existing four.

This template exists so a new repo onboards in **~10 minutes** with zero re-explanation, and every AI session (Claude Code / Codex CLI / Gemini CLI) picks it up automatically via the same `ONBOARDING.md` path.

The templates are stack-agnostic. You can use them for:

- React + Vite apps (`restohub-frontend`, menu widget, nutrition widget)
- Django backend (`restohub-backend`)
- FastAPI / Express / Rails / any other backend service
- Flutter / iOS / Android client
- CLI tool, scraper, ops script — anything that qualifies as "a repo the platform team will touch"

The only thing that varies per-stack is **which `conventions/*.md` file is the primary convention** for that repo. See Step 0 #4 below.

---

## Step 0 — Decide what you're adding

Answer these before touching files. If you can't answer 1–7 cleanly, stop and go through Stage 1 (Triage) + Stage 2 (Interview) of `.platform/workflow.md` first.

1. **Repo name** — exact directory name where you keep your repos (e.g., `~/code/`, `~/projects/`)
   - e.g., `kitchen-display-widget`, `my-app-mobile`, `my-app-ops-cli`
2. **Short slug** — kebab-case, used in STATUS filenames and deep-reference files
   - e.g., `kds-widget`, `mobile`, `ops-cli`
3. **Display name** — human-readable, for headers and docs
   - e.g., `Kitchen Display (KDS) Widget`, `RestoHub Mobile App`, `Ops CLI`
4. **Stack category** — determines which convention file is the primary one the repo entry should point to:

   | Stack | Primary conventions file |
   |---|---|
   | Django + DRF | `conventions/django.md` |
   | React (any frontend) | `conventions/react.md` |
   | FastAPI / other Python web | write a new `conventions/fastapi.md` first |
   | Flutter | write a new `conventions/flutter.md` first |
   | iOS / Swift | write a new `conventions/ios.md` first |
   | Android / Kotlin | write a new `conventions/android.md` first |
   | CLI / ops script | cross-cutting conventions only (`api.md` / `security.md` / `testing.md`) |

   > **If your stack doesn't have a primary conventions file yet, write one first.** Use `conventions/react.md` or `conventions/django.md` as a structural template — copy the headings, replace the content. Every convention file should cover: stack baseline, canonical layout, entry-point pattern, data layer pattern, tests bar, 10–15 hard rules.

5. **Tech stack one-liner** — framework + build tool + state management + key libraries
   - e.g., `React 18, Vite, TypeScript strict, React Context, CSS Modules, Firebase RTDB subscriber`
   - e.g., `Django 5.2 LTS, DRF 3.16, PostgreSQL, pytest + factory_boy`
   - e.g., `Flutter 3.x, Dart 3, Riverpod, go_router, Firebase SDK`
6. **Build targets** — what binaries/bundles ship?
   - `standalone-only` — single app, normal deploy
   - `embed-only` — library consumed by other sites/apps (UMD bundle, npm package, etc.)
   - `dual` — both (React widgets typically do this)
   - `service` — a backend deploys as a running service, not a bundle
   - `binary` — a CLI or mobile app binary
7. **Data contract** — which backend endpoints / databases / realtime channels does it read or write?
8. **Specialist routing** — which existing specialist skill owns this area, or does a new one need to be created? (See `.platform/repos.md` routing table.)

---

## Step 1 — Create the repo

```bash
cd /Users/danilulmashev/Documents/GitHub/
# create the repo however (gh repo create, git clone from template, bare `mkdir && git init`, etc.)
cd <your-new-repo>
```

Set up the baseline: language toolchain, dependency file (`package.json`, `pyproject.toml`, `Gemfile`, `pubspec.yaml`, etc.), lockfile, linter config, formatter config, `.env.example`, `.gitignore`. Commit the scaffold.

---

## Step 2 — Drop in the repo entry files

> `ab add-repo <path>` now refuses to overwrite existing `CLAUDE.md`, `AGENTS.md`, or `GEMINI.md`. If the target repo already has any of them, stop and follow the prepend-don't-delete activation rules instead of clobbering user content.

Copy these three template files into the new repo's root and fill in the placeholders:

```bash
cp {{PLATFORM_REPO_PATH}}/.platform/templates/repo/CLAUDE.md.template  /path/to/new-repo/CLAUDE.md
cp {{PLATFORM_REPO_PATH}}/.platform/templates/repo/AGENTS.md.template  /path/to/new-repo/AGENTS.md
cp {{PLATFORM_REPO_PATH}}/.platform/templates/repo/GEMINI.md.template  /path/to/new-repo/GEMINI.md
```

Replace every `{{PLACEHOLDER}}` token. Placeholder reference:

| Placeholder | What to fill in |
|---|---|
| `{{REPO_NAME}}` | exact directory name (e.g., `kitchen-display-widget`) |
| `{{REPO_DISPLAY_NAME}}` | human-readable (e.g., `Kitchen Display (KDS) Widget`) |
| `{{ONE_LINER_WHAT_THIS_IS}}` | short description — what does this repo do in one sentence? |
| `{{IS_IT_A_FULL_APP_OR_JUST_A_WIDGET_NOTE}}` | if "widget" is in the name but it's actually a full app, say so. Delete the line if not relevant. |
| `{{STATUS_FILE}}` | `STATUS-{{slug}}.md` |
| `{{REFERENCE_FILE}}` | `{{slug}}.md` |
| `{{PRIMARY_CONVENTIONS_FILE}}` | `django.md`, `react.md`, `fastapi.md`, `flutter.md`, etc. (see Step 0 #4) |
| `{{TECH_STACK_LINE}}` | framework + build tool + state + key libs (one line) |
| `{{BUILD_TARGETS}}` | `standalone-only` / `embed-only` / `dual` / `service` / `binary` |
| `{{DATA_CONTRACT_ONE_LINER}}` | "consumes `GET /foo/bar/`" or "subscribes to RTDB `/orders/{restaurant_id}`" |
| `{{API_SHAPE_NOTE}}` | "Shape 1 entities with `schema_version=1`" or "legacy nested until migration" |
| `{{AUTH_MODEL}}` | "Firebase anonymous" / "Firebase ID token" / "public, no auth" / "service-to-service via shared secret" / etc. |
| `{{ADDITIONAL_LOCKED_FACTS}}` | repo-specific facts that correct or add to platform defaults (bullet list) |
| `{{QUICKSTART_SETUP}}` | install + env commands (`npm install && cp .env.example .env`, `poetry install`, `flutter pub get`, etc.) |
| `{{QUICKSTART_RUN}}` | dev command (`npm run dev`, `python manage.py runserver`, `flutter run`, etc.) |
| `{{QUICKSTART_BUILD}}` | prod/embed build command |
| `{{QUICKSTART_TEST}}` | test command |
| `{{CANONICAL_FILES_TABLE}}` | rows of `\| When you touch X \| Read path/to/file.ext \|` |
| `{{HARD_RULES_LIST}}` | numbered list of repo-specific non-negotiable rules |

**After the first fill, run sync-context.sh** (see Step 5f) so Codex and Gemini entry files stay in lockstep with Claude's version.

---

## Step 3 — Create the platform-level STATUS file

```bash
cp {{PLATFORM_REPO_PATH}}/.platform/templates/repo/STATUS.md.template \
   {{PLATFORM_REPO_PATH}}/.platform/STATUS-{{SLUG}}.md
```

Fill in:
- Today's date in the header
- Current status of every feature area (`Done` / `Exists` / `Pending` / `Flagged` / `Deferred`)
- Immediate priorities (top 3)
- Open decisions
- Go-live blocklist
- Known gotchas (pin the ones that will bite every new session)
- File size violations

---

## Step 4 — Create the platform-level deep-reference file

```bash
cp {{PLATFORM_REPO_PATH}}/.platform/templates/repo/reference.md.template \
   {{PLATFORM_REPO_PATH}}/.platform/{{SLUG}}.md
```

This is the big file — the document an AI agent (or human) reads when STATUS alone isn't enough. Fill in what applies; delete sections that don't (e.g., a backend service has no "Embed entry" section; a CLI tool has no "Realtime" section).

At minimum:
- What this repo is, who uses it, who deploys it, where it's hosted
- Tech stack table
- Architecture diagram (ASCII is fine)
- Directory layout
- Entry points
- State / data flow / caching
- Auth
- Environment configuration
- Build & deploy commands + rollback
- Known violations / tech debt
- Specialist routing
- Cross-repo dependencies
- Open questions

Treat it like `backend.md`, `admin.md`, `menu-widget.md`, `nutrition-widget.md` — those are the existing examples to copy the tone and depth from.

---

## Step 5 — Wire the new repo into the platform index

Edit these platform files so every AI session discovers the new repo through the normal onboarding path.

### 5a. `.platform/STATUS.md` (the index)

Add a row linking to the new `STATUS-{{SLUG}}.md`.

### 5b. `.platform/repos.md`

Add the new repo to the repo table. Include: repo name, path, tech stack one-liner, canonical file paths, specialist routing for this repo.

### 5c. `.platform/ONBOARDING.md`

Add the new repo to Step 4's "Load the deep per-repo reference" table.

### 5d. `CLAUDE.md` (platform root)

Add the new repo to the "Four Repos" (now N-Repos) table. Add a line to the reference-pack list pointing at `.platform/{{SLUG}}.md`.

### 5e. `AGENTS.md` + `GEMINI.md` (platform root)

These are generated from `CLAUDE.md` — **do not edit by hand**. After updating `CLAUDE.md`, run:

```bash
ab sync --apply
```

### 5f. `.platform/scripts/sync-context.sh` — add the new repo to the `REPOS` array

Open the script and add a line like:

```bash
REPOS=(
  "{{PLATFORM_REPO_PATH}}"
  "/Users/danilulmashev/Documents/GitHub/restohub-backend"
  "/Users/danilulmashev/Documents/GitHub/restohub-frontend"
  "/Users/danilulmashev/Documents/GitHub/menu-builder-checkckout-widget"
  "/Users/danilulmashev/Documents/GitHub/nutrition-calculator-wiget"
  "/Users/danilulmashev/Documents/GitHub/{{REPO_NAME}}"   # <-- add your new repo here
)
```

Then run `sync-context.sh` again to verify the new repo is in sync.

### 5g. `.platform/memory/log.md`

Append one line:

```
YYYY-MM-DD — Onboarded {{REPO_NAME}} ({{SLUG}}) — {{what was wired}} — {{takeaway, if any}}
```

---

## Step 6 — (Optional) Create specialist skills

If the new repo has enough unique surface area to warrant its own specialist skill(s), create them under `.claude/skills/` following the pattern of existing specialists (`django-menu`, `widget-menu-logic`, `react-nutrition`, etc.). Otherwise, route work to the most relevant existing specialist.

Update `.platform/repos.md` and `CLAUDE.md` routing tables so agents pick up the new specialist.

---

## Step 7 — Verify the onboarding works

Open a **fresh** AI session in the new repo and ask a simple question:

> *"What does this repo do and where does its API come from?"*

The answer should reference the platform context files (`{{PLATFORM_REPO_NAME}}/CLAUDE.md`, `.platform/{{SLUG}}.md`, `STATUS-{{SLUG}}.md`, the correct `conventions/*.md`) without you having to re-explain anything.

If the session fails to pick up context, the `CLAUDE.md` / `AGENTS.md` / `GEMINI.md` pointer files in the repo are the most likely culprit. Verify:

- Files live at repo root
- They start with `**Stop.** Before touching code in this repo, read the platform context.`
- They point to the correct `{{PLATFORM_REPO_PATH}}/.platform/` paths
- All `{{PLACEHOLDER}}` tokens are replaced
- `sync-context.sh` reports the new repo as in-sync

---

## Step 8 — (If it's a shared/reusable template for a brand new stack) update the starter kit

If the stack you just onboarded is one that the platform will use again on future projects (e.g., FastAPI, Flutter), propagate the new `conventions/{{stack}}.md` file back to `~/Documents/AGENTBOARD.md` (the platform's cross-project starter kit). That way the next project you stand up ships with it already written.

Skip this step if the stack is a one-off.

---

## Checklist (copy into your session)

```
[ ] Step 0 — name, slug, display name, stack category, tech stack one-liner, build targets, data contract, specialist routing decided
[ ] Step 0b — primary conventions file exists (or written from scratch first)
[ ] Step 1 — repo created with baseline scaffold, initial commit done
[ ] Step 2 — CLAUDE.md / AGENTS.md / GEMINI.md dropped into repo root, placeholders filled
[ ] Step 3 — STATUS-{{slug}}.md created in .platform/
[ ] Step 4 — {{slug}}.md deep reference created in .platform/
[ ] Step 5a — .platform/STATUS.md index updated
[ ] Step 5b — .platform/repos.md updated
[ ] Step 5c — .platform/ONBOARDING.md updated
[ ] Step 5d — platform root CLAUDE.md updated
[ ] Step 5e — ab sync --apply run; AGENTS.md + GEMINI.md regenerated at platform root
[ ] Step 5f — new repo added to sync-context.sh REPOS array; second run clean
[ ] Step 5g — .platform/memory/log.md line appended
[ ] Step 6 — specialist skills created (if needed)
[ ] Step 7 — fresh AI session successfully picks up context without re-explanation
[ ] Step 8 — starter kit (AGENTBOARD.md) updated if the stack is reusable across projects
```
