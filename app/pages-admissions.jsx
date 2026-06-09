/* global React, useApp, Icon */
// ════════════════════════════════════════════════════════════════════
//   /admissions — 입시정보 (Total Care System · 점수로 증명)
// ════════════════════════════════════════════════════════════════════

const A_NAVY = "var(--acad-navy)";
const A_NAVY2 = "var(--acad-navy-2)";
const A_YEL = "var(--acad-yellow)";
const A_PAPER = "var(--acad-paper)";
const A_CREAM = "var(--acad-bg)";
const A_LINE = "var(--acad-line)";
const A_MUTED = "var(--acad-muted)";

const SCORE_GROUPS = [
  {
    title: "2026 대학수학능력평가",
    rows: [
      ["김○○", "수학", "4등급", "1등급"],
      ["김○○", "한국사", "2등급", "1등급"],
      ["김○○", "영어", "4등급", "3등급"],
      ["서○○", "국어", "5등급", "3등급"],
      ["서○○", "수학", "4등급", "3등급"],
      ["서○○", "사회문화", "6등급", "1등급"],
      ["정○○", "영어", "5등급", "3등급"],
    ],
  },
  {
    title: "고3 전국연합학력평가",
    rows: [
      ["노○○", "영어", "3등급", "2등급"],
      ["최○○", "국어", "3등급", "1등급"],
      ["최○○", "영어", "2등급", "1등급"],
      ["최○○", "생활과윤리", "고2", "1등급"],
      ["김○○", "국어", "4등급", "2등급"],
      ["이○○", "영어", "3등급", "2등급"],
      ["이○○", "생활과윤리", "4등급", "2등급"],
    ],
  },
  {
    title: "모의 토플",
    unit: "점",
    rows: [
      ["임○○", "TOEFL", "62점", "80점"],
      ["최○○", "TOEFL", "62점", "74점"],
    ],
  },
];

const TESTIMONIALS = [
  "실시간 수업으로 제가 모르는 걸 콕 집어서 이해할 수 있도록 잘 지도해 주셔서 좋아요.",
  "각 과목별로 성경적 관점이 재해석된 기독교 교육으로 배울 수 있어서 좋아요.",
  "나이 상관없이 각자의 레벨에 맞게 수업이 진행돼서, 노베이스도 실력을 쌓아갈 수 있어요.",
];

function AdmissionsPage() {
  const { navigate } = useApp();
  return (
    <div className="page-enter">
      {/* HERO */}
      <section style={{ background: A_NAVY, color: "#fff", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(60% 90% at 12% 0%, rgba(255,214,10,0.16), transparent 60%)", pointerEvents: "none" }} />
        <div className="container-wide" style={{ position: "relative", paddingTop: 72, paddingBottom: 60 }}>
          <span style={{ display: "inline-block", background: A_YEL, color: A_NAVY, fontWeight: 800, fontSize: 13, padding: "7px 13px", borderRadius: 5, whiteSpace: "nowrap" }}>입시정보 · 1위 기독교 온라인 원격 학원</span>
          <h1 style={{ fontWeight: 900, fontSize: "clamp(42px, 5.2vw, 70px)", letterSpacing: "-0.045em", lineHeight: 1.07, margin: "20px 0 0" }}>
            국내·해외 입시강의,<br /><em style={{ fontStyle: "normal", color: A_YEL }}>Total Care System.</em>
          </h1>
          <p style={{ fontSize: 17, lineHeight: 1.65, color: "rgba(255,255,255,0.8)", maxWidth: 640, marginTop: 20, fontWeight: 500 }}>
            온라인 실시간 원격수업으로 기독교 관점의 교과목 학습을 제공합니다. 중등·고등 검정고시 / 수능 / 토플
            교육과정을 모두 갖춘 온라인 실시간 학원입니다.
          </p>
          <div style={{ display: "flex", gap: 10, marginTop: 26, flexWrap: "wrap" }}>
            {["온라인 실시간 원격수업", "기독교 교육", "검정고시 · 수능 · 토플"].map((b) => (
              <span key={b} style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 999, padding: "10px 20px", fontWeight: 700, fontSize: 14.5 }}>{b}</span>
            ))}
          </div>
        </div>
      </section>

      {/* 점수로 증명 */}
      <section style={{ background: A_CREAM }}>
        <div className="container-wide" style={{ paddingTop: 76, paddingBottom: 32, textAlign: "center" }}>
          <div style={{ width: 56, height: 5, background: A_YEL, borderRadius: 3, margin: "0 auto 18px" }} />
          <h2 style={{ margin: 0, fontWeight: 900, fontSize: 36, letterSpacing: "-0.04em", color: A_NAVY }}>점수로 증명된 리뉴젠 아카데미</h2>
          <p style={{ margin: "12px 0 0", fontSize: 15, color: A_MUTED, fontWeight: 500 }}>실제 수강생들의 등급·점수 상승 기록입니다.</p>
        </div>
        <div className="container-wide" style={{ paddingBottom: 24 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, alignItems: "start" }}>
            {SCORE_GROUPS.map((g) => (
              <div key={g.title} style={{ background: A_PAPER, border: "1.5px solid " + A_LINE, borderRadius: 14, overflow: "hidden" }}>
                <div style={{ background: A_NAVY, color: "#fff", padding: "14px 20px", fontWeight: 900, fontSize: 15.5, letterSpacing: "-0.02em" }}>
                  [{g.title}]
                </div>
                <div>
                  {g.rows.map((r, i) => (
                    <div key={i} style={{ display: "grid", gridTemplateColumns: "auto 1fr auto auto auto", gap: 10, alignItems: "center", padding: "13px 20px", borderTop: i === 0 ? "none" : "1px solid " + A_LINE }}>
                      <span style={{ fontWeight: 800, fontSize: 14, color: A_NAVY }}>{r[0]}</span>
                      <span style={{ fontSize: 13, color: A_MUTED, fontWeight: 600 }}>{r[1]}</span>
                      <span style={{ fontSize: 13.5, color: A_MUTED, fontWeight: 700 }}>{r[2]}</span>
                      <Icon name="arrow" size={14} className="" />
                      <span style={{ fontWeight: 900, fontSize: 15, color: "#fff", background: r[3].includes("1등급") || r[3].includes("80") ? "#1B9C5D" : A_NAVY2, padding: "3px 10px", borderRadius: 6, whiteSpace: "nowrap" }}>{r[3]}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 모두가 인정하는 — testimonials */}
      <section style={{ background: A_PAPER }}>
        <div className="container-wide" style={{ paddingTop: 76, paddingBottom: 32, textAlign: "center" }}>
          <h2 style={{ margin: 0, fontWeight: 900, fontSize: 32, letterSpacing: "-0.04em", color: A_NAVY }}>
            모두가 인정하는 <span style={{ color: A_NAVY, background: "rgba(255,214,10,0.4)", padding: "0 6px", borderRadius: 4 }}>리뉴젠 아카데미</span>
          </h2>
        </div>
        <div className="container-wide" style={{ paddingBottom: 80 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
            {TESTIMONIALS.map((t, i) => (
              <div key={i} style={{ background: A_CREAM, borderRadius: 16, padding: "30px 28px", borderTop: "5px solid " + A_YEL }}>
                <div style={{ width: 44, height: 44, borderRadius: "50%", background: A_NAVY, color: A_YEL, display: "inline-flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 22, fontFamily: "var(--font-en)" }}>“</div>
                <p style={{ margin: "16px 0 0", fontSize: 16, lineHeight: 1.7, color: "var(--acad-ink)", fontWeight: 600 }}>{t}</p>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div style={{ marginTop: 36, background: A_NAVY, borderRadius: 16, padding: "40px 44px", display: "grid", gridTemplateColumns: "1fr auto", gap: 24, alignItems: "center" }}>
            <div style={{ color: "#fff" }}>
              <h3 style={{ margin: 0, fontWeight: 900, fontSize: 28, letterSpacing: "-0.035em" }}>지금, 점수로 증명할 차례입니다.</h3>
              <p style={{ margin: "10px 0 0", fontSize: 15.5, color: "rgba(255,255,255,0.78)", fontWeight: 500 }}>7일 무료 체험으로 리뉴젠의 실시간 수업을 먼저 경험해보세요.</p>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => navigate("/signup")} style={{ background: A_YEL, color: A_NAVY, fontWeight: 900, fontSize: 15, border: 0, height: 54, padding: "0 26px", borderRadius: 10, cursor: "pointer" }}>7일 무료 체험</button>
              <button onClick={() => navigate("/subscribe")} style={{ background: "transparent", color: "#fff", fontWeight: 800, fontSize: 15, border: "1.5px solid rgba(255,255,255,0.5)", height: 54, padding: "0 26px", borderRadius: 10, cursor: "pointer" }}>요금제 보기</button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

window.AdmissionsPage = AdmissionsPage;
