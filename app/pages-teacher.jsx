/* global React, Icon, CiHead, useApp, TEACHER_CLASSES, TEACHER_ROSTER, ATT_SESSIONS, TEACHER_TODAY, riskMeta, rosterStats, findCourse */
// ──────────────────────────────────────────────────────────────────
//  선생님 대시보드 — /teacher
//   탭: 오늘 · 출결 · 학생 관리 · 시험 · 과제 · 수업 리포트
//   ClassIn(출결·참여·리포트) + 우리 홈페이지(시험·과제)를 한 화면에서
// ──────────────────────────────────────────────────────────────────
const { useState: useStT } = React;

const TEACH_TABS = [
  ["today",     "오늘",        "Today"],
  ["classes",   "반 관리",     "Classes"],
  ["attend",    "출결 관리",    "Attendance"],
  ["students",  "학생 관리",    "Students"],
  ["exam",      "시험 출제",     "Exam"],
  ["grades",    "성적표",       "Report Cards"],
  ["reports",   "수업 리포트",  "Reports"],
];

function TeacherPage() {
  const { user, navigate, logout } = useApp();
  const [tab, setTab] = useStT("today");
  const [, forceT] = useStT(0);
  // 실제 로스터(월말평가 성적표 학생) 우선, 없으면 데모
  const realRoster = (window.rjRealTeacherRoster && window.rjRealTeacherRoster()) || [];
  const roster = realRoster.length ? realRoster : (window.TEACHER_ROSTER || []);
  const stats = window.rosterStats ? window.rosterStats(roster) : { n: 0, avgAtt: null, avgExam: null, highRisk: 0, watch: 0 };

  // 과제·제출/채점을 클라우드(Supabase)에서 동기화 → 로컬 캐시 교체 후 재렌더
  //   (미연결 시 no-op → 기존 로컬 동작 유지)
  React.useEffect(() => {
    let alive = true;
    if (window.rjSyncAssignmentsFromCloud) {
      window.rjSyncAssignmentsFromCloud().then((r) => { if (alive && r && r.ok) forceT((n) => n + 1); }).catch(() => {});
    }
    return () => { alive = false; };
  }, []);

  // 접근 가드 (실서버) — staff 아니면 학습 대시보드로
  React.useEffect(() => {
    if (!window.SUPABASE_ENABLED) return;
    if (user && window.isStaff && !window.isStaff(user)) navigate("/mypage");
  }, [user]);

  return (
    <div className="ci-scope" style={{ background: "var(--ci-bg)", minHeight: "100vh" }}>
      {/* 헤더 히어로 */}
      <div style={{ background: "var(--ci-navy)", color: "#fff", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 90% 10%, rgba(247,200,72,0.16), transparent 44%)" }} />
        <div className="container-wide" style={{ position: "relative", paddingTop: 30, paddingBottom: 30, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <span className="avatar" style={{ width: 58, height: 58, background: "var(--ci-yellow)", color: "var(--ci-navy)", fontWeight: 900, fontSize: 18 }}>{(user && user.initials) || "선생"}</span>
            <div>
              <div style={{ fontSize: 12.5, fontWeight: 800, color: "var(--ci-yellow)", letterSpacing: "0.04em" }}>선생님 대시보드 · ClassIn 연동</div>
              <h1 style={{ margin: "3px 0 0", fontWeight: 900, fontSize: 26, letterSpacing: "-0.03em" }}>{(user && user.name) || "선생님"}님, 오늘도 함께해요</h1>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.66)", marginTop: 3 }}>{(window.TEACHER_CLASSES || []).map((c) => c.name).join(" · ")}</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="ci-act" style={{ height: 40, background: "var(--ci-yellow)", color: "var(--ci-navy)", border: 0, fontWeight: 800 }} onClick={() => navigate("/weblive")}><Icon name="signal" size={14} /> 라이브 강의실</button>
            <button className="ci-act" style={{ height: 40 }} onClick={() => navigate("/mypage")}><Icon name="user" size={14} /> 학생 화면</button>
            {window.isAdmin && window.isAdmin(user) && <button className="ci-act" style={{ height: 40 }} onClick={() => navigate("/admin")}><Icon name="settings" size={14} /> 관리자</button>}
            <button className="ci-act" style={{ height: 40 }} onClick={() => { logout(); navigate("/"); }}>로그아웃</button>
          </div>
        </div>
        {/* 탭 */}
        <div className="container-wide" style={{ position: "relative", display: "flex", gap: 4, flexWrap: "wrap" }}>
          {TEACH_TABS.map(([k, ko, en]) => (
            <button key={k} onClick={() => setTab(k)} style={{
              border: 0, cursor: "pointer", padding: "12px 18px", background: tab === k ? "var(--ci-bg)" : "transparent",
              color: tab === k ? "var(--ci-ink)" : "rgba(255,255,255,0.7)", fontWeight: 800, fontSize: 14,
              borderRadius: "10px 10px 0 0", display: "flex", alignItems: "baseline", gap: 7,
            }}>
              {ko}<span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", opacity: 0.6 }}>{en}</span>
              {k === "exam" && window.__pendingGradeCount > 0 && <span className="ci-badge bad" style={{ fontSize: 9.5 }}>{window.__pendingGradeCount}</span>}
            </button>
          ))}
        </div>
      </div>

      <div className="container-wide ci-scope" style={{ paddingTop: 26, paddingBottom: 80 }}>
        {tab === "today" && <TeacherToday roster={roster} stats={stats} onTab={setTab} />}
        {tab === "classes" && (window.ClassManager ? <window.ClassManager /> : null)}
        {tab === "attend" && <TeacherAttendance roster={roster} />}
        {tab === "students" && <TeacherStudents roster={roster} />}
        {tab === "exam" && (window.ExamManager ? <window.ExamManager /> : null)}
        {tab === "grades" && (window.ReportManager ? <window.ReportManager viewOnly={true} /> : null)}
        {tab === "reports" && (window.ReportsPanel ? <window.ReportsPanel /> : null)}
      </div>
    </div>
  );
}

// ── 오늘 ────────────────────────────────────────────────────────────
function TeacherToday({ roster, stats, onTab }) {
  const t = window.TEACHER_TODAY || {};
  const { navigate } = useApp();
  const high = roster.filter((r) => r.risk === "high");
  // 과제 채점 대기 — 반 관리의 배포 과제 제출분에서 집계
  let pendingGrade = 0, pendingHw = 0;
  try {
    const list = (window.loadAssignments && window.loadAssignments()) || [];
    list.forEach((a) => { Object.values(a.submissions || {}).forEach((s) => { if (s.status === "submitted") pendingHw++; }); });
  } catch (e) {}
  try {
    const exams = (window.getExams && window.getExams()) || [];
    pendingGrade = exams.filter((e) => { const a = window.getAttempt && window.getAttempt(e.id); return a && a.submittedAt && !a.graded; }).length;
  } catch (e) {}
  window.__pendingGradeCount = pendingGrade;

  return (
    <div style={{ display: "grid", gap: 18 }}>
      <CiHead title="오늘 한눈에" api="ClassIn + Renewjen" sub="오늘 수업·출결·해야 할 일을 한 번에 확인하세요" />

      {/* 오늘 수업 */}
      {t && t.topic ? (
      <div className="ci-card" style={{ overflow: "hidden", borderLeft: "4px solid var(--ci-navy)" }}>
        <div style={{ padding: 20, display: "grid", gridTemplateColumns: "1fr auto", gap: 18, alignItems: "center" }}>
          <div>
            <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6, flexWrap: "wrap" }}>
              <span className="ci-badge navy" style={{ fontSize: 10.5 }}>오늘 {t.time}</span>
              <span className="ci-badge neutral" style={{ fontSize: 10.5 }}>{t.className}</span>
            </div>
            <strong style={{ fontWeight: 900, fontSize: 20, letterSpacing: "-0.03em" }}>{t.topic}</strong>
            <div style={{ fontSize: 13, color: "var(--ci-muted)", marginTop: 4 }}>강의실 {t.room} · ClassIn 라이브</div>
          </div>
          <button className="ci-act navy" style={{ height: 48, padding: "0 22px", fontSize: 15 }} onClick={() => navigate("/weblive")}><Icon name="play" size={15} /> 강의실 열기</button>
        </div>
      </div>
      ) : (
      <div className="ci-card ci-card-pad" style={{ display: "flex", alignItems: "center", gap: 12, color: "var(--ci-muted)" }}>
        <Icon name="calendar" size={18} /><span style={{ fontSize: 14 }}>오늘 예정된 수업이 없습니다 · ClassIn 일정이 연동되면 여기에 표시됩니다.</span>
      </div>
      )}

      {/* KPI */}
      <div className="ci-kpis" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
        <div className="ci-kpi accent"><div className="lab"><span className="ico"><Icon name="users" size={16} /></span> 담당 학생</div><div className="num">{stats.n}<small>명</small></div><div className="sub">월말평가 성적 기준</div></div>
        <div className="ci-kpi"><div className="lab"><span className="ico"><Icon name="check" size={16} /></span> 평균 출석률</div><div className="num" style={{ fontSize: stats.avgAtt == null ? 22 : undefined }}>{stats.avgAtt == null ? "—" : <>{stats.avgAtt}<small>%</small></>}</div><div className="sub">{stats.avgAtt == null ? "라이브 수업 시작 후" : "최근 12회"}</div></div>
        <div className="ci-kpi"><div className="lab"><span className="ico"><Icon name="trophy" size={16} /></span> 반 평균 성적</div><div className="num" style={{ fontSize: stats.avgExam == null ? 22 : undefined }}>{stats.avgExam == null ? "—" : <>{stats.avgExam}<small>점</small></>}</div><div className="sub">월말평가 평균</div></div>
        <div className="ci-kpi"><div className="lab"><span className="ico"><Icon name="signal" size={16} /></span> 집중관리</div><div className="num" style={{ color: stats.highRisk ? "var(--ci-bad)" : "inherit" }}>{stats.highRisk}<small>명</small></div><div className="sub">관찰 {stats.watch}명</div></div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {/* 해야 할 일 */}
        <div className="ci-card ci-card-pad">
          <div style={{ fontWeight: 900, fontSize: 16, marginBottom: 14 }}>해야 할 일</div>
          <div style={{ display: "grid", gap: 10 }}>
            <TodoRow icon="edit" label="시험 서술형 채점" n={pendingGrade} unit="건" onClick={() => onTab("exam")} />
            <TodoRow icon="folder" label="과제 제출 채점 대기" n={pendingHw} unit="건" onClick={() => onTab("classes")} />
            <TodoRow icon="signal" label="집중관리 학생 점검" n={high.length} unit="명" onClick={() => onTab("students")} />
          </div>
        </div>

        {/* 집중관리 학생 */}
        <div className="ci-card ci-card-pad">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <div style={{ fontWeight: 900, fontSize: 16 }}>집중관리 학생</div>
            <button className="ci-act sm" onClick={() => onTab("students")}>전체 보기</button>
          </div>
          {high.length === 0 ? <div style={{ color: "var(--ci-muted)", fontSize: 13.5, padding: "10px 0" }}>현재 집중관리가 필요한 학생이 없습니다 👍</div> : (
            <div style={{ display: "grid", gap: 8 }}>
              {high.map((r) => (
                <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderTop: "1px solid var(--ci-line)" }}>
                  <span className="avatar avatar-sm" style={{ background: "var(--ci-bg-2)", color: "var(--ci-navy)", fontWeight: 800 }}>{r.initials}</span>
                  <span style={{ fontWeight: 800, fontSize: 14 }}>{r.name}</span>
                  <div style={{ marginLeft: "auto", display: "flex", gap: 5, flexWrap: "wrap", justifyContent: "flex-end" }}>
                    {r.flags.map((f) => <span key={f} className="ci-badge bad" style={{ fontSize: 9.5 }}>{f}</span>)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TodoRow({ icon, label, n, unit, onClick }) {
  return (
    <button onClick={onClick} style={{ width: "100%", textAlign: "left", cursor: "pointer", border: "1px solid var(--ci-line)", background: n > 0 ? "var(--ci-paper)" : "var(--ci-bg-2)", borderRadius: 10, padding: "12px 14px", display: "flex", alignItems: "center", gap: 12 }}>
      <span style={{ width: 36, height: 36, borderRadius: 9, background: n > 0 ? "var(--ci-navy)" : "var(--ci-bg)", color: n > 0 ? "#fff" : "var(--ci-muted)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}><Icon name={icon} size={16} /></span>
      <span style={{ flex: 1, fontWeight: 700, fontSize: 14 }}>{label}</span>
      <span style={{ fontWeight: 900, fontSize: 20, color: n > 0 ? "var(--ci-navy)" : "var(--ci-muted)" }}>{n}<small style={{ fontSize: 12, fontWeight: 700, color: "var(--ci-muted)" }}>{unit}</small></span>
      <Icon name="arrow" size={14} />
    </button>
  );
}

// ── 출결 관리 (ClassIn Attendance) ──────────────────────────────────
function TeacherAttendance({ roster }) {
  const sessions = window.ATT_SESSIONS || [];
  const { showToast } = useApp();
  const lowAtt = roster.filter((r) => r.attRate != null && r.attRate < 80);

  // 실제 출결 데이터가 없으면(라이브 수업 전) 정직한 빈 상태
  if (sessions.length === 0 && !roster.some((r) => r.attRate != null)) {
    return (
      <div style={{ display: "grid", gap: 18 }}>
        <CiHead title="출결 관리" api="ClassIn · Attendance"
          sub="라이브 수업의 입퇴실(Enter/Exit) 데이터가 자동으로 수신됩니다" />
        <div className="ci-card ci-card-pad" style={{ textAlign: "center", padding: "56px 24px", color: "var(--ci-muted)" }}>
          <Icon name="calendar" size={28} />
          <div style={{ fontWeight: 800, color: "var(--ci-ink)", marginTop: 12, fontSize: 15 }}>아직 출결 데이터가 없습니다</div>
          <p style={{ fontSize: 13.5, marginTop: 8, lineHeight: 1.6 }}>실시간(라이브) 수업을 시작하면 ClassIn 입퇴실 데이터가<br />자동으로 수신되어 세션별·학생별 출결이 여기에 쌓입니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gap: 18 }}>
      <CiHead title="출결 관리" api="ClassIn · Attendance"
        sub="ClassIn 입퇴실(Enter/Exit) 데이터를 자동 동기화합니다 · 세션별·학생별 출결을 확인하세요"
        action={<button className="ci-act" onClick={() => showToast && showToast("출결부를 CSV로 내보냈습니다 (데모)")}><Icon name="upload" size={13} /> CSV 내보내기</button>} />

      {/* 세션별 출석 */}
      <div className="ci-card" style={{ overflow: "hidden" }}>
        <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--ci-line)", fontWeight: 900, fontSize: 15 }}>최근 수업 출석</div>
        <div style={{ overflowX: "auto" }}>
          <table className="ci-table">
            <thead><tr><th>날짜</th><th>수업</th><th style={{ textAlign: "center" }}>출석</th><th style={{ textAlign: "center" }}>지각</th><th style={{ textAlign: "center" }}>결석</th><th style={{ minWidth: 140 }}>출석률</th></tr></thead>
            <tbody>
              {sessions.map((s) => (
                <tr key={s.id}>
                  <td className="ci-mono" style={{ fontSize: 12.5, color: "var(--ci-muted)" }}>{s.date}</td>
                  <td><strong style={{ fontWeight: 700 }}>{s.topic}</strong></td>
                  <td style={{ textAlign: "center", fontWeight: 800, color: "var(--ci-ok)" }}>{s.present}</td>
                  <td style={{ textAlign: "center", fontWeight: 800, color: "var(--ci-amber, #c98a00)" }}>{s.late}</td>
                  <td style={{ textAlign: "center", fontWeight: 800, color: "var(--ci-bad)" }}>{s.absent}</td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ flex: 1, height: 8, background: "var(--ci-bg-2)", borderRadius: 4, overflow: "hidden", minWidth: 70 }}>
                        <i style={{ display: "block", height: "100%", width: s.rate + "%", background: "var(--ci-navy)" }} />
                      </span>
                      <span className="ci-mono" style={{ fontSize: 12, color: "var(--ci-muted)" }}>{s.rate}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 학생별 누적 출결 */}
      <div className="ci-card" style={{ overflow: "hidden" }}>
        <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--ci-line)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontWeight: 900, fontSize: 15 }}>학생별 누적 출결 <span style={{ color: "var(--ci-muted)", fontWeight: 600, fontSize: 13 }}>· 최근 12회</span></span>
          {lowAtt.length > 0 && <span className="ci-badge warn" style={{ fontSize: 10.5 }}>출석 80% 미만 {lowAtt.length}명</span>}
        </div>
        <div style={{ overflowX: "auto" }}>
          <table className="ci-table">
            <thead><tr><th>학생</th><th style={{ textAlign: "center" }}>출석</th><th style={{ textAlign: "center" }}>지각</th><th style={{ textAlign: "center" }}>결석</th><th style={{ minWidth: 120 }}>출석률</th><th style={{ textAlign: "center" }}>알림</th></tr></thead>
            <tbody>
              {roster.slice().sort((a, b) => a.attRate - b.attRate).map((r) => (
                <tr key={r.id} style={{ background: r.attRate < 80 ? "rgba(200,40,40,0.04)" : "transparent" }}>
                  <td><div style={{ display: "flex", alignItems: "center", gap: 9 }}><span className="avatar avatar-sm" style={{ background: "var(--ci-bg-2)", color: "var(--ci-navy)", fontWeight: 800 }}>{r.initials}</span><strong style={{ fontWeight: 700 }}>{r.name}</strong></div></td>
                  <td style={{ textAlign: "center", fontWeight: 700 }}>{r.present}</td>
                  <td style={{ textAlign: "center", color: "var(--ci-amber, #c98a00)" }}>{r.late}</td>
                  <td style={{ textAlign: "center", color: r.absent >= 2 ? "var(--ci-bad)" : "inherit", fontWeight: r.absent >= 2 ? 800 : 400 }}>{r.absent}</td>
                  <td><span style={{ fontWeight: 800, color: r.attRate < 80 ? "var(--ci-bad)" : r.attRate < 90 ? "var(--ci-amber, #c98a00)" : "var(--ci-ok)" }}>{r.attRate}%</span></td>
                  <td style={{ textAlign: "center" }}>{r.attRate < 80 ? <button className="ci-act sm" onClick={() => showToast && showToast(r.name + " 학부모님께 출석 안내를 발송했습니다 (데모)")}>안내</button> : <span style={{ color: "var(--ci-muted)" }}>—</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── 학생 관리 ───────────────────────────────────────────────────────
function TeacherStudents({ roster }) {
  const { showToast } = useApp();
  const [filter, setFilter] = useStT("all");
  const [sel, setSel] = useStT(null);
  const filtered = filter === "all" ? roster : roster.filter((r) => r.risk === filter);

  return (
    <div style={{ display: "grid", gap: 18 }}>
      <CiHead title="학생 관리" api="Renewjen + ClassIn"
        sub="월말평가 성적을 기준으로 학생별 학습 상태를 확인하세요 · 출결·참여도는 라이브 수업 시작 후 자동 연동됩니다" />

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {[["all", "전체 " + roster.length], ["high", "집중관리 " + roster.filter(r => r.risk === "high").length], ["watch", "관찰 " + roster.filter(r => r.risk === "watch").length], ["good", "양호 " + roster.filter(r => r.risk === "good").length]].map(([k, label]) => (
          <button key={k} onClick={() => setFilter(k)} className={"ci-act" + (filter === k ? " navy" : "")} style={{ height: 34 }}>{label}</button>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 12 }}>
        {filtered.map((r) => {
          const rm = window.riskMeta(r.risk);
          return (
            <div key={r.id} className="ci-card" style={{ padding: 16, borderLeft: "4px solid " + rm.color }}>
              <div style={{ display: "flex", alignItems: "center", gap: 11, marginBottom: 12 }}>
                <span className="avatar" style={{ width: 40, height: 40, background: "var(--ci-bg-2)", color: "var(--ci-navy)", fontWeight: 800, fontSize: 14 }}>{r.initials}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <strong style={{ fontWeight: 800, fontSize: 15 }}>{r.name}</strong>
                  <div style={{ marginTop: 2 }}><span className={"ci-badge " + rm.cls} style={{ fontSize: 9.5 }}>{rm.label}</span></div>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 10 }}>
                <Metric k="성적" v={r.examAvg == null ? "—" : r.examAvg} bad={r.examAvg != null && r.examAvg < 65} />
                <Metric k="출석" v={r.attRate == null ? "—" : r.attRate + "%"} bad={r.attRate != null && r.attRate < 80} />
                <Metric k="참여" v={r.partic == null ? "—" : r.partic} bad={r.partic != null && r.partic < 55} />
              </div>
              {r.flags.length > 0 && (
                <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 10 }}>
                  {r.flags.map((f) => <span key={f} className="ci-badge bad" style={{ fontSize: 9.5 }}>{f}</span>)}
                </div>
              )}
              <div style={{ display: "flex", gap: 6 }}>
                <button className="ci-act sm" style={{ flex: 1, justifyContent: "center" }} onClick={() => setSel(r)}>상세</button>
                <button className="ci-act sm" style={{ flex: 1, justifyContent: "center" }} onClick={() => showToast && showToast(r.name + " 학생/학부모에게 메시지를 보냈습니다 (데모)")}><Icon name="chat" size={11} /> 연락</button>
              </div>
            </div>
          );
        })}
      </div>

      {sel && <StudentDetail r={sel} onClose={() => setSel(null)} />}
    </div>
  );
}

function Metric({ k, v, bad }) {
  return (
    <div style={{ background: "var(--ci-bg-2)", borderRadius: 8, padding: "8px 6px", textAlign: "center" }}>
      <div style={{ fontSize: 10, color: "var(--ci-muted)", fontWeight: 700 }}>{k}</div>
      <div style={{ fontWeight: 900, fontSize: 16, marginTop: 2, color: bad ? "var(--ci-bad)" : "var(--ci-ink)" }}>{v}</div>
    </div>
  );
}

function StudentDetail({ r, onClose }) {
  const { showToast } = useApp();
  const rm = window.riskMeta(r.risk);
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,12,28,0.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 60, padding: 20 }}>
      <div className="ci-card ci-card-pad" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 460, width: "100%" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <span className="avatar" style={{ width: 48, height: 48, background: "var(--ci-navy)", color: "#fff", fontWeight: 800, fontSize: 16 }}>{r.initials}</span>
          <div>
            <div style={{ fontWeight: 900, fontSize: 18 }}>{r.name}</div>
            <span className={"ci-badge " + rm.cls} style={{ fontSize: 10 }}>{rm.label}</span>
          </div>
          <button className="ci-act sm" style={{ marginLeft: "auto" }} onClick={onClose}>닫기</button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10, marginBottom: 14 }}>
          <DetailStat k="월말평가 평균" v={r.examAvg == null ? "—" : r.examAvg + "점"} sub={r.org ? "소속 " + r.org : "성적표 기준"} />
          <DetailStat k="회차 수" v={(((r.trend && r.trend.length) || 0)) + "회"} sub="응시한 월말평가" />
          <DetailStat k="출석률" v={r.attRate == null ? "—" : r.attRate + "%"} sub="라이브 수업 후 연동" />
          <DetailStat k="참여도" v={r.partic == null ? "—" : r.partic} sub="라이브 수업 후 연동" />
        </div>
        {r.trend && r.trend.length > 0 && (
          <div style={{ background: "var(--ci-bg-2)", borderRadius: 10, padding: "10px 14px", marginBottom: 14 }}>
            <div style={{ fontSize: 11, color: "var(--ci-muted)", fontWeight: 700, marginBottom: 6 }}>회차별 평균</div>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              {r.trend.map((p, i) => (
                <span key={i} style={{ fontSize: 13 }}><b style={{ fontWeight: 800 }}>{p.avg}</b> <span style={{ color: "var(--ci-muted)", fontSize: 11 }}>{p.label}</span></span>
              ))}
            </div>
          </div>
        )}
        {r.flags.length > 0 && (
          <div style={{ background: "rgba(200,40,40,0.06)", borderRadius: 10, padding: "12px 14px", marginBottom: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: "var(--ci-bad)", marginBottom: 6 }}>주의 사항</div>
            <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>{r.flags.map((f) => <span key={f} className="ci-badge bad" style={{ fontSize: 10 }}>{f}</span>)}</div>
          </div>
        )}
        <div style={{ display: "flex", gap: 8 }}>
          <button className="ci-act navy" style={{ flex: 1, justifyContent: "center" }} onClick={() => { showToast && showToast(r.name + " 학부모님께 상담 메시지를 보냈습니다 (데모)"); onClose(); }}><Icon name="chat" size={13} /> 학부모 연락</button>
          <button className="ci-act" style={{ flex: 1, justifyContent: "center" }} onClick={() => { showToast && showToast(r.name + " 개별 과제를 배정했습니다 (데모)"); onClose(); }}><Icon name="edit" size={13} /> 보충 과제</button>
        </div>
      </div>
    </div>
  );
}

function DetailStat({ k, v, sub }) {
  return (
    <div style={{ background: "var(--ci-bg-2)", borderRadius: 10, padding: 12 }}>
      <div style={{ fontSize: 11, color: "var(--ci-muted)", fontWeight: 700 }}>{k}</div>
      <div style={{ fontWeight: 900, fontSize: 22, margin: "2px 0 3px" }}>{v}</div>
      <div style={{ fontSize: 10.5, color: "var(--ci-muted)" }}>{sub}</div>
    </div>
  );
}

Object.assign(window, { TeacherPage });
