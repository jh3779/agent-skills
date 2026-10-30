---
name: web-reach
description: Fetch content the agent can't otherwise read easily — YouTube subtitles/transcripts (via yt-dlp) and RSS/Atom feed entries (via a stdlib-only parser). For plain web pages and public GitHub content, just use the built-in WebFetch / gh CLI directly — no script needed. This skill deliberately does NOT support platforms that require login cookies (Twitter/X, Reddit, Instagram, Facebook, XiaoHongShu, LinkedIn deep pages) — do not add cookie-based auth to these scripts.
metadata:
  origin: self-built (evaluated and rejected github.com/Panniantong/agent-reach — low-trust repo requiring login cookies for most useful platforms; built a minimal trusted equivalent instead)
---

# Web Reach — YouTube / RSS access via trusted tools only

> **`$SKILL_DIR`** = 이 `SKILL.md`가 들어 있는 폴더의 절대경로(플러그인 설치본 안). 모르면 `find ~/.codex -path '*/web-reach/SKILL.md'`로 찾아 그 상위 폴더를 쓴다.

## When to Use

- User shares a YouTube link and wants a summary/transcript/subtitles
- User shares an RSS/Atom feed URL and wants recent entries
- **Not** for Twitter/X, Reddit, Instagram, Facebook, XiaoHongShu, LinkedIn, or any platform that requires a logged-in session — those are explicitly out of scope (see Guardrail below)
- For a plain webpage or public GitHub repo/issue/PR, use WebFetch or `gh` directly — don't invoke this skill

## YouTube Transcripts

```bash
$SKILL_DIR/scripts/youtube_transcript.sh "<youtube-url>" [lang-code]
```

- `lang-code` defaults to `ko`, falls back to `en` if unavailable
- Prefers manually-created subtitles, falls back to auto-generated captions
- Prints deduplicated plain text to stdout (VTT timestamps/markup stripped)
- Uses `yt-dlp` (installed via `pipx install yt-dlp`) — a widely trusted, actively maintained OSS project, not the source of any login/cookie risk
- If a video truly has no subtitles in any language, the script exits non-zero with a clear error

## RSS / Atom Feeds

```bash
python3 $SKILL_DIR/scripts/rss_fetch.py "<feed-url>" [max-entries]
```

- `max-entries` defaults to 15
- Standard library only (`urllib`, `xml.etree`) — no third-party dependency
- Handles both RSS 2.0 (`<item>`) and Atom (`<entry>`) formats
- Prints `title / link / date` per entry as a markdown list

## Guardrail — do not extend this to login-required platforms

This skill exists specifically *because* a third-party alternative (agent-reach) required storing platform login cookies (Twitter/X, XiaoHongShu, Reddit, Instagram, Facebook) to unlock most of its useful features — an account-suspension and credential-exposure risk for a low-trust, unaudited codebase. If asked to add Twitter/Reddit/Instagram/etc. support here, stop and flag the same tradeoff rather than silently adding cookie-based auth.
