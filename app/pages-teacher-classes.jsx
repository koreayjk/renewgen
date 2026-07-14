/* global React, Icon, CiHead, useApp, findCourse */
// ──────────────────────────────────────────────────────────────────
//  선생님 — 반(Class) 관리
//   · 반 만들기 · 학생(명부에서) 초대 · 출결 세션별 체크 · 과제 배포/채점
//   각 반은 강사가 직접 구성(우리 학원은 학년/반 고정이 아니라 수업별 초대식)
// ──────────────────────────────────────────────────────────────────
const { useState: useStCls } = React;

const SUB_STATUS = {
  pending:   { label: "미제출", cls: "warn" },
  submitted: { label: "제출",   cls: "navy" },
  graded:    { label: "채점완료", cls: "ok" },
};
const inSt = { width: "100%", height: 40, borderRadius: 8, border: "1px solid var(--ci-line)", padding: "0 12px", fontSize: 14, fontFamily: "var(--font-kr)" };

function ClassManager() {
  const { showToast } = useApp();
  window.syncClassArray && window.syncClassArray();
  const [, force] = useStCls(0);
  const refresh = () => { window.syncClassArray && window.syncClassArray(); force((n) => n + 1); };
  const classes = window.loadClasses ? window.loadClasses() : [];
  const [classId, setClassId] = useStCls(classes[0] ? classes[0].id : null);
  const [openAsg, setOpenAsg] = useStCls(null);
  const [adding, setAdding] = useStCls(false);       // 과제 배포 폼
  const [creating, setCreating] = useStCls(false);   // 반 만들기 폼
  const [editing, setEditing] = useStCls(false);     // 반 설정
  const [picking, setPicking] = useStCls(false);     // 학생 초대 모달

  // 클라우드(Supabase) 과제·제출 동기화
  React.useEffect(() => {
    let alive = true;
    if (window.rjSyncAssignmentsFromCloud) window.rjSyncAssignmentsFromCloud().then((r) => { if (alive && r && r.ok) refresh(); }).catch(() => {});
    return () => { alive = false; };
  }, []);

  const cls = classId ? window.findClass(classId) : null;
  const roster = classId ? window.classRoster(classId) : [];
  const assignments = classId ? window.listAssignments(classId) : [];

  if (openAsg) return <AssignmentCheck asgId={openAsg} onBack={() => { setOpenAsg(null); refresh(); }} />;

  return (
    <div style={{ display: "grid", gap: 18 }}>
      <CiHead title="반 관리" api="Renewjen · Class"
        sub="반을 만들고 학생을 초대하세요 · 반 단위로 출결을 체크하고 과제를 배포합니다"
        action={<button className="ci-act navy" onClick={() => { setCreating((v) => !v); setEditing(false); }}><Icon name="plus" size={13} /> 반 만들기</button>} />

      {creating && <ClassCreateForm onDone={(id) => { setCreating(false); setClassId(id); refresh(); }} onCancel={() => setCreating(false)} />}

      {/* 반 선택 */}
      {classes.length > 0 && (
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {classes.map((c) => (
            <button key={c.id} onClick={() => { setClassId(c.id); setAdding(false); setEditing(false); }} className={"ci-act" + (c.id === classId ? " navy" : "")} style={{ height: 40 }}>
              <Icon name="users" size={13} /> {c.name} <span style={{ opacity: 0.7 }}>· {c.studentIds.length}명</span>
            </button>
          ))}
        </div>
      )}

      {classes.length === 0 && !creating && (
        <div className="ci-card ci-card-pad" style={{ textAlign: "center", padding: "56px 24px", color: "var(--ci-muted)" }}>
          <Icon name="users" size={28} />
          <div style={{ fontWeight: 800, color: "var(--ci-ink)", marginTop: 12, fontSize: 15 }}>아직 만든 반이 없습니다</div>
          <p style={{ fontSize: 13.5, marginTop: 8, lineHeight: 1.6 }}>우측 상단 <b>「반 만들기」</b>로 첫 반을 만들고<br />학생을 초대해 출결·과제를 관리하세요.</p>
        </div>
      )}

      {cls && (
        <>
          {/* 반 정보 */}
          <div className="ci-card ci-card-pad" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontWeight: 900, fontSize: 18, letterSpacing: "-0.03em" }}>{cls.name}</div>
              <div style={{ fontSize: 13, color: "var(--ci-muted)", marginTop: 3 }}>
                {[cls.courseId && findCourse(cls.courseId) ? findCourse(cls.courseId).title : null, cls.grade, cls.schedule, "학생 " + cls.studentIds.length + "명"].filter(Boolean).join(" · ")}
              </div>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <button className="ci-act sm" onClick={() => setPicking(true)}><Icon name="plus" size={12} /> 학생 초대</button>
              <button className="ci-act sm" onClick={() => setEditing((v) => !v)}><Icon name="settings" size={12} /> 설정</button>
            </div>
          </div>

          {editing && <ClassEditForm cls={cls} onDone={() => { setEditing(false); refresh(); }} onDeleted={() => { setEditing(false); setClassId(null); refresh(); }} />}

          {/* 출결 */}
          <AttendanceBoard cls={cls} roster={roster} onChange={refresh} />

          {/* 과제/시험 배포 목록 */}
          <div className="ci-card" style={{ overflow: "hidden" }}>
            <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--ci-line)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontWeight: 900, fontSize: 15 }}>이 반에 배포한 과제 <span style={{ color: "var(--ci-muted)", fontWeight: 600, fontSize: 13 }}>· {assignments.length}건</span></span>
              <button className="ci-act navy sm" onClick={() => setAdding((v) => !v)} disabled={cls.studentIds.length === 0}><Icon name="plus" size={12} /> 과제 배포</button>
            </div>
            {adding && <AssignForm classId={classId} onDone={() => { setAdding(false); refresh(); }} onCancel={() => setAdding(false)} />}
            <div style={{ padding: assignments.length ? 0 : 24 }}>
              {assignments.length === 0 && <div style={{ textAlign: "center", color: "var(--ci-muted)", fontSize: 13.5 }}>{cls.studentIds.length === 0 ? "학생을 먼저 초대하면 과제를 배포할 수 있습니다" : "아직 배포한 과제가 없습니다 · 「과제 배포」로 이 반 전체에 한 번에 내보세요"}</div>}
              {assignments.map((a) => {
                const st = window.asgStats(a);
                return (
                  <div key={a.id} style={{ display: "grid", gridTemplateColumns: "1fr auto auto", gap: 16, alignItems: "center", padding: "14px 18px", borderTop: "1px solid var(--ci-line)" }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                        <span className={"ci-badge " + (a.type === "exam" ? "navy" : "neutral")} style={{ fontSize: 10 }}>{a.type === "exam" ? "시험" : "과제"}</span>
                        <strong style={{ fontWeight: 800, fontSize: 15 }}>{a.title}</strong>
                      </div>
                      <div style={{ fontSize: 12.5, color: "var(--ci-muted)", marginTop: 3 }}>{a.detail}{a.due ? " · 마감 " + a.due : ""}</div>
                    </div>
                    <div style={{ minWidth: 150 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, marginBottom: 4 }}>
                        <span style={{ color: "var(--ci-muted)" }}>제출 {st.submitted}/{st.total}</span>
                        <span style={{ color: "var(--ci-muted)" }}>채점 {st.graded}</span>
                      </div>
                      <div style={{ height: 7, background: "var(--ci-bg-2)", borderRadius: 4, overflow: "hidden" }}>
                        <i style={{ display: "block", height: "100%", width: st.rate + "%", background: "var(--ci-navy)" }} />
                      </div>
                    </div>
                    <button className="ci-act sm" onClick={() => setOpenAsg(a.id)}><Icon name="edit" size={11} /> 체크·채점</button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 반 학생 명단 */}
          <div className="ci-card" style={{ overflow: "hidden" }}>
            <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--ci-line)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontWeight: 900, fontSize: 15 }}>반 학생 명단 <span style={{ color: "var(--ci-muted)", fontWeight: 600, fontSize: 13 }}>· {roster.length}명</span></span>
              <button className="ci-act sm" onClick={() => setPicking(true)}><Icon name="plus" size={11} /> 학생 초대</button>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table className="ci-table">
                <thead><tr><th>학생</th><th style={{ textAlign: "center" }}>출석률</th><th style={{ textAlign: "center" }}>과제 제출률</th><th style={{ textAlign: "center" }}>월말평가</th><th style={{ textAlign: "center" }}>상태</th><th style={{ textAlign: "right" }}>작업</th></tr></thead>
                <tbody>
                  {roster.length === 0 && <tr><td colSpan={6} style={{ padding: 24, textAlign: "center", color: "var(--ci-muted)" }}>초대된 학생이 없습니다 · 「학생 초대」로 명부에서 추가하세요</td></tr>}
                  {roster.map((r) => {
                    const rm = window.riskMeta(r.risk);
                    return (
                      <tr key={r.id}>
                        <td><div style={{ display: "flex", alignItems: "center", gap: 9 }}><span className="avatar avatar-sm" style={{ background: "var(--ci-bg-2)", color: "var(--ci-navy)", fontWeight: 800 }}>{r.initials}</span><div><strong style={{ fontWeight: 700 }}>{r.name}</strong>{r.label ? <span style={{ color: "var(--ci-muted)", fontSize: 12, marginLeft: 6 }}>{r.label}</span> : null}</div></div></td>
                        <td style={{ textAlign: "center", fontWeight: 700, color: r.attRate != null && r.attRate < 80 ? "var(--ci-bad)" : "inherit" }}>{r.attRate == null ? "—" : r.attRate + "%"}</td>
                        <td style={{ textAlign: "center", color: r.hwRate != null && r.hwRate < 70 ? "var(--ci-bad)" : "inherit" }}>{r.hwRate == null ? "—" : r.hwRate + "%"}</td>
                        <td style={{ textAlign: "center", fontWeight: 700 }}>{r.examAvg == null ? "—" : r.examAvg}</td>
                        <td style={{ textAlign: "center" }}><span className={"ci-badge " + rm.cls} style={{ fontSize: 9.5 }}>{rm.label}</span></td>
                        <td style={{ textAlign: "right" }}><button className="ci-act sm danger" onClick={() => { window.removeClassStudent(cls.id, r.id); refresh(); showToast(r.name + " 학생을 반에서 제외했습니다"); }}><Icon name="close" size={11} /> 제외</button></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {picking && cls && <StudentPicker cls={cls} onClose={() => { setPicking(false); refresh(); }} onChange={refresh} />}
    </div>
  );
}

// ── 반 만들기 ───────────────────────────────────────────────────────
function ClassCreateForm({ onDone, onCancel }) {
  const { showToast } = useApp();
  const courses = typeof COURSES !== "undefined" ? COURSES : [];
  const [f, setF] = useStCls({ name: "", grade: "고2", schedule: "", courseId: "" });
  const up = (k, v) => setF((x) => ({ ...x, [k]: v }));
  const save = () => {
    if (!f.name.trim()) { showToast("반 이름을 입력하세요 (예: 고2 수학 A반)"); return; }
    const c = window.createClass({ name: f.name, grade: f.grade, schedule: f.schedule, courseId: f.courseId });
    showToast(c.name + " 반을 만들었습니다 · 학생을 초대하세요");
    onDone(c.id);
  };
  return (
    <div className="ci-card ci-card-pad" style={{ background: "var(--ci-bg)" }}>
      <div style={{ fontWeight: 900, fontSize: 15, marginBottom: 12 }}>새 반 만들기</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 120px", gap: 10, marginBottom: 10 }}>
        <input value={f.name} onChange={(e) => up("name", e.target.value)} placeholder="반 이름 (예: 고2 수학 A반)" style={inSt} autoFocus />
        <select value={f.grade} onChange={(e) => up("grade", e.target.value)} style={inSt}>
          {["중1", "중2", "중3", "고1", "고2", "고3", "N수생", "혼합"].map((g) => <option key={g}>{g}</option>)}
        </select>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
        <select value={f.courseId} onChange={(e) => up("courseId", e.target.value)} style={inSt}>
          <option value="">연결 강의 (선택)</option>
          {courses.map((co) => <option key={co.id} value={co.id}>{co.title}</option>)}
        </select>
        <input value={f.schedule} onChange={(e) => up("schedule", e.target.value)} placeholder="수업 일정 (예: 월·수·금 20:00)" style={inSt} />
      </div>
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <button className="ci-act" onClick={onCancel}>취소</button>
        <button className="ci-act navy" onClick={save}><Icon name="check" size={13} /> 반 만들기</button>
      </div>
    </div>
  );
}

// ── 반 설정(이름·일정 수정 / 삭제) ──────────────────────────────────
function ClassEditForm({ cls, onDone, onDeleted }) {
  const { showToast } = useApp();
  const courses = typeof COURSES !== "undefined" ? COURSES : [];
  const [f, setF] = useStCls({ name: cls.name, grade: cls.grade || "고2", schedule: cls.schedule || "", courseId: cls.courseId || "" });
  const up = (k, v) => setF((x) => ({ ...x, [k]: v }));
  const save = () => {
    if (!f.name.trim()) { showToast("반 이름을 입력하세요"); return; }
    window.updateClass(cls.id, { name: f.name.trim(), grade: f.grade, schedule: f.schedule.trim(), courseId: f.courseId });
    showToast("반 정보를 저장했습니다"); onDone();
  };
  const del = () => {
    if (!window.confirm("‘" + cls.name + "’ 반을 삭제할까요?\n출결 기록도 함께 삭제됩니다. (학생 계정·성적은 유지)")) return;
    window.deleteClass(cls.id); showToast("반을 삭제했습니다"); onDeleted();
  };
  return (
    <div className="ci-card ci-card-pad" style={{ background: "var(--ci-bg)" }}>
      <div style={{ fontWeight: 900, fontSize: 15, marginBottom: 12 }}>반 설정</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 120px", gap: 10, marginBottom: 10 }}>
        <input value={f.name} onChange={(e) => up("name", e.target.value)} style={inSt} />
        <select value={f.grade} onChange={(e) => up("grade", e.target.value)} style={inSt}>
          {["중1", "중2", "중3", "고1", "고2", "고3", "N수생", "혼합"].map((g) => <option key={g}>{g}</option>)}
        </select>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
        <select value={f.courseId} onChange={(e) => up("courseId", e.target.value)} style={inSt}>
          <option value="">연결 강의 (선택)</option>
          {courses.map((co) => <option key={co.id} value={co.id}>{co.title}</option>)}
        </select>
        <input value={f.schedule} onChange={(e) => up("schedule", e.target.value)} placeholder="수업 일정" style={inSt} />
      </div>
      <div style={{ display: "flex", gap: 8, justifyContent: "space-between" }}>
        <button className="ci-act danger" onClick={del}><Icon name="trash" size={13} /> 반 삭제</button>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="ci-act" onClick={onDone}>취소</button>
          <button className="ci-act navy" onClick={save}><Icon name="check" size={13} /> 저장</button>
        </div>
      </div>
    </div>
  );
}

// ── 학생 초대(명부에서 선택) ────────────────────────────────────────
function StudentPicker({ cls, onClose, onChange }) {
  const { showToast } = useApp();
  const [q, setQ] = useStCls("");
  const [, force] = useStCls(0);
  const all = (window.stuList ? window.stuList() : []).filter((s) => (s.role || "student") === "student");
  const inClass = new Set((window.findClass(cls.id) || cls).studentIds);
  const s = q.trim().toLowerCase();
  const list = all
    .filter((a) => !inClass.has(a.uid))
    .filter((a) => !q || (a.name || "").includes(q) || (a.label || "").includes(q) || (a.email || "").toLowerCase().includes(s) || String(a.uid).includes(q))
    .sort((a, b) => (a.name || "").localeCompare(b.name || "", "ko"))
    .slice(0, 200);
  const add = (a) => { window.addClassStudent(cls.id, a.uid); onChange(); force((n) => n + 1); showToast(a.name + " 학생을 초대했습니다"); };

  return (
    <div className="ci-modal-overlay" onClick={onClose}>
      <div className="ci-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 560 }}>
        <div className="ci-modal-head">{cls.name} · 학생 초대 <button className="ci-x" onClick={onClose}><Icon name="close" size={16} /></button></div>
        <div className="ci-modal-body" style={{ paddingTop: 14 }}>
          <label className="ci-search" style={{ width: "100%", marginBottom: 12 }}><Icon name="search" size={15} />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="이름·반·이메일로 검색" autoFocus />
          </label>
          <div style={{ fontSize: 12, color: "var(--ci-muted)", marginBottom: 8 }}>명부(전체 {all.length}명) 중 이 반에 없는 학생 · 눌러서 초대</div>
          <div style={{ maxHeight: 360, overflowY: "auto", border: "1px solid var(--ci-line)", borderRadius: 10 }}>
            {list.length === 0 && <div style={{ padding: 24, textAlign: "center", color: "var(--ci-muted)", fontSize: 13.5 }}>{all.length === 0 ? "명부에 학생이 없습니다 (관리자 · 학생 관리에서 등록/가져오기)" : "조건에 맞는 학생이 없습니다"}</div>}
            {list.map((a) => (
              <button key={a.uid} onClick={() => add(a)} style={{ width: "100%", textAlign: "left", cursor: "pointer", border: 0, borderBottom: "1px solid var(--ci-line)", background: "var(--ci-paper)", padding: "10px 14px", display: "flex", alignItems: "center", gap: 11 }}>
                <span className="avatar avatar-sm" style={{ background: "var(--ci-bg-2)", color: "var(--ci-navy)", fontWeight: 800 }}>{(a.name || "?").slice(-2)}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <strong style={{ fontWeight: 700, fontSize: 14 }}>{a.name || "이름 미상"}</strong>
                  <div style={{ fontSize: 12, color: "var(--ci-muted)" }}>{[a.label, a.email || a.mobile].filter(Boolean).join(" · ") || "—"}</div>
                </div>
                <span className="ci-act sm navy" style={{ pointerEvents: "none" }}><Icon name="plus" size={11} /> 초대</span>
              </button>
            ))}
          </div>
        </div>
        <div className="ci-modal-foot">
          <span style={{ fontSize: 12.5, color: "var(--ci-muted)", marginRight: "auto" }}>현재 반 인원 {(window.findClass(cls.id) || cls).studentIds.length}명</span>
          <button className="ci-act navy" onClick={onClose}>완료</button>
        </div>
      </div>
    </div>
  );
}

// ── 출결 체크 ───────────────────────────────────────────────────────
const ATT_MARKS = [["P", "출석", "ok"], ["L", "지각", "warn"], ["A", "결석", "bad"]];
function AttendanceBoard({ cls, roster, onChange }) {
  const { showToast } = useApp();
  const [, force] = useStCls(0);
  const refresh = () => { onChange && onChange(); force((n) => n + 1); };
  const [openSe, setOpenSe] = useStCls(null);
  const [adding, setAdding] = useStCls(false);
  const [nf, setNf] = useStCls({ date: window.todayDot ? window.todayDot() : "", topic: "" });
  const sessions = window.classSessions(cls.id);

  const createSe = () => {
    const s = window.addSession(cls.id, { date: nf.date, topic: nf.topic });
    setAdding(false); setNf({ date: window.todayDot ? window.todayDot() : "", topic: "" }); setOpenSe(s.id); refresh();
  };
  const setMark = (seId, sid, mark) => { window.markAtt(cls.id, seId, sid, mark); refresh(); };
  const markAll = (seId, mark) => { roster.forEach((r) => window.markAtt(cls.id, seId, r.id, mark)); refresh(); showToast("전체 " + (mark === "P" ? "출석" : mark) + " 처리했습니다"); };
  const delSe = (seId) => { if (!window.confirm("이 수업 회차 출결을 삭제할까요?")) return; window.deleteSession(cls.id, seId); if (openSe === seId) setOpenSe(null); refresh(); };

  return (
    <div className="ci-card" style={{ overflow: "hidden" }}>
      <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--ci-line)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontWeight: 900, fontSize: 15 }}>출결 <span style={{ color: "var(--ci-muted)", fontWeight: 600, fontSize: 13 }}>· {sessions.length}회차</span></span>
        <button className="ci-act navy sm" onClick={() => setAdding((v) => !v)} disabled={cls.studentIds.length === 0}><Icon name="plus" size={12} /> 수업 회차 추가</button>
      </div>

      {adding && (
        <div style={{ padding: 16, background: "var(--ci-bg)", borderBottom: "1px solid var(--ci-line)", display: "grid", gridTemplateColumns: "150px 1fr auto auto", gap: 10, alignItems: "center" }}>
          <input value={nf.date} onChange={(e) => setNf((x) => ({ ...x, date: e.target.value }))} placeholder="2026.07.14" style={inSt} />
          <input value={nf.topic} onChange={(e) => setNf((x) => ({ ...x, topic: e.target.value }))} placeholder="수업 주제 (예: 도함수의 활용 3강)" style={inSt} autoFocus />
          <button className="ci-act" onClick={() => setAdding(false)}>취소</button>
          <button className="ci-act navy" onClick={createSe}><Icon name="check" size={13} /> 추가</button>
        </div>
      )}

      <div style={{ padding: sessions.length ? 0 : 24 }}>
        {sessions.length === 0 && <div style={{ textAlign: "center", color: "var(--ci-muted)", fontSize: 13.5 }}>{cls.studentIds.length === 0 ? "학생을 먼저 초대하면 출결을 체크할 수 있습니다" : "「수업 회차 추가」로 오늘 수업의 출결을 체크하세요"}</div>}
        {sessions.map((se) => {
          const st = window.sessionStats(se, roster);
          const open = openSe === se.id;
          return (
            <div key={se.id} style={{ borderTop: "1px solid var(--ci-line)" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr auto auto", gap: 14, alignItems: "center", padding: "12px 18px" }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                    <span className="ci-mono" style={{ fontSize: 12.5, color: "var(--ci-muted)" }}>{se.date}</span>
                    <strong style={{ fontWeight: 700, fontSize: 14.5 }}>{se.topic || "수업"}</strong>
                  </div>
                  <div style={{ fontSize: 12, color: "var(--ci-muted)", marginTop: 3 }}>
                    출석 <b style={{ color: "var(--ci-ok)" }}>{st.present}</b> · 지각 <b style={{ color: "var(--ci-amber, #c98a00)" }}>{st.late}</b> · 결석 <b style={{ color: "var(--ci-bad)" }}>{st.absent}</b>
                    {st.unmarked > 0 && <span> · 미체크 {st.unmarked}</span>} · 출석률 {st.rate}%
                  </div>
                </div>
                <button className="ci-act sm" onClick={() => setOpenSe(open ? null : se.id)}><Icon name={open ? "chevronDown" : "edit"} size={11} /> {open ? "접기" : "체크"}</button>
                <button className="ci-act sm danger" onClick={() => delSe(se.id)}><Icon name="trash" size={11} /></button>
              </div>

              {open && (
                <div style={{ padding: "4px 18px 16px", background: "var(--ci-bg)" }}>
                  <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 12, color: "var(--ci-muted)", alignSelf: "center", marginRight: 4 }}>빠른 지정:</span>
                    <button className="ci-act sm" onClick={() => markAll(se.id, "P")}>전체 출석</button>
                    <button className="ci-act sm" onClick={() => markAll(se.id, "A")}>전체 결석</button>
                  </div>
                  <div style={{ display: "grid", gap: 6 }}>
                    {roster.map((r) => {
                      const cur = se.marks[r.id] || "";
                      return (
                        <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 10px", background: "var(--ci-paper)", borderRadius: 8, border: "1px solid var(--ci-line)" }}>
                          <span className="avatar avatar-sm" style={{ background: "var(--ci-bg-2)", color: "var(--ci-navy)", fontWeight: 800 }}>{r.initials}</span>
                          <strong style={{ fontWeight: 700, fontSize: 14, flex: 1 }}>{r.name}</strong>
                          <div style={{ display: "inline-flex", gap: 4 }}>
                            {ATT_MARKS.map(([k, ko]) => (
                              <button key={k} onClick={() => setMark(se.id, r.id, k)} style={{
                                padding: "5px 12px", borderRadius: 6, fontSize: 12.5, fontWeight: 800, cursor: "pointer",
                                border: "1px solid " + (cur === k ? "var(--ci-navy)" : "var(--ci-line)"),
                                background: cur === k ? "var(--ci-navy)" : "var(--ci-paper)",
                                color: cur === k ? "#fff" : "var(--ci-muted)",
                              }}>{ko}</button>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <p style={{ fontSize: 12, color: "var(--ci-muted)", margin: "10px 0 0" }}>· 체크 즉시 저장되어 학생별 누적 출석률·「출결 관리」 탭에 반영됩니다.</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── 과제 배포 폼 ────────────────────────────────────────────────────
function AssignForm({ classId, onDone, onCancel }) {
  const { showToast } = useApp();
  const [f, setF] = useStCls({ type: "homework", title: "", detail: "", due: "" });
  const up = (k, v) => setF((x) => ({ ...x, [k]: v }));
  const save = () => {
    if (!f.title.trim()) { showToast("제목을 입력하세요"); return; }
    window.createAssignment({ classId, type: f.type, title: f.title.trim(), detail: f.detail.trim(), due: f.due.trim() });
    const c = window.findClass(classId);
    showToast(c.name + " 학생 " + c.studentIds.length + "명에게 배포되었습니다");
    onDone();
  };
  return (
    <div style={{ padding: 18, background: "var(--ci-bg)", borderTop: "1px solid var(--ci-line)" }}>
      <div style={{ display: "grid", gridTemplateColumns: "120px 1fr 180px", gap: 10, marginBottom: 10 }}>
        <select value={f.type} onChange={(e) => up("type", e.target.value)} style={inSt}><option value="homework">과제</option><option value="exam">시험</option></select>
        <input value={f.title} onChange={(e) => up("title", e.target.value)} placeholder="제목 (예: 도함수 워크북 5장)" style={inSt} autoFocus />
        <input value={f.due} onChange={(e) => up("due", e.target.value)} placeholder="마감 (예: 6.24 23:59)" style={inSt} />
      </div>
      <input value={f.detail} onChange={(e) => up("detail", e.target.value)} placeholder="안내 (선택) — 범위·제출 방법 등" style={{ ...inSt, marginBottom: 10 }} />
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <button className="ci-act" onClick={onCancel}>취소</button>
        <button className="ci-act navy" onClick={save}><Icon name="check" size={13} /> 반 전체에 배포</button>
      </div>
    </div>
  );
}

// ── 제출 체크·채점 ──────────────────────────────────────────────────
function AssignmentCheck({ asgId, onBack }) {
  const [, force] = useStCls(0);
  const a = window.listAssignments().find((x) => x.id === asgId);
  if (!a) return <div className="ci-card ci-card-pad">과제를 찾을 수 없습니다. <button className="ci-act" onClick={onBack}>뒤로</button></div>;
  const cls = window.findClass(a.classId) || { name: "반" };
  const roster = window.classRoster(a.classId);
  const st = window.asgStats(a);

  const setStatus = (sid, status) => { window.updateSubmission(asgId, sid, { status }); force((n) => n + 1); };
  const setScore = (sid, score) => { window.updateSubmission(asgId, sid, { score: score === "" ? null : Number(score), status: "graded" }); force((n) => n + 1); };
  const setComment = (sid, comment) => { window.updateSubmission(asgId, sid, { comment }); force((n) => n + 1); };

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <CiHead title={a.title} api={(a.type === "exam" ? "시험" : "과제") + " · " + cls.name}
        sub={"제출 " + st.submitted + "/" + st.total + " · 채점완료 " + st.graded + (a.due ? " · 마감 " + a.due : "")}
        action={<button className="ci-act" onClick={onBack}><Icon name="arrowLeft" size={13} /> 반 관리</button>} />
      <div className="ci-card" style={{ overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table className="ci-table">
            <thead><tr><th>학생</th><th style={{ textAlign: "center" }}>제출 상태</th><th style={{ width: 90, textAlign: "center" }}>점수</th><th style={{ minWidth: 220 }}>코멘트</th></tr></thead>
            <tbody>
              {roster.map((r) => {
                const sub = a.submissions[r.id] || { status: "pending", score: null, comment: "" };
                return (
                  <tr key={r.id}>
                    <td><div style={{ display: "flex", alignItems: "center", gap: 9 }}><span className="avatar avatar-sm" style={{ background: "var(--ci-bg-2)", color: "var(--ci-navy)", fontWeight: 800 }}>{r.initials}</span><strong style={{ fontWeight: 700 }}>{r.name}</strong></div></td>
                    <td style={{ textAlign: "center" }}>
                      <div style={{ display: "inline-flex", gap: 4 }}>
                        {[["pending", "미제출"], ["submitted", "제출"], ["graded", "채점"]].map(([k, ko]) => (
                          <button key={k} onClick={() => setStatus(r.id, k)} style={{
                            padding: "5px 9px", borderRadius: 6, fontSize: 11.5, fontWeight: 700, cursor: "pointer",
                            border: "1px solid " + (sub.status === k ? "var(--ci-navy)" : "var(--ci-line)"),
                            background: sub.status === k ? "var(--ci-navy)" : "var(--ci-paper)",
                            color: sub.status === k ? "#fff" : "var(--ci-muted)",
                          }}>{ko}</button>
                        ))}
                      </div>
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <input value={sub.score == null ? "" : sub.score} onChange={(e) => setScore(r.id, e.target.value.replace(/[^0-9]/g, ""))} placeholder="—"
                        style={{ width: 56, height: 34, borderRadius: 6, border: "1px solid var(--ci-line)", textAlign: "center", fontSize: 14, fontFamily: "var(--font-en)" }} maxLength={3} />
                    </td>
                    <td>
                      <input value={sub.comment || ""} onChange={(e) => setComment(r.id, e.target.value)} placeholder="학생에게 보일 코멘트"
                        style={{ width: "100%", height: 34, borderRadius: 6, border: "1px solid var(--ci-line)", padding: "0 10px", fontSize: 13, fontFamily: "var(--font-kr)" }} />
                    </td>
                  </tr>
                );
              })}
              {roster.length === 0 && <tr><td colSpan={4} style={{ padding: 24, textAlign: "center", color: "var(--ci-muted)" }}>이 반에 학생이 없습니다</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
      <p style={{ fontSize: 12.5, color: "var(--ci-muted)", lineHeight: 1.7, margin: 0 }}>
        · 제출 상태·점수·코멘트는 입력 즉시 저장되어 <strong>해당 학생의 과제·성적 화면에 반영</strong>됩니다.<br />
        · 점수를 입력하면 자동으로 「채점완료」로 표시됩니다.
      </p>
    </div>
  );
}

Object.assign(window, { ClassManager });
