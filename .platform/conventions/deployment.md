# Deployment conventions — test-inspector

Last updated: 2026-05-16

> Distribution target is the **public VS Code Marketplace**, open source. There is no server, no remote state, and no CI pipeline yet. Adding the publish + CI pipeline is on the release blocklist.

---

## Environments

| Env | What it is | How it's reached |
|---|---|---|
| Dev | The repo itself; debug via Extension Development Host (`F5`) | Open repo in VS Code, press F5 |
| Staging | A locally-built `.vsix` installed manually | `vsce package` → "Install from VSIX…" in VS Code |
| Prod | Published version on the VS Code Marketplace | `vsce publish` |

There is no "internal" or "preview" tier — open source means staging is just "the VSIX before publishing".

## Required before first public publish (release blocklist)

These are all tracked in `STATUS.md` "Release blocklist" but called out here because they gate `vsce publish`:

1. **Publisher identity.** `package.json` `publisher` is `"local"`. It must change to a real Marketplace publisher ID. The publisher is registered via `vsce create-publisher <name>` and stored separately (do NOT check the personal access token in).
2. **LICENSE file.** Open-source release without one is non-starter. Pick MIT or Apache-2.0 (open decision #8).
3. **CHANGELOG.md.** First entry is `0.0.1 — Initial publish`.
4. **README.md polish.** Marketplace renders README as the gallery page. Must include screenshots and an animated GIF demo for first impressions. `media/` already has the SVG icon; add a 128px PNG too (Marketplace requirement).
5. **CI pipeline.** GitHub Actions workflow that runs `npm test` on every PR. Block merges on red.
6. **Bundler decision.** Currently `tsc → out/`. Marketplace cold-start time benefits from a bundled single file. Decide before publish (open decision #1). If bundling: add esbuild, change `main` and `vscode:prepublish` accordingly, exclude `out/test` from the package.
7. **`.vscodeignore` audit.** Make sure tests, fixtures, source maps for tests, agent scaffolding (`.platform/`, `.agents/`, `.codex/`, `.claude/`) are excluded from the published `.vsix`. The shipped artifact stays small.
8. **`.platform/` exclusion.** Verify it's in `.vscodeignore` — it's repo-only context, not consumer-facing.
9. **Telemetry policy decided.** Open decision #4 — either "none ever" with a README note, or opt-in with explicit consent.
10. **Marketplace metadata.** `package.json` needs `repository`, `bugs`, `homepage`, `keywords`, `categories` (already set), `galleryBanner`, `engines.vscode` (already set).

## Build process

```bash
npm install              # Install dependencies
npm run compile          # Compile TS → out/ (also done by vscode:prepublish)
npm test                 # Compile + run node --test
npx vsce package         # Build the .vsix (vsce must be added as devDependency or run via npx)
```

Output: `test-inspector-<version>.vsix` in the repo root. Inspect contents with `unzip -l test-inspector-<version>.vsix` — verify no fixtures, no tests, no agent scaffolding.

## Publish process

```bash
# Bump version
npm version patch    # or minor / major

# Sanity check
npm test
npx vsce package
# (Install the VSIX manually and run the QA matrix from conventions/qa.md)

# Publish
npx vsce publish
# Marketplace can take a few minutes to mirror the new version
```

## Rollback

The VS Code Marketplace does not support direct rollback. To "rollback":

1. Publish a new patch version with the previous code (`git revert` the offending commit, bump version, publish).
2. The Marketplace will serve the new version. Users on the broken version can re-update.
3. If the release was destructive (e.g. leaked a secret), unpublish via `vsce unpublish <publisher>.<name>@<version>` — but this is one-way and disrupts users who have it pinned.

The bar for rollback is "destructive enough that 'wait for the next patch' isn't acceptable". For most issues, fix-forward.

## Versioning

- Pre-1.0: minor bumps for new features, patch bumps for fixes, NO breaking-change discipline (it's pre-1.0).
- 1.0+: SemVer strictly. Renaming a command, setting key, or message-protocol type is a major bump.

## Marketplace-only assets

| Asset | Required | Where |
|---|---|---|
| 128px PNG icon | Yes | `media/icon.png` (referenced from `package.json` `icon`) |
| Banner SVG | Already present | `media/test-inspector.svg` |
| README.md gallery content | Yes | repo root README — Marketplace renders this directly |
| Screenshots | Strongly recommended | `media/screenshots/*.png` (linked from README) |
| Animated GIF demo | Strongly recommended | `media/demo.gif` |
| CHANGELOG.md | Yes | repo root |
| LICENSE | Yes | repo root |
