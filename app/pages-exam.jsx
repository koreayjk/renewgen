/* global React, Icon, CiHead, findCourse, findInstructor, useApp */
// ──────────────────────────────────────────────────────────────────
//  학생 시험 — 목록 · 응시(ExamRunner) · 결과(ExamResult)
//  우리 홈페이지에서 직접 시험을 보고 즉시 채점·해설·오답노트 제공
// ──────────────────────────────────────────────────────────────────
const { useState: useStEx, useEffect: useEfEx, useRef: useRfEx, useMemo: useMemoEx } = React;

const EX_STATUS = {
  upcoming:  { label: "응시 예정",  cls: "neutral" },
  open:      { label: "응시 가능",  cls: "ok" },
  submitted: { label: "채점 대기",  cls: "navy" },
  graded:    { label: "채점 완료",  cls: "ok" },
  closed:    { label: "마감",       cls: "warn" },
};
const QTYPE_KO = { mc: "객관식", ox: "OX", short: "단답형", essay: "서술형" };

function shuffled(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

// ── 학생 시험 패널(목록/라우팅) ─────────────────────────────────────
function ExamPanel() {
  const [view, setView] = useStEx({ mode: "list" });
  const { user } = useApp();
  const [, setSynced] = useStEx(0);
  useEfEx(() => {
    if (user && window.pullExamData) window.pullExamData(user).then(() => setSynced((s) => s + 1)).catch(() => {});
  }, [user]);
  if (view.mode === "take") {
    const ex = window.findExam(view.examId);
    if (ex && ex.format === "pdf_omr" && window.OmrRunner)
      return <window.OmrRunner examId={view.examId} onDone={() => setView({ mode: "result", examId: view.examId })} onExit={() => setView({ mode: "list" })} />;
    return <ExamRunner examId={view.examId} onDone={() => setView({ mode: "result", examId: view.examId })} onExit={() => setView({ mode: "list" })} />;
  }
  if (view.mode === "result") {
    const ex = window.findExam(view.examId);
    if (ex && ex.format === "pdf_omr" && window.OmrResult)
      return <window.OmrResult examId={view.examId} onBack={() => setView({ mode: "list" })} onRetake={() => setView({ mode: "take", examId: view.examId })} />;
    return <ExamResult examId={view.examId} onBack={() => setView({ mode: "list" })} onRetake={() => setView({ mode: "take", examId: view.examId })} />;
  }
  return window.ExamCenter
    ? <window.ExamCenter onTake={(id) => setView({ mode: "take", examId: id })} onResult={(id) => setView({ mode: "result", examId: id })} />
    : <ExamList onTake={(id) => setView({ mode: "take", examId: id })} onResult={(id) => setView({ mode: "result", examId: id })} />;
}

// ── 목록 ────────────────────────────────────────────────────────────
function ExamList({ onTake, onResult }) {
  const exams = window.getExams();
  const rows = exams.map((e) => ({ e, status: window.examStatus(e), at: window.getAttempt(e.id) }));
  const order = { open: 0, upcoming: 1, submitted: 2, closed: 3, graded: 4 };
  rows.sort((a, b) => order[a.status] - order[b.status]);

  const doneRows = rows.filter((r) => r.status === "graded");
  const avg = doneRows.length
    ? Math.round(doneRows.reduce((s, r) => s + (window.finalScore(r.e, r.at) / window.examTotal(r.e)) * 100, 0) / doneRows.length)
    : null;
  const openN = rows.filter((r) => r.status === "open").length;

  return (
    <div>
      <CiHead title="시험" api="Renewjen Exam"
        sub="홈페이지에서 바로 응시하고 즉시 채점·해설·오답노트를 받습니다" />

      <div className="ci-kpis" style={{ marginBottom: 18, gridTemplateColumns: "repeat(3, 1fr)" }}>
        <div className="ci-kpi accent"><div className="lab"><span className="ico"><Icon name="edit" size={16} /></span> 응시 가능</div><div className="num">{openN}<small>개</small></div><div className="sub">마감 전 응시</div></div>
        <div className="ci-kpi"><div className="lab"><span className="ico"><Icon name="check" size={16} /></span> 응시 완료</div><div className="num">{doneRows.length}<small>개</small></div><div className="sub">결과 확인 가능</div></div>
        <div className="ci-kpi"><div className="lab"><span className="ico"><Icon name="trophy" size={16} /></span> 평균 점수</div><div className="num">{avg == null ? "—" : avg}<small>{avg == null ? "" : "점"}</small></div><div className="sub">100점 환산</div></div>
      </div>

      <div style={{ display: "grid", gap: 12 }}>
        {rows.map(({ e, status, at }) => {
          const course = findCourse(e.courseId);
          const ins = course ? findInstructor(course.instructor) : null;
          const st = EX_STATUS[status];
          const total = window.examTotal(e);
          const score = at && at.submittedAt ? window.finalScore(e, at) : null;
          const pct = score == null ? null : Math.round((score / total) * 100);
          return (
            <div key={e.id} className="ci-card" style={{ padding: 18, display: "grid", gridTemplateColumns: "1fr auto", gap: 20, alignItems: "center" }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 6 }}>
                  {e.type === "practice"
                    ? <span className="ci-badge neutral" style={{ fontSize: 10.5 }}>연습</span>
                    : <span className="ci-badge navy" style={{ fontSize: 10.5 }}>정식 시험</span>}
                  <span className={"ci-badge " + st.cls} style={{ fontSize: 10.5 }}>{st.label}</span>
                  <span style={{ fontSize: 12, color: "var(--ci-muted)" }}>{course?.title} · {ins?.name}</span>
                </div>
                <strong style={{ fontWeight: 900, fontSize: 17, letterSpacing: "-0.03em", display: "block" }}>{e.title}</strong>
                <div style={{ display: "flex", gap: 16, marginTop: 6, fontSize: 12.5, color: "var(--ci-muted)", flexWrap: "wrap" }}>
                  <span><Icon name="book" size={12} /> {window.examQCount(e)}문항 · {total}점</span>
                  {e.format === "pdf_omr" && <span><Icon name="folder" size={12} /> PDF+OMR</span>}
                  <span><Icon name="clock" size={12} /> {e.durationMin ? e.durationMin + "분" : "시간 제한 없음"}</span>
                  {e.dueAt && <span>마감 {new Date(e.dueAt).toLocaleDateString("ko-KR", { month: "short", day: "numeric" })}</span>}
                  {status === "submitted" && <span style={{ color: "var(--ci-navy)", fontWeight: 700 }}>서술형 채점 대기 중</span>}
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                {pct != null && status === "graded" && (
                  <div style={{ textAlign: "center" }}>
                    <div className="ci-ring" style={{ "--p": pct }}><span className="val">{score}</span></div>
                    <div style={{ fontSize: 11, color: "var(--ci-muted)", marginTop: 6, fontWeight: 700 }}>/ {total}점</div>
                  </div>
                )}
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {status === "open" && <button className="ci-act navy" onClick={() => onTake(e.id)}><Icon name="play" size={13} /> 시험 시작</button>}
                  {status === "upcoming" && <button className="ci-act" disabled style={{ opacity: 0.5 }}>응시 예정</button>}
                  {status === "closed" && !at && <button className="ci-act" disabled style={{ opacity: 0.5 }}>마감됨</button>}
                  {(status === "graded" || status === "submitted") && <button className="ci-act" onClick={() => onResult(e.id)}><Icon name="arrow" size={13} /> 결과 보기</button>}
                  {e.type === "practice" && status === "open" && at && <button className="ci-act" onClick={() => onResult(e.id)}>지난 결과</button>}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <p style={{ marginTop: 16, fontSize: 12.5, color: "var(--ci-muted)", lineHeight: 1.7 }}>
        · 시험은 <strong>리뉴젠 홈페이지에서 직접</strong> 응시합니다 · 객관식·단답·OX는 제출 즉시 자동 채점, 서술형은 강사 채점 후 점수가 확정됩니다.<br />
        · 정식 시험은 <strong>1회</strong>만 응시할 수 있으며, 응시 중 다른 창으로 이동하면 기록이 남습니다.
      </p>
    </div>
  );
}

// ── 응시 화면 ───────────────────────────────────────────────────────
function ExamRunner({ examId, onDone, onExit }) {
  const exam = window.findExam(examId);
  const { showToast } = useApp();
  // 셔플된 문항/보기 순서를 응시 동안 고정
  const layout = useMemoEx(() => {
    const qs = exam.shuffle ? shuffled(exam.questions) : exam.questions.slice();
    return qs.map((q) => {
      if (q.type === "mc" && exam.shuffle) {
        const idx = shuffled(q.choices.map((_, i) => i));
        return { q, choiceOrder: idx };
      }
      return { q, choiceOrder: q.choices ? q.choices.map((_, i) => i) : null };
    });
  }, [examId]);

  const [answers, setAnswers] = useStEx({});
  const [cur, setCur] = useStEx(0);
  const [left, setLeft] = useStEx(exam.durationMin ? exam.durationMin * 60 : null);
  const [leaveCount, setLeaveCount] = useStEx(0);
  const [confirming, setConfirming] = useStEx(false);
  const submittedRef = useRfEx(false);

  // 타이머
  useEfEx(() => {
    if (left == null) return;
    if (left <= 0) { doSubmit(); return; }
    const t = setTimeout(() => setLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [left]);

  // 화면 이탈 감지(부정행위)
  useEfEx(() => {
    const onHide = () => { if (document.hidden && !submittedRef.current) { setLeaveCount((c) => c + 1); showToast && showToast("⚠️ 시험 중 화면을 벗어났습니다 — 기록됩니다"); } };
    document.addEventListener("visibilitychange", onHide);
    return () => document.removeEventListener("visibilitychange", onHide);
  }, []);

  const setA = (qid, v) => setAnswers((a) => ({ ...a, [qid]: v }));
  const answeredN = layout.filter(({ q }) => answers[q.id] != null && answers[q.id] !== "").length;

  function doSubmit() {
    if (submittedRef.current) return;
    submittedRef.current = true;
    const g = window.autoGrade(exam, answers);
    window.saveAttempt(examId, {
      answers, submittedAt: new Date().toLocaleString("ko-KR", { dateStyle: "medium", timeStyle: "short" }),
      autoScore: g.autoScore, autoMax: g.autoMax, manualScores: {}, manualFeedback: {},
      graded: !g.needsManual, leaveCount,
    });
    onDone();
  }

  const mm = left == null ? null : String(Math.floor(left / 60)).padStart(2, "0");
  const ss = left == null ? null : String(left % 60).padStart(2, "0");
  const lowTime = left != null && left <= 60;

  const { q, choiceOrder } = layout[cur];

  return (
    <div>
      {/* 상단 바: 타이머 · 진행 */}
      <div className="ci-card" style={{ padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, marginBottom: 16, flexWrap: "wrap", position: "sticky", top: 8, zIndex: 5 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 900, fontSize: 16, letterSpacing: "-0.02em" }}>{exam.title}</div>
          <div style={{ fontSize: 12, color: "var(--ci-muted)" }}>{answeredN} / {layout.length} 문항 응답 · {window.examTotal(exam)}점 만점</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {leaveCount > 0 && <span className="ci-badge bad" style={{ fontSize: 10.5 }}>화면 이탈 {leaveCount}회</span>}
          {left != null && (
            <span style={{ fontFamily: "var(--font-en)", fontWeight: 800, fontSize: 22, letterSpacing: "0.02em", color: lowTime ? "var(--ci-bad)" : "var(--ci-navy)", background: lowTime ? "rgba(200,40,40,0.08)" : "var(--ci-bg-2)", padding: "4px 12px", borderRadius: 8 }}>
              <Icon name="clock" size={14} /> {mm}:{ss}
            </span>
          )}
          <button className="ci-act navy" onClick={() => setConfirming(true)}><Icon name="check" size={13} /> 제출</button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 220px", gap: 16, alignItems: "start" }}>
        {/* 문항 */}
        <div className="ci-card ci-card-pad">
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <span style={{ width: 34, height: 34, borderRadius: "50%", background: "var(--ci-navy)", color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 14 }}>{cur + 1}</span>
            <span className="ci-badge neutral" style={{ fontSize: 10.5 }}>{QTYPE_KO[q.type]}</span>
            <span className="ci-badge navy" style={{ fontSize: 10.5 }}>{q.points}점</span>
            {q.unit && <span style={{ fontSize: 12, color: "var(--ci-muted)" }}>{q.unit}</span>}
          </div>
          <div style={{ fontSize: 17, fontWeight: 700, lineHeight: 1.6, letterSpacing: "-0.01em", whiteSpace: "pre-wrap" }}>{q.stem}</div>

          <div style={{ marginTop: 18, display: "grid", gap: 10 }}>
            {q.type === "mc" && choiceOrder.map((ci, i) => (
              <label key={ci} className="ci-opt" style={optStyle(answers[q.id] === ci)}>
                <span style={optKey(answers[q.id] === ci)}>{String.fromCharCode(9312 + i)}</span>
                <input type="radio" name={q.id} checked={answers[q.id] === ci} onChange={() => setA(q.id, ci)} style={{ display: "none" }} />
                <span>{q.choices[ci]}</span>
              </label>
            ))}
            {q.type === "ox" && [["O", true], ["X", false]].map(([lab, val]) => (
              <label key={lab} className="ci-opt" style={optStyle(answers[q.id] === val)}>
                <span style={optKey(answers[q.id] === val)}>{lab}</span>
                <input type="radio" name={q.id} checked={answers[q.id] === val} onChange={() => setA(q.id, val)} style={{ display: "none" }} />
                <span>{lab === "O" ? "맞다 (참)" : "아니다 (거짓)"}</span>
              </label>
            ))}
            {q.type === "short" && (
              <input value={answers[q.id] || ""} onChange={(e) => setA(q.id, e.target.value)} placeholder="답을 입력하세요"
                style={{ width: "100%", height: 46, borderRadius: 10, border: "1.5px solid var(--ci-line)", padding: "0 14px", fontSize: 15, fontFamily: "var(--font-kr)" }} />
            )}
            {q.type === "essay" && (
              <textarea value={answers[q.id] || ""} onChange={(e) => setA(q.id, e.target.value)} placeholder="서술형 답안을 작성하세요 (강사 채점)"
                rows={6} style={{ width: "100%", borderRadius: 10, border: "1.5px solid var(--ci-line)", padding: 14, fontSize: 15, fontFamily: "var(--font-kr)", lineHeight: 1.6, resize: "vertical" }} />
            )}
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 22 }}>
            <button className="ci-act" onClick={() => setCur((c) => Math.max(0, c - 1))} disabled={cur === 0} style={{ opacity: cur === 0 ? 0.4 : 1 }}><Icon name="arrowLeft" size={13} /> 이전</button>
            {cur < layout.length - 1
              ? <button className="ci-act navy" onClick={() => setCur((c) => c + 1)}>다음 <Icon name="arrow" size={13} /></button>
              : <button className="ci-act navy" onClick={() => setConfirming(true)}><Icon name="check" size={13} /> 제출하기</button>}
          </div>
        </div>

        {/* 문항 네비게이션 */}
        <div className="ci-card ci-card-pad">
          <div style={{ fontSize: 12, fontWeight: 800, color: "var(--ci-muted)", marginBottom: 10 }}>문항 이동</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 6 }}>
            {layout.map(({ q: qq }, i) => {
              const done = answers[qq.id] != null && answers[qq.id] !== "";
              const isCur = i === cur;
              return (
                <button key={qq.id} onClick={() => setCur(i)} style={{
                  height: 34, borderRadius: 8, fontWeight: 800, fontSize: 13, cursor: "pointer",
                  border: isCur ? "2px solid var(--ci-navy)" : "1px solid var(--ci-line)",
                  background: done ? "var(--ci-navy)" : "var(--ci-paper)",
                  color: done ? "#fff" : "var(--ci-ink)",
                }}>{i + 1}</button>
              );
            })}
          </div>
          <div style={{ marginTop: 14, fontSize: 11.5, color: "var(--ci-muted)", lineHeight: 1.6 }}>
            <div><span style={{ display: "inline-block", width: 10, height: 10, background: "var(--ci-navy)", borderRadius: 3, marginRight: 6 }} /> 응답함</div>
            <div style={{ marginTop: 4 }}><span style={{ display: "inline-block", width: 10, height: 10, background: "var(--ci-paper)", border: "1px solid var(--ci-line)", borderRadius: 3, marginRight: 6 }} /> 미응답</div>
          </div>
          <button className="ci-act" style={{ marginTop: 16, width: "100%", justifyContent: "center" }} onClick={onExit}>나가기 (저장 안 됨)</button>
        </div>
      </div>

      {confirming && (
        <div className="modal-backdrop" onClick={() => setConfirming(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,12,28,0.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }}>
          <div className="ci-card ci-card-pad" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 380, width: "90%" }}>
            <div style={{ fontWeight: 900, fontSize: 18, marginBottom: 8 }}>제출하시겠어요?</div>
            <p style={{ fontSize: 13.5, color: "var(--ci-muted)", lineHeight: 1.6, margin: "0 0 18px" }}>
              {layout.length - answeredN > 0 ? <>아직 <strong style={{ color: "var(--ci-bad)" }}>{layout.length - answeredN}문항</strong>이 비어 있습니다. </> : "모든 문항에 응답했습니다. "}
              제출 후에는 {exam.type === "practice" ? "다시 풀 수 있어요." : "수정할 수 없습니다."}
            </p>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button className="ci-act" onClick={() => setConfirming(false)}>계속 풀기</button>
              <button className="ci-act navy" onClick={doSubmit}><Icon name="check" size={13} /> 제출</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function optStyle(on) {
  return { display: "flex", alignItems: "center", gap: 12, padding: "13px 16px", borderRadius: 10, cursor: "pointer",
    border: on ? "1.5px solid var(--ci-navy)" : "1px solid var(--ci-line)", background: on ? "rgba(0,18,38,0.04)" : "var(--ci-paper)", fontSize: 15, transition: "all .12s" };
}
function optKey(on) {
  return { width: 28, height: 28, flexShrink: 0, borderRadius: "50%", display: "inline-flex", alignItems: "center", justifyContent: "center",
    fontWeight: 800, fontSize: 13, background: on ? "var(--ci-navy)" : "var(--ci-bg-2)", color: on ? "#fff" : "var(--ci-muted)" };
}

// ── 결과 화면 ───────────────────────────────────────────────────────
function ExamResult({ examId, onBack, onRetake }) {
  const exam = window.findExam(examId);
  const at = window.getAttempt(examId);
  if (!at) return <div className="ci-card ci-card-pad" style={{ textAlign: "center", padding: 48, color: "var(--ci-muted)" }}>응시 기록이 없습니다. <button className="ci-act" style={{ marginLeft: 8 }} onClick={onBack}>목록으로</button></div>;

  const total = window.examTotal(exam);
  const g = window.autoGrade(exam, at.answers);
  const ms = at.manualScores || {};
  const mf = at.manualFeedback || {};
  const score = window.finalScore(exam, at);
  const pct = Math.round((score / total) * 100);
  const grade = window.gradeOf(pct);
  const pctile = window.mockPercentile(pct);
  const pending = !at.graded;

  // 단원별 분석
  const byUnit = {};
  for (const q of exam.questions) {
    const u = q.unit || "기타";
    if (!byUnit[u]) byUnit[u] = { earned: 0, max: 0 };
    byUnit[u].max += q.points;
    byUnit[u].earned += (g.per[q.id] && !g.per[q.id].manual) ? g.per[q.id].earned : (Number(ms[q.id]) || 0);
  }
  const wrong = exam.questions.filter((q) => g.per[q.id] && g.per[q.id].correct === false);

  return (
    <div>
      <CiHead title={exam.title + " · 결과"} api="Renewjen Exam"
        sub={"제출 " + at.submittedAt + (at.leaveCount ? " · 화면 이탈 " + at.leaveCount + "회" : "")}
        action={<button className="ci-act" onClick={onBack}><Icon name="arrowLeft" size={13} /> 시험 목록</button>} />

      {pending && (
        <div className="ci-card ci-card-pad" style={{ marginBottom: 16, display: "flex", gap: 12, alignItems: "center", borderLeft: "4px solid var(--ci-navy)" }}>
          <Icon name="clock" size={18} />
          <div style={{ fontSize: 13.5 }}><strong>서술형 채점 대기 중</strong> — 자동채점 부분 점수만 우선 표시됩니다. 강사 채점이 끝나면 최종 점수가 확정됩니다.</div>
        </div>
      )}

      {/* 점수 요약 */}
      <div className="ci-card ci-card-pad" style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: 28, alignItems: "center", marginBottom: 16 }}>
        <div style={{ textAlign: "center" }}>
          <div className="ci-ring" style={{ "--p": pct, width: 120, height: 120 }}><span className="val" style={{ fontSize: 30 }}>{score}</span></div>
          <div style={{ fontSize: 12, color: "var(--ci-muted)", marginTop: 8, fontWeight: 700 }}>/ {total}점 ({pct}%)</div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
          <ResCell k="예상 등급" v={grade + "등급"} />
          <ResCell k="상위" v={pctile + "%"} />
          <ResCell k="정답 / 문항" v={exam.questions.filter((q) => g.per[q.id] && g.per[q.id].correct).length + " / " + exam.questions.length} />
        </div>
      </div>

      {/* 단원별 분석 */}
      <div className="ci-card ci-card-pad" style={{ marginBottom: 16 }}>
        <div style={{ fontWeight: 900, fontSize: 15, marginBottom: 14 }}>단원별 성취도</div>
        <div style={{ display: "grid", gap: 12 }}>
          {Object.entries(byUnit).map(([u, d]) => {
            const p = Math.round((d.earned / d.max) * 100);
            return (
              <div key={u}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 5 }}>
                  <span style={{ fontWeight: 700 }}>{u}</span>
                  <span className="ci-mono" style={{ color: "var(--ci-muted)" }}>{d.earned}/{d.max} · {p}%</span>
                </div>
                <div style={{ height: 8, background: "var(--ci-bg-2)", borderRadius: 4, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: p + "%", background: p >= 80 ? "var(--ci-ok)" : p >= 50 ? "var(--ci-navy)" : "var(--ci-bad)" }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 오답노트 */}
      {wrong.length > 0 && (
        <div className="ci-card ci-card-pad" style={{ marginBottom: 16, borderLeft: "4px solid var(--ci-bad)" }}>
          <div style={{ fontWeight: 900, fontSize: 15, marginBottom: 4 }}>오답노트 <span style={{ color: "var(--ci-bad)" }}>{wrong.length}</span></div>
          <div style={{ fontSize: 12.5, color: "var(--ci-muted)" }}>틀린 문항만 모았습니다 — 해설과 함께 복습하세요.</div>
        </div>
      )}

      {/* 문항별 리뷰 */}
      <div style={{ display: "grid", gap: 12 }}>
        {exam.questions.map((q, i) => {
          const per = g.per[q.id];
          const yourRaw = at.answers[q.id];
          const isEssay = q.type === "essay";
          const correct = per && per.correct;
          const earned = isEssay ? (Number(ms[q.id]) || (pending ? null : 0)) : per.earned;
          return (
            <div key={q.id} className="ci-card" style={{ padding: 18, borderLeft: "4px solid " + (isEssay ? "var(--ci-navy)" : correct ? "var(--ci-ok)" : "var(--ci-bad)") }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10, flexWrap: "wrap" }}>
                <span style={{ fontWeight: 800, fontSize: 14 }}>{i + 1}.</span>
                <span className="ci-badge neutral" style={{ fontSize: 10.5 }}>{QTYPE_KO[q.type]}</span>
                {isEssay
                  ? <span className="ci-badge navy" style={{ fontSize: 10.5 }}>{earned == null ? "채점 대기" : earned + "/" + q.points + "점"}</span>
                  : <span className={"ci-badge " + (correct ? "ok" : "bad")} style={{ fontSize: 10.5 }}>{correct ? "정답" : "오답"} · {earned}/{q.points}점</span>}
                {q.unit && <span style={{ fontSize: 12, color: "var(--ci-muted)" }}>{q.unit}</span>}
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.6, whiteSpace: "pre-wrap", marginBottom: 12 }}>{q.stem}</div>

              {q.type === "mc" && (
                <div style={{ display: "grid", gap: 6, marginBottom: 10 }}>
                  {q.choices.map((c, ci) => {
                    const isAns = ci === q.answer, isYour = yourRaw === ci;
                    return (
                      <div key={ci} style={{ display: "flex", gap: 10, alignItems: "center", padding: "8px 12px", borderRadius: 8, fontSize: 14,
                        background: isAns ? "rgba(31,138,91,0.10)" : isYour ? "rgba(200,40,40,0.08)" : "transparent",
                        border: "1px solid " + (isAns ? "var(--ci-ok)" : isYour ? "var(--ci-bad)" : "var(--ci-line)") }}>
                        <span style={{ fontWeight: 800, color: "var(--ci-muted)" }}>{String.fromCharCode(9312 + ci)}</span>
                        <span style={{ flex: 1 }}>{c}</span>
                        {isAns && <span className="ci-badge ok" style={{ fontSize: 10 }}>정답</span>}
                        {isYour && !isAns && <span className="ci-badge bad" style={{ fontSize: 10 }}>내 선택</span>}
                      </div>
                    );
                  })}
                </div>
              )}
              {(q.type === "ox" || q.type === "short") && (
                <div style={{ display: "flex", gap: 18, fontSize: 14, marginBottom: 10, flexWrap: "wrap" }}>
                  <span>내 답: <strong style={{ color: correct ? "var(--ci-ok)" : "var(--ci-bad)" }}>{fmtAns(q, yourRaw)}</strong></span>
                  <span>정답: <strong style={{ color: "var(--ci-ok)" }}>{fmtAns(q, q.type === "ox" ? q.answer : q.answer)}</strong></span>
                </div>
              )}
              {isEssay && (
                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 12.5, color: "var(--ci-muted)", marginBottom: 4 }}>내 답안</div>
                  <div style={{ background: "var(--ci-bg-2)", borderRadius: 8, padding: "10px 12px", fontSize: 14, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{yourRaw || <em style={{ color: "var(--ci-muted)" }}>미작성</em>}</div>
                  {mf[q.id] && <div style={{ marginTop: 8, fontSize: 13.5, color: "var(--ci-ink)" }}><strong style={{ color: "var(--ci-navy)" }}>강사 피드백 · </strong>{mf[q.id]}</div>}
                </div>
              )}
              {q.explanation && (
                <div style={{ background: "var(--ci-bg)", borderRadius: 8, padding: "10px 12px", fontSize: 13.5, color: "var(--ci-ink)", lineHeight: 1.6 }}>
                  <strong style={{ color: "var(--ci-navy)" }}>해설 · </strong>{q.explanation}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {exam.type === "practice" && (
        <div style={{ marginTop: 18, textAlign: "center" }}>
          <button className="ci-act navy" onClick={() => { window.resetAttempt(examId); onRetake(); }}><Icon name="refresh" size={13} /> 다시 풀기</button>
        </div>
      )}
    </div>
  );
}

function fmtAns(q, v) {
  if (q.type === "ox") return v === true ? "O (참)" : v === false ? "X (거짓)" : "—";
  return v == null || v === "" ? "—" : String(v);
}
function ResCell({ k, v }) {
  return (
    <div className="ci-report-cell" style={{ background: "var(--ci-bg-2)", borderRadius: 10, padding: 14, textAlign: "center" }}>
      <div style={{ fontSize: 11.5, color: "var(--ci-muted)", fontWeight: 700 }}>{k}</div>
      <div style={{ fontWeight: 900, fontSize: 22, marginTop: 4 }}>{v}</div>
    </div>
  );
}

Object.assign(window, { ExamPanel });
