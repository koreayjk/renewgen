/* global React, HOMEWORK, findCourse, findInstructor, Icon, CiHead, useApp */
// ──────────────────────────────────────────────────────────────────
// ClassIn · Classroom API — Homework (과제 배포·수집·채점)
//   · HomeworkPanel   학생: 내 과제 목록 · 제출 · 점수/피드백 확인
//   · HomeworkManager 관리자: 과제 배포 · 제출률 · 채점
// ──────────────────────────────────────────────────────────────────
const { useState: useStHw } = React;

const HW_STATUS = {
  pending:   { label: "미제출",     cls: "warn" },
  submitted: { label: "채점 대기",  cls: "navy" },
  graded:    { label: "채점 완료",  cls: "ok" },
  late:      { label: "지각 제출",  cls: "bad" },
};
const HW_TYPE_ICON = { 문제풀이: "edit", 첨삭: "chat", 퀴즈: "check" };

function hwScorePct(h) { return h.myScore == null ? null : Math.round((h.myScore / h.maxScore) * 100); }

// ── 학생 과제 패널 ──────────────────────────────────────────────────
function HomeworkPanel({ student }) {
  const [items, setItems] = useStHw(() => (window.HOMEWORK || []).map((h) => ({ ...h })));
  const { showToast } = useApp();

  const submit = (id) => {
    setItems((xs) => xs.map((h) => h.id === id
      ? { ...h, myStatus: "submitted", submittedAt: "방금 제출", submitted: h.submitted + 1 }
      : h));
    showToast && showToast("과제를 제출했습니다 · 채점 후 점수가 표시됩니다");
  };

  const order = { pending: 0, late: 1, submitted: 2, graded: 3 };
  const sorted = items.slice().sort((a, b) => (order[a.myStatus] - order[b.myStatus]));

  const activeN = items.filter((h) => h.myStatus === "pending" || h.myStatus === "late").length;
  const gradedItems = items.filter((h) => h.myStatus === "graded");
  const avg = gradedItems.length
    ? Math.round(gradedItems.reduce((s, h) => s + hwScorePct(h), 0) / gradedItems.length) : null;

  return (
    <div>
      <CiHead title="과제" api="Classroom · Homework"
        sub="강사가 낸 과제를 제출하고, 채점된 점수·피드백을 확인하세요" />

      <div className="ci-kpis" style={{ marginBottom: 18, gridTemplateColumns: "repeat(3, 1fr)" }}>
        <div className="ci-kpi accent"><div className="lab"><span className="ico"><Icon name="edit" size={16} /></span> 진행 중</div><div className="num">{activeN}<small>건</small></div><div className="sub">마감 전 제출 필요</div></div>
        <div className="ci-kpi"><div className="lab"><span className="ico"><Icon name="check" size={16} /></span> 채점 완료</div><div className="num">{gradedItems.length}<small>건</small></div><div className="sub">점수 확인 가능</div></div>
        <div className="ci-kpi"><div className="lab"><span className="ico"><Icon name="trophy" size={16} /></span> 평균 점수</div><div className="num">{avg == null ? "—" : avg}<small>{avg == null ? "" : "점"}</small></div><div className="sub">채점된 과제 기준</div></div>
      </div>

      <div style={{ display: "grid", gap: 12 }}>
        {sorted.map((h) => {
          const course = findCourse(h.courseId);
          const ins = course ? findInstructor(course.instructor) : null;
          const st = HW_STATUS[h.myStatus] || HW_STATUS.pending;
          const pct = hwScorePct(h);
          return (
            <div key={h.id} className="ci-card" style={{ padding: 18, display: "grid", gridTemplateColumns: "1fr auto", gap: 20, alignItems: "center" }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 6 }}>
                  <span className="ci-badge navy" style={{ fontSize: 10.5 }}><Icon name={HW_TYPE_ICON[h.type] || "edit"} size={10} /> {h.type}</span>
                  <span className={"ci-badge " + st.cls} style={{ fontSize: 10.5 }}>{st.label}</span>
                  <span style={{ fontSize: 12, color: "var(--ci-muted)" }}>{course?.title} · {ins?.name}</span>
                </div>
                <strong style={{ fontWeight: 900, fontSize: 17, letterSpacing: "-0.03em", display: "block" }}>{h.title}</strong>
                <div style={{ display: "flex", gap: 16, marginTop: 6, fontSize: 12.5, color: "var(--ci-muted)", flexWrap: "wrap" }}>
                  <span><Icon name="clock" size={12} /> 마감 {h.due}</span>
                  {h.submittedAt && <span><Icon name="check" size={12} /> 제출 {h.submittedAt}</span>}
                  {h.attachments && h.attachments.length > 0 && (
                    <span style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
                      <Icon name="folder" size={12} /> {h.attachments.map((a) => a.name).join(", ")}
                    </span>
                  )}
                </div>
                {h.myStatus === "graded" && h.feedback && (
                  <div style={{ marginTop: 10, padding: "10px 12px", background: "var(--ci-bg-2)", borderRadius: 8, fontSize: 13, color: "var(--ci-ink)", lineHeight: 1.6 }}>
                    <strong style={{ fontWeight: 800, color: "var(--ci-navy)" }}>{ins?.name} 강사 피드백 · </strong>{h.feedback}
                  </div>
                )}
              </div>

              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 10 }}>
                {h.myStatus === "graded" ? (
                  <div style={{ textAlign: "center" }}>
                    <div className="ci-ring" style={{ "--p": pct }}><span className="val">{h.myScore}</span></div>
                    <div style={{ fontSize: 11, color: "var(--ci-muted)", marginTop: 6, fontWeight: 700 }}>/ {h.maxScore}점</div>
                  </div>
                ) : h.myStatus === "submitted" ? (
                  <span className="ci-badge navy" style={{ height: 36, padding: "0 14px" }}><Icon name="clock" size={12} /> 채점 대기 중</span>
                ) : (
                  <>
                    <label className="ci-act navy" style={{ cursor: "pointer", height: 38 }}>
                      <Icon name="upload" size={13} /> 과제 제출
                      <input type="file" style={{ display: "none" }} onChange={() => submit(h.id)} />
                    </label>
                    <button className="ci-act" style={{ height: 32 }} onClick={() => submit(h.id)}>제출 완료 표시</button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <p style={{ marginTop: 16, fontSize: 12.5, color: "var(--ci-muted)", lineHeight: 1.7 }}>
        · 과제는 ClassIn <strong>Classroom · Homework</strong> 기능으로 강사가 배포합니다 · 제출본은 강사 화면에서 채점됩니다.<br />
        · 마감 후 제출하면 <strong>지각 제출</strong>로 표시되며, 채점 시 강사가 감점 여부를 결정합니다.
      </p>
    </div>
  );
}

// ── 관리자 과제 매니저 ──────────────────────────────────────────────
function HomeworkManager() {
  const [items, setItems] = useStHw(() => (window.HOMEWORK || []).map((h) => ({ ...h })));
  const [adding, setAdding] = useStHw(false);
  const { showToast } = useApp();

  const grade = (id) => {
    setItems((xs) => xs.map((h) => h.id === id
      ? { ...h, myStatus: "graded", myScore: h.myScore == null ? Math.round(h.maxScore * 0.9) : h.myScore }
      : h));
    showToast && showToast("채점 결과가 학생에게 전송되었습니다");
  };

  const totalSubmitted = items.reduce((s, h) => s + h.submitted, 0);
  const totalSlots = items.reduce((s, h) => s + h.total, 0);
  const pendingGrade = items.filter((h) => h.myStatus === "submitted").length;

  return (
    <div>
      <CiHead title="과제 관리" api="Classroom · Homework"
        sub="과제를 배포하고 제출률을 모니터링하며 채점합니다 · 채점 결과는 학생 대시보드에 자동 반영"
        action={<button className="ci-act navy" onClick={() => setAdding((v) => !v)}><Icon name="plus" size={13} /> 과제 내기</button>} />

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
        <span className="ci-badge neutral"><Icon name="edit" size={11} /> 전체 과제 {items.length}</span>
        <span className="ci-badge ok"><Icon name="check" size={11} /> 제출 {totalSubmitted} / {totalSlots}</span>
        <span className="ci-badge warn"><Icon name="clock" size={11} /> 채점 대기 {pendingGrade}</span>
      </div>

      {adding && (
        <div className="ci-card ci-card-pad" style={{ marginBottom: 16, border: "1.5px solid var(--ci-navy)" }}>
          <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 6 }}>새 과제 배포</div>
          <p style={{ fontSize: 12.5, color: "var(--ci-muted)", margin: "0 0 12px" }}>강좌·유형·마감일을 정하고 첨부파일을 올리면 해당 코스 학생 전원에게 배포됩니다.</p>
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button className="ci-act" onClick={() => setAdding(false)}>취소</button>
            <button className="ci-act navy" onClick={() => { setAdding(false); showToast && showToast("과제가 배포되었습니다 (데모)"); }}><Icon name="check" size={13} /> 배포</button>
          </div>
        </div>
      )}

      <div className="ci-card" style={{ overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table className="ci-table">
            <thead>
              <tr><th>과제</th><th>강좌</th><th>유형</th><th>마감</th><th style={{ minWidth: 160 }}>제출률</th><th style={{ textAlign: "center" }}>작업</th></tr>
            </thead>
            <tbody>
              {items.map((h) => {
                const course = findCourse(h.courseId);
                const rate = Math.round((h.submitted / h.total) * 100);
                return (
                  <tr key={h.id}>
                    <td><strong style={{ fontWeight: 800 }}>{h.title}</strong></td>
                    <td style={{ color: "var(--ci-muted)" }}>{course?.title}</td>
                    <td><span className="ci-badge navy" style={{ fontSize: 10.5 }}>{h.type}</span></td>
                    <td className="ci-mono" style={{ color: "var(--ci-muted)", fontSize: 12 }}>{h.due}</td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ flex: 1, height: 8, background: "var(--ci-bg-2)", borderRadius: 4, overflow: "hidden", minWidth: 80 }}>
                          <i style={{ display: "block", height: "100%", width: rate + "%", background: "var(--ci-navy)" }} />
                        </span>
                        <span className="ci-mono" style={{ fontSize: 12, color: "var(--ci-muted)" }}>{h.submitted}/{h.total}</span>
                      </div>
                    </td>
                    <td style={{ textAlign: "center" }}>
                      {h.myStatus === "submitted"
                        ? <button className="ci-act navy sm" onClick={() => grade(h.id)}><Icon name="edit" size={11} /> 채점</button>
                        : h.myStatus === "graded"
                          ? <span className="ci-badge ok" style={{ fontSize: 10.5 }}><Icon name="check" size={10} /> 채점완료</span>
                          : <span className="ci-badge warn" style={{ fontSize: 10.5 }}>제출 대기</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { HomeworkPanel, HomeworkManager });
