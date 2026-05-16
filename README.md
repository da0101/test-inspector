# Test Inspector

Local-first VS Code extension for understanding test inventory, coverage, quality findings, and changed-file risk across the daily stack this repo targets first:

- React: Jest, Vitest, React Testing Library, LCOV/Istanbul output
- Flutter: `flutter test`, `flutter test --coverage`, `coverage/lcov.info`
- Django: pytest-django or Django runner, coverage.py XML/JSON
- FastAPI: pytest, coverage.py XML/JSON
- Firebase Functions: Jest/Mocha-style projects under `functions/`, Istanbul/LCOV

## Current Features

- Activity Bar container with a Case File view.
- Case File panel that names theater, weak, missing, and strong tests.
- Adapter-based framework detection.
- Static test discovery for common file patterns.
- Quality findings for skipped/focused tests, weak/no assertions, and snapshot-only JS tests.
- LCOV and coverage.py XML/JSON parsers.
- Git changed-file analysis with likely related tests and recommended commands.
- Optional AI reviewer for OpenAI, Claude, or Gemini.
  - API keys are stored in VS Code SecretStorage.
  - Keys are entered with hidden input and can be replaced or deleted.
  - Code is sent only after explicit confirmation.
  - AI claims are shown only after line/excerpt anchors are verified against the real file content.
- Commands for refresh, opening the Case File, configuring the optional reviewer, and Markdown export.
- Unit tests for detection, parsers, changed-file mapping, and report rendering.

## Commands

- `Test Inspector: Refresh`
- `Test Inspector: Open Case File`
- `Test Inspector: Configure LLM (optional reviewer)`
- `Test Inspector: Run Tests In Current File`
- `Test Inspector: Export Case File`

## Development

```bash
npm install
npm test
```

Press `F5` in VS Code to launch an Extension Development Host.

## Roadmap

The product roadmap and implementation checklist live in [ROADMAP.md](./ROADMAP.md). Use that file as the working backlog for the next slices of Test Inspector.

## Limitations

The deterministic Case File remains the source of truth. The optional AI reviewer can explain or challenge a verdict, but its output is constrained: unverified line anchors are dropped, uncertainty is displayed, and suggested fixes are treated as advisory. Python test result parsing is conservative: pytest/Django commands run locally, while detailed test case inventory comes from static discovery unless a supported report parser is added later.
