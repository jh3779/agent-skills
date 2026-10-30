# cognitive-teacher 작성 가이드

content.html은 템플릿 `<div class="sheet">` 안에 삽입될 **조각**이다. `<html>/<head>/<body>` 래퍼를 쓰지 않는다. 완성 예시: `samples/content.sample.html`.

## 문서 순서 (교수 원칙 — 이 순서를 지킨다)

1. **학습지 헤더** — `.exam-header`: `.exam-meta`(과목·단원·예상 학습·날짜·이름 빈칸) + `.exam-title`(h1, `.subtitle` 포함 가능) + `.goals-label`+`.goals`(체크박스 학습 목표 2~4개. 목표는 "~를 말할 수 있다/설명할 수 있다" 형태)
2. **배경** `data-kind="background"` — 변경/주제 **이전에** 알아야 할 시스템 동작부터. 독자가 알 수도 있는 부분은 `details.bg`(+`.bg-body`)로 접는다.
3. **직관** `data-kind="intuition"` (**필수**) — 본질을 한 문단으로. 핵심 문장 1~2개에만 `<mark>`(형광펜). 비유·예시를 곁들이고, `.key-box`로 핵심 정리(불릿 2~4개). 보충은 `.side-note`(파란펜).
4. **인터랙티브 피규어** `data-kind="figure"` (0~N개) — `.figure`(모눈 배경) 안에 `figcaption`+조작 UI. **절제할 것**: 정적 그림·표로 충분하면 만들지 않는다. 인터랙션이 이해를 실제로 돕는 경우(상태 변화·시간 진행·파라미터 민감도)에만. inline `<script>` 허용, 외부 네트워크 요청 금지.
5. **Literate walk-through** `data-kind="walkthrough"` — 파일 나열이 아니라 **서사 순서**로. 각 코드 블록 앞에 "왜 이걸 지금 읽는지" 산문을 둔다. diff는 `.code-walk`>`.code-file`(경로)+`pre.diff`(`.hunk`/`.ln`/`.add`/`.del` span). 주제 모드는 코드 경로를 `파일:줄` 텍스트로 표기.
6. **다이어그램** — `<pre class="mermaid">` (테마는 템플릿이 통일). 손 SVG 금지.
   **표**는 일반 `<table>`(`thead`/`tbody` + `th`/`td`)로 쓰면 템플릿이 본문 폭에 맞춰 조판한다. 열이 5개를 넘어 넘칠 수 있으면 `<div class="table-wrap">`로 감싼다.
7. **퀴즈** `data-kind="quiz"` (**필수**) — 섹션에는 chapter-tab+h2+`.quiz-intro`만 두고 **문항 마크업을 직접 쓰지 않는다**. 문항은 `<script type="application/json" id="quiz-data">`에 JSON으로:
   `[{ "question", "options"(2~6개), "answerIndex"(0-base), "explanation"(해설 — 정답의 이유 + 관련 섹션 참조) }]`
   실전 문서는 **5문항 내외, 중간 난이도** — 본문을 안 읽으면 못 맞히되 억지 함정은 없게. 오답 선택지는 그럴듯한 오개념에서 가져온다.

## 챕터 공통 마크업

```html
<section class="chapter" data-kind="...">
  <div class="chapter-tab">N</div>
  <h2><span class="eyebrow">배경|직관|직접 돌려보기|코드 읽기|확인 문제</span>제목</h2>
  ...
</section>
```

## 규칙

- 근거 없는 서술 금지 — diff 모드는 수집한 변경만, 주제 모드는 읽은 코드·문서만
- 시크릿 마스킹, diff 과대 시 "축약됨" 표기
- 외부 리소스 로드 금지 (assemble이 `script`/`img`/`iframe`/`link` 에 한해 에러로 막는다). 외부 `<a href>` 링크는 허용
- assemble은 정규식 파싱이다 — 섹션 태그·quiz-data 블록을 주석 처리하거나 문자열 안에 흉내내지 말 것
- `<h1>`은 exam-header 안에 정확히 1개만 — assemble이 첫 h1 텍스트를 문서 `<title>`로 추출한다. 본문 섹션에 h1을 쓰지 말 것
- h1의 `.subtitle`은 짧게 — h1 전체 텍스트가 브라우저 탭 제목이 된다
- 콘텐츠에 `<!--CT:` 로 시작하는 주석(템플릿 슬롯 마커 문법)을 절대 넣지 말 것 — 조립 검증이 오작동한다
- 이미지·스크립트 등 리소스 참조(src/href/srcset)를 콘텐츠에 넣지 않는다 — 부득이한 이미지는 data: URI만 (assemble은 `script`/`img`/`iframe`/`link` 만 검사한다 — `video`/`object`/CSS `url()` 은 안 걸리니 스스로 지킬 것)
- 레포 안의 md 문서(README/개요 문서)는 단독 근거가 될 수 없다 — 문서와 코드가 다르면 **코드가 정본**이다. 문서 유래 주장은 코드로 교차 확인하고, 문서가 낡았으면 그 사실을 본문에 밝힌다
- "하드 리밋"·"차단"·"강제"·"보장" 같은 집행 단어는 **집행 코드의 `파일:줄`과 함께**만 쓴다 — 근거가 정책 선언(문서·주석·상수 정의)뿐이면 "선언 / soft gate / 미배선"으로 구분해 쓴다
- 인용은 주장 단위로 — 여러 위치에서 확인한 사실을 한 문장에 합치면 위치별로 나눠 인용한다 (뭉친 인용 범위는 검증 패스를 통과하지 못한다)
