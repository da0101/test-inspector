# Test Inspector — Deterministic Report

_Generated: 2026-05-17T13:31:17.348Z_
_Mode: Deterministic_

## Scope

- **Feature:** All features

## Summary

- **Included groups:** 🟡 Weak, 🟢 Strong
- **Projects detected:** 1
- **Test files:** 33
- **Test cases discovered:** 143
- **Coverage summaries:** 1
- **Average line coverage:** 82.3%
- **Average branch coverage:** 69%
- **Average function coverage:** 72.6%
- **🔴 Theater**: 0
- **🟡 Weak**: 33
- **⚪ Missing**: 0
- **🟢 Strong**: 33

### Coverage by project

| Project | Lines | Branches | Functions | Statements | Files |
|---|---:|---:|---:|---:|---:|
| Node.js project: test-inspector | 82.3% | 69% | 72.6% | unknown | 64 |

## 🟡 Weak (33)

### `src/extension.ts`
- **Project:** Node.js project: test-inspector (Node.js)
- **Headline:** extension.ts — critical code with 45% coverage
- **Why:** This file is critical (stateful UI logic, async/error handling, exported public surface, branching behavior) and only 45% of its lines are exercised by the existing tests. The uncovered lines are where bugs hide. Add cases that exercise the error / branch paths the existing tests skip.
- **Suggestion:** Expand tests to cover branches, error states, and user-visible outcomes. Start with: Mock VS Code flows for untrusted workspace, missing workspace folders, missing coverage plan, failed coverage run, and current-file run failures.
- **Evidence:**
  - `high-criticality` (weight 24) — stateful UI logic, async/error handling, exported public surface, branching behavior
  - `low-line-coverage` (weight 20) — 45% line coverage
  - `low-branch-coverage` (weight 18) — 48% branch coverage — alternate paths need tests
  - `low-function-coverage` (weight 12) — 27% function coverage — some functions are unreached
- **Suggested test gaps:**
  - **IMPORTANT** extension.ts: failure path needs a test — Async/API code usually has success and failure outcomes; the current evidence does not show enough branch coverage for the failure side.
    - Suggested test: Mock VS Code flows for untrusted workspace, missing workspace folders, missing coverage plan, failed coverage run, and current-file run failures.
    - Evidence: 44.8% line coverage; risk signals: stateful UI logic, async/error handling, exported public surface; 48.3% branches coverage
  - **IMPORTANT** extension.ts: alternate branches are not proven — The source contains decision paths, but branch coverage says not enough of those choices ran during tests.
    - Suggested test: Cover command registration branches for scan, coverage, current-file run, report generation, and target publishing.
    - Evidence: 44.8% line coverage; risk signals: stateful UI logic, async/error handling, exported public surface; 48.3% branches coverage
  - **IMPORTANT** extension.ts: exported functions are not all reached — Some functions in this file did not run during the latest coverage pass.
    - Suggested test: Add activation-level tests that exercise each exported command callback through the mocked VS Code API.
    - Evidence: 44.8% line coverage; risk signals: stateful UI logic, async/error handling, exported public surface; 26.7% functions coverage

### `src/services/aiReviewController.ts`
- **Project:** Node.js project: test-inspector (Node.js)
- **Headline:** aiReviewController.ts — critical code with 49% coverage
- **Why:** This file is critical (API/data flow, form/validation logic, stateful UI logic, async/error handling) and only 49% of its lines are exercised by the existing tests. The uncovered lines are where bugs hide. Add cases that exercise the error / branch paths the existing tests skip.
- **Suggestion:** Expand tests to cover branches, error states, and user-visible outcomes. Start with: Mock provider enrichment failure and unreadable target/related files; assert the AI review returns an error card without changing the deterministic verdict.
- **Evidence:**
  - `high-criticality` (weight 30) — API/data flow, form/validation logic, stateful UI logic, async/error handling, exported public surface, branching behavior
  - `low-line-coverage` (weight 20) — 49% line coverage
  - `low-branch-coverage` (weight 18) — 64% branch coverage — alternate paths need tests
  - `low-function-coverage` (weight 12) — 64% function coverage — some functions are unreached
- **Suggested test gaps:**
  - **IMPORTANT** aiReviewController.ts: failure path needs a test — Async/API code usually has success and failure outcomes; the current evidence does not show enough branch coverage for the failure side.
    - Suggested test: Mock provider enrichment failure and unreadable target/related files; assert the AI review returns an error card without changing the deterministic verdict.
    - Evidence: 49% line coverage; risk signals: API/data flow, form/validation logic, stateful UI logic; 63.6% branches coverage
  - **IMPORTANT** aiReviewController.ts: guard/validation cases are missing — Guard code is where invalid input, permissions, and auth state are accepted or rejected.
    - Suggested test: Test no provider, unconfigured provider, and user-cancelled confirmation paths.
    - Evidence: 49% line coverage; risk signals: API/data flow, form/validation logic, stateful UI logic; 63.6% branches coverage
  - **USEFUL** aiReviewController.ts: alternate branches are not proven — The source contains decision paths, but branch coverage says not enough of those choices ran during tests.
    - Suggested test: Cover accepted review, challenged review, provider error, cancelled send, and related-file fallback branches.
    - Evidence: 49% line coverage; risk signals: API/data flow, form/validation logic, stateful UI logic; 63.6% branches coverage
  - **USEFUL** aiReviewController.ts: exported functions are not all reached — Some functions in this file did not run during the latest coverage pass.
    - Suggested test: Add focused tests for configure flow actions and AI review creation paths.
    - Evidence: 49% line coverage; risk signals: API/data flow, form/validation logic, stateful UI logic; 64.3% functions coverage

### `src/services/llm/claude.ts`
- **Project:** Node.js project: test-inspector (Node.js)
- **Headline:** claude.ts — critical code with untested branches/functions
- **Why:** This file is critical (permission logic, API/data flow, async/error handling, exported public surface) and the latest coverage shows weak branch/function evidence. Existing tests reach the file, but they do not prove enough alternate outcomes. Add cases for the skipped decisions and unreached functions.
- **Suggestion:** Review related tests for meaningful assertions and edge cases. Start with: Mock the provider HTTP response for non-2xx status, malformed JSON, and missing response fields; assert a deterministic error is returned.
- **Evidence:**
  - `high-criticality` (weight 30) — permission logic, API/data flow, async/error handling, exported public surface, branching behavior
  - `low-branch-coverage` (weight 18) — 60% branch coverage — alternate paths need tests
  - `low-function-coverage` (weight 12) — 67% function coverage — some functions are unreached
- **Suggested test gaps:**
  - **IMPORTANT** claude.ts: failure path needs a test — Async/API code usually has success and failure outcomes; the current evidence does not show enough branch coverage for the failure side.
    - Suggested test: Mock the provider HTTP response for non-2xx status, malformed JSON, and missing response fields; assert a deterministic error is returned.
    - Evidence: 81.4% line coverage; risk signals: permission logic, API/data flow, async/error handling; 60% branches coverage
  - **IMPORTANT** claude.ts: guard/validation cases are missing — Guard code is where invalid input, permissions, and auth state are accepted or rejected.
    - Suggested test: Test missing API key/model configuration and ensure no request is sent when configuration is incomplete.
    - Evidence: 81.4% line coverage; risk signals: permission logic, API/data flow, async/error handling; 60% branches coverage
  - **USEFUL** claude.ts: alternate branches are not proven — The source contains decision paths, but branch coverage says not enough of those choices ran during tests.
    - Suggested test: Cover valid response, provider error response, malformed payload, and empty-candidate/content branches.
    - Evidence: 81.4% line coverage; risk signals: permission logic, API/data flow, async/error handling; 60% branches coverage
  - **USEFUL** claude.ts: exported functions are not all reached — Some functions in this file did not run during the latest coverage pass.
    - Suggested test: Add tests for every exported provider method: completion, connection test, and configuration checks.
    - Evidence: 81.4% line coverage; risk signals: permission logic, API/data flow, async/error handling; 66.7% functions coverage

### `src/services/llm/enrich.ts`
- **Project:** Node.js project: test-inspector (Node.js)
- **Headline:** enrich.ts — critical code with untested branches/functions
- **Why:** This file is critical (API/data flow, form/validation logic, stateful UI logic, async/error handling) and the latest coverage shows weak branch/function evidence. Existing tests reach the file, but they do not prove enough alternate outcomes. Add cases for the skipped decisions and unreached functions.
- **Suggestion:** Review related tests for meaningful assertions and edge cases. Start with: Feed invalid JSON, truncated JSON, fabricated anchors, and provider errors; assert deterministic fallback/error output and dropped-anchor counts.
- **Evidence:**
  - `high-criticality` (weight 30) — API/data flow, form/validation logic, stateful UI logic, async/error handling, exported public surface, branching behavior
  - `low-branch-coverage` (weight 18) — 62% branch coverage — alternate paths need tests
- **Suggested test gaps:**
  - **IMPORTANT** enrich.ts: failure path needs a test — Async/API code usually has success and failure outcomes; the current evidence does not show enough branch coverage for the failure side.
    - Suggested test: Feed invalid JSON, truncated JSON, fabricated anchors, and provider errors; assert deterministic fallback/error output and dropped-anchor counts.
    - Evidence: 93.5% line coverage; risk signals: API/data flow, form/validation logic, stateful UI logic; 61.5% branches coverage
  - **IMPORTANT** enrich.ts: guard/validation cases are missing — Guard code is where invalid input, permissions, and auth state are accepted or rejected.
    - Suggested test: Test missing explanation, non-object responses, out-of-range line numbers, empty excerpts, and uncertain responses.
    - Evidence: 93.5% line coverage; risk signals: API/data flow, form/validation logic, stateful UI logic; 61.5% branches coverage
  - **USEFUL** enrich.ts: alternate branches are not proven — The source contains decision paths, but branch coverage says not enough of those choices ran during tests.
    - Suggested test: Cover direct JSON parse, fenced JSON, prose-wrapped JSON, tolerant truncated explanation extraction, and rejected malformed output.
    - Evidence: 93.5% line coverage; risk signals: API/data flow, form/validation logic, stateful UI logic; 61.5% branches coverage

### `src/services/llm/gemini.ts`
- **Project:** Node.js project: test-inspector (Node.js)
- **Headline:** gemini.ts — critical code with untested branches/functions
- **Why:** This file is critical (permission logic, API/data flow, async/error handling, exported public surface) and the latest coverage shows weak branch/function evidence. Existing tests reach the file, but they do not prove enough alternate outcomes. Add cases for the skipped decisions and unreached functions.
- **Suggestion:** Review related tests for meaningful assertions and edge cases. Start with: Mock the provider HTTP response for non-2xx status, malformed JSON, and missing response fields; assert a deterministic error is returned.
- **Evidence:**
  - `high-criticality` (weight 30) — permission logic, API/data flow, async/error handling, exported public surface, branching behavior
  - `low-function-coverage` (weight 12) — 67% function coverage — some functions are unreached
- **Suggested test gaps:**
  - **IMPORTANT** gemini.ts: failure path needs a test — Async/API code usually has success and failure outcomes; the current evidence does not show enough branch coverage for the failure side.
    - Suggested test: Mock the provider HTTP response for non-2xx status, malformed JSON, and missing response fields; assert a deterministic error is returned.
    - Evidence: 84.3% line coverage; risk signals: permission logic, API/data flow, async/error handling; 76.9% branches coverage
  - **IMPORTANT** gemini.ts: guard/validation cases are missing — Guard code is where invalid input, permissions, and auth state are accepted or rejected.
    - Suggested test: Test missing API key/model configuration and ensure no request is sent when configuration is incomplete.
    - Evidence: 84.3% line coverage; risk signals: permission logic, API/data flow, async/error handling; 76.9% branches coverage
  - **USEFUL** gemini.ts: alternate branches are not proven — The source contains decision paths, but branch coverage says not enough of those choices ran during tests.
    - Suggested test: Cover valid response, provider error response, malformed payload, and empty-candidate/content branches.
    - Evidence: 84.3% line coverage; risk signals: permission logic, API/data flow, async/error handling; 76.9% branches coverage
  - **USEFUL** gemini.ts: exported functions are not all reached — Some functions in this file did not run during the latest coverage pass.
    - Suggested test: Add tests for every exported provider method: completion, connection test, and configuration checks.
    - Evidence: 84.3% line coverage; risk signals: permission logic, API/data flow, async/error handling; 66.7% functions coverage

### `src/services/llm/openai.ts`
- **Project:** Node.js project: test-inspector (Node.js)
- **Headline:** openai.ts — critical code with untested branches/functions
- **Why:** This file is critical (permission logic, API/data flow, async/error handling, exported public surface) and the latest coverage shows weak branch/function evidence. Existing tests reach the file, but they do not prove enough alternate outcomes. Add cases for the skipped decisions and unreached functions.
- **Suggestion:** Review related tests for meaningful assertions and edge cases. Start with: Mock the provider HTTP response for non-2xx status, malformed JSON, and missing response fields; assert a deterministic error is returned.
- **Evidence:**
  - `high-criticality` (weight 30) — permission logic, API/data flow, async/error handling, exported public surface, branching behavior
  - `low-function-coverage` (weight 12) — 60% function coverage — some functions are unreached
- **Suggested test gaps:**
  - **IMPORTANT** openai.ts: failure path needs a test — Async/API code usually has success and failure outcomes; the current evidence does not show enough branch coverage for the failure side.
    - Suggested test: Mock the provider HTTP response for non-2xx status, malformed JSON, and missing response fields; assert a deterministic error is returned.
    - Evidence: 84.1% line coverage; risk signals: permission logic, API/data flow, async/error handling; 78.6% branches coverage
  - **IMPORTANT** openai.ts: guard/validation cases are missing — Guard code is where invalid input, permissions, and auth state are accepted or rejected.
    - Suggested test: Test missing API key/model configuration and ensure no request is sent when configuration is incomplete.
    - Evidence: 84.1% line coverage; risk signals: permission logic, API/data flow, async/error handling; 78.6% branches coverage
  - **USEFUL** openai.ts: alternate branches are not proven — The source contains decision paths, but branch coverage says not enough of those choices ran during tests.
    - Suggested test: Cover valid response, provider error response, malformed payload, and empty-candidate/content branches.
    - Evidence: 84.1% line coverage; risk signals: permission logic, API/data flow, async/error handling; 78.6% branches coverage
  - **USEFUL** openai.ts: exported functions are not all reached — Some functions in this file did not run during the latest coverage pass.
    - Suggested test: Add tests for every exported provider method: completion, connection test, and configuration checks.
    - Evidence: 84.1% line coverage; risk signals: permission logic, API/data flow, async/error handling; 60% functions coverage

### `src/services/reportController.ts`
- **Project:** Node.js project: test-inspector (Node.js)
- **Headline:** reportController.ts — critical code with untested branches/functions
- **Why:** This file is critical (API/data flow, stateful UI logic, async/error handling, branching behavior) and the latest coverage shows weak branch/function evidence. Existing tests reach the file, but they do not prove enough alternate outcomes. Add cases for the skipped decisions and unreached functions.
- **Suggestion:** Review related tests for meaningful assertions and edge cases. Start with: Mock report write and AI review failures; assert deterministic reports still preserve local findings and surface AI errors separately.
- **Evidence:**
  - `high-criticality` (weight 24) — API/data flow, stateful UI logic, async/error handling, branching behavior
  - `low-branch-coverage` (weight 18) — 61% branch coverage — alternate paths need tests
  - `low-function-coverage` (weight 12) — 64% function coverage — some functions are unreached
- **Suggested test gaps:**
  - **IMPORTANT** reportController.ts: failure path needs a test — Async/API code usually has success and failure outcomes; the current evidence does not show enough branch coverage for the failure side.
    - Suggested test: Mock report write and AI review failures; assert deterministic reports still preserve local findings and surface AI errors separately.
    - Evidence: 60.4% line coverage; risk signals: API/data flow, stateful UI logic, async/error handling; 60.5% branches coverage
  - **USEFUL** reportController.ts: alternate branches are not proven — The source contains decision paths, but branch coverage says not enough of those choices ran during tests.
    - Suggested test: Cover deterministic export, AI export, save cancellation, write failure, and partial AI review error branches.
    - Evidence: 60.4% line coverage; risk signals: API/data flow, stateful UI logic, async/error handling; 60.5% branches coverage
  - **USEFUL** reportController.ts: exported functions are not all reached — Some functions in this file did not run during the latest coverage pass.
    - Suggested test: Add focused tests for report selection, default report path, Markdown writing, and AI error collection.
    - Evidence: 60.4% line coverage; risk signals: API/data flow, stateful UI logic, async/error handling; 63.6% functions coverage

### `src/services/targetController.ts`
- **Project:** Node.js project: test-inspector (Node.js)
- **Headline:** targetController.ts — critical code with untested branches/functions
- **Why:** This file is critical (stateful UI logic, async/error handling, exported public surface, branching behavior) and the latest coverage shows weak branch/function evidence. Existing tests reach the file, but they do not prove enough alternate outcomes. Add cases for the skipped decisions and unreached functions.
- **Suggestion:** Review related tests for meaningful assertions and edge cases. Start with: Mock catalog refresh/add failures and assert the target tree still publishes a safe empty/error state.
- **Evidence:**
  - `high-criticality` (weight 24) — stateful UI logic, async/error handling, exported public surface, branching behavior
  - `low-branch-coverage` (weight 18) — 56% branch coverage — alternate paths need tests
  - `low-function-coverage` (weight 12) — 60% function coverage — some functions are unreached
- **Suggested test gaps:**
  - **IMPORTANT** targetController.ts: failure path needs a test — Async/API code usually has success and failure outcomes; the current evidence does not show enough branch coverage for the failure side.
    - Suggested test: Mock catalog refresh/add failures and assert the target tree still publishes a safe empty/error state.
    - Evidence: 69.2% line coverage; risk signals: stateful UI logic, async/error handling, exported public surface; 56.4% branches coverage
  - **USEFUL** targetController.ts: alternate branches are not proven — The source contains decision paths, but branch coverage says not enough of those choices ran during tests.
    - Suggested test: Cover tracked repo add/remove, worktree selection, feature scope changes, raw-bundle filtering, and publish callbacks.
    - Evidence: 69.2% line coverage; risk signals: stateful UI logic, async/error handling, exported public surface; 56.4% branches coverage
  - **USEFUL** targetController.ts: exported functions are not all reached — Some functions in this file did not run during the latest coverage pass.
    - Suggested test: Add focused tests for each public target-controller action exposed through the sidebar tree.
    - Evidence: 69.2% line coverage; risk signals: stateful UI logic, async/error handling, exported public surface; 60% functions coverage

### `src/services/runner.ts`
- **Project:** Node.js project: test-inspector (Node.js)
- **Headline:** runner.ts — critical code with untested branches/functions
- **Why:** This file is critical (async/error handling, exported public surface, branching behavior) and the latest coverage shows weak branch/function evidence. Existing tests reach the file, but they do not prove enough alternate outcomes. Add cases for the skipped decisions and unreached functions.
- **Suggestion:** Review related tests for meaningful assertions and edge cases. Start with: Mock spawned commands that exit non-zero, emit stderr, fail to spawn, and time out; assert exitCode/stdout/stderr are captured without shell execution.
- **Evidence:**
  - `high-criticality` (weight 18) — async/error handling, exported public surface, branching behavior
  - `low-branch-coverage` (weight 18) — 68% branch coverage — alternate paths need tests
  - `low-function-coverage` (weight 12) — 63% function coverage — some functions are unreached
- **Suggested test gaps:**
  - **IMPORTANT** runner.ts: failure path needs a test — Async/API code usually has success and failure outcomes; the current evidence does not show enough branch coverage for the failure side.
    - Suggested test: Mock spawned commands that exit non-zero, emit stderr, fail to spawn, and time out; assert exitCode/stdout/stderr are captured without shell execution.
    - Evidence: 55.8% line coverage; risk signals: async/error handling, exported public surface, branching behavior; 68.2% branches coverage
  - **USEFUL** runner.ts: alternate branches are not proven — The source contains decision paths, but branch coverage says not enough of those choices ran during tests.
    - Suggested test: Cover Node, Python, Flutter, Django, FastAPI, explicit npm coverage command, no coverage command, and parse-error branches.
    - Evidence: 55.8% line coverage; risk signals: async/error handling, exported public surface, branching behavior; 68.2% branches coverage
  - **USEFUL** runner.ts: exported functions are not all reached — Some functions in this file did not run during the latest coverage pass.
    - Suggested test: Add focused tests for command construction, relative test-file args, output parsing fallback, timeout handling, and result merging.
    - Evidence: 55.8% line coverage; risk signals: async/error handling, exported public surface, branching behavior; 63% functions coverage

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

### `src/services/coverageController.ts`
- **Project:** Node.js project: test-inspector (Node.js)
- **Headline:** coverageController.ts — critical code with 46% coverage
- **Why:** This file is critical (async/error handling, exported public surface, branching behavior) and only 46% of its lines are exercised by the existing tests. The uncovered lines are where bugs hide. Add cases that exercise the error / branch paths the existing tests skip.
- **Suggestion:** Expand tests to cover branches, error states, and user-visible outcomes. Start with: Simulate a rejected dependency or failed response and assert the controlled error, cleanup, and no partial write/state.
- **Evidence:**
  - `high-criticality` (weight 18) — async/error handling, exported public surface, branching behavior
  - `low-line-coverage` (weight 20) — 46% line coverage
- **Suggested test gaps:**
  - **IMPORTANT** coverageController.ts: failure path needs a test — Async/API code usually has success and failure outcomes; the current evidence does not show enough branch coverage for the failure side.
    - Suggested test: Simulate a rejected dependency or failed response and assert the controlled error, cleanup, and no partial write/state.
    - Evidence: 45.9% line coverage; risk signals: async/error handling, exported public surface, branching behavior; 100% branches coverage
  - **USEFUL** coverageController.ts: exported functions are not all reached — Some functions in this file did not run during the latest coverage pass.
    - Suggested test: Add focused tests for the unreached function behavior, starting with public exports and error-returning helpers.
    - Evidence: 45.9% line coverage; risk signals: async/error handling, exported public surface, branching behavior; 75% functions coverage

### `src/services/git.ts`
- **Project:** Node.js project: test-inspector (Node.js)
- **Headline:** git.ts — critical code with untested branches/functions
- **Why:** This file is critical (async/error handling, exported public surface, branching behavior) and the latest coverage shows weak branch/function evidence. Existing tests reach the file, but they do not prove enough alternate outcomes. Add cases for the skipped decisions and unreached functions.
- **Suggestion:** Review related tests for meaningful assertions and edge cases. Start with: Simulate a rejected dependency or failed response and assert the controlled error, cleanup, and no partial write/state.
- **Evidence:**
  - `high-criticality` (weight 18) — async/error handling, exported public surface, branching behavior
  - `low-branch-coverage` (weight 18) — 44% branch coverage — alternate paths need tests
- **Suggested test gaps:**
  - **IMPORTANT** git.ts: failure path needs a test — Async/API code usually has success and failure outcomes; the current evidence does not show enough branch coverage for the failure side.
    - Suggested test: Simulate a rejected dependency or failed response and assert the controlled error, cleanup, and no partial write/state.
    - Evidence: 61.4% line coverage; risk signals: async/error handling, exported public surface, branching behavior; 44.2% branches coverage
  - **IMPORTANT** git.ts: alternate branches are not proven — The source contains decision paths, but branch coverage says not enough of those choices ran during tests.
    - Suggested test: Add table-driven cases for each meaningful if/switch outcome, including the default or fallback path.
    - Evidence: 61.4% line coverage; risk signals: async/error handling, exported public surface, branching behavior; 44.2% branches coverage
  - **USEFUL** git.ts: exported functions are not all reached — Some functions in this file did not run during the latest coverage pass.
    - Suggested test: Add focused tests for the unreached function behavior, starting with public exports and error-returning helpers.
    - Evidence: 61.4% line coverage; risk signals: async/error handling, exported public surface, branching behavior; 70.8% functions coverage

### `src/services/llm/registry.ts`
- **Project:** Node.js project: test-inspector (Node.js)
- **Headline:** registry.ts — critical code with untested branches/functions
- **Why:** This file is critical (exported public surface, branching behavior) and the latest coverage shows weak branch/function evidence. Existing tests reach the file, but they do not prove enough alternate outcomes. Add cases for the skipped decisions and unreached functions.
- **Suggestion:** Review related tests for meaningful assertions and edge cases. Start with: Add table-driven cases for each meaningful if/switch outcome, including the default or fallback path.
- **Evidence:**
  - `high-criticality` (weight 12) — exported public surface, branching behavior
  - `low-branch-coverage` (weight 18) — 67% branch coverage — alternate paths need tests
  - `low-function-coverage` (weight 12) — 64% function coverage — some functions are unreached
- **Suggested test gaps:**
  - **USEFUL** registry.ts: alternate branches are not proven — The source contains decision paths, but branch coverage says not enough of those choices ran during tests.
    - Suggested test: Add table-driven cases for each meaningful if/switch outcome, including the default or fallback path.
    - Evidence: 78.1% line coverage; risk signals: exported public surface, branching behavior; 66.7% branches coverage
  - **USEFUL** registry.ts: exported functions are not all reached — Some functions in this file did not run during the latest coverage pass.
    - Suggested test: Add focused tests for the unreached function behavior, starting with public exports and error-returning helpers.
    - Evidence: 78.1% line coverage; risk signals: exported public surface, branching behavior; 64.3% functions coverage

### `src/services/testResults.ts`
- **Project:** Node.js project: test-inspector (Node.js)
- **Headline:** testResults.ts — critical code with 7% coverage
- **Why:** This file is critical (exported public surface, branching behavior) and only 7% of its lines are exercised by the existing tests. The uncovered lines are where bugs hide. Add cases that exercise the error / branch paths the existing tests skip.
- **Suggestion:** Expand tests to cover branches, error states, and user-visible outcomes. Start with: Add focused tests for the unreached function behavior, starting with public exports and error-returning helpers.
- **Evidence:**
  - `high-criticality` (weight 12) — exported public surface, branching behavior
  - `low-line-coverage` (weight 20) — 7% line coverage
  - `low-function-coverage` (weight 12) — 0% function coverage — some functions are unreached
- **Suggested test gaps:**
  - **IMPORTANT** testResults.ts: exported functions are not all reached — Some functions in this file did not run during the latest coverage pass.
    - Suggested test: Add focused tests for the unreached function behavior, starting with public exports and error-returning helpers.
    - Evidence: 6.8% line coverage; risk signals: exported public surface, branching behavior; 0% functions coverage

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

### `src/services/setup.ts`
- **Project:** Node.js project: test-inspector (Node.js)
- **Headline:** setup.ts — critical code with untested branches/functions
- **Why:** This file is critical (async/error handling, branching behavior) and the latest coverage shows weak branch/function evidence. Existing tests reach the file, but they do not prove enough alternate outcomes. Add cases for the skipped decisions and unreached functions.
- **Suggestion:** Review related tests for meaningful assertions and edge cases. Start with: Simulate a rejected dependency or failed response and assert the controlled error, cleanup, and no partial write/state.
- **Evidence:**
  - `high-criticality` (weight 12) — async/error handling, branching behavior
  - `low-branch-coverage` (weight 18) — 50% branch coverage — alternate paths need tests
  - `low-function-coverage` (weight 12) — 67% function coverage — some functions are unreached
- **Suggested test gaps:**
  - **IMPORTANT** setup.ts: failure path needs a test — Async/API code usually has success and failure outcomes; the current evidence does not show enough branch coverage for the failure side.
    - Suggested test: Simulate a rejected dependency or failed response and assert the controlled error, cleanup, and no partial write/state.
    - Evidence: 84% line coverage; risk signals: async/error handling, branching behavior; 50% branches coverage
  - **USEFUL** setup.ts: alternate branches are not proven — The source contains decision paths, but branch coverage says not enough of those choices ran during tests.
    - Suggested test: Add table-driven cases for each meaningful if/switch outcome, including the default or fallback path.
    - Evidence: 84% line coverage; risk signals: async/error handling, branching behavior; 50% branches coverage
  - **USEFUL** setup.ts: exported functions are not all reached — Some functions in this file did not run during the latest coverage pass.
    - Suggested test: Add focused tests for the unreached function behavior, starting with public exports and error-returning helpers.
    - Evidence: 84% line coverage; risk signals: async/error handling, branching behavior; 66.7% functions coverage

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

### `src/services/features.ts`
- **Project:** Node.js project: test-inspector (Node.js)
- **Headline:** features.ts — critical code with untested branches/functions
- **Why:** This file is critical (async/error handling, branching behavior) and the latest coverage shows weak branch/function evidence. Existing tests reach the file, but they do not prove enough alternate outcomes. Add cases for the skipped decisions and unreached functions.
- **Suggestion:** Review related tests for meaningful assertions and edge cases. Start with: Simulate a rejected dependency or failed response and assert the controlled error, cleanup, and no partial write/state.
- **Evidence:**
  - `high-criticality` (weight 12) — async/error handling, branching behavior
  - `low-branch-coverage` (weight 18) — 46% branch coverage — alternate paths need tests
- **Suggested test gaps:**
  - **IMPORTANT** features.ts: failure path needs a test — Async/API code usually has success and failure outcomes; the current evidence does not show enough branch coverage for the failure side.
    - Suggested test: Simulate a rejected dependency or failed response and assert the controlled error, cleanup, and no partial write/state.
    - Evidence: 76.2% line coverage; risk signals: async/error handling, branching behavior; 46.2% branches coverage
  - **IMPORTANT** features.ts: alternate branches are not proven — The source contains decision paths, but branch coverage says not enough of those choices ran during tests.
    - Suggested test: Add table-driven cases for each meaningful if/switch outcome, including the default or fallback path.
    - Evidence: 76.2% line coverage; risk signals: async/error handling, branching behavior; 46.2% branches coverage
  - **USEFUL** features.ts: exported functions are not all reached — Some functions in this file did not run during the latest coverage pass.
    - Suggested test: Add focused tests for the unreached function behavior, starting with public exports and error-returning helpers.
    - Evidence: 76.2% line coverage; risk signals: async/error handling, branching behavior; 75.9% functions coverage

### `src/services/sourceRiskFilters.ts`
- **Project:** Node.js project: test-inspector (Node.js)
- **Headline:** sourceRiskFilters.ts — critical code with untested branches/functions
- **Why:** This file is critical (exported public surface, branching behavior) and the latest coverage shows weak branch/function evidence. Existing tests reach the file, but they do not prove enough alternate outcomes. Add cases for the skipped decisions and unreached functions.
- **Suggestion:** Review related tests for meaningful assertions and edge cases. Start with: Add table-driven cases for each meaningful if/switch outcome, including the default or fallback path.
- **Evidence:**
  - `high-criticality` (weight 12) — exported public surface, branching behavior
  - `low-branch-coverage` (weight 18) — 60% branch coverage — alternate paths need tests
- **Suggested test gaps:**
  - **USEFUL** sourceRiskFilters.ts: alternate branches are not proven — The source contains decision paths, but branch coverage says not enough of those choices ran during tests.
    - Suggested test: Add table-driven cases for each meaningful if/switch outcome, including the default or fallback path.
    - Evidence: 78.9% line coverage; risk signals: exported public surface, branching behavior; 60% branches coverage
  - **USEFUL** sourceRiskFilters.ts: exported functions are not all reached — Some functions in this file did not run during the latest coverage pass.
    - Suggested test: Add focused tests for the unreached function behavior, starting with public exports and error-returning helpers.
    - Evidence: 78.9% line coverage; risk signals: exported public surface, branching behavior; 70% functions coverage

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

## 🟢 Strong (33)

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