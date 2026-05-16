#!/usr/bin/env bash
# sync-context.sh — keep CLAUDE.md / AGENTS.md / GEMINI.md in sync across all platform repos.
#
# Design
# ------
#   Source of truth per repo: CLAUDE.md
#   Derived (auto-generated):  AGENTS.md   (Codex CLI variant)
#                              GEMINI.md   (Gemini CLI variant)
#
#   The 3 files are IDENTICAL except for two substitutions per variant:
#     1. Header line:  "Claude Code Entry"  ->  "Codex CLI Entry" | "Gemini CLI Entry"
#     2. Self-reference path: "<repo>/CLAUDE.md"  ->  "<repo>/AGENTS.md" | "<repo>/GEMINI.md"
#        (repo name is inferred dynamically — no hardcoding needed)
#
# Modes
# -----
#   ab sync             # CHECK mode (default). Shows drift, exits non-zero on any.
#   ab sync --dry-run   # CHECK mode alias (explicit name, same exit codes).
#   ab sync --apply     # APPLY mode. Overwrites AGENTS.md + GEMINI.md from CLAUDE.md.
#   ab sync --list      # Show which repos will be touched and exit.
#   ab sync --help      # This help text.
#
# Exit codes
# ----------
#   0  — everything in sync (or --apply succeeded)
#   1  — drift detected (check mode only)
#   2  — invocation error (bad flag, missing source, etc.)
#
# Adding a new repo
# -----------------
#   Append its absolute path to the REPOS array below. That's it — as long as
#   the repo has a CLAUDE.md at its root the script will keep its AGENTS.md
#   and GEMINI.md in sync on every run.

set -euo pipefail

# ---------------------------------------------------------------------------
# Config — list every repo that carries a CLAUDE.md / AGENTS.md / GEMINI.md entry file.
# The first entry auto-detects the repo that contains this script (the platform repo).
# For multi-repo projects, add the other repos below with absolute paths.
# ---------------------------------------------------------------------------
REPOS=(
  # Auto-detected: the repo containing this script.
  "$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
  # Add more repos here:
  # "/absolute/path/to/backend-repo"
  # "/absolute/path/to/frontend-repo"
)

# ---------------------------------------------------------------------------
# Colors (safe on a plain terminal; fall back to empty strings if no TTY)
# ---------------------------------------------------------------------------
if [[ -t 1 ]]; then
  C_RED=$'\033[31m'
  C_GREEN=$'\033[32m'
  C_YELLOW=$'\033[33m'
  C_CYAN=$'\033[36m'
  C_DIM=$'\033[2m'
  C_RESET=$'\033[0m'
else
  C_RED=""; C_GREEN=""; C_YELLOW=""; C_CYAN=""; C_DIM=""; C_RESET=""
fi

# ---------------------------------------------------------------------------
# Argument parsing
# ---------------------------------------------------------------------------
MODE="check"
case "${1:-}" in
  "")        MODE="check" ;;
  --dry-run) MODE="check" ;;
  --apply)   MODE="apply" ;;
  --list)    MODE="list" ;;
  --help|-h)
    sed -n '2,/^set -euo pipefail/p' "$0" | sed -e 's/^# \{0,1\}//' -e '/^set -euo pipefail$/d'
    exit 0
    ;;
  *)
    echo "${C_RED}error:${C_RESET} unknown flag '$1'"
    echo "usage: $0 [--apply|--dry-run|--list|--help]"
    exit 2
    ;;
esac

# ---------------------------------------------------------------------------
# List mode — show what will be synced and exit.
# ---------------------------------------------------------------------------
if [[ "$MODE" == "list" ]]; then
  echo "${C_CYAN}sync-context.sh${C_RESET} will operate on these repos:"
  for repo in "${REPOS[@]}"; do
    if [[ -f "$repo/CLAUDE.md" ]]; then
      echo "  ${C_GREEN}✓${C_RESET} $repo"
    else
      echo "  ${C_YELLOW}?${C_RESET} $repo ${C_DIM}(no CLAUDE.md — will be skipped)${C_RESET}"
    fi
  done
  exit 0
fi

# ---------------------------------------------------------------------------
# Substitution helpers — emit the derived content to stdout.
# Uses POSIX sed so it works on both macOS (BSD sed) and Linux (GNU sed).
# Repo name is inferred from the source path — no hardcoding required.
# ---------------------------------------------------------------------------
generate_agents() {
  local src="$1"
  local name; name="$(basename "$(dirname "$src")")"
  sed -e 's/Claude Code Entry/Codex CLI Entry/g' \
      -e "s|${name}/CLAUDE\\.md|${name}/AGENTS.md|g" \
      "$src"
}

generate_gemini() {
  local src="$1"
  local name; name="$(basename "$(dirname "$src")")"
  sed -e 's/Claude Code Entry/Gemini CLI Entry/g' \
      -e "s|${name}/CLAUDE\\.md|${name}/GEMINI.md|g" \
      "$src"
}

# ---------------------------------------------------------------------------
# Main loop
# ---------------------------------------------------------------------------
drift_count=0
write_count=0
skip_count=0

for repo in "${REPOS[@]}"; do
  source="$repo/CLAUDE.md"
  label="${repo##*/}"

  if [[ ! -f "$source" ]]; then
    echo "${C_YELLOW}SKIP${C_RESET}    $label ${C_DIM}(no CLAUDE.md)${C_RESET}"
    skip_count=$((skip_count + 1))
    continue
  fi

  for variant in AGENTS GEMINI; do
    target="$repo/${variant}.md"
    tmp=$(mktemp)

    case "$variant" in
      AGENTS) generate_agents "$source" > "$tmp" ;;
      GEMINI) generate_gemini "$source" > "$tmp" ;;
    esac

    if [[ -f "$target" ]]; then
      if cmp -s "$tmp" "$target"; then
        echo "${C_GREEN}OK${C_RESET}      $label/${variant}.md"
      else
        drift_count=$((drift_count + 1))
        echo "${C_YELLOW}DRIFT${C_RESET}   $label/${variant}.md"
        if [[ "$MODE" == "apply" ]]; then
          cp "$tmp" "$target"
          write_count=$((write_count + 1))
          echo "        ${C_DIM}→ rewrote from CLAUDE.md${C_RESET}"
        else
          diff -u "$target" "$tmp" | sed -n '4,20p' | sed 's/^/        /' || true
          echo "        ${C_DIM}...run 'ab sync --apply' to fix${C_RESET}"
        fi
      fi
    else
      drift_count=$((drift_count + 1))
      echo "${C_YELLOW}MISSING${C_RESET} $label/${variant}.md"
      if [[ "$MODE" == "apply" ]]; then
        cp "$tmp" "$target"
        write_count=$((write_count + 1))
        echo "        ${C_DIM}→ created from CLAUDE.md${C_RESET}"
      fi
    fi

    rm -f "$tmp"
  done
done

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------
echo ""
if [[ "$MODE" == "apply" ]]; then
  if [[ $drift_count -eq 0 ]]; then
    echo "${C_GREEN}All entry files already in sync.${C_RESET} (no writes)"
  else
    echo "${C_GREEN}Synced ${write_count} file(s).${C_RESET}"
    if [[ $skip_count -gt 0 ]]; then
      echo "${C_DIM}Skipped ${skip_count} repo(s) without a CLAUDE.md.${C_RESET}"
    fi
    echo ""
    echo "${C_CYAN}Next steps:${C_RESET}"
    echo "  1. Review the changes:   ${C_DIM}git diff${C_RESET}"
    echo "  2. Commit each repo separately (they are independent git repos)"
  fi
  exit 0
fi

# Check mode
if [[ $drift_count -eq 0 ]]; then
  echo "${C_GREEN}All entry files in sync.${C_RESET}"
  exit 0
else
  echo "${C_RED}Drift detected:${C_RESET} ${drift_count} file(s) out of sync."
  echo "Run: ${C_CYAN}ab sync --apply${C_RESET}"
  exit 1
fi
