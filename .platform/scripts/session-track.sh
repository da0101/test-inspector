#!/usr/bin/env bash
# session-track.sh — shared helpers for provider wrappers (codex-ab, gemini-ab).
#
# Closes the cross-provider observability gap. Claude Code has native hooks
# that fire on every tool call; Codex and Gemini don't. This module gives the
# wrappers equivalent visibility by:
#
#   1. Logging SessionStart / SessionEnd events to events.jsonl.
#   2. Running a background poller during the session that detects file
#      changes every N seconds and writes one event per change — the same
#      stream of data Claude Code hooks produce, just inferred from the
#      filesystem instead of a native API.
#
# Meant to be sourced, not executed. The caller (wrapper) exports
# AGENTBOARD_PROVIDER and AGENTBOARD_SESSION_ID before calling these fns.

_ab_events_hook=".platform/scripts/hooks/event-logger.sh"

_ab_session_event() {
  local kind="$1" session_id="$2" extra="${3:-}"
  [[ -f "$_ab_events_hook" ]] || return 0
  local payload
  local stream_extra=""
  if [[ -n "${AGENTBOARD_STREAM:-}" ]]; then
    stream_extra="\"stream\":\"$AGENTBOARD_STREAM\""
  fi
  if [[ -n "$stream_extra" && -n "$extra" ]]; then
    payload="{\"hook_event_name\":\"$kind\",\"session_id\":\"$session_id\",${stream_extra},$extra}"
  elif [[ -n "$stream_extra" ]]; then
    payload="{\"hook_event_name\":\"$kind\",\"session_id\":\"$session_id\",${stream_extra}}"
  elif [[ -n "$extra" ]]; then
    payload="{\"hook_event_name\":\"$kind\",\"session_id\":\"$session_id\",$extra}"
  else
    payload="{\"hook_event_name\":\"$kind\",\"session_id\":\"$session_id\"}"
  fi
  printf '%s' "$payload" | bash "$_ab_events_hook" 2>/dev/null || true
}

# Best-effort: start daemon if not already running.
# Sets _ab_daemon_was_started=1 so the caller can stop it on exit.
_ab_daemon_was_started=0
_ab_ensure_daemon() {
  command -v ab >/dev/null 2>&1 || return 0
  command -v node >/dev/null 2>&1 || return 0
  [[ -d ".platform" ]] || return 0
  local _pf=".platform/.daemon-port"
  if [[ -f "$_pf" ]]; then
    local _p; _p="$(cat "$_pf" 2>/dev/null)"
    if [[ "$_p" =~ ^[0-9]+$ ]] && curl -sf -m 1 "http://127.0.0.1:$_p/health" >/dev/null 2>&1; then
      return 0  # already running
    fi
  fi
  ab daemon start >/dev/null 2>&1 || return 0
  _ab_daemon_was_started=1
}

_ab_stop_daemon() {
  [[ "$_ab_daemon_was_started" -eq 1 ]] || return 0
  command -v ab >/dev/null 2>&1 || return 0
  ab daemon stop >/dev/null 2>&1 || true
  _ab_daemon_was_started=0
}

_ab_file_change_state=".platform/.file-change-state.tsv"
_ab_file_change_lock=".platform/.file-change-state.lock"

_ab_file_diff_sig() {
  local file="$1" sig
  sig="$(git diff --no-ext-diff HEAD -- "$file" 2>/dev/null | shasum 2>/dev/null | awk '{print $1}')"
  [[ -n "$sig" ]] || sig="-"
  printf '%s\n' "$sig"
}

_ab_emit_file_change_updates_locked() {
  local current_file="$1" state_file="$2"
  local tmp_state tmp_emit file sig prev_sig
  tmp_state="$(mktemp 2>/dev/null)" || return 1
  tmp_emit="$(mktemp 2>/dev/null)" || { rm -f "$tmp_state"; return 1; }

  if [[ -s "$current_file" ]]; then
    while IFS=$'\t' read -r file sig; do
      [[ -n "$file" ]] || continue
      prev_sig=""
      if [[ -f "$state_file" ]]; then
        prev_sig="$(awk -F'\t' -v file="$file" '$1 == file { print $2; exit }' "$state_file")"
      fi
      [[ "$prev_sig" == "$sig" ]] || printf '%s\t%s\n' "$file" "$sig" >> "$tmp_emit"
      printf '%s\t%s\n' "$file" "$sig" >> "$tmp_state"
    done < "$current_file"
  fi

  if [[ -s "$tmp_state" ]]; then
    mv "$tmp_state" "$state_file" 2>/dev/null || rm -f "$tmp_state"
  else
    rm -f "$state_file" "$tmp_state"
  fi

  cat "$tmp_emit"
  rm -f "$tmp_emit"
}

_ab_collect_new_file_changes() {
  local changed="$1" tmp_current updates
  tmp_current="$(mktemp 2>/dev/null)" || return 1

  while IFS= read -r _f; do
    [[ -n "$_f" ]] || continue
    printf '%s\t%s\n' "$_f" "$(_ab_file_diff_sig "$_f")" >> "$tmp_current"
  done <<< "$changed"

  if command -v flock >/dev/null 2>&1; then
    updates="$(
      (
        flock -w 2 9 || exit 0
        _ab_emit_file_change_updates_locked "$tmp_current" "$_ab_file_change_state"
      ) 9>"$_ab_file_change_lock"
    )"
  else
    local _lock_dir="${_ab_file_change_lock}.d" _i _locked=0
    for _i in 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15 16 17 18 19 20; do
      if mkdir "$_lock_dir" 2>/dev/null; then
        _locked=1
        break
      fi
      sleep 0.1
    done
    if [[ "$_locked" -eq 1 ]]; then
      updates="$(_ab_emit_file_change_updates_locked "$tmp_current" "$_ab_file_change_state")"
      rmdir "$_lock_dir" 2>/dev/null || true
    else
      updates=""
    fi
  fi

  rm -f "$tmp_current"
  printf '%s' "$updates"
}

# Start a background file-change poller. Writes one event per changed tracked
# file per poll interval. Returns the poller PID; caller must stop it on exit.
#
# Args: session_id  provider  [interval_seconds=5]
_ab_start_file_poller() {
  local session_id="$1" provider="$2" interval="${3:-5}"
  [[ -f "$_ab_events_hook" ]] || { printf '0'; return 0; }
  command -v git >/dev/null 2>&1 || { printf '0'; return 0; }
  git rev-parse --git-dir >/dev/null 2>&1 || { printf '0'; return 0; }
  _ab_ensure_daemon 2>/dev/null || true

  # Capture baseline SYNCHRONOUSLY before backgrounding. If we let the
  # backgrounded subshell compute it, fork latency allows file modifications
  # to sneak into the baseline — making the very change we wanted to observe
  # invisible. The baseline hashes the full diff *content* (not just
  # filenames), so repeated edits to the same file are always detected.
  local _baseline_sig
  _baseline_sig="$(git diff HEAD 2>/dev/null | shasum 2>/dev/null | awk '{print $1}')"
  [[ -z "$_baseline_sig" ]] && _baseline_sig="-"

  (
    # Subshell — variables are scoped automatically, no `local` needed.
    _hook="$_ab_events_hook"
    _provider_env="$provider"
    _stream_env="${AGENTBOARD_STREAM:-}"
    _prev_sig="$_baseline_sig"

    while sleep "$interval"; do
      _cur_diff="$(git diff HEAD 2>/dev/null)"
      _cur_sig="$(printf '%s' "$_cur_diff" | shasum 2>/dev/null | awk '{print $1}')"
      [[ -z "$_cur_sig" ]] && _cur_sig="-"
      [[ "$_cur_sig" == "$_prev_sig" ]] && continue

      _changed="$(git diff --name-only HEAD 2>/dev/null | sort -u)"
      _prev_sig="$_cur_sig"
      _new_files="$(_ab_collect_new_file_changes "$_changed")"
      [[ -z "$_new_files" ]] && continue

      while IFS= read -r _f; do
        [[ -n "$_f" ]] || continue
        _f="${_f%%$'\t'*}"
        if [[ -n "$_stream_env" ]]; then
          _payload="{\"hook_event_name\":\"FileChange\",\"session_id\":\"$session_id\",\"stream\":\"$_stream_env\",\"tool_name\":\"_observed_edit\",\"file_path\":\"$_f\"}"
        else
          _payload="{\"hook_event_name\":\"FileChange\",\"session_id\":\"$session_id\",\"tool_name\":\"_observed_edit\",\"file_path\":\"$_f\"}"
        fi
        # AGENTBOARD_PROVIDER must be set for the *hook* process (right side
        # of the pipe) — setting it on the printf is a no-op for the hook.
        printf '%s' "$_payload" | AGENTBOARD_PROVIDER="$_provider_env" AGENTBOARD_STREAM="$_stream_env" bash "$_hook" 2>/dev/null || true
      done <<< "$_new_files"
    done
  ) >/dev/null 2>&1 &
  printf '%s' $!
}

_ab_stop_file_poller() {
  local pid="${1:-0}"
  [[ "$pid" -gt 0 ]] 2>/dev/null || return 0
  kill "$pid" 2>/dev/null || true
  # `wait` only reaps direct children of the current shell. When the poller
  # is spawned via $(...), it's already orphaned, so wait returns immediately
  # and the process may still be sleeping. Poll for up to 2 seconds, then
  # escalate to SIGKILL if it's stuck (e.g. in a long `shasum` call).
  local _i
  for _i in 1 2 3 4 5 6 7 8 9 10; do
    kill -0 "$pid" 2>/dev/null || return 0
    sleep 0.2
  done
  kill -9 "$pid" 2>/dev/null || true
}

# After stopping the file poller, check for FileChange events from this
# session that have no subsequent Reason event for the same file. Prints a
# reminder to stderr so it appears in the terminal after Codex/Gemini exits.
# Call between _ab_stop_file_poller and _ab_session_event "SessionEnd".
_ab_check_unreasoned_changes() {
  local session_id="$1"
  local log=".platform/events.jsonl"
  [[ -f "$log" ]] || return 0
  local unreasoned
  unreasoned="$(awk -v sid="$session_id" '
    function extract(key,    re, s) {
      re = "\"" key "\"[[:space:]]*:[[:space:]]*\"[^\"]*\""
      if (match($0, re)) {
        s = substr($0, RSTART, RLENGTH)
        sub("^\"" key "\"[[:space:]]*:[[:space:]]*\"", "", s)
        sub("\"$", "", s)
        return s
      }
      return ""
    }
    {
      hook = extract("hook_event_name")
      esid = extract("session_id")
      if (hook == "FileChange" && esid == sid) {
        fp = extract("file_path")
        if (fp != "") { fc_line[fp] = NR; fc_files[fp] = 1 }
      }
      if (hook == "Reason") {
        f = extract("file")
        if (f != "") reason_line[f] = NR
      }
    }
    END {
      for (fp in fc_files) {
        if (!(fp in reason_line) || reason_line[fp] < fc_line[fp])
          print fp
      }
    }
  ' "$log" | sort)" || true
  [[ -n "$unreasoned" ]] || return 0
  printf '\n\033[1m⚠  Files changed without ab log-reason:\033[0m\n' >&2
  while IFS= read -r _f; do
    [[ -n "$_f" ]] || continue
    printf '   %s\n' "$_f" >&2
  done <<< "$unreasoned"
  printf '   Run: \033[36mab log-reason <file> "<why>"\033[0m for each file above.\n\n' >&2
}
