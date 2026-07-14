/* global window */
// ──────────────────────────────────────────────────────────────────
//  선생님(Teacher) 데이터 — 반(class) · 학생 · 출결 · 과제
//   · 반/출결/과제는 강사가 직접 만들고 관리 → localStorage 저장(+Supabase 동기화 훅)
//   · 성적은 월말평가(리포트) 집계에서 이름으로 연결
//   · 출결은 강사가 세션별로 직접 체크(녹화강의 학원 → 실시간·수동 겸용)
// ──────────────────────────────────────────────────────────────────

// ── 반(class) 저장소 ────────────────────────────────────────────────
//   class: { id, name, subject, grade, schedule, courseId, studentIds:[], classinId?, createdAt }
const RJ_CLASS_KEY = "rj_teacher_classes_v1";
function loadClasses() {
  try { const s = JSON.parse(localStorage.getItem(RJ_CLASS_KEY) || "null"); if (Array.isArray(s)) return s; } catch (e) {}
  return [];
}
function saveClasses(list) { try { localStorage.setItem(RJ_CLASS_KEY, JSON.stringify(list)); } catch (e) {} }

// window.TEACHER_CLASSES 는 여러 화면이 배열로 참조 → 저장소와 동일 참조를 유지(in-place 갱신)
const TEACHER_CLASSES = [];
function syncClassArray() { TEACHER_CLASSES.length = 0; loadClasses().forEach((c) => TEACHER_CLASSES.push(c)); return TEACHER_CLASSES; }

function createClass({ name, subject, grade, schedule, courseId }) {
  const list = loadClasses();
  const c = {
    id: "cls-" + Date.now().toString(36),
    name: (name || "새 반").trim(), subject: subject || "", grade: grade || "", schedule: (schedule || "").trim(),
    courseId: courseId || "", studentIds: [], createdAt: new Date().toISOString(),
  };
  list.push(c); saveClasses(list); syncClassArray();
  return c;
}
function updateClass(id, patch) {
  const list = loadClasses(); const c = list.find((x) => x.id === id); if (!c) return;
  Object.assign(c, patch); saveClasses(list); syncClassArray();
}
function deleteClass(id) {
  saveClasses(loadClasses().filter((c) => c.id !== id)); syncClassArray();
  // 반 삭제 시 이 반의 출결도 정리
  const att = loadAttendance(); if (att[id]) { delete att[id]; saveAttendance(att); }
}
function addClassStudent(id, studentId) {
  const list = loadClasses(); const c = list.find((x) => x.id === id); if (!c) return;
  if (!c.studentIds.includes(studentId)) c.studentIds.push(studentId);
  saveClasses(list); syncClassArray();
}
function removeClassStudent(id, studentId) {
  const list = loadClasses(); const c = list.find((x) => x.id === id); if (!c) return;
  c.studentIds = c.studentIds.filter((s) => s !== studentId);
  saveClasses(list); syncClassArray();
}

// ── 출결 저장소 ─────────────────────────────────────────────────────
//   { [classId]: [ { id, date:"2026.07.14", topic, marks:{ [studentId]: "P"|"L"|"A" } } ] }
const RJ_ATT_KEY = "rj_class_attendance_v1";
function loadAttendance() { try { return JSON.parse(localStorage.getItem(RJ_ATT_KEY) || "{}") || {}; } catch (e) { return {}; } }
function saveAttendance(o) { try { localStorage.setItem(RJ_ATT_KEY, JSON.stringify(o)); } catch (e) {} }
function classSessions(classId) {
  const att = loadAttendance();
  return (att[classId] || []).slice().sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
}
function addSession(classId, { date, topic }) {
  const att = loadAttendance(); if (!att[classId]) att[classId] = [];
  const s = { id: "se-" + Date.now().toString(36), date: date || todayDot(), topic: (topic || "").trim(), marks: {} };
  att[classId].push(s); saveAttendance(att); return s;
}
function markAtt(classId, sessionId, studentId, mark) {
  const att = loadAttendance(); const list = att[classId] || []; const s = list.find((x) => x.id === sessionId); if (!s) return;
  s.marks[studentId] = mark; saveAttendance(att);
}
function deleteSession(classId, sessionId) {
  const att = loadAttendance(); if (!att[classId]) return;
  att[classId] = att[classId].filter((s) => s.id !== sessionId); saveAttendance(att);
}
function todayDot() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return d.getFullYear() + "." + p(d.getMonth() + 1) + "." + p(d.getDate());
}
// 세션 집계(출석/지각/결석/미체크·출석률)
function sessionStats(session, roster) {
  const n = roster.length; let present = 0, late = 0, absent = 0;
  roster.forEach((r) => { const m = session.marks[r.id]; if (m === "P") present++; else if (m === "L") late++; else if (m === "A") absent++; });
  const marked = present + late + absent;
  const rate = marked ? Math.round(((present + late * 0.5) / marked) * 100) : 0;
  return { n, present, late, absent, marked, unmarked: n - marked, rate };
}
// 학생 누적 출결(반 전체 세션)
function studentAtt(classId, studentId) {
  const sessions = loadAttendance()[classId] || [];
  let present = 0, late = 0, absent = 0;
  sessions.forEach((s) => { const m = s.marks[studentId]; if (m === "P") present++; else if (m === "L") late++; else if (m === "A") absent++; });
  const total = present + late + absent;
  const attRate = total ? Math.round(((present + late * 0.5) / total) * 100) : null;
  return { present, late, absent, total, attRate };
}

// ── 학생 해석(반 멤버 → 지표 카드) ───────────────────────────────────
function _baseStudents() { try { return (typeof stuList !== "undefined" ? stuList() : (window.stuList ? window.stuList() : [])) || []; } catch (e) { return []; } }
function _scoreTrend(name) { try { return (typeof stuScoreTrend !== "undefined" ? stuScoreTrend(name) : (window.stuScoreTrend ? window.stuScoreTrend(name) : null)); } catch (e) { return null; } }

function studentHwRate(classId, studentId) {
  const list = listAssignments(classId).filter((a) => a.type !== "exam");
  if (!list.length) return null;
  let done = 0; list.forEach((a) => { const s = a.submissions[studentId]; if (s && (s.status === "submitted" || s.status === "graded")) done++; });
  return Math.round((done / list.length) * 100);
}
function riskFrom({ attRate, absent, hwRate, examAvg }) {
  const flags = [];
  if (attRate != null && attRate < 80) flags.push("출석 저조");
  if (absent >= 2) flags.push(absent + "회 결석");
  if (hwRate != null && hwRate < 70) flags.push("과제 미흡");
  if (examAvg != null && examAvg < 65) flags.push("성적 주의");
  let risk = "good";
  if (flags.length >= 2 || (attRate != null && attRate < 70) || (examAvg != null && examAvg < 60)) risk = "high";
  else if (flags.length === 1) risk = "watch";
  return { risk, flags };
}
function studentCard(classId, studentId) {
  const base = _baseStudents().find((s) => s.uid === studentId) || { uid: studentId, name: studentId };
  const name = base.name || studentId;
  const att = studentAtt(classId, studentId);
  const trend = _scoreTrend(name);
  const examAvg = trend && trend.length ? trend[trend.length - 1].avg : null;
  const hwRate = studentHwRate(classId, studentId);
  const { risk, flags } = riskFrom({ attRate: att.attRate, absent: att.absent, hwRate, examAvg });
  return {
    id: studentId, name, initials: String(name).slice(-2), label: base.label || "", email: base.email || "",
    present: att.present, late: att.late, absent: att.absent, attRate: att.attRate,
    partic: null, hwRate, examAvg, trend: trend || [], org: base.label || "", risk, flags,
  };
}

// ── 반(class) 조회 ─────────────────────────────────────────────────
function findClass(classId) { return loadClasses().find((c) => c.id === classId) || null; }
function classRoster(classId) {
  const c = findClass(classId); if (!c) return [];
  return c.studentIds.map((sid) => studentCard(classId, sid)).sort((a, b) => a.name.localeCompare(b.name, "ko"));
}

// ── 오늘 수업 (라이브 예정/진행) — 실제 일정으로 채웁니다 ──────────
const TEACHER_TODAY = null;
// 데모 호환용 빈 배열(옛 화면 참조)
const TEACHER_ROSTER = [];
const ATT_SESSIONS = [];

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

// ── 실제 로스터 — 월말평가 성적표 학생 + 반 출결을 합쳐 구성 ──────────
//   반에 배정된 학생은 반 출결 지표를, 그 외 성적만 있는 학생은 성적 지표를 표시
function rjRealTeacherRoster() {
  try {
    const cards = {};
    // 1) 반에 배정된 모든 학생 (출결·과제 지표 포함)
    loadClasses().forEach((c) => { c.studentIds.forEach((sid) => { if (!cards[sid]) cards[sid] = studentCard(c.id, sid); }); });
    // 2) 성적표(월말평가)에만 있는 학생 (반 미배정) — 이름 기준
    const R = window.RJReport;
    if (R) {
      const rounds = R.sortedRounds(R.loadStore());
      const seenNames = new Set(Object.values(cards).map((c) => c.name));
      const byName = {};
      rounds.forEach((rd) => {
        for (const key in rd.students) {
          const st = rd.students[key]; if (!st || st.avg == null) continue;
          const nm = st.name; if (seenNames.has(nm)) continue;
          if (!byName[nm]) byName[nm] = { id: "r-" + nm, name: nm, initials: String(nm).slice(-2), org: st.org || "", label: st.org || "", email: "", trend: [], examAvg: null, present: null, late: null, absent: null, attRate: null, partic: null, hwRate: null };
          byName[nm].trend.push({ label: R.shortLabel(rd.label), avg: st.avg });
          byName[nm].examAvg = st.avg;
        }
      });
      Object.values(byName).forEach((s) => { const { risk, flags } = riskFrom({ attRate: null, absent: 0, hwRate: null, examAvg: s.examAvg }); cards[s.id] = { ...s, risk, flags }; });
    }
    return Object.values(cards).sort((a, b) => a.name.localeCompare(b.name, "ko"));
  } catch (e) { return []; }
}

// ── 반 단위 과제 배포·체크 저장소 (localStorage) ──────────────
//   assignment: { id, classId, type:'homework'|'exam', title, detail, due, createdAt,
//                 submissions: { [studentId]: { status, score, comment } } }
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

// 최초 1회 반 배열 동기화
syncClassArray();

Object.assign(window, {
  TEACHER_CLASSES, TEACHER_ROSTER, ATT_SESSIONS, TEACHER_TODAY,
  riskMeta, rosterStats, rjRealTeacherRoster,
  findClass, classRoster, studentCard,
  loadClasses, saveClasses, syncClassArray, createClass, updateClass, deleteClass, addClassStudent, removeClassStudent,
  loadAttendance, classSessions, addSession, markAtt, deleteSession, sessionStats, studentAtt, todayDot,
  loadAssignments, listAssignments, createAssignment, updateSubmission, deleteAssignment, asgStats, studentHwRate,
});
