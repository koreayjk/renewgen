/* global React, COURSES, INSTRUCTORS, SUBJECTS, REVIEWS, useApp, Icon, findInstructor, findSubject, formatKRW */

// ════════════════════════════════════════════════════════════════════
//   HomeAcademy — Megastudy / Etoos / Daesung style home page
//   Bold red·navy, instructor faces, acceptance brags, rankings.
// ════════════════════════════════════════════════════════════════════

const { useState: useStateAcad, useMemo: useMemoAcad } = React;

function HomeAcademy() {
  const edu = window.RJ_EDU_MODE;
  return (
    <div className="page-enter">
      <AcadHero />
      {/* EDU MODE: 실시간(Key Point)·오프라인(질문답변) 블록을 가리고 그 자리에 기관 소개(About) 노출 */}
      {edu ? (
        <AboutPage />
      ) : (
        <>
          <AboutKeyPoints />
          <AboutObjections />
        </>
      )}
      <AboutCompare />
      <AboutResults />
      <AcadPhotoBand />
      <AcadReviews />
    </div>
  );
}

// ── 수업 현장 포토 밴드 ─────────────────────────────────────────────
function AcadPhotoBand() {
  const photos = ["p11.jpg", "p17.jpg", "p14.jpg", "p05.jpg"];
  return (
    <section style={{ background: "#0A1626" }}>
      <div className="container-wide" style={{ paddingTop: 72, paddingBottom: 76 }}>
        <div style={{ textAlign: "center", marginBottom: 30 }}>
          <span style={{ display: "inline-block", background: "var(--acad-yellow)", color: "var(--acad-navy)", fontWeight: 800, fontSize: 13, padding: "7px 13px", borderRadius: 5 }}>수업 현장</span>
          <h2 style={{ color: "#fff", fontWeight: 900, fontSize: "clamp(28px, 3.4vw, 42px)", letterSpacing: "-0.04em", margin: "18px 0 0" }}>
            화면 너머, <em style={{ fontStyle: "normal", color: "var(--acad-yellow)" }}>매일 만나는</em> 리뉴젠 교실
          </h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
          {photos.map((p) => (
            <div key={p} style={{ aspectRatio: "4 / 5", borderRadius: 14, overflow: "hidden", border: "1px solid rgba(255,255,255,0.12)" }}>
              <img src={"assets/photos/" + p} alt="리뉴젠 온라인 수업 현장" loading="lazy"
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Hero ──────────────────────────────────────────────────────────
function AcadHero() {
  return (
    <section style={{
      position: "relative", display: "flex", alignItems: "center", minHeight: "80vh",
      backgroundImage: "url(assets/photos/p02.jpg)", backgroundSize: "cover", backgroundPosition: "center 35%",
    }}>
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(96deg, rgba(0,16,34,0.94) 0%, rgba(0,16,34,0.80) 40%, rgba(0,16,34,0.46) 78%, rgba(0,16,34,0.30) 100%)" }} />
      <div className="container-wide" style={{ position: "relative", paddingTop: 110, paddingBottom: 110 }}>
        <span style={{ display: "inline-block", background: "var(--acad-yellow)", color: "var(--acad-navy)", fontWeight: 800, fontSize: 13.5, padding: "8px 14px", borderRadius: 6, letterSpacing: "-0.01em" }}>
          대한민국 기독교 교육 1위 · 국내·해외 입시
        </span>
        <h1 className="acad-headline" style={{ color: "#fff", fontSize: "clamp(36px, 4.6vw, 62px)", lineHeight: 1.12, letterSpacing: "-0.045em", margin: "24px 0 0" }}>
          대한민국 기독교 교육 <em style={{ fontStyle: "normal", color: "var(--acad-yellow)" }}>1위</em><br />
          국내·해외 입시 <em style={{ fontStyle: "normal", color: "var(--acad-yellow)" }}>TCS</em>,<br />
          <em style={{ fontStyle: "normal", color: "var(--acad-yellow)" }}>Total Care System</em>.
        </h1>
        <p style={{ color: "rgba(255,255,255,0.9)", fontSize: "clamp(16px, 1.55vw, 20px)", lineHeight: 1.72, maxWidth: 700, marginTop: 24, fontWeight: 500 }}>
          {eduText("리뉴젠 아카데미는 온라인 실시간 수업으로, 기독교 관점의 교과목 학습을 제공합니다.", "리뉴젠 아카데미는 녹화 강의로, 기독교 관점의 교과목 학습을 제공합니다.")}<br />
          검정고시부터 수능·토플까지 — 끊김 없는 한 주의 학습을 완성하세요.
        </p>
      </div>
    </section>
  );
}

function AcadHeroBillboard() {
  const { navigate } = useApp();
  const star = INSTRUCTORS[0]; // 김지원 — 수학 1타
  const course = COURSES[0];   // 미적분 정수
  return (
    <div style={{ display: "grid", gap: 12, position: "relative" }}>
      <div style={{
        background: "linear-gradient(180deg, #1B3675 0%, #0B1E3F 100%)",
        border: "1px solid rgba(255,255,255,0.12)",
        borderRadius: 14,
        padding: 24,
        color: "#fff",
        display: "grid",
        gridTemplateColumns: "auto 1fr",
        gap: 22,
        alignItems: "center",
        position: "relative",
        overflow: "hidden",
      }}>
        {/* Big initials portrait */}
        <div style={{
          width: 180, height: 220,
          background: "linear-gradient(180deg, rgba(255,229,0,0.0) 30%, rgba(229,37,42,0.5) 100%), #0B1E3F",
          border: "1px solid rgba(255,255,255,0.18)",
          borderRadius: 10,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: "var(--font-kr-serif)", fontWeight: 500,
          fontSize: 76, letterSpacing: "-0.04em",
          color: "rgba(255,255,255,0.95)",
          position: "relative",
        }}>
          {star.initials}
          <span style={{
            position: "absolute", top: 10, left: 10,
            background: "var(--acad-red)", color: "#fff",
            fontWeight: 900, fontSize: 11, padding: "4px 8px", borderRadius: 4,
          }}>수학 1타</span>
        </div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.12em", color: "var(--acad-yellow)" }}>FACULTY · 01</div>
          <div style={{ fontWeight: 900, fontSize: 32, marginTop: 6, letterSpacing: "-0.035em" }}>{star.name}</div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", marginTop: 4 }}>{star.title}</div>
          <div style={{ marginTop: 14, padding: "12px 0", borderTop: "1px solid rgba(255,255,255,0.18)", borderBottom: "1px solid rgba(255,255,255,0.18)", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6 }}>
            <Stat n="만점자 80+" l="2025 수능" />
            <Stat n={star.students.toLocaleString()} l="누적 수강생" />
            <Stat n={"★ " + star.rating} l="평균 평점" />
          </div>
          <button className="acad-btn acad-btn-yellow" style={{ marginTop: 14, height: 44, fontSize: 13.5 }}
                  onClick={() => navigate("/courses/" + course.id)}>
            {course.title} 보기 <Icon name="arrow" size={14} />
          </button>
        </div>
      </div>

      <div style={{
        background: "rgba(255,255,255,0.06)",
        border: "1px solid rgba(255,255,255,0.14)",
        borderRadius: 10,
        padding: "14px 18px",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        color: "#fff",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--acad-red)",
                         boxShadow: "0 0 0 0 rgba(229,37,42,0.7)", animation: "pulse 1.6s ease-out infinite" }} />
          <span style={{ fontWeight: 800, fontSize: 14 }}>LIVE 진행중</span>
          <span style={{ fontSize: 13.5, color: "rgba(255,255,255,0.8)" }}>구문독해 RE:BUILD · 이현우</span>
        </div>
        <button className="acad-btn acad-btn-red" style={{ height: 38, fontSize: 13 }}
                onClick={() => navigate("/live")}>
          입장
        </button>
      </div>
    </div>
  );
}

function Stat({ n, l }) {
  return (
    <div style={{ textAlign: "left" }}>
      <div style={{ fontFamily: "var(--font-en)", fontWeight: 800, fontSize: 16, letterSpacing: "-0.02em", color: "#fff" }}>{n}</div>
      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", marginTop: 2, fontWeight: 600 }}>{l}</div>
    </div>
  );
}

// ── Acceptance brag bar ────────────────────────────────────────────
function AcadBragBar() {
  return (
    <section className="acad-bragbar">
      <div className="container-wide acad-bragbar-inner">
        <div className="acad-bragbar-title">
          <small>2025학년도 합격 실적</small>
          <strong>리뉴젠으로 의대·SKY를<br />보낸 한 해.</strong>
        </div>
        {[
          { n: "138", sup: "명", l: "의·치·약·한 합격" },
          { n: "94", sup: "명", l: "서울대 합격" },
          { n: "412", sup: "명", l: "연·고대 합격" },
          { n: "1.8", sup: "%", l: "수능 만점자 비율" },
          { n: "94", sup: "%", l: "라이브 출석률" },
        ].map((c) => (
          <div key={c.l} className="acad-bragbar-cell">
            <div className="acad-bragbar-num">{c.n}<sup>{c.sup}</sup></div>
            <div className="acad-bragbar-label">{c.l}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ── Instructor billboards ──────────────────────────────────────────
function AcadInstructors() {
  const { navigate } = useApp();
  const labels = ["수학 1타", "국어 1타", "영어 대표", "탐구 1타"];
  return (
    <section className="acad-section">
      <div className="container-wide">
        <div className="acad-section-head">
          <div>
            <h2>리뉴젠 <em>1타강사</em> 라인업</h2>
            <div className="sub">매년 만점자를 배출하는 정통 입시 강사 4인 — 라이브로 만나세요.</div>
          </div>
          <button className="acad-btn acad-btn-ghost" style={{ height: 42, fontSize: 13 }} onClick={() => navigate("/instructors")}>
            전체 강사진 <Icon name="arrow" size={14} />
          </button>
        </div>
        <div className="acad-instructors">
          {INSTRUCTORS.map((ins, i) => (
            <button key={ins.id} className="acad-ins-card" onClick={() => navigate("/instructors/" + ins.id)}>
              <div className="acad-ins-face" data-initials={ins.initials}>
                <span className="acad-ins-badge">{labels[i]}</span>
                <span className="acad-ins-subj">{ins.subject}</span>
                <div className="acad-ins-name">
                  <strong>{ins.name}</strong>
                  <span>{ins.title}</span>
                </div>
              </div>
              <div className="acad-ins-body">
                <div className="acad-ins-stats">
                  <div><strong>{ins.students.toLocaleString()}</strong><small>수강생</small></div>
                  <div><strong>★ {ins.rating}</strong><small>평점</small></div>
                  <div><strong>{ins.courses}강</strong><small>개설</small></div>
                </div>
                <p className="acad-ins-bio">{ins.bioShort}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Ranking + Timetable side-by-side ───────────────────────────────
function AcadRankingAndTimetable() {
  return (
    <section style={{ background: "#fff", borderTop: "1px solid var(--acad-line)", borderBottom: "1px solid var(--acad-line)" }}>
      <div className="container-wide acad-section" style={{ padding: "72px 40px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: 32 }}>
          <AcadRanking />
          <AcadTimetable />
        </div>
      </div>
    </section>
  );
}

function AcadRanking() {
  const tabs = ["전체", "수학", "국어", "영어", "탐구"];
  const [tab, setTab] = useStateAcad(0);
  const { navigate } = useApp();

  const rows = useMemoAcad(() => {
    const filter = tabs[tab];
    let list = [...COURSES];
    if (filter !== "전체") {
      const subjId = SUBJECTS.find((s) => s.ko === filter)?.id;
      list = list.filter((c) => c.subject === subjId);
    }
    list = list.sort((a, b) => b.enrolled - a.enrolled).slice(0, 5);
    const trends = ["up", "up", "flat", "new", "up"];
    return list.map((c, i) => ({ ...c, rank: i + 1, trend: trends[i] }));
  }, [tab]);

  return (
    <div>
      <div className="acad-section-head">
        <div>
          <h2><em>실시간</em> 인기 강의</h2>
          <div className="sub">지금 가장 많이 수강 중인 TOP 5 — 한 시간 마다 갱신.</div>
        </div>
      </div>

      <div className="acad-rank">
        <div className="acad-rank-tabs">
          {tabs.map((t, i) => (
            <button key={t} className={"acad-rank-tab" + (i === tab ? " active" : "")} onClick={() => setTab(i)}>
              {t}
            </button>
          ))}
        </div>

        {rows.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: "var(--acad-muted)", fontSize: 14 }}>
            해당 영역의 인기 강의 데이터를 준비 중입니다.
          </div>
        ) : (
          rows.map((c, i) => {
            const ins = findInstructor(c.instructor);
            return (
              <button key={c.id} className={"acad-rank-row" + (i < 3 ? " top" : "")} onClick={() => navigate("/courses/" + c.id)}>
                <div className="acad-rank-no">{c.rank.toString().padStart(2, "0")}</div>
                <div>
                  <div className="acad-rank-title">{c.title}</div>
                  <div className="acad-rank-meta">
                    <span>{ins?.name}</span><span className="dot" />
                    <span>{c.level}</span><span className="dot" />
                    <span>★ {c.rating} ({c.reviews.toLocaleString()})</span>
                  </div>
                </div>
                <div>
                  <span className={"acad-rank-trend " + c.trend}>
                    {c.trend === "up" ? "▲ HOT" : c.trend === "new" ? "NEW" : "—"}
                  </span>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

function AcadTimetable() {
  const { navigate } = useApp();
  const today = COURSES.slice(0, 4).map((c, i) => ({
    course: c,
    time: ["19:00", "20:00", "21:00", "22:00"][i],
    state: i === 1 ? "live" : (i < 1 ? "ended" : "upcoming"),
  }));
  return (
    <div>
      <div className="acad-section-head">
        <div>
          <h2>오늘의 <em>LIVE</em> 시간표</h2>
          <div className="sub">2026.05.21 (목) · 리뉴젠 라이브 강의실</div>
        </div>
      </div>

      <div style={{ display: "grid", gap: 10 }}>
        {today.map(({ course, time, state }) => {
          const ins = findInstructor(course.instructor);
          return (
            <div key={course.id} className={"acad-tt-row " + (state === "live" ? "live" : "")}>
              <div>
                <div className="acad-tt-time">{time}</div>
                <div className="acad-tt-state">
                  {state === "live" ? "● LIVE NOW" : state === "ended" ? "다시보기" : "곧 시작"}
                </div>
              </div>
              <div>
                <div className="acad-tt-title">{course.title}</div>
                <div className="acad-tt-meta">{ins?.name} · {course.level} · ROOM {course.classInRoomId}</div>
              </div>
              <button className="acad-tt-cta" onClick={() => navigate(state === "ended" ? "/player/" + course.id : "/live/" + course.id)}>
                {state === "live" ? "입장하기" : state === "ended" ? "다시보기" : "알림 신청"}
              </button>
            </div>
          );
        })}
        <button className="acad-btn acad-btn-ghost" style={{ height: 46, justifyContent: "center", marginTop: 6 }} onClick={() => navigate("/live")}>
          전체 시간표 보기 <Icon name="arrow" size={14} />
        </button>
      </div>
    </div>
  );
}

// ── Course grid ────────────────────────────────────────────────────
function AcadCourses() {
  const { navigate } = useApp();
  const subjEnMap = { math: "MATHEMATICS", korean: "KOREAN LITERATURE", english: "ENGLISH", science: "SCIENCE", history: "HISTORY" };
  const subjShortMap = { math: "수학", korean: "국어", english: "영어", science: "탐구", history: "한국사" };

  return (
    <section className="acad-section">
      <div className="container-wide">
        <div className="acad-section-head">
          <div>
            <h2>2026 <em>여름 시즌</em> 강의</h2>
            <div className="sub">7월 ~ 8월, 라이브 강의 전 라인업 — 지금 신청하면 20% 할인.</div>
          </div>
          <button className="acad-btn acad-btn-ghost" style={{ height: 42, fontSize: 13 }} onClick={() => navigate("/courses")}>
            강의 전체 보기 <Icon name="arrow" size={14} />
          </button>
        </div>

        <div className="acad-courses">
          {COURSES.slice(0, 4).map((c, i) => {
            const ins = findInstructor(c.instructor);
            return (
              <button key={c.id} className="acad-course-card" onClick={() => navigate("/courses/" + c.id)}>
                <div className="acad-course-cover">
                  {i === 0 && <span className="pill">BEST</span>}
                  {i === 1 && <span className="pill new">NEW</span>}
                  {i === 2 && <span className="pill" style={{ background: "var(--acad-navy)" }}>LIVE</span>}
                  {i === 3 && <span className="pill">한정</span>}
                  <span className="subj">{subjShortMap[c.subject]}</span>
                  <span className="subj-en">{subjEnMap[c.subject]}</span>
                </div>
                <div className="acad-course-body">
                  <div className="acad-course-title">{c.title}</div>
                  <div className="acad-course-ins">{ins?.name} · {c.level} · {c.lessons}강</div>
                  <div className="acad-course-meta">
                    <div>
                      <div className="acad-price-old">{formatKRW(c.price)}</div>
                      <div className="acad-price-now">{formatKRW(c.salePrice)}</div>
                    </div>
                    <div className="acad-rating">
                      <Icon name="star" size={13} /> {c.rating} ({c.reviews.toLocaleString()})
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ── Reviews ────────────────────────────────────────────────────────
function AcadReviews() {
  const items = [];  // 실제 후기가 쌓이면 채웁니다 — 데모 콘텐츠 제거됨
  if (!items.length) return null;
  return (
    <section style={{ background: "#fff", borderTop: "1px solid var(--acad-line)", borderBottom: "1px solid var(--acad-line)" }}>
      <div className="container-wide acad-section">
        <div className="acad-section-head">
          <div>
            <h2>합격생이 직접 쓴 <em>리뷰</em></h2>
            <div className="sub">2025학년도 합격생이 남긴 진짜 후기 — 가공 없는 원문 그대로.</div>
          </div>
        </div>
        <div className="acad-reviews">
          {items.map((r) => (
            <div key={r.name} className="acad-review">
              <div className="stars">★★★★★</div>
              <div className="acad-review-body">“{r.body}”</div>
              <div className="acad-review-meta">
                <span>{r.name} · {r.grade}</span>
                <span className="acad-review-pass">합격 · {r.pass}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── CTA ────────────────────────────────────────────────────────────
function AcadCTA() {
  const { navigate, user } = useApp();
  return (
    <section className="container-wide" style={{ paddingTop: 96, paddingBottom: 0 }}>
      <div className="acad-cta">
        <div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.18)", padding: "6px 12px", borderRadius: 4, fontWeight: 800, fontSize: 12, letterSpacing: "0.06em" }}>
            ● 7일 무료 체험 · 카드 등록 없음
          </div>
          <h2>지금 등록하면<br />첫 주 라이브 무료.</h2>
          <p>회원가입 후 모든 강의의 1주차 라이브 + 다시보기를 무료로 제공합니다. 마음에 들지 않으면 결제하지 않으셔도 됩니다.</p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <button className="acad-btn acad-btn-yellow" style={{ height: 60, fontSize: 16, justifyContent: "center" }}
                  onClick={() => navigate(user ? "/courses" : "/signup")}>
            {user ? "강의 둘러보기" : "무료로 시작하기"} <Icon name="arrow" size={16} />
          </button>
          <button className="acad-btn acad-btn-ghost-white" style={{ height: 60, fontSize: 14.5, justifyContent: "center", color: "#fff", borderColor: "rgba(255,255,255,0.5)" }}
                  onClick={() => navigate("/courses")}>
            강의 라인업 전체 보기
          </button>
        </div>
      </div>
    </section>
  );
}

window.HomeAcademy = HomeAcademy;
