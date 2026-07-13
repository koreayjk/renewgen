/* global window */
// ──────────────────────────────────────────────────────────────────
//  선생님(Teacher) 데이터 — 담당 학급 학생 명단 + 학습 지표
//   · 출결·참여도는 ClassIn(Attendance / Data Subscription)에서 동기화되는 값을 모델링
//   · 과제·시험은 우리 홈페이지 시스템의 집계
//   · 데모: 결정적(seed) 데이터. 실서버에선 ClassIn API + Supabase 집계로 대체
// ──────────────────────────────────────────────────────────────────

// 선생님이 맡은 반(클래스) — ClassIn Classroom API 의 수업(class)과 1:1 동기화
//   ClassIn 에서 "1~10번 학생 = 고등수학 A반" 으로 묶은 게 그대로 가져와 집단을 구성.
//   studentIds: 해당 반에 속한 학생 (클래스인 member list)
const TEACHER_CLASSES = [
  { id: "cls-math-hi-A", name: "고등 수학 · A반", courseId: "math-calc-2026", subject: "math", grade: "고등", schedule: "월·수·금 20:00", classinId: "RJ-2026-MATH-A1",
    studentIds: ["s01", "s02", "s03", "s04", "s05", "s06", "s07", "s08", "s09", "s10"] },
  { id: "cls-math-hi-B", name: "고등 수학 · B반", courseId: "math-calc-2026", subject: "math", grade: "고등", schedule: "화·목 20:00", classinId: "RJ-2026-MATH-A2",
    studentIds: ["s11", "s12", "s13", "s14"] },
];

// 담당 학생 명단 (A반 24명 중 대표 14명 — 데모)
//  attendance: 최근 12회 세션 출결 (P=출석 L=지각 A=결석)
//  partic: 참여도(손들기+응답률 종합, ClassIn) · hwRate: 과제 제출률 · examAvg: 정기고사 평균
const RTEACH_NAMES = [
  ["s01", "김민재", "민재", [12, 0, 0], 92, 100, 88],
  ["s02", "이수아", "수아", [12, 0, 0], 96, 100, 94],
  ["s03", "박현우", "현우", [9, 2, 1], 61, 70, 67],
  ["s04", "정은비", "은비", [11, 1, 0], 84, 90, 81],
  ["s05", "윤서연", "서연", [12, 0, 0], 88, 100, 90],
  ["s06", "최준호", "준호", [7, 3, 2], 48, 55, 58],
  ["s07", "한도윤", "도윤", [10, 2, 0], 75, 85, 79],
  ["s08", "강시우", "시우", [12, 0, 0], 90, 95, 86],
  ["s09", "조하은", "하은", [8, 1, 3], 52, 60, 62],
  ["s10", "임지호", "지호", [11, 0, 1], 80, 90, 83],
  ["s11", "오예린", "예린", [12, 0, 0], 94, 100, 91],
  ["s12", "신준서", "준서", [6, 2, 4], 40, 45, 54],
  ["s13", "배수빈", "수빈", [10, 1, 1], 72, 80, 76],
  ["s14", "문채원", "채원", [11, 1, 0], 86, 95, 88],
];

function buildRoster() {
  return RTEACH_NAMES.map(([id, name, ini, att, partic, hwRate, examAvg]) => {
    const [P, L, A] = att;
    const total = P + L + A;
    const attRate = Math.round(((P + L * 0.5) / total) * 100);
    // 위험도: 출석/과제/참여/성적 종합
    let risk = "good";
    const flags = [];
    if (attRate < 80) { flags.push("출석 저조"); }
    if (A >= 2) { flags.push(A + "회 결석"); }
    if (hwRate < 70) { flags.push("과제 미흡"); }
    if (partic < 55) { flags.push("참여 저조"); }
    if (examAvg < 65) { flags.push("성적 주의"); }
    if (flags.length >= 2 || attRate < 70 || examAvg < 60) risk = "high";
    else if (flags.length === 1) risk = "watch";
    return { id, name, initials: ini, present: P, late: L, absent: A, attRate, partic, hwRate, examAvg, risk, flags };
  });
}

const TEACHER_ROSTER = buildRoster();

// 최근 세션(출석부 — ClassIn Attendance) — 날짜별 집계
const ATT_SESSIONS = [
  { id: "se-0617", date: "2026.06.17", topic: "도함수의 활용 4강", present: 21, late: 2, absent: 1, rate: 92 },
  { id: "se-0615", date: "2026.06.15", topic: "도함수의 활용 3강", present: 22, late: 1, absent: 1, rate: 94 },
  { id: "se-0612", date: "2026.06.12", topic: "도함수의 활용 2강", present: 20, late: 3, absent: 1, rate: 90 },
  { id: "se-0610", date: "2026.06.10", topic: "도함수의 활용 1강", present: 23, late: 0, absent: 1, rate: 96 },
  { id: "se-0608", date: "2026.06.08", topic: "미분법 종합", present: 21, late: 2, absent: 1, rate: 92 },
];

// 오늘 수업 (ClassIn 라이브 예정/진행) — 실제 일정으로 채웁니다
const TEACHER_TODAY = null;

function riskMeta(r) {
  if (r === "high") return { label: "집중관리", cls: "bad", color: "var(--ci-bad)" };
  if (r === "watch") return { label: "관찰", cls: "warn", color: "var(--ci-amber, #c98a00)" };
  return { label: "양호", cls: "ok", color: "var(--ci-ok)" };
}

function rosterStats(roster) {
  const n = roster.length;
  if (!n) return { n: 0, avgAtt: null, avgExam: null, highRisk: 0, watch: 0 };
  const attVals = roster.map((r) => r.attRate).filter((v) => v != null);
  const examVals = roster.map((r) => r.examAvg).filter((v) => v != null);
  const avgAtt = attVals.length ? Math.round(attVals.reduce((s, v) => s + v, 0) / attVals.length) : null;
  const avgExam = examVals.length ? Math.round(examVals.reduce((s, v) => s + v, 0) / examVals.length) : null;
  const highRisk = roster.filter((r) => r.risk === "high").length;
  const watch = roster.filter((r) => r.risk === "watch").length;
  return { n, avgAtt, avgExam, highRisk, watch };
}

// ── 실제 로스터 — 월말평가 성적표 학생으로 구성 (출결·참여는 라이브 수업 전이라 null) ──
function rjRealTeacherRoster() {
  try {
    const R = window.RJReport; if (!R) return [];
    const rounds = R.sortedRounds(R.loadStore());
    if (!rounds.length) return [];
    const byName = {};
    rounds.forEach((rd) => {
      for (const key in rd.students) {
        const st = rd.students[key];
        if (!st || st.avg == null) continue;
        const nm = st.name;
        if (!byName[nm]) byName[nm] = { id: "r-" + nm, name: nm, initials: String(nm).slice(-2), org: st.org || "", trend: [], examAvg: null };
        byName[nm].trend.push({ label: R.shortLabel(rd.label), avg: st.avg });
        byName[nm].examAvg = st.avg;   // rounds 오름차순 → 마지막이 최신
      }
    });
    return Object.values(byName).map((s) => {
      const ea = s.examAvg;
      let risk = "good"; const flags = [];
      if (ea != null && ea < 60) { risk = "high"; flags.push("성적 주의"); }
      else if (ea != null && ea < 70) { risk = "watch"; flags.push("성적 관찰"); }
      return { ...s, present: null, late: null, absent: null, attRate: null, partic: null, hwRate: null, examAvg: ea, risk, flags };
    }).sort((a, b) => a.name.localeCompare(b.name, "ko"));
  } catch (e) { return []; }
}

// ── 반(class) 멤버 조회 ────────────────────────────
function findClass(classId) { return TEACHER_CLASSES.find((c) => c.id === classId) || null; }
function classRoster(classId) {
  const c = findClass(classId); if (!c) return [];
  return c.studentIds.map((sid) => TEACHER_ROSTER.find((r) => r.id === sid)).filter(Boolean);
}

// ── 반 단위 과제 배포·체크 저장소 (localStorage) ──────────────
//   assignment: { id, classId, type:'homework'|'exam', title, detail, due, createdAt,
//                 submissions: { [studentId]: { status, score, comment } } }
//   status: pending(미제출) | submitted(제출) | graded(채점완료)
const RJ_TASGN_KEY = "rj_class_assignments_v1";
function loadAssignments() {
  try { const s = JSON.parse(localStorage.getItem(RJ_TASGN_KEY) || "null"); if (Array.isArray(s)) return s.filter((a) => a.id !== "asg-seed1"); } catch (e) {}
  return [];
}
function saveAssignments(list) { try { localStorage.setItem(RJ_TASGN_KEY, JSON.stringify(list)); } catch (e) {} }
function listAssignments(classId) { return loadAssignments().filter((a) => !classId || a.classId === classId).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)); }

function createAssignment({ classId, type, title, detail, due }) {
  const list = loadAssignments();
  const c = findClass(classId);
  const subs = {};
  (c ? c.studentIds : []).forEach((sid) => { subs[sid] = { status: "pending", score: null, comment: "" }; });
  const a = { id: "asg-" + Date.now().toString(36), classId, type: type || "homework", title, detail: detail || "", due: due || "", createdAt: new Date().toISOString(), submissions: subs };
  list.push(a); saveAssignments(list);
  if (window.rjPushAssignmentToCloud) window.rjPushAssignmentToCloud(a).catch(() => {});
  return a;
}
function updateSubmission(asgId, studentId, patch) {
  const list = loadAssignments();
  const a = list.find((x) => x.id === asgId); if (!a) return;
  a.submissions[studentId] = { ...(a.submissions[studentId] || { status: "pending", score: null, comment: "" }), ...patch };
  saveAssignments(list);
  if (window.rjPushAssignmentToCloud) window.rjPushAssignmentToCloud(a).catch(() => {});
}
function deleteAssignment(asgId) {
  saveAssignments(loadAssignments().filter((a) => a.id !== asgId));
  if (window.rjDeleteAssignmentFromCloud) window.rjDeleteAssignmentFromCloud(asgId).catch(() => {});
}

function asgStats(a) {
  const subs = Object.values(a.submissions || {});
  const total = subs.length;
  const submitted = subs.filter((s) => s.status === "submitted" || s.status === "graded").length;
  const graded = subs.filter((s) => s.status === "graded").length;
  return { total, submitted, graded, pending: total - submitted, rate: total ? Math.round((submitted / total) * 100) : 0 };
}

// (예시 시드 과제 제거됨 — 실제 배포로 채웁니다)
function _seedAssignments() { return []; }

// 예시 학생/반/출결 비움 — 실제 ClassIn 동기화/입력으로 채웁니다
TEACHER_CLASSES.length = 0; TEACHER_ROSTER.length = 0; ATT_SESSIONS.length = 0;

Object.assign(window, {
  TEACHER_CLASSES, TEACHER_ROSTER, ATT_SESSIONS, TEACHER_TODAY,
  riskMeta, rosterStats, buildRoster, rjRealTeacherRoster,
  findClass, classRoster,
  loadAssignments, listAssignments, createAssignment, updateSubmission, deleteAssignment, asgStats,
});
