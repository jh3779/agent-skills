#!/usr/bin/env python3
"""대본 마크다운에서 '### 번호. 제목 (m:ss)' 장별 글자 수(공백 제외)와 말하기 시간(280자/분)을 계산한다.
사용: python3 script_time.py 발표대본.md [--cpm 280] [--limit 20:00]
"""
import re, sys, argparse

def mmss(sec): sec = int(round(sec)); return f"{sec//60}:{sec%60:02d}"
def parse(t):
    m, s = t.split(":"); return int(m)*60+int(s)

ap = argparse.ArgumentParser(); ap.add_argument("md"); ap.add_argument("--cpm", type=int, default=280); ap.add_argument("--limit")
a = ap.parse_args()
text = open(a.md, encoding="utf-8").read()
parts = re.split(r"^### ", text, flags=re.M)[1:]
rows = []; total_alloc = 0; total_speak = 0
for p in parts:
    head, _, body = p.partition("\n")
    m = re.search(r"\((\d+:\d{2})\)\s*$", head)
    if not m: continue
    body = re.split(r"^(?:## |---)", body, flags=re.M)[0]
    body = re.sub(r"\*\(메모:.*?\)\*", "", body, flags=re.S)
    chars = len(re.sub(r"\s", "", body))
    alloc = parse(m.group(1)); speak = chars / a.cpm * 60
    rows.append((head, chars, alloc, speak)); total_alloc += alloc; total_speak += speak
for head, chars, alloc, speak in rows:
    print(f"{head:<48} {chars:>5}자  배정 {mmss(alloc)}  말하기 {mmss(speak)}")
print(f"\n합계: {sum(r[1] for r in rows)}자 · 배정 {mmss(total_alloc)} · 말하기 {mmss(total_speak)}")
if a.limit:
    lim = parse(a.limit)
    flag = "⚠ 한도의 90% 초과" if total_speak > lim*0.9 else "OK"
    print(f"한도 {a.limit}: {flag} (여유 {mmss(max(lim-total_speak,0))})")
