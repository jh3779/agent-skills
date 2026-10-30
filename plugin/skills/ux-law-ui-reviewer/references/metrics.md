# 근거 있는 수치 기준

> SKILL.md 부록 B와 같은 내용. 고치면 양쪽을 함께 맞춘다.

수치를 쓸 땐 아래처럼 출처를 함께 적는다. 목록에 없는 수치는 "경험칙"으로 표기.

| 항목 | 기준 | 출처 |
|---|---|---|
| 터치 목표 최소(iOS) | 44×44 pt | Apple Human Interface Guidelines |
| 터치 목표 최소(Android) | 48×48 dp | Material Design / Android 접근성 가이드 |
| 포인터 목표 최소(웹, AA) | 24×24 CSS px (또는 24px 원형 간격 확보) | WCAG 2.2 SC 2.5.8 Target Size (Minimum) |
| 포인터 목표 권장(웹, AAA) | 44×44 CSS px | WCAG 2.2 SC 2.5.5 Target Size (Enhanced) |
| 본문 텍스트 대비 | 4.5:1 이상 (큰 글자 3:1) | WCAG SC 1.4.3 |
| UI 컴포넌트·그래픽 대비 | 3:1 이상 | WCAG SC 1.4.11 |
| 키보드 포커스 표시 | 보여야 함 | WCAG SC 2.4.7 |
| 색만으로 정보 전달 금지 | 형태·텍스트 병기 | WCAG SC 1.4.1 |
| 폼에서 같은 정보 재입력 금지 | 이미 받은 정보는 다시 묻지 않음 | WCAG 2.2 SC 3.3.7 Redundant Entry |
| 모달 키보드 탈출 | Esc 또는 닫기 버튼으로 반드시 나갈 수 있어야 함 | WCAG SC 2.1.2 No Keyboard Trap |

> 웹 터치 영역은 24px(AA)을 **하한**, 44px(HIG·AAA)를 **권장**으로 구분해 쓴다. 24~44px 구간은 "AA 통과, 권장 미달"로 적는다. 실무에서 흔히 쓰는 40px 하한은 출처 없는 경험칙이므로 "경험칙"으로 표기한다.
