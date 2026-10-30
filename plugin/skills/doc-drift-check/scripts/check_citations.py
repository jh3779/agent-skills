#!/usr/bin/env python3
"""doc_drift_check — 마크다운 문서 안의 `file[:line[-line]]` 인용이 실제
코드베이스와 맞는지 결정론적으로 검사한다(LLM 호출 없음, 임베딩/색인 없음).
techne의 docsync 아이디어를 참고해 직접 구현 — 모호한 경로(어느 저장소의
파일인지 특정 안 됨)는 조용히 추측하지 않고 "확인 필요"로 따로 분리한다.

사용법:
  python3 check_citations.py <문서.md> --repo <경로> [--repo <경로> ...]

여러 --repo를 주면, 디렉터리 힌트 없는 바로(bare) 파일명(예: `bot.py:772`)은
모든 저장소를 뒤져 몇 군데서 매치되는지 본다 — 정확히 한 곳에서만 매치되면
그 파일 기준으로 줄 수를 확인하고, 여러 곳 또는 0곳이면 "확인 필요"로 분류.
"""
from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

# 백틱 안에서 "무언가.확장자[:숫자[-숫자]]" 패턴만 후보로 삼는다.
CITATION_RE = re.compile(
    r"`([\w./~-]+\.(?:py|ts|tsx|js|jsx|json|toml|ya?ml|md))(?::(\d+)(?:-(\d+))?)?`"
)
# 인용이 아닌 것으로 보이는 패턴(백업 파일, 글롭, 쉘 명령 조각)은 제외.
EXCLUDE_RE = re.compile(r"\.bak-|\*|\.\.\.|<|>|\$\(")


def find_citations(text: str):
    for m in CITATION_RE.finditer(text):
        if EXCLUDE_RE.search(m.group(0)):
            continue
        path, start, end = m.group(1), m.group(2), m.group(3)
        yield path, (int(start) if start else None), (int(end) if end else None), m.start()


def line_number_of(text: str, pos: int) -> int:
    return text.count("\n", 0, pos) + 1


def resolve(path_str: str, repos: list[Path]) -> list[Path]:
    p = Path(path_str).expanduser()
    # "/작업지시.md"처럼 슬래시 커맨드를 가리키는 표기(경로 구분자가 하나뿐이고
    # 맨 앞에만 있는 경우)는 실제 파일시스템 절대경로가 아니다 — 진짜 절대경로는
    # /Users/... 처럼 세그먼트가 최소 2개 이상이다.
    if p.is_absolute() and len(p.parts) > 2:
        return [p] if p.exists() else []
    if "/" in path_str and not path_str.startswith("/"):
        return [r / p for r in repos if (r / p).exists()]
    bare = path_str.lstrip("/")  # "/작업지시.md" → "작업지시.md"로 바로 파일명 검색
    hits: list[Path] = []
    for r in repos:
        if not r.exists():
            continue
        hits.extend(
            x for x in r.rglob(bare)
            if ".venv" not in x.parts and "node_modules" not in x.parts
            and "__pycache__" not in x.parts
        )
    return hits


def check(doc_path: Path, repos: list[Path]):
    text = doc_path.read_text(encoding="utf-8", errors="replace")
    ok, broken, ambiguous = [], [], []
    for path_str, start, end, pos in find_citations(text):
        doc_line = line_number_of(text, pos)
        matches = resolve(path_str, repos)
        if len(matches) == 0:
            broken.append((doc_line, path_str, start, end, "일치하는 파일을 못 찾음"))
            continue
        if len(matches) > 1:
            ambiguous.append((doc_line, path_str, start, end, matches))
            continue
        target = matches[0]
        if start is None:
            ok.append((doc_line, path_str, None, None))
            continue
        try:
            n_lines = sum(1 for _ in target.open(encoding="utf-8", errors="replace"))
        except OSError as e:
            broken.append((doc_line, path_str, start, end, f"파일 열기 실패: {e!r}"))
            continue
        check_line = end or start
        if check_line > n_lines:
            broken.append((doc_line, path_str, start, end,
                          f"파일은 {n_lines}줄뿐인데 {check_line}줄을 인용함 → {target}"))
        else:
            ok.append((doc_line, path_str, start, end))
    return ok, broken, ambiguous


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("doc", type=Path, help="검사할 마크다운 문서")
    ap.add_argument("--repo", action="append", dest="repos", default=[],
                    help="검색 대상 저장소 루트(여러 번 지정 가능)")
    args = ap.parse_args()

    if not args.repos:
        print("⚠️ --repo를 최소 1개 이상 지정해야 합니다.", file=sys.stderr)
        sys.exit(2)

    repos = [Path(r).expanduser().resolve() for r in args.repos]
    ok, broken, ambiguous = check(args.doc, repos)

    print(f"# 문서 인용 검사 — {args.doc}\n")
    print(f"✅ 정상: {len(ok)}건 / ⚠️ 깨짐: {len(broken)}건 / ❓ 모호(확인 필요): {len(ambiguous)}건\n")

    if broken:
        print("## ⚠️ 깨진 인용")
        for doc_line, path_str, start, end, reason in broken:
            loc = f"{path_str}" + (f":{start}" + (f"-{end}" if end else "") if start else "")
            print(f"- 문서 {doc_line}행: `{loc}` — {reason}")
        print()

    if ambiguous:
        print("## ❓ 모호함(사람/에이전트 확인 필요 — 여러 저장소에서 매치됨)")
        for doc_line, path_str, start, end, matches in ambiguous:
            loc = f"{path_str}" + (f":{start}" + (f"-{end}" if end else "") if start else "")
            print(f"- 문서 {doc_line}행: `{loc}` — 후보 {len(matches)}개:")
            for m in matches:
                print(f"    - {m}")
        print()

    if not broken and not ambiguous:
        print("모든 인용이 확인 가능한 범위에서 정상입니다.")

    sys.exit(1 if broken else 0)


if __name__ == "__main__":
    main()
