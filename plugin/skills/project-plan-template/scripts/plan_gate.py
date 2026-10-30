#!/usr/bin/env python3
"""기획서 게이트 점검. 사용: python3 plan_gate.py 기획서.md
- ★ 필수 절 존재 여부(제목에 절 이름 포함)
- 미체크 항목('- [ ]'), 가정 상태(⬜ 미확인 / 🟡 가정) 개수와 위치
- 사용자 가치 지표·사용자 검증·시나리오 언급 여부
필수 절이 없으면 종료 코드 1.
"""
import re, sys
REQUIRED = ["한 장 요약", "성공 기준", "검증 계획", "시나리오", "일정", "미결", "발표 역산"]
ALIASES = {"한 장 요약": ["한 장 요약", "요약"], "성공 기준": ["성공 기준", "성공기준"],
           "검증 계획": ["검증 계획", "검증계획"], "시나리오": ["시나리오"], "일정": ["일정"],
           "미결": ["미결", "범위 제외"], "발표 역산": ["발표 역산"]}
HINTS = {"사용자 가치 지표": ["가치 지표", "사용자 가치", "시간 절감"], "사용자(실사용) 검증": ["실사용", "실무자", "사용자 검증"],
         "문제 회수 시나리오": ["시나리오"],
         "도메인 이해(용어표·업무 흐름)": ["용어표", "도메인", "업무 흐름"],
         "WBS·역할(RACI)": ["WBS", "RACI"],
         "시간 예산(버퍼·포기 순서·확장 상한)": ["버퍼", "포기 순서", "확장 상한", "시간 예산"],
         "희소·경계 사례 평가(층화)": ["층화", "희소", "긴 꼬리"]}
if len(sys.argv) < 2: sys.exit(__doc__)
text = open(sys.argv[1], encoding="utf-8").read(); lines = text.split("\n")
heads = [l for l in lines if re.match(r"^#{1,4} ", l)]
print(f"파일: {sys.argv[1]} ({len(lines)}줄, 제목 {len(heads)}개)\n")
miss = []
print("## 필수 절")
for r in REQUIRED:
    ok = any(any(al in h for al in ALIASES[r]) for h in heads)
    print(f"  {'✅' if ok else '❌'} {r}"); 
    if not ok: miss.append(r)
print("\n## 내용 점검(본문 언급)")
for k, ws in HINTS.items():
    hit = [i+1 for i, l in enumerate(lines) if any(w in l for w in ws)]
    print(f"  {'✅' if hit else '⚠'} {k}: {('줄 ' + ', '.join(map(str, hit[:5]))) if hit else '언급 없음'}")
un = [(i+1, l.strip()) for i, l in enumerate(lines) if re.match(r"^\s*[-*] \[ \]", l)]
print(f"\n## 미체크 항목 {len(un)}개")
for n, l in un[:12]: print(f"  줄 {n}: {l[:90]}")
if len(un) > 12: print(f"  … 외 {len(un)-12}개")
st = {"⬜ 미확인": "⬜", "🟡 가정": "🟡"}
print("\n## 가정 상태")
for k, sym in st.items():
    c = sum(l.count(sym) for l in lines); print(f"  {k}: {c}곳")
print("\n처분 규칙: 미체크 항목은 일정 슬롯 / 범위 제외 / 후속 과제 중 하나로 '위험·미결·범위 제외 기록'에 올라 있어야 합니다.")
if miss: print(f"\n❌ 필수 절 누락: {', '.join(miss)}"); sys.exit(1)
print("\n✅ 필수 절 모두 있음")
