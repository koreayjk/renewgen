/* global React, Icon, REALTIME, ROSTER, RECORDINGS, CLOUD_FOLDERS, CLOUD_FILES, REPORTS, DOWNLOADS, CLASSIN, findCourse, findInstructor, useApp */
// ClassIn dashboard panels — Realtime · Recordings · Cloud · Reports + shared bits

const { useState: useSt, useEffect: useEf, useRef: useRf } = React;

// ── ClassIn connection banner (Login/identity) ─────────────────────
// student=true → 학생에게는 SID·Secret 등 내부 연동값을 숨기고 안심 문구만 노출
function ConnBanner({ student }) {
  if (student) {
    return (
      <div className="ci-conn">
        <div className="ci-conn-logo"><span className="mark">in</span> ClassIn 연동</div>
        <div className="ci-conn-item"><span className="k">출석 체크</span><span className="v">자동</span></div>
        <div className="ci-conn-item"><span className="k">강의 녹화</span><span className="v">자동 저장</span></div>
        <div className="ci-conn-item"><span className="k">자료 동기화</span><span className="v">{CLASSIN.lastSync}</span></div>
        <span className="ci-conn-status"><span className="dot" /> 내 계정 연동 완료</span>
      </div>
    );
  }
  return (
    <div className="ci-conn">
      <div className="ci-conn-logo"><span className="mark">in</span> ClassIn 연동</div>
      <div className="ci-conn-item"><span className="k">School</span><span className="v">{CLASSIN.school}</span></div>
      <div className="ci-conn-item"><span className="k">SID</span><span className="v">{CLASSIN.sid}</span></div>
      <div className="ci-conn-item"><span className="k">Secret Key</span><span className="v">{CLASSIN.secretMasked}</span></div>
      <div className="ci-conn-item"><span className="k">데이터 동기화</span><span className="v">{CLASSIN.lastSync}</span></div>
      <span className="ci-conn-status"><span className="dot" /> 연동됨 · 본사 승인 완료</span>
    </div>
  );
}

function CiHead({ title, api, sub, action }) {
  return (
    <div className="ci-head">
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <h3>{title}</h3>
          {api && <span className="api-tag"><Icon name="server" size={11} /> {api}</span>}
        </div>
        {sub && <div className="sub">{sub}</div>}
      </div>
      {action}
    </div>
  );
}

// ── Auto-login classroom entry (Login URL) ─────────────────────────
function EnterCards({ courses, onEnter }) {
  return (
    <div className="ci-enter-grid">
      {courses.map((c, i) => {
        const ins = findInstructor(c.instructor);
        const live = i === 0;
        return (
          <div key={c.id} className={"ci-enter" + (live ? " live" : "")}>
            <div className="ci-enter-top">
              {live ? <span className="ci-pill-live"><span className="dot" /> LIVE</span>
                    : <span className="ci-badge neutral">{["19:00", "21:00"][i - 1] || "예정"} 시작</span>}
              <span className="ci-room">ROOM {c.classInRoomId}</span>
            </div>
            <div>
              <div className="ci-enter-title">{c.title}</div>
              <div className="ci-enter-meta">{ins?.name} · {c.level}</div>
            </div>
            <button className={"ci-btn-enter" + (live ? "" : " ghost")} onClick={() => onEnter(c.id)}>
              <Icon name="live" size={15} /> {live ? "원클릭 입장" : "입장 대기"}
            </button>
            <div className="ci-autologin"><Icon name="check" size={13} /> 자동 로그인 — 계정·비밀번호 입력 불필요</div>
          </div>
        );
      })}
    </div>
  );
}

// ── App download (Download URL) ────────────────────────────────────
function AppDownload() {
  const osIcon = { Windows: "monitor", macOS: "monitor", iOS: "user", Android: "user" };
  return (
    <div className="ci-dl-grid">
      {DOWNLOADS.map((d) => (
        <button key={d.os} className="ci-dl">
          <span className="os-ic"><Icon name={osIcon[d.os] || "download"} size={20} /></span>
          <span style={{ textAlign: "left" }}>
            <span className="os" style={{ display: "block" }}>{d.os}</span>
            <span className="note">{d.note}</span>
          </span>
          <span className="ver">v{d.ver}</span>
        </button>
      ))}
    </div>
  );
}

// ── Realtime data panel (Data Subscription) ────────────────────────
function RealtimePanel({ student }) {
  const rt = REALTIME;
  const [handsUp, setHandsUp] = useSt(rt.handsUp);
  const [rewards, setRewards] = useSt(rt.rewards);
  const [online, setOnline] = useSt(rt.online);
  const [feed, setFeed] = useSt(rt.feed);
  const [elapsed, setElapsed] = useSt(2538); // seconds

  // gentle live ticking
  useEf(() => {
    const t = setInterval(() => {
      setElapsed((s) => s + 1);
      if (Math.random() < 0.25) setHandsUp((h) => Math.max(0, h + (Math.random() < 0.6 ? 1 : -1)));
      if (Math.random() < 0.22) setRewards((r) => r + 1);
      if (Math.random() < 0.12) setOnline((o) => Math.min(rt.capacity, o + (Math.random() < 0.5 ? 1 : -1)));
    }, 1400);
    return () => clearInterval(t);
  }, []);

  const elapsedStr = `${String(Math.floor(elapsed / 3600)).padStart(2, "0")}:${String(Math.floor((elapsed % 3600) / 60)).padStart(2, "0")}:${String(elapsed % 60).padStart(2, "0")}`;
  const att = rt.attendance;
  const poll = rt.poll;
  const pollTotal = poll.dist.reduce((a, b) => a + b, 0);
  const course = findCourse(rt.courseId);

  const feedIcon = { reward: "trophy", handsup: "hand", answer: "check", help: "chat", enter: "user", exit: "arrowLeft", stage: "users", mute: "mic" };

  return (
    <div>
      <CiHead title="실시간 학습 데이터" api="Data Subscription"
        sub={`${course?.title} · ${rt.classId} · 라이브 진행 중`}
        action={<span className="ci-badge bad"><span style={{ width: 6, height: 6, borderRadius: "50%", background: "currentColor" }} /> 녹화 중 · {elapsedStr}</span>} />

      {/* top tiles */}
      <div className="ci-kpis" style={{ marginBottom: 16 }}>
        <div className="ci-kpi accent">
          <div className="lab"><span className="ico"><Icon name="users" size={16} /></span> 실시간 접속</div>
          <div className="num">{online}<small>/{rt.capacity}</small></div>
          <div className="sub">입장 {att.present} · 지각 {att.late} · 결석 {att.absent}</div>
        </div>
        <div className="ci-kpi">
          <div className="lab"><span className="ico"><Icon name="hand" size={16} /></span> 손들기</div>
          <div className="num">{handsUp}</div>
          <div className="sub">지금 질문 대기 중</div>
        </div>
        <div className="ci-kpi">
          <div className="lab"><span className="ico"><Icon name="trophy" size={16} /></span> 누적 트로피</div>
          <div className="num">{rewards}</div>
          <div className="sub">내 트로피 {rt.myRewards}개</div>
        </div>
        <div className="ci-kpi">
          <div className="lab"><span className="ico"><Icon name="check" size={16} /></span> 출석률</div>
          <div className="num">{att.rate}<small>%</small></div>
          <div className="sub">정시 입장 기준</div>
        </div>
        <div className="ci-kpi">
          <div className="lab"><span className="ico"><Icon name="chat" size={16} /></span> 도움 요청</div>
          <div className="num">{rt.helpSeeking}</div>
          <div className="sub">{student ? "강사에게 전달됨" : "관리자 전달됨"}</div>
        </div>
      </div>

      <div className="ci-rt">
        {/* left: attendance + poll */}
        <div className="ci-rt-tiles" style={{ gridTemplateColumns: "1fr", gap: 16 }}>
          <div className="ci-tile">
            <div className="lab"><Icon name="users" size={14} /> 출석 현황 · Enter / Exit the Classroom</div>
            <div className="ci-att-bar">
              <i className="present" style={{ width: (att.present / rt.capacity * 100) + "%" }} />
              <i className="late" style={{ width: (att.late / rt.capacity * 100) + "%" }} />
              <i className="absent" style={{ width: (att.absent / rt.capacity * 100) + "%" }} />
            </div>
            <div className="ci-att-legend">
              <span><i style={{ background: "var(--ci-navy)" }} /> 입장 {att.present}</span>
              <span><i style={{ background: "var(--ci-yellow)" }} /> 지각 {att.late}</span>
              <span><i style={{ background: "var(--ci-bg-2)" }} /> 결석 {att.absent}</span>
            </div>
          </div>

          <div className="ci-tile">
            <div className="lab" style={{ marginBottom: 6 }}><Icon name="check" size={14} /> 실시간 문제 · Selector / Responder</div>
            <div className="ci-poll-q">Q. {poll.question}</div>
            {poll.options.map((o, i) => {
              const pct = Math.round(poll.dist[i] / pollTotal * 100);
              return (
                <div key={i} className={"ci-poll-opt" + (i === poll.correct ? " correct" : "")}>
                  <span className="key">{String.fromCharCode(9312 + i)}</span>
                  <span className="ci-poll-track"><i style={{ width: pct + "%" }} /></span>
                  <span className="ci-poll-pct">{pct}%</span>
                </div>
              );
            })}
            <div style={{ fontSize: 12, color: "var(--ci-muted)", marginTop: 10, display: "flex", justifyContent: "space-between" }}>
              <span>응답 {poll.committed} / {poll.participants}명</span>
              <span style={{ fontWeight: 800, color: "var(--ci-ok)" }}>정답률 {Math.round(poll.dist[poll.correct] / pollTotal * 100)}%</span>
            </div>
          </div>
        </div>

        {/* right: live event feed */}
        <div className="ci-card ci-feed">
          <div className="ci-feed-head">
            <strong style={{ fontSize: 14, fontWeight: 800 }}>실시간 이벤트 스트림</strong>
            <span className="ci-badge ok"><Icon name="signal" size={11} /> LIVE PUSH</span>
          </div>
          <div className="ci-feed-list">
            {feed.map((f, i) => (
              <div key={i} className="ci-feed-row">
                <span className={"ci-feed-ic " + f.type}><Icon name={feedIcon[f.type] || "sparkle"} size={13} /></span>
                <span className="ci-feed-txt"><b>{f.who}</b><span>{f.msg}</span></span>
                <span className="ci-feed-t">{f.t}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* roster: network / equipment / stage / mute — 관리자/강사 전용 (학생에게는 숨김) */}
      {!student && <div className="ci-card" style={{ marginTop: 16, overflow: "hidden" }}>
        <div style={{ padding: "16px 18px", borderBottom: "1px solid var(--ci-line)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <strong style={{ fontSize: 14, fontWeight: 800 }}>수강생 상태 · Network · Equipment · Stage · Mute</strong>
          <span className="ci-badge navy">{ROSTER.filter((s) => s.online).length}명 접속</span>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table className="ci-table">
            <thead>
              <tr><th>UID</th><th>이름</th><th>장치</th><th>네트워크</th><th>CPU</th><th style={{ textAlign: "center" }}>카메라</th><th style={{ textAlign: "center" }}>마이크</th><th style={{ textAlign: "center" }}>스테이지</th></tr>
            </thead>
            <tbody>
              {ROSTER.map((s) => {
                const lvl = s.net >= 75 ? "good" : s.net >= 45 ? "mid" : "low";
                return (
                  <tr key={s.uid} style={{ opacity: s.online ? 1 : 0.45 }}>
                    <td className="ci-uid">{s.uid}</td>
                    <td><span className="ci-nameav"><span className={"av" + (s.me ? " me" : "")}>{s.initials}</span>{s.name}{s.me && <span style={{ fontSize: 11, color: "var(--ci-muted)", fontWeight: 600 }}>(나)</span>}</span></td>
                    <td><span className="ci-dev"><Icon name="monitor" size={13} /> {s.device}</span></td>
                    <td>{s.online ? <span className="ci-net"><span className="ci-net-bar"><i className={lvl} style={{ width: s.net + "%" }} /></span><span className="ci-mono">{s.net}</span></span> : <span className="ci-badge neutral">오프라인</span>}</td>
                    <td className="ci-mono">{s.online ? s.cpu + "%" : "—"}</td>
                    <td style={{ textAlign: "center" }}><span className={"ci-flag " + (s.cam ? "on" : "off")}><Icon name="eye" size={13} /></span></td>
                    <td style={{ textAlign: "center" }}><span className={"ci-flag " + (s.mic ? "on" : "off")}><Icon name="mic" size={13} /></span></td>
                    <td style={{ textAlign: "center" }}>{s.stage ? <span className="ci-badge ok">온</span> : <span className="ci-badge neutral">오프</span>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>}
    </div>
  );
}

// ── Recordings panel (Broadcast / Recording File / Watching Data) ──
function RecordingsPanel({ onPlay, student }) {
  return (
    <div>
      <CiHead title="다시보기 · 녹화본" api="Broadcast"
        sub="모든 라이브는 자동 녹화 후 5분 내 업로드됩니다 · 재생 횟수는 Watching Data로 집계"
        action={<span className="ci-badge ok"><Icon name="refresh" size={12} /> 자동 동기화</span>} />
      <div className="ci-card">
        {RECORDINGS.map((r) => {
          const course = findCourse(r.courseId);
          return (
            <div key={r.id} className="ci-rec-row">
              <div className="ci-rec-thumb">
                {r.ready ? <span className="play"><Icon name="play" size={16} /></span>
                         : <span className="ci-pill-live"><span className="dot" /> 녹화 중</span>}
                {r.ready && <span className="dur">{r.duration}</span>}
              </div>
              <div>
                <div className="ci-rec-title">{r.title}</div>
                <div className="ci-rec-meta">{course?.title} · {r.date} {r.start}~{r.end} · {r.size}
                  {r.locked && <span className="ci-badge neutral" style={{ marginLeft: 8 }}><Icon name="lock" size={10} /> 잠금</span>}
                </div>
              </div>
              {!student && <div className="ci-rec-views"><b>{r.viewsPage.toLocaleString()}</b>페이지 재생</div>}
              {!student && <div className="ci-rec-views"><b>{r.viewsApp.toLocaleString()}</b>앱 재생</div>}
              <div style={{ display: "flex", gap: 6 }}>
                {r.ready
                  ? (student
                      ? <button className="ci-act navy" onClick={() => onPlay(r.courseId)}><Icon name="play" size={12} /> 재생</button>
                      : <><button className="ci-act navy" onClick={() => onPlay(r.courseId)}><Icon name="play" size={12} /> 재생</button>
                       <button className="ci-act sm"><Icon name="download" size={12} /></button></>)
                  : <button className="ci-act" disabled style={{ opacity: 0.5 }}>처리 중…</button>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Cloud disk panel (Cloud Disk API) ──────────────────────────────
function CloudPanel({ student }) {
  const [active, setActive] = useSt("f-math");
  const files = CLOUD_FILES.filter((f) => f.folder === active);
  const folder = CLOUD_FOLDERS.find((f) => f.id === active);
  return (
    <div>
      <CiHead title="강의자료 클라우드" api="Cloud Disk"
        sub={student ? "라이브 판서·강의자료를 한 곳에서 내려받으세요" : "라이브 판서·업로드·eeo.cn 동기화 자료를 한 곳에서 · 최대 5,000 폴더 / 깊이 15"}
        action={student ? null : <button className="ci-act navy"><Icon name="upload" size={13} /> 파일 업로드</button>} />
      <div className="ci-cloud">
        <div className="ci-card ci-folders">
          {CLOUD_FOLDERS.map((f) => (
            <button key={f.id} className={"ci-folder" + (active === f.id ? " active" : "")} style={{ paddingLeft: f.top ? 12 : 24 }} onClick={() => setActive(f.id)}>
              <Icon name="folder" size={16} />
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.name}</span>
              <span className="cnt">{f.count}</span>
            </button>
          ))}
        </div>
        <div className="ci-card">
          <div className="ci-cloud-toolbar">
            <strong style={{ fontSize: 13.5, fontWeight: 800 }}>{folder?.name}</strong>
            <span className="ci-badge neutral">{files.length}개 파일</span>
            {!student && <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
              <button className="ci-act sm"><Icon name="folder" size={12} /> 새 폴더</button>
              <button className="ci-act sm"><Icon name="refresh" size={12} /> 동기화</button>
            </div>}
          </div>
          <div className="ci-file-row head"><span></span><span>파일명</span><span>출처</span><span>크기</span><span>수정</span><span>{student ? "" : "작업"}</span></div>
          {files.map((f) => (
            <div key={f.id} className="ci-file-row">
              <span className={"ci-file-ic " + f.type}>{f.type.toUpperCase()}</span>
              <span><span className="ci-file-name">{f.name}</span>
                <span className="ci-file-from">{f.from}{!f.converted && <span className="ci-badge warn" style={{ marginLeft: 6 }}><Icon name="refresh" size={9} /> 변환 중</span>}{f.converted && f.from === "라이브" && <span className="ci-badge ok" style={{ marginLeft: 6 }}>변환 완료</span>}</span>
              </span>
              <span style={{ color: "var(--ci-muted)", fontSize: 12 }}>{f.from}</span>
              <span className="ci-mono" style={{ color: "var(--ci-muted)" }}>{f.size}</span>
              <span style={{ color: "var(--ci-muted)", fontSize: 12 }}>{f.modified}</span>
              <span style={{ display: "flex", gap: 4 }}>
                <button className="ci-act sm"><Icon name="download" size={11} /></button>
                {!student && <button className="ci-act sm"><Icon name="edit" size={11} /></button>}
                {!student && <button className="ci-act sm"><Icon name="trash" size={11} /></button>}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Reports panel (Class Summary Data + Teacher/Student Appraise) ──
function ReportsPanel() {
  const ins = findInstructor("kim-jiwon");
  return (
    <div>
      <CiHead title="수업 종료 리포트" api="Class Summary · Appraise"
        sub="수업이 끝나면 출석·집중·정답·트로피·평가가 자동 집계됩니다" />
      <div style={{ display: "grid", gap: 18 }}>
        {REPORTS.map((r) => (
          <div key={r.id} className="ci-report">
            <div className="ci-report-head">
              <div>
                <div style={{ fontSize: 12, color: "var(--ci-muted)", fontWeight: 700, marginBottom: 4 }}>{r.date} · {r.duration} · 채팅 {r.chatCount}건 · 판서 이미지 {r.blackboardImgs}장</div>
                <div style={{ fontWeight: 900, fontSize: 19, letterSpacing: "-0.03em" }}>{r.title}</div>
              </div>
              <div style={{ display: "flex", gap: 18, alignItems: "center" }}>
                <div style={{ textAlign: "center" }}>
                  <div className="ci-ring" style={{ "--p": r.answerRate }}><span className="val">{r.answerRate}</span></div>
                  <div style={{ fontSize: 11, color: "var(--ci-muted)", marginTop: 6, fontWeight: 700 }}>정답률</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div className="ci-ring" style={{ "--p": r.focus }}><span className="val">{r.focus}</span></div>
                  <div style={{ fontSize: 11, color: "var(--ci-muted)", marginTop: 6, fontWeight: 700 }}>집중도</div>
                </div>
              </div>
            </div>
            <div className="ci-report-grid">
              <div className="ci-report-cell"><div className="k">출석률</div><div className="v">{r.attendanceRate}<small>%</small></div></div>
              <div className="ci-report-cell"><div className="k">출석 / 지각 / 결석</div><div className="v" style={{ fontSize: 20 }}>{r.present}<small> / {r.late} / {r.absent}</small></div></div>
              <div className="ci-report-cell"><div className="k">손들기 · 트로피</div><div className="v">{r.handsUp}<small> · {r.rewards}</small></div></div>
              <div className="ci-report-cell"><div className="k">내 트로피</div><div className="v">{r.myRewards}<small>개</small></div></div>
            </div>
            <div className="ci-report-comment">
              <span className="av">{ins?.initials}</span>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                  <strong style={{ fontSize: 14 }}>{ins?.name} 강사 평가</strong>
                  <span className="ci-badge ok"><Icon name="star" size={11} /> 강사 {r.appraiseTeacher} · 학생 {r.appraiseStudent}</span>
                </div>
                <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: "var(--ci-ink)" }}>{r.comment}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

Object.assign(window, {
  ConnBanner, CiHead, EnterCards, AppDownload,
  RealtimePanel, RecordingsPanel, CloudPanel, ReportsPanel,
});
