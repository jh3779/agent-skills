# UX Law UI Reviewer

웹·모바일·대시보드·게임 UI를 다섯 가지 UX 법칙(힉, 피츠, 제이콥, 근접성, 폰 레스토프)으로 검토하고, 심각도별 개선안을 날짜별 HTML 파일로 기록하는 Claude·Codex 공용 스킬입니다.

브라우저로 `index.html`을 열면 이 모음집을 한 화면에서 볼 수 있습니다.

## 폴더 구조

```
ux-law-ui-reviewer/
├── index.html                  모음집 첫 화면 (브라우저로 열기)
├── README.md                   이 문서
├── SKILL.md                    스킬 본문 (절차·체크리스트·수치 기준·예시)
├── references/
│   ├── ux-laws-checklist.md    법칙별 체크리스트 (SKILL.md 부록 A 사본)
│   └── metrics.md              근거 있는 수치 기준 (부록 B 사본, 함께 고칠 것)
├── templates/
│   ├── review-report.html      리뷰 리포트 템플릿 (부록 D, 유일한 원본)
│   └── review-index.html       리뷰 기록 인덱스 템플릿 (부록 E, 유일한 원본)
└── examples/
    ├── input/                  예시 입력 (React 코드, HUD 설명, 결제 화면 설명)
    └── ux-reviews/             예시 출력 (리뷰 2건 + 기록 인덱스)
```

## 설치

폴더째 스킬 디렉터리에 둡니다. 템플릿을 `templates/`에서 읽기 때문에 `SKILL.md` 한 파일만 옮기면 HTML 기록 기능이 동작하지 않습니다.

- Claude Code: `~/.claude/skills/ux-law-ui-reviewer/`
- Codex: `~/.codex/skills/ux-law-ui-reviewer/`
- claude.ai 업로드용 단독본(템플릿이 SKILL.md 안에 들어 있는 v1 원본)이 필요하면 별도 보관본을 씁니다.

## 관련 스킬

`design-review`(종합 디자인 비평·감사·다듬기), `design-generation`(새 화면 제작)과 역할이 나뉩니다. 분담 기준과 법칙별 후속 커맨드는 `SKILL.md`의 "관련 스킬과 역할 분담"을 보세요.

## 사용법

다음처럼 요청하고 스크린샷, 코드, URL, 화면 설명 중 하나를 함께 줍니다.

- "이 화면 UX 관점에서 검토해줘"
- "버튼 배치 좀 봐줘, 사용자가 다음 행동을 쉽게 찾는지"
- "게임 HUD 가독성이랑 조작성 확인해줘"
- "모바일 터치 동선 확인해줘"

결과는 `ux-reviews/YYYY-MM-DD_<화면이름>.html`로 저장되고 `ux-reviews/index.html`에 한 줄이 추가됩니다. Claude Code·Codex에서는 검토 대상 프로젝트 루트의 `ux-reviews/`에 쌓입니다(`design-review critique`의 `.impeccable/critique/`와는 별개). 채팅으로만 받고 싶으면 "파일 없이 채팅으로"라고 말하면 됩니다.

## 리포트 구성

1. 한줄 평가
2. 핵심 행동 (발견 가능성, 방해 요소)
3. 주요 문제 (심각도순, 법칙·위치·이유·영향·수정 방법)
4. UX 법칙별 점검표
5. 우선순위별 개선안 (이번 버전 / 다음 버전 / 제외)
6. 적용 예시 (전후 비교, 코드 diff, 문구 수정안)
7. 최종 체크리스트

심각도: Critical, High, Medium, Low, Suggestion

## 템플릿 직접 고치기

`templates/review-report.html`의 `:root` 색상 토큰을 바꾸면 리포트 색이 바뀝니다. `templates/`가 유일한 원본이라 고치면 바로 스킬에 반영됩니다(SKILL.md에는 사본이 없습니다).
