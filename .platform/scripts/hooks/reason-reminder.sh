#!/usr/bin/env bash
# reason-reminder.sh — PostToolUse hook that fires after every code-file edit.
#
# Outputs a one-line prompt so the agent immediately calls log-reason.
# Skip .platform/ meta-files (memory, stream files) — those are internal state.
# Fail-open: errors never block the workflow.

set -u
[[ -d ".platform" ]] || exit 0

INPUT="$(cat 2>/dev/null)"
[[ -n "$INPUT" ]] || exit 0

_fp="$(printf '%s' "$INPUT" | awk '
  match($0, "\"file_path\"[[:space:]]*:[[:space:]]*\"[^\"]*\"") {
    s = substr($0, RSTART, RLENGTH)
    sub(".*\"file_path\"[[:space:]]*:[[:space:]]*\"", "", s)
    sub(/".*/, "", s)
    print s; exit
  }
')"

[[ -n "$_fp" ]] || exit 0

_rel="${_fp##"$(pwd)/"}"
case "$_rel" in .platform/*) exit 0 ;; esac

printf '📝 ab log-reason "%s" "<one sentence why you made this change>"\n' "$_rel"
