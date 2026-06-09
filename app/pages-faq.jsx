/* global React, useApp, Icon */
// ════════════════════════════════════════════════════════════════════
//   /faq — 자주 묻는 질문
// ════════════════════════════════════════════════════════════════════

const { useState: useStateFaq } = React;

const F_NAVY = "var(--acad-navy)";
const F_YEL = "var(--acad-yellow)";
const F_PAPER = "var(--acad-paper)";
const F_CREAM = "var(--acad-bg)";
const F_LINE = "var(--acad-line)";
const F_MUTED = "var(--acad-muted)";

const FAQ_GROUPS = [
  {
    cat: "수업 · 운영",
    items: [
      ["수업은 어떻게 진행되나요?", "‘클래스인(ClassIn)’ 기반의 쌍방향 실시간 수업으로 진행됩니다. 화이트보드·실시간 채팅·질문권·소그룹 토론까지 한 화면에서 이뤄지며, 인터넷이 되는 곳이면 어디서든 참여할 수 있습니다."],
      ["라이브 수업에 못 들어가면 어떻게 되나요?", "모든 수업은 녹화됩니다. 라이브에 참여하지 못했거나 이해가 덜 된 부분은 녹화본으로 무제한 반복 수강할 수 있습니다. 출석은 녹화본 수강으로도 인정됩니다."],
      ["주 몇 회, 몇 분 수업인가요?", "주 4회(월·화·목·금, 수요일 제외), 회당 50분 단위로 편성됩니다. 분기별 상세 시간표는 ‘강의’ 탭의 개설과목 시간표에서 확인할 수 있습니다."],
    ],
  },
  {
    cat: "커리큘럼 · 학사",
    items: [
      ["커리큘럼은 어떻게 구성되나요?", "1년 3분기 체제로, 검정고시부터 수능까지 국어·수학·영어·탐구(사회·과학·한국사·도덕)의 중·고등 기본 교과목을 망라합니다. 1년 3분기, 4년이면 중·고등 교과 과정이 끝납니다."],
      ["분기 일정이 어떻게 되나요?", "1분기 1월 말~4월 초, 2분기 4월 중순~7월 초, 3분기 9월 초~12월 초로 운영됩니다. 자세한 일정은 ‘커리큘럼 › 분기별 학사일정’에서 확인하세요."],
      ["성적 관리는 어떻게 하나요?", "월간평가 시 성적표가 발송되며, 누적 점수와 그래프로 학습 상태와 성장을 확인할 수 있습니다. 출결·과제·시험 점수를 통해 체계적으로 진단·관리합니다."],
    ],
  },
  {
    cat: "구독 · 결제",
    items: [
      ["프리패스 요금제는 무엇인가요?", "한 번의 구독으로 해당 분기 전 강좌를 무제한 수강하고, 녹화본도 무제한 반복 재생할 수 있는 요금제입니다. 선착순 구간별로 가격이 달라지며, 먼저 신청할수록 저렴합니다."],
      ["결제는 어떻게 하나요?", "분기별 카드결제로 간편하게 진행됩니다. 자동 갱신은 없으며, 구독 기간 내 해당 분기 전 강좌와 녹화본을 무제한 이용할 수 있습니다."],
      ["환불 정책이 어떻게 되나요?", "결제 후 7일 이내, 전체 진도의 10% 미만 수강 시 100% 환불됩니다. 이후에는 잔여 회차 기준 일할 계산으로 환불됩니다."],
    ],
  },
];

function FaqPage() {
  const { navigate } = useApp();
  const [open, setOpen] = useStateFaq("0-0");
  return (
    <div className="page-enter">
      {/* HERO */}
      <section style={{ background: F_NAVY, color: "#fff", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(50% 90% at 90% 0%, rgba(255,214,10,0.14), transparent 60%)", pointerEvents: "none" }} />
        <div className="container-wide" style={{ position: "relative", paddingTop: 68, paddingBottom: 56 }}>
          <span style={{ display: "inline-block", background: F_YEL, color: F_NAVY, fontWeight: 800, fontSize: 13, padding: "7px 13px", borderRadius: 5, whiteSpace: "nowrap" }}>FAQ · 자주 묻는 질문</span>
          <h1 style={{ fontWeight: 900, fontSize: "clamp(40px, 5vw, 64px)", letterSpacing: "-0.045em", lineHeight: 1.08, margin: "20px 0 0" }}>
            궁금한 점, <em style={{ fontStyle: "normal", color: F_YEL }}>여기서</em> 먼저.
          </h1>
        </div>
      </section>

      {/* GROUPS */}
      <section style={{ background: F_PAPER }}>
        <div className="container-wide" style={{ paddingTop: 64, paddingBottom: 40, display: "grid", gap: 44 }}>
          {FAQ_GROUPS.map((g, gi) => (
            <div key={gi}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
                <span style={{ width: 34, height: 5, background: F_YEL, borderRadius: 3 }} />
                <h2 style={{ margin: 0, fontWeight: 900, fontSize: 22, letterSpacing: "-0.03em", color: F_NAVY }}>{g.cat}</h2>
              </div>
              <div style={{ border: "1.5px solid " + F_LINE, borderRadius: 14, overflow: "hidden", background: F_PAPER }}>
                {g.items.map(([q, a], i) => {
                  const key = gi + "-" + i;
                  const isOpen = open === key;
                  return (
                    <div key={i} style={{ borderTop: i === 0 ? "none" : "1px solid " + F_LINE }}>
                      <button onClick={() => setOpen(isOpen ? "" : key)} style={{
                        width: "100%", textAlign: "left", padding: "22px 26px", display: "flex",
                        justifyContent: "space-between", alignItems: "center", gap: 16, cursor: "pointer",
                        background: isOpen ? "rgba(0,29,61,0.03)" : "transparent",
                      }}>
                        <span style={{ display: "flex", gap: 14, alignItems: "center" }}>
                          <span style={{ fontFamily: "var(--font-en)", fontWeight: 800, fontSize: 16, color: F_YEL, background: F_NAVY, width: 30, height: 30, borderRadius: 7, display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>Q</span>
                          <span style={{ fontWeight: 800, fontSize: 17, color: F_NAVY, letterSpacing: "-0.025em" }}>{q}</span>
                        </span>
                        <Icon name={isOpen ? "minus" : "plus"} size={20} className="" />
                      </button>
                      {isOpen && (
                        <div style={{ padding: "0 26px 24px 70px", fontSize: 15, lineHeight: 1.75, color: F_MUTED, fontWeight: 500 }}>{a}</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* contact CTA */}
        <div className="container-wide" style={{ paddingBottom: 90 }}>
          <div style={{ background: F_CREAM, borderRadius: 16, padding: "32px 40px", display: "grid", gridTemplateColumns: "1fr auto", gap: 24, alignItems: "center" }}>
            <div>
              <h3 style={{ margin: 0, fontWeight: 900, fontSize: 22, letterSpacing: "-0.03em", color: F_NAVY }}>찾는 답이 없나요?</h3>
              <p style={{ margin: "8px 0 0", fontSize: 14.5, color: F_MUTED, fontWeight: 500 }}>구독·커리큘럼·입시 관련 문의는 1:1 채팅으로 빠르게 도와드립니다.</p>
            </div>
            <button onClick={() => navigate("/subscribe")} style={{ background: F_NAVY, color: "#fff", fontWeight: 800, fontSize: 15, border: 0, height: 52, padding: "0 26px", borderRadius: 10, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 8 }}>
              구독 안내 보기 <Icon name="arrow" size={16} />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

window.FaqPage = FaqPage;
