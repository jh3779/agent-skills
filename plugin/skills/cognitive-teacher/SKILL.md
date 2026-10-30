---
name: cognitive-teacher
description: 코드 변경(커밋/브랜치/PR/diff)이나 서브시스템·개념을 "가르치는" 학습 문서(HTML)를 생성한다 — 배경→직관→인터랙티브 피규어→literate 코드 읽기→셀프 채점 퀴즈 구성. 사용자가 변경/시스템을 이해하고 싶다, 설명해달라, 가르쳐달라, 학습 문서/퀴즈를 만들어달라고 할 때 사용한다.
---

# cognitive-teacher ("인지 선생님")

에이전트가 짠 코드를 사람이 따라잡기 위한 학습 문서를 만든다. 산출물은 셀프 채점 퀴즈가 달린 self-contained HTML 한 파일. 목적은 리뷰(검증)가 아니라 **이해(참여)** 다.

## 모드 판정

- 인자에 커밋/브랜치/PR/diff 범위가 있으면 **diff 모드**
- 서브시스템·개념 문구("X가 어떻게 동작하는지")면 **주제 모드**

## 워크플로우

1. **수집**
   - diff 모드: `git diff [range]`, `git diff --stat [range]`, `git log --oneline [range]`로 실제 변경만. **추측 금지.** git 레포가 아니거나 diff가 비면 명확히 안내하고 중단.
   - 주제 모드: 관련 코드·문서(CLAUDE.md/AGENTS.md 포함)를 직접 읽고 **근거 있는 내용만** 작성. 코드 경로는 `파일경로:줄번호`로 표기.
2. **콘텐츠 작성**: `references/writing-guide.md`의 원칙과 마크업 어휘를 따라 `content.html`을 **세션 스크래치패드**에 작성. 완성 예시: `samples/content.sample.html`.
3. **주장 검증 패스** (조립 전 필수 — 건너뛰지 않는다): content.html의 사실 주장을 전수 실측 대조한다.
   - 모든 `파일:줄` 인용을 실제로 열어 두 가지를 확인한다 — **위치**(그 줄에 그 내용이 있는가)와 **의미론**(분류 대상·방향·강제성이 코드 동작과 맞는가. **인용이 정확해도 의미론이 틀릴 수 있다** — 실사례: 정책 문서를 정확히 인용하고도 soft-degrade를 "하드 리밋"으로 서술)
   - 주장이 많으면 영역별로 나눠 서브에이전트에 병렬 검증을 맡긴다
   - 불일치는 콘텐츠를 고치고 고친 주장만 재검증한다. 판정 기준은 `references/writing-guide.md`의 "## 규칙" 참조
4. **조립**: 스킬 base 디렉토리(세션 헤더의 "Base directory for this skill" 값, 없으면 이 SKILL.md 가 있는 폴더)를 `<SKILL_DIR>` 로 두고
   `node "<SKILL_DIR>/assemble.mjs" "<content.html>" --slug <slug>`
   - `<slug>` 은 소문자 영숫자와 하이픈만 (예: `batch-worker-retry`). 날짜·파일명·출력 폴더는 스크립트가 계산한다 — 직접 조립하지 않는다.
   - 경로 인자는 항상 큰따옴표로 감싸고 `~` 는 쓰지 않는다 — Windows 셸(PowerShell/cmd)은 `~` 를 확장하지 않고, 홈 경로에 공백이 들어갈 수 있다.
   - 검증 에러(`[assemble] ERROR: ...`)가 나오면 콘텐츠를 고쳐 재실행.
5. **출력**: 스크립트가 쓴 파일의 절대 경로를 stdout 으로 내보낸다 — **그 출력값을 그대로** 쓴다 (경로를 추측·재조립하지 않는다).
   - 기본 위치: `<홈>/claude-lessons/<YYYY-MM-DD>-<slug>-lesson.html` — Windows `C:\Users\<계정>\claude-lessons\`, macOS `/Users/<계정>/claude-lessons/`, Linux `/home/<계정>/claude-lessons/`. 폴더가 없으면 만든다.
   - 다른 위치를 원하면: 환경변수 `COGNITIVE_TEACHER_OUT_DIR` 로 폴더 지정, 또는 `--slug` 대신 출력 경로를 두 번째 인자로 직접 전달.
   - **작업 레포 워킹트리에 파일을 만들지 않는다.**
6. **안내**: 생성 경로를 알리고 퀴즈 풀기를 권한다.

## 필수 주의

- **실브라우저(Chrome)에서 열도록 안내한다.** in-app 브라우저의 `file://`은 정적 스냅샷이라 퀴즈·피규어 JS가 동작하지 않는다.
- 출력 언어는 대화 언어를 따른다 (기본 한국어).
- 시크릿은 마스킹, diff가 너무 크면 핵심 변경 중심으로 싣고 "축약됨"을 표기한다.
