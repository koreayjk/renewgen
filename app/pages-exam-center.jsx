/* global React, Icon, CiHead, findCourse, findInstructor, useApp */
// ──────────────────────────────────────────────────────────────────
//  시험 센터 — 월 1회 정기고사 중심의 학생 시험 허브
//   · 이번 달 시험(히어로)  · 성적 추이 차트  · 월별 응시 이력 타임라인  · 연습 시험
//   온라인 대학(UoPeople 등) 스타일의 직관적 학습 경험을 지향
// ──────────────────────────────────────────────────────────────────

const STATUS_META = {
  upcoming:  { label: "응시 예정",  cls: "neutral" },
  open:      { label: "응시 가능",  cls: "ok" },
  submitted: { label: "채점 대기",  cls: "navy" },
  graded:    { label: "채점 완료",  cls: "ok" },
  closed:    { label: "미응시 마감", cls: "warn" },
};

function dDay(dueAt) {
  if (!dueAt) return null;
  const ms = new Date(dueAt).getTime() - Date.now();
  const days = Math.ceil(ms / 86400000);
  if (days < 0) return { txt: "마감", over: true };
  if (days === 0) return { txt: "오늘 마감", soon: true };
  if (days === 1) return { txt: "D-1", soon: true };
  return { txt: "D-" + days, soon: days <= 3 };
}

function gradeColor(pct) { return pct >= 80 ? "var(--ci-ok)" : pct >= 50 ? "var(--ci-navy)" : "var(--ci-bad)"; }

function ExamCenter({ onTake, onResult }) {
  const { user } = useApp();
  const timeline = window.examTimeline();       // desc (최신월 먼저)
  const trend = window.scoreTrend();            // asc (채점완료만)
  const practice = window.getExams().filter((e) => e.type === "practice");
  const latest = timeline[0] || null;           // 이번 달(또는 가장 최근) 정기고사

  const done = timeline.filter((r) => r.status === "graded");
  const avg = done.length ? Math.round(done.reduce((s, r) => s + r.pct, 0) / done.length) : null;
  const best = done.length ? Math.max(...done.map((r) => r.pct)) : null;
  const delta = trend.length >= 2 ? trend[trend.length - 1].pct - trend[trend.length - 2].pct : null;

  return (
    <div style={{ display: "grid", gap: 22 }}>
      <CiHead title="시험 센터" api="Renewjen Exam"
        sub="매월 정기고사를 홈페이지에서 응시하고, 성적 추이와 지난 시험을 한눈에 확인하세요" />

      {/* ── 이번 달 시험 (히어로) ── */}
      {latest ? <CurrentExamHero row={latest} onTake={onTake} onResult={onResult} /> : <NoExamHero />}

      {/* ── 성적 추이 ── */}
      <div className="ci-card ci-card-pad">
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", flexWrap: "wrap", gap: 10, marginBottom: 6 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
            <h3 style={{ margin: 0, fontWeight: 900, fontSize: 18, letterSpacing: "-0.03em" }}>성적 추이</h3>
            <span style={{ fontFamily: "var(--font-en)", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--ci-muted)" }}>Score Trend</span>
          </div>
          <div style={{ display: "flex", gap: 18, fontSize: 13 }}>
            <TrendStat k="평균" v={avg == null ? "—" : avg + "점"} />
            <TrendStat k="최고" v={best == null ? "—" : best + "점"} />
            <TrendStat k="직전 대비" v={delta == null ? "—" : (delta >= 0 ? "+" + delta : delta)} color={delta == null ? null : delta >= 0 ? "var(--ci-ok)" : "var(--ci-bad)"} />
          </div>
        </div>
        {trend.length === 0
          ? <div style={{ padding: "28px 0", textAlign: "center", color: "var(--ci-muted)", fontSize: 14 }}>아직 채점 완료된 시험이 없습니다. 첫 정기고사를 응시하면 추이가 그려집니다.</div>
          : <TrendChart trend={trend} />}
      </div>

      {/* ── 월별 응시 이력 ── */}
      <div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 12 }}>
          <h3 style={{ margin: 0, fontWeight: 900, fontSize: 18, letterSpacing: "-0.03em" }}>월별 응시 이력</h3>
          <span style={{ fontFamily: "var(--font-en)", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--ci-muted)" }}>History</span>
        </div>
        <div className="exam-timeline">
          {timeline.map((row) => <TimelineRow key={row.exam.id} row={row} onTake={onTake} onResult={onResult} />)}
        </div>
      </div>

      {/* ── 연습 시험 ── */}
      {practice.length > 0 && (
        <div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 12 }}>
            <h3 style={{ margin: 0, fontWeight: 900, fontSize: 18, letterSpacing: "-0.03em" }}>연습 시험</h3>
            <span style={{ fontFamily: "var(--font-en)", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--ci-muted)" }}>Practice · 무제한 응시</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
            {practice.map((e) => {
              const course = findCourse(e.courseId);
              const at = window.getAttempt(e.id);
              return (
                <div key={e.id} className="ci-card" style={{ padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
                  <div>
                    <span className="ci-badge neutral" style={{ fontSize: 10.5 }}>연습</span>
                    <strong style={{ fontWeight: 900, fontSize: 16, letterSpacing: "-0.03em", display: "block", marginTop: 8 }}>{e.title}</strong>
                    <span style={{ fontSize: 12, color: "var(--ci-muted)" }}>{course?.title} · {window.examQCount(e)}문항</span>
                  </div>
                  <div style={{ display: "flex", gap: 8, marginTop: "auto" }}>
                    <button className="ci-act navy" onClick={() => onTake(e.id)}><Icon name="play" size={13} /> 응시</button>
                    {at && at.submittedAt && <button className="ci-act" onClick={() => onResult(e.id)}>지난 결과</button>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <style>{`
        .exam-timeline { position: relative; }
        .exam-tl-row { position: relative; display: grid; grid-template-columns: 92px 1fr auto; gap: 18px; align-items: center;
          padding: 16px 18px; background: var(--ci-paper); border: 1px solid var(--ci-line); border-radius: 14px; margin-bottom: 10px; }
        .exam-tl-month { text-align: center; }
        .exam-tl-month .m { font-family: var(--font-en); font-weight: 900; font-size: 26px; line-height: 1; letter-spacing: -0.03em; color: var(--ci-navy); }
        .exam-tl-month .y { font-size: 11px; color: var(--ci-muted); font-weight: 700; margin-top: 3px; }
      `}</style>
    </div>
  );
}

function TrendStat({ k, v, color }) {
  return (
    <div style={{ textAlign: "right" }}>
      <div style={{ fontSize: 10.5, color: "var(--ci-muted)", fontWeight: 700 }}>{k}</div>
      <div style={{ fontWeight: 900, fontSize: 16, color: color || "var(--ci-ink)" }}>{v}</div>
    </div>
  );
}

// ── 이번 달 시험 히어로 ──────────────────────────────────────────────
function CurrentExamHero({ row, onTake, onResult }) {
  const { exam, status, score, total, pct } = row;
  const course = findCourse(exam.courseId);
  const ins = course ? findInstructor(course.instructor) : null;
  const dd = dDay(exam.dueAt);
  const isOpen = status === "open";
  const isDone = status === "graded";
  const isPending = status === "submitted";
  const isMissed = status === "closed";

  return (
    <div style={{ position: "relative", overflow: "hidden", borderRadius: 18, background: "var(--ci-navy)", color: "#fff" }}>
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 88% 18%, rgba(247,200,72,0.18), transparent 42%)" }} />
      <div style={{ position: "relative", padding: 26, display: "grid", gridTemplateColumns: "1fr auto", gap: 24, alignItems: "center" }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10, flexWrap: "wrap" }}>
            <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.04em", color: "var(--ci-yellow)" }}>
              {window.periodYear(exam.period)}년 {window.monthKo(exam.period)} 정기고사
            </span>
            {isOpen && dd && <span className="ci-badge" style={{ background: dd.soon ? "var(--ci-yellow)" : "rgba(255,255,255,0.16)", color: dd.soon ? "var(--ci-navy)" : "#fff", fontWeight: 800 }}>{dd.txt}</span>}
            {isPending && <span className="ci-badge" style={{ background: "rgba(255,255,255,0.16)", color: "#fff" }}>채점 대기</span>}
            {isMissed && <span className="ci-badge" style={{ background: "rgba(255,255,255,0.16)", color: "#fff" }}>미응시 마감</span>}
          </div>
          <h2 style={{ margin: 0, fontWeight: 900, fontSize: 28, letterSpacing: "-0.04em" }}>{exam.title}</h2>
          <div style={{ display: "flex", gap: 16, marginTop: 10, fontSize: 13, color: "rgba(255,255,255,0.78)", flexWrap: "wrap" }}>
            <span><Icon name="book" size={13} /> {window.examQCount(exam)}문항 · {total}점</span>
            <span><Icon name="clock" size={13} /> {exam.durationMin ? exam.durationMin + "분" : "시간 제한 없음"}</span>
            {exam.format === "pdf_omr" && <span><Icon name="folder" size={13} /> PDF + OMR</span>}
            {ins && <span>{course?.title} · {ins.name}</span>}
            {exam.dueAt && <span>마감 {new Date(exam.dueAt).toLocaleDateString("ko-KR", { month: "long", day: "numeric" })}</span>}
          </div>
          {isOpen && <p style={{ margin: "14px 0 0", fontSize: 13, color: "rgba(255,255,255,0.62)", maxWidth: 560, lineHeight: 1.6 }}>{exam.instructions}</p>}
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
          {(isDone) && (
            <div style={{ textAlign: "center" }}>
              <div className="ci-ring" style={{ "--p": pct, width: 110, height: 110 }}><span className="val" style={{ fontSize: 30 }}>{score}</span></div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", marginTop: 8, fontWeight: 700 }}>/ {total}점 · {window.gradeOf(pct)}등급</div>
            </div>
          )}
          {isOpen && <button className="ci-act" style={{ height: 52, padding: "0 28px", fontSize: 16, background: "var(--ci-yellow)", color: "var(--ci-navy)", border: 0, fontWeight: 900 }} onClick={() => onTake(exam.id)}><Icon name="play" size={16} /> 시험 시작</button>}
          {isPending && <button className="ci-act" style={{ height: 46, padding: "0 22px", background: "rgba(255,255,255,0.14)", color: "#fff", border: 0 }} onClick={() => onResult(exam.id)}><Icon name="arrow" size={14} /> 제출본 보기</button>}
          {isDone && <button className="ci-act" style={{ height: 44, padding: "0 22px", background: "rgba(255,255,255,0.14)", color: "#fff", border: 0 }} onClick={() => onResult(exam.id)}><Icon name="arrow" size={14} /> 결과 · 해설</button>}
          {isMissed && <span style={{ fontSize: 13, color: "rgba(255,255,255,0.6)" }}>응시 기간이 종료되었습니다</span>}
        </div>
      </div>
    </div>
  );
}

function NoExamHero() {
  return (
    <div style={{ borderRadius: 18, background: "var(--ci-bg-2)", padding: 30, textAlign: "center" }}>
      <div style={{ width: 56, height: 56, borderRadius: "50%", background: "var(--ci-paper)", display: "inline-flex", alignItems: "center", justifyContent: "center", color: "var(--ci-navy)" }}><Icon name="calendar" size={24} /></div>
      <h2 style={{ margin: "16px 0 6px", fontWeight: 900, fontSize: 22, letterSpacing: "-0.03em" }}>이번 달 예정된 시험이 없습니다</h2>
      <p style={{ margin: 0, color: "var(--ci-muted)", fontSize: 14 }}>정기고사는 매월 1회 진행됩니다. 새 시험이 열리면 로그인 시 알려드릴게요.</p>
    </div>
  );
}

// ── 성적 추이 차트 (SVG) ─────────────────────────────────────────────
function TrendChart({ trend }) {
  const W = 680, H = 230, padX = 44, padTop = 24, padBot = 40;
  const innerW = W - padX * 2, innerH = H - padTop - padBot;
  const n = trend.length;
  const x = (i) => n === 1 ? padX + innerW / 2 : padX + (i * innerW) / (n - 1);
  const y = (pct) => padTop + (1 - pct / 100) * innerH;
  const pts = trend.map((r, i) => ({ x: x(i), y: y(r.pct), ...r }));
  const line = pts.map((p) => p.x + "," + p.y).join(" ");
  const area = "M" + pts[0].x + "," + (padTop + innerH) + " L" + line.replace(/ /g, " L") + " L" + pts[n - 1].x + "," + (padTop + innerH) + " Z";

  return (
    <div style={{ width: "100%", overflowX: "auto" }}>
      <svg viewBox={"0 0 " + W + " " + H} style={{ width: "100%", minWidth: 480, display: "block" }}>
        <defs>
          <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--ci-navy)" stopOpacity="0.16" />
            <stop offset="100%" stopColor="var(--ci-navy)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* 가로 기준선 */}
        {[0, 50, 80, 100].map((v) => (
          <g key={v}>
            <line x1={padX} y1={y(v)} x2={W - padX} y2={y(v)} stroke="var(--ci-line)" strokeWidth="1" strokeDasharray={v === 0 ? "0" : "3 4"} />
            <text x={padX - 10} y={y(v) + 4} textAnchor="end" fontSize="11" fill="var(--ci-muted)" fontFamily="var(--font-en)">{v}</text>
          </g>
        ))}
        {/* 영역 + 선 */}
        <path d={area} fill="url(#trendFill)" />
        <polyline points={line} fill="none" stroke="var(--ci-navy)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        {/* 포인트 + 값 + 월 */}
        {pts.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="6" fill="#fff" stroke={gradeColor(p.pct)} strokeWidth="3" />
            <text x={p.x} y={p.y - 14} textAnchor="middle" fontSize="13" fontWeight="800" fill="var(--ci-ink)" fontFamily="var(--font-en)">{p.pct}</text>
            <text x={p.x} y={H - 14} textAnchor="middle" fontSize="12" fontWeight="700" fill="var(--ci-muted)">{window.monthKo(p.exam.period)}</text>
          </g>
        ))}
      </svg>
    </div>
  );
}

// ── 타임라인 행 ─────────────────────────────────────────────────────
function TimelineRow({ row, onTake, onResult }) {
  const { exam, status, at, score, total, pct } = row;
  const course = findCourse(exam.courseId);
  const ins = course ? findInstructor(course.instructor) : null;
  const meta = STATUS_META[status] || STATUS_META.upcoming;
  const dateStr = at && at.submittedAt ? at.submittedAt
    : exam.dueAt ? new Date(exam.dueAt).toLocaleDateString("ko-KR", { month: "short", day: "numeric" }) + " 마감" : "";

  return (
    <div className="exam-tl-row">
      <div className="exam-tl-month">
        <div className="m">{window.monthKo(exam.period)}</div>
        <div className="y">{window.periodYear(exam.period)}</div>
      </div>

      <div style={{ minWidth: 0 }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 4 }}>
          <strong style={{ fontWeight: 800, fontSize: 16, letterSpacing: "-0.02em" }}>{exam.title}</strong>
          <span className={"ci-badge " + meta.cls} style={{ fontSize: 10 }}>{meta.label}</span>
          {exam.format === "pdf_omr" && <span className="ci-badge neutral" style={{ fontSize: 10 }}>PDF+OMR</span>}
        </div>
        <div style={{ fontSize: 12.5, color: "var(--ci-muted)" }}>
          {course?.title}{ins ? " · " + ins.name : ""} · {window.examQCount(exam)}문항 · {total}점{dateStr ? " · " + dateStr : ""}
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        {pct != null && (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontFamily: "var(--font-en)", fontWeight: 900, fontSize: 24, lineHeight: 1, color: gradeColor(pct) }}>{score}</div>
            <div style={{ fontSize: 10.5, color: "var(--ci-muted)", marginTop: 3, fontWeight: 700 }}>{status === "graded" ? window.gradeOf(pct) + "등급" : "채점중"}</div>
          </div>
        )}
        {status === "open" && <button className="ci-act navy" onClick={() => onTake(exam.id)}><Icon name="play" size={13} /> 응시</button>}
        {(status === "graded" || status === "submitted") && <button className="ci-act" onClick={() => onResult(exam.id)}><Icon name="arrow" size={13} /> 결과</button>}
        {status === "closed" && <span style={{ fontSize: 12, color: "var(--ci-muted)" }}>미응시</span>}
        {status === "upcoming" && <span style={{ fontSize: 12, color: "var(--ci-muted)" }}>예정</span>}
      </div>
    </div>
  );
}

Object.assign(window, { ExamCenter, TrendChart, examGradeColor: gradeColor, dDay });
