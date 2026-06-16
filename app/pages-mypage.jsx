/* global React, COURSES, ACCOUNT, CLASSIN, CLASSIN_ME, useApp, Icon, findInstructor, findCourse, findSubject, formatKRW, ConnBanner, CiHead, EnterCards, AppDownload, RealtimePanel, RecordingsPanel, CloudPanel, ReportsPanel */

const { useState: useStateM, useEffect: useEffectM } = React;

// ──────────────────────────────────────────────────────────────────
// /mypage — ClassIn-powered learning dashboard
// ──────────────────────────────────────────────────────────────────
const DASH_TABS = [
  ["overview",   "학습 홈",        "Overview"],
  ["realtime",   "실시간 데이터",   "Live Data"],
  ["recordings", "다시보기",       "Recordings"],
  ["cloud",      "강의자료",       "Cloud Disk"],
  ["reports",    "수업 리포트",     "Reports"],
  ["account",    "계정 · 연동",     "Account"],
];

function MyPage() {
  const { navigate, user, login, logout, route } = useApp();
  const initialTab = route?.params?.get?.("tab");
  const [tab, setTab] = useStateM(DASH_TABS.some(([k]) => k === initialTab) ? initialTab : "overview");

  // Supabase 연동 시: 로그인한 사용자만 접근. 미설정 시: 데모 자동로그인.
  useEffectM(() => { if (!user && !window.SUPABASE_ENABLED) login(ACCOUNT.email, ACCOUNT.name, ACCOUNT.initials); }, []);
  if (!user) {
    if (!window.SUPABASE_ENABLED) return null;
    return (
      <div className="page-enter container" style={{ paddingTop: 96, paddingBottom: 120, maxWidth: 520, textAlign: "center" }}>
        <div style={{ width: 64, height: 64, borderRadius: "50%", background: "var(--ci-navy)", color: "var(--ci-yellow)", display: "inline-flex", alignItems: "center", justifyContent: "center", margin: "0 auto" }}><Icon name="key" size={28} /></div>
        <h1 style={{ fontFamily: "var(--font-kr-serif)", fontWeight: 500, fontSize: 34, letterSpacing: "-0.03em", margin: "24px 0 8px" }}>로그인이 필요합니다</h1>
        <p style={{ color: "var(--rj-muted)", fontSize: 15, marginBottom: 28 }}>마이페이지·강의실은 수강생 전용입니다. 로그인 후 이용해주세요.</p>
        <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
          <button className="btn btn-primary btn-lg" onClick={() => navigate("/login")}>로그인</button>
          <button className="btn btn-ghost btn-lg" onClick={() => navigate("/signup")}>회원가입</button>
        </div>
      </div>
    );
  }

  const isKnown = user.email === ACCOUNT.email;
  const enrolledIds = isKnown ? ACCOUNT.enrolled : [COURSES[0].id, COURSES[2].id];
  const enrolled = enrolledIds.map((id) => findCourse(id)).filter(Boolean);
  const history = isKnown ? ACCOUNT.watchHistory : {};

  const todayLive = [COURSES[0], COURSES[1], COURSES[2]];

  return (
    <div className="page-enter">
      {/* Hero band */}
      <section style={{ background: "var(--ci-navy)", color: "#fff" }}>
        <div className="container-wide" style={{ paddingTop: 40, paddingBottom: 28 }}>
          <div style={{ display: "grid", gridTemplateColumns: "auto 1fr auto", gap: 26, alignItems: "center" }}>
            <span style={{ width: 76, height: 76, borderRadius: "50%", background: "var(--ci-yellow)", color: "var(--ci-navy)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-kr-serif)", fontWeight: 600, fontSize: 30 }}>{user.initials}</span>
            <div>
              <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.04em", color: "var(--ci-yellow)" }}>리뉴젠 학습 대시보드 · ClassIn 연동</div>
              <h1 style={{ fontWeight: 900, fontSize: 38, letterSpacing: "-0.04em", margin: "8px 0 4px" }}>{user.name}님, 오늘도 환영합니다</h1>
              <div style={{ fontSize: 13.5, color: "rgba(255,255,255,0.7)" }}>UID {CLASSIN_ME.uid} · {CLASSIN_ME.mobile} · {isKnown ? ACCOUNT.grade : "고2"} · {CLASSIN_ME.device}</div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="ci-act" style={{ height: 40 }} onClick={() => navigate("/weblive")}><Icon name="signal" size={14} /> 공개방송</button>
              <button className="ci-act" style={{ height: 40 }} onClick={() => navigate("/admin")}><Icon name="settings" size={14} /> 관리자</button>
              <button className="ci-act" style={{ height: 40 }} onClick={() => { logout(); navigate("/"); }}>로그아웃</button>
            </div>
          </div>
        </div>
        {/* Tab strip */}
        <div className="container-wide">
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap", paddingBottom: 0 }}>
            {DASH_TABS.map(([k, ko, en]) => (
              <button key={k} onClick={() => setTab(k)} style={{
                padding: "13px 18px", border: 0, cursor: "pointer",
                background: tab === k ? "var(--ci-bg)" : "transparent",
                color: tab === k ? "var(--ci-navy)" : "rgba(255,255,255,0.7)",
                borderRadius: "8px 8px 0 0", fontWeight: 800, fontSize: 14,
                display: "inline-flex", alignItems: "baseline", gap: 6, whiteSpace: "nowrap",
              }}>
                {ko}<span style={{ fontFamily: "var(--font-en)", fontWeight: 600, fontSize: 10.5, opacity: 0.6 }}>{en}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="container-wide" style={{ paddingTop: 28, paddingBottom: 96 }}>
        {tab === "overview" && (
          <div style={{ display: "grid", gap: 28 }}>
            <ConnBanner />

            {/* learning KPIs */}
            <div className="ci-kpis">
              <div className="ci-kpi accent"><div className="lab"><span className="ico"><Icon name="book" size={16} /></span> 수강 중</div><div className="num">{enrolled.length}<small>강의</small></div><div className="sub">이번 주 6.4시간 학습</div></div>
              <div className="ci-kpi"><div className="lab"><span className="ico"><Icon name="check" size={16} /></span> 평균 출석률</div><div className="num">94<small>%</small></div><div className="sub">최근 30일</div></div>
              <div className="ci-kpi"><div className="lab"><span className="ico"><Icon name="trophy" size={16} /></span> 누적 트로피</div><div className="num">128</div><div className="sub">상위 12%</div></div>
              <div className="ci-kpi"><div className="lab"><span className="ico"><Icon name="hand" size={16} /></span> 손들기·질문</div><div className="num">37</div><div className="sub">이번 시즌</div></div>
              <div className="ci-kpi"><div className="lab"><span className="ico"><Icon name="signal" size={16} /></span> 연속 학습</div><div className="num">14<small>일</small></div><div className="sub">스트릭 유지 중</div></div>
            </div>

            {/* auto-login entry */}
            <div>
              <CiHead title="원클릭 강의실 입장" api="Login URL"
                sub="자동 로그인으로 계정·비밀번호 입력 없이 바로 입장합니다 · 시작 10분 전부터 활성화"
                action={<button className="ci-act navy" onClick={() => navigate("/live")}><Icon name="calendar" size={13} /> 전체 시간표</button>} />
              <EnterCards courses={todayLive} onEnter={(id) => navigate("/live/" + id + "?join=1")} />
            </div>

            {/* enrolled progress */}
            <div>
              <CiHead title="수강 중인 강의" api="Classroom" sub="라이브 + 다시보기 진도" />
              <div style={{ display: "grid", gap: 14 }}>
                {enrolled.map((c) => {
                  const h = history[c.id] || { progressPct: 24, lessonIdx: 6 };
                  const ins = findInstructor(c.instructor);
                  return (
                    <div key={c.id} className="ci-card" style={{ padding: 20, display: "grid", gridTemplateColumns: "1fr auto", gap: 24, alignItems: "center" }}>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <span className="ci-badge navy">{findSubject(c.subject)?.ko}</span>
                          <strong style={{ fontWeight: 900, fontSize: 18, letterSpacing: "-0.03em" }}>{c.title}</strong>
                          <span style={{ fontSize: 12.5, color: "var(--ci-muted)" }}>{ins?.name}</span>
                        </div>
                        <div style={{ marginTop: 12, maxWidth: 560 }}>
                          <div style={{ height: 8, background: "var(--ci-bg-2)", borderRadius: 4, overflow: "hidden" }}>
                            <div style={{ width: h.progressPct + "%", height: "100%", background: "var(--ci-navy)" }} />
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: 12, color: "var(--ci-muted)" }}>
                            <span style={{ fontWeight: 700 }}>{h.progressPct}% 완료</span><span>{h.lessonIdx} / {c.lessons}강</span>
                          </div>
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button className="ci-act navy" onClick={() => navigate("/live/" + c.id)}><Icon name="live" size={13} /> 라이브 입장</button>
                        <button className="ci-act" onClick={() => navigate("/player/" + c.id)}><Icon name="play" size={13} /> 이어보기</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* app download */}
            <div>
              <CiHead title="클래스인 앱 다운로드" api="Download URL"
                sub="라이브 강의실은 데스크탑 앱에서 가장 안정적입니다" />
              <AppDownload />
            </div>
          </div>
        )}

        {tab === "realtime" && <RealtimePanel />}
        {tab === "recordings" && <RecordingsPanel onPlay={(id) => navigate("/player/" + id)} />}
        {tab === "cloud" && <CloudPanel />}
        {tab === "reports" && <ReportsPanel />}

        {tab === "account" && (
          <div>
            <CiHead title="계정 · 클래스인 연동" api="User" sub="리뉴젠 계정과 ClassIn 사용자 레코드 연결 정보" />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, maxWidth: 1040 }}>
              <ProfileBlock title="ClassIn 사용자" en="User Record">
                <Row label="UID" value={<span className="ci-mono">{CLASSIN_ME.uid}</span>} />
                <Row label="이름" value={user.name} />
                <Row label="등록 휴대폰" value={<span className="ci-mono">{CLASSIN_ME.mobile}</span>} />
                <Row label="식별 (identity)" value="student" />
                <Row label="연결 상태" value={<span className="ci-badge ok"><Icon name="check" size={11} /> 연동됨</span>} />
              </ProfileBlock>
              <ProfileBlock title="기본 정보" en="Profile">
                <Row label="이메일" value={user.email} />
                <Row label="학년" value={ACCOUNT.grade} />
                <Row label="학교" value="리뉴젠고등학교" />
                <Row label="가입일" value="2025.11.04" />
              </ProfileBlock>
              <ProfileBlock title="알림" en="Notifications">
                <Row label="라이브 시작 알림" value={<input type="checkbox" defaultChecked />} />
                <Row label="다시보기 업로드" value={<input type="checkbox" defaultChecked />} />
                <Row label="수업 리포트 발행" value={<input type="checkbox" defaultChecked />} />
                <Row label="트로피 · 평가" value={<input type="checkbox" defaultChecked />} />
              </ProfileBlock>
              <ProfileBlock title="연동 · 보안" en="Integration">
                <Row label="School SID" value={<span className="ci-mono">{CLASSIN.sid}</span>} />
                <Row label="앱 버전" value="ClassIn 5.2.1" />
                <Row label="연결된 계정" value="카카오, 네이버" />
                <Row label="비밀번호" value={<button className="btn-link" style={{ fontSize: 13 }}>변경</button>} />
              </ProfileBlock>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function ProfileBlock({ title, en, children }) {
  return (
    <div className="ci-card ci-card-pad">
      <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 14 }}>
        <h3 style={{ margin: 0, fontWeight: 900, fontSize: 18, letterSpacing: "-0.03em" }}>{title}</h3>
        <span style={{ fontFamily: "var(--font-en)", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--ci-muted)" }}>{en}</span>
      </div>
      {children}
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "11px 0", borderTop: "1px solid var(--ci-line)", fontSize: 14 }}>
      <span style={{ color: "var(--ci-muted)" }}>{label}</span>
      <span style={{ fontWeight: 600 }}>{value}</span>
    </div>
  );
}

window.MyPage = MyPage;
