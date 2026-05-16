# TypeScript conventions — test-inspector

Last updated: 2026-05-16

> Project-specific rules. Don't recreate generic style guides — these are the rules that apply to THIS codebase.

---

## Compiler settings (locked)

`tsconfig.json` is the source of truth. Highlights, none of which should regress:

- `strict: true`
- `noImplicitReturns: true`
- `noFallthroughCasesInSwitch: true`
- `esModuleInterop: true`
- `skipLibCheck: true` (necessary for `@types/vscode` against the published VS Code typings)
- `target: ES2022`, `module: commonjs` (VS Code extension host is CommonJS)
- `rootDir: '.'`, `outDir: 'out'`, `include: ['src', 'test/unit']`
- `sourceMap: true` for debug; ensure `.vscodeignore` does not ship the test source maps

Do not turn off strictness for "convenience" of a single file. Add a focused `// @ts-expect-error <reason>` and a follow-up issue instead.

## File size

- Soft cap: 300 lines per file.
- Hard offenders currently: `src/extension.ts` (~36 KB / ~900+ lines), `src/views/dashboard.ts` (~38 KB / ~1000+ lines). Both are tracked in `STATUS.md`. Adding to them without splitting first is rejected at review.
- Splitting strategy: a file usually has 2–3 responsibilities. Extract by responsibility (command registration / DI wiring / lifecycle), not by line count.

## Naming

- Files: `camelCase.ts` (e.g. `sourceRisk.ts`, `investigationView.ts`). The existing codebase is consistent — match it.
- Types/interfaces: `PascalCase`.
- Functions / variables / props: `camelCase`.
- Constants: `UPPER_SNAKE_CASE` only for true module-scoped immutables; default to `camelCase`.

## `any` and `unknown`

- `any` is forbidden except behind a `// reviewed: <why>` comment.
- `unknown` is preferred for "I don't know the shape yet"; narrow with type guards before use.
- `as unknown as T` casts need a comment explaining why a direct cast won't do.

## Imports

- VS Code-only imports: `import * as vscode from 'vscode';` (matches existing code).
- Node built-ins: prefer `node:` prefix (`import { readFile } from 'node:fs/promises'`).
- Relative imports only inside `src/`. No absolute alias setup (no `@/...`) — keep tooling minimal.
- Adapter files (`src/adapters/*.ts`) MUST NOT import from `src/views/*` or `src/services/featureInvestigator.ts` etc.; the dependency direction is one-way: adapters ← services ← views/extension.

## Asynchronous code

- `async`/`await` everywhere. Don't mix raw Promises with `await` unless interop demands it.
- All long-running async work accepts a `vscode.CancellationToken`. Wire it through — don't ignore it because "I'll wire it next PR".
- Avoid `Promise.all` for filesystem walks that might be huge — use a bounded concurrency helper (write one in `utils/` if you need it, don't pull a dep).

## Types vs interfaces

- `interface` for adapter contracts and other things that may be extended (`TestFrameworkAdapter`, `LlmProvider`).
- `type` for shape aliases, unions, and discriminated unions (`QualityFinding`, `ChangedFile`, message bus messages).
- Mixed usage in the same file is fine — pick the one that fits the concept.

## Error handling

- Throw `Error` instances; never strings.
- At domain boundaries (any function called from a command handler or webview message handler), wrap in a `try`/`catch` and route to `vscode.window.showWarningMessage` + OutputChannel — never let it crash the extension host.
- Inside services, prefer returning `Result`-like types (`{ ok: true; value: T } | { ok: false; error: string }`) when the failure mode is expected. Keep `throw` for unexpected programmer errors.

## No global state

- No top-level mutable `let` in service files. State belongs in `services/state.ts` (extension-scoped) or in a `class` instantiated from `extension.ts`.
- This includes "lazy-cached" values — make them properties of an instance, not module-level.

## Comments

- Default: no comments. Code, types, and names should explain "what".
- Only comment when "why" is non-obvious (a workaround for a VS Code API quirk, a chosen-on-purpose magic number, an intentional deviation from a convention here). Reference the convention rule by file:section when deviating intentionally.

## Compile + lint locally before pushing

```bash
npm run compile   # must produce zero errors
npm test          # must pass
```

A linter (eslint) is a release-blocklist item. Add it under `devDependencies`, configure it to match these conventions, and run it in CI.
