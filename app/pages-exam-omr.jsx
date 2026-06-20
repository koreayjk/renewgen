/* global React, Icon, CiHead, findCourse, findInstructor, useApp */
// ──────────────────────────────────────────────────────────────────
//  학생 — PDF 시험지 + 디지털 OMR 카드 응시 / 결과
//  시험지는 PDF로 보고, 답만 OMR 카드에 마킹 → 정답표와 자동 대조 채점
// ──────────────────────────────────────────────────────────────────
const { useState: useStOmr, useEffect: useEfOmr, useRef: useRfOmr } = React;

const OMR_BUBBLES = ["①", "②", "③", "④", "⑤", "⑥", "⑦"];

function omrPdfSrc(url) {
  if (!url) return "";
  // 업로드된 data: URL 은 그대로, 경로는 인코딩 + 뷰어 옵션
  if (/^data:|^blob:/.test(url)) return url;
  return encodeURI(url) + "#toolbar=1&view=FitH";
}

// ── 응시 화면 ───────────────────────────────────────────────────────
function OmrRunner({ examId, onDone, onExit }) {
  const exam = window.findExam(examId);
  const { showToast } = useApp();
  const items = exam.omr || [];
  const [answers, setAnswers] = useStOmr({});
  const [left, setLeft] = useStOmr(exam.durationMin ? exam.durationMin * 60 : null);
  const [leaveCount, setLeaveCount] = useStOmr(0);
  const [confirming, setConfirming] = useStOmr(false);
  const submittedRef = useRfOmr(false);

  useEfOmr(() => {
    if (left == null) return;
    if (left <= 0) { doSubmit(); return; }
    const t = setTimeout(() => setLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [left]);

  useEfOmr(() => {
    const onHide = () => { if (document.hidden && !submittedRef.current) { setLeaveCount((c) => c + 1); showToast && showToast("⚠️ 시험 중 화면을 벗어났습니다 — 기록됩니다"); } };
    document.addEventListener("visibilitychange", onHide);
    return () => document.removeEventListener("visibilitychange", onHide);
  }, []);

  const setA = (no, v) => setAnswers((a) => ({ ...a, [no]: v }));
  const answeredN = items.filter((it) => answers[it.no] != null && answers[it.no] !== "").length;

  function doSubmit() {
    if (submittedRef.current) return;
    submittedRef.current = true;
    const g = window.autoGradeOmr(exam, answers);
    window.saveAttempt(examId, {
      answers, submittedAt: new Date().toLocaleString("ko-KR", { dateStyle: "medium", timeStyle: "short" }),
      autoScore: g.autoScore, autoMax: g.autoMax, manualScores: {}, manualFeedback: {},
      graded: true, leaveCount, omr: true,
    });
    onDone();
  }

  const mm = left == null ? null : String(Math.floor(left / 60)).padStart(2, "0");
  const ss = left == null ? null : String(left % 60).padStart(2, "0");
  const lowTime = left != null && left <= 60;
  const course = findCourse(exam.courseId);

  return (
    <div>
      {/* 상단 바 */}
      <div className="ci-card" style={{ padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, marginBottom: 16, flexWrap: "wrap", position: "sticky", top: 8, zIndex: 6 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 900, fontSize: 16, letterSpacing: "-0.02em" }}>{exam.title}</div>
          <div style={{ fontSize: 12, color: "var(--ci-muted)" }}>{course?.title} · {answeredN} / {items.length} 마킹 · {window.examTotal(exam)}점</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {leaveCount > 0 && <span className="ci-badge bad" style={{ fontSize: 10.5 }}>화면 이탈 {leaveCount}회</span>}
          {left != null && (
            <span style={{ fontFamily: "var(--font-en)", fontWeight: 800, fontSize: 22, color: lowTime ? "var(--ci-bad)" : "var(--ci-navy)", background: lowTime ? "rgba(200,40,40,0.08)" : "var(--ci-bg-2)", padding: "4px 12px", borderRadius: 8 }}>
              <Icon name="clock" size={14} /> {mm}:{ss}
            </span>
          )}
          <button className="ci-act navy" onClick={() => setConfirming(true)}><Icon name="check" size={13} /> 제출</button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 360px", gap: 16, alignItems: "start" }}>
        {/* PDF 시험지 */}
        <div className="ci-card" style={{ overflow: "hidden", padding: 0 }}>
          <div style={{ padding: "10px 14px", borderBottom: "1px solid var(--ci-line)", display: "flex", alignItems: "center", gap: 8 }}>
            <Icon name="folder" size={14} /><strong style={{ fontSize: 13 }}>{exam.pdfName || "시험지.pdf"}</strong>
            <span className="ci-badge neutral" style={{ marginLeft: "auto", fontSize: 10.5 }}>시험지 (PDF)</span>
          </div>
          {exam.pdfUrl
            ? <iframe title="시험지" src={omrPdfSrc(exam.pdfUrl)} style={{ width: "100%", height: "calc(100vh - 220px)", minHeight: 560, border: 0, display: "block", background: "#525659" }} />
            : <div style={{ height: 560, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ci-muted)", fontSize: 14 }}>업로드된 시험지 PDF가 여기에 표시됩니다</div>}
        </div>

        {/* OMR 카드 */}
        <div className="ci-card" style={{ padding: 0, position: "sticky", top: 84, overflow: "hidden" }}>
          <div style={{ background: "var(--ci-navy)", color: "#fff", padding: "12px 16px", textAlign: "center", letterSpacing: "0.08em" }}>
            <div style={{ fontWeight: 900, fontSize: 14, fontFamily: "var(--font-en)" }}>OMR ANSWER SHEET</div>
            <div style={{ fontSize: 11, opacity: 0.7, marginTop: 2 }}>답안카드 · 정확히 마킹하세요</div>
          </div>
          <div style={{ maxHeight: "calc(100vh - 290px)", overflowY: "auto", padding: "10px 14px 16px" }}>
            {items.map((it) => {
              const n = it.choices || exam.defaultChoices || 5;
              const a = answers[it.no];
              return (
                <div key={it.no} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 4px", borderBottom: "1px solid var(--ci-line)" }}>
                  <span style={{ width: 26, textAlign: "right", fontFamily: "var(--font-en)", fontWeight: 800, fontSize: 14, color: "var(--ci-navy)" }}>{it.no}</span>
                  {it.type === "short" ? (
                    <input value={a || ""} onChange={(e) => setA(it.no, e.target.value)} placeholder="주관식 답"
                      style={{ flex: 1, height: 34, borderRadius: 6, border: "1px solid var(--ci-line)", padding: "0 10px", fontSize: 14, fontFamily: "var(--font-en)" }} />
                  ) : (
                    <div style={{ display: "flex", gap: 6, flex: 1 }}>
                      {Array.from({ length: n }, (_, i) => {
                        const on = a === i;
                        return (
                          <button key={i} onClick={() => setA(it.no, i)} title={"보기 " + (i + 1)}
                            style={{ width: 30, height: 30, borderRadius: "50%", cursor: "pointer", fontSize: 14, fontWeight: 700,
                              border: "1.5px solid " + (on ? "var(--ci-navy)" : "var(--ci-line)"),
                              background: on ? "var(--ci-navy)" : "var(--ci-paper)", color: on ? "#fff" : "var(--ci-muted)", transition: "all .1s" }}>
                            {OMR_BUBBLES[i]}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <div style={{ padding: "12px 14px", borderTop: "1px solid var(--ci-line)", display: "flex", gap: 8 }}>
            <button className="ci-act" style={{ flex: 1, justifyContent: "center" }} onClick={onExit}>나가기</button>
            <button className="ci-act navy" style={{ flex: 2, justifyContent: "center" }} onClick={() => setConfirming(true)}><Icon name="check" size={13} /> 제출하기</button>
          </div>
        </div>
      </div>

      {confirming && (
        <div onClick={() => setConfirming(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,12,28,0.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }}>
          <div className="ci-card ci-card-pad" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 380, width: "90%" }}>
            <div style={{ fontWeight: 900, fontSize: 18, marginBottom: 8 }}>제출하시겠어요?</div>
            <p style={{ fontSize: 13.5, color: "var(--ci-muted)", lineHeight: 1.6, margin: "0 0 18px" }}>
              {items.length - answeredN > 0 ? <>아직 <strong style={{ color: "var(--ci-bad)" }}>{items.length - answeredN}문항</strong>이 비어 있습니다. </> : "모든 문항을 마킹했습니다. "}
              제출 후에는 수정할 수 없습니다.
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

// ── 결과 화면 ───────────────────────────────────────────────────────
function OmrResult({ examId, onBack }) {
  const exam = window.findExam(examId);
  const at = window.getAttempt(examId);
  if (!at) return <div className="ci-card ci-card-pad" style={{ textAlign: "center", padding: 48, color: "var(--ci-muted)" }}>응시 기록이 없습니다. <button className="ci-act" style={{ marginLeft: 8 }} onClick={onBack}>목록으로</button></div>;

  const items = exam.omr || [];
  const total = window.examTotal(exam);
  const g = window.autoGradeOmr(exam, at.answers);
  const score = g.autoScore;
  const pct = Math.round((score / total) * 100);
  const grade = window.gradeOf(pct);
  const pctile = window.mockPercentile(pct);

  const byUnit = {};
  for (const it of items) {
    const u = it.unit || "기타";
    if (!byUnit[u]) byUnit[u] = { earned: 0, max: 0 };
    byUnit[u].max += it.points; byUnit[u].earned += g.per[it.no].earned;
  }
  const wrong = items.filter((it) => g.per[it.no].correct === false);
  const correctN = items.filter((it) => g.per[it.no].correct).length;

  return (
    <div>
      <CiHead title={exam.title + " · 결과"} api="OMR Scored"
        sub={"제출 " + at.submittedAt + (at.leaveCount ? " · 화면 이탈 " + at.leaveCount + "회" : "")}
        action={<button className="ci-act" onClick={onBack}><Icon name="arrowLeft" size={13} /> 시험 목록</button>} />

      {/* 점수 요약 */}
      <div className="ci-card ci-card-pad" style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: 28, alignItems: "center", marginBottom: 16 }}>
        <div style={{ textAlign: "center" }}>
          <div className="ci-ring" style={{ "--p": pct, width: 120, height: 120 }}><span className="val" style={{ fontSize: 30 }}>{score}</span></div>
          <div style={{ fontSize: 12, color: "var(--ci-muted)", marginTop: 8, fontWeight: 700 }}>/ {total}점 ({pct}%)</div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
          <OmrCell k="예상 등급" v={grade + "등급"} />
          <OmrCell k="상위" v={pctile + "%"} />
          <OmrCell k="정답 / 문항" v={correctN + " / " + items.length} />
        </div>
      </div>

      {/* 단원별 */}
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

      {wrong.length > 0 && (
        <div className="ci-card ci-card-pad" style={{ marginBottom: 16, borderLeft: "4px solid var(--ci-bad)" }}>
          <div style={{ fontWeight: 900, fontSize: 15 }}>오답노트 <span style={{ color: "var(--ci-bad)" }}>{wrong.length}</span></div>
          <div style={{ fontSize: 12.5, color: "var(--ci-muted)", marginTop: 2 }}>틀린 번호: {wrong.map((w) => w.no).join(", ")}</div>
        </div>
      )}

      {/* 번호별 채점표 */}
      <div className="ci-card" style={{ overflow: "hidden" }}>
        <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--ci-line)", fontWeight: 900, fontSize: 15 }}>번호별 채점표</div>
        <div style={{ overflowX: "auto" }}>
          <table className="ci-table">
            <thead><tr><th>번호</th><th>유형</th><th style={{ textAlign: "center" }}>내 답</th><th style={{ textAlign: "center" }}>정답</th><th style={{ textAlign: "center" }}>채점</th><th>해설</th></tr></thead>
            <tbody>
              {items.map((it) => {
                const my = at.answers[it.no];
                const correct = g.per[it.no].correct;
                const fmt = (v) => it.type === "short" ? (v == null || v === "" ? "—" : v) : (v == null ? "—" : OMR_BUBBLES[Number(v)]);
                return (
                  <tr key={it.no} style={{ background: correct ? "transparent" : "rgba(200,40,40,0.05)" }}>
                    <td style={{ fontWeight: 800 }}>{it.no}</td>
                    <td><span className="ci-badge neutral" style={{ fontSize: 10 }}>{it.type === "short" ? "단답" : (it.choices || 5) + "지선다"}</span></td>
                    <td style={{ textAlign: "center", fontWeight: 700, color: correct ? "var(--ci-ok)" : "var(--ci-bad)" }}>{fmt(my)}</td>
                    <td style={{ textAlign: "center", fontWeight: 700, color: "var(--ci-ok)" }}>{fmt(it.answer)}</td>
                    <td style={{ textAlign: "center" }}>{correct ? <span className="ci-badge ok" style={{ fontSize: 10 }}>정답 {it.points}</span> : <span className="ci-badge bad" style={{ fontSize: 10 }}>오답 0</span>}</td>
                    <td style={{ fontSize: 12.5, color: "var(--ci-muted)" }}>{it.explanation || "—"}</td>
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

function OmrCell({ k, v }) {
  return (
    <div style={{ background: "var(--ci-bg-2)", borderRadius: 10, padding: 14, textAlign: "center" }}>
      <div style={{ fontSize: 11.5, color: "var(--ci-muted)", fontWeight: 700 }}>{k}</div>
      <div style={{ fontWeight: 900, fontSize: 22, marginTop: 4 }}>{v}</div>
    </div>
  );
}

Object.assign(window, { OmrRunner, OmrResult });
