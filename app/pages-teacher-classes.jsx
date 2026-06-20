/* global React, Icon, CiHead, useApp, findCourse */
// ──────────────────────────────────────────────────────────────────
//  선생님 — 반(Class) 관리
//   ClassIn 수업(class)을 그대로 반으로 가져와, 반 단위로:
//   · 학생 명단 확인  · 과제/시험 배포(반 전체에 자동)  · 제출 체크·채점·코멘트
// ──────────────────────────────────────────────────────────────────
const { useState: useStCls } = React;

const SUB_STATUS = {
  pending:   { label: "미제출", cls: "warn" },
  submitted: { label: "제출",   cls: "navy" },
  graded:    { label: "채점완료", cls: "ok" },
};

function ClassManager() {
  const classes = window.TEACHER_CLASSES || [];
  const [classId, setClassId] = useStCls(classes[0] ? classes[0].id : null);
  const [openAsg, setOpenAsg] = useStCls(null);   // assignment id being checked
  const [adding, setAdding] = useStCls(false);
  const [, force] = useStCls(0);
  const refresh = () => force((n) => n + 1);

  const cls = window.findClass(classId);
  const roster = window.classRoster(classId);
  const assignments = window.listAssignments(classId);

  if (openAsg) return <AssignmentCheck asgId={openAsg} onBack={() => { setOpenAsg(null); refresh(); }} />;

  return (
    <div style={{ display: "grid", gap: 18 }}>
      <CiHead title="반 관리" api="ClassIn · Classroom (class)"
        sub="ClassIn에서 묶은 수업(반)을 그대로 가져옵니다 · 반을 골라 과제를 배포하고 제출을 체크하세요" />

      {/* 반 선택 */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        {classes.map((c) => (
          <button key={c.id} onClick={() => { setClassId(c.id); setAdding(false); }} className={"ci-act" + (c.id === classId ? " navy" : "")} style={{ height: 40 }}>
            <Icon name="users" size={13} /> {c.name} <span style={{ opacity: 0.7 }}>· {c.studentIds.length}명</span>
          </button>
        ))}
      </div>

      {cls && (
        <>
          {/* 반 정보 + 동기화 배지 */}
          <div className="ci-card ci-card-pad" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontWeight: 900, fontSize: 18, letterSpacing: "-0.03em" }}>{cls.name}</div>
              <div style={{ fontSize: 13, color: "var(--ci-muted)", marginTop: 3 }}>{findCourse(cls.courseId)?.title} · {cls.schedule} · 학생 {cls.studentIds.length}명</div>
            </div>
            <span className="ci-badge ok" style={{ fontSize: 10.5 }}><Icon name="check" size={10} /> ClassIn 동기화됨 · {cls.classinId}</span>
          </div>

          {/* 과제/시험 배포 목록 */}
          <div className="ci-card" style={{ overflow: "hidden" }}>
            <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--ci-line)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontWeight: 900, fontSize: 15 }}>이 반에 배포한 과제 <span style={{ color: "var(--ci-muted)", fontWeight: 600, fontSize: 13 }}>· {assignments.length}건</span></span>
              <button className="ci-act navy sm" onClick={() => setAdding((v) => !v)}><Icon name="plus" size={12} /> 과제 배포</button>
            </div>

            {adding && <AssignForm classId={classId} onDone={() => { setAdding(false); refresh(); }} onCancel={() => setAdding(false)} />}

            <div style={{ padding: assignments.length ? 0 : 28 }}>
              {assignments.length === 0 && <div style={{ textAlign: "center", color: "var(--ci-muted)", fontSize: 14 }}>아직 배포한 과제가 없습니다 · 「과제 배포」로 이 반 전체에 한 번에 내보세요</div>}
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
            <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--ci-line)", fontWeight: 900, fontSize: 15 }}>반 학생 명단 <span style={{ color: "var(--ci-muted)", fontWeight: 600, fontSize: 13 }}>· {roster.length}명</span></div>
            <div style={{ overflowX: "auto" }}>
              <table className="ci-table">
                <thead><tr><th>학생</th><th style={{ textAlign: "center" }}>출석률</th><th style={{ textAlign: "center" }}>과제 제출률</th><th style={{ textAlign: "center" }}>정기고사</th><th style={{ textAlign: "center" }}>상태</th></tr></thead>
                <tbody>
                  {roster.map((r) => {
                    const rm = window.riskMeta(r.risk);
                    return (
                      <tr key={r.id}>
                        <td><div style={{ display: "flex", alignItems: "center", gap: 9 }}><span className="avatar avatar-sm" style={{ background: "var(--ci-bg-2)", color: "var(--ci-navy)", fontWeight: 800 }}>{r.initials}</span><strong style={{ fontWeight: 700 }}>{r.name}</strong></div></td>
                        <td style={{ textAlign: "center", fontWeight: 700, color: r.attRate < 80 ? "var(--ci-bad)" : "inherit" }}>{r.attRate}%</td>
                        <td style={{ textAlign: "center", color: r.hwRate < 70 ? "var(--ci-bad)" : "inherit" }}>{r.hwRate}%</td>
                        <td style={{ textAlign: "center", fontWeight: 700 }}>{r.examAvg}</td>
                        <td style={{ textAlign: "center" }}><span className={"ci-badge " + rm.cls} style={{ fontSize: 9.5 }}>{rm.label}</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ── 과제 배포 폼 ────────────────────────────────────────────────────
function AssignForm({ classId, onDone, onCancel }) {
  const { showToast } = useApp();
  const [f, setF] = useStCls({ type: "homework", title: "", detail: "", due: "" });
  const up = (k, v) => setF((x) => ({ ...x, [k]: v }));
  const save = () => {
    if (!f.title.trim()) { showToast && showToast("제목을 입력하세요"); return; }
    window.createAssignment({ classId, type: f.type, title: f.title.trim(), detail: f.detail.trim(), due: f.due.trim() });
    const c = window.findClass(classId);
    showToast && showToast(c.name + " 학생 " + c.studentIds.length + "명에게 배포되었습니다");
    onDone();
  };
  const inSt = { width: "100%", height: 40, borderRadius: 8, border: "1px solid var(--ci-line)", padding: "0 12px", fontSize: 14, fontFamily: "var(--font-kr)" };
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
  const { showToast } = useApp();
  const [, force] = useStCls(0);
  const a = window.listAssignments().find((x) => x.id === asgId);
  if (!a) return <div className="ci-card ci-card-pad">과제를 찾을 수 없습니다. <button className="ci-act" onClick={onBack}>뒤로</button></div>;
  const cls = window.findClass(a.classId);
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
                const meta = SUB_STATUS[sub.status] || SUB_STATUS.pending;
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
