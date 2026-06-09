/* global React, useApp, Icon, CurHead, PurposeStaircase, OperatingSystem, AboutKeyPoints, AboutObjections, AboutCompare, AboutResults */
// ════════════════════════════════════════════════════════════════════
//   /about — 아카데미 소개 (비전 · 설립목적 · 운영시스템)
//   * CurHead / PurposeStaircase / OperatingSystem 는 pages-curriculum.jsx
//     에 정의된 전역 컴포넌트를 재사용합니다.
// ════════════════════════════════════════════════════════════════════

function AboutPage() {
  const { navigate } = useApp();
  const NV = "var(--acad-navy)";
  const YL = "var(--acad-yellow)";
  const PP = "var(--acad-paper)";
  const CR = "var(--acad-bg)";
  const MT = "var(--acad-muted)";

  return (
    <div className="page-enter">
      {/* HERO */}
      <section style={{ background: NV, color: "#fff", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(58% 90% at 85% 0%, rgba(255,214,10,0.16), transparent 60%)", pointerEvents: "none" }} />
        <div className="container-wide" style={{ position: "relative", paddingTop: 72, paddingBottom: 60 }}>
          <span style={{ display: "inline-block", background: YL, color: NV, fontWeight: 800, fontSize: 13, padding: "7px 13px", borderRadius: 5, whiteSpace: "nowrap" }}>소개 · ABOUT</span>
          <h1 style={{ fontWeight: 900, fontSize: "clamp(42px, 5.2vw, 70px)", letterSpacing: "-0.045em", lineHeight: 1.07, margin: "20px 0 0" }}>
            기독교 교육을 <em style={{ fontStyle: "normal", color: YL }}>수호</em>하고,<br />다음세대를 <em style={{ fontStyle: "normal", color: YL }}>세웁니다</em>.
          </h1>
          <p style={{ fontSize: 17, lineHeight: 1.65, color: "rgba(255,255,255,0.8)", maxWidth: 640, marginTop: 20, fontWeight: 500 }}>
            리뉴젠 아카데미는 대한민국의 기독교 교육을 수호하고 발전시키기 위해 설립된 기독교 교육 전문 기관입니다.
            아카데미의 비전과 설립 목적, 그리고 운영 시스템을 소개합니다.
          </p>
        </div>
      </section>

      {/* 비전 */}
      <section style={{ background: PP }}>
        <div className="container-wide" style={{ paddingTop: 80, paddingBottom: 24, display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 56, alignItems: "center" }}>
          <div>
            <CurHead kor="비전" />
            <p style={{ fontSize: 17, lineHeight: 1.8, color: "var(--acad-ink)", margin: 0, fontWeight: 500 }}>
              리뉴젠 아카데미는 대한민국의 기독교 교육을 수호하고 발전시키기 위하여 설립된 <strong style={{ color: NV, fontWeight: 800 }}>기독교 교육 전문 기관</strong>입니다.
            </p>
            <p style={{ fontSize: 16, lineHeight: 1.8, color: MT, marginTop: 18, fontWeight: 500 }}>
              수업과 코칭을 통해 다음세대가 하나님 나라의 관점에서 국어·수학·사회·과학·영어 등 각 교과를
              바라보며 해석하게 합니다. 이로써 하나님의 창조세계와 그 나라를 더 알아가고, 하나님과 이웃을
              더 사랑하게 하는 것을 목적으로 합니다.
            </p>
          </div>
          <div style={{ aspectRatio: "1/1", background: NV, borderRadius: 18, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", inset: 0, background: "radial-gradient(70% 70% at 50% 35%, rgba(255,214,10,0.18), transparent 70%)" }} />
            <img src="assets/logo-mark.png" alt="리뉴젠" style={{ width: "46%", position: "relative" }} />
          </div>
        </div>
      </section>

      {/* 설립 목적 */}
      <section style={{ background: PP }}>
        <div className="container-wide" style={{ paddingTop: 64, paddingBottom: 24 }}>
          <CurHead kor="설립 목적" sub="리뉴젠 아카데미는 다음 4가지를 설립 목적으로 합니다." />
          <PurposeStaircase />
        </div>
      </section>

      {/* 운영 시스템 */}
      <section style={{ background: CR, marginTop: 56 }}>
        <div className="container-wide" style={{ paddingTop: 80, paddingBottom: 56 }}>
          <CurHead kor="운영 시스템" sub="‘클래스인(ClassIn)’ 기반의 쌍방향 실시간 수업으로, 기독교적 관점과 바른 태도로 학습하도록 공동체·부모님과 함께 체계적으로 진단·관리합니다." />
          <OperatingSystem />
        </div>
      </section>

      {/* ── 리뉴젠만의 강점 (브로슈어 재해석) ── */}
      <AboutKeyPoints />
      <AboutObjections />
      <AboutCompare />
      <AboutResults />

      {/* CTA */}
      <section style={{ background: CR }}>
        <div className="container-wide" style={{ paddingTop: 16, paddingBottom: 80 }}>
          <div style={{ background: NV, borderRadius: 16, padding: "36px 44px", display: "grid", gridTemplateColumns: "1fr auto", gap: 24, alignItems: "center" }}>
            <div style={{ color: "#fff" }}>
              <h3 style={{ margin: 0, fontWeight: 900, fontSize: 26, letterSpacing: "-0.035em" }}>커리큘럼이 궁금하신가요?</h3>
              <p style={{ margin: "10px 0 0", fontSize: 15.5, color: "rgba(255,255,255,0.78)", fontWeight: 500 }}>연 3학기 시스템의 학년별 진도와 분기 일정을 확인해보세요.</p>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => navigate("/curriculum")} style={{ background: YL, color: NV, fontWeight: 900, fontSize: 15, border: 0, height: 54, padding: "0 26px", borderRadius: 10, cursor: "pointer", whiteSpace: "nowrap" }}>커리큘럼 보기</button>
              <button onClick={() => navigate("/admissions")} style={{ background: "transparent", color: "#fff", fontWeight: 800, fontSize: 15, border: "1.5px solid rgba(255,255,255,0.5)", height: 54, padding: "0 26px", borderRadius: 10, cursor: "pointer", whiteSpace: "nowrap" }}>입시정보</button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

window.AboutPage = AboutPage;
