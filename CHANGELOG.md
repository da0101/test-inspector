# Changelog

All notable changes to Test Inspector are documented here.

## [1.2.0] — 2026-05-18

### Fixed
- Dashboard header no longer blocks scrolling — `position: sticky` removed; the full page scrolls as one unit
- KPI tile buttons no longer overflow the panel at narrow widths (`min-width: 0`, `overflow-x: hidden` added)
- Responsive breakpoints added for hero padding, runtime strip, and KPI grid at ≤560 px and ≤400 px

### Added
- **Guide tab** — metric definitions moved out of the sticky header into a dedicated "Guide" tab; clicking any project tab restores the normal case view; tab state persists across re-renders
- **Coverage error banners** — when ♥︎ Generate Coverage fails, an inline amber callout appears in the dashboard with a human-readable explanation and actionable steps, covering three failure modes:
  - No coverage script found (framework-specific setup instructions per React / Node / Flutter / Django / FastAPI)
  - Coverage command exited non-zero (stderr snippet or "no output" guidance)
  - Command succeeded but no output file was found (lists expected file locations)
- **Ask AI to explain** — each coverage error banner has an "Ask AI to explain this" button that calls the configured LLM provider (OpenAI / Claude / Gemini) and displays a plain-English diagnosis + fix in the dashboard; gracefully degrades if no API key is configured

### Changed
- Runtime metrics strip moved from the sticky hero into the scrollable content area, reducing hero height significantly on narrow panels
- Coverage error toasts now include an "Open Output" action button instead of the generic VS Code error dialog

## [1.1.0] — 2026-05-16

### Added
- Branch / worktree feature targeting — filter the Case File to only cases relevant to the current Git feature branch
- Scope line in the dashboard showing active repo, branch, and feature label

## [1.0.0] — 2026-05-01

Initial release.
