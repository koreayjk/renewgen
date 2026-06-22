/* global React, Icon, CiHead, findCourse, findInstructor, useApp */
// ──────────────────────────────────────────────────────────────────
//  시험 부가 기능
//   · examStats / 리마인드 헬퍼
//   · AdminExamOverview  관리자 월간 뷰(정기고사 현황 + 반 평균 추이 + 미응시 리마인드)
//   · ExamRecap          학생 성적표 탭에 정기고사 성적 통합
// ──────────────────────────────────────────────────────────────────
const { useState: useStEx2 } = React;

const COHORT = 24;  // 데모: 정기고사 응시 대상 인원
function _hash(s) { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; }

// 한 정기고사의 학급 통계(데모 시뮬레이션 — 결정적)
function examStats(exam) {
  const status = window.examStatus(exam);
  const at = window.getAttempt(exam.id);
  const myPct = at && at.submittedAt ? Math.round((window.finalScore(exam, at) / window.examTotal(exam)) * 100) : null;
  // 실제 응시 데이터 기준 (다인원 집계는 Supabase 연동 시 채워집니다)
  const submitted = at && at.submittedAt ? 1 : 0;
  const total = submitted;   // 아직 반 명단 연동 전 — 실제 제출 건수만 표시
  return { total, submitted, notSubmitted: 0, rate: 0, classAvg: null, myPct, status };
}

// 리마인드 (localStorage)
function _remStore() { try { return JSON.parse(localStorage.getItem("rj_exam_reminders") || "{}"); } catch (e) { return {}; } }
function getExamReminder(id) { const r = _remStore()[id]; return r || null; }
function sendExamReminder(id) {
  const s = _remStore(); s[id] = { at: Date.now() }; try { localStorage.setItem("rj_exam_reminders", JSON.stringify(s)); } catch (e) {}
  if (window.rjPushExamReminder) window.rjPushExamReminder(id, s[id].at).catch(() => {});
  return s[id];
}

Object.assign(window, { examStats, getExamReminder, sendExamReminder });

// ── 관리자 월간 뷰 ──────────────────────────────────────────────────
function AdminExamOverview({ onGrade }) {
  const { showToast } = useApp();
  const [, force] = useStEx2(0);

  // 클라우드(Supabase)에서 리마인드 발송 기록 동기화 → 로컬 캐시 교체 후 재렌더
  React.useEffect(() => {
    let alive = true;
    if (window.rjSyncExamRemindersFromCloud) {
      window.rjSyncExamRemindersFromCloud().then((r) => { if (alive && r && r.ok && r.loaded) force((n) => n + 1); }).catch(() => {});
    }
    return () => { alive = false; };
  }, []);

  const timeline = window.examTimeline();          // desc
  const current = timeline.find((r) => r.status === "open") || timeline[0];
  const graded = timeline.filter((r) => r.status === "graded").slice().reverse(); // asc

  const cur = current ? current.exam : null;
  const curStats = cur ? examStats(cur) : null;
  const rem = cur ? getExamReminder(cur.id) : null;

  // 반 평균 추이 (graded asc) → TrendChart 형식으로 변환
  const trendRows = graded.map((r) => ({ exam: r.exam, pct: examStats(r.exam).classAvg })).filter((r) => r.pct != null);

  const doReminder = () => {
    if (!cur) return;
    sendExamReminder(cur.id);
    showToast && showToast("미응시 " + curStats.notSubmitted + "명에게 리마인드를 발송했습니다 (앱 푸시 · 문자)");
    force((n) => n + 1);
  };

  return (
    <div style={{ marginBottom: 22 }}>
      {/* 이번 달 시험 현황 */}
      {cur && (
        <div className="ci-card" style={{ overflow: "hidden", marginBottom: 14, borderLeft: "4px solid var(--ci-navy)" }}>
          <div style={{ padding: 20, display: "grid", gridTemplateColumns: "1fr auto", gap: 20, alignItems: "center" }}>
            <div>
              <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 6 }}>
                <span className="ci-badge navy" style={{ fontSize: 10.5 }}>이번 달 정기고사</span>
                <span className={"ci-badge " + (curStats.status === "open" ? "ok" : "neutral")} style={{ fontSize: 10.5 }}>{curStats.status === "open" ? "응시 진행 중" : "마감"}</span>
                {rem && <span className="ci-badge warn" style={{ fontSize: 10.5 }}><Icon name="check" size={10} /> 리마인드 발송됨</span>}
              </div>
              <strong style={{ fontWeight: 900, fontSize: 20, letterSpacing: "-0.03em" }}>{cur.title}</strong>
              <div style={{ display: "flex", gap: 18, marginTop: 12, alignItems: "center", flexWrap: "wrap" }}>
                <div style={{ minWidth: 200 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, marginBottom: 5 }}>
                    <span style={{ fontWeight: 700 }}>응시율</span>
                    <span className="ci-mono" style={{ color: "var(--ci-muted)" }}>{curStats.submitted}/{curStats.total}명 · {curStats.rate}%</span>
                  </div>
                  <div style={{ height: 8, background: "var(--ci-bg-2)", borderRadius: 4, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: curStats.rate + "%", background: "var(--ci-navy)" }} />
                  </div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontWeight: 900, fontSize: 22, color: "var(--ci-bad)" }}>{curStats.notSubmitted}</div>
                  <div style={{ fontSize: 11, color: "var(--ci-muted)", fontWeight: 700 }}>미응시</div>
                </div>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <button className="ci-act navy" onClick={doReminder} disabled={curStats.notSubmitted === 0} style={{ opacity: curStats.notSubmitted === 0 ? 0.5 : 1 }}>
                <Icon name="signal" size={13} /> 미응시자 리마인드
              </button>
              {onGrade && <button className="ci-act" onClick={() => onGrade(cur.id)}><Icon name="edit" size={13} /> 채점·제출본</button>}
            </div>
          </div>
        </div>
      )}

      {/* 월별 정기고사 캘린더 strip */}
      <div className="ci-card ci-card-pad" style={{ marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 14 }}>
          <h3 style={{ margin: 0, fontWeight: 900, fontSize: 16, letterSpacing: "-0.03em" }}>월별 정기고사</h3>
          <span style={{ fontFamily: "var(--font-en)", fontSize: 10.5, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--ci-muted)" }}>Monthly Calendar</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 10 }}>
          {timeline.slice().reverse().map((r) => {
            const s = examStats(r.exam);
            const on = r.status === "open";
            return (
              <div key={r.exam.id} style={{ border: "1px solid " + (on ? "var(--ci-navy)" : "var(--ci-line)"), borderRadius: 12, padding: 14, background: on ? "rgba(0,18,38,0.03)" : "var(--ci-paper)" }}>
                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
                  <span style={{ fontFamily: "var(--font-en)", fontWeight: 900, fontSize: 20, color: "var(--ci-navy)" }}>{window.monthKo(r.exam.period)}</span>
                  <span className={"ci-badge " + (on ? "ok" : r.status === "graded" ? "neutral" : "warn")} style={{ fontSize: 9.5 }}>{on ? "진행" : r.status === "graded" ? "완료" : "마감"}</span>
                </div>
                <div style={{ fontSize: 12, fontWeight: 700, marginTop: 6, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.exam.title.replace(/^\d+월 정기고사 · /, "")}</div>
                <div style={{ fontSize: 11.5, color: "var(--ci-muted)", marginTop: 6 }}>응시율 {s.rate}%{s.classAvg != null ? " · 평균 " + s.classAvg : ""}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 반 평균 추이 */}
      {trendRows.length > 0 && window.TrendChart && (
        <div className="ci-card ci-card-pad">
          <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 6 }}>
            <h3 style={{ margin: 0, fontWeight: 900, fontSize: 16, letterSpacing: "-0.03em" }}>반 평균 추이</h3>
            <span style={{ fontFamily: "var(--font-en)", fontSize: 10.5, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--ci-muted)" }}>Class Average</span>
          </div>
          <window.TrendChart trend={trendRows} />
        </div>
      )}
    </div>
  );
}

// ── 학생 성적표 탭 — 정기고사 성적 통합 ──────────────────────────────
function ExamRecap({ onOpen }) {
  const timeline = window.examTimeline();
  const trend = window.scoreTrend();
  const done = timeline.filter((r) => r.status === "graded");
  if (done.length === 0 && !timeline.some((r) => r.status === "open")) return null;

  const avg = done.length ? Math.round(done.reduce((s, r) => s + r.pct, 0) / done.length) : null;
  const best = done.length ? Math.max(...done.map((r) => r.pct)) : null;
  const last = trend[trend.length - 1] || null;

  return (
    <div className="ci-card ci-card-pad" style={{ marginBottom: 18, borderLeft: "4px solid var(--ci-navy)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10, marginBottom: 6 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
          <h3 style={{ margin: 0, fontWeight: 900, fontSize: 18, letterSpacing: "-0.03em" }}>정기고사 성적</h3>
          <span style={{ fontFamily: "var(--font-en)", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--ci-muted)" }}>Monthly Exam</span>
        </div>
        {onOpen && <button className="ci-act" onClick={onOpen}><Icon name="arrow" size={13} /> 시험 센터</button>}
      </div>
      <p style={{ margin: "0 0 14px", fontSize: 12.5, color: "var(--ci-muted)" }}>매월 정기고사 결과가 월말평가와 함께 한 곳에 모입니다.</p>

      <div style={{ display: "grid", gridTemplateColumns: trend.length > 0 ? "200px 1fr" : "1fr", gap: 20, alignItems: "center" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
          <RecapStat k="평균" v={avg == null ? "—" : avg} u={avg == null ? "" : "점"} />
          <RecapStat k="최고" v={best == null ? "—" : best} u={best == null ? "" : "점"} />
          <RecapStat k="최근" v={last == null ? "—" : last.pct} u={last == null ? "" : "점"} />
        </div>
        {trend.length > 0 && window.TrendChart && <window.TrendChart trend={trend} />}
      </div>

      <div style={{ display: "grid", gap: 8, marginTop: 16 }}>
        {timeline.slice(0, 4).map((r) => {
          const meta = r.status === "graded" ? { t: r.score + "점 · " + window.gradeOf(r.pct) + "등급", c: window.examGradeColor(r.pct) }
            : r.status === "open" ? { t: "응시 가능", c: "var(--ci-ok)" }
            : r.status === "submitted" ? { t: "채점 대기", c: "var(--ci-navy)" }
            : { t: "미응시", c: "var(--ci-muted)" };
          return (
            <div key={r.exam.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 0", borderTop: "1px solid var(--ci-line)" }}>
              <span style={{ fontFamily: "var(--font-en)", fontWeight: 800, fontSize: 14, color: "var(--ci-navy)", width: 40 }}>{window.monthKo(r.exam.period)}</span>
              <span style={{ flex: 1, fontSize: 13.5, fontWeight: 600 }}>{r.exam.title}</span>
              <span style={{ fontSize: 13, fontWeight: 800, color: meta.c }}>{meta.t}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RecapStat({ k, v, u }) {
  return (
    <div style={{ background: "var(--ci-bg-2)", borderRadius: 10, padding: "10px 12px", textAlign: "center" }}>
      <div style={{ fontSize: 10.5, color: "var(--ci-muted)", fontWeight: 700 }}>{k}</div>
      <div style={{ fontWeight: 900, fontSize: 20, marginTop: 2 }}>{v}<small style={{ fontSize: 11, fontWeight: 700, color: "var(--ci-muted)" }}>{u}</small></div>
    </div>
  );
}

Object.assign(window, { AdminExamOverview, ExamRecap });
