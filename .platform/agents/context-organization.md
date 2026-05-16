# Context organization — domain-first, not repo-first

> How `.platform/` docs are structured so agents load the minimum context needed to work on a feature. Read this during activation (Step 3) before writing any `.platform/` doc.

## The problem

The naive approach is to write one big doc per repo: `backend.md` covers every backend app, `frontend.md` covers every frontend feature, etc. That works for small projects and fails the moment you have more than a handful of features.

Concrete failure mode, seen in real projects:

- Project has 4 repos and ~5 feature domains.
- `backend.md` grows to 400 lines (12 apps), `admin.md` to 285, `menu-widget.md` to 287, `nutrition-widget.md` to 328.
- An agent assigned to fix one bug in one feature loads ~1300 lines of context to find ~150 lines it actually needs.
- Token budget blown before work starts, attention diluted across irrelevant subsystems, and the agent is likelier to "drift" into editing unrelated code.

**Root cause:** features are cross-layer (backend app + admin UI + widget), but docs were organized by layer. Every feature touches multiple layers, so every feature has to load multiple layer docs.

## The pattern: domain-first

Organize docs by **feature domain**, not by repo. Each domain file is cross-layer — it covers every repo that touches that domain, in one place.

```
.platform/
  domains/
    <domain-a>.md   ← backend app + admin feature + widgets for domain A
    <domain-b>.md   ← backend app + admin feature + widgets for domain B
    <domain-c>.md   ← ...
  backend.md        ← repo conventions only: stack, patterns, gotchas, navigation
  admin.md          ← repo conventions only
  <widget>.md       ← repo conventions only
```

**Two tiers:**

1. **Domain files (`.platform/domains/<name>.md`)** — cross-layer, feature-focused. This is what agents load for feature work. One file per domain. Each file is under ~150 lines.
2. **Repo convention files (`.platform/<repo>.md`)** — stack, idioms, gotchas, file-layout navigation. No feature inventory. Agents load these only when they need to understand repo patterns, not to work on a feature.

## What goes in a domain file

- **Frontmatter metadata** — `domain_id`, `slug`, `status`, `repo_ids`, `related_domain_slugs`, `created_at`, `updated_at`
  `domain_id` should stay canonical: `dom-<slug>`.
- **What this domain does** — 2 sentences, user-facing outcome.
- **Backend** — the Django/Rails/Express/etc. app(s) for this domain: models, endpoints, services, key invariants. Include file paths.
- **Admin / frontend** — the feature domain inside the admin app: routes, state, any notable components.
- **Widgets / clients** — every other app that touches this domain: hooks, pages, state, rendering pipeline.
- **API contract locked** — the response shape or protocol agents must not break.
- **Key endpoints table** — one-line-per-endpoint cheat sheet.
- **Decisions locked** — 3–5 things not open for debate.
- **Key files** — 4–8 file paths, absolute where possible.

**Ceiling: ~150 lines.** If you exceed it, split into two domain files (e.g., `orders-checkout.md` + `orders-tracking.md`). The whole point is that an agent can absorb the file in under a minute.

## What goes in a repo convention file

- **Stack** — languages, frameworks, pinned versions, build tools.
- **Conventions / idioms** — how code is written in this repo (naming, layering, error handling).
- **Gotchas** — things that bite every first-time contributor.
- **Navigation** — where to find viewsets, routes, state, shared components. Think "table of contents for the repo".
- **Commands** — how to run tests, dev server, lint, build.

**What it does NOT contain:** a feature-by-feature breakdown. That's what the domain files are for. If a repo convention file starts listing every feature and what each one does, it's heading toward the old repo-first trap — extract the feature-specific parts into domain files.

## How `work/BRIEF.md` uses this

`BRIEF.md` `## Relevant context` lists **domain files first**, repo convention files only if needed.

Good:
```
- `.platform/domains/orders.md` — cross-layer: order models, Stripe checkout, admin live view, widget tracking
```

Bad (the old pattern):
```
- `.platform/backend.md` — Django backend
- `.platform/admin.md` — admin dashboard
- `.platform/menu-widget.md` — widget
```

The old pattern loads 3 files, ~900 lines, most of them irrelevant. The new pattern loads 1 file, ~150 lines, all of them relevant.

## Token budget — old vs new

| Scenario | Old approach (repo-first) | New approach (domain-first) | Reduction |
|---|---:|---:|---:|
| Work on a single feature (1 domain) | ~900 lines (3 repo files) | ~130 lines (1 domain file) | ~85% |
| Multi-domain cross-cutting change (2 domains) | ~1200 lines (4 repo files) | ~260 lines (2 domain files) | ~78% |
| Pure repo-navigation work (no feature) | ~400 lines (1 repo file) | ~400 lines (1 repo file) | 0% (same) |

For everyday feature work the saving is roughly an order of magnitude. For whole-repo refactors there's no difference — repo files are still the right tool for that narrow case.

## Activation — writing domain files in Step 3

During activation (see `ACTIVATE.md` Step 3), after you scan the project and interview the user, you will have a list of major feature areas — menus, auth, orders, payments, catalog, etc. For each one:

1. Identify every repo that touches it. Usually backend app + admin feature folder + one or more widgets/clients.
2. Write one file at `.platform/domains/<feature>.md` following the structure in "What goes in a domain file".
3. Fill in the metadata block at the top so agents and tooling can validate it later.
4. Keep it under ~150 lines. If you can't, split it.
5. Cite file paths. Agents need to grep-and-jump, not read-and-search.
6. Lock the decisions that matter. Future agents should see "this is locked, don't re-litigate".

Repo convention files (`backend.md`, etc.) still get written — but **only for conventions, not for features**. Add a header note at the top of each repo file pointing readers to `.platform/domains/` for feature work.

## Rule of thumb

> If an agent would read **more than one** repo file to work on a typical feature, the docs are organized wrong. Move the cross-layer content into `.platform/domains/`.
