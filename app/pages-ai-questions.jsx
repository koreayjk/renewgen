/* global React, Icon, useApp */
// ──────────────────────────────────────────────────────────────────
//  AI 문제 생성 (시험 출제 보조) — 선생님/관리자 전용
//   · 학년·과목·단원·유형으로, 또는 줄글 설명으로 문제+정답+해설 자동 생성
//   · 1회 최대 50문항 (내부적으로 4문항씩 나눠 호출 → 출력 한도 회피)
//   · 생성 후 "실제 사용량·예상 비용"을 선생님에게 표시
//   · 비용 보호: 하루 생성 횟수 상한 · 생성 중 잠금
// ──────────────────────────────────────────────────────────────────
const { useState: useStAi } = React;

const AI_DAILY_LIMIT = 15;          // 하루 최대 "출제" 클릭 횟수
const AI_MAX_PER_GEN = 50;          // 1회 최대 문항 수
const AI_BATCH = 3;                 // 내부 1회 호출당 문항 수 (출력 1024토큰 한도 대응)

// Claude Haiku 4.5 표준 요금 (per token)
const HAIKU_IN = 1 / 1e6;           // $1 / 1M input
const HAIKU_OUT = 5 / 1e6;          // $5 / 1M output
const USD_KRW = 1380;               // 환율(대략)
const estTok = (s) => Math.ceil((s || "").length * 1.3);   // 한국어 혼합 추정치(약간 보수적)

function aiUsage() {
  const today = new Date().toISOString().slice(0, 10);
  let s; try { s = JSON.parse(localStorage.getItem("rj_ai_gen_usage") || "{}"); } catch (e) { s = {}; }
  if (s.date !== today) s = { date: today, count: 0, krw: 0 };
  if (s.krw == null) s.krw = 0;
  return s;
}
function aiBump(krw, userId) {
  const s = aiUsage(); s.count += 1; s.krw += (krw || 0);
  try { localStorage.setItem("rj_ai_gen_usage", JSON.stringify(s)); } catch (e) {}
  if (userId && window.rjPushAiUsage) window.rjPushAiUsage(userId, s.date, s.count, s.krw).catch(() => {});
  return s;
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const AI_GRADES = ["중1", "중2", "중3", "고1", "고2", "고3", "N수생"];
const AI_SUBJECTS = [["수학", "math"], ["국어", "korean"], ["영어", "english"], ["사회", "social"], ["과학", "science"], ["한국사", "history"]];
const AI_TYPES = [["mc", "객관식(5지선다)"], ["short", "단답형"], ["ox", "OX"], ["essay", "서술형"]];
const AI_COUNTS = [5, 10, 20, 30, 40, 50];

function AIQuestionGen({ onAdd, defaultSubject }) {
  const { showToast, user } = useApp();
  const [open, setOpen] = useStAi(false);
  const [grade, setGrade] = useStAi("고2");
  const [subject, setSubject] = useStAi(() => {
    const hit = AI_SUBJECTS.find(([, id]) => id === defaultSubject);
    return hit ? hit[0] : "수학";
  });
  const [unit, setUnit] = useStAi("");
  const [type, setType] = useStAi("mc");
  const [count, setCount] = useStAi(10);
  const [points, setPoints] = useStAi(20);
  const [mode, setMode] = useStAi("simple");   // simple | prose
  const [prose, setProse] = useStAi("");
  const [busy, setBusy] = useStAi(false);
  const [progress, setProgress] = useStAi({ done: 0, total: 0 });
  const [lastRun, setLastRun] = useStAi(null);  // { questions, calls, inTok, outTok, usd, krw }
  const [usage, setUsage] = useStAi(() => aiUsage());
  const remaining = Math.max(0, AI_DAILY_LIMIT - usage.count);

  // 클라우드(Supabase)에서 오늘 사용량 동기화 → 기기 바꿔도 하루 한도가 유지됨
  React.useEffect(() => {
    let alive = true;
    if (user && user.id && window.rjSyncAiUsageFromCloud) {
      window.rjSyncAiUsageFromCloud(user.id).then((r) => { if (alive && r && r.ok && r.usage) setUsage(r.usage); }).catch(() => {});
    }
    return () => { alive = false; };
  }, [user && user.id]);

  const typeKo = (AI_TYPES.find(([k]) => k === type) || [])[1] || "객관식";
  const schemaFor = () => type === "mc"
    ? `{"stem":"문제","choices":["보기1","보기2","보기3","보기4","보기5"],"answer":정답index(0~4),"explanation":"해설"}`
    : type === "ox"
    ? `{"stem":"참/거짓 진술","answer":true 또는 false,"explanation":"해설"}`
    : type === "short"
    ? `{"stem":"문제","answer":"정답(짧게)","explanation":"해설"}`
    : `{"stem":"서술형 문제","answer":"모범답안","explanation":"채점 기준"}`;

  const buildPrompt = (need, already) => {
    const brief = mode === "prose"
      ? `선생님의 요청: "${prose.trim()}"\n이 요청을 종합해 ${typeKo} 문제 ${need}개를 만드세요. 요청에 학년·난이도·소재가 있으면 충실히 반영하세요.`
      : `한국 ${grade} ${subject} 교과, 단원/주제 "${unit.trim()}"에 대한 ${typeKo} 문제 ${need}개를 만드세요. 난이도는 ${grade} 교과 수준에 맞춥니다.`;
    const variety = already > 0 ? `\n이미 ${already}문항을 만들었습니다. 그와 겹치지 않는 새로운 문제로, 소재·유형을 다양하게 출제하세요.` : `\n서로 겹치지 않게 다양하게 출제하세요.`;
    return `당신은 한국 중·고등 출제 교사입니다.\n${brief}${variety}\n정확하고 검증된 내용으로, 한국어로 작성하세요. 해설(explanation)은 1~2문장으로 짧게 쓰세요.\n오직 아래 형식의 JSON 배열만 출력하세요(설명·마크다운·코드펜스 금지):\n[${schemaFor()}]`;
  };

  const toItem = (q) => {
    const id = "q" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
    const pts = Math.max(1, Number(points) || 20);
    const base = { id, type, stem: q.stem || "", points: pts, unit: mode === "prose" ? (unit.trim() || "AI 생성") : unit.trim(), explanation: q.explanation || "" };
    if (type === "mc") { base.choices = (q.choices || []).slice(0, 5); while (base.choices.length < 5) base.choices.push(""); base.answer = Number(q.answer) || 0; }
    else if (type === "ox") base.answer = q.answer === true || q.answer === "true";
    else base.answer = q.answer || "";
    return base;
  };

  const generate = async () => {
    if (busy) return;
    if (mode === "simple" && !unit.trim()) { showToast && showToast("단원·주제를 입력하세요 (예: 미분, 도함수의 활용)"); return; }
    if (mode === "prose" && prose.trim().length < 5) { showToast && showToast("만들 문제를 설명해주세요"); return; }
    if (remaining <= 0) { showToast && showToast("오늘 생성 횟수를 모두 사용했습니다 (하루 " + AI_DAILY_LIMIT + "회)"); return; }
    if (!(window.claude && window.claude.complete)) { showToast && showToast("AI 생성은 실제 배포 환경에서 작동합니다 (API 연결 필요)"); return; }

    const n = Math.min(AI_MAX_PER_GEN, Math.max(1, Number(count) || 1));
    setBusy(true); setLastRun(null); setProgress({ done: 0, total: n });

    let collected = [];
    let calls = 0, inChars = 0, outChars = 0, fails = 0;
    const maxCalls = Math.ceil(n / AI_BATCH) + 3;   // 안전 상한

    while (collected.length < n && calls < maxCalls) {
      const need = Math.min(AI_BATCH, n - collected.length);
      const prompt = buildPrompt(need, collected.length);
      try {
        const raw = await window.claude.complete({ messages: [{ role: "user", content: prompt }] });
        calls += 1; inChars += prompt.length; outChars += (raw || "").length;
        const parsed = parseAIQuestions(raw, type);
        if (!parsed.length) { fails += 1; if (fails >= 2) break; }
        else { collected = collected.concat(parsed.slice(0, need).map(toItem)); setProgress({ done: Math.min(collected.length, n), total: n }); }
      } catch (e) { fails += 1; if (fails >= 2) break; }
      if (collected.length < n && calls < maxCalls) await sleep(350);
    }

    setBusy(false); setProgress({ done: 0, total: 0 });
    if (collected.length === 0) { showToast && showToast("생성에 실패했습니다. 잠시 후 다시 시도해주세요"); return; }

    onAdd(collected);
    const inTok = estTok(" ".repeat(inChars)), outTok = estTok(" ".repeat(outChars));
    const usd = inTok * HAIKU_IN + outTok * HAIKU_OUT;
    const krw = usd * USD_KRW;
    setLastRun({ questions: collected.length, calls, inTok, outTok, usd, krw, short: collected.length < n });
    const u = aiBump(krw, user && user.id); setUsage(u);
    showToast && showToast(collected.length + "개 문항을 생성했습니다 · 예상 비용 약 ₩" + Math.round(krw));
  };

  const inSt = { height: 38, borderRadius: 8, border: "1px solid var(--ci-line)", padding: "0 10px", fontSize: 14, fontFamily: "var(--font-kr)", background: "var(--ci-paper)" };
  const labSt = { display: "block", fontSize: 11, fontWeight: 800, color: "var(--ci-muted)", marginBottom: 5 };
  const wonFmt = (v) => v < 1 ? "0.1" : Math.round(v).toLocaleString();

  return (
    <div className="ci-card" style={{ marginTop: 12, overflow: "hidden", border: "1.5px solid var(--ci-navy)" }}>
      <button onClick={() => setOpen((v) => !v)} style={{ width: "100%", textAlign: "left", cursor: "pointer", border: 0, background: "var(--ci-navy)", color: "#fff", padding: "13px 16px", display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ width: 28, height: 28, borderRadius: 7, background: "var(--ci-yellow)", color: "var(--ci-navy)", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Icon name="sparkles" size={15} /></span>
        <span style={{ fontWeight: 900, fontSize: 15 }}>AI 문제 생성</span>
        <span style={{ fontSize: 11.5, opacity: 0.7 }}>학년·단원 또는 줄글 설명으로 문제·정답·해설을 자동 생성</span>
        <span style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10 }}>
          <span className="ci-badge" style={{ background: "rgba(255,255,255,0.16)", color: "#fff", fontSize: 10 }}>오늘 {remaining}/{AI_DAILY_LIMIT}회</span>
          <Icon name={open ? "chevronUp" : "chevronDown"} size={16} />
        </span>
      </button>

      {open && (
        <div style={{ padding: 16, background: "var(--ci-bg)" }}>
          {/* 모드 토글 */}
          <div style={{ display: "flex", gap: 6, marginBottom: 14, background: "var(--ci-bg-2)", borderRadius: 9, padding: 4 }}>
            {[["simple", "간편 설정"], ["prose", "직접 설명"]].map(([k, ko]) => (
              <button key={k} onClick={() => setMode(k)} style={{
                flex: 1, height: 34, borderRadius: 7, cursor: "pointer", fontWeight: 800, fontSize: 13, border: 0,
                background: mode === k ? "var(--ci-navy)" : "transparent", color: mode === k ? "#fff" : "var(--ci-muted)",
              }}>{ko}</button>
            ))}
          </div>

          {mode === "simple" ? (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10, marginBottom: 10 }}>
                <div><label style={labSt}>학년</label><select value={grade} onChange={(e) => setGrade(e.target.value)} style={{ ...inSt, width: "100%" }}>{AI_GRADES.map((g) => <option key={g}>{g}</option>)}</select></div>
                <div><label style={labSt}>과목</label><select value={subject} onChange={(e) => setSubject(e.target.value)} style={{ ...inSt, width: "100%" }}>{AI_SUBJECTS.map(([ko]) => <option key={ko}>{ko}</option>)}</select></div>
              </div>
              <div style={{ marginBottom: 10 }}>
                <label style={labSt}>단원 · 주제</label>
                <input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="예: 미분 — 도함수의 활용 / 비문학 독해 / 관계대명사" style={{ ...inSt, width: "100%" }} />
              </div>
            </>
          ) : (
            <div style={{ marginBottom: 12 }}>
              <label style={labSt}>어떤 문제를 원하시나요? <span style={{ fontWeight: 500 }}>· 자유롭게 설명</span></label>
              <textarea value={prose} onChange={(e) => setProse(e.target.value)} rows={4}
                placeholder={"예) 고2 미적분 도함수의 활용 단원에서, 실생활 최적화(넓이·부피 최대) 소재로 상위권 난이도 객관식을 만들어줘. 계산이 너무 복잡하지 않게.\n\n예) 중3 영어 관계대명사와 분사구문을 섞어서, 어법상 틀린 부분 찾기 유형으로."}
                style={{ width: "100%", borderRadius: 8, border: "1px solid var(--ci-line)", padding: 12, fontSize: 14, fontFamily: "var(--font-kr)", lineHeight: 1.6, resize: "vertical", background: "var(--ci-paper)" }} />
              <input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="단원 라벨 (선택)" style={{ ...inSt, width: "100%", marginTop: 8 }} />
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr", gap: 10, marginBottom: 14 }}>
            <div><label style={labSt}>유형</label><select value={type} onChange={(e) => setType(e.target.value)} style={{ ...inSt, width: "100%" }}>{AI_TYPES.map(([k, ko]) => <option key={k} value={k}>{ko}</option>)}</select></div>
            <div><label style={labSt}>문항 수 <span style={{ fontWeight: 500 }}>(최대 {AI_MAX_PER_GEN})</span></label>
              <select value={count} onChange={(e) => setCount(Number(e.target.value))} style={{ ...inSt, width: "100%" }}>{AI_COUNTS.map((n) => <option key={n} value={n}>{n}개</option>)}</select></div>
            <div><label style={labSt}>문항 배점</label><input type="number" value={points} onChange={(e) => setPoints(e.target.value)} style={{ ...inSt, width: "100%" }} /></div>
          </div>

          <button className="ci-act navy" style={{ width: "100%", height: 46, justifyContent: "center", opacity: busy || remaining <= 0 ? 0.7 : 1 }} onClick={generate} disabled={busy || remaining <= 0}>
            {busy ? <><span className="ai-spin" style={{ display: "inline-block", width: 14, height: 14, border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "#fff", borderRadius: "50%" }} /> 생성 중… {progress.total ? `(${progress.done}/${progress.total})` : ""}</>
              : remaining <= 0 ? "오늘 생성 횟수 소진"
              : <><Icon name="sparkles" size={14} /> AI로 {count}문항 생성</>}
          </button>
          {busy && progress.total > 0 && (
            <div style={{ marginTop: 10, height: 7, background: "var(--ci-bg-2)", borderRadius: 4, overflow: "hidden" }}>
              <div style={{ height: "100%", width: Math.round((progress.done / progress.total) * 100) + "%", background: "var(--ci-navy)", transition: "width .3s" }} />
            </div>
          )}

          {/* 생성 결과 · 실제 비용 */}
          {lastRun && !busy && (
            <div style={{ marginTop: 12, padding: "14px 16px", background: "var(--ci-paper)", border: "1.5px solid var(--ci-ok)", borderRadius: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <Icon name="check" size={15} className="" style={{ color: "var(--ci-ok)" }} />
                <strong style={{ fontWeight: 900, fontSize: 14.5 }}>{lastRun.questions}문항 생성 완료</strong>
                {lastRun.short && <span className="ci-badge warn" style={{ fontSize: 10 }}>일부만 생성됨 · 다시 시도 가능</span>}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
                <CostCell k="이번 예상 비용" v={"₩" + wonFmt(lastRun.krw)} hi />
                <CostCell k="API 호출" v={lastRun.calls + "회"} />
                <CostCell k="토큰(추정)" v={(lastRun.inTok + lastRun.outTok).toLocaleString()} sub={"입력 " + lastRun.inTok.toLocaleString() + " · 출력 " + lastRun.outTok.toLocaleString()} />
              </div>
              <div style={{ marginTop: 10, fontSize: 11.5, color: "var(--ci-muted)", lineHeight: 1.6 }}>
                · Claude Haiku 4.5 표준 요금(입력 $1·출력 $5 / 100만 토큰, 환율 ₩{USD_KRW}) 기준 <strong>추정치</strong>입니다. 실제 청구는 API 대시보드 기준.<br />
                · <strong>오늘 누적 예상 비용 약 ₩{wonFmt(usage.krw)}</strong> · 오늘 {remaining}회 생성 가능
              </div>
            </div>
          )}

          <p style={{ fontSize: 11.5, color: "var(--ci-muted)", margin: "12px 0 0", lineHeight: 1.6 }}>
            · 생성된 문제는 아래 목록에 추가되며 <strong>자유롭게 편집·삭제</strong>할 수 있습니다 · 정답·해설을 꼭 검토하세요.<br />
            · 50문항은 내부적으로 {AI_BATCH}문항씩 나눠 생성되어 1~2분 걸릴 수 있습니다 · 하루 {AI_DAILY_LIMIT}회로 제한됩니다.
          </p>
          <style>{`@keyframes aispin{to{transform:rotate(360deg)}} .ai-spin{animation:aispin .7s linear infinite;vertical-align:middle;margin-right:6px;}`}</style>
        </div>
      )}
    </div>
  );
}

function CostCell({ k, v, sub, hi }) {
  return (
    <div style={{ background: hi ? "rgba(31,138,91,0.08)" : "var(--ci-bg-2)", borderRadius: 8, padding: "10px 12px" }}>
      <div style={{ fontSize: 10.5, color: "var(--ci-muted)", fontWeight: 700 }}>{k}</div>
      <div style={{ fontWeight: 900, fontSize: hi ? 20 : 16, marginTop: 2, color: hi ? "var(--ci-ok)" : "var(--ci-ink)" }}>{v}</div>
      {sub && <div style={{ fontSize: 10, color: "var(--ci-muted)", marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

// AI 응답에서 JSON 배열 안전 추출 (잘린 응답에서도 완성된 객체만 복구)
function parseAIQuestions(raw, type) {
  if (!raw) return [];
  let txt = String(raw).trim().replace(/```json/gi, "").replace(/```/g, "").trim();
  const norm = (q) => ({
    stem: q.stem || q.question || "",
    choices: q.choices || q.options || [],
    answer: q.answer,
    explanation: q.explanation || q.solution || "",
  });
  // 1) 정상 파싱 시도
  let body = txt;
  const s = txt.indexOf("["), e = txt.lastIndexOf("]");
  if (s !== -1 && e !== -1 && e > s) body = txt.slice(s, e + 1);
  try {
    let arr = JSON.parse(body);
    if (!Array.isArray(arr)) arr = [arr];
    const ok = arr.filter((q) => q && (q.stem || q.question));
    if (ok.length) return ok.map(norm);
  } catch (err) { /* 잘린 응답 → 아래 복구 */ }
  // 2) 복구: 최상위 {...} 객체를 균형 괄호로 하나씩 추출
  const objs = [];
  const start = txt.indexOf("[");
  let i = start === -1 ? 0 : start + 1;
  while (i < txt.length) {
    if (txt[i] !== "{") { i++; continue; }
    let depth = 0, inStr = false, esc = false, j = i;
    for (; j < txt.length; j++) {
      const c = txt[j];
      if (esc) { esc = false; continue; }
      if (c === "\\") { esc = true; continue; }
      if (c === '"') inStr = !inStr;
      else if (!inStr && c === "{") depth++;
      else if (!inStr && c === "}") { depth--; if (depth === 0) { j++; break; } }
    }
    if (depth === 0) {
      try { const o = JSON.parse(txt.slice(i, j)); if (o && (o.stem || o.question)) objs.push(norm(o)); } catch (e2) {}
      i = j;
    } else break;   // 마지막 객체가 잘림 → 중단
  }
  return objs;
}

Object.assign(window, { AIQuestionGen });
