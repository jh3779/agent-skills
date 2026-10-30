import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const SKILL_DIR = dirname(dirname(fileURLToPath(import.meta.url)));
const ASSEMBLE = join(SKILL_DIR, 'assemble.mjs');

const VALID_QUIZ = JSON.stringify([
  { question: 'Q1?', options: ['a', 'b', 'c'], answerIndex: 1, explanation: 'b이다' },
]);

function makeContent({ intuition = true, quiz = true, quizJson = VALID_QUIZ, extra = '' } = {}) {
  return [
    '<header class="exam-header"><h1 class="exam-title">테스트 단원</h1></header>',
    intuition ? '<section class="chapter" data-kind="intuition"><p>본질</p></section>' : '',
    quiz ? `<section class="chapter" data-kind="quiz"></section>\n<script type="application/json" id="quiz-data">${quizJson}</script>` : '',
    extra,
  ].join('\n');
}

function run(contentStr) {
  const dir = mkdtempSync(join(tmpdir(), 'ct-test-'));
  const contentPath = join(dir, 'content.html');
  const outPath = join(dir, 'out.html');
  writeFileSync(contentPath, contentStr, 'utf8');
  try {
    const stdout = execFileSync('node', [ASSEMBLE, contentPath, outPath], { encoding: 'utf8' });
    return { code: 0, stdout, stderr: '', outPath };
  } catch (e) {
    return { code: e.status, stdout: String(e.stdout), stderr: String(e.stderr), outPath };
  }
}

test('정상 콘텐츠 → 조립 성공, 슬롯 잔재 없음, 제목 추출', () => {
  const r = run(makeContent());
  assert.equal(r.code, 0);
  assert.ok(existsSync(r.outPath));
  const out = readFileSync(r.outPath, 'utf8');
  assert.ok(!out.includes('<!--CT:'), '슬롯 주석이 남아 있으면 안 된다');
  assert.ok(out.includes('<title>테스트 단원</title>'));
  assert.ok(out.includes('quiz-data'));
});

test('직관 섹션 누락 → exit 1', () => {
  const r = run(makeContent({ intuition: false }));
  assert.equal(r.code, 1);
  assert.match(r.stderr, /intuition/);
});

test('퀴즈 섹션 누락 → exit 1', () => {
  const r = run(makeContent({ quiz: false }));
  assert.equal(r.code, 1);
  assert.match(r.stderr, /quiz/);
});

test('quiz-data JSON 파싱 불가 → exit 1', () => {
  const r = run(makeContent({ quizJson: '{broken' }));
  assert.equal(r.code, 1);
  assert.match(r.stderr, /quiz-data/);
});

test('answerIndex 범위 밖 → exit 1', () => {
  const bad = JSON.stringify([{ question: 'q', options: ['a', 'b'], answerIndex: 5, explanation: 'e' }]);
  const r = run(makeContent({ quizJson: bad }));
  assert.equal(r.code, 1);
  assert.match(r.stderr, /answerIndex/);
});

test('외부 script src → exit 1 (self-contained 강제)', () => {
  const r = run(makeContent({ extra: '<script src="https://evil.example/x.js"></script>' }));
  assert.equal(r.code, 1);
  assert.match(r.stderr, /external/i);
});

test('외부 script src — 인용부호 없는 값도 차단', () => {
  const r = run(makeContent({ extra: '<script src=https://evil.example/x.js></script>' }));
  assert.equal(r.code, 1);
  assert.match(r.stderr, /external/i);
});

test('외부 script src — protocol-relative(//)도 차단', () => {
  const r = run(makeContent({ extra: '<script src="//evil.example/x.js"></script>' }));
  assert.equal(r.code, 1);
  assert.match(r.stderr, /external/i);
});

test('외부 script src — 앞선 속성값 안의 ">" 로 정규식 우회 시도해도 차단', () => {
  const r = run(makeContent({ extra: '<script data-note="1 > 2" src="https://evil.example/x.js"></script>' }));
  assert.equal(r.code, 1);
  assert.match(r.stderr, /external/i);
});

test('외부 a href 링크는 허용', () => {
  const r = run(makeContent({ extra: '<p><a href="https://github.com/x">문서</a></p>' }));
  assert.equal(r.code, 0);
});

test('mermaid 있으면 라이브러리 인라인, 없으면 미포함', () => {
  const withM = run(makeContent({ extra: '<pre class="mermaid">graph LR; A-->B</pre>' }));
  assert.equal(withM.code, 0);
  const withSize = readFileSync(withM.outPath, 'utf8').length;
  const withoutM = run(makeContent());
  const withoutSize = readFileSync(withoutM.outPath, 'utf8').length;
  assert.ok(withSize - withoutSize > 500_000, 'mermaid 라이브러리가 인라인되어야 함');
});

test('콘텐츠에 $&/$\' 같은 치환 특수 패턴 리터럴이 있어도 조립 성공 + 원문 보존', () => {
  const literal = '정규식 치환 $& 리터럴과 $\' 패턴';
  const r = run(makeContent({ extra: `<p>${literal}</p>` }));
  assert.equal(r.code, 0);
  const out = readFileSync(r.outPath, 'utf8');
  assert.ok(out.includes(literal), '치환 특수 패턴이 해석되지 않고 원문 그대로 보존되어야 함');
  assert.ok(!out.includes('<!--CT:'), '슬롯 주석이 남아 있으면 안 된다');
});

test('동봉 샘플 콘텐츠가 조립에 성공한다', () => {
  const samplePath = join(SKILL_DIR, 'samples', 'content.sample.html');
  const dir = mkdtempSync(join(tmpdir(), 'ct-test-'));
  const outPath = join(dir, 'sample-out.html');
  const stdout = execFileSync('node', [ASSEMBLE, samplePath, outPath], { encoding: 'utf8' });
  assert.ok(stdout.trim().endsWith('sample-out.html'));
  const out = readFileSync(outPath, 'utf8');
  assert.ok(out.includes('data-kind="figure"'));
  assert.ok(!out.includes('<!--CT:'));
});

test('인자 부족 → exit 1 + 사용법', () => {
  try {
    execFileSync('node', [ASSEMBLE], { encoding: 'utf8' });
    assert.fail('exit 0이면 안 된다');
  } catch (e) {
    assert.equal(e.status, 1);
    assert.match(String(e.stderr), /Usage/);
    assert.match(String(e.stderr), /\[assemble\] ERROR:/);
  }
});

test('상대 경로 img src → exit 1 (참조 자체 차단)', () => {
  const r = run(makeContent({ extra: '<img src="images/foo.png">' }));
  assert.equal(r.code, 1);
  assert.match(r.stderr, /external/i);
});

test('entity-encoded URL src → exit 1', () => {
  const r = run(makeContent({ extra: '<script src="&#104;ttps://evil.example/x.js"></script>' }));
  assert.equal(r.code, 1);
});

test('srcset 외부 참조 → exit 1', () => {
  const r = run(makeContent({ extra: '<img srcset="https://evil.example/x.png 1x">' }));
  assert.equal(r.code, 1);
});

test('img data: URI는 허용', () => {
  const r = run(makeContent({ extra: '<img src="data:image/png;base64,iVBORw0KGgo=" alt="">' }));
  assert.equal(r.code, 0);
});

test('quiz-data 내 </SCRIPT > 차단 (조기 종료 방지)', () => {
  const bad = JSON.stringify([
    { question: 'q', options: ['a', '</SCRIPT >'], answerIndex: 0, explanation: 'e' },
  ]);
  const r = run(makeContent({ quizJson: bad }));
  assert.equal(r.code, 1);
  assert.match(r.stderr, /script/i);
});

test('quiz-data에 null 문항 → exit 1', () => {
  const r = run(makeContent({ quizJson: '[null]' }));
  assert.equal(r.code, 1);
  assert.match(r.stderr, /객체가 아님/);
});

test('options 7개 → exit 1 (2~6개 제한)', () => {
  const bad = JSON.stringify([
    { question: 'q', options: ['a', 'b', 'c', 'd', 'e', 'f', 'g'], answerIndex: 0, explanation: 'e' },
  ]);
  const r = run(makeContent({ quizJson: bad }));
  assert.equal(r.code, 1);
  assert.match(r.stderr, /2~6개/);
});

test('options에 비문자열 값 → exit 1', () => {
  const bad = JSON.stringify([
    { question: 'q', options: ['a', 3], answerIndex: 0, explanation: 'e' },
  ]);
  const r = run(makeContent({ quizJson: bad }));
  assert.equal(r.code, 1);
  assert.match(r.stderr, /문자열/);
});

// ── 출력 경로 해석 (크로스플랫폼) ────────────────────────────────
import { basename } from 'node:path';

// 실제 홈 디렉토리를 건드리지 않기 위해 자식 프로세스의 홈을 temp 로 덮어쓴다.
// (node os.homedir() 는 Windows 에서 USERPROFILE, POSIX 에서 HOME 을 본다)
function runArgs(args, env = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'ct-test-'));
  const fakeHome = mkdtempSync(join(tmpdir(), 'ct-home-'));
  const contentPath = join(dir, 'content.html');
  writeFileSync(contentPath, makeContent(), 'utf8');
  const childEnv = { ...process.env, HOME: fakeHome, USERPROFILE: fakeHome };
  delete childEnv.COGNITIVE_TEACHER_OUT_DIR;
  try {
    const stdout = execFileSync('node', [ASSEMBLE, contentPath, ...args], {
      encoding: 'utf8',
      env: { ...childEnv, ...env },
      cwd: dir,
    });
    return { code: 0, stdout, stderr: '', dir, fakeHome };
  } catch (e) {
    return { code: e.status, stdout: String(e.stdout), stderr: String(e.stderr), dir, fakeHome };
  }
}

test('--slug: 기본 출력 위치는 <home>/claude-lessons/<날짜>-<slug>-lesson.html', () => {
  const r = runArgs(['--slug', 'batch-worker-retry']);
  assert.equal(r.code, 0, r.stderr);
  const out = r.stdout.trim();
  assert.equal(dirname(out), join(r.fakeHome, 'claude-lessons'));
  assert.match(basename(out), /^\d{4}-\d{2}-\d{2}-batch-worker-retry-lesson\.html$/);
  assert.ok(existsSync(out), '출력 폴더가 없어도 만들어서 써야 한다');
});

test('--slug: COGNITIVE_TEACHER_OUT_DIR 로 출력 폴더 override', () => {
  const target = mkdtempSync(join(tmpdir(), 'ct-out-'));
  const r = runArgs(['--slug', 'x'], { COGNITIVE_TEACHER_OUT_DIR: join(target, 'nested') });
  assert.equal(r.code, 0, r.stderr);
  assert.equal(dirname(r.stdout.trim()), join(target, 'nested'));
  assert.ok(existsSync(r.stdout.trim()));
});

test('--slug: 빈/공백 override 는 무시하고 기본 위치로 폴백', () => {
  const r = runArgs(['--slug', 'x'], { COGNITIVE_TEACHER_OUT_DIR: '   ' });
  assert.equal(r.code, 0, r.stderr);
  assert.equal(dirname(r.stdout.trim()), join(r.fakeHome, 'claude-lessons'));
});

test('--slug: override 경로의 ~ 도 홈으로 확장', () => {
  const r = runArgs(['--slug', 'x'], { COGNITIVE_TEACHER_OUT_DIR: '~/lessons-here' });
  assert.equal(r.code, 0, r.stderr);
  assert.equal(dirname(r.stdout.trim()), join(r.fakeHome, 'lessons-here'));
});

test('--slug: 경로 이스케이프 시도 → exit 1', () => {
  const r = runArgs(['--slug', '../../etc/passwd']);
  assert.equal(r.code, 1);
  assert.match(r.stderr, /slug/i);
});

test('--slug: 공백·대문자 등 형식 위반 → exit 1', () => {
  const r = runArgs(['--slug', 'Bad Slug']);
  assert.equal(r.code, 1);
  assert.match(r.stderr, /slug/i);
});

test('--slug 값 누락 → exit 1 + 사용법', () => {
  const r = runArgs(['--slug']);
  assert.equal(r.code, 1);
  assert.match(r.stderr, /Usage/);
});

test('--slug 와 출력 경로 동시 지정 → exit 1', () => {
  const r = runArgs(['--slug', 'x', 'out.html']);
  assert.equal(r.code, 1);
  assert.match(r.stderr, /slug/i);
});

test('알 수 없는 옵션 → exit 1 + 사용법', () => {
  const r = runArgs(['--nope']);
  assert.equal(r.code, 1);
  assert.match(r.stderr, /Usage/);
});

test('명시 출력 경로의 ~ 도 홈으로 확장 (Windows 셸은 ~ 를 확장하지 않는다)', () => {
  const r = runArgs(['~/sub/out.html']);
  assert.equal(r.code, 0, r.stderr);
  assert.equal(r.stdout.trim(), join(r.fakeHome, 'sub', 'out.html'));
  assert.ok(existsSync(r.stdout.trim()));
});
