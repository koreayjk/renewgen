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

// 자동 코멘트 (관리자가 비워두면 점수 기반 기본 문구)
function rcAutoComment(st, delta) {
  const subs = Object.entries(st.subjects).filter(([, v]) => v.score != null);
  if (!subs.length) return "이번 회차 응시 기록이 없습니다.";
  const sorted = subs.slice().sort((a, b) => b[1].score - a[1].score);
  const best = sorted[0], weak = sorted[sorted.length - 1];
  let s = `${best[0]} 과목이 ${best[1].score}점으로 가장 안정적입니다.`;
  if (weak[0] !== best[0]) s += ` ${weak[0]}(${weak[1].score}점)은 다음 회차 집중 보완을 권합니다.`;
  if (delta != null) {
    if (delta > 1.5) s += ` 전월 대비 평균이 ${delta.toFixed(1)}점 상승했습니다. 좋은 흐름을 이어가세요.`;
    else if (delta < -1.5) s += ` 전월 대비 평균이 ${Math.abs(delta).toFixed(1)}점 하락했습니다. 학습 리듬을 점검해봅시다.`;
    else s += ` 전월 대비 평균을 안정적으로 유지하고 있습니다.`;
  }
  return s;
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
function StudentReportCard({ round, store, studentKey, comment, onComment, editable }) {
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

  const cText = (comment != null && comment !== "") ? comment : rcAutoComment(st, delta);
  const showLevel = st.level && st.level !== "기타";
  const issueDate = rcFmtDate(round.createdAt);
  const barRounds = trend.map((t) => ({ label: t.shortLabel + " 월말평가", scores: t.subjects }));

  return (
    <div className="rc-sheet">
      <div className="rc-sheet-head">
        <div className="rc-brand">
          <span className="mark">R</span>
          <div className="rc-brand-tx">
            <div className="nm">리뉴젠 아카데미</div>
            <div className="en">Re:newgen Academy</div>
          </div>
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

      <div className="rc-comment">
        <div className="lab"><Icon name="edit" size={13} /> 담임 총평 · Comment</div>
        {editable ? (
          <textarea value={comment != null ? comment : ""} placeholder={rcAutoComment(st, delta)}
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
              <button className="ci-act" style={{ flex: 1, justifyContent: "center" }} onClick={loadDemo}><Icon name="sparkle" size={13} /> 데모 데이터</button>
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
          <p style={{ marginTop: 12, fontWeight: 700 }}>아직 저장된 회차가 없습니다. CSV를 업로드하거나 데모 데이터를 불러오세요.</p>
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
                    comment={comments[round.id + "|" + selKey]} onComment={(t) => setComment(selKey, t)} editable={true} />
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
