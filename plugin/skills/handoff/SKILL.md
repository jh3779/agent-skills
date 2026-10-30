---
name: handoff
description: >
  장시간/여러 세션에 걸친 프로젝트 작업을 위해 프로젝트별 `.agent/` 상태 문서
  (PROJECT_CONTEXT.md · HANDOFF.md · DECISIONS.md)를 초기화·갱신·재개하는 스킬.
  긴 대화 하나에 모든 걸 쌓아두는 대신, "현재 상태 스냅샷"만 다음 세션에 인계해
  컨텍스트 오염과 토큰 낭비를 줄인다. 세 가지 동작을 지원한다: (1) init — 새
  프로젝트에 .agent/ 뼈대 생성, (2) checkpoint — 이번 세션 작업을 정리해
  HANDOFF.md·DECISIONS.md 갱신, (3) resume — .agent/ 문서 + git 상태를 읽고
  중단 지점부터 재개. Triggers: "/checkpoint", "/resume", "/context",
  "/handoff-init", "체크포인트", "핸드오프", "세션 정리", "작업 이어가기",
  "다음 세션으로 인계", "여기까지 저장", "프로젝트 상태 저장", "이어서 작업",
  "session handoff", "resume work", "save project state", "project context
  snapshot". 특정 프로젝트에 종속된 스킬이 아니며, 이 컴퓨터의 어떤 프로젝트
  디렉터리에서 실행해도 그 디렉터리 기준으로 동작한다.
---

# handoff — 세션 간 프로젝트 상태 인계

## 핵심 원칙

> 에이전트가 과거의 모든 대화를 기억하게 만드는 게 아니라, **지금 작업을
> 이어가는 데 필요한 상태만** 기억하게 만든다.

- **Conversation은 임시**, `.agent/` 문서는 **영구 상태**. 채팅이 압축되거나
  새 세션으로 넘어가도 `.agent/`만 읽으면 재개할 수 있어야 한다.
- `HANDOFF.md`는 항상 **현재 상태만** 담는다. 매번 이어붙이지 말고 통째로
  다시 쓴다(overwrite). 과거 기록이 필요하면 git history나 `SESSION_LOG.md`
  (선택, 한 줄 로그)를 본다.
- `DECISIONS.md`는 **중요한 결정만** 남긴다 — 아키텍처·프레임워크/DB 선정·
  API 구조·권한/보안 정책·기능 범위 변경. 사소한 수정은 기록하지 않는다.
- 상태를 기록하는 사람이 아니라 **시스템**(git status/diff, 테스트 실행 결과)
  이어야 하는 정보는 절대 기억이나 추측으로 채우지 않는다 — 반드시 실제로
  명령을 실행해 그 출력을 근거로 쓴다.
- **`.agent/` 문서에 비밀정보를 남기지 않는다.** API 키·토큰·비밀번호·
  자격증명은 이 파일들이 git에 커밋될 수 있으므로 절대 값 그대로 적지 않는다.
  필요하면 값이 아니라 "어디에 있는지"만 적는다(예: "`.env`의 `STRIPE_KEY`
  참고").

## 디렉터리 구조

```
<project>/
  .agent/
    PROJECT_CONTEXT.md   # 거의 안 바뀌는 정보 (목표·아키텍처·제약)
    HANDOFF.md            # 지금 상태 스냅샷 (매 체크포인트마다 덮어씀)
    DECISIONS.md          # 중요한 설계 결정 로그 (DEC-* 누적)
    SESSION_LOG.md         # (선택) 체크포인트마다 한 줄 — 언제 무엇을 했는지
```

템플릿은 이 스킬의 `templates/PROJECT_CONTEXT.md`, `templates/HANDOFF.md`,
`templates/DECISIONS.md`에 있다. 실제 작업 디렉터리에 복사해 채운다.
`{{DATE}}` 같은 플레이스홀더는 실제 값으로 치환한다(날짜는 반드시 시스템
프롬프트의 오늘 날짜 또는 `date` 명령으로 확인 — 추측하지 않는다).

## 동작 1 — init (최초 설정)

새 프로젝트, 또는 아직 `.agent/`가 없는 기존 프로젝트에서 실행.

1. 현재 디렉터리가 어떤 프로젝트인지 확인한다(`git remote -v`, `README*`,
   `package.json`/`pyproject.toml`/`go.mod` 등).
2. `.agent/` 폴더를 만들고 템플릿 3종을 복사한다.
3. `PROJECT_CONTEXT.md`는 리포에서 뽑아낼 수 있는 만큼 초안을 채운다(Goal,
   Tech Stack, Directory Structure, Architecture는 README/코드 구조에서 추론).
   **Constraints·Agent Permissions·Definition of Done·Phases(각 phase의
   Exit Criteria 포함)는 추론하지 말고 사용자에게 직접 확인**한다 — 이
   항목들은 사고를 막는 안전장치이거나(Constraints/Permissions/DoD) 이후
   phase 자동 전환의 판단 근거(Phases의 Exit Criteria)로 그대로 쓰이므로
   잘못 추측하면 위험하다. 사용자가 아직 phase를 나눠본 적 없다면 Phases
   섹션은 비워두고, 나중에 필요할 때 채워도 된다고 안내한다.
4. `HANDOFF.md`는 비워둔 채로(또는 "아직 세션 없음"으로) 커밋하고, 첫 체크포인트
   때 채워진다.
5. `DECISIONS.md`는 지금까지 대화에서 이미 확정된 중요한 결정이 있으면
   DEC-001부터 채우고, 없으면 템플릿만 남긴다.
6. 사용자에게 초안을 보여주고 잘못된 추론이 있는지 확인받는다.

## 동작 2 — checkpoint (현재 상태 저장)

### 트리거

**자동 실행(승인 대기 없이 바로 함) — phase 전환.** 항상
`PROJECT_CONTEXT.md`의 `Phases` 로드맵과 `HANDOFF.md`의 `Current Phase`를
대조한다. 다음에 하려는 작업이 현재 phase의 Exit Criteria를 충족한 뒤 다음
phase(예: P2 → P3)에 속한다고 판단되면, **사용자에게 묻지 않고** 아래 절차를
먼저 실행해 끝난 phase 기준으로 체크포인트를 남기고 `Current Phase`를 갱신한
다음, 새 phase 작업을 시작한다. 실행은 자동이어도 결과는 반드시 짧게
보고한다 — 어떤 Exit Criteria가 충족됐다고 판단해 phase를 넘겼는지 근거를
포함해서. Exit Criteria가 모호해서 충족 여부를 판단할 수 없으면 자동 실행하지
않고 먼저 사용자에게 확인한다(추측으로 phase를 넘기지 않는다). `Phases`
로드맵 자체가 `PROJECT_CONTEXT.md`에 없는 프로젝트라면 이 자동 감지는 애초에
불가능하므로 아래 소프트 트리거로만 다룬다.

**제안(사용자 확인 필요) — 그 외.** 기능/작업 완료, 주요 설계 변경, 큰 오류
해결, 작업 분야 전환, 또는 현재 대화의 과거 내용 대부분이 지금 작업과
무관해졌을 때는 체크포인트를 제안하고, 사용자가 동의하거나 명시적으로
요청했을 때만 실행한다. **매 메시지마다 하지 않는다** — 의미 있는 매듭에서만.

### 절차
1. `.agent/`가 없으면 먼저 동작 1(init)부터 안내한다.
2. **시스템에서 직접 수집**(추측 금지):
   - `git status`
   - `git diff --stat` (필요하면 `git diff`로 상세도 확인)
   - `git log --oneline -10`
   - 알려진 테스트/빌드 명령이 있으면 실행 결과
3. 이번 세션(또는 이 대화)에서 실제로 한 일을 위 출력과 대조해 정리한다.
4. `HANDOFF.md`를 **처음부터 다시 써서** 아래 섹션을 채운다(템플릿 순서 그대로):
   Current Objective, Current Phase, Completed, Last Work, Current State
   (git status/diff 요약 포함), Open Issues, Important Decisions(관련 DEC-*
   링크만, 본문 복붙 금지), Failed Attempts, Relevant Files, Next Action,
   Definition of Done.
5. 이번 세션에서 아키텍처/프레임워크/DB/API/권한/보안/범위 급의 결정이
   있었다면 `DECISIONS.md`에 다음 번호로 `DEC-NNN` 항목을 추가한다. 판단이
   애매하면 "이걸로 가자", "X 대신 Y를 쓰기로 했다", "트레이드오프는 있지만
   감수한다" 같은 표현이 대화에 나왔는지가 신호다. **추가하기 전에 먼저
   `DECISIONS.md`를 훑어 같은 근본 이유의 결정이 이미 있는지 확인**한다 —
   있으면 새 DEC를 만들지 말고 기존 항목에 근거를 보태거나 링크한다(중복
   방지). 기존 항목 자체는 수정하지 말고, 뒤집힌 결정은 Status를 `Superseded
   by DEC-NNN`으로 바꾼다.
6. `Failed Attempts`는 "뭘 했는데 안 됐다" 수준으로 적지 않는다. 근본 원인과
   "다음에 [이런 신호]를 보면 [이렇게 한다]" 형태의 전이 가능한 문장을 반드시
   포함한다. 같은 근본 원인의 실패가 앞으로도 반복될 만한 패턴이면(일회성
   실수가 아니라면) `Failed Attempts`에만 적고 끝내지 말고 `DECISIONS.md`에도
   짧은 DEC 항목으로 남긴다 — `HANDOFF.md`는 다음 체크포인트에서 덮어써
   사라지지만 `DECISIONS.md`는 누적되므로, 반복될 패턴은 거기 남아야 다음
   세션에서도 잊히지 않는다.
7. (선택) `SESSION_LOG.md`에 한 줄만 append: `- {{DATE}}: <한 줄 요약>`.
   이 파일은 HANDOFF.md가 비대해지는 걸 막기 위한 것이므로 여러 줄로 늘어나게
   두되 HANDOFF.md 자체에는 과거 기록을 남기지 않는다.
8. 갱신된 HANDOFF.md 요지를 사용자에게 짧게 보고한다.

## 동작 3 — resume (다음 세션에서 재개)

새 채팅/새 세션에서 프로젝트 작업을 이어갈 때 실행.

1. `.agent/PROJECT_CONTEXT.md`, `.agent/HANDOFF.md` 읽기.
2. `HANDOFF.md`의 `Important Decisions`가 가리키는 `DEC-*` 항목만
   `DECISIONS.md`에서 찾아 읽는다(전체를 다 읽지 않는다).
3. `git status`, `git diff`, 현재 브랜치를 실제로 실행해 **문서와 실제 상태가
   일치하는지 대조**한다. 어긋나면(예: HANDOFF엔 없는 uncommitted 변경이 있음)
   먼저 사용자에게 알린다 — 조용히 무시하지 않는다.
4. `Relevant Files`에 적힌 파일만 필요 시 읽는다. 프로젝트 전체를 훑지 않는다.
5. `Next Action`부터 재개한다. 재개 직후 사용자에게 "지금 이해한 상태 +
   다음에 할 일"을 한 문단으로 요약해 확인받는다.

## 동작 4 — context (상태 요약 조회)

사람이 지금 에이전트가 이 프로젝트를 어떻게 이해하고 있는지 빠르게 확인하고
싶을 때. 파일을 고치지 않고 `.agent/` 내용을 근거로 아래만 짧게 출력한다:
Project · Current Phase · Current Objective · 현재 브랜치(`git branch
--show-current`) · Open Issues · Next Action.

## 하지 말아야 할 것

- **단순 요약만 쓰기**: "오늘 뭘 했고 다음엔 뭘 하면 된다" 수준의 뭉뚱그린
  문장 금지. 위 템플릿의 필수 필드(Current State, Failed Attempts, Next
  Action, Definition of Done)를 구체적으로 채운다.
- **대화 전체 복붙**: HANDOFF.md에 지난 대화 로그를 옮기지 않는다. 상태만.
- **HANDOFF.md에 과거 누적**: 매번 append하면 결국 다시 컨텍스트가 비대해진다.
  항상 덮어쓴다.
- **프로젝트 전체 파일을 한 번에 읽기**: resume 시 관련 파일만 골라 읽는다.
- **git 상태를 기억/추측으로 서술**: 반드시 명령을 실행해 확인한다.

## 관련 스킬

- 새 프로젝트를 기획하는 단계라면 이 스킬보다 먼저 `discovery-interview`로
  요구사항을 정리한다. 그 산출물(docs/*)은 `PROJECT_CONTEXT.md`의 Goal/
  Architecture를 채우는 근거가 된다.
