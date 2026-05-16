# Test Inspector

> A local-first VS Code extension that names which of your unit tests are **theater**, **weak**, or **missing** — and explains why, in plain English, with line-anchored evidence.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![VS Code ^1.90](https://img.shields.io/badge/VS%20Code-%5E1.90.0-blue.svg)](https://code.visualstudio.com/)
[![Tests](https://img.shields.io/badge/tests-68%2F68-brightgreen.svg)](./test/unit)
[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](./package.json)

---

## Why this exists

A growing share of new unit tests in modern codebases are written by LLM
assistants (Copilot, Cursor, Claude) or by developers still building test
taste. The failure modes are predictable: tests that pass without proving
anything — `expect(true).toBe(true)`, mock-only assertions, snapshot-only
files, "render didn't throw" widget tests, tests that mock the very unit
under test.

**Existing test extensions answer "did the tests pass?". Test Inspector
answers "do the tests prove anything?".** When 100% green can hide 60%
useless tests, this extension surfaces the bad ones — by name, with
evidence, and (optionally) with a verified second opinion from an AI
reviewer that cannot hallucinate beyond the file content.

---

## Features

- 🔴 **Theater / 🟡 Weak / ⚪ Missing / 🟢 Strong** verdicts on every test and source file
- **Line-anchored evidence** — every signal points at a specific line, copy-pasteable to the editor
- **Multi-project monorepos** — Flutter app + Firebase Functions + React frontend, all scanned together with per-project tabs
- **Reactive KPI tiles** — click `Theater` to filter, switch project tab and the counts recompute for that scope
- **Optional AI reviewer** — OpenAI / Anthropic Claude / Google Gemini. Strict anti-hallucination contract: every claim the LLM makes must cite a real line and a verbatim excerpt; fabricated anchors are dropped before display
- **Inline AI Reviewer sidebar** — manage provider, model, and API key without ever leaving the sidebar
- **Mark Reviewed** — false-positive cards hide with content-hash invalidation (they come back if the file changes)
- **Per-card Rescan** + **Markdown export** for PR descriptions
- **Local-first** — every core feature works without any API key. The AI is purely additive.
- **Never mutates source** — Test Inspector reads, scores, reports. You make the changes.

### Frameworks supported

| Framework | Detection | Coverage parsing | Quality smells |
|---|---|---|---|
| **React** (Jest / Vitest) | ✅ | LCOV, Istanbul JSON (partial) | ✅ trivial-assertion, mocks-unit-under-test, mock-only, vague-title, snapshot-only, render-only, orphan-test |
| **Flutter / Dart** | ✅ | LCOV | ✅ trivial-Dart-assertion, render-only-widget-test, Mocktail mock-only, vague-title |
| **Firebase Functions** | ✅ | LCOV (Istanbul) | Same as React |
| **Django** | ✅ | coverage.py JSON / XML | ✅ skipped-test (more coming) |
| **FastAPI** | ✅ | coverage.py JSON / XML | ✅ skipped-test (more coming) |
| **Vue.js** | 🟡 Detected via Node | — | Inherits React rules; native adapter on the roadmap |

---

## Install

### From source (current)

```bash
git clone https://github.com/da0101/test-inspector.git
cd test-inspector
./scripts/install.sh
```

The script does, in order:

1. Cleans `out/` (`rm -rf out`) — avoids stale build artifacts
2. `npm install` (if `node_modules/` is missing)
3. `npm run compile` (TypeScript → `out/`)
4. `npm test` (runs the 68-test unit suite)
5. `npx @vscode/vsce package` → produces `test-inspector-<version>.vsix`
6. `code --install-extension <vsix> --force` → installs into your local VS Code

If the `code` CLI is not on your PATH, the script prints fallback
instructions: open VS Code → Command Palette → `Extensions: Install from
VSIX…` → pick the `.vsix` file the script produced.

### Requirements

- Node.js 18+ (20 recommended)
- VS Code 1.90+
- macOS, Linux, or Windows
- `git` (for changed-file scoring)
- An API key from OpenAI, Anthropic, or Google AI Studio — **only if** you want the AI reviewer layer (everything else works without)

### From VS Code Marketplace

🚧 Not yet published. Tracking issue: TODO. Until then, install from source.

---

## Quick start

1. **Install** (see above).
2. **Open** any project that contains tests — single-repo or monorepo.
3. **Click the 🧪 Test Inspector icon** in the Activity Bar (left side).
4. The sidebar auto-scans within ~1 second and shows verdicts grouped by project + verdict.
5. **Click "Open Case File"** to see narrative explanations per case.
6. (Optional) **Configure an AI reviewer** in the sidebar's "AI Reviewer" section, then click "Ask AI reviewer" on any card.

---

## Configuring the AI reviewer (optional)

The deterministic detective layer works without any AI. The AI reviewer is a
second opinion that verifies — or challenges — the deterministic verdict.

### Get an API key

| Provider | Where | Free tier |
|---|---|---|
| **Google Gemini** ⭐ recommended for testing | https://aistudio.google.com/apikey | ✅ Generous free tier — `gemini-2.5-flash` up to ~1,500 requests/day |
| **OpenAI** | https://platform.openai.com/api-keys | ❌ Pay-per-use, but `gpt-4o-mini` is ~$0.001 per card |
| **Anthropic Claude** | https://console.anthropic.com/settings/keys | ❌ Pay-per-use, `claude-3-5-haiku-latest` ~$0.005 per card |

### Add the key

1. Open the Test Inspector sidebar (Activity Bar icon)
2. In the **AI Reviewer** section:
   - Pick your **Provider** from the dropdown
   - Pick a **Model** (defaults are sensible per provider)
   - Paste your API key into the **API key** field
   - Click **Save** — the extension tests the key automatically
3. You'll see ✅ Ready if the key works, or ✗ with the error if it doesn't.

API keys are stored in VS Code's encrypted SecretStorage. They are **never**:
- written to `settings.json`
- logged to the OutputChannel
- sent to the webview after storing
- included in Markdown exports

### Use it

On any case in the Case File panel, click **Ask AI reviewer**. The extension:

1. Sends the case file (verdict + signals) + the target file content + up to 3 related files to the configured provider
2. Asks for a strict JSON response with line citations
3. **Verifies every cited line:excerpt against the actual file** before showing it
4. Shows the verified explanation, anchors, and suggested fix inline in the card
5. Reports how many anchors were dropped because they couldn't be verified (the trust signal)

### Anti-hallucination contract

The LLM is constrained at five layers:

1. **Strict JSON output** — non-JSON responses are rejected with a fallback regex-extract of the prose explanation only
2. **Line-anchored claims** — every claim must cite `{lineNumber, excerpt, issue}`
3. **Verification** — the excerpt must appear at the cited line in the actual file content, or the anchor is silently dropped
4. **Verdict locked** — the LLM can AGREE or CHALLENGE the deterministic verdict but cannot replace it; the deterministic case file remains authoritative
5. **User-explicit per-card** — never auto-runs; you click "Ask AI reviewer" on the card you care about

---

## Commands

Open via `Cmd+Shift+P` / `Ctrl+Shift+P`.

| Command | What it does |
|---|---|
| `Test Inspector: Open Case File` | Opens the Case File panel as an editor tab |
| `Test Inspector: Refresh` | Re-scans the workspace (also auto-runs on first sidebar open) |
| `Test Inspector: Configure LLM (optional reviewer)` | Legacy QuickPick wizard — the sidebar form is preferred |
| `Test Inspector: Run Tests in Current File` | Runs the test command for the active file (Phase C wiring) |
| `Test Inspector: Export Case File` | Saves the current Case File as a Markdown report |

---

## Settings reference

| Key | Default | Purpose |
|---|---|---|
| `testInspector.slowTestThresholdMs` | `1000` | Flag tests slower than this in the future runner integration |
| `testInspector.maxWorkspaceFiles` | `8000` | Cap on files scanned per workspace folder (prevents runaway scans on huge monorepos) |
| `testInspector.llm.provider` | `none` | One of: `none`, `openai`, `claude`, `gemini` |
| `testInspector.llm.model` | `""` | Per-provider model. Empty falls back to the provider's default |
| `testInspector.llm.openaiBaseUrl` | `https://api.openai.com/v1` | Override for Azure OpenAI, OpenRouter, etc. |
| `testInspector.llm.claudeBaseUrl` | (default) | Override Anthropic base URL |
| `testInspector.llm.geminiBaseUrl` | (default) | Override Gemini base URL |

Per-provider API keys live in VS Code SecretStorage under the keys
`testInspector.llm.<provider>.apiKey`. They are not exposed in `settings.json`.

---

## Update

The install script always builds from the current source — so to update,
just `git pull` and re-run it:

```bash
cd test-inspector
git pull origin main
./scripts/install.sh
```

Then in your VS Code window: `Cmd+Shift+P → Developer: Reload Window`
(or quit + reopen the window) so VS Code picks up the new bytecode.

You can verify the new version is loaded by looking at the OUTPUT panel
(`Cmd+Shift+P → View: Toggle Output → "Test Inspector"` filter). The first
line on activation is `[activate] Test Inspector <version> activated`.

---

## Uninstall

```bash
code --uninstall-extension local.test-inspector
```

Then optionally remove the locally-tracked review state from any project
you scanned:

```bash
# In each workspace where you scanned:
rm -rf .test-inspector
```

(Add `.test-inspector/` to your project's `.gitignore` if you scanned a
project regularly — the folder holds `reviewed.json` with the content
hashes of cards you marked as reviewed.)

---

## How it works (30 seconds)

```
┌────────────────────────────────────────────────────────────────────────┐
│                         VS Code Extension Host                         │
│                                                                        │
│  Activity Bar icon                                                     │
│         │                                                              │
│         ▼                                                              │
│  ┌──────────────────────┐    ┌───────────────────────────┐             │
│  │  Cases sidebar tree  │    │  AI Reviewer sidebar      │             │
│  │  (per-project,       │    │  (provider / model / key) │             │
│  │   per-verdict)       │    └───────────────────────────┘             │
│  └─────────┬────────────┘                                              │
│            │                                                           │
│            ▼                                                           │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │  Case File webview                                             │    │
│  │  ┌──────────────────────────────────────────────────────┐      │    │
│  │  │ KPI tiles (Theater · Weak · Missing · Strong)        │      │    │
│  │  │ Project tabs · Filter pills                          │      │    │
│  │  └──────────────────────────────────────────────────────┘      │    │
│  │  ┌──────────────────────────────────────────────────────┐      │    │
│  │  │ 🔴 THEATER  flutter  test/auth_state_test.dart       │      │    │
│  │  │ auth_state_test.dart — 2 trivial-assertion signals   │      │    │
│  │  │ Theater test: the assertions are tautological…       │      │    │
│  │  │ [Open file] [Copy] [Ask AI reviewer] [Evidence] …    │      │    │
│  │  └──────────────────────────────────────────────────────┘      │    │
│  └────────────────────────────────────────────────────────────────┘    │
└────────────────────────────────────────────────────────────────────────┘
       │                              │
       ▼                              ▼
   Local filesystem +       Optional OpenAI-compatible /
   `git` CLI                Anthropic / Gemini HTTPS endpoint
                            (API key in SecretStorage)
```

The deterministic detective layer:

1. **Adapter detection** — each framework's adapter finds projects in the workspace
2. **Static discovery** — regex / AST parsing finds test files and test cases (no test execution)
3. **Quality heuristics** — pattern detectors per language for trivial assertions, mock-only tests, render-only widgets, vague titles, etc.
4. **Source-risk scoring** — criticality keywords + coverage + related-test count → which source files matter most
5. **Synthesis** — combine signals into a per-file verdict (`THEATER` ≥ 60 weight / `WEAK` 1–59 / `STRONG` 0) plus a one-paragraph narrative explanation

The optional AI reviewer:

6. **Grounded prompt** — sends the deterministic verdict + signals + the actual file content (line-numbered) to the configured provider
7. **Structured JSON response** — strict schema with line-anchored citations
8. **Verification** — every cited line:excerpt is checked against the file content; fabricated ones are dropped
9. **Display** — verified explanation + suggested fix, with the "X dropped" trust signal visible

---

## Contributing

We follow Git Flow — `main` is sacred, all feature work branches from
`develop`. See [CONTRIBUTING.md](./CONTRIBUTING.md) for the full workflow
(branch model, semver rules, PR template, code conventions, bug reporting).

Code owners are defined in [.github/CODEOWNERS](./.github/CODEOWNERS).

### Development quick start

```bash
git clone https://github.com/da0101/test-inspector.git
cd test-inspector
npm install
npm test                   # 68 unit tests, all stack-aware
```

Then in VS Code:

- Open the repo
- Press `F5` → launches an Extension Development Host with the extension loaded
- Open any project in the EDH window and click the Test Inspector icon

### Project layout

```
src/
├── extension.ts            extension entry, command registration, refresh pipeline
├── adapters/               per-framework adapters (react, flutter, python, firebase)
├── services/
│   ├── caseFile.ts         verdict synthesis (THEATER/WEAK/MISSING/STRONG)
│   ├── quality.ts          test-quality heuristics
│   ├── sourceRisk.ts       criticality scoring
│   ├── reviewed.ts         content-hash store for Mark Reviewed
│   ├── exportMarkdown.ts   Case File Markdown export
│   ├── heuristics/         LLM-pattern detectors (mocks-unit, mock-only, vague-title)
│   └── llm/                provider abstraction + anti-hallucination prompt
├── views/
│   ├── caseFile/           webview (template split: constants, icons, render, script, style)
│   ├── reviewer/           AI Reviewer sidebar webview
│   └── casesView.ts        sidebar tree
test/
├── fixtures/<stack>/       sample workspaces per stack
└── unit/                   `node --test` specs (68 total)
```

---

## Roadmap

See [ROADMAP.md](./ROADMAP.md) for the phased backlog. Highlights of what's
still planned:

- Vue.js first-class adapter
- AST-based heuristics (currently regex)
- Istanbul JSON, Vitest, Flutter URI normalization for coverage
- Persistence + scan-over-time trend
- esbuild bundler for smaller VSIX and faster cold start
- Public Marketplace listing
- LLM "Reviewer notes" co-worker panel (cross-card pattern detection)

---

## License

[MIT](./LICENSE) © 2026 Danil Ulmashev

Test Inspector is open source. Contributions welcome — please read
[CONTRIBUTING.md](./CONTRIBUTING.md) first.

---

## Acknowledgements

- Built around the product thesis that **tests that exist are not the same as tests that prove behavior** — particularly true now that LLM-generated tests are a growing share of every test suite
- Anti-hallucination design inspired by retrieval-augmented patterns: ground the model in the actual artifact, verify every claim, never let the model speak unsupported

---

## Reporting issues

Open an issue at https://github.com/da0101/test-inspector/issues with:

- Test Inspector version (visible in `[activate]` line of the OUTPUT panel)
- VS Code version + OS
- A short reproduction (which framework, what verdict was wrong, what you expected)
- The relevant snippet from the `Test Inspector` OUTPUT channel
- If LLM-related: which provider + model, and the dropped-anchor count
