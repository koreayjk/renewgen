/* global React, CLASSIN, ADMIN_ACCOUNTS, ADMIN_CLASSES, SUB_MESSAGES, useApp, Icon, CiHead */
// /admin — administrator console
// User API (accounts), Classroom API (courses/classes), Data Subscription monitor

const { useState: useStA } = React;

const ADMIN_TABS = [
  ["status",  "연동 상태",      "Connection"],
  ["users",   "계정 관리",      "User"],
  ["classes", "코스 · 수업",    "Classroom"],
  ["subs",    "데이터 구독",    "Data Subscription"],
];

function AdminPage() {
  const { navigate } = useApp();
  const [tab, setTab] = useStA("status");
  const [roleFilter, setRoleFilter] = useStA("all");

  const accounts = ADMIN_ACCOUNTS.filter((a) => roleFilter === "all" || a.role === roleFilter);
  const teachers = ADMIN_ACCOUNTS.filter((a) => a.role === "teacher");
  const students = ADMIN_ACCOUNTS.filter((a) => a.role === "student");

  const statusBadge = (s) => {
    if (s === "active") return <span className="ci-badge ok"><Icon name="check" size={11} /> 활성</span>;
    if (s === "stopped") return <span className="ci-badge bad"><Icon name="lock" size={11} /> 정지</span>;
    return <span className="ci-badge warn"><Icon name="clock" size={11} /> 승인대기</span>;
  };
  const classState = (s) => {
    if (s === "live") return <span className="ci-badge bad"><span style={{ width: 6, height: 6, borderRadius: "50%", background: "currentColor" }} /> LIVE</span>;
    if (s === "ended") return <span className="ci-badge neutral">종료</span>;
    return <span className="ci-badge navy">예정</span>;
  };

  return (
    <div className="page-enter">
      {/* header */}
      <section style={{ background: "var(--ci-navy)", color: "#fff" }}>
        <div className="container-wide" style={{ paddingTop: 36, paddingBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.04em", color: "var(--ci-yellow)" }}>리뉴젠 관리자 콘솔 · ClassIn Admin</div>
              <h1 style={{ fontWeight: 900, fontSize: 32, letterSpacing: "-0.04em", margin: "8px 0 0" }}>계정 · 코스 · 데이터 연동 관리</h1>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="ci-act" style={{ height: 40 }} onClick={() => navigate("/mypage")}><Icon name="user" size={14} /> 학습 대시보드</button>
              <button className="ci-act" style={{ height: 40 }} onClick={() => navigate("/weblive")}><Icon name="signal" size={14} /> 공개방송</button>
            </div>
          </div>
          <div style={{ display: "flex", gap: 4, marginTop: 22, flexWrap: "wrap" }}>
            {ADMIN_TABS.map(([k, ko, en]) => (
              <button key={k} onClick={() => setTab(k)} style={{
                padding: "12px 18px", border: 0, cursor: "pointer",
                background: tab === k ? "var(--ci-bg)" : "transparent",
                color: tab === k ? "var(--ci-navy)" : "rgba(255,255,255,0.7)",
                borderRadius: "8px 8px 0 0", fontWeight: 800, fontSize: 14,
                display: "inline-flex", alignItems: "baseline", gap: 6, whiteSpace: "nowrap",
              }}>{ko}<span style={{ fontFamily: "var(--font-en)", fontWeight: 600, fontSize: 10.5, opacity: 0.6 }}>{en}</span></button>
            ))}
          </div>
        </div>
      </section>

      <section className="container-wide" style={{ paddingTop: 28, paddingBottom: 96 }}>
        {/* ── Connection status ── */}
        {tab === "status" && (
          <div style={{ display: "grid", gap: 24 }}>
            <div className="ci-stat-strip">
              <div className="ci-kpi accent"><div className="lab"><span className="ico"><Icon name="users" size={16} /></span> 전체 계정</div><div className="num">{ADMIN_ACCOUNTS.length}</div><div className="sub">강사 {teachers.length} · 학생 {students.length}</div></div>
              <div className="ci-kpi"><div className="lab"><span className="ico"><Icon name="book" size={16} /></span> 활성 수업</div><div className="num">{ADMIN_CLASSES.length}</div><div className="sub">오늘 라이브 {ADMIN_CLASSES.filter(c => c.state === "live").length}건</div></div>
              <div className="ci-kpi"><div className="lab"><span className="ico"><Icon name="server" size={16} /></span> 수신 메시지</div><div className="num">8.4<small>k</small></div><div className="sub">최근 24시간</div></div>
              <div className="ci-kpi"><div className="lab"><span className="ico"><Icon name="signal" size={16} /></span> 엔드포인트</div><div className="num" style={{ fontSize: 24 }}>정상</div><div className="sub">200 OK · 12ms</div></div>
            </div>

            <div className="ci-admin-grid">
              <div className="ci-card ci-card-pad">
                <CiHead title="API 연동 정보" api="Auth" />
                <div style={{ display: "grid", gap: 0 }}>
                  {[
                    ["School", CLASSIN.school],
                    ["SID", CLASSIN.sid],
                    ["Secret Key", CLASSIN.secretMasked],
                    ["요금제", CLASSIN.plan],
                    ["API Base", CLASSIN.apiBase],
                    ["테스트 API 승인", "완료 (본사)"],
                  ].map(([k, v]) => (
                    <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderTop: "1px solid var(--ci-line)", fontSize: 14 }}>
                      <span style={{ color: "var(--ci-muted)" }}>{k}</span>
                      <span style={{ fontWeight: 700, fontFamily: k === "SID" || k === "API Base" || k === "Secret Key" ? "var(--font-en)" : "inherit" }}>{v}</span>
                    </div>
                  ))}
                </div>
                <a href={CLASSIN.docs} target="_blank" rel="noreferrer" className="ci-act" style={{ marginTop: 16, display: "inline-flex", textDecoration: "none" }}><Icon name="book" size={13} /> API 문서 (docs.eeo.cn)</a>
              </div>

              <div className="ci-card ci-card-pad">
                <CiHead title="데이터 수신 엔드포인트" api="Data Subscription" />
                <div style={{ background: "var(--ci-navy)", color: "#fff", borderRadius: 10, padding: 16, fontFamily: "var(--font-en)", fontSize: 12.5, lineHeight: 1.7 }}>
                  <div style={{ color: "rgba(255,255,255,0.55)" }}>POST · 실시간 데이터 수신</div>
                  <div style={{ color: "var(--ci-yellow)", wordBreak: "break-all" }}>{CLASSIN.dataEndpoint}</div>
                  <div style={{ marginTop: 8, color: "rgba(255,255,255,0.8)" }}>↳ 하나의 엔드포인트로만 수신 가능 · 실시간 + 요약 데이터 푸시</div>
                </div>
                <ul style={{ margin: "16px 0 0", padding: 0, listStyle: "none", display: "grid", gap: 9, fontSize: 13, color: "var(--ci-ink)" }}>
                  {["수업 진행 중 실시간 데이터를 push 받습니다", "수업 종료 시 요약 데이터(출석·평가·녹화)가 도착합니다", "한 번에 한 시스템으로만 전송됩니다", "과거 데이터 소급 수신은 미지원"].map((t, i) => (
                    <li key={i} style={{ display: "flex", gap: 9, alignItems: "flex-start" }}><Icon name="check" size={14} className="" style={{ color: "var(--ci-ok)", flexShrink: 0, marginTop: 2 }} /> {t}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* ── User management ── */}
        {tab === "users" && (
          <div>
            <CiHead title="계정 관리" api="User"
              sub="ClassIn 계정 등록·수정·정지·재시작 · 모든 계정은 휴대폰 번호로 등록됩니다"
              action={<div style={{ display: "flex", gap: 8 }}>
                <button className="ci-act"><Icon name="upload" size={13} /> 일괄 등록</button>
                <button className="ci-act navy"><Icon name="plus" size={13} /> 계정 추가</button>
              </div>} />
            <div className="ci-subtabs" style={{ marginBottom: 14 }}>
              {[["all", "전체", ADMIN_ACCOUNTS.length], ["teacher", "강사", teachers.length], ["student", "학생", students.length]].map(([k, l, n]) => (
                <button key={k} className={"ci-subtab" + (roleFilter === k ? " active" : "")} onClick={() => setRoleFilter(k)}>{l}<span className="badge">{n}</span></button>
              ))}
            </div>
            <div className="ci-card" style={{ overflow: "hidden" }}>
              <div style={{ overflowX: "auto" }}>
                <table className="ci-table">
                  <thead><tr><th>UID</th><th>이름</th><th>역할</th><th>등록 휴대폰</th><th>라벨</th><th>수업</th><th>상태</th><th style={{ textAlign: "right" }}>작업</th></tr></thead>
                  <tbody>
                    {accounts.map((a) => (
                      <tr key={a.uid}>
                        <td className="ci-uid">{a.uid}</td>
                        <td><span className="ci-nameav"><span className="av" style={a.role === "teacher" ? { background: "var(--ci-navy-2)" } : {}}>{a.name.slice(-2)}</span>{a.name}</span></td>
                        <td><span className={"ci-badge " + (a.role === "teacher" ? "navy" : "neutral")}>{a.role === "teacher" ? "강사" : "학생"}</span></td>
                        <td className="ci-mono" style={{ color: "var(--ci-muted)" }}>{a.mobile}</td>
                        <td>{a.label}</td>
                        <td className="ci-mono">{a.classes}</td>
                        <td>{statusBadge(a.status)}</td>
                        <td>
                          <span style={{ display: "flex", gap: 5, justifyContent: "flex-end" }}>
                            <button className="ci-act sm"><Icon name="edit" size={11} /> 수정</button>
                            {a.status === "stopped"
                              ? <button className="ci-act sm navy"><Icon name="refresh" size={11} /> 재시작</button>
                              : <button className="ci-act sm"><Icon name="lock" size={11} /> 정지</button>}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── Classroom management ── */}
        {tab === "classes" && (
          <div>
            <CiHead title="코스 · 수업 관리" api="Classroom"
              sub="코스/수업 생성, 수강생 배정, 담당 강사 변경, 라벨 관리"
              action={<div style={{ display: "flex", gap: 8 }}>
                <button className="ci-act"><Icon name="folder" size={13} /> 라벨 관리</button>
                <button className="ci-act navy"><Icon name="plus" size={13} /> 수업 생성</button>
              </div>} />
            <div className="ci-card" style={{ overflow: "hidden" }}>
              <div style={{ overflowX: "auto" }}>
                <table className="ci-table">
                  <thead><tr><th>Class UID</th><th>코스</th><th>담당 강사</th><th>일시</th><th>수강생</th><th>상태</th><th style={{ textAlign: "right" }}>작업</th></tr></thead>
                  <tbody>
                    {ADMIN_CLASSES.map((c) => (
                      <tr key={c.id}>
                        <td className="ci-uid">{c.id}</td>
                        <td style={{ fontWeight: 700 }}>{c.course}</td>
                        <td>{c.teacher}</td>
                        <td className="ci-mono" style={{ color: "var(--ci-muted)" }}>{c.date} {c.time}</td>
                        <td className="ci-mono">{c.students}명</td>
                        <td>{classState(c.state)}</td>
                        <td>
                          <span style={{ display: "flex", gap: 5, justifyContent: "flex-end" }}>
                            <button className="ci-act sm"><Icon name="users" size={11} /> 수강생</button>
                            <button className="ci-act sm"><Icon name="edit" size={11} /> 강사변경</button>
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── Data subscription monitor ── */}
        {tab === "subs" && (
          <div>
            <CiHead title="데이터 구독 모니터" api="Data Subscription"
              sub="수신 중인 메시지 유형별 집계 · 실시간 push 현황"
              action={<span className="ci-badge ok"><Icon name="signal" size={12} /> 수신 정상</span>} />
            <div className="ci-admin-grid">
              <div className="ci-card">
                <div style={{ padding: "16px 18px", borderBottom: "1px solid var(--ci-line)", fontWeight: 800, fontSize: 14 }}>메시지 유형별 수신</div>
                {SUB_MESSAGES.map((m) => (
                  <div key={m.name} className="ci-sub-row">
                    <span className="ci-sub-name">{m.name}</span>
                    <span className="ci-sub-n">{m.n.toLocaleString()}</span>
                    <span style={{ fontSize: 12, color: "var(--ci-muted)", minWidth: 72, textAlign: "right" }}>{m.last}</span>
                  </div>
                ))}
              </div>
              <div className="ci-card ci-card-pad">
                <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 12 }}>수신 로그</div>
                <div style={{ background: "#0B1117", borderRadius: 10, padding: 14, fontFamily: "var(--font-en)", fontSize: 11.5, lineHeight: 1.9, color: "#A6E3B8", maxHeight: 320, overflowY: "auto" }}>
                  <div><span style={{ color: "#5C6678" }}>20:42:02</span> <span style={{ color: "#FFD60A" }}>Rewards</span> {"{"} TUID: 10277431, times: 5 {"}"}</div>
                  <div><span style={{ color: "#5C6678" }}>20:41:48</span> <span style={{ color: "#FFD60A" }}>HandsUp</span> {"{"} handsUp: 6 {"}"}</div>
                  <div><span style={{ color: "#5C6678" }}>20:41:30</span> <span style={{ color: "#FFD60A" }}>Selector</span> {"{"} correct: 1, committed: 178 {"}"}</div>
                  <div><span style={{ color: "#5C6678" }}>20:40:55</span> <span style={{ color: "#FF8B8B" }}>HelpSeeking</span> {"{"} UID: 10266902 {"}"}</div>
                  <div><span style={{ color: "#5C6678" }}>20:40:12</span> <span style={{ color: "#9FD0FF" }}>EnterClassroom</span> {"{"} UID: 10233655, device: iPhone {"}"}</div>
                  <div><span style={{ color: "#5C6678" }}>20:39:40</span> <span style={{ color: "#9FD0FF" }}>UpDownStage</span> {"{"} UID: 10277431, op: up {"}"}</div>
                  <div><span style={{ color: "#5C6678" }}>20:39:02</span> <span style={{ color: "#FFD60A" }}>Rewards</span> {"{"} TUID: 10255810, times: 1 {"}"}</div>
                  <div><span style={{ color: "#5C6678" }}>20:38:30</span> <span style={{ color: "#C9C9C9" }}>Mute</span> {"{"} op: muteAll {"}"}</div>
                  <div><span style={{ color: "#5C6678" }}>20:38:01</span> <span style={{ color: "#9FD0FF" }}>NetworkCondition</span> {"{"} UID: 10266902, net: 41% {"}"}</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

window.AdminPage = AdminPage;
