#!/usr/bin/env bash
# Extract YouTube subtitles (manual if available, else auto-generated) as plain text.
# Usage: youtube_transcript.sh <youtube-url> [lang]
set -euo pipefail

URL="${1:?Usage: youtube_transcript.sh <youtube-url> [lang]}"
LANG_CODE="${2:-ko}"
TMPDIR="$(mktemp -d)"
trap 'rm -rf "$TMPDIR"' EXIT

cd "$TMPDIR"

# Try requested language first (manual, then auto), fall back to English.
fetch() {
  local lang="$1"
  yt-dlp --skip-download --write-sub --write-auto-sub \
    --sub-lang "$lang" --sub-format vtt \
    -o "sub.%(ext)s" "$URL" >/dev/null 2>&1 || true
}

fetch "$LANG_CODE"
VTT_FILE="$(ls sub*.vtt 2>/dev/null | head -1 || true)"

if [ -z "$VTT_FILE" ] && [ "$LANG_CODE" != "en" ]; then
  fetch "en"
  VTT_FILE="$(ls sub*.vtt 2>/dev/null | head -1 || true)"
fi

if [ -z "$VTT_FILE" ]; then
  echo "ERROR: no subtitles found for this video (tried $LANG_CODE, en)" >&2
  exit 1
fi

# Strip VTT timestamps/cue markup, collapse to plain text, dedupe consecutive repeated lines.
tr -d '\r' < "$VTT_FILE" \
  | grep -vE '^(WEBVTT|Kind:.*|Language:.*|NOTE.*|[0-9:.]+ --> [0-9:.]+.*)$' \
  | sed -E 's/<[^>]+>//g' \
  | sed '/^\s*$/d' \
  | awk '!seen[$0]++'
