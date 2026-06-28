/* global React, useApp, Icon */
// ════════════════════════════════════════════════════════════════════
//   /curriculum — 커리큘럼
//   브로슈어 2·3p 내용(비전·설립목적·운영시스템) + 연 3학기 커리큘럼
//   sub-tabs: 연간 커리큘럼 / 분기별 학사일정 / 교재
// ════════════════════════════════════════════════════════════════════

const { useState: useStateCur, useMemo: useMemoCur } = React;

// Academy palette shortcuts
const NAVY = "var(--acad-navy)";
const NAVY2 = "var(--acad-navy-2)";
const YEL = "var(--acad-yellow)";
const PAPER = "var(--acad-paper)";
const CREAM = "var(--acad-bg)";
const LINE = "var(--acad-line)";
const MUTED = "var(--acad-muted)";

// ── Section title with yellow rule (brochure look) ─────────────────
function CurHead({ kor, sub }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ width: 56, height: 5, background: YEL, borderRadius: 3, marginBottom: 18 }} />
      <h2 style={{ margin: 0, fontWeight: 900, fontSize: 34, letterSpacing: "-0.035em", color: NAVY }}>{kor}</h2>
      {sub && <p style={{ margin: "12px 0 0", fontSize: 16, lineHeight: 1.7, color: "var(--acad-ink)", maxWidth: 760, fontWeight: 500 }}>{sub}</p>}
    </div>
  );
}

function CurriculumPage() {
  const { route } = useApp();
  const initialTab = route.params.get("tab") || "annual";
  const [tab, setTab] = useStateCur(initialTab);

  React.useEffect(() => {
    const t = route.params.get("tab");
    if (t) setTab(t);
  }, [route]);

  return (
    <div className="page-enter">
      {/* HERO */}
      <section style={{ background: NAVY, color: "#fff", overflow: "hidden", position: "relative" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "url(assets/photos/p02.jpg)", backgroundSize: "cover", backgroundPosition: "center 30%", opacity: 0.26 }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(92deg, rgba(0,18,38,0.93) 0%, rgba(0,18,38,0.74) 55%, rgba(0,18,38,0.5) 100%)" }} />
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(60% 90% at 88% 0%, rgba(255,214,10,0.16), transparent 60%)", pointerEvents: "none" }} />
        <div className="container-wide" style={{ position: "relative", paddingTop: 72, paddingBottom: 64 }}>
          <span style={{ display: "inline-block", background: YEL, color: NAVY, fontWeight: 800, fontSize: 13, padding: "7px 13px", borderRadius: 5, letterSpacing: "0.01em" }}>커리큘럼 · CURRICULUM</span>
          <h1 style={{ fontWeight: 900, fontSize: "clamp(44px, 5.4vw, 74px)", letterSpacing: "-0.045em", lineHeight: 1.06, margin: "22px 0 0" }}>
            연 <em style={{ fontStyle: "normal", color: YEL }}>3학기</em> 시스템.<br />4년이면 중·고등 과정이 끝납니다.
          </h1>
          <p style={{ fontSize: 17, lineHeight: 1.65, color: "rgba(255,255,255,0.78)", maxWidth: 640, marginTop: 22, fontWeight: 500 }}>
            검정고시부터 수능까지 — 국어·수학·영어·탐구(사회·과학·한국사·도덕)의 중·고등 기본 교과목을
            1년 3분기 체제로 망라합니다.
          </p>
        </div>
      </section>

      {/* 커리큘럼 sub-tabs */}
      <section style={{ background: PAPER }}>
        <div className="container-wide" style={{ paddingTop: 64, paddingBottom: 24 }}>
          <CurHead kor="교과 커리큘럼" sub="검정고시부터 수능까지, 1년 3분기 체제로 짜인 학년별 진도표입니다." />
          <div style={{ display: "flex", gap: 10, marginTop: 4, marginBottom: 36, flexWrap: "wrap" }}>
            {[["annual", "연간 커리큘럼"], ["schedule", "분기별 학사일정"], ["books", "교재"]].map(([k, label]) => (
              <button key={k} onClick={() => setTab(k)} style={{
                padding: "12px 22px", borderRadius: 9, fontWeight: 800, fontSize: 15, cursor: "pointer",
                border: "1.5px solid " + (tab === k ? NAVY : LINE),
                background: tab === k ? NAVY : "transparent",
                color: tab === k ? "#fff" : "var(--acad-ink)",
                transition: "all 0.15s ease", whiteSpace: "nowrap",
              }}>{label}</button>
            ))}
          </div>
        </div>
        <div className="container-wide" style={{ paddingBottom: 96 }}>
          {tab === "annual" && <AnnualCurriculum />}
          {tab === "schedule" && <QuarterSchedule />}
          {tab === "books" && <Textbooks />}
        </div>
      </section>
    </div>
  );
}

// ── 설립 목적 — Step staircase ─────────────────────────────────────
function PurposeStaircase() {
  const steps = [
    { n: 1, t: "리뉴젠 강화 원격 네트워크", d: eduText("아카데미와 지역 공동체의 네트워크를 강화해 대한민국에 기독교 교육이 더 굳건히 자리 잡도록 합니다.", "아카데미와 지역 공동체의 네트워크를 강화해, 전국 어디서든 양질의 원격 교육을 받을 수 있도록 합니다.") },
    { n: 2, t: eduText("리뉴젠 기독교 교재 개발", "리뉴젠 자체 교재 개발"), d: eduText("일반 학문을 기독교적 관점으로 투영한 한국형 기독교 교과 교재, 나아가 교과서를 개발합니다.", "각 교과를 깊이 있게 재구성한 자체 교과 교재, 나아가 교과서를 개발합니다.") },
    { n: 3, t: eduText("대한민국 기독교 네트워크 확장", "전국 교육 네트워크 확장"), d: eduText("교회학교·대안학교·홈스쿨 등 여러 모양의 기독교 교육을 수호하는 팀·개인에게 콘텐츠를 제공하며 연합합니다.", "대안학교·홈스쿨 등 다양한 형태의 교육 현장에 콘텐츠를 제공하며 함께 협력합니다.") },
    { n: 4, t: eduText("교육을 통한 전도", "교육을 통한 나눔"), d: eduText("탁월한 강의와 탄탄한 교재로, 수업과 교육이 복음 전도의 통로가 되도록 합니다.", "탁월한 강의와 탄탄한 교재로, 더 많은 학생에게 배움의 기회가 닿도록 합니다.") },
  ];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, alignItems: "end", marginTop: 8 }}>
      {steps.map((s, i) => (
        <div key={s.n} style={{ marginBottom: i * 26 }}>
          <div style={{
            background: i % 2 === 0 ? NAVY : NAVY2, color: "#fff",
            borderRadius: 14, padding: "22px 22px 24px", position: "relative",
            borderTop: "5px solid " + YEL,
          }}>
            <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 40, height: 40, borderRadius: 10, background: YEL, color: NAVY, fontWeight: 900, fontSize: 18, marginBottom: 14 }}>{s.n}</div>
            <div style={{ fontWeight: 900, fontSize: 18, letterSpacing: "-0.03em", lineHeight: 1.3 }}>{s.t}</div>
            <p style={{ margin: "10px 0 0", fontSize: 13, lineHeight: 1.6, color: "rgba(255,255,255,0.72)", fontWeight: 500 }}>{s.d}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── 운영 시스템 — ClassIn + 5 features ─────────────────────────────
function OperatingSystem() {
  const feats = [
    { n: "01", t: eduText("온라인 실시간 수업", "녹화 강의 수강"), d: eduText("인터넷이 되는 어디서든 수업을 듣습니다. 해외선교 중에도 학습을 이어갈 수 있습니다.", "인터넷이 되는 어디서든 수업을 듣습니다. 해외에 있어도 학습을 이어갈 수 있습니다."), icon: "live" },
    { n: "02", t: "녹화본 무제한 수강", d: "모든 수업은 녹화됩니다. 참여가 어려웠거나 이해가 덜 됐던 부분을 영상으로 계속 공부합니다.", icon: "play" },
    { n: "03", t: "LMS 시스템", d: eduText("쌍방향 칠판 등 교육 툴을 갖춘 ‘클래스인’으로 효과적인 수업을. 출결·과제·점수로 학습 상태를 진단합니다.", "다양한 학습 도구를 갖춘 학습관리 시스템(LMS)으로 효과적인 학습을. 출결·과제·점수로 학습 상태를 진단합니다."), icon: "book" },
    { n: "04", t: "오프라인 모임", d: "개강·종강 전후 오프라인 캠프, 과목별 집중 캠프, 찾아가는 미니클래스로 학습을 추가 지원합니다.", icon: "chat" },
    { n: "05", t: "성적표", d: "월간평가 시 성적표가 발송되며, 누적 점수와 그래프로 학습 상태와 성장을 확인합니다.", icon: "check" },
  ];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 24, marginTop: 8 }}>
      {/* ClassIn banner */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 24, alignItems: "center", background: PAPER, border: "1.5px solid " + LINE, borderRadius: 14, padding: "24px 28px" }}>
        <div>
          <div style={{ fontWeight: 900, fontSize: 18, color: NAVY, letterSpacing: "-0.02em" }}>{eduText("학습 플랫폼 — ClassIn", "학습관리 시스템 (LMS)")}</div>
          <p style={{ margin: "8px 0 0", fontSize: 14.5, lineHeight: 1.6, color: MUTED, fontWeight: 500, maxWidth: 720 }}>
            {eduText("쌍방향 상호작용이 가능한 실시간 온라인 교육 플랫폼. 화이트보드·실시간 채팅·질문권·소그룹 토론까지 한 화면에서.", "녹화 강의 기반의 온라인 학습 플랫폼. 강의 영상·학습 자료·과제·평가를 한 화면에서 관리합니다.")}
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, background: "#fff", border: "1px solid " + LINE, borderRadius: 10, padding: "12px 18px" }}>
          <span style={{ width: 30, height: 30, borderRadius: 7, background: "#1B9C5D", display: "inline-flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 900, fontSize: 16 }}>{eduText("C", "L")}</span>
          <span style={{ fontWeight: 800, fontSize: 17, color: "#1B9C5D", letterSpacing: "-0.02em" }}>{eduText("ClassIn", "LMS")}</span>
        </div>
      </div>
      {/* 5 features */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 14 }}>
        {feats.map((f) => (
          <div key={f.n} style={{ background: PAPER, border: "1.5px solid " + LINE, borderRadius: 14, padding: "22px 18px", display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ width: 38, height: 38, borderRadius: 10, background: NAVY, color: YEL, display: "inline-flex", alignItems: "center", justifyContent: "center" }}><Icon name={f.icon} size={18} /></span>
              <span style={{ fontFamily: "var(--font-en)", fontWeight: 800, fontSize: 13, color: LINE === "var(--acad-line)" ? "#C9BfA2" : LINE }}>{f.n}</span>
            </div>
            <div style={{ fontWeight: 900, fontSize: 15.5, color: NAVY, letterSpacing: "-0.025em", lineHeight: 1.3 }}>{f.t}</div>
            <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.55, color: MUTED, fontWeight: 500 }}>{f.d}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── 연간 커리큘럼 — 연 3학기 표 (과목 필터, 틀 고정) ───────────────
const CUR_SUBJECTS = [
  { id: "all", ko: "전과목" },
  { id: "korean", ko: "국어" },
  { id: "math", ko: "수학" },
  { id: "english", ko: "영어" },
  { id: "social", ko: "사회" },
  { id: "science", ko: "과학" },
];

const GRADES = ["중A", "중B", "고A", "고B", "고C"];
const COL_HEADERS = [
  { q: "1분기", m: "1월 말 ~ 4월 초" },
  { q: "2분기", m: "4월 중순 ~ 7월 초" },
  { q: "3분기", m: "9월 초 ~ 12월 초" },
];
// 과목별 연간 커리큘럼 — 필터를 바꾸면 셀 내용만 교체되고 표 틀은 고정됩니다.
// "→" = 전 분기 연속 / "—" = 미개설
const CUR_DATA = {
  all: {
    "중A": ["중1 / 1-2", "중2-1", "중2-2"],
    "중B": ["중등 검정고시", "중3-1", "중3-2"],
    "고A": ["고등 검정고시 / 수능 기본", "수능 개념 과정", "수능 개념 과정"],
    "고B": ["수능 유형 과정", "수능 유형 과정", "수능 유형 과정"],
    "고C": ["수능 실전 과정", "수능 실전 과정", "수능 실전 과정"],
  },
  korean: {
    "중A": ["중1 / 1-2", "중2-1", "중2-2"],
    "중B": ["중졸 검정고시", "중3-1", "중3-2"],
    "고A": ["고졸 검정고시", "수능 개념 과정", "수능 개념 과정"],
    "고B": ["수능 유형 과정", "수능 유형 과정", "수능 유형 과정"],
    "고C": ["수능 실전 과정", "수능 실전 과정", "수능 실전 과정"],
  },
  math: {
    "중A": ["중1", "중1-2", "중2-1"],
    "중B": ["중졸 검정고시(택1) / 중2-2", "중3-1", "중3-2"],
    "고A": ["고졸 검정고시(택1) / 공통수학1", "공통수학2", "대수"],
    "고B": ["미적분 Ⅰ", "확률과 통계", "—"],
    "고C": ["수능 실전 과정", "수능 실전 과정", "수능 실전 과정"],
  },
  english: {
    "중A": ["Lv.1 Grammar Joy + 단어(800)\nLv.2 중학영문법 + 독해 + 단어(1,000)", "→", "→"],
    "중B": ["Lv.3 중학 Grammar 천일문 + 단어(1,200)\nLv.4 천일문 기본 + 단어(1,200)", "→", "→"],
    "고A": ["수능 기본 과정", "수능 기본 과정", "수능 기본 과정"],
    "고B": ["수능 유형 과정", "수능 유형 과정", "수능 유형 과정"],
    "고C": ["수능 실전 과정", "수능 실전 과정", "수능 실전 과정"],
  },
  social: {
    "중A": ["중1 / 1-2 (사회1)", "중2-1", "중2-2"],
    "중B": ["중졸 검정고시", "중3-1", "중3-2"],
    "고A": ["고졸 검정고시 (사회)\n고졸 검정고시 (한국사)", "통합사회 (기본)", "통합사회 (유형)"],
    "고B": ["—", "—", "—"],
    "고C": ["—", "—", "—"],
  },
  science: {
    "중A": ["중1 / 1-2", "중2-1", "중2-2"],
    "중B": ["중졸 검정고시", "중3-1", "중3-2"],
    "고A": ["고졸 검정고시", "통합과학1 (개념)", "통합과학2 (개념)"],
    "고B": ["통합과학 (유형)", "통합과학 (실전)", "통합과학 (실전)"],
    "고C": ["수능 실전 과정", "수능 실전 과정", "수능 실전 과정"],
  },
};
const CUR_NOTE = { social: "사회 커리큘럼은 확인 후 업데이트될 수 있습니다." };

function AnnualCurriculum() {
  const [subj, setSubj] = useStateCur("all");
  const data = CUR_DATA[subj] || CUR_DATA.all;

  const Cell = ({ text }) => {
    if (text === "→") {
      return <span style={{ color: "rgba(0,29,61,0.34)", fontWeight: 700, fontSize: 12.5, display: "inline-flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" }}><Icon name="arrow" size={14} /> 전 분기 연속</span>;
    }
    if (!text || text === "—") {
      return <span style={{ color: "rgba(0,29,61,0.28)", fontWeight: 700, fontSize: 15 }}>—</span>;
    }
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 5, alignItems: "flex-start" }}>
        {text.split("\n").map((line, i) => (
          <span key={i} style={{
            fontWeight: 700, fontSize: 13.5, lineHeight: 1.35,
            padding: "5px 10px", borderRadius: 6,
            background: "rgba(255,214,10,0.22)", color: NAVY,
            wordBreak: "keep-all",
          }}>{line}</span>
        ))}
      </div>
    );
  };

  return (
    <div>
      <p style={{ margin: "0 0 20px", fontSize: 15, color: MUTED, fontWeight: 500, maxWidth: 760, lineHeight: 1.7 }}>
        1년 3분기 체제. 과목 필터를 바꿔도 <strong style={{ color: NAVY }}>표 틀은 그대로</strong> 유지되고, 셀 내용만 해당 과목으로 교체됩니다.
      </p>
      {/* subject filter */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        {CUR_SUBJECTS.map((s) => (
          <button key={s.id} onClick={() => setSubj(s.id)} style={{
            height: 38, padding: "0 18px", borderRadius: 8, fontWeight: 800, fontSize: 14, cursor: "pointer",
            border: "1.5px solid " + (subj === s.id ? NAVY : LINE),
            background: subj === s.id ? NAVY : "#fff",
            color: subj === s.id ? "#fff" : "var(--acad-ink)", whiteSpace: "nowrap",
          }}>{s.ko}</button>
        ))}
      </div>

      {/* table */}
      <div style={{ border: "1.5px solid " + NAVY, borderRadius: 14, overflow: "hidden", background: PAPER }}>
        {/* header */}
        <div style={{ display: "grid", gridTemplateColumns: "92px 1fr 1fr 1fr", background: NAVY, color: "#fff" }}>
          <div style={{ padding: "16px 14px" }} />
          {COL_HEADERS.map((c) => (
            <div key={c.q} style={{ padding: "14px 18px", borderLeft: "1px solid rgba(255,255,255,0.15)", display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-start" }}>
              <div style={{ display: "inline-block", background: YEL, color: NAVY, fontWeight: 900, fontSize: 14, padding: "4px 12px", borderRadius: 5, whiteSpace: "nowrap" }}>{c.q}</div>
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", fontWeight: 600, whiteSpace: "nowrap" }}>{c.m}</span>
            </div>
          ))}
        </div>
        {/* rows */}
        {GRADES.map((g) => (
          <div key={g} style={{ display: "grid", gridTemplateColumns: "92px 1fr 1fr 1fr", borderTop: "1px solid " + LINE, minHeight: 76 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 17, color: NAVY, background: "rgba(0,29,61,0.04)", borderRight: "1px solid " + LINE }}>{g}</div>
            {data[g].map((cell, j) => (
              <div key={j} style={{ padding: "16px 18px", borderLeft: "1px solid " + LINE, display: "flex", alignItems: "center" }}>
                <Cell text={cell} />
              </div>
            ))}
          </div>
        ))}
      </div>
      {CUR_NOTE[subj] && (
        <div style={{ marginTop: 12, fontSize: 12.5, color: "#B4791C", fontWeight: 700 }}>※ {CUR_NOTE[subj]}</div>
      )}
      <div style={{ marginTop: 12, fontSize: 12.5, color: MUTED, fontWeight: 500, textAlign: "right" }}>* 교과목·교육과정에 따라 커리큘럼은 달라질 수 있습니다.</div>

      <div style={{ marginTop: 36, background: NAVY, borderRadius: 14, padding: "30px 36px", textAlign: "center", color: "#fff" }}>
        <span style={{ fontWeight: 900, fontSize: 26, letterSpacing: "-0.035em" }}>1년 3분기, <em style={{ fontStyle: "normal", color: YEL }}>4년</em>이면 중·고등 교과 과정이 끝납니다.</span>
      </div>
    </div>
  );
}

// ── 분기별 학사일정 — 월간 캘린더 ─────────────────────────────────
const Q_MONTHS = {
  "1분기": { range: "1월 말 ~ 4월 초", months: [1, 2, 3] },
  "2분기": { range: "4월 중순 ~ 7월 초", months: [4, 5, 6, 7] },
  "3분기": { range: "9월 초 ~ 12월 초", months: [9, 10, 11, 12] },
};
const EV_STYLE = {
  start:   { bg: "#FBE2CC", fg: "#9A4B12", badge: "START" },
  finish:  { bg: "#FBE2CC", fg: "#9A4B12", badge: "FINISH" },
  test:    { bg: "#FBE4C4", fg: "#8A5510" },
  notice:  { bg: "#FCEAD6", fg: "#8A5510" },
  home:    { bg: "#DBEAF1", fg: "#1C4E66" },
  event:   { bg: "#DBEAF1", fg: "#1C4E66" },
  holiday: { bg: "#D6EEDF", fg: "#1B5E3A" },
};
// 이벤트: { d } 단일 / { from, to } 범위(라벨은 시작일에만) — 2026 2분기 기준
const CAL = {
  "2026-4": [
    { d: 13, type: "start", label: "리뉴젠 2분기 개강" },
    { from: 27, to: 29, type: "event", label: "11차 전국학생대회" },
    { from: 30, to: 30, type: "home", label: "가정학습기간" },
  ],
  "2026-5": [
    { from: 1, to: 2, type: "home", label: "가정학습기간" },
    { from: 4, to: 5, type: "home", label: "가정학습기간" },
    { d: 5, type: "holiday", label: "어린이날" },
    { d: 20, type: "test", label: "월간평가" },
    { d: 24, type: "holiday", label: "석가탄신일" },
    { d: 25, type: "holiday", label: "대체공휴일" },
    { from: 26, to: 27, type: "notice", label: "월간평가 성적 고지 기간" },
    { from: 28, to: 29, type: "notice", label: "월간평가 성적 정정 기간" },
  ],
  "2026-6": [
    { d: 3, type: "holiday", label: "지방선거일" },
    { d: 6, type: "holiday", label: "현충일" },
    { d: 17, type: "test", label: "월간평가" },
    { from: 22, to: 23, type: "notice", label: "월간평가 성적 고지 기간" },
    { from: 25, to: 26, type: "notice", label: "월간평가 성적 정정 기간" },
    { from: 28, to: 30, type: "home", label: "가정학습기간" },
  ],
  "2026-7": [
    { from: 1, to: 1, type: "home", label: "가정학습기간" },
    { d: 8, type: "test", label: "월간평가" },
    { d: 10, type: "finish", label: "리뉴젠 2분기 종강" },
    { from: 13, to: 14, type: "notice", label: "2분기 오프라인 종강 캠프" },
    { from: 15, to: 16, type: "notice", label: "월간평가 성적 고지 기간" },
    { from: 17, to: 20, type: "notice", label: "월간평가 성적 정정 기간" },
  ],
};

function MonthGrid({ year, month }) {
  const key = year + "-" + month;
  const events = CAL[key] || [];
  const first = new Date(year, month - 1, 1).getDay();
  const days = new Date(year, month, 0).getDate();
  const cells = [];
  for (let i = 0; i < first; i++) cells.push(null);
  for (let d = 1; d <= days; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  const evFor = (d) => events.filter((e) => (e.d === d) || (e.from <= d && d <= e.to));

  return (
    <div style={{ border: "1.5px solid " + NAVY, borderRadius: 14, overflow: "hidden", background: PAPER }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", background: NAVY }}>
        {["일", "월", "화", "수", "목", "금", "토"].map((w, i) => (
          <div key={w} style={{ padding: "11px 0", textAlign: "center", fontWeight: 800, fontSize: 12.5, color: i === 0 ? "#FF9B9B" : i === 6 ? "#9BC4FF" : "rgba(255,255,255,0.85)" }}>{w}</div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)" }}>
        {cells.map((d, idx) => {
          const dow = idx % 7;
          return (
            <div key={idx} style={{ minHeight: 104, borderTop: "1px solid " + LINE, borderLeft: dow === 0 ? "none" : "1px solid " + LINE, padding: "8px 7px", background: d ? "#fff" : "rgba(0,29,61,0.02)" }}>
              {d && <div style={{ fontWeight: 800, fontSize: 13, color: dow === 0 ? "#D64545" : dow === 6 ? "#2A6FDB" : NAVY }}>{d}</div>}
              {d && evFor(d).map((e, k) => {
                const st = EV_STYLE[e.type];
                const isStart = (e.d === d) || (e.from === d);
                return (
                  <div key={k} title={e.label} style={{ marginTop: 4, background: st.bg, color: st.fg, borderRadius: 4, padding: "3px 6px", fontSize: 10, fontWeight: 700, lineHeight: 1.3, minHeight: 18, overflow: "hidden" }}>
                    {isStart ? (
                      <span style={{ display: "block", whiteSpace: "normal" }}>
                        {e.label}{st.badge && <b style={{ marginLeft: 4, color: "#C8302B", fontSize: 9, letterSpacing: "0.04em" }}>{st.badge}</b>}
                      </span>
                    ) : "\u00A0"}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function QuarterSchedule() {
  const [quarter, setQuarter] = useStateCur("2분기");
  const months = Q_MONTHS[quarter].months;
  const firstRun = React.useRef(true);
  const [mIdx, setMIdx] = useStateCur(() => { const i = Q_MONTHS["2분기"].months.indexOf(6); return i < 0 ? 0 : i; });
  React.useEffect(() => { if (firstRun.current) { firstRun.current = false; return; } setMIdx(0); }, [quarter]);
  const month = months[Math.min(mIdx, months.length - 1)];

  const legend = [
    ["개강 · 종강", EV_STYLE.start.bg], ["월간평가", EV_STYLE.test.bg],
    ["성적 고지 · 정정", EV_STYLE.notice.bg], ["가정학습 · 행사", EV_STYLE.home.bg], ["공휴일", EV_STYLE.holiday.bg],
  ];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "230px 1fr", gap: 24, alignItems: "start" }}>
      {/* left: quarter nav + legend */}
      <div style={{ display: "grid", gap: 10 }}>
        {Object.keys(Q_MONTHS).map((q) => {
          const active = quarter === q;
          return (
            <button key={q} onClick={() => setQuarter(q)} style={{
              textAlign: "left", padding: "16px 18px", borderRadius: 12, cursor: "pointer",
              border: "1.5px solid " + (active ? NAVY : LINE),
              background: active ? NAVY : "#fff", color: active ? "#fff" : "var(--acad-ink)",
            }}>
              <span style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, fontWeight: 700, opacity: 0.7 }}>
                <Icon name="calendar" size={15} /> 2026학년도
              </span>
              <div style={{ fontWeight: 900, fontSize: 19, letterSpacing: "-0.02em", marginTop: 4 }}>{q}</div>
              <div style={{ fontSize: 12.5, fontWeight: 600, marginTop: 4, color: active ? "rgba(255,255,255,0.7)" : MUTED, whiteSpace: "nowrap" }}>{Q_MONTHS[q].range}</div>
            </button>
          );
        })}
        <div style={{ marginTop: 8, background: PAPER, border: "1px solid " + LINE, borderRadius: 12, padding: "14px 16px", display: "grid", gap: 9 }}>
          <div style={{ fontWeight: 800, fontSize: 12, color: MUTED }}>범례</div>
          {legend.map(([t, c]) => (
            <div key={t} style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 12.5, fontWeight: 600, color: "var(--acad-ink)" }}>
              <span style={{ width: 16, height: 16, borderRadius: 4, background: c, flexShrink: 0 }} /> {t}
            </div>
          ))}
        </div>
      </div>

      {/* right: month nav + grid */}
      <div>
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 20, marginBottom: 18 }}>
          <button onClick={() => setMIdx((i) => Math.max(0, i - 1))} disabled={mIdx === 0} style={navBtn(mIdx === 0)}><Icon name="arrowLeft" size={18} /></button>
          <div style={{ fontWeight: 900, fontSize: 28, letterSpacing: "-0.03em", color: NAVY, minWidth: 180, textAlign: "center" }}>2026년 {month}월</div>
          <button onClick={() => setMIdx((i) => Math.min(months.length - 1, i + 1))} disabled={mIdx === months.length - 1} style={navBtn(mIdx === months.length - 1)}><Icon name="arrow" size={18} /></button>
        </div>
        <MonthGrid year={2026} month={month} />
        <p style={{ marginTop: 16, fontSize: 13, color: MUTED, fontWeight: 500 }}>
          주 4회 수업(월·화·목·금, 수요일 제외) · 회당 50분 · 월간평가 후 성적 <strong style={{ color: NAVY }}>고지 → 정정</strong> 기간을 운영합니다.
        </p>
      </div>
    </div>
  );
}
function navBtn(disabled) {
  return {
    width: 44, height: 44, borderRadius: "50%", cursor: disabled ? "default" : "pointer",
    border: "1.5px solid " + (disabled ? "var(--acad-line)" : "var(--acad-navy)"),
    background: disabled ? "transparent" : "var(--acad-navy)",
    color: disabled ? "rgba(0,29,61,0.25)" : "#fff",
    display: "inline-flex", alignItems: "center", justifyContent: "center",
  };
}

// ── 교재 ──────────────────────────────────────────────────────────
function Textbooks() {
  const books = [
    { subj: "국어", en: "Korean", color: NAVY },
    { subj: "수학", en: "Mathematics", color: NAVY2 },
    { subj: "영어", en: "English", color: NAVY },
    { subj: "사회", en: "Social", color: NAVY2 },
    { subj: "과학", en: "Science", color: NAVY },
    { subj: "한국사", en: "History", color: NAVY2 },
  ];
  return (
    <div>
      <p style={{ margin: "0 0 24px", fontSize: 15, color: MUTED, fontWeight: 500, maxWidth: 760, lineHeight: 1.7 }}>
        {window.RJ_EDU_MODE ? (
          <>각 교과를 깊이 있게 재구성한 <strong style={{ color: NAVY }}>리뉴젠 자체 교과 교재</strong>. 모든 강의 교재는 수강 시 함께 제공됩니다.</>
        ) : (
          <>일반 학문을 기독교적 관점으로 투영한 <strong style={{ color: NAVY }}>한국형 기독교 교과 교재</strong>. 모든 강의 교재는 수강 시 함께 제공됩니다.</>
        )}
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 16 }}>
        {books.map((b) => (
          <div key={b.subj} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ aspectRatio: "3/4", background: b.color, borderRadius: 10, position: "relative", overflow: "hidden", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 16, boxShadow: "0 8px 22px rgba(0,29,61,0.14)" }}>
              <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 7, background: YEL }} />
              <div style={{ fontFamily: "var(--font-en)", fontSize: 10, letterSpacing: "0.16em", color: "rgba(255,255,255,0.6)", fontWeight: 700, paddingLeft: 6 }}>{b.en.toUpperCase()}</div>
              <div style={{ paddingLeft: 6 }}>
                <div style={{ fontWeight: 900, fontSize: 24, color: "#fff", letterSpacing: "-0.03em" }}>{b.subj}</div>
                <div style={{ fontSize: 11, color: YEL, fontWeight: 700, marginTop: 4 }}>리뉴젠 교과</div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 28, background: CREAM, borderRadius: 14, padding: "22px 26px", fontSize: 14, color: MUTED, fontWeight: 500 }}>
        교재 실물 이미지는 준비 중입니다. 표지·내지 시안이 확정되면 이 자리에 교체해 드립니다.
      </div>
    </div>
  );
}

window.CurriculumPage = CurriculumPage;
