/* global React, WEBLIVE, useApp, Icon, findInstructor */
// /weblive — public broadcast page (Broadcast / Web-Live API)
// Viewer count (Audience Info), likes (Web-Live Likes), chat (IM Chat),
// reservation. Cross-platform embeddable live page.

const { useState: useStW, useEffect: useEfW, useRef: useRfW } = React;

function WebLivePage() {
  const { navigate } = useApp();
  const wl = WEBLIVE;
  const [viewers, setViewers] = useStW(wl.viewers);
  const [likes, setLikes] = useStW(wl.likes);
  const [hearts, setHearts] = useStW([]);
  const [chat, setChat] = useStW(wl.chat);
  const [draft, setDraft] = useStW("");
  const chatRef = useRfW(null);
  const ins = findInstructor("kim-jiwon");

  useEfW(() => {
    const t = setInterval(() => {
      setViewers((v) => Math.max(2000, v + Math.round((Math.random() - 0.45) * 18)));
      setLikes((l) => l + Math.round(Math.random() * 6));
      if (Math.random() < 0.5) {
        const pool = ["좋아요 누르고 갑니다", "판서 잘 보여요", "이 부분 한 번 더요!", "감사합니다 선생님", "집중 잘 돼요", "오늘 처음 들어왔어요", "도함수 정리 최고", "복습하러 또 올게요"];
        const names = ["수험생B", "고2맘", "리뉴젠팬", "익명", "N수3년차", "예비고3"];
        setChat((c) => [...c.slice(-40), { who: names[Math.floor(Math.random() * names.length)], msg: pool[Math.floor(Math.random() * pool.length)], reward: false }]);
      }
    }, 1800);
    return () => clearInterval(t);
  }, []);

  useEfW(() => { if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight; }, [chat]);

  const sendLike = () => {
    setLikes((l) => l + 1);
    const id = Date.now() + Math.random();
    setHearts((h) => [...h, { id, x: Math.random() * 40 - 20 }]);
    setTimeout(() => setHearts((h) => h.filter((x) => x.id !== id)), 1400);
  };
  const send = () => {
    if (!draft.trim()) return;
    setChat((c) => [...c, { who: "나", msg: draft.trim(), reward: false }]);
    setDraft("");
  };

  return (
    <div className="page-enter wl-wrap">
      {/* Stage */}
      <div className="wl-stage">
        <div className="wl-video">
          <span className="wl-live-pill"><span className="dot" /> LIVE 공개방송</span>
          <span className="wl-viewers"><Icon name="eye" size={14} /> {viewers.toLocaleString()}명 시청</span>
          <div className="board">
            <div className="wl-board-grid" />
            <div style={{ position: "absolute", top: 28, left: 34, right: 34, paddingBottom: 12, borderBottom: "2px solid var(--ci-navy)", fontWeight: 900, fontSize: 17, letterSpacing: "-0.02em", color: "var(--ci-navy)" }}>
              도함수의 활용 — <span style={{ color: "var(--ci-bad)" }}>증가·감소와 극값</span>
            </div>
            <div style={{ position: "absolute", top: 92, left: 34, right: 200, display: "flex", flexDirection: "column", gap: 18, fontFamily: "'Iowan Old Style', Georgia, serif", fontSize: 26, color: "var(--ci-navy)" }}>
              <div>f<span style={{ fontStyle: "italic" }}>'</span>(x) &gt; 0 &nbsp;⟹&nbsp; f <span style={{ background: "linear-gradient(transparent 55%, rgba(255,214,10,0.55) 55%)" }}>증가</span></div>
              <div>f<span style={{ fontStyle: "italic" }}>'</span>(x) = 0 &nbsp;⟹&nbsp; <span style={{ color: "var(--ci-bad)", fontWeight: 700 }}>극값 후보</span></div>
              <div style={{ fontSize: 18, color: "var(--ci-muted)" }}>※ 부호 변화 확인 필수 — 변곡점과 구분</div>
            </div>
          </div>
          <div className="wl-cam">{ins?.initials}</div>
          {hearts.map((h) => (
            <span key={h.id} className="wl-heart" style={{ right: 60 + h.x }}><Icon name="heart" size={26} /></span>
          ))}
        </div>
        <div className="wl-meta">
          <button className="ci-act" style={{ height: 40, background: "rgba(255,255,255,0.1)", color: "#fff", borderColor: "rgba(255,255,255,0.18)" }} onClick={() => navigate("/")}><Icon name="arrowLeft" size={14} /> 나가기</button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1>{wl.title}</h1>
            <div className="by">{wl.instructor} 강사 · {wl.classId} · HLS · RTMP · FLV 송출</div>
          </div>
          <button className="wl-share" onClick={() => navigate("/")}><Icon name="share" size={15} /> 공유</button>
          <button className="wl-like" onClick={sendLike}><Icon name="heart" size={16} /> 좋아요 {likes.toLocaleString()}</button>
        </div>
      </div>

      {/* Side: stats + chat */}
      <div className="wl-side">
        <div className="wl-side-head">
          <strong style={{ fontSize: 14, fontWeight: 800 }}>실시간 채팅</strong>
          <span className="ci-badge ok" style={{ background: "rgba(30,138,91,0.2)", color: "#6EE7A8" }}><Icon name="signal" size={11} /> LIVE</span>
        </div>
        <div className="wl-stat-row">
          <div className="wl-stat"><div className="n">{viewers.toLocaleString()}</div><div className="l">현재 시청</div></div>
          <div className="wl-stat"><div className="n">{wl.peak.toLocaleString()}</div><div className="l">최고 동시</div></div>
          <div className="wl-stat"><div className="n">{likes.toLocaleString()}</div><div className="l">좋아요</div></div>
          <div className="wl-stat"><div className="n">{wl.reserved.toLocaleString()}</div><div className="l">예약자</div></div>
        </div>
        <div className="wl-chat" ref={chatRef}>
          {chat.map((m, i) => (
            <div key={i} className={"wl-msg" + (m.reward ? " reward" : "")}><b>{m.who}</b><span>{m.msg}</span></div>
          ))}
        </div>
        <div className="wl-chat-bar">
          <input className="wl-chat-input" placeholder="채팅에 참여하세요…" value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} />
          <button className="wl-chat-send" onClick={send}>전송</button>
        </div>
      </div>
    </div>
  );
}

window.WebLivePage = WebLivePage;
