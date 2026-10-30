# agent-skills

Codex와 Claude Code에서 쓰는 업무용 스킬 13종 묶음입니다. 코드·설계 점검, 리뷰 작성, 학습, 기획·발표 준비, 세션 인계를 다룹니다.

디자인 스킬(요구사항·스타일 인터뷰와 UI 템플릿 8종)은 별도 저장소 [design-templates](https://github.com/jh3779/design-templates)에 있습니다.

## 설치

아래 명령은 Codex나 Claude Code를 **실행한 채로 그 안에 입력하는 것이 아니라**, 일반 터미널(macOS 터미널, iTerm, VS Code 터미널 등)에 입력합니다. 어느 폴더에서 실행해도 되고, 한 번 설치하면 모든 프로젝트에서 쓸 수 있습니다.

### Codex

```bash
codex plugin marketplace add jh3779/agent-skills
codex plugin add agent-skills@agent-skills
```

설치한 뒤 Codex를 재시작합니다. `codex plugin list`에서 `agent-skills@agent-skills`가 `installed, enabled`로 보이면 설치가 끝난 것입니다.

### Claude Code

Claude Code에서는 `agent-skills`라는 마켓플레이스 이름이 Anthropic 공식용으로 예약돼 있어서, 마켓플레이스 이름이 **`jh3779-skills`** 입니다(플러그인 이름은 그대로 `agent-skills`).

터미널에서:

```bash
claude plugin marketplace add jh3779/agent-skills
claude plugin install agent-skills@jh3779-skills
```

또는 Claude Code 대화창 안에서 슬래시 명령으로:

```
/plugin install agent-skills --marketplace jh3779/agent-skills
```

설치한 뒤 Claude Code를 재시작합니다. `claude plugin list`에서 `agent-skills@jh3779-skills`가 `enabled`로 보이면 설치가 끝난 것입니다.

## 사용

스킬마다 설명에 적힌 상황이 되면 Codex나 Claude Code가 알아서 꺼내 씁니다. 이름으로 직접 부를 수도 있습니다.
- Codex: `$structure-audit 이 프로젝트 점검해줘`
- Claude Code: `/agent-skills:structure-audit` (스킬 이름 앞에 플러그인 이름이 붙습니다)

## 스킬 목록

| 분야 | 스킬 | 하는 일 | 이렇게 말하면 시작합니다 |
| --- | --- | --- | --- |
| 점검 | `architecture-audit` | 데이터 생명주기, API 계약, 상태 전이 같은 설계를 근거(file:line)와 함께 감사합니다 | "설계 점검해줘" |
| 점검 | `structure-audit` | 관심사 분리와 파일 구성을 감사합니다 | "구조 감사해줘" |
| 점검 | `doc-drift-check` | 문서 속 `file:line` 인용이 실제 코드와 맞는지 스크립트로 검사합니다 | "문서 드리프트 체크" |
| 리뷰 | `readable-review-findings` | 리뷰 지적사항을 "무엇이·왜·어떻게" 순서로 주니어도 읽기 쉽게 씁니다 | 리뷰를 쓸 때 자동 적용 |
| 리뷰 | `ux-law-ui-reviewer` | UI를 UX 법칙 5가지(힉·피츠·제이콥·근접성·…)로 리뷰하고 HTML 리포트를 남깁니다 | "이 화면 UX 리뷰해줘" |
| 학습 | `cognitive-teacher` | 코드 변경이나 개념을 HTML 학습 문서(배경 → 직관 → 인터랙티브 그림 → 코드 읽기 → 퀴즈)로 만듭니다 | "이 PR 가르쳐줘" |
| 학습 | `milestone-tutor` | 주제·코드베이스를 마일스톤으로 나눠 비유·실제 데이터·확인 질문으로 하나씩 익히게 합니다 | "이거 제대로 이해하고 싶어" |
| 기획 | `plan-gap-interview` | 이미 있는 기획 문서(PRD, ERD 등)에서 확정되지 않은 결정을 찾아 주제별 인터뷰로 정하고 기록합니다 | "기획 문서 빈틈 찾아줘" |
| 문서 | `split-instructions` | 너무 커진 지시서·PRD·런북을 작업 단위 파일과 태그 달린 `INDEX.md`로 나눠, 필요한 부분만 읽게 합니다 | "이 지시서 쪼개줘" |
| 기획 | `project-plan-template` | 최종 발표에서 거꾸로 계산한 기획서(성공 기준, 검증 계획, 일정)를 작성·점검합니다 | "기획서 만들어줘" |
| 발표 | `presentation-script` | 결론 먼저 구조의 발표 대본, 시간표, 예상 질문, 점검표를 만듭니다 | "발표 대본 만들어줘" |
| 인계 | `handoff` | `.agent/` 폴더에 프로젝트 상태 문서를 만들고 갱신해 다음 세션이 이어받게 합니다 | "체크포인트", "이어서 작업" |
| 웹 | `web-reach` | 유튜브 자막, RSS/Atom 피드처럼 바로 읽기 어려운 웹 콘텐츠를 가져옵니다 | "이 영상 자막 가져와줘" |

## 필요한 것

- Python 3: `doc-drift-check`, `presentation-script`, `project-plan-template`의 보조 스크립트
- Node.js: `cognitive-teacher`의 HTML 조립 스크립트
- `yt-dlp`: `web-reach`의 유튜브 자막 가져오기

## 업데이트

```bash
codex plugin marketplace upgrade agent-skills
```

```bash
claude plugin marketplace update jh3779-skills && claude plugin update agent-skills@jh3779-skills
```

## 참고

- 일부 스킬 본문은 이 묶음에 없는 스킬(`design-review`, `security-review` 등)을 "이럴 땐 그 스킬로"라고 안내합니다. 설치돼 있지 않으면 그 안내는 무시하면 됩니다.
- `cognitive-teacher`에는 mermaid(MIT)가 포함돼 있습니다. 라이선스는 `plugin/skills/cognitive-teacher/assets/LICENSES.txt`에 있습니다.

## 라이선스

[MIT](LICENSE). 복사·수정해 상업 프로젝트에 써도 됩니다. 저작권 표시와 라이선스 문구만 함께 남겨 주세요.
