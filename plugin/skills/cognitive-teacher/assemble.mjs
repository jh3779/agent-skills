#!/usr/bin/env node
// cognitive-teacher 조립기 — 콘텐츠 조각 + 템플릿 + (조건부) mermaid → self-contained HTML.
// 외부 의존성 0. 콘텐츠 형식이 통제되므로 정규식 파싱으로 충분하다 (한계: references/writing-guide.md 참조).
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname, resolve, sep } from 'node:path';
import { homedir } from 'node:os';
import { fileURLToPath } from 'node:url';

const SKILL_DIR = dirname(fileURLToPath(import.meta.url));
const OUT_DIR_ENV = 'COGNITIVE_TEACHER_OUT_DIR';
const DEFAULT_OUT_SUBDIR = 'claude-lessons';
const USAGE = 'Usage: node assemble.mjs <content.html> --slug <slug>  |  node assemble.mjs <content.html> <output.html>';
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function fail(msg) {
  process.stderr.write(`[assemble] ERROR: ${msg}\n`);
  process.exit(1);
}

function usageFail(msg) {
  fail(`${msg} — ${USAGE}`);
}

// 셸이 대신 확장해주지 않는 ~ 를 직접 확장한다 (Windows 셸은 ~ 를 리터럴로 넘긴다)
function expandHome(p) {
  if (p === '~') return homedir();
  if (p.startsWith('~/') || p.startsWith(`~${sep}`)) return join(homedir(), p.slice(2));
  return p;
}

// 출력 폴더 결정 (OS 무관 동일 규칙): $COGNITIVE_TEACHER_OUT_DIR → <home>/claude-lessons
function outputDir() {
  const override = (process.env[OUT_DIR_ENV] || '').trim();
  return override ? resolve(expandHome(override)) : join(homedir(), DEFAULT_OUT_SUBDIR);
}

function todayStamp() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

// ── 인자 파싱 ─────────────────────────────────────────────────
// node assemble.mjs <content.html> --slug <slug>     → 출력 경로를 스크립트가 계산 (권장)
// node assemble.mjs <content.html> <output.html>     → 출력 경로 직접 지정
const argv = process.argv.slice(2);
let contentArg = null;
let outArg = null;
let slug = null;
for (let i = 0; i < argv.length; i += 1) {
  const a = argv[i];
  if (a === '--slug') {
    slug = argv[i + 1];
    i += 1;
    if (slug === undefined) usageFail('--slug 값 누락');
  } else if (a.startsWith('--slug=')) {
    slug = a.slice('--slug='.length);
  } else if (a.startsWith('--')) {
    usageFail(`알 수 없는 옵션: ${a}`);
  } else if (contentArg === null) {
    contentArg = a;
  } else if (outArg === null) {
    outArg = a;
  } else {
    usageFail(`인자 과다: ${a}`);
  }
}
if (!contentArg) usageFail('인자 부족');
if (slug !== null && outArg !== null) usageFail('--slug 와 출력 경로는 함께 쓸 수 없다 — 하나만 지정');
if (slug === null && outArg === null) usageFail('인자 부족');

let outFile;
if (slug !== null) {
  if (!SLUG_RE.test(slug)) {
    fail(`slug 형식 오류: "${slug}" — 소문자 영숫자와 하이픈만 허용 (예: batch-worker-retry)`);
  }
  outFile = join(outputDir(), `${todayStamp()}-${slug}-lesson.html`);
} else {
  outFile = resolve(expandHome(outArg));
}

let content;
try {
  content = readFileSync(resolve(expandHome(contentArg)), 'utf8');
} catch {
  fail(`콘텐츠 파일을 읽을 수 없음: ${contentArg}`);
}

// ── 검증 1: 필수 섹션 ──────────────────────────────────────────
for (const kind of ['intuition', 'quiz']) {
  if (!new RegExp(`<section[^>]+data-kind="${kind}"`).test(content)) {
    fail(`필수 섹션 누락: section[data-kind="${kind}"]`);
  }
}

// ── 검증 2: quiz-data JSON ────────────────────────────────────
const quizMatch = content.match(
  /<script[^>]+type="application\/json"[^>]+id="quiz-data"[^>]*>([\s\S]*?)<\/script>/
) || content.match(
  /<script[^>]+id="quiz-data"[^>]+type="application\/json"[^>]*>([\s\S]*?)<\/script>/
);
if (!quizMatch) fail('quiz-data 블록 누락: <script type="application/json" id="quiz-data">');
if (/<\s*\/\s*script/i.test(quizMatch[1])) {
  fail('quiz-data 안에 </script> 시퀀스 금지 — 브라우저가 요소를 조기 종료한다. JSON 문자열에서는 <\\/script> 로 이스케이프할 것');
}
let quiz;
try {
  quiz = JSON.parse(quizMatch[1]);
} catch (e) {
  fail(`quiz-data JSON 파싱 실패: ${e.message}`);
}
if (!Array.isArray(quiz) || quiz.length < 1) fail('quiz-data는 1개 이상의 문항 배열이어야 함');
quiz.forEach((q, i) => {
  if (typeof q !== 'object' || q === null || Array.isArray(q)) fail(`문항 ${i + 1}: 객체가 아님`);
  if (typeof q.question !== 'string' || !q.question) fail(`문항 ${i + 1}: question 누락`);
  if (!Array.isArray(q.options) || q.options.length < 2 || q.options.length > 6) fail(`문항 ${i + 1}: options는 2~6개`);
  if (q.options.some((o) => typeof o !== 'string' || !o)) fail(`문항 ${i + 1}: options는 비어있지 않은 문자열이어야 함`);
  if (!Number.isInteger(q.answerIndex) || q.answerIndex < 0 || q.answerIndex >= q.options.length) {
    fail(`문항 ${i + 1}: answerIndex가 options 범위 밖`);
  }
  if (typeof q.explanation !== 'string' || !q.explanation) fail(`문항 ${i + 1}: explanation 누락`);
});

// ── 검증 3: 리소스 참조 금지 (self-contained — a href 는 허용) ─────────
// script/img/iframe/link 태그는 어떤 src/href/srcset 참조도 금지 (data: URI, # 앵커만 예외).
// 상대 경로·entity-encoded URL·srcset 도 전부 걸리도록 "값의 형태"가 아니라 "참조의 존재"를 검사한다.
// 태그 속성부는 인용된 문자열을 통째로 소비해 속성값 안의 '>' 에 끊기지 않게 한다.
const TAG_RE = /<(script|img|iframe|link)\b((?:"[^"]*"|'[^']*'|[^>"'])*)>/gi;
const REF_ATTR_RE = /\b(src|href|srcset)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/gi;
let tagMatch;
while ((tagMatch = TAG_RE.exec(content)) !== null) {
  const attrs = tagMatch[2];
  REF_ATTR_RE.lastIndex = 0;
  let attrMatch;
  while ((attrMatch = REF_ATTR_RE.exec(attrs)) !== null) {
    const value = (attrMatch[2] ?? attrMatch[3] ?? attrMatch[4] ?? '').trim();
    if (!/^data:/i.test(value) && !value.startsWith('#')) {
      fail(`external/relative resource 금지 (self-contained): <${tagMatch[1].toLowerCase()} ${attrMatch[1]}="${value.slice(0, 60)}"> — data: URI 외 참조 불가`);
    }
  }
}

// ── 조립 ─────────────────────────────────────────────────────
let template;
try {
  template = readFileSync(join(SKILL_DIR, 'template.html'), 'utf8');
} catch {
  fail('template.html을 찾을 수 없음 (스킬 설치 손상)');
}

// 제목: 콘텐츠 첫 h1의 텍스트 (태그 제거) → 없으면 기본값
const h1 = content.match(/<h1[^>]*>([\s\S]*?)<\/h1>/);
const title = h1
  ? h1[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  : 'cognitive-teacher lesson';

// mermaid: 콘텐츠에 class="mermaid"가 있을 때만 인라인 (라이브러리가 커서 조건부)
let mermaidBlock = '';
if (/class="[^"]*\bmermaid\b[^"]*"/.test(content)) {
  let lib;
  try {
    lib = readFileSync(join(SKILL_DIR, 'assets', 'mermaid.min.js'), 'utf8');
  } catch {
    fail('assets/mermaid.min.js를 찾을 수 없음 (mermaid 다이어그램을 쓰려면 필요)');
  }
  mermaidBlock = `<script>${lib}\n</script>`;
}

const out = template
  .replace('<!--CT:TITLE-->', () => title)
  .replace('<!--CT:CONTENT-->', () => content)
  .replace('<!--CT:MERMAID-->', () => mermaidBlock);

if (out.includes('<!--CT:')) fail('템플릿 슬롯 치환 실패 — template.html의 슬롯 주석 확인');

try {
  mkdirSync(dirname(outFile), { recursive: true });
  writeFileSync(outFile, out, 'utf8');
} catch (e) {
  fail(`출력 파일 쓰기 실패: ${outFile} — ${e.message}`);
}
process.stdout.write(`${outFile}\n`);
