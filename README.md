# Test Inspector

Local-first VS Code extension for understanding test inventory, coverage, quality findings, and changed-file risk across the daily stack this repo targets first:

- React: Jest, Vitest, React Testing Library, LCOV/Istanbul output
- Flutter: `flutter test`, `flutter test --coverage`, `coverage/lcov.info`
- Django: pytest-django or Django runner, coverage.py XML/JSON
- FastAPI: pytest, coverage.py XML/JSON
- Firebase Functions: Jest/Mocha-style projects under `functions/`, Istanbul/LCOV

## MVP Features

- Activity Bar container with Projects, Tests, Coverage, Quality, and Changed Files views.
- Dashboard editor with KPIs, coverage bar, project inventory, changed-file risk, and quality findings.
- Adapter-based framework detection.
- Static test discovery for common file patterns.
- Quality findings for skipped/focused tests, weak/no assertions, and snapshot-only JS tests.
- LCOV and coverage.py XML/JSON parsers.
- Git changed-file analysis with likely related tests and recommended commands.
- Commands for refresh, discovery, running tests, reading coverage, changed-file risk, and Markdown report export.
- Unit tests for detection, parsers, changed-file mapping, and report rendering.

## Commands

- `Test Inspector: Refresh Projects`
- `Test Inspector: Refresh All`
- `Test Inspector: Open Dashboard`
- `Test Inspector: Discover Tests`
- `Test Inspector: Run All Tests`
- `Test Inspector: Run Tests In Current File`
- `Test Inspector: Run Related Tests For Current File`
- `Test Inspector: Generate Coverage Report`
- `Test Inspector: Show Changed File Test Risk`
- `Test Inspector: Export Test Report`

## Development

```bash
npm install
npm test
```

Press `F5` in VS Code to launch an Extension Development Host.

## Roadmap

The product roadmap and implementation checklist live in [ROADMAP.md](./ROADMAP.md). Use that file as the working backlog for the next slices of Test Inspector.

## Limitations

This first version is intentionally local and deterministic. It does not include an LLM layer, full import-graph analysis, flaky-test detection, or a custom webview dashboard. Python test result parsing is conservative in the MVP: pytest/Django commands run locally, while detailed test case inventory comes from static discovery unless a supported report parser is added later.
