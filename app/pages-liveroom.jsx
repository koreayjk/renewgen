/* global React, COURSES, useApp, Icon, findInstructor, findCourse */

// ════════════════════════════════════════════════════════════════════
//   LiveRoom — in-site live classroom (replaces ClassIn handoff)
//   Whiteboard + instructor cam + chat + Q&A + students roster
// ════════════════════════════════════════════════════════════════════

const { useState: useStateLR, useEffect: useEffectLR, useRef: useRefLR } = React;

const INITIAL_CHATS = [
  { id: 1, name: "은비", initials: "은", msg: "안녕하세요!", t: "20:00", role: "student" },
  { id: 2, name: "민재", initials: "민", msg: "오늘 도함수 활용 맞나요?", t: "20:01", role: "student" },
  { id: 3, name: "김지원 강사님", initials: "지", msg: "네, 맞아요. 시작할게요 :)", t: "20:01", role: "instructor" },
  { id: 4, name: "수아", initials: "수", msg: "선생님 오늘 자료 어디서 받나요?", t: "20:02", role: "student" },
  { id: 5, name: "김지원 강사님", initials: "지", msg: "오른쪽 [자료] 버튼에 PDF 올려뒀어요.", t: "20:02", role: "instructor" },
  { id: 6, name: "도윤", initials: "도", msg: "감사합니다 ㅎㅎ", t: "20:03", role: "me" },
  { id: 7, name: "현우", initials: "현", msg: "혹시 풀이 조금만 천천히 부탁드려요..!", t: "20:08", role: "student" },
  { id: 8, name: "김지원 강사님", initials: "지", msg: "넵, 예제 2부터는 천천히 갈게요.", t: "20:09", role: "instructor" },
  { id: 9, name: "지유", initials: "지", msg: "오 이해됨", t: "20:11", role: "student" },
  { id: 10, name: "민재", initials: "민", msg: "f'(x) = 3x² - 3 이 부분 다시요!!", t: "20:12", role: "student" },
  { id: 11, name: "김지원 강사님", initials: "지", msg: "민재 학생, 지금 오른쪽 판서에 다시 표시했어요. 보이죠?", t: "20:13", role: "instructor" },
];

const INITIAL_QUESTIONS = [
  { id: 1, name: "수아", q: "극값 판정에서 부호 변화만 보면 되나요? 이계도함수는 안 써도 되는지 궁금합니다.", votes: 14, t: "5분 전", answered: false },
  { id: 2, name: "민재", q: "예제 1에서 분모가 0이 될 때는 어떻게 처리해야 하나요?", votes: 8, t: "8분 전", answered: true },
  { id: 3, name: "현우", q: "롤의 정리랑 평균값 정리 차이가 정확히 뭔가요?", votes: 5, t: "방금", answered: false },
  { id: 4, name: "은비", q: "오늘 첨삭 과제 마감 언제까지인지...?", votes: 3, t: "12분 전", answered: false },
];

const STUDENTS = [
  { name: "김지원 강사님", initials: "지", camera: true, mic: true, isInstructor: true },
  { name: "도윤", initials: "도", camera: false, mic: false, isMe: true },
  { name: "은비", initials: "은", camera: true, mic: false, raised: false },
  { name: "민재", initials: "민", camera: true, mic: false, raised: false },
  { name: "수아", initials: "수", camera: false, mic: false, raised: true },
  { name: "현우", initials: "현", camera: false, mic: false, raised: false },
  { name: "지유", initials: "지", camera: false, mic: false, raised: false },
  { name: "예린", initials: "예", camera: false, mic: false, raised: false },
  { name: "태우", initials: "태", camera: false, mic: false, raised: false },
  { name: "서연", initials: "서", camera: true, mic: false, raised: false },
];

// Simulated "live" chats that drip in over time
const DRIP_CHATS = [
  { name: "예린", initials: "예", msg: "선생님 화이트보드 빨간색 너무 잘 보여요 👍", role: "student" },
  { name: "태우", initials: "태", msg: "예제 3 풀이가 핵심인 것 같아요", role: "student" },
  { name: "김지원 강사님", initials: "지", msg: "맞아요, 예제 3은 필수예요. 노트해두세요.", role: "instructor" },
  { name: "서연", initials: "서", msg: "이거 시험에 나올까요?", role: "student" },
];

function LiveRoom({ course, onEnd }) {
  const { tweaks, navigate, showToast } = useApp();
  const ins = findInstructor(course.instructor);
  const layout = tweaks.liveLayout || "split";

  const [tab, setTab] = useStateLR("chat");
  const [chats, setChats] = useStateLR(INITIAL_CHATS);
  const [chatInput, setChatInput] = useStateLR("");
  const [questions, setQuestions] = useStateLR(INITIAL_QUESTIONS);
  const [voted, setVoted] = useStateLR({});
  const [mic, setMic] = useStateLR(false);
  const [cam, setCam] = useStateLR(false);
  const [handRaised, setHandRaised] = useStateLR(false);
  const [showAskModal, setShowAskModal] = useStateLR(false);
  const [askText, setAskText] = useStateLR("");
  const [elapsedS, setElapsedS] = useStateLR(13 * 60 + 47); // started 13:47 ago
  const chatScrollRef = useRefLR(null);

  // Elapsed timer
  useEffectLR(() => {
    const t = setInterval(() => setElapsedS((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, []);

  // Drip in simulated chat
  useEffectLR(() => {
    let i = 0;
    const t = setInterval(() => {
      if (i >= DRIP_CHATS.length) { clearInterval(t); return; }
      const c = DRIP_CHATS[i++];
      const now = new Date();
      const t2 = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
      setChats((prev) => [...prev, { id: Date.now() + i, ...c, t: t2 }]);
    }, 14000);
    return () => clearInterval(t);
  }, []);

  // Auto-scroll chat
  useEffectLR(() => {
    if (chatScrollRef.current) chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
  }, [chats]);

  const sendChat = () => {
    const text = chatInput.trim();
    if (!text) return;
    const now = new Date();
    const t = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    setChats((prev) => [...prev, { id: Date.now(), name: "도윤", initials: "도", msg: text, t, role: "me" }]);
    setChatInput("");
  };

  const vote = (id) => {
    if (voted[id]) return;
    setVoted((v) => ({ ...v, [id]: true }));
    setQuestions((qs) => qs.map((q) => q.id === id ? { ...q, votes: q.votes + 1 } : q));
  };

  const submitQuestion = () => {
    const text = askText.trim();
    if (!text) return;
    setQuestions((qs) => [...qs, { id: Date.now(), name: "도윤", q: text, votes: 1, t: "방금", answered: false }]);
    setVoted((v) => ({ ...v, [Date.now()]: true }));
    setAskText("");
    setShowAskModal(false);
    setTab("qa");
    showToast("질문이 등록되었습니다");
  };

  const fmt = (s) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return h > 0
      ? `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`
      : `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  const sidePanel = (
    <div className="lr-side">
      <div className="lr-tabs">
        <button className={"lr-tab" + (tab === "chat" ? " active" : "")} onClick={() => setTab("chat")}>
          채팅 <span className="lr-tab-count">{chats.length}</span>
        </button>
        <button className={"lr-tab" + (tab === "qa" ? " active" : "")} onClick={() => setTab("qa")}>
          질문 <span className="lr-tab-count">{questions.filter((q) => !q.answered).length}</span>
        </button>
        <button className={"lr-tab" + (tab === "students" ? " active" : "")} onClick={() => setTab("students")}>
          학생 <span className="lr-tab-count">192</span>
        </button>
      </div>
      <div className="lr-panel">
        {tab === "chat"     && <ChatPanel chats={chats} chatInput={chatInput} setChatInput={setChatInput} sendChat={sendChat} scrollRef={chatScrollRef} />}
        {tab === "qa"       && <QAPanel questions={questions} voted={voted} vote={vote} onAsk={() => setShowAskModal(true)} />}
        {tab === "students" && <StudentsPanel />}
      </div>
    </div>
  );

  const stackedPanels = (
    <div className="lr-side">
      <div className="lr-stacked-panels">
        <div>
          <div className="lr-tabs"><div className="lr-tab active" style={{ pointerEvents: "none" }}>채팅 <span className="lr-tab-count">{chats.length}</span></div></div>
          <ChatPanel chats={chats} chatInput={chatInput} setChatInput={setChatInput} sendChat={sendChat} scrollRef={chatScrollRef} />
        </div>
        <div>
          <div className="lr-tabs"><div className="lr-tab active" style={{ pointerEvents: "none" }}>질문 <span className="lr-tab-count">{questions.filter((q) => !q.answered).length}</span></div></div>
          <QAPanel questions={questions} voted={voted} vote={vote} onAsk={() => setShowAskModal(true)} />
        </div>
      </div>
    </div>
  );

  return (
    <div className="liveroom page-enter">
      {/* Top bar */}
      <div className="lr-top">
        <div className="lr-top-title">
          <span className="lr-live-pill">LIVE</span>
          <span className="lr-title">{course.title}</span>
          <span className="lr-sub">{ins?.name} · {course.level}</span>
        </div>
        <div className="lr-top-meta">
          <span>경과 <b>{fmt(elapsedS)}</b></span>
          <span style={{ width: 1, height: 16, background: "rgba(255,255,255,0.18)" }} />
          <span>접속 <b>192</b>명</span>
          <span style={{ width: 1, height: 16, background: "rgba(255,255,255,0.18)" }} />
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#2ECC71" }} />
            <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 12 }}>녹화 중</span>
          </span>
        </div>
        <button className="lr-leave" onClick={onEnd}>
          <Icon name="close" size={14} /> 나가기
        </button>
      </div>

      {/* Main area */}
      <div className="lr-main" data-layout={layout}>
        {/* Stage */}
        <div className="lr-stage">
          <div className="lr-stage-inner">
            <Whiteboard />
            <InstructorCam ins={ins} micOn={true} />
          </div>

          {/* Tool dock */}
          <div className="lr-dock">
            <button className={"lr-tool" + (mic ? " active" : " off")} onClick={() => setMic((m) => !m)}>
              <Icon name="mic" size={18} />
              <span>{mic ? "마이크 켜짐" : "음소거"}</span>
            </button>
            <button className={"lr-tool" + (cam ? " active" : " off")} onClick={() => setCam((c) => !c)}>
              <Icon name="eye" size={18} />
              <span>{cam ? "카메라 ON" : "카메라 OFF"}</span>
            </button>
            <button className={"lr-tool" + (handRaised ? " active" : "")} onClick={() => { setHandRaised((h) => !h); showToast(handRaised ? "손을 내렸습니다" : "손을 들었습니다 — 강사님께 알림 전송"); }}>
              <HandIcon />
              <span>손들기</span>
            </button>
            <div className="lr-tool-sep" />
            <button className="lr-tool" onClick={() => setShowAskModal(true)}>
              <Icon name="chat" size={18} />
              <span>질문 작성</span>
            </button>
            <button className="lr-tool" onClick={() => showToast("자료 PDF가 새 탭에서 열렸습니다")}>
              <Icon name="pdf" size={18} />
              <span>강의 자료</span>
            </button>
            <button className="lr-tool" onClick={() => showToast("화면 캡처가 노트에 저장되었습니다")}>
              <Icon name="bookmark" size={18} />
              <span>판서 캡처</span>
            </button>
          </div>
        </div>

        {layout === "split" ? sidePanel : stackedPanels}
      </div>

      {/* Ask modal */}
      {showAskModal && (
        <div className="modal-backdrop" onClick={() => setShowAskModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 540 }}>
            <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 6, letterSpacing: "-0.025em" }}>강사님께 질문하기</div>
            <div style={{ fontSize: 13, color: "var(--acad-muted)", marginBottom: 16 }}>
              질문은 [질문] 탭에 등록되고, 다른 학생들의 추천을 받으면 우선으로 답변됩니다.
            </div>
            <textarea
              value={askText}
              onChange={(e) => setAskText(e.target.value)}
              placeholder="예) 극값을 판정할 때 이계도함수도 같이 봐야 하나요?"
              style={{
                width: "100%", minHeight: 120,
                background: "#fff",
                border: "1.5px solid var(--acad-line)",
                borderRadius: 6,
                padding: 12, fontSize: 14, lineHeight: 1.5,
                outline: "none", resize: "vertical",
                fontFamily: "inherit",
              }}
            />
            <div style={{ display: "flex", gap: 8, marginTop: 16, justifyContent: "flex-end" }}>
              <button className="btn btn-ghost" onClick={() => setShowAskModal(false)}>취소</button>
              <button className="btn btn-primary" onClick={submitQuestion}>질문 등록</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Whiteboard ─────────────────────────────────────────────────────
function Whiteboard() {
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <div className="lr-board" />
      <div className="lr-board-title">
        <span className="lr-tag">LESSON 03</span>
        <span>도함수의 활용 — <em>극값과 부호의 변화</em></span>
        <small>2026.05.21 (목) 20:00 · 라이브</small>
      </div>
      <div className="lr-board-content">
        <div className="lr-eq">
          <em>f</em>(<em>x</em>) = <em>x</em>³ − 3<em>x</em> + 2
        </div>
        <div className="lr-eq">
          <em>f</em>′(<em>x</em>) = 3<em>x</em>² − 3 = <span className="red">3(<em>x</em> − 1)(<em>x</em> + 1)</span>
          <span className="lr-arrow">← 인수분해 핵심</span>
        </div>
        <div className="lr-eq" style={{ marginTop: 4 }}>
          <span className="marker">극값 후보:</span> <em>x</em> = <span className="blue">±1</span>
        </div>

        <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 36, fontFamily: "Iowan Old Style, serif", fontSize: 22 }}>
          {/* sign chart */}
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "60px 36px 60px 36px 60px", textAlign: "center", color: "var(--acad-ink)" }}>
              <span style={{ color: "var(--acad-muted)" }}>−∞</span>
              <span style={{ fontWeight: 700, color: "var(--acad-navy)" }}>−1</span>
              <span style={{ color: "var(--acad-muted)" }}>—</span>
              <span style={{ fontWeight: 700, color: "var(--acad-navy)" }}>+1</span>
              <span style={{ color: "var(--acad-muted)" }}>+∞</span>
            </div>
            <div style={{ height: 2, background: "var(--acad-ink)", margin: "8px 0", position: "relative" }}>
              <span style={{ position: "absolute", top: -5, left: "21%", width: 8, height: 8, background: "var(--acad-red)", borderRadius: "50%" }} />
              <span style={{ position: "absolute", top: -5, left: "60%", width: 8, height: 8, background: "var(--acad-red)", borderRadius: "50%" }} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "60px 36px 60px 36px 60px", textAlign: "center" }}>
              <span style={{ color: "var(--acad-red)", fontWeight: 700 }}>+</span>
              <span />
              <span style={{ color: "var(--acad-navy)", fontWeight: 700 }}>−</span>
              <span />
              <span style={{ color: "var(--acad-red)", fontWeight: 700 }}>+</span>
            </div>
          </div>
          {/* arrows */}
          <div style={{ fontSize: 14, color: "var(--acad-muted)", fontFamily: "var(--font-kr)", fontWeight: 600, lineHeight: 1.7 }}>
            <div><span style={{ color: "var(--acad-red)", fontWeight: 800 }}>x = −1</span> → 극댓값 <b>4</b></div>
            <div><span style={{ color: "var(--acad-navy)", fontWeight: 800 }}>x = +1</span> → 극솟값 <b>0</b></div>
          </div>
        </div>

        <div className="lr-note" style={{ marginTop: 14 }}>부호 변화를 반드시 확인! 이계도함수는 ‘판정 도구’일 뿐.</div>
      </div>
    </div>
  );
}

function InstructorCam({ ins, micOn }) {
  return (
    <div className="lr-cam">
      <div className="lr-cam-face">{ins?.initials || "강사"}</div>
      <span className="lr-cam-label">강사 · {ins?.name}</span>
      {micOn && (
        <span className="lr-cam-mic">
          <Icon name="mic" size={11} />
        </span>
      )}
    </div>
  );
}

const HandIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 11V5a1.5 1.5 0 0 1 3 0v6" />
    <path d="M11 11V4a1.5 1.5 0 0 1 3 0v7" />
    <path d="M14 11V5a1.5 1.5 0 0 1 3 0v8" />
    <path d="M17 11a1.5 1.5 0 0 1 3 0v4a6 6 0 0 1-6 6h-2a6 6 0 0 1-6-6v-2a1.5 1.5 0 0 1 3 0" />
  </svg>
);

// ── Chat panel ─────────────────────────────────────────────────────
function ChatPanel({ chats, chatInput, setChatInput, sendChat, scrollRef }) {
  return (
    <>
      <div className="lr-chat-list" ref={scrollRef}>
        {chats.map((c) => (
          <div key={c.id} className={"lr-chat-msg " + c.role}>
            <span className="lr-chat-avatar">{c.initials}</span>
            <div className="lr-chat-body">
              <div className="lr-chat-name">
                <strong>{c.name}</strong>
                <span>{c.t}</span>
              </div>
              <div className="lr-chat-text">{c.msg}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="lr-chat-input-bar">
        <input
          className="lr-chat-input"
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") sendChat(); }}
          placeholder="메시지 보내기…"
        />
        <button className="lr-chat-send" onClick={sendChat}>전송</button>
      </div>
    </>
  );
}

// ── Q&A panel ──────────────────────────────────────────────────────
function QAPanel({ questions, voted, vote, onAsk }) {
  const sorted = [...questions].sort((a, b) => Number(a.answered) - Number(b.answered) || b.votes - a.votes);
  return (
    <>
      <div className="lr-qa-list">
        {sorted.map((q) => (
          <div key={q.id} className={"lr-q" + (q.answered ? " answered" : "")}>
            <div className={"lr-q-vote" + (voted[q.id] ? " voted" : "")}>
              <button onClick={() => vote(q.id)} aria-label="추천">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 4l8 10h-5v6h-6v-6H4z" /></svg>
              </button>
              <span className="lr-q-vote-num">{q.votes}</span>
            </div>
            <div className="lr-q-body">
              <div className="lr-q-meta">
                <strong>{q.name}</strong>
                <span>· {q.t}</span>
              </div>
              <div className="lr-q-text">{q.q}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="lr-q-ask">
        <button onClick={onAsk}>＋ 새 질문 작성</button>
      </div>
    </>
  );
}

// ── Students roster ────────────────────────────────────────────────
function StudentsPanel() {
  const raised = STUDENTS.filter((s) => s.raised);
  const others = STUDENTS.filter((s) => !s.raised);
  return (
    <div className="lr-students">
      {raised.length > 0 && (
        <>
          <div className="lr-students-head">손 든 학생 · {raised.length}</div>
          {raised.map((s, i) => <StudentRow key={"r" + i} s={s} />)}
        </>
      )}
      <div className="lr-students-head" style={{ marginTop: 12 }}>접속 중 · 192명 (10명 표시)</div>
      {others.map((s, i) => <StudentRow key={"o" + i} s={s} />)}
    </div>
  );
}

function StudentRow({ s }) {
  return (
    <div className={"lr-student" + (s.isMe ? " me" : "")}>
      <span className={"av" + (s.camera ? " cam-on" : "")}>{s.initials}</span>
      <div className="name">
        {s.name}
        {s.isInstructor && <small>· 강사</small>}
        {s.isMe && <small>· 나</small>}
      </div>
      <div className="icons">
        {s.raised && <span className="raised" title="손들기"><HandIcon /></span>}
        {s.mic && <Icon name="mic" size={13} />}
        {!s.camera && !s.isInstructor && <Icon name="eye" size={13} style={{ opacity: 0.4 }} />}
      </div>
    </div>
  );
}

window.LiveRoom = LiveRoom;
