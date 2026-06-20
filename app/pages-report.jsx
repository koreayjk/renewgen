/* global React, RJReport, Icon, useApp, ACCOUNT */
// ──────────────────────────────────────────────────────────────────
// 월말평가 성적표 — UI
//   · ReportManager     관리자: CSV 업로드 → 학생별 분류 → 미리보기 → PDF
//   · StudentReportCard 한 페이지 성적표 시트 (인쇄/PDF 친화)
//   · ReportSelfView    학생 본인 성적표 조회 (마이페이지)
//   · RJRadar / RJTrend 순수 SVG 차트
// ──────────────────────────────────────────────────────────────────

const { useState: useStR, useEffect: useEffectR, useMemo: useMemoR, useRef: useRefR, useCallback: useCbR } = React;

const RC_COMMENTS_KEY = "rj_report_comments_v2";
function rcLoadComments() { try { return JSON.parse(localStorage.getItem(RC_COMMENTS_KEY) || "{}"); } catch (e) { return {}; } }
function rcSaveComments(c) { try { localStorage.setItem(RC_COMMENTS_KEY, JSON.stringify(c)); } catch (e) {} }
const rcInitials = (nm) => (nm || "").slice(0, 2);
const rcSubColor = (id) => (RJReport.SUBJECTS.find((s) => s.id === id) || {}).color || "#5C6678";

// ── 자동 코멘트 — 반 평균 대비 / 과목별 강·약점 / 회차 추이 / 약점 코칭 / 마무리
// 학생마다 점수·추이·반 위치가 달라서 자연스럽게 내용이 갈리도록 설계.
function _rcHash(s) { let h = 0; for (const c of String(s || "")) h = (h * 31 + c.charCodeAt(0)) | 0; return Math.abs(h); }
function _rcPick(arr, seed) { return arr[_rcHash(seed) % arr.length]; }
const RC_COACH = {
  "국어": [
    "비문학 지문 1편을 매일 시간 재서 풀고, 주제·근거를 직접 표시하는 습관을 권합니다.",
    "선지 분석 노트를 만들어 ‘왜 그 답이 맞는가’를 한 줄로 쓰는 연습이 효과적입니다.",
    "어휘·접속어 정리로 약한 단원부터 채워나가면 점수 회복이 빠릅니다.",
  ],
  "영어": [
    "구문 분석은 매일 단문 5개로 줄여 패턴을 익히는 게 흔들리지 않습니다.",
    "어휘는 회독수보다 출제 빈도순으로 좁혀 집중하세요.",
    "지문 유형별로 시간 분배를 정해놓고 푸는 훈련이 도움이 됩니다.",
  ],
  "수학": [
    "기본 유형 일일 5문제 루틴으로 감각을 잃지 않게 해 주세요.",
    "오답노트에 ‘어디서 막혔는가’를 한 줄로 적는 것만으로도 같은 실수가 줄어듭니다.",
    "고난도보다 기본·중간 난도 정확도를 먼저 끌어올리는 게 효율적입니다.",
  ],
  "사회": [
    "주요 개념을 표·도표로 묶어 비교 학습하면 흐름이 잡힙니다.",
    "기출문제로 출제 패턴을 익혀 자주 출제되는 주제를 우선 학습하세요.",
  ],
  "과학": [
    "개념 정리와 그래프·도표 해석 연습을 동시에 진행하는 게 효율적입니다.",
    "탐구 문항은 자료 해석이 핵심이라, 도표·그래프 문제 비중을 높여 보세요.",
  ],
};
function _rcCoach(subj) {
  return RC_COACH[subj] || [
    "취약 단원을 1주일 단위로 끊어 점검해 보세요.",
    "오답 정리만 꾸준히 해도 같은 유형 실수를 크게 줄일 수 있습니다.",
  ];
}

// 자동 코멘트 (관리자가 비워두면 점수 기반 기본 문구)
//  ctx: { name, trend, roundLabel }  — 가능한 한 채워 주면 더 구체적인 문장이 됩니다.
function rcAutoComment(st, delta, ctx) {
  const subs = Object.entries(st.subjects).filter(([, v]) => v.score != null);
  if (!subs.length) return "이번 회차 응시 기록이 없습니다. 다음 회차는 가능한 한 모든 과목을 응시하도록 지도가 필요합니다.";
  const name = (ctx && ctx.name) || st.name || "학생";
  const seed = name + "|" + ((ctx && ctx.roundLabel) || "");

  const sorted = subs.slice().sort((a, b) => b[1].score - a[1].score);
  const best = sorted[0], weak = sorted[sorted.length - 1];
  const [bSub, bV] = best, [wSub, wV] = weak;
  const gap = bV.score - wV.score;
  const avg = st.avg, cAvg = st.cohortAvg, cN = st.cohortN, rank = st.rankOverall;

  // 1) 도입 — 반 평균 대비 위치
  let opening = "";
  if (avg != null && cAvg != null) {
    const diff = Math.round((avg - cAvg) * 10) / 10;
    if (diff >= 8) opening = _rcPick([
      `${name}는 이번 회차 평균 ${avg}점으로 반 평균(${cAvg})을 ${diff}점 상회하며 상위권 자리를 안정적으로 지키고 있습니다.`,
      `평균 ${avg}점, 반 평균 대비 +${diff}점으로 ${cN}명 중 ${rank ? rank + "등 " : ""}상위 흐름이 단단합니다.`,
    ], seed);
    else if (diff >= 2) opening = _rcPick([
      `이번 회차 평균은 ${avg}점으로 반 평균(${cAvg})보다 ${diff}점 높은 무난한 결과입니다.`,
      `${name}는 평균 ${avg}점으로 반 평균(${cAvg})을 살짝 웃돌며, 한 과목만 더 다듬으면 상위권 도약이 가능한 위치입니다.`,
    ], seed);
    else if (diff > -2) opening = _rcPick([
      `평균 ${avg}점으로 반 평균(${cAvg})에 거의 일치합니다. 약점 한두 과목만 보완하면 상위권으로 올라설 수 있는 자리입니다.`,
      `평균 ${avg}점으로 반 평균에 근접합니다. 균형은 잘 잡혀 있어 ‘무엇을 더 채우느냐’가 다음 과제입니다.`,
    ], seed);
    else if (diff > -8) opening = `평균 ${avg}점으로 반 평균(${cAvg}) 대비 ${Math.abs(diff)}점 아래입니다. 약점 과목 보완이 시급한 시점입니다.`;
    else opening = `평균 ${avg}점은 반 평균(${cAvg}) 대비 ${Math.abs(diff)}점 낮은 결과입니다. 진도보다 기본기 점검과 학습 루틴의 재정비가 우선되어야 합니다.`;
  } else if (avg != null) {
    opening = `${name}는 이번 회차 평균 ${avg}점을 기록했습니다.`;
  } else {
    opening = `${name}의 이번 회차 결과를 다음과 같이 정리했습니다.`;
  }

  // 2) 강점
  let strength = "";
  if (bV.classAvg != null && bV.score - bV.classAvg >= 5) {
    strength = ` 특히 ${bSub}(${bV.score}점)는 반 평균(${bV.classAvg}) 대비 +${Math.round((bV.score - bV.classAvg) * 10) / 10}점으로 ${name}의 가장 단단한 영역입니다.`;
  } else if (bV.score >= 90) {
    strength = ` ${bSub}(${bV.score}점)은 안정적인 최상위권으로, 자신감의 출발점이 될 수 있는 과목입니다.`;
  } else if (bV.score >= 80) {
    strength = ` ${bSub}(${bV.score}점)이 가장 안정적이며, 다른 과목으로 확장할 수 있는 발판이 됩니다.`;
  } else {
    strength = ` 가장 높은 점수는 ${bSub}(${bV.score}점)인데, 우선 이 과목부터 80점대 안착이 다음 목표입니다.`;
  }

  // 3) 약점 / 균형
  let weakness = "";
  if (bSub !== wSub) {
    if (wV.classAvg != null && wV.classAvg - wV.score >= 5) {
      weakness = ` 반면 ${wSub}(${wV.score}점)는 반 평균(${wV.classAvg}) 대비 -${Math.round((wV.classAvg - wV.score) * 10) / 10}점으로, 다음 회차까지 가장 먼저 손볼 영역입니다.`;
    } else if (wV.score < 60) {
      weakness = ` ${wSub}(${wV.score}점)는 기본 점수대 회복이 우선이며, 어려운 문제보다 정답 빈도 높은 유형부터 점검할 것을 권합니다.`;
    } else if (gap >= 20) {
      weakness = ` ${wSub}(${wV.score}점)과의 격차가 ${gap}점으로, 과목 간 균형이 다음 회차 과제입니다.`;
    } else {
      weakness = ` ${wSub}(${wV.score}점)도 평균 수준은 지켜내고 있어 큰 무리는 없습니다.`;
    }
  }

  // 4) 추이 (3회차 이상이면 패턴 진단)
  let trendNote = "";
  const trend = ctx && ctx.trend;
  if (Array.isArray(trend) && trend.length >= 3) {
    const avgs = trend.map((t) => t.avg).filter((x) => x != null);
    if (avgs.length >= 3) {
      const last3 = avgs.slice(-3);
      const swing = Math.max(...last3) - Math.min(...last3);
      if (last3[2] > last3[1] && last3[1] > last3[0]) trendNote = ` 최근 3회차 ${last3.join(" → ")}점으로 꾸준한 상승 흐름이며, 이 리듬을 끊지 않는 것이 관건입니다.`;
      else if (last3[2] < last3[1] && last3[1] < last3[0]) trendNote = ` 최근 3회차 ${last3.join(" → ")}점으로 하락 추세입니다. 학습 컨디션과 일정 점검이 시급합니다.`;
      else if (swing >= 10) trendNote = ` 최근 3회차 변동폭이 ${swing}점으로 다소 큰 편입니다. 안정적 점수대를 만드는 것이 다음 단계입니다.`;
      else trendNote = ` 최근 3회차 ${last3.join("·")}점으로 변동이 작아 학습 루틴이 잘 잡혀 있다는 신호입니다.`;
    }
  } else if (delta != null) {
    if (delta > 1.5) trendNote = ` 전월 대비 평균이 ${delta.toFixed(1)}점 상승했습니다.`;
    else if (delta < -1.5) trendNote = ` 전월 대비 평균이 ${Math.abs(delta).toFixed(1)}점 하락해 흐름 점검이 필요합니다.`;
    else trendNote = ` 전월 대비 평균을 안정적으로 유지하고 있습니다.`;
  }

  // 5) 약점 과목 코칭
  let coaching = "";
  if (bSub !== wSub) {
    const tip = _rcPick(_rcCoach(wSub), seed + wSub);
    coaching = ` 다음 회차까지 ${wSub} 영역은 ${tip}`;
  }

  // 6) 마무리 (반 평균 대비 톤)
  let closing = "";
  if (avg != null && cAvg != null) {
    const diff = avg - cAvg;
    if (diff >= 8) closing = " 지금의 흐름을 유지하면서 과목 간 균형을 다듬어 가면 됩니다.";
    else if (diff >= -2) closing = " 약점 한 과목만 잡아도 평균 도약이 가시화되는 단계입니다.";
    else closing = " 무리한 진도보다 매주 2~3과목 집중 보완으로 회복 루틴을 만들어 봅시다.";
  }

  return opening + strength + weakness + trendNote + coaching + closing;
}

// ── AI(Claude) 코멘트 — 학생 한 명의 데이터를 받아 자연스러운 담임 총평 한 단락 생성
function rcBuildAIPrompt(st, ctx) {
  const subs = Object.entries(st.subjects).filter(([, v]) => v.score != null);
  const subjLines = subs.map(([sub, v]) => `  - ${sub}: ${v.score}점 (반 평균 ${v.classAvg != null ? v.classAvg : "-"}, ${v.classN || 0}명 중 ${v.rank || "-"}등)`).join("\n");
  const trendLines = ((ctx && ctx.trend) || []).map((t) => {
    const tsubs = Object.entries(t.subjects || {}).filter(([, sc]) => sc != null).map(([sub, sc]) => `${sub} ${sc}`).join(", ");
    return `  - ${t.shortLabel || t.label}: 평균 ${t.avg != null ? t.avg : "-"}점${tsubs ? " (" + tsubs + ")" : ""}`;
  }).join("\n");
  return `당신은 한국 학원의 담임 선생님입니다. 아래 월말평가 데이터를 보고, 학부모님과 학생이 함께 읽는 성적표의 ‘담임 총평’을 한국어로 작성하세요.

[학생]
- 이름: ${(ctx && ctx.name) || st.name || "(이름 미상)"}
- 학년/반: ${st.level || "-"}
- 회차: ${(ctx && ctx.roundLabel) || "-"}

[이번 회차 점수]
${subjLines}
- 본인 평균: ${st.avg != null ? st.avg : "-"}점 / 반 평균: ${st.cohortAvg != null ? st.cohortAvg : "-"}점 / 동급 ${st.cohortN || 0}명 중 ${st.rankOverall || "-"}등

[회차별 추이]
${trendLines || "  - (이전 회차 기록 없음)"}

[작성 원칙]
1. "꾸준히 노력", "좋은 흐름을 이어가세요" 같은 누구에게나 쓸 만한 빈말 금지.
2. 구체 점수·과목·추이를 인용해 강점과 약점을 짚을 것.
3. 다음 회차까지 학생이 실제로 실행할 행동지침을 한 가지 명확히 제시.
4. 학부모님이 읽어도 안심되도록 사실에 근거해 따뜻하게.
5. 분량은 한국어 3~5문장. 인사말·머리말·따옴표·이모지 없이 본문만 출력.`;
}
async function rcGenerateAIComment(st, ctx) {
  if (!(window.claude && typeof window.claude.complete === "function")) {
    throw new Error("AI 코멘트는 배포 환경에서만 사용할 수 있습니다.");
  }
  const txt = await window.claude.complete(rcBuildAIPrompt(st, ctx));
  return String(txt || "").trim();
}

// 회차 통계 재계산 — 학생/과목 평균·랭크, 동급 평균·등수까지
function rcRecomputeRound(round) {
  for (const k in round.students) {
    const st = round.students[k];
    const scores = Object.values(st.subjects).map((x) => x.score).filter((x) => x != null);
    st.taken = scores.length;
    st.total = scores.length ? scores.reduce((a, b) => a + b, 0) : null;
    st.avg = scores.length ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10 : null;
  }
  const subjects = new Set();
  for (const k in round.students) for (const sub in round.students[k].subjects) subjects.add(sub);
  for (const sub of subjects) {
    const entries = [];
    for (const k in round.students) {
      const sd = round.students[k].subjects[sub];
      if (sd && sd.score != null) entries.push({ key: k, score: sd.score });
    }
    const avg = entries.length ? entries.reduce((a, b) => a + b.score, 0) / entries.length : 0;
    const sorted = [...entries].sort((a, b) => b.score - a.score);
    for (const k in round.students) {
      const sd = round.students[k].subjects[sub];
      if (!sd) continue;
      sd.classAvg = Math.round(avg * 10) / 10;
      sd.classN = entries.length;
      sd.rank = sd.score != null ? sorted.findIndex((t) => t.key === k) + 1 : null;
    }
  }
  const byLevel = {};
  for (const k in round.students) {
    const st = round.students[k];
    (byLevel[st.level] = byLevel[st.level] || []).push({ key: k, st });
  }
  for (const lv in byLevel) {
    const cohort = byLevel[lv].filter((x) => x.st.avg != null).sort((a, b) => b.st.avg - a.st.avg);
    byLevel[lv].forEach((x) => {
      x.st.cohortN = cohort.length;
      x.st.cohortAvg = cohort.length ? Math.round((cohort.reduce((a, b) => a + b.st.avg, 0) / cohort.length) * 10) / 10 : null;
      x.st.rankOverall = x.st.avg != null ? cohort.findIndex((c) => c.key === x.key) + 1 : null;
    });
  }
}

// 점수 직접 수정 — 비어 있는 과목 칸을 채우거나 기존 점수를 고친다
function RCScoreEditor({ st, onScoreChange }) {
  const subs = Object.entries(st.subjects).sort((a, b) => a[0].localeCompare(b[0], "ko"));
  if (!subs.length) return null;
  const set = (sub, raw) => {
    const v = String(raw).trim();
    const n = v === "" ? null : Number(v);
    if (n != null && (Number.isNaN(n) || n < 0)) return;
    onScoreChange(sub, n);
  };
  return (
    <details className="no-print" style={{ margin: "16px 0 0", border: "1px dashed var(--ci-line)", borderRadius: 10, background: "var(--ci-bg)" }}>
      <summary style={{ padding: "12px 16px", fontSize: 12.5, fontWeight: 800, color: "var(--ci-navy)", cursor: "pointer", listStyle: "none", display: "flex", alignItems: "center", gap: 8 }}>
        <Icon name="edit" size={13} /> 점수 직접 수정 — {subs.length}과목 (비어 있는 칸 채우기·점수 수정)
      </summary>
      <div style={{ padding: "8px 16px 16px", display: "grid", gap: 6 }}>
        {subs.map(([sub, v]) => (
          <div key={sub} style={{ display: "grid", gridTemplateColumns: "1fr 90px 50px", gap: 10, alignItems: "center" }}>
            <span style={{ fontSize: 13 }}>{sub}</span>
            <input type="number" defaultValue={v.score != null ? v.score : ""} min="0" max={v.max || 100} step="0.1" placeholder="—"
              onBlur={(e) => set(sub, e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); }}
              style={{ height: 32, borderRadius: 6, border: "1px solid var(--ci-line)", padding: "0 10px", fontFamily: "var(--font-en)", fontSize: 13, textAlign: "right", background: "#fff" }} />
            <span style={{ fontSize: 11.5, color: "var(--ci-muted)", fontFamily: "var(--font-en)" }}>/ {v.max || 100}</span>
          </div>
        ))}
        <p style={{ fontSize: 11.5, color: "var(--ci-muted)", margin: "6px 0 0", lineHeight: 1.6 }}>
          빈칸으로 두면 ‘미응시’로 처리됩니다 · 입력 후 다른 칸 클릭 또는 Enter 로 저장 · 저장하면 평균·랭크가 즉시 재계산됩니다.
        </p>
      </div>
    </details>
  );
}

// AI 코멘트 생성 버튼 — 담임 총평 옆에 표시
function RCAiButton({ st, ctx, onComment }) {
  const [busy, setBusy] = useStR(false);
  const [err, setErr] = useStR("");
  const available = !!(window.claude && typeof window.claude.complete === "function");
  const gen = async () => {
    if (!onComment) return;
    setBusy(true); setErr("");
    try {
      const txt = await rcGenerateAIComment(st, ctx);
      if (txt) onComment(txt);
      else setErr("응답이 비어 있습니다");
    } catch (e) { setErr(String((e && e.message) || e)); }
    setBusy(false);
  };
  if (!available) {
    return <span style={{ fontSize: 10.5, color: "var(--ci-muted)", fontWeight: 700 }} title="배포 환경(window.claude.complete)에서만 사용 가능">AI 생성 · 배포 후</span>;
  }
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
      {err && <span style={{ fontSize: 10.5, color: "var(--ci-bad)" }} title={err}>실패 · 재시도</span>}
      <button type="button" className="ci-act" style={{ height: 28, padding: "0 10px", fontSize: 11.5 }} onClick={gen} disabled={busy}>
        <Icon name="sparkle" size={11} /> {busy ? "AI 작성 중…" : "AI 코멘트 생성"}
      </button>
    </span>
  );
}

// ── 회차별 색상 (막대그래프) ───────────────────────────────────────
const RC_ROUND_COLORS = ["#1F4E8C", "#E08D2F", "#2E9E6B", "#C0392B", "#7A4FA3", "#0C8599", "#B59410", "#5B6770"];

function rcFmtDate(ts) {
  const d = ts ? new Date(ts) : new Date();
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())}.`;
}

// ── 과목별 성적 막대그래프 ─────────────────────────────────────────
//   가로축 = 과목 / 세로축 = 점수. 그룹 내 막대 = 회차(월), 색 = 회차.
//   회차가 쌓이면 과목마다 막대가 옆으로 늘어선다. 미응시 과목은 제외.
function RJSubjectBars({ subjects, rounds }) {
  const S = subjects.length;
  const R = Math.max(1, rounds.length);
  if (!S) return <div className="rc-bars-empty">이번 회차에 응시한 과목이 없습니다.</div>;
  const barW = R > 4 ? 16 : R > 2 ? 22 : 28;
  const innerGap = 6, groupGap = 34;
  const padL = 34, padR = 14, padT = 18, padB = 34;
  const plotH = 150;
  const groupW = R * barW + (R - 1) * innerGap;
  const W = padL + padR + S * groupW + (S - 1) * groupGap;
  const H = padT + plotH + padB;
  const yAt = (v) => padT + plotH * (1 - v / 100);
  const grid = [0, 20, 40, 60, 80, 100];
  const groupX = (gi) => padL + gi * (groupW + groupGap);
  return (
    <div className="rc-bars-wrap">
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" preserveAspectRatio="xMidYMid meet" style={{ display: "block" }}>
        {grid.map((g) => (
          <g key={g}>
            <line x1={padL} y1={yAt(g)} x2={W - padR} y2={yAt(g)} stroke="#EAE3D0" strokeWidth="1" />
            <text x={padL - 8} y={yAt(g)} dy="0.32em" textAnchor="end" fontSize="9.5" fontFamily="var(--font-en)" fill="#A79F89">{g}</text>
          </g>
        ))}
        {subjects.map((sub, gi) => {
          const gx = groupX(gi);
          return (
            <g key={sub}>
              {rounds.map((rd, ri) => {
                const v = rd.scores[sub];
                if (v == null) return null;
                const x = gx + ri * (barW + innerGap);
                const y = yAt(v);
                return (
                  <g key={ri}>
                    <rect x={x} y={y} width={barW} height={yAt(0) - y} rx="3" fill={RC_ROUND_COLORS[ri % RC_ROUND_COLORS.length]} />
                    <text x={x + barW / 2} y={y - 5} textAnchor="middle" fontSize="10" fontWeight="800" fontFamily="var(--font-en)" fill="#001D3D">{Math.round(v)}</text>
                  </g>
                );
              })}
              <text x={gx + groupW / 2} y={H - padB + 20} textAnchor="middle" fontSize="12.5" fontWeight="700" fill="#001D3D" fontFamily="var(--font-kr)">{sub}</text>
            </g>
          );
        })}
        <line x1={padL} y1={yAt(0)} x2={W - padR} y2={yAt(0)} stroke="#001D3D" strokeWidth="1.5" />
      </svg>
      {R > 1 && (
        <div className="rc-bar-legend">
          {rounds.map((rd, ri) => (
            <span key={ri}><i style={{ background: RC_ROUND_COLORS[ri % RC_ROUND_COLORS.length] }} /> {rd.label}</span>
          ))}
        </div>
      )}
    </div>
  );
}

// ── 성적표 시트 (한 페이지) ───────────────────────────────────────
function StudentReportCard({ round, store, studentKey, comment, onComment, editable, onScoreChange }) {
  const st = round.students[studentKey];
  if (!st) return null;
  const levelSubs = (round.subjectsByLevel[st.level] || RJReport.SUBJECTS.map((s) => s.id));
  const orderSubs = RJReport.SUBJECTS.map((s) => s.id).filter((id) => levelSubs.includes(id));
  for (const id of levelSubs) if (!orderSubs.includes(id)) orderSubs.push(id);

  // 이번 회차에 응시한 과목만 (미응시 제외)
  const takenSubs = orderSubs.filter((id) => st.subjects[id] && st.subjects[id].score != null);

  // 회차별 추이 (과목별 점수 포함) — 표·막대그래프 공용
  const trend = useMemoR(() => RJReport.studentTrend(store, studentKey), [store, studentKey, round.id]);
  const prevAvg = trend.length >= 2 ? trend[trend.length - 2].avg : null;
  const delta = prevAvg != null && st.avg != null ? Math.round((st.avg - prevAvg) * 10) / 10 : null;

  const cText = (comment != null && comment !== "") ? comment : rcAutoComment(st, delta, { name: st.name, trend, roundLabel: round.label });
  const showLevel = st.level && st.level !== "기타";
  const issueDate = rcFmtDate(round.createdAt);
  const barRounds = trend.map((t) => ({ label: t.shortLabel + " 월말평가", scores: t.subjects }));

  return (
    <div className="rc-sheet">
      <div className="rc-sheet-head">
        <div className="rc-brand">
          <img src="assets/logo-full.png" alt="리뉴젠 아카데미 · Re:newgen Academy" className="rc-brand-logo" />
        </div>
        <div className="rc-head-meta">
          <div className="t">{round.label}</div>
          <div className="d">{showLevel ? st.level + " · " : ""}응시 {st.taken || 0}과목</div>
        </div>
      </div>

      {/* 신원 정보 */}
      <div className="rc-id">
        <table className="rc-id-tbl"><tbody>
          <tr>
            <th>공동체명</th><td>{st.org || "개인"}</td>
            {showLevel && <th>학년/반</th>}
            {showLevel && <td>{st.level}</td>}
            <th>이름</th><td className="nm">{st.name}</td>
            <th>발급일</th><td>{issueDate}</td>
          </tr>
        </tbody></table>
      </div>

      {/* 요약 (평균 · 성장) */}
      <div className="rc-summary">
        <div className="rc-kpi">
          <div className="k">이번 회차 평균</div>
          <div className="v">{st.avg != null ? st.avg : "–"}<small>점</small></div>
          <div className="sub">{st.taken || 0}과목 평균 · 100점 만점</div>
        </div>
        <div className="rc-kpi">
          <div className="k">전월 대비</div>
          <div className="v">
            {delta == null ? "–" : <span className={"rc-delta " + (delta > 0 ? "up" : delta < 0 ? "down" : "flat")}>{delta > 0 ? "▲" : delta < 0 ? "▼" : "■"} {Math.abs(delta)}</span>}
          </div>
          <div className="sub">{prevAvg != null ? `직전 ${prevAvg}점 → 현재 ${st.avg}점` : "첫 회차 응시"}</div>
        </div>
      </div>

      {/* 회차별 과목 점수 표 */}
      <div className="rc-body">
        <h4 className="rc-seclabel">회차별 과목 점수 · Scores</h4>
        <table className="rc-grid">
          <thead>
            <tr>
              <th className="corner">구분</th>
              {takenSubs.map((id) => (
                <th key={id}><span className="rc-subdot" style={{ background: rcSubColor(id) }} />{id}</th>
              ))}
              <th className="avgcol">평균</th>
            </tr>
          </thead>
          <tbody>
            {trend.map((t) => (
              <tr key={t.roundId} className={t.roundId === round.id ? "cur" : ""}>
                <th className="rowhead">{t.shortLabel} 월말평가</th>
                {takenSubs.map((id) => <td key={id}>{t.subjects[id] != null ? t.subjects[id] : "–"}</td>)}
                <td className="avgcol">{t.avg != null ? t.avg : "–"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 성적 추이 막대그래프 */}
      <div className="rc-body rc-body-tight">
        <h4 className="rc-seclabel">성적 추이 · Trend</h4>
        <div className="rc-bars">
          <RJSubjectBars subjects={takenSubs} rounds={barRounds} />
        </div>
      </div>

      {editable && onScoreChange && <RCScoreEditor st={st} onScoreChange={onScoreChange} />}

      <div className="rc-comment">
        <div className="lab" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
          <span><Icon name="edit" size={13} /> 담임 총평 · Comment</span>
          {editable && <RCAiButton st={st} ctx={{ name: st.name, trend, roundLabel: round.label }} onComment={onComment} />}
        </div>
        {editable ? (
          <textarea value={comment != null ? comment : ""} placeholder={rcAutoComment(st, delta, { name: st.name, trend, roundLabel: round.label })}
            onChange={(e) => onComment && onComment(e.target.value)} />
        ) : (
          <div className="printed">{cText}</div>
        )}
      </div>

      <div className="rc-foot">
        <span>리뉴젠 아카데미 · 월말평가 성적표 · 본 성적표는 ClassIn 평가 데이터를 기반으로 생성되었습니다.</span>
        <span className="en">Re:newgen Academy</span>
      </div>
    </div>
  );
}

// ── 인쇄(PDF) 유틸 ────────────────────────────────────────────────
function useReportPrint(store, comments) {
  const [printJob, setPrintJob] = useStR(null); // { roundId, keys }
  useEffectR(() => {
    if (!printJob) return;
    const t = setTimeout(() => {
      window.print();
      setTimeout(() => setPrintJob(null), 200);
    }, 350);
    return () => clearTimeout(t);
  }, [printJob]);
  // 인쇄 영역을 본문(#root) 밖 portal 로 렌더 → 인쇄 시 빈 페이지/상단 여백 제거
  const portalEl = useRefR(null);
  if (!portalEl.current && typeof document !== "undefined") {
    let el = document.getElementById("rc-print-portal");
    if (!el) { el = document.createElement("div"); el.id = "rc-print-portal"; el.className = "rc-print-portal"; document.body.appendChild(el); }
    portalEl.current = el;
  }
  const sheets = printJob ? (() => {
    const round = store.rounds.find((r) => r.id === printJob.roundId);
    if (!round) return null;
    return printJob.keys.map((k) => (
      <StudentReportCard key={k} round={round} store={store} studentKey={k}
        comment={comments[printJob.roundId + "|" + k]} editable={false} />
    ));
  })() : null;
  const area = portalEl.current
    ? ReactDOM.createPortal(<div className="rc-print-area" aria-hidden="true">{sheets}</div>, portalEl.current)
    : null;
  return { print: (roundId, keys) => setPrintJob({ roundId, keys }), area };
}

// ── 관리자: 성적표 매니저 ─────────────────────────────────────────
function ReportManager() {
  const [store, setStore] = useStR(() => RJReport.loadStore());
  const [comments, setComments] = useStR(() => rcLoadComments());
  const rounds = RJReport.sortedRounds(store);
  const [roundId, setRoundId] = useStR(() => (rounds[rounds.length - 1] || {}).id || null);
  const [selKey, setSelKey] = useStR(null);
  const [query, setQuery] = useStR("");
  const [levelFilter, setLevelFilter] = useStR("all");
  const [pending, setPending] = useStR([]);     // [{name,text,level,subject}]
  const [roundLabel, setRoundLabel] = useStR(() => `2026 · ${new Date().getMonth() + 1}월 월말평가`);
  const [over, setOver] = useStR(false);
  const [syncing, setSyncing] = useStR(false);
  const fileRef = useRefR(null);
  const { print, area } = useReportPrint(store, comments);
  const { showToast } = useApp();

  const reload = () => { const s = RJReport.loadStore(); setStore(s); return s; };
  const round = rounds.find((r) => r.id === roundId) || rounds[rounds.length - 1] || null;

  const onFiles = async (fileList) => {
    const arr = Array.from(fileList).filter((f) => /\.csv$/i.test(f.name));
    const read = await Promise.all(arr.map(async (f) => {
      const text = await f.text();
      const fn = RJReport.parseFileName(f.name);
      return { name: f.name, text, level: fn.level, subject: fn.subject };
    }));
    setPending((p) => {
      const seen = new Set(p.map((x) => x.name));
      return [...p, ...read.filter((x) => !seen.has(x.name))];
    });
  };
  const commit = () => {
    if (!pending.length) return;
    const r = RJReport.buildRound(pending.map((p) => ({ name: p.name, text: p.text })), roundLabel, { seq: Date.now() });
    RJReport.addRound(r);
    setPending([]);
    const s = reload();
    setRoundId(r.id);
    setSelKey(null);
  };
  const loadDemo = () => { RJReport.genDemoStore(); const s = reload(); const rr = RJReport.sortedRounds(s); setRoundId((rr[rr.length - 1] || {}).id); setSelKey(null); };

  // ClassIn 자동 동기화 — scores.php(hook 으로 수신한 OMR 답안카드 성적)에서 바로 회차 생성
  const pullFromClassIn = async () => {
    if (syncing) return;
    setSyncing(true);
    const finish = (r, msg) => { if (r) { RJReport.addRound(r); reload(); setRoundId(r.id); setSelKey(null); } if (msg) showToast(msg); setSyncing(false); };
    try {
      const rows = await RJReport.fetchClassInScores({ cmd: "AnswerSheetScore" });
      if (!rows.length) { showToast("클래스인에서 불러올 새 성적이 없습니다"); setSyncing(false); return; }
      finish(RJReport.buildRoundFromClassIn(rows, roundLabel, { seq: Date.now() }), `클래스인에서 ${rows.length}건을 불러와 회차를 만들었습니다`);
    } catch (e) {
      // 백엔드(scores.php) 미연결 — 프로토타입에서는 동기화 결과를 시뮬레이션으로 미리보기
      setSyncing(false);
      if (confirm("클래스인 백엔드(scores.php)에 연결할 수 없습니다.\n\n실서버에서는 hook.php 가 받은 OMR 답안카드 성적을 그대로 불러옵니다.\n지금은 자동 동기화 결과를 '미리보기'로 생성해 볼까요?")) {
        const rows = RJReport.simulateClassInRows(RJReport.sortedRounds(RJReport.loadStore()).length);
        const r = RJReport.buildRoundFromClassIn(rows, roundLabel + " · 동기화 미리보기", { seq: Date.now() });
        RJReport.addRound(r); reload(); setRoundId(r.id); setSelKey(null);
      }
    }
  };
  const wipe = () => { if (confirm("저장된 모든 회차 데이터를 삭제할까요?")) { RJReport.clearStore(); rcSaveComments({}); setComments({}); reload(); setRoundId(null); setSelKey(null); } };
  const delRound = (id) => { if (confirm("이 회차를 삭제할까요?")) { RJReport.removeRound(id); const s = reload(); const rr = RJReport.sortedRounds(s); setRoundId((rr[rr.length - 1] || {}).id || null); setSelKey(null); } };

  const setComment = (key, txt) => {
    const ck = round.id + "|" + key;
    const next = { ...comments, [ck]: txt };
    setComments(next); rcSaveComments(next);
  };
  const setScore = (key, subject, newScore) => {
    if (!round) return;
    const st = round.students[key];
    if (!st) return;
    if (!st.subjects[subject]) st.subjects[subject] = { score: newScore, max: 100, pct: null, level: st.level, attempted: newScore != null };
    else { st.subjects[subject].score = newScore; st.subjects[subject].attempted = newScore != null; }
    rcRecomputeRound(round);
    RJReport.saveStore(store);
    setStore({ ...store });
  };

  const roster = round ? RJReport.rosterOf(round) : [];
  const levels = round ? Object.keys(round.subjectsByLevel) : [];
  const filtered = roster
    .filter((s) => levelFilter === "all" || s.level === levelFilter)
    .filter((s) => !query || s.name.includes(query) || (s.org || "").includes(query))
    .sort((a, b) => (a.level === b.level ? (b.avg || 0) - (a.avg || 0) : a.level.localeCompare(b.level)));

  useEffectR(() => { if (round && !selKey && filtered.length) setSelKey(filtered[0].key); }, [roundId]);

  return (
    <div>
      {area}
      {/* 업로드 */}
      <div className="ci-card ci-card-pad no-print" style={{ marginBottom: 18 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 20 }}>
          <div>
            <div
              className={"rc-drop" + (over ? " over" : "")}
              onClick={() => fileRef.current && fileRef.current.click()}
              onDragOver={(e) => { e.preventDefault(); setOver(true); }}
              onDragLeave={() => setOver(false)}
              onDrop={(e) => { e.preventDefault(); setOver(false); onFiles(e.dataTransfer.files); }}>
              <span className="ic"><Icon name="upload" size={24} /></span>
              <h4>클래스인 성적 CSV를 끌어다 놓으세요</h4>
              <p>수업(과목)별 CSV를 한꺼번에 업로드 · 이름으로 자동 분류됩니다</p>
              <input ref={fileRef} type="file" accept=".csv" multiple style={{ display: "none" }}
                onChange={(e) => onFiles(e.target.files)} />
            </div>
            {pending.length > 0 && (
              <div style={{ marginTop: 14 }}>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                  {pending.map((p, i) => (
                    <span key={i} className="rc-filechip">
                      <Icon name="check" size={11} style={{ color: "var(--ci-ok)" }} />
                      {p.subject} <span className="lv">{p.level}</span>
                      <button onClick={() => setPending(pending.filter((_, j) => j !== i))}
                        style={{ border: 0, background: "none", cursor: "pointer", color: "var(--ci-muted)", padding: 0, display: "inline-flex" }}><Icon name="close" size={11} /></button>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <label style={{ fontSize: 11.5, fontWeight: 800, color: "var(--ci-muted)", display: "block", marginBottom: 6 }}>회차 이름</label>
              <input value={roundLabel} onChange={(e) => setRoundLabel(e.target.value)}
                style={{ width: "100%", height: 40, borderRadius: 8, border: "1px solid var(--ci-line)", padding: "0 12px", fontSize: 14, fontFamily: "var(--font-kr)" }} />
            </div>
            <button className="ci-act navy" style={{ height: 42, justifyContent: "center", opacity: pending.length ? 1 : 0.5 }}
              disabled={!pending.length} onClick={commit}>
              <Icon name="check" size={14} /> {pending.length}개 파일 분류 · 회차 저장
            </button>
            <button className="ci-act" style={{ height: 42, justifyContent: "center", borderColor: "var(--ci-navy, #001D3D)", color: "var(--ci-navy, #001D3D)", fontWeight: 800 }}
              disabled={syncing} onClick={pullFromClassIn}>
              <Icon name={syncing ? "sparkle" : "refresh"} size={14} /> {syncing ? "불러오는 중…" : "클래스인에서 자동으로 불러오기"}
            </button>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="ci-act" style={{ flex: 1, justifyContent: "center" }} onClick={wipe}><Icon name="trash" size={13} /> 전체 초기화</button>
            </div>
            <p style={{ fontSize: 11.5, color: "var(--ci-muted)", lineHeight: 1.6, margin: 0 }}>
              · 같은 회차의 모든 과목 CSV를 함께 올리세요.<br />
              · 매월 새 회차로 저장하면 추이 그래프가 누적됩니다.<br />
              · <strong>자동 불러오기</strong>는 OMR 답안카드 성적을 클래스인에서 직접 받아옵니다.
            </p>
          </div>
        </div>
      </div>

      {!round ? (
        <div className="ci-card ci-card-pad no-print" style={{ textAlign: "center", padding: "56px 24px", color: "var(--ci-muted)" }}>
          <Icon name="folder" size={28} />
          <p style={{ marginTop: 12, fontWeight: 700 }}>아직 저장된 회차가 없습니다. 클래스인 성적 CSV를 업로드하거나 ‘클래스인 자동 동기화’를 눌러주세요.</p>
        </div>
      ) : (
        <>
          {/* 회차 칩 + 일괄 PDF */}
          <div className="no-print" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 14 }}>
            <div className="ci-subtabs">
              {rounds.map((r) => (
                <button key={r.id} className={"ci-subtab" + (r.id === roundId ? " active" : "")} onClick={() => { setRoundId(r.id); setSelKey(null); }}>
                  {RJReport.shortLabel(r.label)}{r.demo && <span className="badge">데모</span>}
                </button>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="ci-act" onClick={() => delRound(round.id)}><Icon name="trash" size={12} /> 회차 삭제</button>
              <button className="ci-act navy" onClick={() => print(round.id, filtered.map((s) => s.key))}>
                <Icon name="pdf" size={13} /> 전체 {filtered.length}명 PDF
              </button>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "minmax(320px, 380px) minmax(0, 1fr)", gap: 18, alignItems: "start" }}>
            {/* 학생 리스트 */}
            <div className="ci-card no-print" style={{ overflow: "hidden", position: "sticky", top: 12 }}>
              <div style={{ padding: 14, borderBottom: "1px solid var(--ci-line)", display: "grid", gap: 10 }}>
                <div style={{ position: "relative" }}>
                  <span style={{ position: "absolute", left: 11, top: 10, color: "var(--ci-muted)" }}><Icon name="search" size={15} /></span>
                  <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="이름·소속 검색"
                    style={{ width: "100%", height: 36, borderRadius: 8, border: "1px solid var(--ci-line)", padding: "0 12px 0 32px", fontSize: 13, fontFamily: "var(--font-kr)" }} />
                </div>
                <div className="ci-subtabs">
                  <button className={"ci-subtab" + (levelFilter === "all" ? " active" : "")} onClick={() => setLevelFilter("all")} style={{ padding: "6px 12px", fontSize: 12 }}>전체<span className="badge">{roster.length}</span></button>
                  {levels.map((lv) => (
                    <button key={lv} className={"ci-subtab" + (levelFilter === lv ? " active" : "")} onClick={() => setLevelFilter(lv)} style={{ padding: "6px 12px", fontSize: 12 }}>
                      {lv}<span className="badge">{roster.filter((s) => s.level === lv).length}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ maxHeight: 620, overflowY: "auto" }}>
                <div className="rc-rosterrow" style={{ cursor: "default", color: "var(--ci-muted)", fontSize: 10.5, fontWeight: 800, letterSpacing: ".05em", textTransform: "uppercase", borderTop: 0 }}>
                  <span>이름 · 소속</span><span className="hide-sm">학년/반</span><span className="r" style={{ textAlign: "right" }}>평균</span><span />
                </div>
                {filtered.map((s) => (
                  <div key={s.key} className={"rc-rosterrow" + (s.key === selKey ? " sel" : "")} onClick={() => setSelKey(s.key)}>
                    <span><strong style={{ fontWeight: 700 }}>{s.name}</strong> <span style={{ color: "var(--ci-muted)", fontSize: 12 }}>{s.org || "개인"}</span></span>
                    <span className="hide-sm">{s.level && s.level !== "기타" ? <span className="ci-badge neutral" style={{ fontSize: 10.5 }}>{s.level}</span> : <span style={{ color: "var(--ci-muted)", fontSize: 11 }}>–</span>}</span>
                    <span className="r" style={{ textAlign: "right", fontFamily: "var(--font-en)", fontWeight: 800, color: "var(--ci-navy)" }}>{s.avg != null ? s.avg : "–"}</span>
                    <span style={{ textAlign: "right", color: "var(--ci-muted)" }}><Icon name="chevron" size={14} /></span>
                  </div>
                ))}
                {!filtered.length && <div style={{ padding: 24, textAlign: "center", color: "var(--ci-muted)", fontSize: 13 }}>검색 결과가 없습니다.</div>}
              </div>
            </div>

            {/* 미리보기 */}
            <div>
              {selKey && round.students[selKey] ? (
                <>
                  <div className="no-print" style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
                    <button className="ci-act navy" onClick={() => print(round.id, [selKey])}><Icon name="download" size={13} /> 이 학생 PDF 저장</button>
                  </div>
                  <StudentReportCard round={round} store={store} studentKey={selKey}
                    comment={comments[round.id + "|" + selKey]} onComment={(t) => setComment(selKey, t)}
                    onScoreChange={(sub, sc) => setScore(selKey, sub, sc)} editable={true} />
                </>
              ) : (
                <div className="ci-card ci-card-pad" style={{ textAlign: "center", padding: "64px 24px", color: "var(--ci-muted)" }}>학생을 선택하세요.</div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ── 학생 본인 성적표 (마이페이지) ─────────────────────────────────
function ReportSelfView({ userName }) {
  const [store] = useStR(() => RJReport.loadStore());
  const [comments] = useStR(() => rcLoadComments());
  const rounds = RJReport.sortedRounds(store);
  const [roundId, setRoundId] = useStR(() => (rounds[rounds.length - 1] || {}).id || null);
  const round = rounds.find((r) => r.id === roundId) || rounds[rounds.length - 1] || null;
  const roster = round ? RJReport.rosterOf(round) : [];
  const auto = roster.find((s) => s.name === userName);
  const [selKey, setSelKey] = useStR(auto ? auto.key : (roster[0] ? roster[0].key : null));
  const { print, area } = useReportPrint(store, comments);

  if (!round) {
    return (
      <div>
        <CiHead title="월말평가 성적표" api="Report Card" sub="아직 발행된 성적표가 없습니다" />
        <div className="ci-card ci-card-pad" style={{ textAlign: "center", padding: "56px 24px", color: "var(--ci-muted)" }}>
          <Icon name="folder" size={28} />
          <p style={{ marginTop: 12, fontWeight: 700 }}>관리자가 이번 회차 성적표를 발행하면 여기에서 확인할 수 있습니다.</p>
        </div>
      </div>
    );
  }
  return (
    <div>
      {area}
      <CiHead title="월말평가 성적표" api="Report Card"
        sub="회차별 성적과 추이를 확인하고 PDF로 저장하세요"
        action={selKey && <button className="ci-act navy" onClick={() => print(round.id, [selKey])}><Icon name="download" size={13} /> PDF 저장</button>} />
      <div className="no-print" style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginBottom: 14 }}>
        <div className="ci-subtabs">
          {rounds.map((r) => (
            <button key={r.id} className={"ci-subtab" + (r.id === roundId ? " active" : "")} onClick={() => setRoundId(r.id)}>{RJReport.shortLabel(r.label)}</button>
          ))}
        </div>
        {!auto && (
          <select value={selKey || ""} onChange={(e) => setSelKey(e.target.value)}
            style={{ height: 36, borderRadius: 8, border: "1px solid var(--ci-line)", padding: "0 12px", fontSize: 13, fontFamily: "var(--font-kr)", marginLeft: "auto" }}>
            {roster.map((s) => <option key={s.key} value={s.key}>{s.name} {s.org ? "(" + s.org + ")" : ""}{s.level && s.level !== "기타" ? " · " + s.level : ""}</option>)}
          </select>
        )}
      </div>
      {selKey && round.students[selKey]
        ? <StudentReportCard round={round} store={store} studentKey={selKey} comment={comments[round.id + "|" + selKey]} editable={false} />
        : <div className="ci-card ci-card-pad" style={{ textAlign: "center", padding: 48, color: "var(--ci-muted)" }}>표시할 성적표가 없습니다.</div>}
    </div>
  );
}

Object.assign(window, { ReportManager, ReportSelfView, StudentReportCard, RJSubjectBars });
