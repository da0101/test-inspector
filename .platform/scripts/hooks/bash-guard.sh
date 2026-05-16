#!/usr/bin/env bash
# bash-guard.sh — Claude Code PreToolUse hook for the Bash tool.
#
# Intercepts destructive commands (git commit/push/reset --hard/checkout --/
# branch -D, rm -rf) and returns `permissionDecision: ask`. Claude Code shows
# the user an approval prompt; the LLM cannot bypass it.
#
# Input:  JSON on stdin. Shape: {"tool_name":"Bash","tool_input":{"command":"..."},...}
# Output: If destructive, JSON with permissionDecision. Otherwise, exit 0 silent.
#
# Fail-open by design: if parsing fails or the tool is not Bash, allow the
# default behavior. This is a guard-rail, not a firewall — the worst case is
# one extra approval click, not a blocked workflow.

set -uo pipefail

INPUT="$(cat 2>/dev/null || true)"

# Filter by tool name. The input is JSON; grep-match is sufficient because the
# string "tool_name":"Bash" appears verbatim regardless of whitespace variants.
if ! printf '%s' "$INPUT" | grep -q '"tool_name"[[:space:]]*:[[:space:]]*"Bash"'; then
  exit 0
fi

# Destructive patterns. Substring match against the whole JSON blob — the
# command string appears raw in any JSON encoding, so escape rules don't
# interfere with substring detection. Overmatching (e.g. a command that echoes
# "git commit") is acceptable: extra click vs. lost work is the right tradeoff.
DESTRUCTIVE_RE='git[[:space:]]+(commit|push|reset[[:space:]]+--hard|checkout[[:space:]]+--|branch[[:space:]]+-D)|rm[[:space:]]+-[rfRF]+|git[[:space:]]+push[[:space:]]+--force'

if printf '%s' "$INPUT" | grep -qE "$DESTRUCTIVE_RE"; then
  # Distinguish commit/push (require explicit user request) from other destructive ops.
  if printf '%s' "$INPUT" | grep -qE 'git[[:space:]]+(commit|push)'; then
    reason='⚠️ COMMIT/PUSH GATE: Did you explicitly ask the agent to commit? If not, deny this. Agents must never commit unless the user asked for it.'
  else
    reason='Agentboard guard: destructive command (reset/rm/branch -D) requires user approval.'
  fi
  # Emit a compact permission decision. Claude Code shows the approval UI.
  printf '{"permissionDecision":"ask","permissionDecisionReason":"%s"}\n' "$reason"
fi

exit 0
