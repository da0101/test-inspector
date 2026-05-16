## Summary

<!-- 1-3 bullets describing what this PR changes and why. -->

-
-

## Branch flow

- [ ] This PR targets `develop` (or `main` only for a release / hotfix)
- [ ] My branch was created from `develop` (or `main` for a hotfix)

## Quality gates

- [ ] `npm test` passes locally
- [ ] `package.json` `version` bumped per semver (patch / minor / major)
- [ ] Files added/touched stay under ~300 lines (or have a documented exception)
- [ ] No new `any` types without a `// reviewed: <why>` comment
- [ ] No `exec` / `shell: true` / `execSync` introduced
- [ ] No LLM keys or secrets in code, logs, or settings
- [ ] Webview interpolations go through `escapeHtml`

## Test plan

<!-- How to verify this locally. Manual + automated. -->

1.
2.

## Screenshots / output snippets (if user-visible)

<!-- For UI changes, attach before/after. For LLM changes, attach the verified
     anchors output from a representative case. -->

## Notes for reviewers

<!-- Anything subtle worth flagging. -->
