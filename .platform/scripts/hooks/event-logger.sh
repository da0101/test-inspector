#!/usr/bin/env bash
# event-logger.sh — append lean AI agent events to .platform/events.jsonl
#
# Invoked by Claude Code hooks (PostToolUse + UserPromptSubmit) via stdin.
# Can also be called from Codex/Gemini wrappers — any JSON payload accepted.
# Fail-open: errors never block a tool call.
#
# Output format (one JSON object per line):
#   {"ts":"<ISO>","provider":"<p>","stream":"<slug>","tool":"<name>","file":"<path>"}
#   {"ts":"<ISO>","provider":"<p>","stream":"<slug>","tool":"Bash","cmd":"<truncated>"}
#
# UserPromptSubmit events are dropped — they're noise, not signal.
# The raw hook payload is never stored — only the meaningful fields.

set -u
[[ -d ".platform" ]] || exit 0

log_file=".platform/events.jsonl"
mkdir -p "$(dirname "$log_file")" 2>/dev/null || exit 0

input="$(cat 2>/dev/null)"
[[ -n "$input" ]] || exit 0

ts="$(date -u +%Y-%m-%dT%H:%M:%SZ 2>/dev/null)" || exit 0
provider="${AGENTBOARD_PROVIDER:-claude}"

_json_string_field() {
  local field="$1"
  printf '%s' "$input" | awk -v field="$field" '
    match($0, "\"" field "\"[[:space:]]*:[[:space:]]*\"[^\"]*\"") {
      s = substr($0, RSTART, RLENGTH)
      sub(".*\"" field "\"[[:space:]]*:[[:space:]]*\"", "", s)
      sub(/".*/, "", s)
      print s
      exit
    }
  '
}

# Skip UserPromptSubmit — full user prompts are noise for the next agent
hook_event="$(_json_string_field "hook_event_name")"
[[ "$hook_event" == "UserPromptSubmit" ]] && exit 0

_brief_primary_stream() {
  local brief=".platform/work/BRIEF.md" slug
  [[ -f "$brief" ]] || return 1
  slug="$(sed -n 's/^\*\*Stream file:\*\* `work\/\([^`]*\)\.md`$/\1/p' "$brief")"
  slug="${slug%%$'\n'*}"
  [[ -n "$slug" && -f ".platform/work/${slug}.md" ]] || return 1
  printf '%s\n' "$slug"
}

_active_streams() {
  local active=".platform/work/ACTIVE.md"
  [[ -f "$active" ]] || return 0
  awk -F'|' '
    function trim(s) { gsub(/^[ \t]+|[ \t]+$/, "", s); return s }
    {
      slug = trim($2)
      status = trim($4)
      if (slug == "" || slug == "Stream" || slug == "_(none)_" || slug ~ /^-+$/) next
      if (status == "" || status == "done" || status == "archived" || status == "closed") next
      print slug
    }
  ' "$active"
}

_stream_map_file=".platform/.session-streams.tsv"
_session_stream_lookup() {
  local session_id="$1"
  [[ -n "$session_id" && -f "$_stream_map_file" ]] || return 1
  awk -F'\t' -v session_id="$session_id" '
    $1 == session_id { print $2; found = 1; exit }
    END { exit found ? 0 : 1 }
  ' "$_stream_map_file"
}

_remember_session_stream() {
  local session_id="$1" stream_slug="$2" tmp
  [[ -n "$session_id" && -n "$stream_slug" ]] || return 0
  tmp="$(mktemp 2>/dev/null)" || return 0
  if [[ -f "$_stream_map_file" ]]; then
    awk -F'\t' -v session_id="$session_id" '$1 != session_id { print }' "$_stream_map_file" > "$tmp"
  fi
  printf '%s\t%s\n' "$session_id" "$stream_slug" >> "$tmp"
  mv "$tmp" "$_stream_map_file" 2>/dev/null || rm -f "$tmp"
}

_resolve_stream() {
  local explicit_stream="${1:-}" session_id="${2:-}" brief_stream active_streams active_count
  if [[ -n "$explicit_stream" && -f ".platform/work/${explicit_stream}.md" ]]; then
    printf '%s\n' "$explicit_stream"; return 0
  fi
  if [[ -n "$session_id" ]]; then
    local remembered
    remembered="$(_session_stream_lookup "$session_id" 2>/dev/null || true)"
    if [[ -n "$remembered" && -f ".platform/work/${remembered}.md" ]]; then
      printf '%s\n' "$remembered"; return 0
    fi
  fi
  brief_stream="$(_brief_primary_stream 2>/dev/null || true)"
  if [[ -n "$brief_stream" ]]; then printf '%s\n' "$brief_stream"; return 0; fi
  active_streams="$(_active_streams)"
  active_count="$(printf '%s\n' "$active_streams" | awk 'NF { count++ } END { print count + 0 }')"
  if [[ "$active_count" -eq 1 ]]; then printf '%s\n' "$active_streams"; return 0; fi
  return 1
}

session_id="$(_json_string_field "session_id")"
payload_stream="$(_json_string_field "stream")"
stream="$(_resolve_stream "${AGENTBOARD_STREAM:-$payload_stream}" "$session_id" 2>/dev/null || true)"
if [[ -n "$stream" && -n "$session_id" ]]; then
  _remember_session_stream "$session_id" "$stream"
fi

tool="$(_json_string_field "tool_name")"

# Skip Bash events that are ab meta-calls — those commands produce
# their own structured events (Reason, checkpoint, etc.) which are the signal.
# Logging the Bash wrapper too just duplicates noise.
if [[ "$tool" == "Bash" ]]; then
  _cmd_peek="$(_json_string_field "command")"
  case "$_cmd_peek" in
    ab\ *|agentboard\ *) exit 0 ;;
  esac
fi

_jsesc() {
  printf '%s' "$1" | awk '{ gsub(/\\/, "\\\\"); gsub(/"/, "\\\""); printf "%s", $0 }'
}
provider_e="$(_jsesc "$provider")"
stream_e="$(_jsesc "$stream")"
tool_e="$(_jsesc "$tool")"
hook_e="$(_jsesc "$hook_event")"

# Session events (SessionStart/End, FileChange, Reason) are identified by
# hook_event_name — regardless of whether tool_name is also present.
case "$hook_event" in
  SessionStart|SessionEnd|FileChange|Reason)
    # ── Session event: preserve hook_event_name + session_id + file_path ─────
    _sid_e="$(_jsesc "${session_id:-}")"
    _fp="$(_json_string_field "file_path")"
    if [[ -n "$_fp" ]]; then
      _fp_e="$(_jsesc "$_fp")"
      _payload="{\"ts\":\"$ts\",\"provider\":\"$provider_e\",\"stream\":\"$stream_e\",\"hook_event_name\":\"$hook_e\",\"session_id\":\"$_sid_e\",\"file_path\":\"$_fp_e\"}"
    else
      _payload="{\"ts\":\"$ts\",\"provider\":\"$provider_e\",\"stream\":\"$stream_e\",\"hook_event_name\":\"$hook_e\",\"session_id\":\"$_sid_e\"}"
    fi
    ;;
  *)
    # ── Tool event (PostToolUse): extract one meaningful detail, no raw dump ──
    detail_key=""
    detail_val=""
    case "$tool" in
      Read)
        exit 0  # internal lookups — not "what I changed"
        ;;
      Edit|Write|MultiEdit|NotebookEdit)
        _fp="$(_json_string_field "file_path")"
        # Skip .platform/ meta-file edits (memory, stream files, daemon state)
        _rel="${_fp##"$(pwd)/"}"
        case "$_rel" in .platform/*) exit 0 ;; esac
        if [[ -n "$_fp" ]]; then
          detail_key="file"
          detail_val="$_rel"
        fi
        ;;
      Bash)
        _cmd="$(_json_string_field "command")"
        # Keep only git commits/pushes — all other Bash is handoff noise
        case "$_cmd" in
          git\ commit\ *|git\ push\ *) ;;
          *) exit 0 ;;
        esac
        if [[ -n "$_cmd" ]]; then
          detail_key="cmd"
          detail_val="${_cmd:0:120}"
        fi
        ;;
      WebSearch|WebFetch)
        exit 0  # internal research — not "what I changed"
        ;;
    esac
    if [[ -n "$detail_key" && -n "$detail_val" ]]; then
      detail_e="$(_jsesc "$detail_val")"
      _payload="{\"ts\":\"$ts\",\"provider\":\"$provider_e\",\"stream\":\"$stream_e\",\"tool\":\"$tool_e\",\"$detail_key\":\"$detail_e\"}"
    else
      _payload="{\"ts\":\"$ts\",\"provider\":\"$provider_e\",\"stream\":\"$stream_e\",\"tool\":\"$tool_e\"}"
    fi
    ;;
esac

# Write via daemon (concurrent-safe) or direct append fallback
_port_file=".platform/.daemon-port"
_daemon_ok=0
if [[ -f "$_port_file" ]] && command -v curl >/dev/null 2>&1; then
  _port="$(cat "$_port_file" 2>/dev/null)"
  if [[ "$_port" =~ ^[0-9]+$ ]]; then
    if curl -sf -m 1 -X POST "http://127.0.0.1:$_port/event" \
        -H 'Content-Type: application/json' \
        -d "$_payload" >/dev/null 2>&1; then
      _daemon_ok=1
    fi
  fi
fi

if (( _daemon_ok == 0 )); then
  if command -v flock >/dev/null 2>&1; then
    (
      flock -w 1 9 || exit 0
      printf '%s\n' "$_payload" >&9
    ) 9>>"$log_file" 2>/dev/null
  else
    printf '%s\n' "$_payload" >> "$log_file" 2>/dev/null
  fi
fi

exit 0
