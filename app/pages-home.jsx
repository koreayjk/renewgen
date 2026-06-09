/* global React, COURSES, INSTRUCTORS, SUBJECTS, NOTICES, useApp, Icon, CoursePoster, SectionHead, findInstructor, formatKRW */

const { useState: useStateHome } = React;

function HomePage() {
  const { tweaks } = useApp();
  // Academy style is a totally different design language — route to its own component.
  if ((tweaks.homeStyle || "editorial") === "academy") {
    return <HomeAcademy />;
  }
  const hero = tweaks.heroLayout || "split";
  return (
    <div className="page-enter">
      {hero === "split" && <HeroSplit />}
      {hero === "stack" && <HeroStack />}
      {hero === "marquee" && <HeroMarquee />}
      <HomeMarqueeBand />
      <HomeFeaturedCourses />
      <HomeWhy />
      <HomeInstructors />
      <HomeLive />
      <HomeTestimonial />
      <HomeCTA />
    </div>
  );
}

// ─── Hero 1: Split editorial ────────────────────────────────────────
function HeroSplit() {
  const { navigate } = useApp();
  const featured = COURSES[0];
  return (
    <section style={{ borderBottom: "1px solid var(--rj-faint)" }}>
      <div className="container-wide" style={{ paddingTop: 56, paddingBottom: 80 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1.25fr 1fr", gap: 64, alignItems: "stretch" }}>
          <div>
            <div className="eyebrow" style={{ color: "var(--rj-muted)" }}>EST. MMXXVI &nbsp;·&nbsp; SEOUL · ONLINE</div>
            <h1 style={{
              fontFamily: "var(--font-kr-serif)",
              fontWeight: 500,
              fontSize: "clamp(56px, 7vw, 116px)",
              lineHeight: 0.98,
              letterSpacing: "-0.035em",
              margin: "26px 0 8px",
            }}>
              정통의 입시,<br />
              <span style={{ fontStyle: "italic", fontWeight: 300, fontFamily: "var(--font-en)" }}>renewed.</span>
            </h1>
            <p className="body-lg" style={{ maxWidth: 520, color: "var(--rj-muted)", marginTop: 28 }}>
              실시간 라이브 강의와 무제한 다시보기. 매주의 학습을 끊기지 않게 잇는,
              초·중·고 입시 전용 온라인 아카데미.
            </p>
            <div style={{ display: "flex", gap: 12, marginTop: 36, flexWrap: "wrap" }}>
              <button className="btn btn-primary btn-lg" onClick={() => navigate("/courses")}>
                강의 둘러보기 <Icon name="arrow" />
              </button>
              <button className="btn btn-ghost btn-lg" onClick={() => navigate("/live")}>
                <Icon name="live" /> 오늘의 라이브
              </button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, auto)", gap: 36, marginTop: 56, paddingTop: 32, borderTop: "1px solid var(--rj-faint)" }}>
              {[
                { n: "12,000+", l: "Active Students" },
                { n: "94%", l: "Live Attendance" },
                { n: "4.9", l: "Avg. Rating" },
                { n: "13", l: "Years of Renewjen" },
              ].map((s) => (
                <div key={s.l}>
                  <div className="num-en" style={{ fontSize: 28, fontWeight: 600 }}>{s.n}</div>
                  <div className="label-cap" style={{ color: "var(--rj-muted)", marginTop: 4 }}>{s.l}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ position: "relative" }}>
            <div style={{ display: "grid", gridTemplateRows: "1.4fr 1fr", gridTemplateColumns: "1fr 1fr", gap: 16, height: "100%" }}>
              <div style={{ gridColumn: "1 / 3" }}>
                <CoursePoster course={featured} onClick={() => navigate("/courses/" + featured.id)} />
              </div>
              <div className="card-ink" style={{ padding: 20, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <div>
                  <span className="chip chip-live">LIVE 21:00</span>
                  <div style={{ fontFamily: "var(--font-kr-serif)", fontSize: 18, marginTop: 14, lineHeight: 1.3 }}>오늘 — 구문독해 RE:BUILD 6강</div>
                </div>
                <button className="btn btn-accent btn-sm" onClick={() => navigate("/live")}>입장하기 <Icon name="arrow" size={14} /></button>
              </div>
              <div className="card-accent" style={{ padding: 20, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <div>
                  <div className="label-cap" style={{ opacity: 0.7 }}>NEW · 신규</div>
                  <div style={{ fontFamily: "var(--font-kr-serif)", fontSize: 18, marginTop: 14, lineHeight: 1.3 }}>문학·독서 정도 — 박세라</div>
                </div>
                <div className="num-en" style={{ fontSize: 12, opacity: 0.7 }}>14 weeks · 56 lessons</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Hero 2: Centered stacked ───────────────────────────────────────
function HeroStack() {
  const { navigate } = useApp();
  return (
    <section style={{ borderBottom: "1px solid var(--rj-faint)" }}>
      <div className="container" style={{ paddingTop: 88, paddingBottom: 80, textAlign: "center" }}>
        <div className="eyebrow no-rule" style={{ justifyContent: "center", color: "var(--rj-muted)" }}>RENEWJEN · ACADEMY · 2026</div>
        <h1 style={{
          fontFamily: "var(--font-kr-serif)",
          fontWeight: 500,
          fontSize: "clamp(64px, 9vw, 156px)",
          lineHeight: 0.96,
          letterSpacing: "-0.04em",
          margin: "28px auto 0",
          maxWidth: 1000,
        }}>
          한 주의 학습이<br />
          <span style={{ fontFamily: "var(--font-en)", fontStyle: "italic", fontWeight: 300 }}>uninterrupted.</span>
        </h1>
        <p className="body-lg" style={{ maxWidth: 600, margin: "32px auto 0", color: "var(--rj-muted)" }}>
          라이브 수업 — 즉시 다시보기 — 첨삭. 끊김 없이 이어지는 입시 학습.
        </p>
        <div style={{ display: "flex", gap: 12, marginTop: 36, justifyContent: "center", flexWrap: "wrap" }}>
          <button className="btn btn-primary btn-lg" onClick={() => navigate("/courses")}>강의 둘러보기 <Icon name="arrow" /></button>
          <button className="btn btn-ghost btn-lg" onClick={() => navigate("/signup")}>회원가입</button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 24, marginTop: 80 }}>
          {COURSES.slice(0, 4).map((c) => (
            <CoursePoster key={c.id} course={c} onClick={() => navigate("/courses/" + c.id)} />
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Hero 3: Marquee + full-width course tape ───────────────────────
function HeroMarquee() {
  const { navigate } = useApp();
  return (
    <section style={{ background: "var(--rj-ink)", color: "var(--rj-paper)", borderBottom: "1px solid var(--rj-line)" }}>
      <div className="container-wide" style={{ paddingTop: 56, paddingBottom: 0 }}>
        <div className="eyebrow no-rule" style={{ color: "rgba(245,241,233,0.6)" }}>RENEWJEN ACADEMY · LIVE · ON DEMAND</div>
        <h1 style={{
          fontFamily: "var(--font-kr-serif)",
          fontWeight: 500,
          fontSize: "clamp(60px, 8vw, 132px)",
          lineHeight: 0.98,
          letterSpacing: "-0.035em",
          margin: "28px 0 16px",
          maxWidth: 1200,
        }}>
          입시는 매주<br />
          <span style={{ fontFamily: "var(--font-en)", fontStyle: "italic", fontWeight: 300 }}>compounding.</span>
        </h1>
        <p className="body-lg" style={{ maxWidth: 620, color: "rgba(245,241,233,0.7)" }}>
          정통의 풀이를 매주 라이브로. 끝난 강의는 다시 볼 수 있고, 다시 본 강의는 첨삭으로 닫힙니다.
        </p>
        <div style={{ display: "flex", gap: 12, marginTop: 32, flexWrap: "wrap" }}>
          <button className="btn btn-accent btn-lg" onClick={() => navigate("/courses")}>강의 둘러보기 <Icon name="arrow" /></button>
          <button className="btn btn-lg" style={{ background: "transparent", color: "var(--rj-paper)", border: "1px solid var(--rj-paper)" }} onClick={() => navigate("/live")}><Icon name="live" /> 오늘의 라이브</button>
        </div>
      </div>
      <div style={{ marginTop: 64, borderTop: "1px solid rgba(245,241,233,0.18)", overflow: "hidden", padding: "32px 0" }}>
        <div style={{ display: "flex", gap: 24, animation: "marqueeX 40s linear infinite", width: "max-content" }}>
          {[...COURSES, ...COURSES].map((c, i) => (
            <div key={i} style={{ width: 240 }}>
              <CoursePoster course={c} onClick={() => navigate("/courses/" + c.id)} />
            </div>
          ))}
        </div>
        <style>{`@keyframes marqueeX { from { transform: translateX(0); } to { transform: translateX(-50%); } }`}</style>
      </div>
    </section>
  );
}

// ─── Marquee band of subjects ───────────────────────────────────────
function HomeMarqueeBand() {
  return (
    <section style={{ background: "var(--rj-ink)", color: "var(--rj-paper)", padding: "20px 0", overflow: "hidden" }}>
      <div style={{ display: "flex", gap: 56, whiteSpace: "nowrap", animation: "marqueeX 36s linear infinite", width: "max-content" }}>
        {[...Array(3)].map((_, i) => (
          <div key={i} style={{ display: "flex", gap: 56 }}>
            {["수능 국어 — Korean", "수능 수학 — Mathematics", "수능 영어 — English", "탐구 — Inquiry", "한국사 — History", "내신 — School Records", "Renewjen LIVE", "VOD On Demand"].map((t, j) => (
              <span key={j} style={{ fontFamily: "var(--font-kr-serif)", fontSize: 22, letterSpacing: "-0.02em", display: "inline-flex", alignItems: "center", gap: 16 }}>
                {t} <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--rj-accent)" }} />
              </span>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}

function HomeFeaturedCourses() {
  const { navigate } = useApp();
  return (
    <section className="container-wide" style={{ paddingTop: 96, paddingBottom: 32 }}>
      <SectionHead
        ko="이번 시즌의 강의"
        en="Featured · Live This Season"
        action={<button className="btn btn-ghost btn-sm" onClick={() => navigate("/courses")}>전체 보기 <Icon name="arrow" size={14} /></button>}
      />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20 }}>
        {COURSES.slice(0, 4).map((c) => (
          <CoursePoster key={c.id} course={c} onClick={() => navigate("/courses/" + c.id)} />
        ))}
      </div>
    </section>
  );
}

function HomeWhy() {
  return (
    <section className="container-wide" style={{ paddingTop: 96, paddingBottom: 0 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: 64, alignItems: "start" }}>
        <div style={{ position: "sticky", top: 120 }}>
          <div className="eyebrow" style={{ color: "var(--rj-muted)" }}>Why Renewjen — 왜 리뉴젠인가</div>
          <h2 style={{ fontFamily: "var(--font-kr-serif)", fontWeight: 500, fontSize: 48, letterSpacing: "-0.025em", lineHeight: 1.1, margin: "16px 0 0" }}>
            라이브와 다시보기,<br />그리고 첨삭으로<br />매주가 닫힙니다.
          </h2>
        </div>
        <div style={{ display: "grid", gap: 0 }}>
          {[
            { no: "01", en: "Live Class", ko: "리뉴젠 라이브 강의실", body: "자체 라이브 강의실 — 화이트보드·실시간 채팅·질문권·소그룹 토론까지 사이트 안에서 끝납니다. 늦지 않습니다 — 매 수업 즉시 다시보기로 변환됩니다." },
            { no: "02", en: "On Demand", ko: "고화질 다시보기 무제한", body: "라이브 종료 5분 안에 1080p VOD 업로드. 1.0x ~ 2.0x 변속, 챕터 마커, PIP, 노트 — 다시 보면 다시 풀립니다." },
            { no: "03", en: "Feedback", ko: "주간 첨삭과 질문방", body: "매주 과제는 강사 직접 첨삭. 전용 질문방에서 24시간 안에 답변. 한 주의 학습은 첨삭으로 닫힙니다." },
            { no: "04", en: "Records", ko: "내 학습의 모든 흔적", body: "어디까지 봤는지, 어디서 멈췄는지, 어떤 문제를 틀렸는지. 마이페이지가 매주를 기록합니다." },
          ].map((row, i) => (
            <div key={row.no} style={{
              display: "grid",
              gridTemplateColumns: "120px 1fr",
              gap: 32,
              padding: "32px 0",
              borderTop: i === 0 ? "1px solid var(--rj-line)" : "1px solid var(--rj-faint)",
              borderBottom: i === 3 ? "1px solid var(--rj-line)" : "none",
              alignItems: "start",
            }}>
              <div className="num-en" style={{ fontSize: 64, fontWeight: 300, lineHeight: 1 }}>{row.no}</div>
              <div>
                <div className="eyebrow" style={{ color: "var(--rj-muted)" }}>{row.en}</div>
                <h3 style={{ fontFamily: "var(--font-kr-serif)", fontWeight: 500, fontSize: 28, margin: "8px 0 12px", letterSpacing: "-0.025em" }}>{row.ko}</h3>
                <p style={{ maxWidth: 580, color: "var(--rj-muted)", margin: 0 }}>{row.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HomeInstructors() {
  const { navigate } = useApp();
  return (
    <section className="container-wide" style={{ paddingTop: 120 }}>
      <SectionHead
        ko="아카데미 강사진"
        en="The Faculty"
        action={<button className="btn btn-ghost btn-sm" onClick={() => navigate("/instructors")}>전체 강사 <Icon name="arrow" size={14} /></button>}
      />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20 }}>
        {INSTRUCTORS.map((ins) => (
          <button key={ins.id} className="card" style={{ padding: 24, textAlign: "left", cursor: "pointer", display: "flex", flexDirection: "column", gap: 16 }}
                  onClick={() => navigate("/instructors/" + ins.id)}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <span className="avatar avatar-lg" style={{ background: "var(--rj-ink)", color: "var(--rj-paper)" }}>{ins.initials}</span>
              <span className="tag">{ins.subject}</span>
            </div>
            <div>
              <div style={{ fontFamily: "var(--font-kr-serif)", fontSize: 24, letterSpacing: "-0.025em" }}>{ins.name}</div>
              <div style={{ fontFamily: "var(--font-en)", fontStyle: "italic", fontWeight: 300, fontSize: 13, color: "var(--rj-muted)", marginTop: 4 }}>{ins.nameEn}</div>
            </div>
            <p style={{ fontSize: 13, color: "var(--rj-muted)", margin: 0, minHeight: 60 }}>{ins.bioShort}</p>
            <div style={{ paddingTop: 12, borderTop: "1px solid var(--rj-faint)", display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--rj-muted)" }}>
              <span><span className="num-en">{ins.students.toLocaleString()}</span> 수강생</span>
              <span><Icon name="star" size={10} /> <span className="num-en">{ins.rating}</span> · {ins.courses}강의</span>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}

function HomeLive() {
  const { navigate } = useApp();
  const live = COURSES.slice(0, 3);
  return (
    <section style={{ background: "var(--rj-ink)", color: "var(--rj-paper)", marginTop: 120, padding: "96px 0" }}>
      <div className="container-wide">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 40 }}>
          <div>
            <div className="eyebrow" style={{ color: "rgba(245,241,233,0.6)" }}>Today on Air — 오늘의 라이브</div>
            <h2 style={{ fontFamily: "var(--font-kr-serif)", fontWeight: 500, fontSize: 48, letterSpacing: "-0.025em", margin: "16px 0 0" }}>
              지금 입장 가능한 수업
            </h2>
          </div>
          <button className="btn btn-accent" onClick={() => navigate("/live")}>전체 시간표 <Icon name="arrow" size={14} /></button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
          {live.map((c, i) => {
            const ins = findInstructor(c.instructor);
            return (
              <div key={c.id} style={{ border: "1px solid rgba(245,241,233,0.18)", borderRadius: "var(--rj-r)", padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span className={"chip " + (i === 0 ? "chip-live" : "")} style={i === 0 ? {} : { borderColor: "rgba(245,241,233,0.3)" }}>
                    {i === 0 ? "LIVE NOW" : ["19:00", "21:00"][i - 1] + " 예정"}
                  </span>
                  <span style={{ fontFamily: "var(--font-en)", fontSize: 11, letterSpacing: "0.12em", color: "rgba(245,241,233,0.5)" }}>RENEWJEN LIVE</span>
                </div>
                <div>
                  <div style={{ fontFamily: "var(--font-kr-serif)", fontSize: 24, letterSpacing: "-0.025em", lineHeight: 1.2 }}>{c.title}</div>
                  <div style={{ fontSize: 13, color: "rgba(245,241,233,0.6)", marginTop: 6 }}>{ins?.name} · {c.level}</div>
                </div>
                <div style={{ marginTop: "auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontFamily: "var(--font-en)", fontSize: 11, letterSpacing: "0.12em", color: "rgba(245,241,233,0.5)" }}>ROOM {c.classInRoomId}</span>
                  <button className="btn btn-accent btn-sm" onClick={() => navigate("/live/" + c.id)}>입장하기 <Icon name="arrow" size={14} /></button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function HomeTestimonial() {
  return (
    <section className="container" style={{ paddingTop: 120, paddingBottom: 0 }}>
      <div style={{ textAlign: "center", maxWidth: 920, margin: "0 auto" }}>
        <div className="eyebrow no-rule" style={{ justifyContent: "center", color: "var(--rj-muted)" }}>Voices · 수강생의 말</div>
        <blockquote style={{
          fontFamily: "var(--font-kr-serif)",
          fontWeight: 400,
          fontSize: "clamp(28px, 3.4vw, 48px)",
          lineHeight: 1.25,
          letterSpacing: "-0.025em",
          margin: "32px 0 24px",
        }}>
          “풀이를 외우던 시절로 돌아가고 싶지 않습니다.<br />
          라이브 수업을 듣고, 다시보기로 닫고, 첨삭으로 마무리.<br />
          한 주가 매주 닫혀요.”
        </blockquote>
        <div style={{ fontSize: 13, color: "var(--rj-muted)" }}>이*수 — 고3 · 2026 미적분 정수 수강 中</div>
      </div>
    </section>
  );
}

function HomeCTA() {
  const { navigate, user } = useApp();
  return (
    <section className="container-wide" style={{ paddingTop: 120, paddingBottom: 0 }}>
      <div className="card-accent" style={{
        padding: "72px 64px",
        display: "grid",
        gridTemplateColumns: "1.5fr 1fr",
        alignItems: "center",
        gap: 40,
        position: "relative",
        overflow: "hidden",
      }}>
        <div>
          <div className="eyebrow" style={{ color: "rgba(10,10,10,0.6)" }}>Start Now — 지금 시작하기</div>
          <h2 style={{ fontFamily: "var(--font-kr-serif)", fontWeight: 500, fontSize: "clamp(36px, 4vw, 64px)", letterSpacing: "-0.03em", lineHeight: 1.05, margin: "16px 0 0" }}>
            첫 주 수업을 무료로<br /> 들어보세요.
          </h2>
          <p className="body-lg" style={{ marginTop: 20, maxWidth: 540 }}>회원가입 후 모든 강의의 1주차 라이브와 다시보기를 무료로 제공합니다. 마음에 들지 않으면 결제하지 않으셔도 됩니다.</p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12, alignItems: "stretch" }}>
          <button className="btn btn-primary btn-lg" onClick={() => navigate(user ? "/courses" : "/signup")}>{user ? "강의 둘러보기" : "무료로 시작하기"} <Icon name="arrow" /></button>
          <button className="btn btn-lg" style={{ background: "transparent", border: "1px solid var(--rj-ink)" }} onClick={() => navigate("/courses")}>강의 라인업 보기</button>
        </div>
      </div>
    </section>
  );
}

window.HomePage = HomePage;
