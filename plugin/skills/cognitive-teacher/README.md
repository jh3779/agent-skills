# cognitive-teacher ("인지 선생님") v1.1

코드 변경(커밋/브랜치/PR/diff)이나 서브시스템·개념을 **가르치는 학습 문서(HTML)** 를 만들어주는 Claude Code 스킬입니다. 산출물은 셀프 채점 퀴즈가 달린 self-contained HTML 한 파일 — "빨간펜 채점 학습 노트" 디자인으로, 배경 → 직관 → 인터랙티브 피규어 → literate 코드 읽기 → 확인 문제 순서로 구성됩니다.

에이전트가 대량으로 짠 코드를 사람이 따라잡기 위한 도구입니다 (cognitive debt 해소).

## 요구사항

- **Claude Code** (스킬 실행 주체)
- **Node.js 18+** (문서 조립 스크립트 `assemble.mjs` 실행용 — 외부 npm 의존성 없음)
- 인터넷 불필요 — mermaid가 vendored 되어 있어 오프라인/사내망에서 동작

## 설치

스킬 폴더 전체를 사용자 스킬 디렉토리로 복사합니다:

- Windows: `%USERPROFILE%\.claude\skills\cognitive-teacher\`
- macOS/Linux: `~/.claude/skills/cognitive-teacher/`

복사 후 **새 Claude Code 세션부터** 스킬 목록에 나타납니다.

설치 검증 (테스트 러너는 Node 내장, 별도 설치 불필요):

macOS / Linux:

```bash
node --test "$HOME/.claude/skills/cognitive-teacher/test/assemble.test.mjs"
```

Windows (PowerShell):

```powershell
node --test "$env:USERPROFILE\.claude\skills\cognitive-teacher\test\assemble.test.mjs"
```

전체 테스트(32건)가 PASS 하면 정상입니다.

## 사용법

Claude Code 세션에서:

```
/cognitive-teacher <주제>            # 주제 모드 — 예: "배치 파이프라인이 어떻게 동작하는지"
/cognitive-teacher <커밋/브랜치/PR>   # diff 모드 — 예: "HEAD~5..HEAD" 또는 PR 브랜치명
```

### 산출물 위치

산출물은 **홈 디렉토리 아래 `claude-lessons/`** 에 `<날짜>-<슬러그>-lesson.html` 이름으로 생성됩니다. 경로는 OS 별로 알아서 해석되고(폴더가 없으면 만듭니다), 스킬은 실제 저장 경로를 채팅에 그대로 알려줍니다.

| OS | 기본 경로 |
|----|-----------|
| Windows | `C:\Users\<계정>\claude-lessons\` |
| macOS | `/Users/<계정>/claude-lessons/` |
| Linux | `/home/<계정>/claude-lessons/` |

다른 곳에 저장하려면 환경변수 `COGNITIVE_TEACHER_OUT_DIR` 에 폴더를 지정하세요 (`~` 로 시작해도 되고, 없는 폴더는 만들어집니다):

```bash
export COGNITIVE_TEACHER_OUT_DIR="~/Documents/lessons"   # macOS/Linux
```

```powershell
$env:COGNITIVE_TEACHER_OUT_DIR = "D:\lessons"            # Windows (PowerShell)
```

작업 중인 레포 워킹트리에는 어떤 파일도 만들지 않습니다.

**반드시 실브라우저(Chrome 등)에서 여세요** — 퀴즈 채점과 인터랙티브 피규어는 JavaScript가 필요합니다.

## 특징

- **주장 검증 패스 내장**: 문서의 모든 `파일:줄` 인용을 조립 전에 실측 대조합니다 (위치 + 의미론). 레포 문서(md)가 코드와 다르면 코드를 정본으로 삼습니다
- **self-contained 검사**: `script`/`img`/`iframe`/`link` 태그의 외부·상대 참조(src/href/srcset)를 조립 단계에서 차단합니다 (`data:` URI 와 `#` 앵커만 예외). 본문의 `<a href>` 링크는 허용 — 그 외 태그(`video`/`object` 등)와 CSS `url()`·`@import` 는 검사 대상이 아니므로 작성 단계에서 지킵니다
- **셀프 채점 퀴즈**: 5문항 내외, 첫 시도 기준 채점, 오답엔 빨간 빗금·정답엔 빨간 동그라미
- **한글 조판**: Noto Serif/Sans KR이 설치돼 있으면 최적, 없으면 시스템 폰트로 폴백

## 파일 구조

| 파일 | 역할 |
|------|------|
| `SKILL.md` | 스킬 정의 — 트리거·워크플로우 6단계 |
| `references/writing-guide.md` | 작성 원칙·마크업 어휘·근거 규칙 |
| `template.html` | 디자인 시스템 + 퀴즈 렌더러 + mermaid 초기화 |
| `assemble.mjs` | 조립 CLI — 콘텐츠 검증 후 단일 HTML 생성 (`--slug` 로 저장 경로 자동 계산) |
| `assets/mermaid.min.js` | vendored mermaid 11.16.1 (다이어그램 렌더) |
| `assets/LICENSES.txt` | 제3자 라이선스 고지 (mermaid MIT, DOMPurify Apache-2.0) |
| `samples/content.sample.html` | 완성 콘텐츠 예시 |
| `test/assemble.test.mjs` | 설치 검증 겸 회귀 테스트 (node --test) |

## 문제 해결

- 스킬이 목록에 안 보임 → 새 세션에서 확인 (세션 시작 시 로드)
- `[assemble] ERROR: ...` → 콘텐츠 검증 실패 — 메시지가 원인을 알려줍니다 (필수 섹션 누락, 퀴즈 JSON 스키마, 외부 리소스 참조 등)
- 퀴즈가 안 눌림 → 앱 내장 미리보기가 아닌 실브라우저에서 열었는지 확인
- 산출물이 어디 생겼는지 모르겠음 → 스킬이 알려준 절대 경로가 정본입니다. `COGNITIVE_TEACHER_OUT_DIR` 를 설정했다면 그 폴더, 아니면 홈의 `claude-lessons/`
- `[assemble] ERROR: slug 형식 오류` → 슬러그는 소문자 영숫자와 하이픈만 (예: `batch-worker-retry`)
- Windows 에서 `~` 가 그대로 폴더로 만들어짐 → 오래된 사본입니다. PowerShell/cmd 는 `~` 를 확장하지 않으므로 최신 버전(`--slug` 지원)으로 갱신하세요
