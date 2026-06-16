/* global React, useApp, Icon */
// ════════════════════════════════════════════════════════════════════
//   /subscribe — 구독 (전 과목 프리패스 요금제)
// ════════════════════════════════════════════════════════════════════

const { useState: useStateSub } = React;

const S_NAVY = "var(--acad-navy)";
const S_NAVY2 = "var(--acad-navy-2)";
const S_YEL = "var(--acad-yellow)";
const S_PAPER = "var(--acad-paper)";
const S_CREAM = "var(--acad-bg)";
const S_LINE = "var(--acad-line)";
const S_MUTED = "var(--acad-muted)";

const PERKS = [
  "해당 분기 전 강좌 수강",
  "녹화본 수업도 무제한 반복 재생",
  "선착순 할인 혜택",
  "최저가 — 월 12만원부터",
  "분기별 카드결제로 간편하게",
];

const TIERS = [
  { tier: "1구간", monthly: 120000, quarter: 360000, state: "sold", label: "선착순 마감" },
  { tier: "2구간", monthly: 150000, quarter: 450000, state: "urgent", label: "마감 임박" },
  { tier: "3구간", monthly: 200000, quarter: 600000, state: "open", label: "모집 중" },
  { tier: "4구간", monthly: 250000, quarter: 750000, state: "open", label: "모집 중" },
];

const won = (n) => (n / 10000) + "만원";

function SubscribePage() {
  const { navigate, showToast } = useApp();
  const firstOpen = TIERS.find((t) => t.state !== "sold");
  const [selected, setSelected] = useStateSub(firstOpen ? firstOpen.tier : TIERS[0].tier);

  return (
    <div className="page-enter">
      {/* HERO */}
      <section style={{ background: S_NAVY, color: "#fff", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "url(assets/photos/p09.jpg)", backgroundSize: "cover", backgroundPosition: "center 30%", opacity: 0.22 }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(92deg, rgba(0,18,38,0.92) 0%, rgba(0,18,38,0.72) 55%, rgba(0,18,38,0.48) 100%)" }} />
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(55% 90% at 85% 0%, rgba(255,214,10,0.18), transparent 60%)", pointerEvents: "none" }} />
        <div className="container-wide" style={{ position: "relative", paddingTop: 72, paddingBottom: 60, display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 56, alignItems: "center" }}>
          <div>
            <span style={{ display: "inline-block", background: S_YEL, color: S_NAVY, fontWeight: 800, fontSize: 13, padding: "7px 13px", borderRadius: 5, whiteSpace: "nowrap" }}>구독 · ALL-PASS</span>
            <h1 style={{ fontWeight: 900, fontSize: "clamp(42px, 5.2vw, 70px)", letterSpacing: "-0.045em", lineHeight: 1.06, margin: "20px 0 0" }}>
              리뉴젠 아카데미<br />전 과목 <em style={{ fontStyle: "normal", color: S_YEL }}>프리패스</em>.
            </h1>
            <p style={{ fontSize: 17, lineHeight: 1.65, color: "rgba(255,255,255,0.8)", maxWidth: 520, marginTop: 20, fontWeight: 500 }}>
              한 번의 구독으로 해당 분기 전 강좌를 마음껏. 프리패스 요금제로 리뉴젠 아카데미를 마음껏 누려보세요.
            </p>
          </div>
          {/* perks card */}
          <div style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.16)", borderRadius: 16, padding: "26px 28px" }}>
            <div style={{ display: "grid", gap: 14 }}>
              {PERKS.map((p) => (
                <div key={p} style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  <span style={{ width: 26, height: 26, borderRadius: "50%", background: S_YEL, color: S_NAVY, display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Icon name="check" size={15} /></span>
                  <span style={{ fontSize: 15.5, fontWeight: 600 }}>{p}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section style={{ background: S_CREAM }}>
        <div className="container-wide" style={{ paddingTop: 72, paddingBottom: 36 }}>
          <div style={{ textAlign: "center", marginBottom: 12 }}>
            <div style={{ width: 56, height: 5, background: S_YEL, borderRadius: 3, margin: "0 auto 18px" }} />
            <h2 style={{ margin: 0, fontWeight: 900, fontSize: 34, letterSpacing: "-0.035em", color: S_NAVY }}>선착순 구간별 요금</h2>
            <p style={{ margin: "12px 0 0", fontSize: 15, color: S_MUTED, fontWeight: 500 }}>먼저 신청할수록 저렴합니다. 구간이 마감되면 다음 구간 가격이 적용됩니다.</p>
          </div>
        </div>
        <div className="container-wide" style={{ paddingBottom: 24 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
            {TIERS.map((t) => {
              const sold = t.state === "sold";
              const urgent = t.state === "urgent";
              const isSel = selected === t.tier;
              return (
                <button key={t.tier} disabled={sold} onClick={() => setSelected(t.tier)} style={{
                  textAlign: "left", cursor: sold ? "not-allowed" : "pointer",
                  background: sold ? "rgba(0,29,61,0.05)" : (isSel ? S_NAVY : S_PAPER),
                  color: isSel && !sold ? "#fff" : "var(--acad-ink)",
                  border: "2px solid " + (isSel && !sold ? S_NAVY : S_LINE),
                  borderRadius: 16, padding: "24px 24px 26px", position: "relative",
                  opacity: sold ? 0.6 : 1, transition: "all 0.15s ease",
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontWeight: 900, fontSize: 18, letterSpacing: "-0.02em", color: isSel && !sold ? "#fff" : S_NAVY, whiteSpace: "nowrap" }}>{t.tier}</span>
                    <span style={{
                      fontSize: 11, fontWeight: 800, padding: "4px 9px", borderRadius: 5,
                      background: sold ? "rgba(0,29,61,0.12)" : urgent ? "#E5252A" : (isSel ? S_YEL : "rgba(0,29,61,0.06)"),
                      color: sold ? S_MUTED : urgent ? "#fff" : (isSel ? S_NAVY : S_MUTED),
                      textDecoration: sold ? "line-through" : "none", whiteSpace: "nowrap",
                    }}>{t.label}</span>
                  </div>
                  <div style={{ marginTop: 22, display: "flex", alignItems: "baseline", gap: 4 }}>
                    <span style={{ fontFamily: "var(--font-en)", fontWeight: 800, fontSize: 32, letterSpacing: "-0.03em", color: isSel && !sold ? S_YEL : S_NAVY, textDecoration: sold ? "line-through" : "none", whiteSpace: "nowrap" }}>월 {won(t.monthly)}</span>
                  </div>
                  <div style={{ fontSize: 13, color: isSel && !sold ? "rgba(255,255,255,0.7)" : S_MUTED, fontWeight: 600, marginTop: 4 }}>
                    분기당 {won(t.quarter)}
                  </div>
                  <div style={{ marginTop: 18, paddingTop: 16, borderTop: "1px solid " + (isSel && !sold ? "rgba(255,255,255,0.18)" : S_LINE), fontSize: 12.5, fontWeight: 600, color: isSel && !sold ? "rgba(255,255,255,0.8)" : S_MUTED, display: "flex", alignItems: "center", gap: 6 }}>
                    {sold ? <><Icon name="lock" size={13} /> 마감됨</> : isSel ? <><Icon name="check" size={14} /> 선택됨</> : "선택하기"}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* CTA bar */}
        <div className="container-wide" style={{ paddingTop: 16, paddingBottom: 80 }}>
          <div style={{ background: S_NAVY, borderRadius: 16, padding: "26px 36px", display: "grid", gridTemplateColumns: "1fr auto", gap: 24, alignItems: "center" }}>
            <div style={{ color: "#fff" }}>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.65)", fontWeight: 600 }}>선택한 요금제</div>
              <div style={{ fontWeight: 900, fontSize: 22, letterSpacing: "-0.03em", marginTop: 4 }}>
                {selected} · 월 {won(TIERS.find((t) => t.tier === selected).monthly)} <span style={{ color: "rgba(255,255,255,0.6)", fontWeight: 600, fontSize: 15 }}>(분기당 {won(TIERS.find((t) => t.tier === selected).quarter)})</span>
              </div>
            </div>
            <button onClick={() => { window.demoSubscribe && window.demoSubscribe(); showToast(selected + " 구독 완료 — 모든 녹화본을 무료로 시청할 수 있습니다"); navigate("/mypage?tab=recordings"); }} style={{
              background: S_YEL, color: S_NAVY, fontWeight: 900, fontSize: 16, border: 0,
              height: 56, padding: "0 32px", borderRadius: 10, cursor: "pointer",
              display: "inline-flex", alignItems: "center", gap: 8, whiteSpace: "nowrap",
            }}>지금 바로 구독하기 <Icon name="arrow" size={18} /></button>
          </div>
          <p style={{ textAlign: "center", marginTop: 18, fontSize: 13, color: S_MUTED, fontWeight: 500 }}>
            분기별 카드결제 · 자동 갱신 없음 · 구독 기간 내 해당 분기 전 강좌 + 녹화본 무제한
          </p>
        </div>
      </section>
    </div>
  );
}

window.SubscribePage = SubscribePage;
