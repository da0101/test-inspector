#!/usr/bin/env bash
# aliases.sh — set up ab-aware provider wrappers for this shell session
#
# Usage (once per terminal):
#   source .platform/scripts/aliases.sh
#
# Or add to your shell profile for permanent effect:
#   echo 'source "$(git rev-parse --show-toplevel 2>/dev/null)/.platform/scripts/aliases.sh"' >> ~/.zshrc

_ab_root="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"

alias codex='bash "'"$_ab_root"'/.platform/scripts/codex-ab"'
alias gemini='bash "'"$_ab_root"'/.platform/scripts/gemini-ab"'

printf 'ab wrappers active\n'
printf '  codex  → %s/.platform/scripts/codex-ab\n' "$_ab_root"
printf '  gemini → %s/.platform/scripts/gemini-ab\n' "$_ab_root"

unset _ab_root
