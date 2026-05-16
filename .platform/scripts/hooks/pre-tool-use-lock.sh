#!/usr/bin/env bash
# pre-tool-use-lock.sh — acquire file lock before Claude writes a file
# Registered as a PreToolUse hook in .claude/settings.json
# Fail-open: never blocks a tool call if daemon is unreachable or lock times out.

set -u

[[ -d ".platform" ]] || exit 0

_port_file=".platform/.daemon-port"
[[ -f "$_port_file" ]] || exit 0
command -v curl >/dev/null 2>&1 || exit 0

_port="$(cat "$_port_file" 2>/dev/null)"
[[ "$_port" =~ ^[0-9]+$ ]] || exit 0

_provider="${AGENTBOARD_PROVIDER:-claude}"
_input="$(cat)"
[[ -n "$_input" ]] || exit 0

_json_field() {
  local _field="$1"
  if command -v jq >/dev/null 2>&1; then
    printf '%s' "$_input" | jq -r --arg field "$_field" '.[$field] // empty' 2>/dev/null
  else
    printf '%s' "$_input" | grep -o "\"${_field}\"[[:space:]]*:[[:space:]]*\"[^\"]*\"" | head -1 | grep -o '"[^"]*"$' | tr -d '"'
  fi
}

_session_id="${AGENTBOARD_SESSION_ID:-$(_json_field "session_id")}"
[[ -n "$_session_id" ]] || _session_id="${_provider}-ppid-${PPID}"

# Extract tool name
_tool="$(printf '%s' "$_input" | grep -o '"tool_name"[[:space:]]*:[[:space:]]*"[^"]*"' | head -1 | grep -o '"[^"]*"$' | tr -d '"')"
case "$_tool" in
  Write|Edit|MultiEdit|NotebookEdit) ;;
  *) exit 0 ;;
esac

# Extract file paths — try jq first, fall back to grep
_files=""
if command -v jq >/dev/null 2>&1; then
  _files="$(printf '%s' "$_input" | jq -r '
    .tool_input.file_path,
    .tool_input.new_file_path,
    (.tool_input.edits[]?.file_path // empty)
    | select(. != null and . != "")
  ' 2>/dev/null | sort -u || true)"
else
  _files="$(printf '%s' "$_input" | grep -o '"file_path"[[:space:]]*:[[:space:]]*"[^"]*"' | grep -o '"[^"]*"$' | tr -d '"' | sort -u || true)"
fi

[[ -n "$_files" ]] || exit 0

_acquire_lock() {
  local _f="${1#./}"  # normalize: strip leading ./
  local _deadline=$(( $(date +%s) + 30 ))
  while true; do
    local _resp _code
    _resp="$(curl -sf -m 2 -w '\n%{http_code}' -X POST "http://127.0.0.1:$_port/lock" \
      -H 'Content-Type: application/json' \
      -d "{\"file\":\"$_f\",\"provider\":\"$_provider\",\"session_id\":\"$_session_id\"}" 2>/dev/null)"
    _code="$(printf '%s' "$_resp" | tail -1)"
    if [[ "$_code" == "200" ]]; then
      return 0
    elif [[ "$_code" == "202" ]]; then
      if [[ "$(date +%s)" -ge "$_deadline" ]]; then
        printf 'agentboard: lock timeout on %s — proceeding anyway\n' "$_f" >&2
        return 0
      fi
      sleep 1
    else
      return 0  # daemon error — fail open
    fi
  done
}

while IFS= read -r _file; do
  [[ -n "$_file" ]] || continue
  _acquire_lock "$_file"
done <<< "$_files"

exit 0
