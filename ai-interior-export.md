# Test Inspector — Case File

_Generated: 2026-05-16T20:20:01.898Z_

## Summary

- **🔴 Theater**: 1
- **🟡 Weak**: 115
- **⚪ Missing**: 21
- **🟢 Strong**: 86

### Projects scanned

- **Flutter app: Ai-Interior-Design** (Flutter) — 166 case(s)
- **Firebase functions: functions** (Firebase Functions) — 57 case(s)

## 🔴 Theater (1)

### `test/services/specialist-registry.test.ts`
- **Project:** Firebase functions: functions (Firebase Functions)
- **Headline:** specialist-registry.test.ts — 1 weak signal
- **Why:** Theater test: the assertions are tautological (`expect(x).toBe(x)` style). It will pass whether the production code is correct or broken. Fix is not "add more assertions" — delete this test and write one that triggers the actual behavior, then asserts on the observable result (returned value, persisted state, or rendered output a user would see).
- **Suggestion:** Delete `specialist-registry.test.ts` and replace it with a test that triggers the unit's behavior and asserts on the observable result (returned value, persisted state, or rendered output).
- **Evidence:**
  - `trivial-assertion` (weight 30) — Only checks that something exists; verify behavior or output instead. _(specialist-registry.test.ts:52)_
  - `trivial-assertion` (weight 30) — Truthy assertion may be too weak; prefer a specific observable outcome. _(specialist-registry.test.ts:21)_

## 🟡 Weak (115)

### `lib/router/app_router.dart`
- **Project:** Flutter app: Ai-Interior-Design (Flutter)
- **Headline:** app_router.dart — critical code with 35% coverage
- **Why:** This file is critical (auth/session logic, form/validation logic, stateful UI logic, routing logic) and only 35% of its lines are exercised by the existing tests. The uncovered lines are where bugs hide. Add cases that exercise the error / branch paths the existing tests skip.
- **Suggestion:** Expand tests to cover branches, error states, and user-visible outcomes.
- **Evidence:**
  - `auth/session logic` (weight 10) — auth/session logic
  - `form/validation logic` (weight 10) — form/validation logic
  - `stateful UI logic` (weight 10) — stateful UI logic
  - `routing logic` (weight 10) — routing logic
  - `branching behavior` (weight 10) — branching behavior
  - `low-line-coverage` (weight 20) — 35% line coverage

### `lib/screens/auth/sign_in_email_screen.dart`
- **Project:** Flutter app: Ai-Interior-Design (Flutter)
- **Headline:** sign_in_email_screen.dart — critical code with 1% coverage
- **Why:** This file is critical (auth/session logic, stateful UI logic, async/error handling, branching behavior) and only 1% of its lines are exercised by the existing tests. The uncovered lines are where bugs hide. Add cases that exercise the error / branch paths the existing tests skip.
- **Suggestion:** Expand tests to cover branches, error states, and user-visible outcomes.
- **Evidence:**
  - `auth/session logic` (weight 10) — auth/session logic
  - `stateful UI logic` (weight 10) — stateful UI logic
  - `async/error handling` (weight 10) — async/error handling
  - `branching behavior` (weight 10) — branching behavior
  - `low-line-coverage` (weight 20) — 1% line coverage

### `lib/screens/auth/sign_in_screen.dart`
- **Project:** Flutter app: Ai-Interior-Design (Flutter)
- **Headline:** sign_in_screen.dart — critical code with 0% coverage
- **Why:** This file is critical (auth/session logic, form/validation logic, stateful UI logic, async/error handling) and only 0% of its lines are exercised by the existing tests. The uncovered lines are where bugs hide. Add cases that exercise the error / branch paths the existing tests skip.
- **Suggestion:** Expand tests to cover branches, error states, and user-visible outcomes.
- **Evidence:**
  - `auth/session logic` (weight 10) — auth/session logic
  - `form/validation logic` (weight 10) — form/validation logic
  - `stateful UI logic` (weight 10) — stateful UI logic
  - `async/error handling` (weight 10) — async/error handling
  - `branching behavior` (weight 10) — branching behavior
  - `low-line-coverage` (weight 20) — 0% line coverage

### `lib/screens/auth/sign_up_screen.dart`
- **Project:** Flutter app: Ai-Interior-Design (Flutter)
- **Headline:** sign_up_screen.dart — critical code with 1% coverage
- **Why:** This file is critical (auth/session logic, form/validation logic, stateful UI logic, async/error handling) and only 1% of its lines are exercised by the existing tests. The uncovered lines are where bugs hide. Add cases that exercise the error / branch paths the existing tests skip.
- **Suggestion:** Expand tests to cover branches, error states, and user-visible outcomes.
- **Evidence:**
  - `auth/session logic` (weight 10) — auth/session logic
  - `form/validation logic` (weight 10) — form/validation logic
  - `stateful UI logic` (weight 10) — stateful UI logic
  - `async/error handling` (weight 10) — async/error handling
  - `branching behavior` (weight 10) — branching behavior
  - `low-line-coverage` (weight 20) — 1% line coverage

### `lib/screens/chat/chat_screen.dart`
- **Project:** Flutter app: Ai-Interior-Design (Flutter)
- **Headline:** chat_screen.dart — critical code with 1% coverage
- **Why:** This file is critical (permission logic, API/data flow, stateful UI logic, async/error handling) and only 1% of its lines are exercised by the existing tests. The uncovered lines are where bugs hide. Add cases that exercise the error / branch paths the existing tests skip.
- **Suggestion:** Expand tests to cover branches, error states, and user-visible outcomes.
- **Evidence:**
  - `permission logic` (weight 10) — permission logic
  - `API/data flow` (weight 10) — API/data flow
  - `stateful UI logic` (weight 10) — stateful UI logic
  - `async/error handling` (weight 10) — async/error handling
  - `branching behavior` (weight 10) — branching behavior
  - `low-line-coverage` (weight 20) — 1% line coverage

### `lib/screens/chat/widgets/chat_attachment_picker.dart`
- **Project:** Flutter app: Ai-Interior-Design (Flutter)
- **Headline:** chat_attachment_picker.dart — critical code with 0% coverage
- **Why:** This file is critical (form/validation logic, stateful UI logic, async/error handling, branching behavior) and only 0% of its lines are exercised by the existing tests. The uncovered lines are where bugs hide. Add cases that exercise the error / branch paths the existing tests skip.
- **Suggestion:** Expand tests to cover branches, error states, and user-visible outcomes.
- **Evidence:**
  - `form/validation logic` (weight 10) — form/validation logic
  - `stateful UI logic` (weight 10) — stateful UI logic
  - `async/error handling` (weight 10) — async/error handling
  - `branching behavior` (weight 10) — branching behavior
  - `low-line-coverage` (weight 20) — 0% line coverage

### `lib/screens/chat/widgets/chat_input_bar.dart`
- **Project:** Flutter app: Ai-Interior-Design (Flutter)
- **Headline:** chat_input_bar.dart — critical code with 0% coverage
- **Why:** This file is critical (form/validation logic, stateful UI logic, async/error handling, branching behavior) and only 0% of its lines are exercised by the existing tests. The uncovered lines are where bugs hide. Add cases that exercise the error / branch paths the existing tests skip.
- **Suggestion:** Expand tests to cover branches, error states, and user-visible outcomes.
- **Evidence:**
  - `form/validation logic` (weight 10) — form/validation logic
  - `stateful UI logic` (weight 10) — stateful UI logic
  - `async/error handling` (weight 10) — async/error handling
  - `branching behavior` (weight 10) — branching behavior
  - `low-line-coverage` (weight 20) — 0% line coverage

### `lib/screens/chat/widgets/chat_message_bubble.dart`
- **Project:** Flutter app: Ai-Interior-Design (Flutter)
- **Headline:** chat_message_bubble.dart — critical code with 0% coverage
- **Why:** This file is critical (form/validation logic, stateful UI logic, async/error handling, branching behavior) and only 0% of its lines are exercised by the existing tests. The uncovered lines are where bugs hide. Add cases that exercise the error / branch paths the existing tests skip.
- **Suggestion:** Expand tests to cover branches, error states, and user-visible outcomes.
- **Evidence:**
  - `form/validation logic` (weight 10) — form/validation logic
  - `stateful UI logic` (weight 10) — stateful UI logic
  - `async/error handling` (weight 10) — async/error handling
  - `branching behavior` (weight 10) — branching behavior
  - `low-line-coverage` (weight 20) — 0% line coverage

### `lib/screens/chat/widgets/chat_message_list.dart`
- **Project:** Flutter app: Ai-Interior-Design (Flutter)
- **Headline:** chat_message_list.dart — critical code with 0% coverage
- **Why:** This file is critical (API/data flow, form/validation logic, stateful UI logic, async/error handling) and only 0% of its lines are exercised by the existing tests. The uncovered lines are where bugs hide. Add cases that exercise the error / branch paths the existing tests skip.
- **Suggestion:** Expand tests to cover branches, error states, and user-visible outcomes.
- **Evidence:**
  - `API/data flow` (weight 10) — API/data flow
  - `form/validation logic` (weight 10) — form/validation logic
  - `stateful UI logic` (weight 10) — stateful UI logic
  - `async/error handling` (weight 10) — async/error handling
  - `branching behavior` (weight 10) — branching behavior
  - `low-line-coverage` (weight 20) — 0% line coverage

### `lib/screens/chat/widgets/drawer_conversation_actions.dart`
- **Project:** Flutter app: Ai-Interior-Design (Flutter)
- **Headline:** drawer_conversation_actions.dart — critical code with 0% coverage
- **Why:** This file is critical (form/validation logic, stateful UI logic, async/error handling, branching behavior) and only 0% of its lines are exercised by the existing tests. The uncovered lines are where bugs hide. Add cases that exercise the error / branch paths the existing tests skip.
- **Suggestion:** Expand tests to cover branches, error states, and user-visible outcomes.
- **Evidence:**
  - `form/validation logic` (weight 10) — form/validation logic
  - `stateful UI logic` (weight 10) — stateful UI logic
  - `async/error handling` (weight 10) — async/error handling
  - `branching behavior` (weight 10) — branching behavior
  - `low-line-coverage` (weight 20) — 0% line coverage

### `lib/screens/chat/widgets/typewriter_markdown.dart`
- **Project:** Flutter app: Ai-Interior-Design (Flutter)
- **Headline:** typewriter_markdown.dart — critical code with 0% coverage
- **Why:** This file is critical (form/validation logic, stateful UI logic, async/error handling, branching behavior) and only 0% of its lines are exercised by the existing tests. The uncovered lines are where bugs hide. Add cases that exercise the error / branch paths the existing tests skip.
- **Suggestion:** Expand tests to cover branches, error states, and user-visible outcomes.
- **Evidence:**
  - `form/validation logic` (weight 10) — form/validation logic
  - `stateful UI logic` (weight 10) — stateful UI logic
  - `async/error handling` (weight 10) — async/error handling
  - `branching behavior` (weight 10) — branching behavior
  - `low-line-coverage` (weight 20) — 0% line coverage

### `lib/screens/explore/widgets/explore_preset_grid.dart`
- **Project:** Flutter app: Ai-Interior-Design (Flutter)
- **Headline:** explore_preset_grid.dart — critical code with 0% coverage
- **Why:** This file is critical (form/validation logic, stateful UI logic, async/error handling, branching behavior) and only 0% of its lines are exercised by the existing tests. The uncovered lines are where bugs hide. Add cases that exercise the error / branch paths the existing tests skip.
- **Suggestion:** Expand tests to cover branches, error states, and user-visible outcomes.
- **Evidence:**
  - `form/validation logic` (weight 10) — form/validation logic
  - `stateful UI logic` (weight 10) — stateful UI logic
  - `async/error handling` (weight 10) — async/error handling
  - `branching behavior` (weight 10) — branching behavior
  - `low-line-coverage` (weight 20) — 0% line coverage

### `lib/screens/generate/camera_screen.dart`
- **Project:** Flutter app: Ai-Interior-Design (Flutter)
- **Headline:** camera_screen.dart — critical code with 1% coverage
- **Why:** This file is critical (permission logic, form/validation logic, stateful UI logic, async/error handling) and only 1% of its lines are exercised by the existing tests. The uncovered lines are where bugs hide. Add cases that exercise the error / branch paths the existing tests skip.
- **Suggestion:** Expand tests to cover branches, error states, and user-visible outcomes.
- **Evidence:**
  - `permission logic` (weight 10) — permission logic
  - `form/validation logic` (weight 10) — form/validation logic
  - `stateful UI logic` (weight 10) — stateful UI logic
  - `async/error handling` (weight 10) — async/error handling
  - `branching behavior` (weight 10) — branching behavior
  - `low-line-coverage` (weight 20) — 1% line coverage

### `lib/screens/generate/generate_generation_actions.dart`
- **Project:** Flutter app: Ai-Interior-Design (Flutter)
- **Headline:** generate_generation_actions.dart — critical code with 0% coverage
- **Why:** This file is critical (form/validation logic, stateful UI logic, async/error handling, branching behavior) and only 0% of its lines are exercised by the existing tests. The uncovered lines are where bugs hide. Add cases that exercise the error / branch paths the existing tests skip.
- **Suggestion:** Expand tests to cover branches, error states, and user-visible outcomes.
- **Evidence:**
  - `form/validation logic` (weight 10) — form/validation logic
  - `stateful UI logic` (weight 10) — stateful UI logic
  - `async/error handling` (weight 10) — async/error handling
  - `branching behavior` (weight 10) — branching behavior
  - `low-line-coverage` (weight 20) — 0% line coverage

### `lib/screens/generate/generate_image_picker_flow.dart`
- **Project:** Flutter app: Ai-Interior-Design (Flutter)
- **Headline:** generate_image_picker_flow.dart — critical code with 0% coverage
- **Why:** This file is critical (form/validation logic, stateful UI logic, async/error handling, branching behavior) and only 0% of its lines are exercised by the existing tests. The uncovered lines are where bugs hide. Add cases that exercise the error / branch paths the existing tests skip.
- **Suggestion:** Expand tests to cover branches, error states, and user-visible outcomes.
- **Evidence:**
  - `form/validation logic` (weight 10) — form/validation logic
  - `stateful UI logic` (weight 10) — stateful UI logic
  - `async/error handling` (weight 10) — async/error handling
  - `branching behavior` (weight 10) — branching behavior
  - `low-line-coverage` (weight 20) — 0% line coverage

### `lib/screens/generate/revamp_workflow/revamp_workflow_screen.dart`
- **Project:** Flutter app: Ai-Interior-Design (Flutter)
- **Headline:** revamp_workflow_screen.dart — critical code with 0% coverage
- **Why:** This file is critical (form/validation logic, stateful UI logic, routing logic, async/error handling) and only 0% of its lines are exercised by the existing tests. The uncovered lines are where bugs hide. Add cases that exercise the error / branch paths the existing tests skip.
- **Suggestion:** Expand tests to cover branches, error states, and user-visible outcomes.
- **Evidence:**
  - `form/validation logic` (weight 10) — form/validation logic
  - `stateful UI logic` (weight 10) — stateful UI logic
  - `routing logic` (weight 10) — routing logic
  - `async/error handling` (weight 10) — async/error handling
  - `branching behavior` (weight 10) — branching behavior
  - `low-line-coverage` (weight 20) — 0% line coverage

### `lib/screens/generate/revamp_workflow/widgets/step2_style_palette_view.dart`
- **Project:** Flutter app: Ai-Interior-Design (Flutter)
- **Headline:** step2_style_palette_view.dart — critical code with 0% coverage
- **Why:** This file is critical (form/validation logic, stateful UI logic, async/error handling, branching behavior) and only 0% of its lines are exercised by the existing tests. The uncovered lines are where bugs hide. Add cases that exercise the error / branch paths the existing tests skip.
- **Suggestion:** Expand tests to cover branches, error states, and user-visible outcomes.
- **Evidence:**
  - `form/validation logic` (weight 10) — form/validation logic
  - `stateful UI logic` (weight 10) — stateful UI logic
  - `async/error handling` (weight 10) — async/error handling
  - `branching behavior` (weight 10) — branching behavior
  - `low-line-coverage` (weight 20) — 0% line coverage

### `lib/screens/generate/revamp_workflow/widgets/step3_review_view.dart`
- **Project:** Flutter app: Ai-Interior-Design (Flutter)
- **Headline:** step3_review_view.dart — critical code with 0% coverage
- **Why:** This file is critical (form/validation logic, stateful UI logic, routing logic, branching behavior) and only 0% of its lines are exercised by the existing tests. The uncovered lines are where bugs hide. Add cases that exercise the error / branch paths the existing tests skip.
- **Suggestion:** Expand tests to cover branches, error states, and user-visible outcomes.
- **Evidence:**
  - `form/validation logic` (weight 10) — form/validation logic
  - `stateful UI logic` (weight 10) — stateful UI logic
  - `routing logic` (weight 10) — routing logic
  - `branching behavior` (weight 10) — branching behavior
  - `low-line-coverage` (weight 20) — 0% line coverage

### `lib/screens/generate/revamp_workflow/widgets/step4_result_view.dart`
- **Project:** Flutter app: Ai-Interior-Design (Flutter)
- **Headline:** step4_result_view.dart — critical code with 0% coverage
- **Why:** This file is critical (form/validation logic, stateful UI logic, async/error handling, branching behavior) and only 0% of its lines are exercised by the existing tests. The uncovered lines are where bugs hide. Add cases that exercise the error / branch paths the existing tests skip.
- **Suggestion:** Expand tests to cover branches, error states, and user-visible outcomes.
- **Evidence:**
  - `form/validation logic` (weight 10) — form/validation logic
  - `stateful UI logic` (weight 10) — stateful UI logic
  - `async/error handling` (weight 10) — async/error handling
  - `branching behavior` (weight 10) — branching behavior
  - `low-line-coverage` (weight 20) — 0% line coverage

### `lib/screens/generate/widgets/ai_glow_loader.dart`
- **Project:** Flutter app: Ai-Interior-Design (Flutter)
- **Headline:** ai_glow_loader.dart — critical code with 0% coverage
- **Why:** This file is critical (form/validation logic, stateful UI logic, async/error handling, branching behavior) and only 0% of its lines are exercised by the existing tests. The uncovered lines are where bugs hide. Add cases that exercise the error / branch paths the existing tests skip.
- **Suggestion:** Expand tests to cover branches, error states, and user-visible outcomes.
- **Evidence:**
  - `form/validation logic` (weight 10) — form/validation logic
  - `stateful UI logic` (weight 10) — stateful UI logic
  - `async/error handling` (weight 10) — async/error handling
  - `branching behavior` (weight 10) — branching behavior
  - `low-line-coverage` (weight 20) — 0% line coverage

### `lib/screens/home/widgets/home_hero_showcase.dart`
- **Project:** Flutter app: Ai-Interior-Design (Flutter)
- **Headline:** home_hero_showcase.dart — critical code with 1% coverage
- **Why:** This file is critical (form/validation logic, stateful UI logic, async/error handling, branching behavior) and only 1% of its lines are exercised by the existing tests. The uncovered lines are where bugs hide. Add cases that exercise the error / branch paths the existing tests skip.
- **Suggestion:** Expand tests to cover branches, error states, and user-visible outcomes.
- **Evidence:**
  - `form/validation logic` (weight 10) — form/validation logic
  - `stateful UI logic` (weight 10) — stateful UI logic
  - `async/error handling` (weight 10) — async/error handling
  - `branching behavior` (weight 10) — branching behavior
  - `low-line-coverage` (weight 20) — 1% line coverage

### `lib/screens/home/widgets/home_palette_discovery.dart`
- **Project:** Flutter app: Ai-Interior-Design (Flutter)
- **Headline:** home_palette_discovery.dart — critical code with 1% coverage
- **Why:** This file is critical (form/validation logic, stateful UI logic, async/error handling, branching behavior) and only 1% of its lines are exercised by the existing tests. The uncovered lines are where bugs hide. Add cases that exercise the error / branch paths the existing tests skip.
- **Suggestion:** Expand tests to cover branches, error states, and user-visible outcomes.
- **Evidence:**
  - `form/validation logic` (weight 10) — form/validation logic
  - `stateful UI logic` (weight 10) — stateful UI logic
  - `async/error handling` (weight 10) — async/error handling
  - `branching behavior` (weight 10) — branching behavior
  - `low-line-coverage` (weight 20) — 1% line coverage

### `lib/screens/home/widgets/home_quick_presets.dart`
- **Project:** Flutter app: Ai-Interior-Design (Flutter)
- **Headline:** home_quick_presets.dart — critical code with 0% coverage
- **Why:** This file is critical (form/validation logic, stateful UI logic, async/error handling, branching behavior) and only 0% of its lines are exercised by the existing tests. The uncovered lines are where bugs hide. Add cases that exercise the error / branch paths the existing tests skip.
- **Suggestion:** Expand tests to cover branches, error states, and user-visible outcomes.
- **Evidence:**
  - `form/validation logic` (weight 10) — form/validation logic
  - `stateful UI logic` (weight 10) — stateful UI logic
  - `async/error handling` (weight 10) — async/error handling
  - `branching behavior` (weight 10) — branching behavior
  - `low-line-coverage` (weight 20) — 0% line coverage

### `lib/screens/inpaint/inpaint_screen.dart`
- **Project:** Flutter app: Ai-Interior-Design (Flutter)
- **Headline:** inpaint_screen.dart — critical code with 0% coverage
- **Why:** This file is critical (form/validation logic, stateful UI logic, async/error handling, branching behavior) and only 0% of its lines are exercised by the existing tests. The uncovered lines are where bugs hide. Add cases that exercise the error / branch paths the existing tests skip.
- **Suggestion:** Expand tests to cover branches, error states, and user-visible outcomes.
- **Evidence:**
  - `form/validation logic` (weight 10) — form/validation logic
  - `stateful UI logic` (weight 10) — stateful UI logic
  - `async/error handling` (weight 10) — async/error handling
  - `branching behavior` (weight 10) — branching behavior
  - `low-line-coverage` (weight 20) — 0% line coverage

### `lib/screens/profile/palette_designer_screen.dart`
- **Project:** Flutter app: Ai-Interior-Design (Flutter)
- **Headline:** palette_designer_screen.dart — critical code with 0% coverage
- **Why:** This file is critical (form/validation logic, stateful UI logic, async/error handling, branching behavior) and only 0% of its lines are exercised by the existing tests. The uncovered lines are where bugs hide. Add cases that exercise the error / branch paths the existing tests skip.
- **Suggestion:** Expand tests to cover branches, error states, and user-visible outcomes.
- **Evidence:**
  - `form/validation logic` (weight 10) — form/validation logic
  - `stateful UI logic` (weight 10) — stateful UI logic
  - `async/error handling` (weight 10) — async/error handling
  - `branching behavior` (weight 10) — branching behavior
  - `low-line-coverage` (weight 20) — 0% line coverage

### `lib/screens/profile/profile_screen.dart`
- **Project:** Flutter app: Ai-Interior-Design (Flutter)
- **Headline:** profile_screen.dart — critical code with 0% coverage
- **Why:** This file is critical (auth/session logic, form/validation logic, stateful UI logic, async/error handling) and only 0% of its lines are exercised by the existing tests. The uncovered lines are where bugs hide. Add cases that exercise the error / branch paths the existing tests skip.
- **Suggestion:** Expand tests to cover branches, error states, and user-visible outcomes.
- **Evidence:**
  - `auth/session logic` (weight 10) — auth/session logic
  - `form/validation logic` (weight 10) — form/validation logic
  - `stateful UI logic` (weight 10) — stateful UI logic
  - `async/error handling` (weight 10) — async/error handling
  - `branching behavior` (weight 10) — branching behavior
  - `low-line-coverage` (weight 20) — 0% line coverage

### `lib/screens/profile/prompt_history_screen.dart`
- **Project:** Flutter app: Ai-Interior-Design (Flutter)
- **Headline:** prompt_history_screen.dart — critical code with 1% coverage
- **Why:** This file is critical (form/validation logic, stateful UI logic, async/error handling, branching behavior) and only 1% of its lines are exercised by the existing tests. The uncovered lines are where bugs hide. Add cases that exercise the error / branch paths the existing tests skip.
- **Suggestion:** Expand tests to cover branches, error states, and user-visible outcomes.
- **Evidence:**
  - `form/validation logic` (weight 10) — form/validation logic
  - `stateful UI logic` (weight 10) — stateful UI logic
  - `async/error handling` (weight 10) — async/error handling
  - `branching behavior` (weight 10) — branching behavior
  - `low-line-coverage` (weight 20) — 1% line coverage

### `lib/screens/projects/project_detail_screen.dart`
- **Project:** Flutter app: Ai-Interior-Design (Flutter)
- **Headline:** project_detail_screen.dart — critical code with 0% coverage
- **Why:** This file is critical (form/validation logic, stateful UI logic, routing logic, async/error handling) and only 0% of its lines are exercised by the existing tests. The uncovered lines are where bugs hide. Add cases that exercise the error / branch paths the existing tests skip.
- **Suggestion:** Expand tests to cover branches, error states, and user-visible outcomes.
- **Evidence:**
  - `form/validation logic` (weight 10) — form/validation logic
  - `stateful UI logic` (weight 10) — stateful UI logic
  - `routing logic` (weight 10) — routing logic
  - `async/error handling` (weight 10) — async/error handling
  - `branching behavior` (weight 10) — branching behavior
  - `low-line-coverage` (weight 20) — 0% line coverage

### `lib/services/auth_service.dart`
- **Project:** Flutter app: Ai-Interior-Design (Flutter)
- **Headline:** auth_service.dart — critical code with 0% coverage
- **Why:** This file is critical (auth/session logic, API/data flow, form/validation logic, async/error handling) and only 0% of its lines are exercised by the existing tests. The uncovered lines are where bugs hide. Add cases that exercise the error / branch paths the existing tests skip.
- **Suggestion:** Expand tests to cover branches, error states, and user-visible outcomes.
- **Evidence:**
  - `auth/session logic` (weight 10) — auth/session logic
  - `API/data flow` (weight 10) — API/data flow
  - `form/validation logic` (weight 10) — form/validation logic
  - `async/error handling` (weight 10) — async/error handling
  - `branching behavior` (weight 10) — branching behavior
  - `low-line-coverage` (weight 20) — 0% line coverage

### `lib/services/chat_service.dart`
- **Project:** Flutter app: Ai-Interior-Design (Flutter)
- **Headline:** chat_service.dart — critical code with 1% coverage
- **Why:** This file is critical (API/data flow, form/validation logic, async/error handling, branching behavior) and only 1% of its lines are exercised by the existing tests. The uncovered lines are where bugs hide. Add cases that exercise the error / branch paths the existing tests skip.
- **Suggestion:** Expand tests to cover branches, error states, and user-visible outcomes.
- **Evidence:**
  - `API/data flow` (weight 10) — API/data flow
  - `form/validation logic` (weight 10) — form/validation logic
  - `async/error handling` (weight 10) — async/error handling
  - `branching behavior` (weight 10) — branching behavior
  - `low-line-coverage` (weight 20) — 1% line coverage

### `lib/services/inpaint_feasibility_service.dart`
- **Project:** Flutter app: Ai-Interior-Design (Flutter)
- **Headline:** inpaint_feasibility_service.dart — critical code with 6% coverage
- **Why:** This file is critical (auth/session logic, form/validation logic, async/error handling) and only 6% of its lines are exercised by the existing tests. The uncovered lines are where bugs hide. Add cases that exercise the error / branch paths the existing tests skip.
- **Suggestion:** Expand tests to cover branches, error states, and user-visible outcomes.
- **Evidence:**
  - `auth/session logic` (weight 10) — auth/session logic
  - `form/validation logic` (weight 10) — form/validation logic
  - `async/error handling` (weight 10) — async/error handling
  - `low-line-coverage` (weight 20) — 6% line coverage

### `lib/services/magic_wand_selector.dart`
- **Project:** Flutter app: Ai-Interior-Design (Flutter)
- **Headline:** magic_wand_selector.dart — critical code with 0% coverage
- **Why:** This file is critical (API/data flow, form/validation logic, async/error handling, branching behavior) and only 0% of its lines are exercised by the existing tests. The uncovered lines are where bugs hide. Add cases that exercise the error / branch paths the existing tests skip.
- **Suggestion:** Expand tests to cover branches, error states, and user-visible outcomes.
- **Evidence:**
  - `API/data flow` (weight 10) — API/data flow
  - `form/validation logic` (weight 10) — form/validation logic
  - `async/error handling` (weight 10) — async/error handling
  - `branching behavior` (weight 10) — branching behavior
  - `low-line-coverage` (weight 20) — 0% line coverage

### `lib/ui_library/cards/preset_visual_card.dart`
- **Project:** Flutter app: Ai-Interior-Design (Flutter)
- **Headline:** preset_visual_card.dart — critical code with 0% coverage
- **Why:** This file is critical (form/validation logic, stateful UI logic, routing logic, branching behavior) and only 0% of its lines are exercised by the existing tests. The uncovered lines are where bugs hide. Add cases that exercise the error / branch paths the existing tests skip.
- **Suggestion:** Expand tests to cover branches, error states, and user-visible outcomes.
- **Evidence:**
  - `form/validation logic` (weight 10) — form/validation logic
  - `stateful UI logic` (weight 10) — stateful UI logic
  - `routing logic` (weight 10) — routing logic
  - `branching behavior` (weight 10) — branching behavior
  - `low-line-coverage` (weight 20) — 0% line coverage

### `lib/ui_library/media/image_compare_viewer.dart`
- **Project:** Flutter app: Ai-Interior-Design (Flutter)
- **Headline:** image_compare_viewer.dart — critical code with 0% coverage
- **Why:** This file is critical (form/validation logic, stateful UI logic, async/error handling, branching behavior) and only 0% of its lines are exercised by the existing tests. The uncovered lines are where bugs hide. Add cases that exercise the error / branch paths the existing tests skip.
- **Suggestion:** Expand tests to cover branches, error states, and user-visible outcomes.
- **Evidence:**
  - `form/validation logic` (weight 10) — form/validation logic
  - `stateful UI logic` (weight 10) — stateful UI logic
  - `async/error handling` (weight 10) — async/error handling
  - `branching behavior` (weight 10) — branching behavior
  - `low-line-coverage` (weight 20) — 0% line coverage

### `lib/ui_library/media/fullscreen_image_viewer.dart`
- **Project:** Flutter app: Ai-Interior-Design (Flutter)
- **Headline:** fullscreen_image_viewer.dart — critical code with 0% coverage
- **Why:** This file is critical (form/validation logic, stateful UI logic, async/error handling) and only 0% of its lines are exercised by the existing tests. The uncovered lines are where bugs hide. Add cases that exercise the error / branch paths the existing tests skip.
- **Suggestion:** Expand tests to cover branches, error states, and user-visible outcomes.
- **Evidence:**
  - `form/validation logic` (weight 10) — form/validation logic
  - `stateful UI logic` (weight 10) — stateful UI logic
  - `async/error handling` (weight 10) — async/error handling
  - `low-line-coverage` (weight 20) — 0% line coverage

### `lib/screens/chat/widgets/chat_history_drawer.dart`
- **Project:** Flutter app: Ai-Interior-Design (Flutter)
- **Headline:** chat_history_drawer.dart — critical code with 0% coverage
- **Why:** This file is critical (form/validation logic, stateful UI logic, branching behavior) and only 0% of its lines are exercised by the existing tests. The uncovered lines are where bugs hide. Add cases that exercise the error / branch paths the existing tests skip.
- **Suggestion:** Expand tests to cover branches, error states, and user-visible outcomes.
- **Evidence:**
  - `form/validation logic` (weight 10) — form/validation logic
  - `stateful UI logic` (weight 10) — stateful UI logic
  - `branching behavior` (weight 10) — branching behavior
  - `low-line-coverage` (weight 20) — 0% line coverage

### `lib/screens/chat/widgets/chat_image_thumbnail.dart`
- **Project:** Flutter app: Ai-Interior-Design (Flutter)
- **Headline:** chat_image_thumbnail.dart — critical code with 0% coverage
- **Why:** This file is critical (form/validation logic, stateful UI logic, branching behavior) and only 0% of its lines are exercised by the existing tests. The uncovered lines are where bugs hide. Add cases that exercise the error / branch paths the existing tests skip.
- **Suggestion:** Expand tests to cover branches, error states, and user-visible outcomes.
- **Evidence:**
  - `form/validation logic` (weight 10) — form/validation logic
  - `stateful UI logic` (weight 10) — stateful UI logic
  - `branching behavior` (weight 10) — branching behavior
  - `low-line-coverage` (weight 20) — 0% line coverage

### `lib/screens/chat/widgets/chat_welcome_view.dart`
- **Project:** Flutter app: Ai-Interior-Design (Flutter)
- **Headline:** chat_welcome_view.dart — critical code with 0% coverage
- **Why:** This file is critical (form/validation logic, stateful UI logic, branching behavior) and only 0% of its lines are exercised by the existing tests. The uncovered lines are where bugs hide. Add cases that exercise the error / branch paths the existing tests skip.
- **Suggestion:** Expand tests to cover branches, error states, and user-visible outcomes.
- **Evidence:**
  - `form/validation logic` (weight 10) — form/validation logic
  - `stateful UI logic` (weight 10) — stateful UI logic
  - `branching behavior` (weight 10) — branching behavior
  - `low-line-coverage` (weight 20) — 0% line coverage

### `lib/screens/chat/widgets/drawer_conversation_tile.dart`
- **Project:** Flutter app: Ai-Interior-Design (Flutter)
- **Headline:** drawer_conversation_tile.dart — critical code with 0% coverage
- **Why:** This file is critical (form/validation logic, stateful UI logic, branching behavior) and only 0% of its lines are exercised by the existing tests. The uncovered lines are where bugs hide. Add cases that exercise the error / branch paths the existing tests skip.
- **Suggestion:** Expand tests to cover branches, error states, and user-visible outcomes.
- **Evidence:**
  - `form/validation logic` (weight 10) — form/validation logic
  - `stateful UI logic` (weight 10) — stateful UI logic
  - `branching behavior` (weight 10) — branching behavior
  - `low-line-coverage` (weight 20) — 0% line coverage

### `lib/screens/chat/widgets/specialist_cards.dart`
- **Project:** Flutter app: Ai-Interior-Design (Flutter)
- **Headline:** specialist_cards.dart — critical code with 0% coverage
- **Why:** This file is critical (form/validation logic, stateful UI logic, branching behavior) and only 0% of its lines are exercised by the existing tests. The uncovered lines are where bugs hide. Add cases that exercise the error / branch paths the existing tests skip.
- **Suggestion:** Expand tests to cover branches, error states, and user-visible outcomes.
- **Evidence:**
  - `form/validation logic` (weight 10) — form/validation logic
  - `stateful UI logic` (weight 10) — stateful UI logic
  - `branching behavior` (weight 10) — branching behavior
  - `low-line-coverage` (weight 20) — 0% line coverage

### `lib/screens/explore/widgets/explore_search_bar.dart`
- **Project:** Flutter app: Ai-Interior-Design (Flutter)
- **Headline:** explore_search_bar.dart — critical code with 0% coverage
- **Why:** This file is critical (form/validation logic, stateful UI logic, branching behavior) and only 0% of its lines are exercised by the existing tests. The uncovered lines are where bugs hide. Add cases that exercise the error / branch paths the existing tests skip.
- **Suggestion:** Expand tests to cover branches, error states, and user-visible outcomes.
- **Evidence:**
  - `form/validation logic` (weight 10) — form/validation logic
  - `stateful UI logic` (weight 10) — stateful UI logic
  - `branching behavior` (weight 10) — branching behavior
  - `low-line-coverage` (weight 20) — 0% line coverage

### `lib/screens/floating_nav_bar.dart`
- **Project:** Flutter app: Ai-Interior-Design (Flutter)
- **Headline:** floating_nav_bar.dart — critical code with 0% coverage
- **Why:** This file is critical (form/validation logic, stateful UI logic, branching behavior) and only 0% of its lines are exercised by the existing tests. The uncovered lines are where bugs hide. Add cases that exercise the error / branch paths the existing tests skip.
- **Suggestion:** Expand tests to cover branches, error states, and user-visible outcomes.
- **Evidence:**
  - `form/validation logic` (weight 10) — form/validation logic
  - `stateful UI logic` (weight 10) — stateful UI logic
  - `branching behavior` (weight 10) — branching behavior
  - `low-line-coverage` (weight 20) — 0% line coverage

### `lib/screens/generate/revamp_workflow/widgets/palette_swatch_carousel.dart`
- **Project:** Flutter app: Ai-Interior-Design (Flutter)
- **Headline:** palette_swatch_carousel.dart — critical code with 0% coverage
- **Why:** This file is critical (form/validation logic, stateful UI logic, branching behavior) and only 0% of its lines are exercised by the existing tests. The uncovered lines are where bugs hide. Add cases that exercise the error / branch paths the existing tests skip.
- **Suggestion:** Expand tests to cover branches, error states, and user-visible outcomes.
- **Evidence:**
  - `form/validation logic` (weight 10) — form/validation logic
  - `stateful UI logic` (weight 10) — stateful UI logic
  - `branching behavior` (weight 10) — branching behavior
  - `low-line-coverage` (weight 20) — 0% line coverage

### `lib/screens/generate/revamp_workflow/widgets/revamp_summary_card.dart`
- **Project:** Flutter app: Ai-Interior-Design (Flutter)
- **Headline:** revamp_summary_card.dart — critical code with 0% coverage
- **Why:** This file is critical (form/validation logic, stateful UI logic, branching behavior) and only 0% of its lines are exercised by the existing tests. The uncovered lines are where bugs hide. Add cases that exercise the error / branch paths the existing tests skip.
- **Suggestion:** Expand tests to cover branches, error states, and user-visible outcomes.
- **Evidence:**
  - `form/validation logic` (weight 10) — form/validation logic
  - `stateful UI logic` (weight 10) — stateful UI logic
  - `branching behavior` (weight 10) — branching behavior
  - `low-line-coverage` (weight 20) — 0% line coverage

### `lib/screens/generate/revamp_workflow/widgets/revamp_workflow_continue_bar.dart`
- **Project:** Flutter app: Ai-Interior-Design (Flutter)
- **Headline:** revamp_workflow_continue_bar.dart — critical code with 0% coverage
- **Why:** This file is critical (form/validation logic, stateful UI logic, branching behavior) and only 0% of its lines are exercised by the existing tests. The uncovered lines are where bugs hide. Add cases that exercise the error / branch paths the existing tests skip.
- **Suggestion:** Expand tests to cover branches, error states, and user-visible outcomes.
- **Evidence:**
  - `form/validation logic` (weight 10) — form/validation logic
  - `stateful UI logic` (weight 10) — stateful UI logic
  - `branching behavior` (weight 10) — branching behavior
  - `low-line-coverage` (weight 20) — 0% line coverage

### `lib/screens/generate/revamp_workflow/widgets/revamp_workflow_header.dart`
- **Project:** Flutter app: Ai-Interior-Design (Flutter)
- **Headline:** revamp_workflow_header.dart — critical code with 0% coverage
- **Why:** This file is critical (form/validation logic, stateful UI logic, branching behavior) and only 0% of its lines are exercised by the existing tests. The uncovered lines are where bugs hide. Add cases that exercise the error / branch paths the existing tests skip.
- **Suggestion:** Expand tests to cover branches, error states, and user-visible outcomes.
- **Evidence:**
  - `form/validation logic` (weight 10) — form/validation logic
  - `stateful UI logic` (weight 10) — stateful UI logic
  - `branching behavior` (weight 10) — branching behavior
  - `low-line-coverage` (weight 20) — 0% line coverage

### `lib/screens/generate/revamp_workflow/widgets/revamp_workflow_progress.dart`
- **Project:** Flutter app: Ai-Interior-Design (Flutter)
- **Headline:** revamp_workflow_progress.dart — critical code with 0% coverage
- **Why:** This file is critical (form/validation logic, stateful UI logic, branching behavior) and only 0% of its lines are exercised by the existing tests. The uncovered lines are where bugs hide. Add cases that exercise the error / branch paths the existing tests skip.
- **Suggestion:** Expand tests to cover branches, error states, and user-visible outcomes.
- **Evidence:**
  - `form/validation logic` (weight 10) — form/validation logic
  - `stateful UI logic` (weight 10) — stateful UI logic
  - `branching behavior` (weight 10) — branching behavior
  - `low-line-coverage` (weight 20) — 0% line coverage

### `lib/screens/generate/revamp_workflow/widgets/step1_photo_view.dart`
- **Project:** Flutter app: Ai-Interior-Design (Flutter)
- **Headline:** step1_photo_view.dart — critical code with 0% coverage
- **Why:** This file is critical (form/validation logic, stateful UI logic, branching behavior) and only 0% of its lines are exercised by the existing tests. The uncovered lines are where bugs hide. Add cases that exercise the error / branch paths the existing tests skip.
- **Suggestion:** Expand tests to cover branches, error states, and user-visible outcomes.
- **Evidence:**
  - `form/validation logic` (weight 10) — form/validation logic
  - `stateful UI logic` (weight 10) — stateful UI logic
  - `branching behavior` (weight 10) — branching behavior
  - `low-line-coverage` (weight 20) — 0% line coverage

### `lib/screens/generate/revamp_workflow/widgets/style_gallery_card.dart`
- **Project:** Flutter app: Ai-Interior-Design (Flutter)
- **Headline:** style_gallery_card.dart — critical code with 0% coverage
- **Why:** This file is critical (form/validation logic, stateful UI logic, branching behavior) and only 0% of its lines are exercised by the existing tests. The uncovered lines are where bugs hide. Add cases that exercise the error / branch paths the existing tests skip.
- **Suggestion:** Expand tests to cover branches, error states, and user-visible outcomes.
- **Evidence:**
  - `form/validation logic` (weight 10) — form/validation logic
  - `stateful UI logic` (weight 10) — stateful UI logic
  - `branching behavior` (weight 10) — branching behavior
  - `low-line-coverage` (weight 20) — 0% line coverage

### `lib/screens/generate/widgets/camera_guide_overlay.dart`
- **Project:** Flutter app: Ai-Interior-Design (Flutter)
- **Headline:** camera_guide_overlay.dart — critical code with 0% coverage
- **Why:** This file is critical (form/validation logic, stateful UI logic, branching behavior) and only 0% of its lines are exercised by the existing tests. The uncovered lines are where bugs hide. Add cases that exercise the error / branch paths the existing tests skip.
- **Suggestion:** Expand tests to cover branches, error states, and user-visible outcomes.
- **Evidence:**
  - `form/validation logic` (weight 10) — form/validation logic
  - `stateful UI logic` (weight 10) — stateful UI logic
  - `branching behavior` (weight 10) — branching behavior
  - `low-line-coverage` (weight 20) — 0% line coverage

### `lib/screens/generate/widgets/photo_quality_badge.dart`
- **Project:** Flutter app: Ai-Interior-Design (Flutter)
- **Headline:** photo_quality_badge.dart — critical code with 0% coverage
- **Why:** This file is critical (form/validation logic, stateful UI logic, branching behavior) and only 0% of its lines are exercised by the existing tests. The uncovered lines are where bugs hide. Add cases that exercise the error / branch paths the existing tests skip.
- **Suggestion:** Expand tests to cover branches, error states, and user-visible outcomes.
- **Evidence:**
  - `form/validation logic` (weight 10) — form/validation logic
  - `stateful UI logic` (weight 10) — stateful UI logic
  - `branching behavior` (weight 10) — branching behavior
  - `low-line-coverage` (weight 20) — 0% line coverage

### `lib/screens/generate/widgets/photo_tips_sheet.dart`
- **Project:** Flutter app: Ai-Interior-Design (Flutter)
- **Headline:** photo_tips_sheet.dart — critical code with 0% coverage
- **Why:** This file is critical (form/validation logic, stateful UI logic, branching behavior) and only 0% of its lines are exercised by the existing tests. The uncovered lines are where bugs hide. Add cases that exercise the error / branch paths the existing tests skip.
- **Suggestion:** Expand tests to cover branches, error states, and user-visible outcomes.
- **Evidence:**
  - `form/validation logic` (weight 10) — form/validation logic
  - `stateful UI logic` (weight 10) — stateful UI logic
  - `branching behavior` (weight 10) — branching behavior
  - `low-line-coverage` (weight 20) — 0% line coverage

### `lib/screens/home/home_screen.dart`
- **Project:** Flutter app: Ai-Interior-Design (Flutter)
- **Headline:** home_screen.dart — critical code with 2% coverage
- **Why:** This file is critical (form/validation logic, stateful UI logic, branching behavior) and only 2% of its lines are exercised by the existing tests. The uncovered lines are where bugs hide. Add cases that exercise the error / branch paths the existing tests skip.
- **Suggestion:** Expand tests to cover branches, error states, and user-visible outcomes.
- **Evidence:**
  - `form/validation logic` (weight 10) — form/validation logic
  - `stateful UI logic` (weight 10) — stateful UI logic
  - `branching behavior` (weight 10) — branching behavior
  - `low-line-coverage` (weight 20) — 2% line coverage

### `lib/screens/home/widgets/home_before_after.dart`
- **Project:** Flutter app: Ai-Interior-Design (Flutter)
- **Headline:** home_before_after.dart — critical code with 1% coverage
- **Why:** This file is critical (form/validation logic, stateful UI logic, branching behavior) and only 1% of its lines are exercised by the existing tests. The uncovered lines are where bugs hide. Add cases that exercise the error / branch paths the existing tests skip.
- **Suggestion:** Expand tests to cover branches, error states, and user-visible outcomes.
- **Evidence:**
  - `form/validation logic` (weight 10) — form/validation logic
  - `stateful UI logic` (weight 10) — stateful UI logic
  - `branching behavior` (weight 10) — branching behavior
  - `low-line-coverage` (weight 20) — 1% line coverage

### `lib/screens/home/widgets/home_recent_activity.dart`
- **Project:** Flutter app: Ai-Interior-Design (Flutter)
- **Headline:** home_recent_activity.dart — critical code with 2% coverage
- **Why:** This file is critical (form/validation logic, stateful UI logic, branching behavior) and only 2% of its lines are exercised by the existing tests. The uncovered lines are where bugs hide. Add cases that exercise the error / branch paths the existing tests skip.
- **Suggestion:** Expand tests to cover branches, error states, and user-visible outcomes.
- **Evidence:**
  - `form/validation logic` (weight 10) — form/validation logic
  - `stateful UI logic` (weight 10) — stateful UI logic
  - `branching behavior` (weight 10) — branching behavior
  - `low-line-coverage` (weight 20) — 2% line coverage

### `lib/screens/inpaint/widgets/mask_canvas.dart`
- **Project:** Flutter app: Ai-Interior-Design (Flutter)
- **Headline:** mask_canvas.dart — critical code with 0% coverage
- **Why:** This file is critical (form/validation logic, stateful UI logic, branching behavior) and only 0% of its lines are exercised by the existing tests. The uncovered lines are where bugs hide. Add cases that exercise the error / branch paths the existing tests skip.
- **Suggestion:** Expand tests to cover branches, error states, and user-visible outcomes.
- **Evidence:**
  - `form/validation logic` (weight 10) — form/validation logic
  - `stateful UI logic` (weight 10) — stateful UI logic
  - `branching behavior` (weight 10) — branching behavior
  - `low-line-coverage` (weight 20) — 0% line coverage

### `lib/screens/profile/widgets/account_settings_widgets.dart`
- **Project:** Flutter app: Ai-Interior-Design (Flutter)
- **Headline:** account_settings_widgets.dart — critical code with 30% coverage
- **Why:** This file is critical (form/validation logic, stateful UI logic, branching behavior) and only 30% of its lines are exercised by the existing tests. The uncovered lines are where bugs hide. Add cases that exercise the error / branch paths the existing tests skip.
- **Suggestion:** Expand tests to cover branches, error states, and user-visible outcomes.
- **Evidence:**
  - `form/validation logic` (weight 10) — form/validation logic
  - `stateful UI logic` (weight 10) — stateful UI logic
  - `branching behavior` (weight 10) — branching behavior
  - `low-line-coverage` (weight 20) — 30% line coverage

### `lib/screens/profile/widgets/custom_preset_dialog.dart`
- **Project:** Flutter app: Ai-Interior-Design (Flutter)
- **Headline:** custom_preset_dialog.dart — critical code with 2% coverage
- **Why:** This file is critical (form/validation logic, stateful UI logic, branching behavior) and only 2% of its lines are exercised by the existing tests. The uncovered lines are where bugs hide. Add cases that exercise the error / branch paths the existing tests skip.
- **Suggestion:** Expand tests to cover branches, error states, and user-visible outcomes.
- **Evidence:**
  - `form/validation logic` (weight 10) — form/validation logic
  - `stateful UI logic` (weight 10) — stateful UI logic
  - `branching behavior` (weight 10) — branching behavior
  - `low-line-coverage` (weight 20) — 2% line coverage

### `lib/screens/profile/widgets/favorite_cards.dart`
- **Project:** Flutter app: Ai-Interior-Design (Flutter)
- **Headline:** favorite_cards.dart — critical code with 2% coverage
- **Why:** This file is critical (form/validation logic, stateful UI logic, branching behavior) and only 2% of its lines are exercised by the existing tests. The uncovered lines are where bugs hide. Add cases that exercise the error / branch paths the existing tests skip.
- **Suggestion:** Expand tests to cover branches, error states, and user-visible outcomes.
- **Evidence:**
  - `form/validation logic` (weight 10) — form/validation logic
  - `stateful UI logic` (weight 10) — stateful UI logic
  - `branching behavior` (weight 10) — branching behavior
  - `low-line-coverage` (weight 20) — 2% line coverage

### `lib/screens/profile/widgets/palettes_tab.dart`
- **Project:** Flutter app: Ai-Interior-Design (Flutter)
- **Headline:** palettes_tab.dart — critical code with 0% coverage
- **Why:** This file is critical (form/validation logic, stateful UI logic, branching behavior) and only 0% of its lines are exercised by the existing tests. The uncovered lines are where bugs hide. Add cases that exercise the error / branch paths the existing tests skip.
- **Suggestion:** Expand tests to cover branches, error states, and user-visible outcomes.
- **Evidence:**
  - `form/validation logic` (weight 10) — form/validation logic
  - `stateful UI logic` (weight 10) — stateful UI logic
  - `branching behavior` (weight 10) — branching behavior
  - `low-line-coverage` (weight 20) — 0% line coverage

### `lib/screens/profile/widgets/styles_tab.dart`
- **Project:** Flutter app: Ai-Interior-Design (Flutter)
- **Headline:** styles_tab.dart — critical code with 0% coverage
- **Why:** This file is critical (form/validation logic, stateful UI logic, branching behavior) and only 0% of its lines are exercised by the existing tests. The uncovered lines are where bugs hide. Add cases that exercise the error / branch paths the existing tests skip.
- **Suggestion:** Expand tests to cover branches, error states, and user-visible outcomes.
- **Evidence:**
  - `form/validation logic` (weight 10) — form/validation logic
  - `stateful UI logic` (weight 10) — stateful UI logic
  - `branching behavior` (weight 10) — branching behavior
  - `low-line-coverage` (weight 20) — 0% line coverage

### `lib/screens/profile/widgets/visual_preset_card.dart`
- **Project:** Flutter app: Ai-Interior-Design (Flutter)
- **Headline:** visual_preset_card.dart — critical code with 0% coverage
- **Why:** This file is critical (form/validation logic, stateful UI logic, branching behavior) and only 0% of its lines are exercised by the existing tests. The uncovered lines are where bugs hide. Add cases that exercise the error / branch paths the existing tests skip.
- **Suggestion:** Expand tests to cover branches, error states, and user-visible outcomes.
- **Evidence:**
  - `form/validation logic` (weight 10) — form/validation logic
  - `stateful UI logic` (weight 10) — stateful UI logic
  - `branching behavior` (weight 10) — branching behavior
  - `low-line-coverage` (weight 20) — 0% line coverage

### `lib/screens/projects/widgets/projects_grid_view.dart`
- **Project:** Flutter app: Ai-Interior-Design (Flutter)
- **Headline:** projects_grid_view.dart — critical code with 0% coverage
- **Why:** This file is critical (form/validation logic, stateful UI logic, branching behavior) and only 0% of its lines are exercised by the existing tests. The uncovered lines are where bugs hide. Add cases that exercise the error / branch paths the existing tests skip.
- **Suggestion:** Expand tests to cover branches, error states, and user-visible outcomes.
- **Evidence:**
  - `form/validation logic` (weight 10) — form/validation logic
  - `stateful UI logic` (weight 10) — stateful UI logic
  - `branching behavior` (weight 10) — branching behavior
  - `low-line-coverage` (weight 20) — 0% line coverage

### `lib/screens/projects/widgets/projects_list_view.dart`
- **Project:** Flutter app: Ai-Interior-Design (Flutter)
- **Headline:** projects_list_view.dart — critical code with 0% coverage
- **Why:** This file is critical (form/validation logic, stateful UI logic, branching behavior) and only 0% of its lines are exercised by the existing tests. The uncovered lines are where bugs hide. Add cases that exercise the error / branch paths the existing tests skip.
- **Suggestion:** Expand tests to cover branches, error states, and user-visible outcomes.
- **Evidence:**
  - `form/validation logic` (weight 10) — form/validation logic
  - `stateful UI logic` (weight 10) — stateful UI logic
  - `branching behavior` (weight 10) — branching behavior
  - `low-line-coverage` (weight 20) — 0% line coverage

### `lib/screens/shared/widgets/room_category_filter_pills.dart`
- **Project:** Flutter app: Ai-Interior-Design (Flutter)
- **Headline:** room_category_filter_pills.dart — critical code with 0% coverage
- **Why:** This file is critical (form/validation logic, stateful UI logic, branching behavior) and only 0% of its lines are exercised by the existing tests. The uncovered lines are where bugs hide. Add cases that exercise the error / branch paths the existing tests skip.
- **Suggestion:** Expand tests to cover branches, error states, and user-visible outcomes.
- **Evidence:**
  - `form/validation logic` (weight 10) — form/validation logic
  - `stateful UI logic` (weight 10) — stateful UI logic
  - `branching behavior` (weight 10) — branching behavior
  - `low-line-coverage` (weight 20) — 0% line coverage

### `lib/ui_library/feedback/empty_state.dart`
- **Project:** Flutter app: Ai-Interior-Design (Flutter)
- **Headline:** empty_state.dart — critical code with 0% coverage
- **Why:** This file is critical (form/validation logic, stateful UI logic, branching behavior) and only 0% of its lines are exercised by the existing tests. The uncovered lines are where bugs hide. Add cases that exercise the error / branch paths the existing tests skip.
- **Suggestion:** Expand tests to cover branches, error states, and user-visible outcomes.
- **Evidence:**
  - `form/validation logic` (weight 10) — form/validation logic
  - `stateful UI logic` (weight 10) — stateful UI logic
  - `branching behavior` (weight 10) — branching behavior
  - `low-line-coverage` (weight 20) — 0% line coverage

### `lib/ui_library/inputs/app_filter_pill_row.dart`
- **Project:** Flutter app: Ai-Interior-Design (Flutter)
- **Headline:** app_filter_pill_row.dart — critical code with 0% coverage
- **Why:** This file is critical (form/validation logic, stateful UI logic, branching behavior) and only 0% of its lines are exercised by the existing tests. The uncovered lines are where bugs hide. Add cases that exercise the error / branch paths the existing tests skip.
- **Suggestion:** Expand tests to cover branches, error states, and user-visible outcomes.
- **Evidence:**
  - `form/validation logic` (weight 10) — form/validation logic
  - `stateful UI logic` (weight 10) — stateful UI logic
  - `branching behavior` (weight 10) — branching behavior
  - `low-line-coverage` (weight 20) — 0% line coverage

### `lib/ui_library/loading/skeleton_box.dart`
- **Project:** Flutter app: Ai-Interior-Design (Flutter)
- **Headline:** skeleton_box.dart — critical code with 0% coverage
- **Why:** This file is critical (form/validation logic, stateful UI logic, branching behavior) and only 0% of its lines are exercised by the existing tests. The uncovered lines are where bugs hide. Add cases that exercise the error / branch paths the existing tests skip.
- **Suggestion:** Expand tests to cover branches, error states, and user-visible outcomes.
- **Evidence:**
  - `form/validation logic` (weight 10) — form/validation logic
  - `stateful UI logic` (weight 10) — stateful UI logic
  - `branching behavior` (weight 10) — branching behavior
  - `low-line-coverage` (weight 20) — 0% line coverage

### `lib/services/color_palette_service.dart`
- **Project:** Flutter app: Ai-Interior-Design (Flutter)
- **Headline:** color_palette_service.dart — critical code with 0% coverage
- **Why:** This file is critical (form/validation logic, async/error handling, branching behavior) and only 0% of its lines are exercised by the existing tests. The uncovered lines are where bugs hide. Add cases that exercise the error / branch paths the existing tests skip.
- **Suggestion:** Expand tests to cover branches, error states, and user-visible outcomes.
- **Evidence:**
  - `form/validation logic` (weight 10) — form/validation logic
  - `async/error handling` (weight 10) — async/error handling
  - `branching behavior` (weight 10) — branching behavior
  - `low-line-coverage` (weight 20) — 0% line coverage

### `lib/services/contour_detector.dart`
- **Project:** Flutter app: Ai-Interior-Design (Flutter)
- **Headline:** contour_detector.dart — critical code with 0% coverage
- **Why:** This file is critical (form/validation logic, async/error handling, branching behavior) and only 0% of its lines are exercised by the existing tests. The uncovered lines are where bugs hide. Add cases that exercise the error / branch paths the existing tests skip.
- **Suggestion:** Expand tests to cover branches, error states, and user-visible outcomes.
- **Evidence:**
  - `form/validation logic` (weight 10) — form/validation logic
  - `async/error handling` (weight 10) — async/error handling
  - `branching behavior` (weight 10) — branching behavior
  - `low-line-coverage` (weight 20) — 0% line coverage

### `lib/services/photo_quality_analyzer.dart`
- **Project:** Flutter app: Ai-Interior-Design (Flutter)
- **Headline:** photo_quality_analyzer.dart — critical code with 1% coverage
- **Why:** This file is critical (form/validation logic, async/error handling, branching behavior) and only 1% of its lines are exercised by the existing tests. The uncovered lines are where bugs hide. Add cases that exercise the error / branch paths the existing tests skip.
- **Suggestion:** Expand tests to cover branches, error states, and user-visible outcomes.
- **Evidence:**
  - `form/validation logic` (weight 10) — form/validation logic
  - `async/error handling` (weight 10) — async/error handling
  - `branching behavior` (weight 10) — branching behavior
  - `low-line-coverage` (weight 20) — 1% line coverage

### `lib/services/scene_detector.dart`
- **Project:** Flutter app: Ai-Interior-Design (Flutter)
- **Headline:** scene_detector.dart — critical code with 4% coverage
- **Why:** This file is critical (form/validation logic, async/error handling, branching behavior) and only 4% of its lines are exercised by the existing tests. The uncovered lines are where bugs hide. Add cases that exercise the error / branch paths the existing tests skip.
- **Suggestion:** Expand tests to cover branches, error states, and user-visible outcomes.
- **Evidence:**
  - `form/validation logic` (weight 10) — form/validation logic
  - `async/error handling` (weight 10) — async/error handling
  - `branching behavior` (weight 10) — branching behavior
  - `low-line-coverage` (weight 20) — 4% line coverage

### `lib/services/style_preset_service.dart`
- **Project:** Flutter app: Ai-Interior-Design (Flutter)
- **Headline:** style_preset_service.dart — critical code with 0% coverage
- **Why:** This file is critical (form/validation logic, async/error handling, branching behavior) and only 0% of its lines are exercised by the existing tests. The uncovered lines are where bugs hide. Add cases that exercise the error / branch paths the existing tests skip.
- **Suggestion:** Expand tests to cover branches, error states, and user-visible outcomes.
- **Evidence:**
  - `form/validation logic` (weight 10) — form/validation logic
  - `async/error handling` (weight 10) — async/error handling
  - `branching behavior` (weight 10) — branching behavior
  - `low-line-coverage` (weight 20) — 0% line coverage

### `lib/services/tilt_detector.dart`
- **Project:** Flutter app: Ai-Interior-Design (Flutter)
- **Headline:** tilt_detector.dart — critical code with 7% coverage
- **Why:** This file is critical (form/validation logic, async/error handling, branching behavior) and only 7% of its lines are exercised by the existing tests. The uncovered lines are where bugs hide. Add cases that exercise the error / branch paths the existing tests skip.
- **Suggestion:** Expand tests to cover branches, error states, and user-visible outcomes.
- **Evidence:**
  - `form/validation logic` (weight 10) — form/validation logic
  - `async/error handling` (weight 10) — async/error handling
  - `branching behavior` (weight 10) — branching behavior
  - `low-line-coverage` (weight 20) — 7% line coverage

### `lib/screens/chat/chat_conversation_screen.dart`
- **Project:** Flutter app: Ai-Interior-Design (Flutter)
- **Headline:** chat_conversation_screen.dart — critical code with 0% coverage
- **Why:** This file is critical (stateful UI logic, routing logic, branching behavior) and only 0% of its lines are exercised by the existing tests. The uncovered lines are where bugs hide. Add cases that exercise the error / branch paths the existing tests skip.
- **Suggestion:** Expand tests to cover branches, error states, and user-visible outcomes.
- **Evidence:**
  - `stateful UI logic` (weight 10) — stateful UI logic
  - `routing logic` (weight 10) — routing logic
  - `branching behavior` (weight 10) — branching behavior
  - `low-line-coverage` (weight 20) — 0% line coverage

### `lib/screens/main_shell.dart`
- **Project:** Flutter app: Ai-Interior-Design (Flutter)
- **Headline:** main_shell.dart — critical code with 6% coverage
- **Why:** This file is critical (stateful UI logic, routing logic, branching behavior) and only 6% of its lines are exercised by the existing tests. The uncovered lines are where bugs hide. Add cases that exercise the error / branch paths the existing tests skip.
- **Suggestion:** Expand tests to cover branches, error states, and user-visible outcomes.
- **Evidence:**
  - `stateful UI logic` (weight 10) — stateful UI logic
  - `routing logic` (weight 10) — routing logic
  - `branching behavior` (weight 10) — branching behavior
  - `low-line-coverage` (weight 20) — 6% line coverage

### `lib/providers/user_profile_provider.dart`
- **Project:** Flutter app: Ai-Interior-Design (Flutter)
- **Headline:** user_profile_provider.dart — critical code with 36% coverage
- **Why:** This file is critical (permission logic, branching behavior) and only 36% of its lines are exercised by the existing tests. The uncovered lines are where bugs hide. Add cases that exercise the error / branch paths the existing tests skip.
- **Suggestion:** Expand tests to cover branches, error states, and user-visible outcomes.
- **Evidence:**
  - `permission logic` (weight 10) — permission logic
  - `branching behavior` (weight 10) — branching behavior
  - `low-line-coverage` (weight 20) — 36% line coverage

### `lib/screens/generate/widgets/generate_preview_helper.dart`
- **Project:** Flutter app: Ai-Interior-Design (Flutter)
- **Headline:** generate_preview_helper.dart — critical code with 0% coverage
- **Why:** This file is critical (stateful UI logic, async/error handling, branching behavior) and only 0% of its lines are exercised by the existing tests. The uncovered lines are where bugs hide. Add cases that exercise the error / branch paths the existing tests skip.
- **Suggestion:** Expand tests to cover branches, error states, and user-visible outcomes.
- **Evidence:**
  - `stateful UI logic` (weight 10) — stateful UI logic
  - `async/error handling` (weight 10) — async/error handling
  - `branching behavior` (weight 10) — branching behavior
  - `low-line-coverage` (weight 20) — 0% line coverage

### `lib/screens/profile/favorite_styles_screen.dart`
- **Project:** Flutter app: Ai-Interior-Design (Flutter)
- **Headline:** favorite_styles_screen.dart — critical code with 1% coverage
- **Why:** This file is critical (stateful UI logic, async/error handling, branching behavior) and only 1% of its lines are exercised by the existing tests. The uncovered lines are where bugs hide. Add cases that exercise the error / branch paths the existing tests skip.
- **Suggestion:** Expand tests to cover branches, error states, and user-visible outcomes.
- **Evidence:**
  - `stateful UI logic` (weight 10) — stateful UI logic
  - `async/error handling` (weight 10) — async/error handling
  - `branching behavior` (weight 10) — branching behavior
  - `low-line-coverage` (weight 20) — 1% line coverage

### `lib/screens/adaptive_nav_bar.dart`
- **Project:** Flutter app: Ai-Interior-Design (Flutter)
- **Headline:** adaptive_nav_bar.dart — critical code with 0% coverage
- **Why:** This file is critical (form/validation logic, stateful UI logic) and only 0% of its lines are exercised by the existing tests. The uncovered lines are where bugs hide. Add cases that exercise the error / branch paths the existing tests skip.
- **Suggestion:** Expand tests to cover branches, error states, and user-visible outcomes.
- **Evidence:**
  - `form/validation logic` (weight 10) — form/validation logic
  - `stateful UI logic` (weight 10) — stateful UI logic
  - `low-line-coverage` (weight 20) — 0% line coverage

### `lib/screens/chat/widgets/chat_typing_indicator.dart`
- **Project:** Flutter app: Ai-Interior-Design (Flutter)
- **Headline:** chat_typing_indicator.dart — critical code with 2% coverage
- **Why:** This file is critical (form/validation logic, stateful UI logic) and only 2% of its lines are exercised by the existing tests. The uncovered lines are where bugs hide. Add cases that exercise the error / branch paths the existing tests skip.
- **Suggestion:** Expand tests to cover branches, error states, and user-visible outcomes.
- **Evidence:**
  - `form/validation logic` (weight 10) — form/validation logic
  - `stateful UI logic` (weight 10) — stateful UI logic
  - `low-line-coverage` (weight 20) — 2% line coverage

### `lib/screens/chat/widgets/specialist_badge.dart`
- **Project:** Flutter app: Ai-Interior-Design (Flutter)
- **Headline:** specialist_badge.dart — critical code with 0% coverage
- **Why:** This file is critical (form/validation logic, stateful UI logic) and only 0% of its lines are exercised by the existing tests. The uncovered lines are where bugs hide. Add cases that exercise the error / branch paths the existing tests skip.
- **Suggestion:** Expand tests to cover branches, error states, and user-visible outcomes.
- **Evidence:**
  - `form/validation logic` (weight 10) — form/validation logic
  - `stateful UI logic` (weight 10) — stateful UI logic
  - `low-line-coverage` (weight 20) — 0% line coverage

### `lib/screens/generate/widgets/photo_source_sheet.dart`
- **Project:** Flutter app: Ai-Interior-Design (Flutter)
- **Headline:** photo_source_sheet.dart — critical code with 0% coverage
- **Why:** This file is critical (form/validation logic, stateful UI logic) and only 0% of its lines are exercised by the existing tests. The uncovered lines are where bugs hide. Add cases that exercise the error / branch paths the existing tests skip.
- **Suggestion:** Expand tests to cover branches, error states, and user-visible outcomes.
- **Evidence:**
  - `form/validation logic` (weight 10) — form/validation logic
  - `stateful UI logic` (weight 10) — stateful UI logic
  - `low-line-coverage` (weight 20) — 0% line coverage

### `lib/screens/generate_fab.dart`
- **Project:** Flutter app: Ai-Interior-Design (Flutter)
- **Headline:** generate_fab.dart — critical code with 0% coverage
- **Why:** This file is critical (form/validation logic, stateful UI logic) and only 0% of its lines are exercised by the existing tests. The uncovered lines are where bugs hide. Add cases that exercise the error / branch paths the existing tests skip.
- **Suggestion:** Expand tests to cover branches, error states, and user-visible outcomes.
- **Evidence:**
  - `form/validation logic` (weight 10) — form/validation logic
  - `stateful UI logic` (weight 10) — stateful UI logic
  - `low-line-coverage` (weight 20) — 0% line coverage

### `lib/screens/home/widgets/home_room_categories.dart`
- **Project:** Flutter app: Ai-Interior-Design (Flutter)
- **Headline:** home_room_categories.dart — critical code with 0% coverage
- **Why:** This file is critical (form/validation logic, stateful UI logic) and only 0% of its lines are exercised by the existing tests. The uncovered lines are where bugs hide. Add cases that exercise the error / branch paths the existing tests skip.
- **Suggestion:** Expand tests to cover branches, error states, and user-visible outcomes.
- **Evidence:**
  - `form/validation logic` (weight 10) — form/validation logic
  - `stateful UI logic` (weight 10) — stateful UI logic
  - `low-line-coverage` (weight 20) — 0% line coverage

### `lib/screens/profile/appearance_screen.dart`
- **Project:** Flutter app: Ai-Interior-Design (Flutter)
- **Headline:** appearance_screen.dart — critical code with 2% coverage
- **Why:** This file is critical (form/validation logic, stateful UI logic) and only 2% of its lines are exercised by the existing tests. The uncovered lines are where bugs hide. Add cases that exercise the error / branch paths the existing tests skip.
- **Suggestion:** Expand tests to cover branches, error states, and user-visible outcomes.
- **Evidence:**
  - `form/validation logic` (weight 10) — form/validation logic
  - `stateful UI logic` (weight 10) — stateful UI logic
  - `low-line-coverage` (weight 20) — 2% line coverage

### `lib/screens/projects/widgets/projects_empty_state.dart`
- **Project:** Flutter app: Ai-Interior-Design (Flutter)
- **Headline:** projects_empty_state.dart — critical code with 0% coverage
- **Why:** This file is critical (form/validation logic, stateful UI logic) and only 0% of its lines are exercised by the existing tests. The uncovered lines are where bugs hide. Add cases that exercise the error / branch paths the existing tests skip.
- **Suggestion:** Expand tests to cover branches, error states, and user-visible outcomes.
- **Evidence:**
  - `form/validation logic` (weight 10) — form/validation logic
  - `stateful UI logic` (weight 10) — stateful UI logic
  - `low-line-coverage` (weight 20) — 0% line coverage

### `lib/models/user_color_palette.dart`
- **Project:** Flutter app: Ai-Interior-Design (Flutter)
- **Headline:** user_color_palette.dart — critical code with 0% coverage
- **Why:** This file is critical (form/validation logic, branching behavior) and only 0% of its lines are exercised by the existing tests. The uncovered lines are where bugs hide. Add cases that exercise the error / branch paths the existing tests skip.
- **Suggestion:** Expand tests to cover branches, error states, and user-visible outcomes.
- **Evidence:**
  - `form/validation logic` (weight 10) — form/validation logic
  - `branching behavior` (weight 10) — branching behavior
  - `low-line-coverage` (weight 20) — 0% line coverage

### `lib/models/user_style_preset.dart`
- **Project:** Flutter app: Ai-Interior-Design (Flutter)
- **Headline:** user_style_preset.dart — critical code with 0% coverage
- **Why:** This file is critical (form/validation logic, branching behavior) and only 0% of its lines are exercised by the existing tests. The uncovered lines are where bugs hide. Add cases that exercise the error / branch paths the existing tests skip.
- **Suggestion:** Expand tests to cover branches, error states, and user-visible outcomes.
- **Evidence:**
  - `form/validation logic` (weight 10) — form/validation logic
  - `branching behavior` (weight 10) — branching behavior
  - `low-line-coverage` (weight 20) — 0% line coverage

### `lib/screens/chat/widgets/specialist_display_data.dart`
- **Project:** Flutter app: Ai-Interior-Design (Flutter)
- **Headline:** specialist_display_data.dart — critical code with 17% coverage
- **Why:** This file is critical (form/validation logic, branching behavior) and only 17% of its lines are exercised by the existing tests. The uncovered lines are where bugs hide. Add cases that exercise the error / branch paths the existing tests skip.
- **Suggestion:** Expand tests to cover branches, error states, and user-visible outcomes.
- **Evidence:**
  - `form/validation logic` (weight 10) — form/validation logic
  - `branching behavior` (weight 10) — branching behavior
  - `low-line-coverage` (weight 20) — 17% line coverage

### `lib/providers/app_shell_provider.dart`
- **Project:** Flutter app: Ai-Interior-Design (Flutter)
- **Headline:** app_shell_provider.dart — critical code with 0% coverage
- **Why:** This file is critical (routing logic, branching behavior) and only 0% of its lines are exercised by the existing tests. The uncovered lines are where bugs hide. Add cases that exercise the error / branch paths the existing tests skip.
- **Suggestion:** Expand tests to cover branches, error states, and user-visible outcomes.
- **Evidence:**
  - `routing logic` (weight 10) — routing logic
  - `branching behavior` (weight 10) — branching behavior
  - `low-line-coverage` (weight 20) — 0% line coverage

### `lib/screens/explore/explore_screen.dart`
- **Project:** Flutter app: Ai-Interior-Design (Flutter)
- **Headline:** explore_screen.dart — critical code with 3% coverage
- **Why:** This file is critical (stateful UI logic, branching behavior) and only 3% of its lines are exercised by the existing tests. The uncovered lines are where bugs hide. Add cases that exercise the error / branch paths the existing tests skip.
- **Suggestion:** Expand tests to cover branches, error states, and user-visible outcomes.
- **Evidence:**
  - `stateful UI logic` (weight 10) — stateful UI logic
  - `branching behavior` (weight 10) — branching behavior
  - `low-line-coverage` (weight 20) — 3% line coverage

### `lib/screens/projects/projects_screen.dart`
- **Project:** Flutter app: Ai-Interior-Design (Flutter)
- **Headline:** projects_screen.dart — critical code with 3% coverage
- **Why:** This file is critical (stateful UI logic, branching behavior) and only 3% of its lines are exercised by the existing tests. The uncovered lines are where bugs hide. Add cases that exercise the error / branch paths the existing tests skip.
- **Suggestion:** Expand tests to cover branches, error states, and user-visible outcomes.
- **Evidence:**
  - `stateful UI logic` (weight 10) — stateful UI logic
  - `branching behavior` (weight 10) — branching behavior
  - `low-line-coverage` (weight 20) — 3% line coverage

### `lib/ui_library/layout/app_floating_nav_spacer.dart`
- **Project:** Flutter app: Ai-Interior-Design (Flutter)
- **Headline:** app_floating_nav_spacer.dart — critical code with 0% coverage
- **Why:** This file is critical (stateful UI logic, branching behavior) and only 0% of its lines are exercised by the existing tests. The uncovered lines are where bugs hide. Add cases that exercise the error / branch paths the existing tests skip.
- **Suggestion:** Expand tests to cover branches, error states, and user-visible outcomes.
- **Evidence:**
  - `stateful UI logic` (weight 10) — stateful UI logic
  - `branching behavior` (weight 10) — branching behavior
  - `low-line-coverage` (weight 20) — 0% line coverage

### `lib/ui_library/layout/section_title.dart`
- **Project:** Flutter app: Ai-Interior-Design (Flutter)
- **Headline:** section_title.dart — critical code with 0% coverage
- **Why:** This file is critical (stateful UI logic, branching behavior) and only 0% of its lines are exercised by the existing tests. The uncovered lines are where bugs hide. Add cases that exercise the error / branch paths the existing tests skip.
- **Suggestion:** Expand tests to cover branches, error states, and user-visible outcomes.
- **Evidence:**
  - `stateful UI logic` (weight 10) — stateful UI logic
  - `branching behavior` (weight 10) — branching behavior
  - `low-line-coverage` (weight 20) — 0% line coverage

### `lib/providers/before_after_showcase_provider.dart`
- **Project:** Flutter app: Ai-Interior-Design (Flutter)
- **Headline:** before_after_showcase_provider.dart — critical code with 0% coverage
- **Why:** This file is critical (async/error handling, branching behavior) and only 0% of its lines are exercised by the existing tests. The uncovered lines are where bugs hide. Add cases that exercise the error / branch paths the existing tests skip.
- **Suggestion:** Expand tests to cover branches, error states, and user-visible outcomes.
- **Evidence:**
  - `async/error handling` (weight 10) — async/error handling
  - `branching behavior` (weight 10) — branching behavior
  - `low-line-coverage` (weight 20) — 0% line coverage

### `lib/flavors/flavor_config.dart`
- **Project:** Flutter app: Ai-Interior-Design (Flutter)
- **Headline:** flavor_config.dart — critical code with 44% coverage
- **Why:** This file is critical (form/validation logic, branching behavior, mostly static/config code) and only 44% of its lines are exercised by the existing tests. The uncovered lines are where bugs hide. Add cases that exercise the error / branch paths the existing tests skip.
- **Suggestion:** Expand tests to cover branches, error states, and user-visible outcomes.
- **Evidence:**
  - `form/validation logic` (weight 10) — form/validation logic
  - `branching behavior` (weight 10) — branching behavior
  - `mostly static/config code` (weight 10) — mostly static/config code
  - `low-line-coverage` (weight 20) — 44% line coverage

### `lib/models/room_category.dart`
- **Project:** Flutter app: Ai-Interior-Design (Flutter)
- **Headline:** room_category.dart — critical code with 8% coverage
- **Why:** This file is critical (form/validation logic) and only 8% of its lines are exercised by the existing tests. The uncovered lines are where bugs hide. Add cases that exercise the error / branch paths the existing tests skip.
- **Suggestion:** Expand tests to cover branches, error states, and user-visible outcomes.
- **Evidence:**
  - `form/validation logic` (weight 10) — form/validation logic
  - `low-line-coverage` (weight 20) — 8% line coverage

### `lib/screens/credits/widgets/daily_limit_bottom_sheet.dart`
- **Project:** Flutter app: Ai-Interior-Design (Flutter)
- **Headline:** daily_limit_bottom_sheet.dart — critical code with 5% coverage
- **Why:** This file is critical (stateful UI logic) and only 5% of its lines are exercised by the existing tests. The uncovered lines are where bugs hide. Add cases that exercise the error / branch paths the existing tests skip.
- **Suggestion:** Expand tests to cover branches, error states, and user-visible outcomes.
- **Evidence:**
  - `stateful UI logic` (weight 10) — stateful UI logic
  - `low-line-coverage` (weight 20) — 5% line coverage

### `lib/flavors/firebase_options_exterior.dart`
- **Project:** Flutter app: Ai-Interior-Design (Flutter)
- **Headline:** firebase_options_exterior.dart — critical code with 0% coverage
- **Why:** This file is critical (branching behavior, mostly static/config code) and only 0% of its lines are exercised by the existing tests. The uncovered lines are where bugs hide. Add cases that exercise the error / branch paths the existing tests skip.
- **Suggestion:** Expand tests to cover branches, error states, and user-visible outcomes.
- **Evidence:**
  - `branching behavior` (weight 10) — branching behavior
  - `mostly static/config code` (weight 10) — mostly static/config code
  - `low-line-coverage` (weight 20) — 0% line coverage

### `lib/models/feature_flags.dart`
- **Project:** Flutter app: Ai-Interior-Design (Flutter)
- **Headline:** feature_flags.dart — critical code with 13% coverage
- **Why:** This file is critical (branching behavior) and only 13% of its lines are exercised by the existing tests. The uncovered lines are where bugs hide. Add cases that exercise the error / branch paths the existing tests skip.
- **Suggestion:** Expand tests to cover branches, error states, and user-visible outcomes.
- **Evidence:**
  - `branching behavior` (weight 10) — branching behavior
  - `low-line-coverage` (weight 20) — 13% line coverage

### `lib/providers/color_palette_provider.dart`
- **Project:** Flutter app: Ai-Interior-Design (Flutter)
- **Headline:** color_palette_provider.dart — critical code with 0% coverage
- **Why:** This file is critical (branching behavior) and only 0% of its lines are exercised by the existing tests. The uncovered lines are where bugs hide. Add cases that exercise the error / branch paths the existing tests skip.
- **Suggestion:** Expand tests to cover branches, error states, and user-visible outcomes.
- **Evidence:**
  - `branching behavior` (weight 10) — branching behavior
  - `low-line-coverage` (weight 20) — 0% line coverage

### `lib/providers/design_preset_provider.dart`
- **Project:** Flutter app: Ai-Interior-Design (Flutter)
- **Headline:** design_preset_provider.dart — critical code with 3% coverage
- **Why:** This file is critical (branching behavior) and only 3% of its lines are exercised by the existing tests. The uncovered lines are where bugs hide. Add cases that exercise the error / branch paths the existing tests skip.
- **Suggestion:** Expand tests to cover branches, error states, and user-visible outcomes.
- **Evidence:**
  - `branching behavior` (weight 10) — branching behavior
  - `low-line-coverage` (weight 20) — 3% line coverage

### `lib/providers/feature_flags_provider.dart`
- **Project:** Flutter app: Ai-Interior-Design (Flutter)
- **Headline:** feature_flags_provider.dart — critical code with 18% coverage
- **Why:** This file is critical (branching behavior) and only 18% of its lines are exercised by the existing tests. The uncovered lines are where bugs hide. Add cases that exercise the error / branch paths the existing tests skip.
- **Suggestion:** Expand tests to cover branches, error states, and user-visible outcomes.
- **Evidence:**
  - `branching behavior` (weight 10) — branching behavior
  - `low-line-coverage` (weight 20) — 18% line coverage

### `lib/providers/room_category_provider.dart`
- **Project:** Flutter app: Ai-Interior-Design (Flutter)
- **Headline:** room_category_provider.dart — critical code with 0% coverage
- **Why:** This file is critical (branching behavior) and only 0% of its lines are exercised by the existing tests. The uncovered lines are where bugs hide. Add cases that exercise the error / branch paths the existing tests skip.
- **Suggestion:** Expand tests to cover branches, error states, and user-visible outcomes.
- **Evidence:**
  - `branching behavior` (weight 10) — branching behavior
  - `low-line-coverage` (weight 20) — 0% line coverage

### `lib/providers/style_preset_provider.dart`
- **Project:** Flutter app: Ai-Interior-Design (Flutter)
- **Headline:** style_preset_provider.dart — critical code with 0% coverage
- **Why:** This file is critical (branching behavior) and only 0% of its lines are exercised by the existing tests. The uncovered lines are where bugs hide. Add cases that exercise the error / branch paths the existing tests skip.
- **Suggestion:** Expand tests to cover branches, error states, and user-visible outcomes.
- **Evidence:**
  - `branching behavior` (weight 10) — branching behavior
  - `low-line-coverage` (weight 20) — 0% line coverage

### `lib/screens/chat/widgets/conversation_grouper.dart`
- **Project:** Flutter app: Ai-Interior-Design (Flutter)
- **Headline:** conversation_grouper.dart — critical code with 6% coverage
- **Why:** This file is critical (branching behavior) and only 6% of its lines are exercised by the existing tests. The uncovered lines are where bugs hide. Add cases that exercise the error / branch paths the existing tests skip.
- **Suggestion:** Expand tests to cover branches, error states, and user-visible outcomes.
- **Evidence:**
  - `branching behavior` (weight 10) — branching behavior
  - `low-line-coverage` (weight 20) — 6% line coverage

### `lib/services/room_examples.dart`
- **Project:** Flutter app: Ai-Interior-Design (Flutter)
- **Headline:** room_examples.dart — critical code with 0% coverage
- **Why:** This file is critical (branching behavior) and only 0% of its lines are exercised by the existing tests. The uncovered lines are where bugs hide. Add cases that exercise the error / branch paths the existing tests skip.
- **Suggestion:** Expand tests to cover branches, error states, and user-visible outcomes.
- **Evidence:**
  - `branching behavior` (weight 10) — branching behavior
  - `low-line-coverage` (weight 20) — 0% line coverage

### `lib/theme/status_colors.dart`
- **Project:** Flutter app: Ai-Interior-Design (Flutter)
- **Headline:** status_colors.dart — critical code with 29% coverage
- **Why:** This file is critical (branching behavior, mostly static/config code) and only 29% of its lines are exercised by the existing tests. The uncovered lines are where bugs hide. Add cases that exercise the error / branch paths the existing tests skip.
- **Suggestion:** Expand tests to cover branches, error states, and user-visible outcomes.
- **Evidence:**
  - `branching behavior` (weight 10) — branching behavior
  - `mostly static/config code` (weight 10) — mostly static/config code
  - `low-line-coverage` (weight 20) — 29% line coverage

### `test/providers/gemini-3-pro-image-generator.test.ts`
- **Project:** Firebase functions: functions (Firebase Functions)
- **Headline:** gemini-3-pro-image-generator.test.ts — 1 weak signal
- **Why:** Weak test: the assertions are tautological (`expect(x).toBe(x)` style). It will pass whether the production code is correct or broken. Fix is not "add more assertions" — delete this test and write one that triggers the actual behavior, then asserts on the observable result (returned value, persisted state, or rendered output a user would see).
- **Suggestion:** Keep `gemini-3-pro-image-generator.test.ts` but extend it: add a case that exercises the error path, and assert on returned state, not just on mock calls.
- **Evidence:**
  - `trivial-assertion` (weight 30) — Only checks that something exists; verify behavior or output instead. _(gemini-3-pro-image-generator.test.ts:162)_

### `test/providers/google-ai-studio-image-generator.test.ts`
- **Project:** Firebase functions: functions (Firebase Functions)
- **Headline:** google-ai-studio-image-generator.test.ts — 1 weak signal
- **Why:** Weak test: the assertions are tautological (`expect(x).toBe(x)` style). It will pass whether the production code is correct or broken. Fix is not "add more assertions" — delete this test and write one that triggers the actual behavior, then asserts on the observable result (returned value, persisted state, or rendered output a user would see).
- **Suggestion:** Keep `google-ai-studio-image-generator.test.ts` but extend it: add a case that exercises the error path, and assert on returned state, not just on mock calls.
- **Evidence:**
  - `trivial-assertion` (weight 30) — Only checks that something exists; verify behavior or output instead. _(google-ai-studio-image-generator.test.ts:177)_

### `test/scheduled/cleanup-anonymous-users.test.ts`
- **Project:** Firebase functions: functions (Firebase Functions)
- **Headline:** cleanup-anonymous-users.test.ts — 1 weak signal
- **Why:** Weak test: its only assertions are on mock calls, not on returned state or rendered output. It will pass whether the production code is correct or broken. Fix is not "add more assertions" — delete this test and write one that triggers the actual behavior, then asserts on the observable result (returned value, persisted state, or rendered output a user would see).
- **Suggestion:** Keep `cleanup-anonymous-users.test.ts` but extend it: add a case that exercises the error path, and assert on returned state, not just on mock calls.
- **Evidence:**
  - `mock-only-assertions` (weight 30) — 14 mock-call assertion(s), only 0 behavior assertion(s) — the test passes whether the unit works or is broken

### `test/providers/project_provider_test.dart`
- **Project:** Flutter app: Ai-Interior-Design (Flutter)
- **Headline:** project_provider_test.dart — 1 weak signal
- **Why:** Weak test: it is marked skipped — it never runs at all. It will pass whether the production code is correct or broken. Fix is not "add more assertions" — delete this test and write one that triggers the actual behavior, then asserts on the observable result (returned value, persisted state, or rendered output a user would see).
- **Suggestion:** Keep `project_provider_test.dart` but extend it: add a case that exercises the error path, and assert on returned state, not just on mock calls.
- **Evidence:**
  - `skipped-test` (weight 15) — Skipped test found. _(project_provider_test.dart:207)_

### `test/services/image-preprocessor.test.ts`
- **Project:** Firebase functions: functions (Firebase Functions)
- **Headline:** image-preprocessor.test.ts — 1 weak signal
- **Why:** Weak test: it is marked skipped — it never runs at all. It will pass whether the production code is correct or broken. Fix is not "add more assertions" — delete this test and write one that triggers the actual behavior, then asserts on the observable result (returned value, persisted state, or rendered output a user would see).
- **Suggestion:** Keep `image-preprocessor.test.ts` but extend it: add a case that exercises the error path, and assert on returned state, not just on mock calls.
- **Evidence:**
  - `skipped-test` (weight 15) — Skipped test found. _(image-preprocessor.test.ts:322)_

### `test/screens/generate/widgets/generate_style_picker_test.dart`
- **Project:** Flutter app: Ai-Interior-Design (Flutter)
- **Headline:** generate_style_picker_test.dart — 1 weak signal
- **Why:** Weak test: 1 of 6 test name(s) describe nothing concrete: "shows". It will pass whether the production code is correct or broken. Fix is not "add more assertions" — delete this test and write one that triggers the actual behavior, then asserts on the observable result (returned value, persisted state, or rendered output a user would see).
- **Suggestion:** Keep `generate_style_picker_test.dart` but extend it: add a case that exercises the error path, and assert on returned state, not just on mock calls.
- **Evidence:**
  - `vague-title` (weight 8) — 1 of 6 test name(s) describe nothing concrete: "shows" _(generate_style_picker_test.dart:40)_

## ⚪ Missing (21)

### `lib/config/environment.dart`
- **Project:** Flutter app: Ai-Interior-Design (Flutter)
- **Headline:** environment.dart — critical code with no tests
- **Why:** This file looks like critical code (auth/session logic, branching behavior) but no test file imports it or covers it. If it breaks, you'll only find out in production. Add a test that exercises the happy path and at least one error path.
- **Suggestion:** Add behavior tests for auth/session logic and branching behavior.
- **Evidence:**
  - `auth/session logic` (weight 10) — auth/session logic
  - `branching behavior` (weight 10) — branching behavior
  - `no-related-tests` (weight 30) — no test file imports or covers this source
  - `low-line-coverage` (weight 20) — 0% line coverage

### `src/triggers/generate-thumbnail.ts`
- **Project:** Firebase functions: functions (Firebase Functions)
- **Headline:** generate-thumbnail.ts — critical code with no tests
- **Why:** This file looks like critical code (auth/session logic, async/error handling, exported public surface, branching behavior) but no test file imports it or covers it. If it breaks, you'll only find out in production. Add a test that exercises the happy path and at least one error path.
- **Suggestion:** Add behavior tests for auth/session logic and async/error handling.
- **Evidence:**
  - `auth/session logic` (weight 10) — auth/session logic
  - `async/error handling` (weight 10) — async/error handling
  - `exported public surface` (weight 10) — exported public surface
  - `branching behavior` (weight 10) — branching behavior
  - `no-related-tests` (weight 30) — no test file imports or covers this source

### `src/triggers/process-generation-queue.ts`
- **Project:** Firebase functions: functions (Firebase Functions)
- **Headline:** process-generation-queue.ts — critical code with no tests
- **Why:** This file looks like critical code (API/data flow, form/validation logic, async/error handling, exported public surface) but no test file imports it or covers it. If it breaks, you'll only find out in production. Add a test that exercises the happy path and at least one error path.
- **Suggestion:** Add behavior tests for API/data flow and form/validation logic.
- **Evidence:**
  - `API/data flow` (weight 10) — API/data flow
  - `form/validation logic` (weight 10) — form/validation logic
  - `async/error handling` (weight 10) — async/error handling
  - `exported public surface` (weight 10) — exported public surface
  - `branching behavior` (weight 10) — branching behavior
  - `no-related-tests` (weight 30) — no test file imports or covers this source

### `src/triggers/run-generation-job.ts`
- **Project:** Firebase functions: functions (Firebase Functions)
- **Headline:** run-generation-job.ts — critical code with no tests
- **Why:** This file looks like critical code (API/data flow, async/error handling, exported public surface, branching behavior) but no test file imports it or covers it. If it breaks, you'll only find out in production. Add a test that exercises the happy path and at least one error path.
- **Suggestion:** Add behavior tests for API/data flow and async/error handling.
- **Evidence:**
  - `API/data flow` (weight 10) — API/data flow
  - `async/error handling` (weight 10) — async/error handling
  - `exported public surface` (weight 10) — exported public surface
  - `branching behavior` (weight 10) — branching behavior
  - `no-related-tests` (weight 30) — no test file imports or covers this source

### `lib/data/before_after_showcases.dart`
- **Project:** Flutter app: Ai-Interior-Design (Flutter)
- **Headline:** before_after_showcases.dart — critical code with no tests
- **Why:** This file looks like critical code (form/validation logic) but no test file imports it or covers it. If it breaks, you'll only find out in production. Add a test that exercises the happy path and at least one error path.
- **Suggestion:** Add behavior tests for form/validation logic.
- **Evidence:**
  - `form/validation logic` (weight 10) — form/validation logic
  - `no-related-tests` (weight 30) — no test file imports or covers this source
  - `low-line-coverage` (weight 20) — 11% line coverage

### `lib/l10n/catalog_l10n.dart`
- **Project:** Flutter app: Ai-Interior-Design (Flutter)
- **Headline:** catalog_l10n.dart — critical code with no tests
- **Why:** This file looks like critical code (stateful UI logic) but no test file imports it or covers it. If it breaks, you'll only find out in production. Add a test that exercises the happy path and at least one error path.
- **Suggestion:** Add behavior tests for stateful UI logic.
- **Evidence:**
  - `stateful UI logic` (weight 10) — stateful UI logic
  - `no-related-tests` (weight 30) — no test file imports or covers this source
  - `low-line-coverage` (weight 20) — 0% line coverage

### `lib/config/firebase_options_dev.dart`
- **Project:** Flutter app: Ai-Interior-Design (Flutter)
- **Headline:** firebase_options_dev.dart — critical code with no tests
- **Why:** This file looks like critical code (branching behavior) but no test file imports it or covers it. If it breaks, you'll only find out in production. Add a test that exercises the happy path and at least one error path.
- **Suggestion:** Add behavior tests for branching behavior.
- **Evidence:**
  - `branching behavior` (weight 10) — branching behavior
  - `no-related-tests` (weight 30) — no test file imports or covers this source
  - `low-line-coverage` (weight 20) — 0% line coverage

### `lib/data/room_categories.dart`
- **Project:** Flutter app: Ai-Interior-Design (Flutter)
- **Headline:** room_categories.dart — critical code with no tests
- **Why:** This file looks like critical code (branching behavior) but no test file imports it or covers it. If it breaks, you'll only find out in production. Add a test that exercises the happy path and at least one error path.
- **Suggestion:** Add behavior tests for branching behavior.
- **Evidence:**
  - `branching behavior` (weight 10) — branching behavior
  - `no-related-tests` (weight 30) — no test file imports or covers this source
  - `low-line-coverage` (weight 20) — 0% line coverage

### `src/http/migrate-jobs-to-subcollections.ts`
- **Project:** Firebase functions: functions (Firebase Functions)
- **Headline:** migrate-jobs-to-subcollections.ts — critical code with no tests
- **Why:** This file looks like critical code (async/error handling, exported public surface, branching behavior) but no test file imports it or covers it. If it breaks, you'll only find out in production. Add a test that exercises the happy path and at least one error path.
- **Suggestion:** Add behavior tests for async/error handling and exported public surface.
- **Evidence:**
  - `async/error handling` (weight 10) — async/error handling
  - `exported public surface` (weight 10) — exported public surface
  - `branching behavior` (weight 10) — branching behavior
  - `no-related-tests` (weight 30) — no test file imports or covers this source

### `lib/entrypoints/main_exterior.dart`
- **Project:** Flutter app: Ai-Interior-Design (Flutter)
- **Headline:** main_exterior.dart — critical code with no tests
- **Why:** This file looks like critical code (async/error handling) but no test file imports it or covers it. If it breaks, you'll only find out in production. Add a test that exercises the happy path and at least one error path.
- **Suggestion:** Add behavior tests for async/error handling.
- **Evidence:**
  - `async/error handling` (weight 10) — async/error handling
  - `no-related-tests` (weight 30) — no test file imports or covers this source

### `lib/entrypoints/main_interior.dart`
- **Project:** Flutter app: Ai-Interior-Design (Flutter)
- **Headline:** main_interior.dart — critical code with no tests
- **Why:** This file looks like critical code (async/error handling) but no test file imports it or covers it. If it breaks, you'll only find out in production. Add a test that exercises the happy path and at least one error path.
- **Suggestion:** Add behavior tests for async/error handling.
- **Evidence:**
  - `async/error handling` (weight 10) — async/error handling
  - `no-related-tests` (weight 30) — no test file imports or covers this source

### `src/common/image-utils.ts`
- **Project:** Firebase functions: functions (Firebase Functions)
- **Headline:** image-utils.ts — critical code with no tests
- **Why:** This file looks like critical code (async/error handling, branching behavior) but no test file imports it or covers it. If it breaks, you'll only find out in production. Add a test that exercises the happy path and at least one error path.
- **Suggestion:** Add behavior tests for async/error handling and branching behavior.
- **Evidence:**
  - `async/error handling` (weight 10) — async/error handling
  - `branching behavior` (weight 10) — branching behavior
  - `no-related-tests` (weight 30) — no test file imports or covers this source

### `src/config/environment.ts`
- **Project:** Firebase functions: functions (Firebase Functions)
- **Headline:** environment.ts — critical code with no tests
- **Why:** This file looks like critical code (exported public surface, branching behavior) but no test file imports it or covers it. If it breaks, you'll only find out in production. Add a test that exercises the happy path and at least one error path.
- **Suggestion:** Add behavior tests for exported public surface and branching behavior.
- **Evidence:**
  - `exported public surface` (weight 10) — exported public surface
  - `branching behavior` (weight 10) — branching behavior
  - `no-related-tests` (weight 30) — no test file imports or covers this source

### `src/config/runtime.ts`
- **Project:** Firebase functions: functions (Firebase Functions)
- **Headline:** runtime.ts — critical code with no tests
- **Why:** This file looks like critical code (exported public surface, branching behavior) but no test file imports it or covers it. If it breaks, you'll only find out in production. Add a test that exercises the happy path and at least one error path.
- **Suggestion:** Add behavior tests for exported public surface and branching behavior.
- **Evidence:**
  - `exported public surface` (weight 10) — exported public surface
  - `branching behavior` (weight 10) — branching behavior
  - `no-related-tests` (weight 30) — no test file imports or covers this source

### `lib/constants/preference_keys.dart`
- **Project:** Flutter app: Ai-Interior-Design (Flutter)
- **Headline:** preference_keys.dart — critical code with no tests
- **Why:** This file looks like critical code (auth/session logic, mostly static/config code) but no test file imports it or covers it. If it breaks, you'll only find out in production. Add a test that exercises the happy path and at least one error path.
- **Suggestion:** Add behavior tests for auth/session logic and mostly static/config code.
- **Evidence:**
  - `auth/session logic` (weight 10) — auth/session logic
  - `mostly static/config code` (weight 10) — mostly static/config code
  - `no-related-tests` (weight 30) — no test file imports or covers this source
  - `low-line-coverage` (weight 20) — 0% line coverage

### `lib/data/color_palettes.dart`
- **Project:** Flutter app: Ai-Interior-Design (Flutter)
- **Headline:** color_palettes.dart — critical code with no tests
- **Why:** This file looks like critical code (form/validation logic, branching behavior, mostly static/config code) but no test file imports it or covers it. If it breaks, you'll only find out in production. Add a test that exercises the happy path and at least one error path.
- **Suggestion:** Add behavior tests for form/validation logic and branching behavior.
- **Evidence:**
  - `form/validation logic` (weight 10) — form/validation logic
  - `branching behavior` (weight 10) — branching behavior
  - `mostly static/config code` (weight 10) — mostly static/config code
  - `no-related-tests` (weight 30) — no test file imports or covers this source
  - `low-line-coverage` (weight 20) — 4% line coverage

### `lib/data/design_presets.dart`
- **Project:** Flutter app: Ai-Interior-Design (Flutter)
- **Headline:** design_presets.dart — critical code with no tests
- **Why:** This file looks like critical code (form/validation logic, branching behavior, mostly static/config code) but no test file imports it or covers it. If it breaks, you'll only find out in production. Add a test that exercises the happy path and at least one error path.
- **Suggestion:** Add behavior tests for form/validation logic and branching behavior.
- **Evidence:**
  - `form/validation logic` (weight 10) — form/validation logic
  - `branching behavior` (weight 10) — branching behavior
  - `mostly static/config code` (weight 10) — mostly static/config code
  - `no-related-tests` (weight 30) — no test file imports or covers this source
  - `low-line-coverage` (weight 20) — 2% line coverage

### `src/common/gemini-safety-settings.ts`
- **Project:** Firebase functions: functions (Firebase Functions)
- **Headline:** gemini-safety-settings.ts — critical code with no tests
- **Why:** This file looks like critical code (exported public surface) but no test file imports it or covers it. If it breaks, you'll only find out in production. Add a test that exercises the happy path and at least one error path.
- **Suggestion:** Add behavior tests for exported public surface.
- **Evidence:**
  - `exported public surface` (weight 10) — exported public surface
  - `no-related-tests` (weight 30) — no test file imports or covers this source

### `src/config/firebase.ts`
- **Project:** Firebase functions: functions (Firebase Functions)
- **Headline:** firebase.ts — critical code with no tests
- **Why:** This file looks like critical code (exported public surface) but no test file imports it or covers it. If it breaks, you'll only find out in production. Add a test that exercises the happy path and at least one error path.
- **Suggestion:** Add behavior tests for exported public surface.
- **Evidence:**
  - `exported public surface` (weight 10) — exported public surface
  - `no-related-tests` (weight 30) — no test file imports or covers this source

### `src/config/secrets.ts`
- **Project:** Firebase functions: functions (Firebase Functions)
- **Headline:** secrets.ts — critical code with no tests
- **Why:** This file looks like critical code (exported public surface) but no test file imports it or covers it. If it breaks, you'll only find out in production. Add a test that exercises the happy path and at least one error path.
- **Suggestion:** Add behavior tests for exported public surface.
- **Evidence:**
  - `exported public surface` (weight 10) — exported public surface
  - `no-related-tests` (weight 30) — no test file imports or covers this source

### `src/http/health.ts`
- **Project:** Firebase functions: functions (Firebase Functions)
- **Headline:** health.ts — critical code with no tests
- **Why:** This file looks like critical code (exported public surface) but no test file imports it or covers it. If it breaks, you'll only find out in production. Add a test that exercises the happy path and at least one error path.
- **Suggestion:** Add behavior tests for exported public surface.
- **Evidence:**
  - `exported public surface` (weight 10) — exported public surface
  - `no-related-tests` (weight 30) — no test file imports or covers this source

## 🟢 Strong (86)

### `test/models/chat_message_test.dart`
- **Project:** Flutter app: Ai-Interior-Design (Flutter)
- **Headline:** chat_message_test.dart
- **Why:** No theater patterns detected on static signals. Looks like it's doing its job.
- **Suggestion:** Looks healthy on static signals. No action needed.

### `test/models/chat_specialist_test.dart`
- **Project:** Flutter app: Ai-Interior-Design (Flutter)
- **Headline:** chat_specialist_test.dart
- **Why:** No theater patterns detected on static signals. Looks like it's doing its job.
- **Suggestion:** Looks healthy on static signals. No action needed.

### `test/models/generation_test.dart`
- **Project:** Flutter app: Ai-Interior-Design (Flutter)
- **Headline:** generation_test.dart
- **Why:** No theater patterns detected on static signals. Looks like it's doing its job.
- **Suggestion:** Looks healthy on static signals. No action needed.

### `test/models/project_test.dart`
- **Project:** Flutter app: Ai-Interior-Design (Flutter)
- **Headline:** project_test.dart
- **Why:** No theater patterns detected on static signals. Looks like it's doing its job.
- **Suggestion:** Looks healthy on static signals. No action needed.

### `test/models/user_profile_test.dart`
- **Project:** Flutter app: Ai-Interior-Design (Flutter)
- **Headline:** user_profile_test.dart
- **Why:** No theater patterns detected on static signals. Looks like it's doing its job.
- **Suggestion:** Looks healthy on static signals. No action needed.

### `test/providers/auth_notifier_test.dart`
- **Project:** Flutter app: Ai-Interior-Design (Flutter)
- **Headline:** auth_notifier_test.dart
- **Why:** No theater patterns detected on static signals. Looks like it's doing its job.
- **Suggestion:** Looks healthy on static signals. No action needed.

### `test/providers/auth_state_test.dart`
- **Project:** Flutter app: Ai-Interior-Design (Flutter)
- **Headline:** auth_state_test.dart
- **Why:** No theater patterns detected on static signals. Looks like it's doing its job.
- **Suggestion:** Looks healthy on static signals. No action needed.

### `test/providers/chat_provider_test.dart`
- **Project:** Flutter app: Ai-Interior-Design (Flutter)
- **Headline:** chat_provider_test.dart
- **Why:** No theater patterns detected on static signals. Looks like it's doing its job.
- **Suggestion:** Looks healthy on static signals. No action needed.

### `test/providers/generation_draft_provider_test.dart`
- **Project:** Flutter app: Ai-Interior-Design (Flutter)
- **Headline:** generation_draft_provider_test.dart
- **Why:** No theater patterns detected on static signals. Looks like it's doing its job.
- **Suggestion:** Looks healthy on static signals. No action needed.

### `test/providers/generation_draft_state_test.dart`
- **Project:** Flutter app: Ai-Interior-Design (Flutter)
- **Headline:** generation_draft_state_test.dart
- **Why:** No theater patterns detected on static signals. Looks like it's doing its job.
- **Suggestion:** Looks healthy on static signals. No action needed.

### `test/providers/generation_notifier_test.dart`
- **Project:** Flutter app: Ai-Interior-Design (Flutter)
- **Headline:** generation_notifier_test.dart
- **Why:** No theater patterns detected on static signals. Looks like it's doing its job.
- **Suggestion:** Looks healthy on static signals. No action needed.

### `test/providers/generation_provider_test.dart`
- **Project:** Flutter app: Ai-Interior-Design (Flutter)
- **Headline:** generation_provider_test.dart
- **Why:** No theater patterns detected on static signals. Looks like it's doing its job.
- **Suggestion:** Looks healthy on static signals. No action needed.

### `test/providers/inpaint_provider_test.dart`
- **Project:** Flutter app: Ai-Interior-Design (Flutter)
- **Headline:** inpaint_provider_test.dart
- **Why:** No theater patterns detected on static signals. Looks like it's doing its job.
- **Suggestion:** Looks healthy on static signals. No action needed.

### `test/providers/locale_provider_test.dart`
- **Project:** Flutter app: Ai-Interior-Design (Flutter)
- **Headline:** locale_provider_test.dart
- **Why:** No theater patterns detected on static signals. Looks like it's doing its job.
- **Suggestion:** Looks healthy on static signals. No action needed.

### `test/providers/stream_providers_null_user_test.dart`
- **Project:** Flutter app: Ai-Interior-Design (Flutter)
- **Headline:** stream_providers_null_user_test.dart
- **Why:** No theater patterns detected on static signals. Looks like it's doing its job.
- **Suggestion:** Looks healthy on static signals. No action needed.

### `test/providers/theme_mode_provider_test.dart`
- **Project:** Flutter app: Ai-Interior-Design (Flutter)
- **Headline:** theme_mode_provider_test.dart
- **Why:** No theater patterns detected on static signals. Looks like it's doing its job.
- **Suggestion:** Looks healthy on static signals. No action needed.

### `test/providers/user_quota_provider_test.dart`
- **Project:** Flutter app: Ai-Interior-Design (Flutter)
- **Headline:** user_quota_provider_test.dart
- **Why:** No theater patterns detected on static signals. Looks like it's doing its job.
- **Suggestion:** Looks healthy on static signals. No action needed.

### `test/router/app_router_test.dart`
- **Project:** Flutter app: Ai-Interior-Design (Flutter)
- **Headline:** app_router_test.dart
- **Why:** No theater patterns detected on static signals. Looks like it's doing its job.
- **Suggestion:** Looks healthy on static signals. No action needed.

### `test/screens/chat/widgets/specialist_icon_mapper_test.dart`
- **Project:** Flutter app: Ai-Interior-Design (Flutter)
- **Headline:** specialist_icon_mapper_test.dart
- **Why:** No theater patterns detected on static signals. Looks like it's doing its job.
- **Suggestion:** Looks healthy on static signals. No action needed.

### `test/screens/credits/widgets/purchase_bottom_sheet_test.dart`
- **Project:** Flutter app: Ai-Interior-Design (Flutter)
- **Headline:** purchase_bottom_sheet_test.dart
- **Why:** No theater patterns detected on static signals. Looks like it's doing its job.
- **Suggestion:** Looks healthy on static signals. No action needed.

### `test/screens/generate/camera_frame_safety_test.dart`
- **Project:** Flutter app: Ai-Interior-Design (Flutter)
- **Headline:** camera_frame_safety_test.dart
- **Why:** No theater patterns detected on static signals. Looks like it's doing its job.
- **Suggestion:** Looks healthy on static signals. No action needed.

### `test/screens/generate/generate_prompt_augmenter_test.dart`
- **Project:** Flutter app: Ai-Interior-Design (Flutter)
- **Headline:** generate_prompt_augmenter_test.dart
- **Why:** No theater patterns detected on static signals. Looks like it's doing its job.
- **Suggestion:** Looks healthy on static signals. No action needed.

### `test/screens/generate/generate_validation_test.dart`
- **Project:** Flutter app: Ai-Interior-Design (Flutter)
- **Headline:** generate_validation_test.dart
- **Why:** No theater patterns detected on static signals. Looks like it's doing its job.
- **Suggestion:** Looks healthy on static signals. No action needed.

### `test/screens/generate/revamp_workflow/revamp_workflow_state_test.dart`
- **Project:** Flutter app: Ai-Interior-Design (Flutter)
- **Headline:** revamp_workflow_state_test.dart
- **Why:** No theater patterns detected on static signals. Looks like it's doing its job.
- **Suggestion:** Looks healthy on static signals. No action needed.

### `test/screens/generate/widgets/custom_style_dialog_test.dart`
- **Project:** Flutter app: Ai-Interior-Design (Flutter)
- **Headline:** custom_style_dialog_test.dart
- **Why:** No theater patterns detected on static signals. Looks like it's doing its job.
- **Suggestion:** Looks healthy on static signals. No action needed.

### `test/screens/home/widgets/home_continue_card_test.dart`
- **Project:** Flutter app: Ai-Interior-Design (Flutter)
- **Headline:** home_continue_card_test.dart
- **Why:** No theater patterns detected on static signals. Looks like it's doing its job.
- **Suggestion:** Looks healthy on static signals. No action needed.

### `test/screens/onboarding/onboarding_screen_test.dart`
- **Project:** Flutter app: Ai-Interior-Design (Flutter)
- **Headline:** onboarding_screen_test.dart
- **Why:** No theater patterns detected on static signals. Looks like it's doing its job.
- **Suggestion:** Looks healthy on static signals. No action needed.

### `test/screens/profile/account_settings_screen_test.dart`
- **Project:** Flutter app: Ai-Interior-Design (Flutter)
- **Headline:** account_settings_screen_test.dart
- **Why:** No theater patterns detected on static signals. Looks like it's doing its job.
- **Suggestion:** Looks healthy on static signals. No action needed.

### `test/screens/projects/widgets/generation_card_test.dart`
- **Project:** Flutter app: Ai-Interior-Design (Flutter)
- **Headline:** generation_card_test.dart
- **Why:** No theater patterns detected on static signals. Looks like it's doing its job.
- **Suggestion:** Looks healthy on static signals. No action needed.

### `test/screens/projects/widgets/project_card_grid_tile_test.dart`
- **Project:** Flutter app: Ai-Interior-Design (Flutter)
- **Headline:** project_card_grid_tile_test.dart
- **Why:** No theater patterns detected on static signals. Looks like it's doing its job.
- **Suggestion:** Looks healthy on static signals. No action needed.

### `test/screens/projects/widgets/project_card_list_tile_test.dart`
- **Project:** Flutter app: Ai-Interior-Design (Flutter)
- **Headline:** project_card_list_tile_test.dart
- **Why:** No theater patterns detected on static signals. Looks like it's doing its job.
- **Suggestion:** Looks healthy on static signals. No action needed.

### `test/screens/projects/widgets/project_hero_section_test.dart`
- **Project:** Flutter app: Ai-Interior-Design (Flutter)
- **Headline:** project_hero_section_test.dart
- **Why:** No theater patterns detected on static signals. Looks like it's doing its job.
- **Suggestion:** Looks healthy on static signals. No action needed.

### `test/services/camera_frame_analyzer_test.dart`
- **Project:** Flutter app: Ai-Interior-Design (Flutter)
- **Headline:** camera_frame_analyzer_test.dart
- **Why:** No theater patterns detected on static signals. Looks like it's doing its job.
- **Suggestion:** Looks healthy on static signals. No action needed.

### `test/services/generation_error_kind_test.dart`
- **Project:** Flutter app: Ai-Interior-Design (Flutter)
- **Headline:** generation_error_kind_test.dart
- **Why:** No theater patterns detected on static signals. Looks like it's doing its job.
- **Suggestion:** Looks healthy on static signals. No action needed.

### `test/services/generation_safety_rejection_test.dart`
- **Project:** Flutter app: Ai-Interior-Design (Flutter)
- **Headline:** generation_safety_rejection_test.dart
- **Why:** No theater patterns detected on static signals. Looks like it's doing its job.
- **Suggestion:** Looks healthy on static signals. No action needed.

### `test/services/generation_service_methods_test.dart`
- **Project:** Flutter app: Ai-Interior-Design (Flutter)
- **Headline:** generation_service_methods_test.dart
- **Why:** No theater patterns detected on static signals. Looks like it's doing its job.
- **Suggestion:** Looks healthy on static signals. No action needed.

### `test/services/generation_service_stream_test.dart`
- **Project:** Flutter app: Ai-Interior-Design (Flutter)
- **Headline:** generation_service_stream_test.dart
- **Why:** No theater patterns detected on static signals. Looks like it's doing its job.
- **Suggestion:** Looks healthy on static signals. No action needed.

### `test/services/generation_service_test.dart`
- **Project:** Flutter app: Ai-Interior-Design (Flutter)
- **Headline:** generation_service_test.dart
- **Why:** No theater patterns detected on static signals. Looks like it's doing its job.
- **Suggestion:** Looks healthy on static signals. No action needed.

### `test/services/project_service_test.dart`
- **Project:** Flutter app: Ai-Interior-Design (Flutter)
- **Headline:** project_service_test.dart
- **Why:** No theater patterns detected on static signals. Looks like it's doing its job.
- **Suggestion:** Looks healthy on static signals. No action needed.

### `test/theme/app_colors_test.dart`
- **Project:** Flutter app: Ai-Interior-Design (Flutter)
- **Headline:** app_colors_test.dart
- **Why:** No theater patterns detected on static signals. Looks like it's doing its job.
- **Suggestion:** Looks healthy on static signals. No action needed.

### `test/ui_library/app_button_test.dart`
- **Project:** Flutter app: Ai-Interior-Design (Flutter)
- **Headline:** app_button_test.dart
- **Why:** No theater patterns detected on static signals. Looks like it's doing its job.
- **Suggestion:** Looks healthy on static signals. No action needed.

### `test/ui_library/app_cached_image_test.dart`
- **Project:** Flutter app: Ai-Interior-Design (Flutter)
- **Headline:** app_cached_image_test.dart
- **Why:** No theater patterns detected on static signals. Looks like it's doing its job.
- **Suggestion:** Looks healthy on static signals. No action needed.

### `test/ui_library/app_page_scaffold_test.dart`
- **Project:** Flutter app: Ai-Interior-Design (Flutter)
- **Headline:** app_page_scaffold_test.dart
- **Why:** No theater patterns detected on static signals. Looks like it's doing its job.
- **Suggestion:** Looks healthy on static signals. No action needed.

### `test/ui_library/blocking_loader_test.dart`
- **Project:** Flutter app: Ai-Interior-Design (Flutter)
- **Headline:** blocking_loader_test.dart
- **Why:** No theater patterns detected on static signals. Looks like it's doing its job.
- **Suggestion:** Looks healthy on static signals. No action needed.

### `test/ui_library/indicators/credit_badge_test.dart`
- **Project:** Flutter app: Ai-Interior-Design (Flutter)
- **Headline:** credit_badge_test.dart
- **Why:** No theater patterns detected on static signals. Looks like it's doing its job.
- **Suggestion:** Looks healthy on static signals. No action needed.

### `test/callables/create-generation-job.test.ts`
- **Project:** Firebase functions: functions (Firebase Functions)
- **Headline:** create-generation-job.test.ts
- **Why:** No theater patterns detected on static signals. Looks like it's doing its job.
- **Suggestion:** Looks healthy on static signals. No action needed.

### `test/callables/create-generation-job.validation.test.ts`
- **Project:** Firebase functions: functions (Firebase Functions)
- **Headline:** create-generation-job.validation.test.ts
- **Why:** No theater patterns detected on static signals. Looks like it's doing its job.
- **Suggestion:** Looks healthy on static signals. No action needed.

### `test/callables/delete-account.test.ts`
- **Project:** Firebase functions: functions (Firebase Functions)
- **Headline:** delete-account.test.ts
- **Why:** No theater patterns detected on static signals. Looks like it's doing its job.
- **Suggestion:** Looks healthy on static signals. No action needed.

### `test/callables/delete-generation-job.test.ts`
- **Project:** Firebase functions: functions (Firebase Functions)
- **Headline:** delete-generation-job.test.ts
- **Why:** No theater patterns detected on static signals. Looks like it's doing its job.
- **Suggestion:** Looks healthy on static signals. No action needed.

### `test/callables/delete-project.test.ts`
- **Project:** Firebase functions: functions (Firebase Functions)
- **Headline:** delete-project.test.ts
- **Why:** No theater patterns detected on static signals. Looks like it's doing its job.
- **Suggestion:** Looks healthy on static signals. No action needed.

### `test/callables/delete-prompt-history-item.test.ts`
- **Project:** Firebase functions: functions (Firebase Functions)
- **Headline:** delete-prompt-history-item.test.ts
- **Why:** No theater patterns detected on static signals. Looks like it's doing its job.
- **Suggestion:** Looks healthy on static signals. No action needed.

### `test/callables/ensure-user.test.ts`
- **Project:** Firebase functions: functions (Firebase Functions)
- **Headline:** ensure-user.test.ts
- **Why:** No theater patterns detected on static signals. Looks like it's doing its job.
- **Suggestion:** Looks healthy on static signals. No action needed.

### `test/callables/get-prompt-history.test.ts`
- **Project:** Firebase functions: functions (Firebase Functions)
- **Headline:** get-prompt-history.test.ts
- **Why:** No theater patterns detected on static signals. Looks like it's doing its job.
- **Suggestion:** Looks healthy on static signals. No action needed.

### `test/callables/interior-prompt-policy.test.ts`
- **Project:** Firebase functions: functions (Firebase Functions)
- **Headline:** interior-prompt-policy.test.ts
- **Why:** No theater patterns detected on static signals. Looks like it's doing its job.
- **Suggestion:** Looks healthy on static signals. No action needed.

### `test/callables/rename-project.test.ts`
- **Project:** Firebase functions: functions (Firebase Functions)
- **Headline:** rename-project.test.ts
- **Why:** No theater patterns detected on static signals. Looks like it's doing its job.
- **Suggestion:** Looks healthy on static signals. No action needed.

### `test/callables/retry-generation-job.test.ts`
- **Project:** Firebase functions: functions (Firebase Functions)
- **Headline:** retry-generation-job.test.ts
- **Why:** No theater patterns detected on static signals. Looks like it's doing its job.
- **Suggestion:** Looks healthy on static signals. No action needed.

### `test/callables/send-chat-message.validation.test.ts`
- **Project:** Firebase functions: functions (Firebase Functions)
- **Headline:** send-chat-message.validation.test.ts
- **Why:** No theater patterns detected on static signals. Looks like it's doing its job.
- **Suggestion:** Looks healthy on static signals. No action needed.

### `test/callables/update-generation-feedback.test.ts`
- **Project:** Firebase functions: functions (Firebase Functions)
- **Headline:** update-generation-feedback.test.ts
- **Why:** No theater patterns detected on static signals. Looks like it's doing its job.
- **Suggestion:** Looks healthy on static signals. No action needed.

### `test/callables/upgrade-anonymous-user.test.ts`
- **Project:** Firebase functions: functions (Firebase Functions)
- **Headline:** upgrade-anonymous-user.test.ts
- **Why:** No theater patterns detected on static signals. Looks like it's doing its job.
- **Suggestion:** Looks healthy on static signals. No action needed.

### `test/domain/generation/repository.test.ts`
- **Project:** Firebase functions: functions (Firebase Functions)
- **Headline:** repository.test.ts
- **Why:** No theater patterns detected on static signals. Looks like it's doing its job.
- **Suggestion:** Looks healthy on static signals. No action needed.

### `test/providers/factory.test.ts`
- **Project:** Firebase functions: functions (Firebase Functions)
- **Headline:** factory.test.ts
- **Why:** No theater patterns detected on static signals. Looks like it's doing its job.
- **Suggestion:** Looks healthy on static signals. No action needed.

### `test/providers/openai-gpt-image-2-generator.test.ts`
- **Project:** Firebase functions: functions (Firebase Functions)
- **Headline:** openai-gpt-image-2-generator.test.ts
- **Why:** No theater patterns detected on static signals. Looks like it's doing its job.
- **Suggestion:** Looks healthy on static signals. No action needed.

### `test/providers/openai-gpt-image-editor.test.ts`
- **Project:** Firebase functions: functions (Firebase Functions)
- **Headline:** openai-gpt-image-editor.test.ts
- **Why:** No theater patterns detected on static signals. Looks like it's doing its job.
- **Suggestion:** Looks healthy on static signals. No action needed.

### `test/providers/stability-erase-generator.test.ts`
- **Project:** Firebase functions: functions (Firebase Functions)
- **Headline:** stability-erase-generator.test.ts
- **Why:** No theater patterns detected on static signals. Looks like it's doing its job.
- **Suggestion:** Looks healthy on static signals. No action needed.

### `test/providers/stability-image-to-image-generator.test.ts`
- **Project:** Firebase functions: functions (Firebase Functions)
- **Headline:** stability-image-to-image-generator.test.ts
- **Why:** No theater patterns detected on static signals. Looks like it's doing its job.
- **Suggestion:** Looks healthy on static signals. No action needed.

### `test/providers/stability-inpaint-generator.test.ts`
- **Project:** Firebase functions: functions (Firebase Functions)
- **Headline:** stability-inpaint-generator.test.ts
- **Why:** No theater patterns detected on static signals. Looks like it's doing its job.
- **Suggestion:** Looks healthy on static signals. No action needed.

### `test/providers/stability-search-replace-generator.test.ts`
- **Project:** Firebase functions: functions (Firebase Functions)
- **Headline:** stability-search-replace-generator.test.ts
- **Why:** No theater patterns detected on static signals. Looks like it's doing its job.
- **Suggestion:** Looks healthy on static signals. No action needed.

### `test/services/chat-router.test.ts`
- **Project:** Firebase functions: functions (Firebase Functions)
- **Headline:** chat-router.test.ts
- **Why:** No theater patterns detected on static signals. Looks like it's doing its job.
- **Suggestion:** Looks healthy on static signals. No action needed.

### `test/services/chat-service.test.ts`
- **Project:** Firebase functions: functions (Firebase Functions)
- **Headline:** chat-service.test.ts
- **Why:** No theater patterns detected on static signals. Looks like it's doing its job.
- **Suggestion:** Looks healthy on static signals. No action needed.

### `test/services/chat-synthesizer.test.ts`
- **Project:** Firebase functions: functions (Firebase Functions)
- **Headline:** chat-synthesizer.test.ts
- **Why:** No theater patterns detected on static signals. Looks like it's doing its job.
- **Suggestion:** Looks healthy on static signals. No action needed.

### `test/services/feature-flags-service.test.ts`
- **Project:** Firebase functions: functions (Firebase Functions)
- **Headline:** feature-flags-service.test.ts
- **Why:** No theater patterns detected on static signals. Looks like it's doing its job.
- **Suggestion:** Looks healthy on static signals. No action needed.

### `test/services/generation-orchestrator-routing.test.ts`
- **Project:** Firebase functions: functions (Firebase Functions)
- **Headline:** generation-orchestrator-routing.test.ts
- **Why:** No theater patterns detected on static signals. Looks like it's doing its job.
- **Suggestion:** Looks healthy on static signals. No action needed.

### `test/services/generation-orchestrator.test.ts`
- **Project:** Firebase functions: functions (Firebase Functions)
- **Headline:** generation-orchestrator.test.ts
- **Why:** No theater patterns detected on static signals. Looks like it's doing its job.
- **Suggestion:** Looks healthy on static signals. No action needed.

### `test/services/image-safety-checker.test.ts`
- **Project:** Firebase functions: functions (Firebase Functions)
- **Headline:** image-safety-checker.test.ts
- **Why:** No theater patterns detected on static signals. Looks like it's doing its job.
- **Suggestion:** Looks healthy on static signals. No action needed.

### `test/services/inpaint-feasibility-advisor.test.ts`
- **Project:** Firebase functions: functions (Firebase Functions)
- **Headline:** inpaint-feasibility-advisor.test.ts
- **Why:** No theater patterns detected on static signals. Looks like it's doing its job.
- **Suggestion:** Looks healthy on static signals. No action needed.

### `test/services/inpaint-prompt-enricher.test.ts`
- **Project:** Firebase functions: functions (Firebase Functions)
- **Headline:** inpaint-prompt-enricher.test.ts
- **Why:** No theater patterns detected on static signals. Looks like it's doing its job.
- **Suggestion:** Looks healthy on static signals. No action needed.

### `test/services/inpaint-prompt-interpreter.test.ts`
- **Project:** Firebase functions: functions (Firebase Functions)
- **Headline:** inpaint-prompt-interpreter.test.ts
- **Why:** No theater patterns detected on static signals. Looks like it's doing its job.
- **Suggestion:** Looks healthy on static signals. No action needed.

### `test/services/project-service.test.ts`
- **Project:** Firebase functions: functions (Firebase Functions)
- **Headline:** project-service.test.ts
- **Why:** No theater patterns detected on static signals. Looks like it's doing its job.
- **Suggestion:** Looks healthy on static signals. No action needed.

### `test/services/prompt-builder.test.ts`
- **Project:** Firebase functions: functions (Firebase Functions)
- **Headline:** prompt-builder.test.ts
- **Why:** No theater patterns detected on static signals. Looks like it's doing its job.
- **Suggestion:** Looks healthy on static signals. No action needed.

### `test/services/prompt-history-service.test.ts`
- **Project:** Firebase functions: functions (Firebase Functions)
- **Headline:** prompt-history-service.test.ts
- **Why:** No theater patterns detected on static signals. Looks like it's doing its job.
- **Suggestion:** Looks healthy on static signals. No action needed.

### `test/services/prompt-safety-prefilter.test.ts`
- **Project:** Firebase functions: functions (Firebase Functions)
- **Headline:** prompt-safety-prefilter.test.ts
- **Why:** No theater patterns detected on static signals. Looks like it's doing its job.
- **Suggestion:** Looks healthy on static signals. No action needed.

### `test/services/social-usage-service.test.ts`
- **Project:** Firebase functions: functions (Firebase Functions)
- **Headline:** social-usage-service.test.ts
- **Why:** No theater patterns detected on static signals. Looks like it's doing its job.
- **Suggestion:** Looks healthy on static signals. No action needed.

### `test/services/specialist-executor.test.ts`
- **Project:** Firebase functions: functions (Firebase Functions)
- **Headline:** specialist-executor.test.ts
- **Why:** No theater patterns detected on static signals. Looks like it's doing its job.
- **Suggestion:** Looks healthy on static signals. No action needed.

### `test/services/storage-service.test.ts`
- **Project:** Firebase functions: functions (Firebase Functions)
- **Headline:** storage-service.test.ts
- **Why:** No theater patterns detected on static signals. Looks like it's doing its job.
- **Suggestion:** Looks healthy on static signals. No action needed.

### `test/services/structural-aligner.test.ts`
- **Project:** Firebase functions: functions (Firebase Functions)
- **Headline:** structural-aligner.test.ts
- **Why:** No theater patterns detected on static signals. Looks like it's doing its job.
- **Suggestion:** Looks healthy on static signals. No action needed.

### `test/services/user-service.test.ts`
- **Project:** Firebase functions: functions (Firebase Functions)
- **Headline:** user-service.test.ts
- **Why:** No theater patterns detected on static signals. Looks like it's doing its job.
- **Suggestion:** Looks healthy on static signals. No action needed.

---
_Test Inspector is a local-first detective for unit tests. The tool only informs — you fix and rescan._