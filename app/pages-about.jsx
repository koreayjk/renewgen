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
        <div style={{ position: "absolute", inset: 0, backgroundImage: "url(assets/photos/p06.jpg)", backgroundSize: "cover", backgroundPosition: "center 30%", opacity: 0.3 }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(92deg, rgba(0,22,44,0.93) 0%, rgba(0,22,44,0.72) 55%, rgba(0,22,44,0.5) 100%)" }} />
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(58% 90% at 85% 0%, rgba(255,214,10,0.16), transparent 60%)", pointerEvents: "none" }} />
        <div className="container-wide" style={{ position: "relative", paddingTop: 72, paddingBottom: 60 }}>
          <span style={{ display: "inline-block", background: YL, color: NV, fontWeight: 800, fontSize: 13, padding: "7px 13px", borderRadius: 5, whiteSpace: "nowrap" }}>About</span>
          <h1 style={{ fontWeight: 900, fontSize: "clamp(42px, 5.2vw, 70px)", letterSpacing: "-0.045em", lineHeight: 1.07, margin: "20px 0 0" }}>
            {window.RJ_EDU_MODE ? (
              <>탄탄한 <em style={{ fontStyle: "normal", color: YL }}>기본기</em>로,<br />다음세대를 <em style={{ fontStyle: "normal", color: YL }}>세웁니다</em>.</>
            ) : (
              <>기독교 교육을 <em style={{ fontStyle: "normal", color: YL }}>수호</em>하고,<br />다음세대를 <em style={{ fontStyle: "normal", color: YL }}>세웁니다</em>.</>
            )}
          </h1>
          <p style={{ fontSize: 17, lineHeight: 1.65, color: "rgba(255,255,255,0.8)", maxWidth: 640, marginTop: 20, fontWeight: 500 }}>
            {eduText("리뉴젠 아카데미는 대한민국의 기독교 교육을 수호하고 발전시키기 위해 설립된 기독교 교육 전문 기관입니다. 아카데미의 비전과 설립 목적, 그리고 운영 시스템을 소개합니다.", "리뉴젠 아카데미는 검정고시부터 수능·토플까지 체계적인 원격 교육을 제공하는 교육 전문 기관입니다. 아카데미의 비전과 설립 목적, 그리고 운영 시스템을 소개합니다.")}
          </p>
        </div>
      </section>

      {/* 비전 */}
      <section style={{ background: PP }}>
        <div className="container-wide" style={{ paddingTop: 80, paddingBottom: 24, display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 56, alignItems: "center" }}>
          <div>
            <CurHead kor="비전" />
            <p style={{ fontSize: 17, lineHeight: 1.8, color: "var(--acad-ink)", margin: 0, fontWeight: 500 }}>
              {window.RJ_EDU_MODE ? (
                <>리뉴젠 아카데미는 학생 한 명 한 명의 성장을 위해 설립된 <strong style={{ color: NV, fontWeight: 800 }}>원격 교육 전문 기관</strong>입니다.</>
              ) : (
                <>리뉴젠 아카데미는 대한민국의 기독교 교육을 수호하고 발전시키기 위하여 설립된 <strong style={{ color: NV, fontWeight: 800 }}>기독교 교육 전문 기관</strong>입니다.</>
              )}
            </p>
            <p style={{ fontSize: 16, lineHeight: 1.8, color: MT, marginTop: 18, fontWeight: 500 }}>
              {eduText("수업과 코칭을 통해 다음세대가 하나님 나라의 관점에서 국어·수학·사회·과학·영어 등 각 교과를 바라보며 해석하게 합니다. 이로써 하나님의 창조세계와 그 나라를 더 알아가고, 하나님과 이웃을 더 사랑하게 하는 것을 목적으로 합니다.", "수업과 코칭을 통해 학생이 국어·수학·사회·과학·영어 등 각 교과의 원리를 깊이 이해하고 스스로 사고하도록 돕습니다. 이로써 폭넓은 시야와 바른 인성을 함께 길러, 세상과 이웃을 이해하는 사람으로 성장하게 하는 것을 목적으로 합니다.")}
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
        <div className="container-wide" style={{ paddingTop: 80, paddingBottom: 80 }}>
          <CurHead kor="운영 시스템" sub={eduText("‘클래스인(ClassIn)’ 기반의 쌍방향 실시간 수업으로, 기독교적 관점과 바른 태도로 학습하도록 공동체·부모님과 함께 체계적으로 진단·관리합니다.", "과목별 녹화 강의를 선택해 수강하며, 바른 학습 태도로 학습하도록 공동체·부모님과 함께 체계적으로 진단·관리합니다.")} />
          <OperatingSystem />
        </div>
      </section>
    </div>
  );
}

window.AboutPage = AboutPage;
