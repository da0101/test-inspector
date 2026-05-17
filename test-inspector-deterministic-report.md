# Test Inspector — Deterministic Report

_Generated: 2026-05-17T14:55:22.664Z_
_Mode: Deterministic_

## Scope

- **Feature:** All features

## Summary

- **Included groups:** 🟡 Weak, 🟢 Strong
- **Projects detected:** 1
- **Test files:** 37
- **Test cases discovered:** 181
- **Coverage summaries:** 1
- **Average line coverage:** 87.7%
- **Average branch coverage:** 72.1%
- **Average function coverage:** 76.4%
- **🔴 Theater**: 0
- **🟡 Weak**: 24
- **⚪ Missing**: 0
- **🟢 Strong**: 37

### Coverage by project

| Project | Lines | Branches | Functions | Statements | Files |
|---|---:|---:|---:|---:|---:|
| Node.js project: test-inspector | 87.7% | 72.1% | 76.4% | unknown | 64 |

## 🟡 Weak (24)

### `src/extension.ts`
- **Project:** Node.js project: test-inspector (Node.js)
- **Headline:** extension.ts — critical code with untested branches/functions
- **Why:** This file is critical (stateful UI logic, async/error handling, exported public surface, branching behavior) and the latest coverage shows weak branch/function evidence. Existing tests reach the file, but they do not prove enough alternate outcomes. Add cases for the skipped decisions and unreached functions.
- **Suggestion:** Review related tests for meaningful assertions and edge cases. Start with: Mock VS Code flows for untrusted workspace, missing workspace folders, missing coverage plan, failed coverage run, and current-file run failures.
- **Evidence:**
  - `high-criticality` (weight 24) — stateful UI logic, async/error handling, exported public surface, branching behavior
  - `low-branch-coverage` (weight 18) — 43% branch coverage — alternate paths need tests
  - `low-function-coverage` (weight 12) — 39% function coverage — some functions are unreached
- **Suggested test gaps:**
  - **IMPORTANT** extension.ts: failure path needs a test — Async/API code usually has success and failure outcomes; the current evidence does not show enough branch coverage for the failure side.
    - Suggested test: Mock VS Code flows for untrusted workspace, missing workspace folders, missing coverage plan, failed coverage run, and current-file run failures.
    - Evidence: 62.2% line coverage; risk signals: stateful UI logic, async/error handling, exported public surface; 42.6% branches coverage
  - **IMPORTANT** extension.ts: alternate branches are not proven — The source contains decision paths, but branch coverage says not enough of those choices ran during tests.
    - Suggested test: Cover command registration branches for scan, coverage, current-file run, report generation, and target publishing.
    - Evidence: 62.2% line coverage; risk signals: stateful UI logic, async/error handling, exported public surface; 42.6% branches coverage
  - **IMPORTANT** extension.ts: exported functions are not all reached — Some functions in this file did not run during the latest coverage pass.
    - Suggested test: Add activation-level tests that exercise each exported command callback through the mocked VS Code API.
    - Evidence: 62.2% line coverage; risk signals: stateful UI logic, async/error handling, exported public surface; 38.9% functions coverage

### `src/services/aiReviewController.ts`
- **Project:** Node.js project: test-inspector (Node.js)
- **Headline:** aiReviewController.ts — critical code with untested branches/functions
- **Why:** This file is critical (API/data flow, form/validation logic, stateful UI logic, async/error handling) and the latest coverage shows weak branch/function evidence. Existing tests reach the file, but they do not prove enough alternate outcomes. Add cases for the skipped decisions and unreached functions.
- **Suggestion:** Review related tests for meaningful assertions and edge cases. Start with: Mock provider enrichment failure and unreadable target/related files; assert the AI review returns an error card without changing the deterministic verdict.
- **Evidence:**
  - `high-criticality` (weight 30) — API/data flow, form/validation logic, stateful UI logic, async/error handling, exported public surface, branching behavior
  - `low-branch-coverage` (weight 18) — 63% branch coverage — alternate paths need tests
  - `low-function-coverage` (weight 12) — 69% function coverage — some functions are unreached
- **Suggested test gaps:**
  - **IMPORTANT** aiReviewController.ts: failure path needs a test — Async/API code usually has success and failure outcomes; the current evidence does not show enough branch coverage for the failure side.
    - Suggested test: Mock provider enrichment failure and unreadable target/related files; assert the AI review returns an error card without changing the deterministic verdict.
    - Evidence: 85.9% line coverage; risk signals: API/data flow, form/validation logic, stateful UI logic; 63.2% branches coverage
  - **IMPORTANT** aiReviewController.ts: guard/validation cases are missing — Guard code is where invalid input, permissions, and auth state are accepted or rejected.
    - Suggested test: Test no provider, unconfigured provider, and user-cancelled confirmation paths.
    - Evidence: 85.9% line coverage; risk signals: API/data flow, form/validation logic, stateful UI logic; 63.2% branches coverage
  - **USEFUL** aiReviewController.ts: alternate branches are not proven — The source contains decision paths, but branch coverage says not enough of those choices ran during tests.
    - Suggested test: Cover accepted review, challenged review, provider error, cancelled send, and related-file fallback branches.
    - Evidence: 85.9% line coverage; risk signals: API/data flow, form/validation logic, stateful UI logic; 63.2% branches coverage
  - **USEFUL** aiReviewController.ts: exported functions are not all reached — Some functions in this file did not run during the latest coverage pass.
    - Suggested test: Add focused tests for configure flow actions and AI review creation paths.
    - Evidence: 85.9% line coverage; risk signals: API/data flow, form/validation logic, stateful UI logic; 68.8% functions coverage

### `src/services/llm/enrich.ts`
- **Project:** Node.js project: test-inspector (Node.js)
- **Headline:** enrich.ts — critical code with untested branches/functions
- **Why:** This file is critical (API/data flow, form/validation logic, stateful UI logic, async/error handling) and the latest coverage shows weak branch/function evidence. Existing tests reach the file, but they do not prove enough alternate outcomes. Add cases for the skipped decisions and unreached functions.
- **Suggestion:** Review related tests for meaningful assertions and edge cases. Start with: Feed invalid JSON, truncated JSON, fabricated anchors, and provider errors; assert deterministic fallback/error output and dropped-anchor counts.
- **Evidence:**
  - `high-criticality` (weight 30) — API/data flow, form/validation logic, stateful UI logic, async/error handling, exported public surface, branching behavior
  - `low-branch-coverage` (weight 18) — 63% branch coverage — alternate paths need tests
- **Suggested test gaps:**
  - **IMPORTANT** enrich.ts: failure path needs a test — Async/API code usually has success and failure outcomes; the current evidence does not show enough branch coverage for the failure side.
    - Suggested test: Feed invalid JSON, truncated JSON, fabricated anchors, and provider errors; assert deterministic fallback/error output and dropped-anchor counts.
    - Evidence: 93.9% line coverage; risk signals: API/data flow, form/validation logic, stateful UI logic; 62.7% branches coverage
  - **IMPORTANT** enrich.ts: guard/validation cases are missing — Guard code is where invalid input, permissions, and auth state are accepted or rejected.
    - Suggested test: Test missing explanation, non-object responses, out-of-range line numbers, empty excerpts, and uncertain responses.
    - Evidence: 93.9% line coverage; risk signals: API/data flow, form/validation logic, stateful UI logic; 62.7% branches coverage
  - **USEFUL** enrich.ts: alternate branches are not proven — The source contains decision paths, but branch coverage says not enough of those choices ran during tests.
    - Suggested test: Cover direct JSON parse, fenced JSON, prose-wrapped JSON, tolerant truncated explanation extraction, and rejected malformed output.
    - Evidence: 93.9% line coverage; risk signals: API/data flow, form/validation logic, stateful UI logic; 62.7% branches coverage

### `src/services/reportController.ts`
- **Project:** Node.js project: test-inspector (Node.js)
- **Headline:** reportController.ts — critical code with untested branches/functions
- **Why:** This file is critical (API/data flow, stateful UI logic, async/error handling, branching behavior) and the latest coverage shows weak branch/function evidence. Existing tests reach the file, but they do not prove enough alternate outcomes. Add cases for the skipped decisions and unreached functions.
- **Suggestion:** Review related tests for meaningful assertions and edge cases. Start with: Mock report write and AI review failures; assert deterministic reports still preserve local findings and surface AI errors separately.
- **Evidence:**
  - `high-criticality` (weight 24) — API/data flow, stateful UI logic, async/error handling, branching behavior
  - `low-branch-coverage` (weight 18) — 65% branch coverage — alternate paths need tests
- **Suggested test gaps:**
  - **IMPORTANT** reportController.ts: failure path needs a test — Async/API code usually has success and failure outcomes; the current evidence does not show enough branch coverage for the failure side.
    - Suggested test: Mock report write and AI review failures; assert deterministic reports still preserve local findings and surface AI errors separately.
    - Evidence: 82.7% line coverage; risk signals: API/data flow, stateful UI logic, async/error handling; 65% branches coverage
  - **USEFUL** reportController.ts: alternate branches are not proven — The source contains decision paths, but branch coverage says not enough of those choices ran during tests.
    - Suggested test: Cover deterministic export, AI export, save cancellation, write failure, and partial AI review error branches.
    - Evidence: 82.7% line coverage; risk signals: API/data flow, stateful UI logic, async/error handling; 65% branches coverage

### `src/views/reports/panel.ts`
- **Project:** Node.js project: test-inspector (Node.js)
- **Headline:** panel.ts — critical code with untested branches/functions
- **Why:** This file is critical (stateful UI logic, async/error handling, exported public surface, branching behavior) and the latest coverage shows weak branch/function evidence. Existing tests reach the file, but they do not prove enough alternate outcomes. Add cases for the skipped decisions and unreached functions.
- **Suggestion:** Review related tests for meaningful assertions and edge cases. Start with: Mock webview messages that throw or cancel async work; assert the panel posts safe error/progress state and keeps the webview alive.
- **Evidence:**
  - `high-criticality` (weight 24) — stateful UI logic, async/error handling, exported public surface, branching behavior
  - `low-branch-coverage` (weight 18) — 66% branch coverage — alternate paths need tests
- **Suggested test gaps:**
  - **IMPORTANT** panel.ts: failure path needs a test — Async/API code usually has success and failure outcomes; the current evidence does not show enough branch coverage for the failure side.
    - Suggested test: Mock webview messages that throw or cancel async work; assert the panel posts safe error/progress state and keeps the webview alive.
    - Evidence: 83.6% line coverage; risk signals: stateful UI logic, async/error handling, exported public surface; 65.9% branches coverage
  - **USEFUL** panel.ts: alternate branches are not proven — The source contains decision paths, but branch coverage says not enough of those choices ran during tests.
    - Suggested test: Cover supported message commands, unknown messages, initial render, dispose/recreate, and progress callback branches.
    - Evidence: 83.6% line coverage; risk signals: stateful UI logic, async/error handling, exported public surface; 65.9% branches coverage
  - **USEFUL** panel.ts: exported functions are not all reached — Some functions in this file did not run during the latest coverage pass.
    - Suggested test: Add focused tests for panel message routing and webview update state.
    - Evidence: 83.6% line coverage; risk signals: stateful UI logic, async/error handling, exported public surface; 76.2% functions coverage

### `src/services/llm/http.ts`
- **Project:** Node.js project: test-inspector (Node.js)
- **Headline:** http.ts — critical code with untested branches/functions
- **Why:** This file is critical (API/data flow, async/error handling, exported public surface, branching behavior) and the latest coverage shows weak branch/function evidence. Existing tests reach the file, but they do not prove enough alternate outcomes. Add cases for the skipped decisions and unreached functions.
- **Suggestion:** Review related tests for meaningful assertions and edge cases. Start with: Use a local HTTP server to return non-2xx, timeout, and aborted requests; assert the helper rejects or returns the exact status/body.
- **Evidence:**
  - `high-criticality` (weight 24) — API/data flow, async/error handling, exported public surface, branching behavior
  - `low-function-coverage` (weight 12) — 69% function coverage — some functions are unreached
- **Suggested test gaps:**
  - **IMPORTANT** http.ts: failure path needs a test — Async/API code usually has success and failure outcomes; the current evidence does not show enough branch coverage for the failure side.
    - Suggested test: Use a local HTTP server to return non-2xx, timeout, and aborted requests; assert the helper rejects or returns the exact status/body.
    - Evidence: 89.8% line coverage; risk signals: API/data flow, async/error handling, exported public surface; 76.3% branches coverage
  - **USEFUL** http.ts: alternate branches are not proven — The source contains decision paths, but branch coverage says not enough of those choices ran during tests.
    - Suggested test: Cover HTTPS, localhost HTTP, rejected remote HTTP, POST body length, timeout, and abort-signal branches.
    - Evidence: 89.8% line coverage; risk signals: API/data flow, async/error handling, exported public surface; 76.3% branches coverage
  - **USEFUL** http.ts: exported functions are not all reached — Some functions in this file did not run during the latest coverage pass.
    - Suggested test: Add focused tests around request construction, response collection, timeout handling, and abort handling.
    - Evidence: 89.8% line coverage; risk signals: API/data flow, async/error handling, exported public surface; 68.8% functions coverage

### `src/adapters/firebase.ts`
- **Project:** Node.js project: test-inspector (Node.js)
- **Headline:** firebase.ts — critical code with untested branches/functions
- **Why:** This file is critical (async/error handling, exported public surface, branching behavior) and the latest coverage shows weak branch/function evidence. Existing tests reach the file, but they do not prove enough alternate outcomes. Add cases for the skipped decisions and unreached functions.
- **Suggestion:** Review related tests for meaningful assertions and edge cases. Start with: Simulate a rejected dependency or failed response and assert the controlled error, cleanup, and no partial write/state.
- **Evidence:**
  - `high-criticality` (weight 18) — async/error handling, exported public surface, branching behavior
  - `low-branch-coverage` (weight 18) — 55% branch coverage — alternate paths need tests
  - `low-function-coverage` (weight 12) — 69% function coverage — some functions are unreached
- **Suggested test gaps:**
  - **IMPORTANT** firebase.ts: failure path needs a test — Async/API code usually has success and failure outcomes; the current evidence does not show enough branch coverage for the failure side.
    - Suggested test: Simulate a rejected dependency or failed response and assert the controlled error, cleanup, and no partial write/state.
    - Evidence: 82.9% line coverage; risk signals: async/error handling, exported public surface, branching behavior; 55% branches coverage
  - **USEFUL** firebase.ts: alternate branches are not proven — The source contains decision paths, but branch coverage says not enough of those choices ran during tests.
    - Suggested test: Add table-driven cases for each meaningful if/switch outcome, including the default or fallback path.
    - Evidence: 82.9% line coverage; risk signals: async/error handling, exported public surface, branching behavior; 55% branches coverage
  - **USEFUL** firebase.ts: exported functions are not all reached — Some functions in this file did not run during the latest coverage pass.
    - Suggested test: Add focused tests for the unreached function behavior, starting with public exports and error-returning helpers.
    - Evidence: 82.9% line coverage; risk signals: async/error handling, exported public surface, branching behavior; 69.2% functions coverage

### `src/services/caseFileScanner.ts`
- **Project:** Node.js project: test-inspector (Node.js)
- **Headline:** caseFileScanner.ts — critical code with untested branches/functions
- **Why:** This file is critical (async/error handling, exported public surface, branching behavior) and the latest coverage shows weak branch/function evidence. Existing tests reach the file, but they do not prove enough alternate outcomes. Add cases for the skipped decisions and unreached functions.
- **Suggestion:** Review related tests for meaningful assertions and edge cases. Start with: Simulate a rejected dependency or failed response and assert the controlled error, cleanup, and no partial write/state.
- **Evidence:**
  - `high-criticality` (weight 18) — async/error handling, exported public surface, branching behavior
  - `low-branch-coverage` (weight 18) — 58% branch coverage — alternate paths need tests
- **Suggested test gaps:**
  - **IMPORTANT** caseFileScanner.ts: failure path needs a test — Async/API code usually has success and failure outcomes; the current evidence does not show enough branch coverage for the failure side.
    - Suggested test: Simulate a rejected dependency or failed response and assert the controlled error, cleanup, and no partial write/state.
    - Evidence: 66.9% line coverage; risk signals: async/error handling, exported public surface, branching behavior; 58.3% branches coverage
  - **USEFUL** caseFileScanner.ts: alternate branches are not proven — The source contains decision paths, but branch coverage says not enough of those choices ran during tests.
    - Suggested test: Add table-driven cases for each meaningful if/switch outcome, including the default or fallback path.
    - Evidence: 66.9% line coverage; risk signals: async/error handling, exported public surface, branching behavior; 58.3% branches coverage
  - **USEFUL** caseFileScanner.ts: exported functions are not all reached — Some functions in this file did not run during the latest coverage pass.
    - Suggested test: Add focused tests for the unreached function behavior, starting with public exports and error-returning helpers.
    - Evidence: 66.9% line coverage; risk signals: async/error handling, exported public surface, branching behavior; 70.8% functions coverage

### `src/views/casesView.ts`
- **Project:** Node.js project: test-inspector (Node.js)
- **Headline:** casesView.ts — critical code with untested branches/functions
- **Why:** This file is critical (exported public surface, branching behavior) and the latest coverage shows weak branch/function evidence. Existing tests reach the file, but they do not prove enough alternate outcomes. Add cases for the skipped decisions and unreached functions.
- **Suggestion:** Review related tests for meaningful assertions and edge cases. Start with: Add table-driven cases for each meaningful if/switch outcome, including the default or fallback path.
- **Evidence:**
  - `high-criticality` (weight 12) — exported public surface, branching behavior
  - `low-branch-coverage` (weight 18) — 60% branch coverage — alternate paths need tests
  - `low-function-coverage` (weight 12) — 67% function coverage — some functions are unreached
- **Suggested test gaps:**
  - **USEFUL** casesView.ts: alternate branches are not proven — The source contains decision paths, but branch coverage says not enough of those choices ran during tests.
    - Suggested test: Add table-driven cases for each meaningful if/switch outcome, including the default or fallback path.
    - Evidence: 72.2% line coverage; risk signals: exported public surface, branching behavior; 60% branches coverage
  - **USEFUL** casesView.ts: exported functions are not all reached — Some functions in this file did not run during the latest coverage pass.
    - Suggested test: Add focused tests for the unreached function behavior, starting with public exports and error-returning helpers.
    - Evidence: 72.2% line coverage; risk signals: exported public surface, branching behavior; 66.7% functions coverage

### `src/services/heuristics/vagueTitle.ts`
- **Project:** Node.js project: test-inspector (Node.js)
- **Headline:** vagueTitle.ts — critical code with untested branches/functions
- **Why:** This file is critical (API/data flow, exported public surface, branching behavior) and the latest coverage shows weak branch/function evidence. Existing tests reach the file, but they do not prove enough alternate outcomes. Add cases for the skipped decisions and unreached functions.
- **Suggestion:** Review related tests for meaningful assertions and edge cases. Start with: Simulate a rejected dependency or failed response and assert the controlled error, cleanup, and no partial write/state.
- **Evidence:**
  - `high-criticality` (weight 18) — API/data flow, exported public surface, branching behavior
  - `low-branch-coverage` (weight 18) — 67% branch coverage — alternate paths need tests
- **Suggested test gaps:**
  - **IMPORTANT** vagueTitle.ts: failure path needs a test — Async/API code usually has success and failure outcomes; the current evidence does not show enough branch coverage for the failure side.
    - Suggested test: Simulate a rejected dependency or failed response and assert the controlled error, cleanup, and no partial write/state.
    - Evidence: 96.1% line coverage; risk signals: API/data flow, exported public surface, branching behavior; 66.7% branches coverage
  - **USEFUL** vagueTitle.ts: alternate branches are not proven — The source contains decision paths, but branch coverage says not enough of those choices ran during tests.
    - Suggested test: Add table-driven cases for each meaningful if/switch outcome, including the default or fallback path.
    - Evidence: 96.1% line coverage; risk signals: API/data flow, exported public surface, branching behavior; 66.7% branches coverage

### `src/adapters/flutter.ts`
- **Project:** Node.js project: test-inspector (Node.js)
- **Headline:** flutter.ts — critical code with untested branches/functions
- **Why:** This file is critical (async/error handling, exported public surface, branching behavior) and the latest coverage shows weak branch/function evidence. Existing tests reach the file, but they do not prove enough alternate outcomes. Add cases for the skipped decisions and unreached functions.
- **Suggestion:** Review related tests for meaningful assertions and edge cases. Start with: Simulate a rejected dependency or failed response and assert the controlled error, cleanup, and no partial write/state.
- **Evidence:**
  - `high-criticality` (weight 18) — async/error handling, exported public surface, branching behavior
  - `low-branch-coverage` (weight 18) — 64% branch coverage — alternate paths need tests
- **Suggested test gaps:**
  - **IMPORTANT** flutter.ts: failure path needs a test — Async/API code usually has success and failure outcomes; the current evidence does not show enough branch coverage for the failure side.
    - Suggested test: Simulate a rejected dependency or failed response and assert the controlled error, cleanup, and no partial write/state.
    - Evidence: 88.9% line coverage; risk signals: async/error handling, exported public surface, branching behavior; 63.6% branches coverage
  - **USEFUL** flutter.ts: alternate branches are not proven — The source contains decision paths, but branch coverage says not enough of those choices ran during tests.
    - Suggested test: Add table-driven cases for each meaningful if/switch outcome, including the default or fallback path.
    - Evidence: 88.9% line coverage; risk signals: async/error handling, exported public surface, branching behavior; 63.6% branches coverage
  - **USEFUL** flutter.ts: exported functions are not all reached — Some functions in this file did not run during the latest coverage pass.
    - Suggested test: Add focused tests for the unreached function behavior, starting with public exports and error-returning helpers.
    - Evidence: 88.9% line coverage; risk signals: async/error handling, exported public surface, branching behavior; 78.6% functions coverage

### `src/adapters/python.ts`
- **Project:** Node.js project: test-inspector (Node.js)
- **Headline:** python.ts — critical code with untested branches/functions
- **Why:** This file is critical (async/error handling, exported public surface, branching behavior) and the latest coverage shows weak branch/function evidence. Existing tests reach the file, but they do not prove enough alternate outcomes. Add cases for the skipped decisions and unreached functions.
- **Suggestion:** Review related tests for meaningful assertions and edge cases. Start with: Simulate a rejected dependency or failed response and assert the controlled error, cleanup, and no partial write/state.
- **Evidence:**
  - `high-criticality` (weight 18) — async/error handling, exported public surface, branching behavior
  - `low-branch-coverage` (weight 18) — 63% branch coverage — alternate paths need tests
- **Suggested test gaps:**
  - **IMPORTANT** python.ts: failure path needs a test — Async/API code usually has success and failure outcomes; the current evidence does not show enough branch coverage for the failure side.
    - Suggested test: Simulate a rejected dependency or failed response and assert the controlled error, cleanup, and no partial write/state.
    - Evidence: 82.2% line coverage; risk signals: async/error handling, exported public surface, branching behavior; 63.3% branches coverage
  - **USEFUL** python.ts: alternate branches are not proven — The source contains decision paths, but branch coverage says not enough of those choices ran during tests.
    - Suggested test: Add table-driven cases for each meaningful if/switch outcome, including the default or fallback path.
    - Evidence: 82.2% line coverage; risk signals: async/error handling, exported public surface, branching behavior; 63.3% branches coverage
  - **USEFUL** python.ts: exported functions are not all reached — Some functions in this file did not run during the latest coverage pass.
    - Suggested test: Add focused tests for the unreached function behavior, starting with public exports and error-returning helpers.
    - Evidence: 82.2% line coverage; risk signals: async/error handling, exported public surface, branching behavior; 75.9% functions coverage

### `src/services/coverage.ts`
- **Project:** Node.js project: test-inspector (Node.js)
- **Headline:** coverage.ts — critical code with untested branches/functions
- **Why:** This file is critical (async/error handling, exported public surface, branching behavior) and the latest coverage shows weak branch/function evidence. Existing tests reach the file, but they do not prove enough alternate outcomes. Add cases for the skipped decisions and unreached functions.
- **Suggestion:** Review related tests for meaningful assertions and edge cases. Start with: Simulate a rejected dependency or failed response and assert the controlled error, cleanup, and no partial write/state.
- **Evidence:**
  - `high-criticality` (weight 18) — async/error handling, exported public surface, branching behavior
  - `low-branch-coverage` (weight 18) — 68% branch coverage — alternate paths need tests
- **Suggested test gaps:**
  - **IMPORTANT** coverage.ts: failure path needs a test — Async/API code usually has success and failure outcomes; the current evidence does not show enough branch coverage for the failure side.
    - Suggested test: Simulate a rejected dependency or failed response and assert the controlled error, cleanup, and no partial write/state.
    - Evidence: 86.2% line coverage; risk signals: async/error handling, exported public surface, branching behavior; 68% branches coverage
  - **USEFUL** coverage.ts: alternate branches are not proven — The source contains decision paths, but branch coverage says not enough of those choices ran during tests.
    - Suggested test: Add table-driven cases for each meaningful if/switch outcome, including the default or fallback path.
    - Evidence: 86.2% line coverage; risk signals: async/error handling, exported public surface, branching behavior; 68% branches coverage

### `src/services/git.ts`
- **Project:** Node.js project: test-inspector (Node.js)
- **Headline:** git.ts — critical code with untested branches/functions
- **Why:** This file is critical (async/error handling, exported public surface, branching behavior) and the latest coverage shows weak branch/function evidence. Existing tests reach the file, but they do not prove enough alternate outcomes. Add cases for the skipped decisions and unreached functions.
- **Suggestion:** Review related tests for meaningful assertions and edge cases. Start with: Simulate a rejected dependency or failed response and assert the controlled error, cleanup, and no partial write/state.
- **Evidence:**
  - `high-criticality` (weight 18) — async/error handling, exported public surface, branching behavior
  - `low-branch-coverage` (weight 18) — 66% branch coverage — alternate paths need tests
- **Suggested test gaps:**
  - **IMPORTANT** git.ts: failure path needs a test — Async/API code usually has success and failure outcomes; the current evidence does not show enough branch coverage for the failure side.
    - Suggested test: Simulate a rejected dependency or failed response and assert the controlled error, cleanup, and no partial write/state.
    - Evidence: 92.9% line coverage; risk signals: async/error handling, exported public surface, branching behavior; 66.1% branches coverage
  - **USEFUL** git.ts: alternate branches are not proven — The source contains decision paths, but branch coverage says not enough of those choices ran during tests.
    - Suggested test: Add table-driven cases for each meaningful if/switch outcome, including the default or fallback path.
    - Evidence: 92.9% line coverage; risk signals: async/error handling, exported public surface, branching behavior; 66.1% branches coverage

### `src/services/quality.ts`
- **Project:** Node.js project: test-inspector (Node.js)
- **Headline:** quality.ts — critical code with untested branches/functions
- **Why:** This file is critical (async/error handling, exported public surface, branching behavior) and the latest coverage shows weak branch/function evidence. Existing tests reach the file, but they do not prove enough alternate outcomes. Add cases for the skipped decisions and unreached functions.
- **Suggestion:** Review related tests for meaningful assertions and edge cases. Start with: Simulate a rejected dependency or failed response and assert the controlled error, cleanup, and no partial write/state.
- **Evidence:**
  - `high-criticality` (weight 18) — async/error handling, exported public surface, branching behavior
  - `low-branch-coverage` (weight 18) — 52% branch coverage — alternate paths need tests
- **Suggested test gaps:**
  - **IMPORTANT** quality.ts: failure path needs a test — Async/API code usually has success and failure outcomes; the current evidence does not show enough branch coverage for the failure side.
    - Suggested test: Simulate a rejected dependency or failed response and assert the controlled error, cleanup, and no partial write/state.
    - Evidence: 83% line coverage; risk signals: async/error handling, exported public surface, branching behavior; 52% branches coverage
  - **USEFUL** quality.ts: alternate branches are not proven — The source contains decision paths, but branch coverage says not enough of those choices ran during tests.
    - Suggested test: Add table-driven cases for each meaningful if/switch outcome, including the default or fallback path.
    - Evidence: 83% line coverage; risk signals: async/error handling, exported public surface, branching behavior; 52% branches coverage
  - **USEFUL** quality.ts: exported functions are not all reached — Some functions in this file did not run during the latest coverage pass.
    - Suggested test: Add focused tests for the unreached function behavior, starting with public exports and error-returning helpers.
    - Evidence: 83% line coverage; risk signals: async/error handling, exported public surface, branching behavior; 71.4% functions coverage

### `src/services/report.ts`
- **Project:** Node.js project: test-inspector (Node.js)
- **Headline:** report.ts — critical code with untested branches/functions
- **Why:** This file is critical (exported public surface, branching behavior) and the latest coverage shows weak branch/function evidence. Existing tests reach the file, but they do not prove enough alternate outcomes. Add cases for the skipped decisions and unreached functions.
- **Suggestion:** Review related tests for meaningful assertions and edge cases. Start with: Add table-driven cases for each meaningful if/switch outcome, including the default or fallback path.
- **Evidence:**
  - `high-criticality` (weight 12) — exported public surface, branching behavior
  - `low-branch-coverage` (weight 18) — 57% branch coverage — alternate paths need tests
  - `low-function-coverage` (weight 12) — 52% function coverage — some functions are unreached
- **Suggested test gaps:**
  - **USEFUL** report.ts: alternate branches are not proven — The source contains decision paths, but branch coverage says not enough of those choices ran during tests.
    - Suggested test: Add table-driven cases for each meaningful if/switch outcome, including the default or fallback path.
    - Evidence: 89.3% line coverage; risk signals: exported public surface, branching behavior; 57.1% branches coverage
  - **USEFUL** report.ts: exported functions are not all reached — Some functions in this file did not run during the latest coverage pass.
    - Suggested test: Add focused tests for the unreached function behavior, starting with public exports and error-returning helpers.
    - Evidence: 89.3% line coverage; risk signals: exported public surface, branching behavior; 51.9% functions coverage

### `src/views/targetsView.ts`
- **Project:** Node.js project: test-inspector (Node.js)
- **Headline:** targetsView.ts — critical code with untested branches/functions
- **Why:** This file is critical (exported public surface, branching behavior) and the latest coverage shows weak branch/function evidence. Existing tests reach the file, but they do not prove enough alternate outcomes. Add cases for the skipped decisions and unreached functions.
- **Suggestion:** Review related tests for meaningful assertions and edge cases. Start with: Add table-driven cases for each meaningful if/switch outcome, including the default or fallback path.
- **Evidence:**
  - `high-criticality` (weight 12) — exported public surface, branching behavior
  - `low-branch-coverage` (weight 18) — 52% branch coverage — alternate paths need tests
- **Suggested test gaps:**
  - **USEFUL** targetsView.ts: alternate branches are not proven — The source contains decision paths, but branch coverage says not enough of those choices ran during tests.
    - Suggested test: Add table-driven cases for each meaningful if/switch outcome, including the default or fallback path.
    - Evidence: 77.8% line coverage; risk signals: exported public surface, branching behavior; 51.6% branches coverage

### `src/services/state.ts`
- **Project:** Node.js project: test-inspector (Node.js)
- **Headline:** state.ts — critical code with untested branches/functions
- **Why:** This file is critical (exported public surface, branching behavior) and the latest coverage shows weak branch/function evidence. Existing tests reach the file, but they do not prove enough alternate outcomes. Add cases for the skipped decisions and unreached functions.
- **Suggestion:** Review related tests for meaningful assertions and edge cases. Start with: Add focused tests for the unreached function behavior, starting with public exports and error-returning helpers.
- **Evidence:**
  - `high-criticality` (weight 12) — exported public surface, branching behavior
  - `low-function-coverage` (weight 12) — 68% function coverage — some functions are unreached
- **Suggested test gaps:**
  - **USEFUL** state.ts: exported functions are not all reached — Some functions in this file did not run during the latest coverage pass.
    - Suggested test: Add focused tests for the unreached function behavior, starting with public exports and error-returning helpers.
    - Evidence: 78.3% line coverage; risk signals: exported public surface, branching behavior; 68.4% functions coverage

### `src/services/caseFileStory.ts`
- **Project:** Node.js project: test-inspector (Node.js)
- **Headline:** caseFileStory.ts — critical code with untested branches/functions
- **Why:** This file is critical (exported public surface, branching behavior) and the latest coverage shows weak branch/function evidence. Existing tests reach the file, but they do not prove enough alternate outcomes. Add cases for the skipped decisions and unreached functions.
- **Suggestion:** Review related tests for meaningful assertions and edge cases. Start with: Add table-driven cases for each meaningful if/switch outcome, including the default or fallback path.
- **Evidence:**
  - `high-criticality` (weight 12) — exported public surface, branching behavior
  - `low-branch-coverage` (weight 18) — 59% branch coverage — alternate paths need tests
- **Suggested test gaps:**
  - **USEFUL** caseFileStory.ts: alternate branches are not proven — The source contains decision paths, but branch coverage says not enough of those choices ran during tests.
    - Suggested test: Add table-driven cases for each meaningful if/switch outcome, including the default or fallback path.
    - Evidence: 88.9% line coverage; risk signals: exported public surface, branching behavior; 59.1% branches coverage
  - **USEFUL** caseFileStory.ts: exported functions are not all reached — Some functions in this file did not run during the latest coverage pass.
    - Suggested test: Add focused tests for the unreached function behavior, starting with public exports and error-returning helpers.
    - Evidence: 88.9% line coverage; risk signals: exported public surface, branching behavior; 72.7% functions coverage

### `src/services/heuristics/mocksUnit.ts`
- **Project:** Node.js project: test-inspector (Node.js)
- **Headline:** mocksUnit.ts — critical code with untested branches/functions
- **Why:** This file is critical (exported public surface, branching behavior) and the latest coverage shows weak branch/function evidence. Existing tests reach the file, but they do not prove enough alternate outcomes. Add cases for the skipped decisions and unreached functions.
- **Suggestion:** Review related tests for meaningful assertions and edge cases. Start with: Add table-driven cases for each meaningful if/switch outcome, including the default or fallback path.
- **Evidence:**
  - `high-criticality` (weight 12) — exported public surface, branching behavior
  - `low-branch-coverage` (weight 18) — 67% branch coverage — alternate paths need tests
- **Suggested test gaps:**
  - **USEFUL** mocksUnit.ts: alternate branches are not proven — The source contains decision paths, but branch coverage says not enough of those choices ran during tests.
    - Suggested test: Add table-driven cases for each meaningful if/switch outcome, including the default or fallback path.
    - Evidence: 87.3% line coverage; risk signals: exported public surface, branching behavior; 66.7% branches coverage
  - **USEFUL** mocksUnit.ts: exported functions are not all reached — Some functions in this file did not run during the latest coverage pass.
    - Suggested test: Add focused tests for the unreached function behavior, starting with public exports and error-returning helpers.
    - Evidence: 87.3% line coverage; risk signals: exported public surface, branching behavior; 75% functions coverage

### `src/services/llm/registry.ts`
- **Project:** Node.js project: test-inspector (Node.js)
- **Headline:** registry.ts — critical code with untested branches/functions
- **Why:** This file is critical (exported public surface, branching behavior) and the latest coverage shows weak branch/function evidence. Existing tests reach the file, but they do not prove enough alternate outcomes. Add cases for the skipped decisions and unreached functions.
- **Suggestion:** Review related tests for meaningful assertions and edge cases. Start with: Add table-driven cases for each meaningful if/switch outcome, including the default or fallback path.
- **Evidence:**
  - `high-criticality` (weight 12) — exported public surface, branching behavior
  - `low-branch-coverage` (weight 18) — 64% branch coverage — alternate paths need tests
- **Suggested test gaps:**
  - **USEFUL** registry.ts: alternate branches are not proven — The source contains decision paths, but branch coverage says not enough of those choices ran during tests.
    - Suggested test: Add table-driven cases for each meaningful if/switch outcome, including the default or fallback path.
    - Evidence: 90.4% line coverage; risk signals: exported public surface, branching behavior; 63.6% branches coverage
  - **USEFUL** registry.ts: exported functions are not all reached — Some functions in this file did not run during the latest coverage pass.
    - Suggested test: Add focused tests for the unreached function behavior, starting with public exports and error-returning helpers.
    - Evidence: 90.4% line coverage; risk signals: exported public surface, branching behavior; 78.6% functions coverage

### `src/services/qualityFlutter.ts`
- **Project:** Node.js project: test-inspector (Node.js)
- **Headline:** qualityFlutter.ts — critical code with untested branches/functions
- **Why:** This file is critical (exported public surface, branching behavior) and the latest coverage shows weak branch/function evidence. Existing tests reach the file, but they do not prove enough alternate outcomes. Add cases for the skipped decisions and unreached functions.
- **Suggestion:** Review related tests for meaningful assertions and edge cases. Start with: Add table-driven cases for each meaningful if/switch outcome, including the default or fallback path.
- **Evidence:**
  - `high-criticality` (weight 12) — exported public surface, branching behavior
  - `low-branch-coverage` (weight 18) — 58% branch coverage — alternate paths need tests
- **Suggested test gaps:**
  - **USEFUL** qualityFlutter.ts: alternate branches are not proven — The source contains decision paths, but branch coverage says not enough of those choices ran during tests.
    - Suggested test: Add table-driven cases for each meaningful if/switch outcome, including the default or fallback path.
    - Evidence: 96.9% line coverage; risk signals: exported public surface, branching behavior; 57.9% branches coverage

### `src/services/testController.ts`
- **Project:** Node.js project: test-inspector (Node.js)
- **Headline:** testController.ts — critical code with untested branches/functions
- **Why:** This file is critical (exported public surface, branching behavior) and the latest coverage shows weak branch/function evidence. Existing tests reach the file, but they do not prove enough alternate outcomes. Add cases for the skipped decisions and unreached functions.
- **Suggestion:** Review related tests for meaningful assertions and edge cases. Start with: Add table-driven cases for each meaningful if/switch outcome, including the default or fallback path.
- **Evidence:**
  - `high-criticality` (weight 12) — exported public surface, branching behavior
  - `low-branch-coverage` (weight 18) — 63% branch coverage — alternate paths need tests
- **Suggested test gaps:**
  - **USEFUL** testController.ts: alternate branches are not proven — The source contains decision paths, but branch coverage says not enough of those choices ran during tests.
    - Suggested test: Add table-driven cases for each meaningful if/switch outcome, including the default or fallback path.
    - Evidence: 87.7% line coverage; risk signals: exported public surface, branching behavior; 63.2% branches coverage
  - **USEFUL** testController.ts: exported functions are not all reached — Some functions in this file did not run during the latest coverage pass.
    - Suggested test: Add focused tests for the unreached function behavior, starting with public exports and error-returning helpers.
    - Evidence: 87.7% line coverage; risk signals: exported public surface, branching behavior; 71.4% functions coverage

### `src/services/setup.ts`
- **Project:** Node.js project: test-inspector (Node.js)
- **Headline:** setup.ts — critical code with untested branches/functions
- **Why:** This file is critical (async/error handling, branching behavior) and the latest coverage shows weak branch/function evidence. Existing tests reach the file, but they do not prove enough alternate outcomes. Add cases for the skipped decisions and unreached functions.
- **Suggestion:** Review related tests for meaningful assertions and edge cases. Start with: Simulate a rejected dependency or failed response and assert the controlled error, cleanup, and no partial write/state.
- **Evidence:**
  - `high-criticality` (weight 12) — async/error handling, branching behavior
  - `low-function-coverage` (weight 12) — 67% function coverage — some functions are unreached
- **Suggested test gaps:**
  - **IMPORTANT** setup.ts: failure path needs a test — Async/API code usually has success and failure outcomes; the current evidence does not show enough branch coverage for the failure side.
    - Suggested test: Simulate a rejected dependency or failed response and assert the controlled error, cleanup, and no partial write/state.
    - Evidence: 94% line coverage; risk signals: async/error handling, branching behavior; 73% branches coverage
  - **USEFUL** setup.ts: alternate branches are not proven — The source contains decision paths, but branch coverage says not enough of those choices ran during tests.
    - Suggested test: Add table-driven cases for each meaningful if/switch outcome, including the default or fallback path.
    - Evidence: 94% line coverage; risk signals: async/error handling, branching behavior; 73% branches coverage
  - **USEFUL** setup.ts: exported functions are not all reached — Some functions in this file did not run during the latest coverage pass.
    - Suggested test: Add focused tests for the unreached function behavior, starting with public exports and error-returning helpers.
    - Evidence: 94% line coverage; risk signals: async/error handling, branching behavior; 66.7% functions coverage

## 🟢 Strong (37)

### `test/unit/adapters.test.ts`
- **Project:** Node.js project: test-inspector (Node.js)
- **Headline:** adapters.test.ts
- **Why:** No theater patterns detected on static signals. Looks like it's doing its job.
- **Suggestion:** Looks healthy on static signals. No action needed.

### `test/unit/aiReviewController.test.ts`
- **Project:** Node.js project: test-inspector (Node.js)
- **Headline:** aiReviewController.test.ts
- **Why:** No theater patterns detected on static signals. Looks like it's doing its job.
- **Suggestion:** Looks healthy on static signals. No action needed.

### `test/unit/caseFile-boundary.test.ts`
- **Project:** Node.js project: test-inspector (Node.js)
- **Headline:** caseFile-boundary.test.ts
- **Why:** No theater patterns detected on static signals. Looks like it's doing its job.
- **Suggestion:** Looks healthy on static signals. No action needed.

### `test/unit/caseFile.test.ts`
- **Project:** Node.js project: test-inspector (Node.js)
- **Headline:** caseFile.test.ts
- **Why:** No theater patterns detected on static signals. Looks like it's doing its job.
- **Suggestion:** Looks healthy on static signals. No action needed.

### `test/unit/caseFileScanner.test.ts`
- **Project:** Node.js project: test-inspector (Node.js)
- **Headline:** caseFileScanner.test.ts
- **Why:** No theater patterns detected on static signals. Looks like it's doing its job.
- **Suggestion:** Looks healthy on static signals. No action needed.

### `test/unit/caseFileTemplate.test.ts`
- **Project:** Node.js project: test-inspector (Node.js)
- **Headline:** caseFileTemplate.test.ts
- **Why:** No theater patterns detected on static signals. Looks like it's doing its job.
- **Suggestion:** Looks healthy on static signals. No action needed.

### `test/unit/controllersAndPanels.test.ts`
- **Project:** Node.js project: test-inspector (Node.js)
- **Headline:** controllersAndPanels.test.ts
- **Why:** No theater patterns detected on static signals. Looks like it's doing its job.
- **Suggestion:** Looks healthy on static signals. No action needed.

### `test/unit/coverage.test.ts`
- **Project:** Node.js project: test-inspector (Node.js)
- **Headline:** coverage.test.ts
- **Why:** No theater patterns detected on static signals. Looks like it's doing its job.
- **Suggestion:** Looks healthy on static signals. No action needed.

### `test/unit/coverageController.test.ts`
- **Project:** Node.js project: test-inspector (Node.js)
- **Headline:** coverageController.test.ts
- **Why:** No theater patterns detected on static signals. Looks like it's doing its job.
- **Suggestion:** Looks healthy on static signals. No action needed.

### `test/unit/exportMarkdown.test.ts`
- **Project:** Node.js project: test-inspector (Node.js)
- **Headline:** exportMarkdown.test.ts
- **Why:** No theater patterns detected on static signals. Looks like it's doing its job.
- **Suggestion:** Looks healthy on static signals. No action needed.

### `test/unit/extension.test.ts`
- **Project:** Node.js project: test-inspector (Node.js)
- **Headline:** extension.test.ts
- **Why:** No theater patterns detected on static signals. Looks like it's doing its job.
- **Suggestion:** Looks healthy on static signals. No action needed.

### `test/unit/featureScope.test.ts`
- **Project:** Node.js project: test-inspector (Node.js)
- **Headline:** featureScope.test.ts
- **Why:** No theater patterns detected on static signals. Looks like it's doing its job.
- **Suggestion:** Looks healthy on static signals. No action needed.

### `test/unit/features.test.ts`
- **Project:** Node.js project: test-inspector (Node.js)
- **Headline:** features.test.ts
- **Why:** No theater patterns detected on static signals. Looks like it's doing its job.
- **Suggestion:** Looks healthy on static signals. No action needed.

### `test/unit/flutter-quality.test.ts`
- **Project:** Node.js project: test-inspector (Node.js)
- **Headline:** flutter-quality.test.ts
- **Why:** No theater patterns detected on static signals. Looks like it's doing its job.
- **Suggestion:** Looks healthy on static signals. No action needed.

### `test/unit/fs.test.ts`
- **Project:** Node.js project: test-inspector (Node.js)
- **Headline:** fs.test.ts
- **Why:** No theater patterns detected on static signals. Looks like it's doing its job.
- **Suggestion:** Looks healthy on static signals. No action needed.

### `test/unit/git.test.ts`
- **Project:** Node.js project: test-inspector (Node.js)
- **Headline:** git.test.ts
- **Why:** No theater patterns detected on static signals. Looks like it's doing its job.
- **Suggestion:** Looks healthy on static signals. No action needed.

### `test/unit/heuristics.test.ts`
- **Project:** Node.js project: test-inspector (Node.js)
- **Headline:** heuristics.test.ts
- **Why:** No theater patterns detected on static signals. Looks like it's doing its job.
- **Suggestion:** Looks healthy on static signals. No action needed.

### `test/unit/llm-enrich.test.ts`
- **Project:** Node.js project: test-inspector (Node.js)
- **Headline:** llm-enrich.test.ts
- **Why:** No theater patterns detected on static signals. Looks like it's doing its job.
- **Suggestion:** Looks healthy on static signals. No action needed.

### `test/unit/llm-http.test.ts`
- **Project:** Node.js project: test-inspector (Node.js)
- **Headline:** llm-http.test.ts
- **Why:** No theater patterns detected on static signals. Looks like it's doing its job.
- **Suggestion:** Looks healthy on static signals. No action needed.

### `test/unit/llm-providers.test.ts`
- **Project:** Node.js project: test-inspector (Node.js)
- **Headline:** llm-providers.test.ts
- **Why:** No theater patterns detected on static signals. Looks like it's doing its job.
- **Suggestion:** Looks healthy on static signals. No action needed.

### `test/unit/llm-registry.test.ts`
- **Project:** Node.js project: test-inspector (Node.js)
- **Headline:** llm-registry.test.ts
- **Why:** No theater patterns detected on static signals. Looks like it's doing its job.
- **Suggestion:** Looks healthy on static signals. No action needed.

### `test/unit/quality.test.ts`
- **Project:** Node.js project: test-inspector (Node.js)
- **Headline:** quality.test.ts
- **Why:** No theater patterns detected on static signals. Looks like it's doing its job.
- **Suggestion:** Looks healthy on static signals. No action needed.

### `test/unit/report.test.ts`
- **Project:** Node.js project: test-inspector (Node.js)
- **Headline:** report.test.ts
- **Why:** No theater patterns detected on static signals. Looks like it's doing its job.
- **Suggestion:** Looks healthy on static signals. No action needed.

### `test/unit/reportController.test.ts`
- **Project:** Node.js project: test-inspector (Node.js)
- **Headline:** reportController.test.ts
- **Why:** No theater patterns detected on static signals. Looks like it's doing its job.
- **Suggestion:** Looks healthy on static signals. No action needed.

### `test/unit/reportsTemplate.test.ts`
- **Project:** Node.js project: test-inspector (Node.js)
- **Headline:** reportsTemplate.test.ts
- **Why:** No theater patterns detected on static signals. Looks like it's doing its job.
- **Suggestion:** Looks healthy on static signals. No action needed.

### `test/unit/reviewed.test.ts`
- **Project:** Node.js project: test-inspector (Node.js)
- **Headline:** reviewed.test.ts
- **Why:** No theater patterns detected on static signals. Looks like it's doing its job.
- **Suggestion:** Looks healthy on static signals. No action needed.

### `test/unit/reviewerTemplate.test.ts`
- **Project:** Node.js project: test-inspector (Node.js)
- **Headline:** reviewerTemplate.test.ts
- **Why:** No theater patterns detected on static signals. Looks like it's doing its job.
- **Suggestion:** Looks healthy on static signals. No action needed.

### `test/unit/runner.test.ts`
- **Project:** Node.js project: test-inspector (Node.js)
- **Headline:** runner.test.ts
- **Why:** No theater patterns detected on static signals. Looks like it's doing its job.
- **Suggestion:** Looks healthy on static signals. No action needed.

### `test/unit/setup.test.ts`
- **Project:** Node.js project: test-inspector (Node.js)
- **Headline:** setup.test.ts
- **Why:** No theater patterns detected on static signals. Looks like it's doing its job.
- **Suggestion:** Looks healthy on static signals. No action needed.

### `test/unit/sourceRiskFilters.test.ts`
- **Project:** Node.js project: test-inspector (Node.js)
- **Headline:** sourceRiskFilters.test.ts
- **Why:** No theater patterns detected on static signals. Looks like it's doing its job.
- **Suggestion:** Looks healthy on static signals. No action needed.

### `test/unit/state.test.ts`
- **Project:** Node.js project: test-inspector (Node.js)
- **Headline:** state.test.ts
- **Why:** No theater patterns detected on static signals. Looks like it's doing its job.
- **Suggestion:** Looks healthy on static signals. No action needed.

### `test/unit/targetController.test.ts`
- **Project:** Node.js project: test-inspector (Node.js)
- **Headline:** targetController.test.ts
- **Why:** No theater patterns detected on static signals. Looks like it's doing its job.
- **Suggestion:** Looks healthy on static signals. No action needed.

### `test/unit/testGaps.test.ts`
- **Project:** Node.js project: test-inspector (Node.js)
- **Headline:** testGaps.test.ts
- **Why:** No theater patterns detected on static signals. Looks like it's doing its job.
- **Suggestion:** Looks healthy on static signals. No action needed.

### `test/unit/testResults.test.ts`
- **Project:** Node.js project: test-inspector (Node.js)
- **Headline:** testResults.test.ts
- **Why:** No theater patterns detected on static signals. Looks like it's doing its job.
- **Suggestion:** Looks healthy on static signals. No action needed.

### `test/unit/trackedRepos.test.ts`
- **Project:** Node.js project: test-inspector (Node.js)
- **Headline:** trackedRepos.test.ts
- **Why:** No theater patterns detected on static signals. Looks like it's doing its job.
- **Suggestion:** Looks healthy on static signals. No action needed.

### `test/unit/treeViews.test.ts`
- **Project:** Node.js project: test-inspector (Node.js)
- **Headline:** treeViews.test.ts
- **Why:** No theater patterns detected on static signals. Looks like it's doing its job.
- **Suggestion:** Looks healthy on static signals. No action needed.

### `test/unit/workspaceCatalog.test.ts`
- **Project:** Node.js project: test-inspector (Node.js)
- **Headline:** workspaceCatalog.test.ts
- **Why:** No theater patterns detected on static signals. Looks like it's doing its job.
- **Suggestion:** Looks healthy on static signals. No action needed.

---
_Test Inspector is a local-first detective for unit tests. The tool only informs — you fix and rescan._