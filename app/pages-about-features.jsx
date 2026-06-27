/* global React, useApp, Icon */
// ════════════════════════════════════════════════════════════════════
//   /about — 리뉴젠만의 강점 블록
//   브로슈어(전단지) 9장의 내용을 사이트 디자인 시스템(네이비·옐로·크림)
//   으로 재해석한 컴포넌트 모음.
//     · AboutKeyPoints  — Key Point 1·2 (온라인 실시간 / 쌍방향 수업)
//     · AboutObjections — 질문→답변 4블록 (오프라인·평가·관리·질의응답)
//     · AboutCompare    — 타 인강 사이트 비교표
//     · AboutResults    — 성적 상승 실적 + 후기
//   스크린샷이 들어가던 자리는 <image-slot> 으로, 실제 캡처를 끼우면 됩니다.
// ════════════════════════════════════════════════════════════════════

const AB = {
  navy: "var(--acad-navy)",
  navy2: "var(--acad-navy-2)",
  yel: "var(--acad-yellow)",
  paper: "var(--acad-paper)",
  cream: "var(--acad-bg)",
  cream2: "var(--acad-bg-2)",
  line: "var(--acad-line)",
  muted: "var(--acad-muted)",
  ink: "var(--acad-ink)",
};

// ── 공통: 이미지 자리 ──────────────────────────────────────────────
//   모든 자리는 assets/about/<id>.webp 를 먼저 찾습니다.
//    · 파일이 있으면  → 실제 사진을 표시 (가볍고 카페24 배포에 그대로 사용)
//    · 파일이 없으면  → 드래그해서 끼우는 슬롯으로 자동 전환
//   사진을 끼운 뒤에는 그 슬롯을 assets/about/<id>.webp 파일로 빼내면
//   영구적으로 사진이 박힙니다. (pos 로 보이는 위치 미세조정)
const AB_POS = { "kp1-kor": "50% 8%" }; // 자리별 object-position 보정(선택)
function ABShot({ id, src, label, h = 200, ratio, frame = "navy", caption, cover, contain }) {
  const border = frame === "navy" ? "rgba(0,29,61,0.14)" : AB.line;
  const [hasFile, setHasFile] = React.useState(true); // 일단 파일 시도
  const fill = cover && !ratio; // 부모 칸 높이를 그대로 채움(위아래 정렬용)
  const fileSrc = src ? ("assets/about/" + src) : ("assets/about/" + id + ".webp");
  // 빈 슬롯(드롭 자리)
  const slotStyle = {
    display: "block", width: "100%",
    ...(fill ? { height: "100%" } : ratio ? { aspectRatio: ratio } : { height: h + "px" }),
    border: "1.5px solid " + border,
    borderRadius: "12px",
    background: AB.cream2,
  };
  // 실제 사진
  const imgStyle = {
    display: "block", width: "100%",
    border: "1.5px solid " + border,
    borderRadius: "12px",
    background: AB.cream2,
    ...(contain
      ? { aspectRatio: ratio || "4 / 3", objectFit: "contain" }  // 칸 안에 전체가 보이게(안 잘림)
      : cover
        ? (fill
            ? { height: "100%", objectFit: "cover" }
            : { aspectRatio: ratio, height: "auto", objectFit: "cover" })
        : { height: "auto" }),                                   // 기본: 원본 비율 그대로
  };
  const figureStyle = { margin: 0, display: "flex", flexDirection: "column", gap: 10, ...(fill ? { height: "100%" } : {}) };
  return (
    <figure style={figureStyle}>
      {hasFile ? (
        <img
          src={fileSrc}
          alt={label || caption || ""}
          loading="lazy"
          onError={() => setHasFile(false)}
          style={imgStyle}
        />
      ) : (
        <image-slot
          id={"ab-" + id}
          shape="rounded"
          radius="12"
          placeholder={label}
          style={slotStyle}
        ></image-slot>
      )}
      {caption && (
        <figcaption style={{ textAlign: "center", fontWeight: 800, fontSize: 14, color: AB.navy, letterSpacing: "-0.02em" }}>{caption}</figcaption>
      )}
    </figure>
  );
}

// ── 공통: 자동 슬라이드 + 클릭 확대(라이트박스) ─────────────────────
function Slideshow({ images, ratio = "4 / 3", interval = 3000, frame = "navy" }) {
  const border = frame === "navy" ? "rgba(0,29,61,0.14)" : AB.line;
  const [i, setI] = React.useState(0);
  const [open, setOpen] = React.useState(false);
  const [lb, setLb] = React.useState(0);
  React.useEffect(() => {
    if (open || images.length < 2) return;
    const t = setInterval(() => setI((p) => (p + 1) % images.length), interval);
    return () => clearInterval(t);
  }, [open, images.length, interval]);
  return (
    <div>
      <div
        onClick={() => { setLb(i); setOpen(true); }}
        style={{ position: "relative", aspectRatio: ratio, borderRadius: 14, overflow: "hidden", border: "1.5px solid " + border, background: AB.cream2, cursor: "zoom-in" }}
      >
        {images.map((src, idx) => (
          <img key={src} src={"assets/about/" + src} alt="" loading="lazy"
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: idx === i ? 1 : 0, transition: "opacity 0.7s ease" }} />
        ))}
        <span style={{ position: "absolute", top: 12, right: 12, display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(0,29,61,0.62)", color: "#fff", fontSize: 12, fontWeight: 700, padding: "6px 11px", borderRadius: 999, pointerEvents: "none" }}>
          <Icon name="search" size={13} /> 클릭하면 크게 보기
        </span>
        <div style={{ position: "absolute", bottom: 12, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 7 }}>
          {images.map((_, idx) => (
            <button key={idx} aria-label={"슬라이드 " + (idx + 1)}
              onClick={(e) => { e.stopPropagation(); setI(idx); }}
              style={{ width: idx === i ? 22 : 8, height: 8, borderRadius: 99, border: 0, padding: 0, cursor: "pointer", background: idx === i ? AB.yel : "rgba(255,255,255,0.75)", transition: "all 0.3s ease" }} />
          ))}
        </div>
      </div>
      {open && <Lightbox images={images} index={lb} setIndex={setLb} onClose={() => setOpen(false)} />}
    </div>
  );
}

function Lightbox({ images, index, setIndex, onClose }) {
  React.useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight") setIndex((p) => (p + 1) % images.length);
      else if (e.key === "ArrowLeft") setIndex((p) => (p - 1 + images.length) % images.length);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [images.length]);
  const navBtn = { width: 52, height: 52, borderRadius: "50%", border: 0, cursor: "pointer", background: "rgba(255,255,255,0.14)", color: "#fff", fontSize: 28, fontWeight: 400, display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 };
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(8,12,20,0.93)", display: "flex", alignItems: "center", justifyContent: "center", gap: 20, padding: "32px clamp(16px, 4vw, 60px)" }}>
      <button onClick={onClose} aria-label="닫기" style={{ position: "absolute", top: 22, right: 26, width: 44, height: 44, borderRadius: "50%", border: 0, cursor: "pointer", background: "rgba(255,255,255,0.14)", color: "#fff", fontSize: 22 }}>✕</button>
      {images.length > 1 && <button onClick={(e) => { e.stopPropagation(); setIndex((p) => (p - 1 + images.length) % images.length); }} aria-label="이전" style={navBtn}>‹</button>}
      <img src={"assets/about/" + images[index]} alt="" onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: "84vw", maxHeight: "84vh", objectFit: "contain", borderRadius: 10, boxShadow: "0 30px 80px rgba(0,0,0,0.5)" }} />
      {images.length > 1 && <button onClick={(e) => { e.stopPropagation(); setIndex((p) => (p + 1) % images.length); }} aria-label="다음" style={navBtn}>›</button>}
      <div style={{ position: "absolute", bottom: 26, left: 0, right: 0, textAlign: "center", color: "rgba(255,255,255,0.85)", fontFamily: "var(--font-en)", fontWeight: 700, fontSize: 14, letterSpacing: "0.08em" }}>{index + 1} / {images.length}</div>
    </div>
  );
}

// ── 공통: 오프라인 캠프 — 포스터 + 설명(좌우 번갈아) ────────────────
function CampInfo({ rows }) {
  return (
    <div style={{ display: "grid", gap: 9, margin: "16px 0 18px" }}>
      {rows.map(([k, v]) => (
        <div key={k} style={{ display: "grid", gridTemplateColumns: "58px 1fr", gap: 12, alignItems: "baseline" }}>
          <span style={{ background: AB.navy, color: "#fff", fontWeight: 800, fontSize: 12.5, letterSpacing: "0.06em", textAlign: "center", padding: "4px 0", borderRadius: 6, whiteSpace: "nowrap" }}>{k}</span>
          <span style={{ fontSize: 15, fontWeight: 600, color: AB.ink, lineHeight: 1.5 }}>{v}</span>
        </div>
      ))}
    </div>
  );
}
function CampRow({ img, side = "left", badge, title, quote, rows, benefits }) {
  const poster = (
    <div style={{ display: "flex", justifyContent: "center" }}>
      <img src={"assets/about/" + img} alt={title} loading="lazy"
        style={{ width: "100%", maxWidth: 360, height: "auto", borderRadius: 14, border: "1.5px solid " + AB.line, boxShadow: "0 16px 38px rgba(0,29,61,0.14)" }} />
    </div>
  );
  const text = (
    <div>
      {badge && <span style={{ display: "inline-block", background: AB.yel, color: AB.navy, fontWeight: 800, fontSize: 12.5, padding: "6px 12px", borderRadius: 999, marginBottom: 12, whiteSpace: "nowrap" }}>{badge}</span>}
      <div style={{ fontWeight: 900, fontSize: 24, color: AB.navy, letterSpacing: "-0.035em", lineHeight: 1.3 }}>{title}</div>
      {quote && <p style={{ margin: "10px 0 0", fontSize: 16, fontWeight: 800, color: AB.navy, letterSpacing: "-0.02em" }}><em style={{ fontStyle: "normal", background: "linear-gradient(180deg, transparent 58%, rgba(255,214,10,0.5) 58%)", padding: "0 3px" }}>{quote}</em></p>}
      <CampInfo rows={rows} />
      {benefits && <ABChips items={benefits} />}
    </div>
  );
  return (
    <div style={{ display: "grid", gridTemplateColumns: side === "left" ? "0.82fr 1.18fr" : "1.18fr 0.82fr", gap: 40, alignItems: "center" }}>
      {side === "left" ? <>{poster}{text}</> : <>{text}{poster}</>}
    </div>
  );
}

// ── 공통: 옐로 체크 칩 줄 ───────────────────────────────────────────
function ABChips({ items, center }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: center ? "center" : "flex-start" }}>
      {items.map((t) => (
        <span key={t} style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          background: AB.paper, border: "1.5px solid " + AB.line, borderRadius: 999,
          padding: "10px 18px 10px 14px", fontWeight: 800, fontSize: 14.5, color: AB.navy, letterSpacing: "-0.02em", whiteSpace: "nowrap",
        }}>
          <span style={{ width: 22, height: 22, borderRadius: "50%", background: AB.yel, color: AB.navy, display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Icon name="check" size={13} />
          </span>
          {t}
        </span>
      ))}
    </div>
  );
}

// ── 공통: 질문 배너(아래 화살표 꼬리) ──────────────────────────────
function ABQuestion({ kicker, q }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
      <div style={{
        background: AB.navy, color: "#fff", borderRadius: 16,
        padding: "26px 44px", maxWidth: 880,
        boxShadow: "0 18px 40px rgba(0,29,61,0.18)",
      }}>
        {kicker && <div style={{ fontSize: 15, fontWeight: 600, color: "rgba(255,255,255,0.75)", marginBottom: 8, letterSpacing: "-0.01em" }}>{kicker}</div>}
        <h2 style={{ margin: 0, fontWeight: 900, fontSize: "clamp(26px, 3.2vw, 38px)", letterSpacing: "-0.04em", lineHeight: 1.22 }}>{q}</h2>
      </div>
      <div style={{ width: 0, height: 0, borderLeft: "16px solid transparent", borderRight: "16px solid transparent", borderTop: "16px solid " + AB.navy }} />
    </div>
  );
}

// ── 공통: 강조 리드 문구 ───────────────────────────────────────────
function ABLead({ children }) {
  return (
    <p style={{ margin: "0 auto", textAlign: "center", maxWidth: 820, fontWeight: 800, fontSize: "clamp(20px, 2.3vw, 27px)", letterSpacing: "-0.035em", lineHeight: 1.4, color: AB.navy }}>{children}</p>
  );
}

// ── 공통: 답변 카드(라벨 헤더 + 본문) ──────────────────────────────
function ABCard({ label, children }) {
  return (
    <div style={{ background: AB.paper, border: "1.5px solid " + AB.line, borderRadius: 16, overflow: "hidden", display: "flex", flexDirection: "column" }}>
      <div style={{ background: AB.navy, color: "#fff", fontWeight: 900, fontSize: 17, letterSpacing: "-0.02em", padding: "16px 22px", textAlign: "center" }}>{label}</div>
      <div style={{ padding: "22px 22px 24px", display: "flex", flexDirection: "column", gap: 16, flex: 1 }}>{children}</div>
    </div>
  );
}

function ABNote({ children }) {
  return (
    <p style={{ margin: 0, textAlign: "center", fontSize: 15, lineHeight: 1.65, color: AB.muted, fontWeight: 600, letterSpacing: "-0.02em" }}>{children}</p>
  );
}

// ════════════════════════════════════════════════════════════════════
//   KEY POINTS — 온라인 실시간 수업 / 쌍방향 상호작용 수업
// ════════════════════════════════════════════════════════════════════
function AboutKeyPoints() {
  return (
    <section style={{ background: AB.cream }}>
      <div className="container-wide" style={{ paddingTop: 84, paddingBottom: 16 }}>
        {/* 인트로 배너 */}
        <div style={{ position: "relative", borderRadius: 20, overflow: "hidden", background: AB.navy, marginBottom: 64 }}>
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(60% 100% at 50% 0%, rgba(255,214,10,0.16), transparent 62%)" }} />
          <div style={{ position: "relative", display: "grid", gridTemplateColumns: "1.05fr 1fr", gap: 0, alignItems: "stretch" }}>
            <div style={{ padding: "52px 48px", color: "#fff", display: "flex", flexDirection: "column", justifyContent: "center" }}>
              <span style={{ display: "inline-block", background: AB.yel, color: AB.navy, fontWeight: 800, fontSize: 13, padding: "7px 13px", borderRadius: 5, width: "fit-content", whiteSpace: "nowrap" }}>1위 기독교 온라인 원격 학원</span>
              <h2 style={{ margin: "20px 0 0", fontWeight: 900, fontSize: "clamp(34px, 4.4vw, 56px)", letterSpacing: "-0.045em", lineHeight: 1.08 }}>
                리뉴젠 아카데미만의<br /><em style={{ fontStyle: "normal", color: AB.yel }}>Key Point</em>
              </h2>
              <p style={{ margin: "18px 0 0", fontSize: 16, lineHeight: 1.7, color: "rgba(255,255,255,0.8)", fontWeight: 500, maxWidth: 420 }}>
                녹화 강의만 돌려보는 여느 인강과는 다릅니다. 실시간으로 만나고, 서로 묻고 답하며 함께 학습합니다.
              </p>
            </div>
            <div style={{ padding: 28, display: "flex", alignItems: "center" }}>
              <ABShot id="kp-group" src="kp-group.jpg" cover label="단체 사진 (수강생/현장)" ratio="16 / 11" frame="dark" />
            </div>
          </div>
        </div>

        {/* Key Point 1 */}
        <ABDivider n="1" title="온라인 실시간 수업" sub="수업 현장을 확인해 보세요!" />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 18, marginTop: 30 }}>
          <ABShot id="kp1-kor" label="ClassIn 수업 화면" ratio="4 / 3" caption="국어 수업" />
          <ABShot id="kp1-math" label="ClassIn 수업 화면" ratio="4 / 3" caption="수학 수업" />
          <ABShot id="kp1-soc" label="ClassIn 수업 화면" ratio="4 / 3" caption="사회 수업" />
          <ABShot id="kp1-toefl" label="ClassIn 수업 화면" ratio="4 / 3" caption="토플 Reading 수업" />
        </div>
        <p style={{ textAlign: "center", marginTop: 18, fontSize: 14.5, color: AB.muted, fontWeight: 600 }}>이 외에도 검정고시 · 수능 · 토플 과정에 따라 수업이 더 마련되어 있습니다.</p>

        <div style={{ marginTop: 36 }}>
          <ABChips center items={["어디서든지 수업이 가능", "실시간으로 과목별 선생님과 소통", "실시간 수업 녹화본 무제한 수강"]} />
        </div>

        {/* Key Point 2 */}
        <div style={{ marginTop: 72 }}>
          <ABDivider n="2" title="쌍방향 상호작용 수업" />
        </div>
        <div style={{ marginTop: 28, display: "grid", gridTemplateColumns: "2fr 1fr", gap: 18, alignItems: "stretch" }}>
          {/* 왼쪽 2/3 — 1번 사진이 높이를 결정 */}
          <ABShot id="kp2-board" label="ClassIn 쌍방향 칠판 화면" ratio="16 / 10" cover />
          {/* 오른쪽 1/3 — 사진 2개 위아래, 합친 높이가 왼쪽과 같아짐 */}
          <div style={{ display: "grid", gridTemplateRows: "1fr 1fr", gap: 18 }}>
            <ABShot id="kp2-chat1" label="실시간 질문 채팅" cover />
            <ABShot id="kp2-chat2" label="선생님 답변 채팅" cover />
          </div>
        </div>
        <p style={{ textAlign: "center", marginTop: 24, fontWeight: 800, fontSize: "clamp(18px, 2vw, 23px)", letterSpacing: "-0.03em", color: AB.navy, lineHeight: 1.45 }}>
          <em style={{ fontStyle: "normal", background: "linear-gradient(180deg, transparent 60%, rgba(255,214,10,0.45) 60%)", padding: "0 3px" }}>실시간 문제 풀이 과정 확인</em>으로,<br />막히는 부분을 그 자리에서 피드백하고 학습합니다.
        </p>
      </div>
    </section>
  );
}

function ABDivider({ n, title, sub }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16 }}>
        <span style={{ height: 1, width: 90, background: AB.line }} />
        <span style={{ display: "inline-flex", alignItems: "center", gap: 8, background: AB.navy, color: AB.yel, fontWeight: 900, fontSize: 15, letterSpacing: "0.02em", padding: "9px 20px", borderRadius: 999, whiteSpace: "nowrap" }}>
          <span style={{ fontFamily: "var(--font-en)" }}>Key Point</span> {n}
        </span>
        <span style={{ height: 1, width: 90, background: AB.line }} />
      </div>
      <h3 style={{ margin: "20px 0 0", fontWeight: 900, fontSize: "clamp(30px, 3.6vw, 44px)", letterSpacing: "-0.04em", color: AB.navy }}>{title}</h3>
      {sub && <p style={{ margin: "8px 0 0", fontSize: 16, color: AB.muted, fontWeight: 600 }}>{sub}</p>}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
//   OBJECTIONS — 질문 → 답변 4블록
// ════════════════════════════════════════════════════════════════════
function AboutObjections() {
  return (
    <>
      {/* Q1 — 오프라인 */}
      <section style={{ background: AB.paper }}>
        <div className="container-wide" style={{ paddingTop: 88, paddingBottom: 80 }}>
          <ABQuestion kicker="온라인으로만 하면 긴장감이 떨어질 것 같은데…" q="혹시 오프라인 프로그램은 없을까요?" />
          <div style={{ marginTop: 40 }}>
            <ABLead>
              리뉴젠만의 특별한 <em style={{ fontStyle: "normal", color: AB.navy }}>오프라인 캠프</em>로<br />
              개념을 <em style={{ fontStyle: "normal", background: "linear-gradient(180deg, transparent 58%, rgba(255,214,10,0.45) 58%)", padding: "0 3px" }}>대면으로 총정리</em>합니다.
            </ABLead>
          </div>

          {/* 개강·종강 캠프 — 슬라이드(3초 자동) + 클릭 확대 */}
          <div style={{ marginTop: 44, display: "grid", gridTemplateColumns: "1.05fr 1fr", gap: 40, alignItems: "center" }}>
            <div>
              <Slideshow ratio="4 / 5" interval={3000} images={["camp-sumup.webp", "camp-opening.webp", "camp-q3.jpg", "camp-summer.jpg"]} />
              <div style={{ textAlign: "center", fontWeight: 800, fontSize: 14, color: AB.navy, marginTop: 12 }}>개강캠프 &amp; 종강캠프</div>
            </div>
            <div>
              <div style={{ fontWeight: 900, fontSize: 21, color: AB.navy, letterSpacing: "-0.03em", lineHeight: 1.4 }}>“똑똑한 공부는 시작과 마무리가 중요하다”</div>
              <p style={{ margin: "14px 0 22px", fontSize: 15.5, lineHeight: 1.75, color: AB.muted, fontWeight: 500 }}>
                매 분기마다 진행되는 오프라인 캠프입니다. 개강과 종강, 각 과목별 선생님을 <strong style={{ color: AB.navy }}>대면</strong>하여 개념을 총정리합니다.
              </p>
              <ABChips items={["오프라인 수업", "시간관리 특강", "로드맵 작성", "입시 설명회"]} />
            </div>
          </div>

          {/* 찾아가는 원데이 클래스 — 슬라이드(3초 자동) + 클릭 확대 */}
          <div style={{ marginTop: 52, display: "grid", gridTemplateColumns: "1fr 1.05fr", gap: 40, alignItems: "center" }}>
            <div>
              <div style={{ fontWeight: 900, fontSize: 21, color: AB.navy, letterSpacing: "-0.03em", lineHeight: 1.4 }}>“강사님이 찾아간다!<br />전국으로 찾아가는 오프라인 클래스”</div>
              <p style={{ margin: "14px 0 22px", fontSize: 15.5, lineHeight: 1.75, color: AB.muted, fontWeight: 500 }}>
                순천·해운대 등 전국 어디든 강사님이 직접 찾아가, 한 명 한 명의 학습을 점검합니다.
              </p>
              <ABChips items={["취약점 보완", "개별 학생 피드백"]} />
            </div>
            <div>
              <Slideshow ratio="4 / 3" interval={3000} images={["oneday-class1.jpg", "oneday-class2.jpg", "oneday-group.jpg", "oneday-haeundae.png", "oneday-suncheon.jpg"]} />
              <div style={{ textAlign: "center", fontWeight: 800, fontSize: 14, color: AB.navy, marginTop: 12 }}>찾아가는 원데이 클래스</div>
            </div>
          </div>
        </div>
      </section>

      {/* Q2 — 평가 */}
      <section style={{ background: AB.cream }}>
        <div className="container-wide" style={{ paddingTop: 88, paddingBottom: 80 }}>
          <ABQuestion q={<>중간고사 · 기말고사처럼<br />평가도 볼 수 있나요?</>} />
          <div style={{ marginTop: 40, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 18 }}>
            <ABShot src="ev-report.png" label="2025 1분기 성적통지표" ratio="4 / 3" contain caption="성적통지표" />
            <ABShot src="ev-graph.png" label="과목별 성적 그래프" ratio="4 / 3" contain caption="과목별 성적 그래프" />
            <ABShot src="ev-proof.png" label="점수로 증명하는 성장" ratio="4 / 3" contain caption="점수로 증명하는 성장" />
          </div>
          <div style={{ marginTop: 40, display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 18 }}>
            <ABStat big="월 1회" small="진행되는 월말평가" />
            <ABStat big="성적표" small="로 확인하는 우리 아이 학습 상태" />
          </div>
          <div style={{ marginTop: 28, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 18 }}>
            <ABShot src="ev-grading.png" label="강사 직접 숙제 채점" ratio="4 / 3" contain caption="강사 직접 숙제 채점" />
            <ABShot src="ev-logmath.png" label="수학 수업일지" ratio="4 / 3" contain caption="수학 수업일지" />
            <ABShot src="ev-logsci.png" label="통합과학 수업일지" ratio="4 / 3" contain caption="통합과학 수업일지" />
          </div>
          <div style={{ marginTop: 28, display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 18 }}>
            <ABStat big="강사님이 직접" small="채점 & 첨삭하는 시스템" tone="solid" />
            <ABStat big="매일 체크 & 공유" small="되는 수업 피드백" tone="solid" />
          </div>
        </div>
      </section>

      {/* Q3 — 학습 관리 */}
      <section style={{ background: AB.paper }}>
        <div className="container-wide" style={{ paddingTop: 88, paddingBottom: 80 }}>
          <ABQuestion q={<>집에서 혼자 공부하는데<br />학습 관리가 될까요?</>} />
          <div style={{ marginTop: 40 }}>
            <ABLead>
              물론이죠! 학부모님의 걱정을 덜어드리는<br />
              리뉴젠 아카데미의 <em style={{ fontStyle: "normal", color: AB.navy }}>관리 시스템</em>.
            </ABLead>
          </div>
          <div style={{ marginTop: 44, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <ABCard label="과제 점검">
              <ABShot id="q3-hw" src="q3-hw.jpg" cover label="숙제 점검 화면 (제출물 · 점수)" ratio="16 / 11" />
              <ABNote>강사님이 직접 확인하는 <strong style={{ color: AB.navy }}>과제 점검 시스템</strong></ABNote>
            </ABCard>
            <ABCard label="출결 체크">
              <ABShot id="q3-attend" src="q3-attend.jpg" cover label="출결 관리표" ratio="16 / 11" />
              <ABNote>한눈에 보는 <strong style={{ color: AB.navy }}>출결 관리 시스템</strong></ABNote>
            </ABCard>
          </div>
          <div style={{ marginTop: 20, maxWidth: 620, marginLeft: "auto", marginRight: "auto" }}>
            <ABCard label="학부모 개인 소식창">
              <ABShot id="q3-kakao" src="q3-kakao.jpg" cover label="학부모 카톡 소식창 캡처" ratio="16 / 10" />
              <ABNote>수강생 <strong style={{ color: AB.navy }}>학부모 개인 소식창(카톡)</strong>으로 관리 및 소통</ABNote>
            </ABCard>
          </div>
        </div>
      </section>

      {/* Q4 — 질의응답 */}
      <section style={{ background: AB.cream }}>
        <div className="container-wide" style={{ paddingTop: 88, paddingBottom: 80 }}>
          <ABQuestion kicker="수업 내 채팅방 개설로 과목별 선생님과 다이렉트 질의응답이 가능합니다" q="교재를 풀다가 모르겠으면?" />
          <div style={{ marginTop: 40 }}>
            <ABLead>
              일방적으로 QnA 게시판 답변만 기다리는<br />
              <em style={{ fontStyle: "normal", color: AB.navy }}>인강 사이트와는 다릅니다.</em>
            </ABLead>
          </div>
          <div style={{ marginTop: 40, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
            {[
              { t: "수업 시간 내 질의응답", d: "실시간 수업 중 바로 손을 들고 물어봅니다." },
              { t: "코스 내 채팅으로 질문", d: "과목별 채팅방에서 선생님과 다이렉트로." },
              { t: "숙제 제출 시 Q&A 요청", d: "막힌 문제를 표시해 제출하면 첨삭으로 답변." },
            ].map((c, i) => (
              <div key={c.t} style={{ background: AB.paper, border: "1.5px solid " + AB.line, borderRadius: 16, padding: "26px 24px", display: "flex", flexDirection: "column", gap: 12 }}>
                <span style={{ width: 44, height: 44, borderRadius: 12, background: AB.navy, color: AB.yel, display: "inline-flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-en)", fontWeight: 800, fontSize: 17 }}>{"0" + (i + 1)}</span>
                <div style={{ fontWeight: 900, fontSize: 18, color: AB.navy, letterSpacing: "-0.03em" }}>{c.t}</div>
                <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.6, color: AB.muted, fontWeight: 500 }}>{c.d}</p>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 26, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
            <ABShot id="q4-live" src="q4-live.jpg" cover label="실시간 수업 질의응답 화면" ratio="16 / 10" />
            <ABShot id="q4-qna" src="q4-qna.jpg" cover label="채팅/숙제 Q&A 화면" ratio="16 / 10" />
          </div>
        </div>
      </section>
    </>
  );
}

function ABStat({ big, small, tone }) {
  const solid = tone === "solid";
  return (
    <div style={{
      borderRadius: 999, padding: "20px 28px", textAlign: "center",
      background: solid ? AB.navy : AB.paper,
      border: solid ? "none" : "1.5px solid " + AB.line,
      color: solid ? "#fff" : AB.navy,
    }}>
      <span style={{ fontWeight: 900, fontSize: "clamp(19px, 2.1vw, 25px)", letterSpacing: "-0.035em" }}>
        <em style={{ fontStyle: "normal", color: solid ? AB.yel : AB.navy }}>{big}</em>
        <span style={{ fontWeight: 700, color: solid ? "rgba(255,255,255,0.92)" : AB.ink }}> {small}</span>
      </span>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
//   COMPARE — 타 인강 사이트 비교표
// ════════════════════════════════════════════════════════════════════
function AboutCompare() {
  const rowsAll = [
    { k: "강의방식", us: ["온라인 실시간"], them: "ALL 녹화본" },
    { k: "소통방식", usHead: "쌍방향", us: ["실시간 수업", "코스 내 채팅", "수업 중 질의응답"], them: "일방향" },
    { k: "평가", usHead: "시험관리", us: ["진단평가", "월말평가", "성적표 배부"], them: "없음" },
    { k: "학생관리", usHead: "LMS 시스템", us: ["출결관리", "숙제체크", "오프라인 캠프"], them: "없음" },
  ];
  // EDU MODE: 강의방식·소통방식(실시간·쌍방향) 행만 가림
  const rows = window.RJ_EDU_MODE
    ? rowsAll.filter((r) => r.k !== "강의방식" && r.k !== "소통방식")
    : rowsAll;
  return (
    <section style={{ background: AB.paper, borderTop: "1px solid " + AB.line }}>
      <div className="container-wide" style={{ paddingTop: 84, paddingBottom: 84 }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <p style={{ margin: 0, fontSize: 16, color: AB.muted, fontWeight: 700 }}>왜 리뉴젠 아카데미여야 하나요? · 타 인강 사이트와 비교 불가</p>
          <h2 style={{ margin: "10px 0 0", fontWeight: 900, fontSize: "clamp(30px, 3.8vw, 46px)", letterSpacing: "-0.04em", color: AB.navy }}>
            소중한 자녀 학습, <em style={{ fontStyle: "normal", background: "linear-gradient(180deg, transparent 58%, rgba(255,214,10,0.45) 58%)", padding: "0 3px" }}>꼼꼼하게 비교</em>해 보세요
          </h2>
        </div>

        <div style={{ maxWidth: 980, margin: "0 auto", display: "grid", gridTemplateColumns: "150px 1.3fr 1fr", gap: 0, border: "1px solid " + AB.line, borderRadius: 18, overflow: "hidden", background: "#fff" }}>
          {/* header row */}
          <div style={{ background: AB.cream2, padding: "22px 18px", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-en)", fontWeight: 800, fontSize: 16, color: AB.navy }}>Check Point</div>
          <div style={{ background: AB.navy, padding: "20px 18px", display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
            <img src="assets/logo-mark.png" alt="" style={{ height: 30 }} />
            <span style={{ fontWeight: 900, fontSize: 17, color: "#fff", letterSpacing: "-0.02em", whiteSpace: "nowrap" }}>리뉴젠 아카데미</span>
          </div>
          <div style={{ background: "#8A929E", padding: "20px 18px", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 17, color: "#fff", letterSpacing: "-0.02em", whiteSpace: "nowrap" }}>타 인강 사이트</div>

          {/* body rows */}
          {rows.map((r, i) => (
            <React.Fragment key={r.k}>
              <div style={{ borderTop: "1px solid " + AB.line, background: AB.cream, padding: "28px 16px", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 17, color: AB.navy, letterSpacing: "-0.02em" }}>{r.k}</div>
              <div style={{ borderTop: "1px solid " + AB.line, borderLeft: "3px solid " + AB.yel, padding: "26px 22px", display: "flex", flexDirection: "column", alignItems: "center", gap: 12, background: "#FFFDF5" }}>
                {r.usHead && <div style={{ fontWeight: 900, fontSize: 19, color: AB.navy, letterSpacing: "-0.03em", whiteSpace: "nowrap" }}>{r.usHead}</div>}
                <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: r.usHead ? "flex-start" : "center" }}>
                  {r.us.map((u) => (
                    r.usHead ? (
                      <span key={u} style={{ display: "inline-flex", alignItems: "center", gap: 8, fontWeight: 700, fontSize: 15.5, color: AB.ink, whiteSpace: "nowrap" }}>
                        <span style={{ width: 20, height: 20, borderRadius: "50%", background: AB.yel, color: AB.navy, display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Icon name="check" size={12} /></span>
                        {u}
                      </span>
                    ) : (
                      <span key={u} style={{ fontWeight: 900, fontSize: 18, color: AB.navy, whiteSpace: "nowrap" }}>{u}</span>
                    )
                  ))}
                </div>
              </div>
              <div style={{ borderTop: "1px solid " + AB.line, padding: "26px 18px", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 16.5, color: "#9AA1AC", background: "#F4F5F6" }}>{r.them}</div>
            </React.Fragment>
          ))}
        </div>
      </div>
    </section>
  );
}

// ════════════════════════════════════════════════════════════════════
//   RESULTS — 성적 상승 실적 + 후기
// ════════════════════════════════════════════════════════════════════
const AB_RESULTS = {
  suneung: {
    title: "2026 대학수학능력시험",
    rows: [
      ["김OO", "수학", "4등급", "1등급"],
      ["김OO", "한국사", "2등급", "1등급"],
      ["김OO", "영어", "4등급", "3등급"],
      ["서OO", "국어", "5등급", "3등급"],
      ["서OO", "수학", "5등급", "3등급"],
      ["서OO", "사문", "6등급", "1등급"],
      ["정OO", "영어", "5등급", "3등급"],
    ],
  },
  hakpyeong: {
    title: "2025 고3 전국연합학력평가",
    rows: [
      ["노OO", "영어", "3등급", "2등급"],
      ["최OO", "국어", "3등급", "1등급"],
      ["최OO", "영어", "2등급", "1등급"],
      ["최OO", "생활과 윤리 (고2)", "—", "1등급"],
      ["김OO", "국어", "4등급", "2등급"],
      ["김OO", "영어", "4등급", "1등급"],
      ["이OO", "영어", "3등급", "2등급"],
      ["이OO", "생윤", "4등급", "2등급"],
    ],
  },
  toefl: {
    title: "모의 토플",
    rows: [
      ["임OO", "TOEFL", "62점", "80점"],
      ["최OO", "TOEFL", "62점", "74점"],
    ],
  },
};

function ABResultTable({ data }) {
  return (
    <div style={{ background: AB.paper, border: "1.5px solid " + AB.line, borderRadius: 16, overflow: "hidden" }}>
      <div style={{ background: AB.navy, color: "#fff", textAlign: "center", fontWeight: 900, fontSize: 18, letterSpacing: "-0.02em", padding: "16px 0" }}>[{data.title}]</div>
      <div>
        {data.rows.map((r, i) => (
          <div key={i} style={{ display: "grid", gridTemplateColumns: "68px 1fr auto", alignItems: "center", gap: 12, padding: "14px 22px", borderTop: i === 0 ? "none" : "1px dashed " + AB.line }}>
            <span style={{ fontWeight: 700, fontSize: 16, color: AB.ink, whiteSpace: "nowrap" }}>{r[0]}</span>
            <span style={{ fontWeight: 600, fontSize: 14.5, color: AB.muted, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r[1]}</span>
            <span style={{ justifySelf: "end", display: "inline-flex", alignItems: "center", gap: 10, whiteSpace: "nowrap" }}>
              {r[2] !== "—" && <span style={{ fontWeight: 600, fontSize: 14, color: AB.muted }}>{r[2]}</span>}
              <span style={{ color: AB.navy, display: "flex" }}><Icon name="arrow" size={15} /></span>
              <span style={{ fontWeight: 900, fontSize: 18, color: AB.navy, letterSpacing: "-0.02em" }}>{r[3]}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function AboutResults() {
  const reviews = [
    { body: eduText("실시간 수업으로 제가 모르는 것을 캐치하셔서, 이해할 수 있도록 잘 지도해 주셔서 좋았어요.", "녹화 강의로 제가 모르는 부분을 꼼꼼히 짚어 주셔서, 이해할 수 있도록 잘 지도해 주셔서 좋았어요."), who: "수강생 김O진" },
    { body: "각 과목을 성경적 관점으로 재해석·재구성한 기독교 교육으로 탁월하게 배울 수 있어서 좋았어요.", who: "학부모 김O빈" },
    { body: "나이 상관없이 각자 레벨에 맞게 수업이 진행되어, 노베이스도 수월하게 실력을 쌓아갈 수 있어 좋습니다.", who: "수강생 이O" },
  ];
  return (
    <section style={{ background: AB.cream, borderTop: "1px solid " + AB.line }}>
      <div className="container-wide" style={{ paddingTop: 84, paddingBottom: 88 }}>
        <div style={{ textAlign: "center", marginBottom: 44 }}>
          <p style={{ margin: 0, fontSize: 16, color: AB.muted, fontWeight: 700 }}>2026 수능 · 2025 고3 전국연합학력평가 · 토플</p>
          <h2 style={{ margin: "10px 0 0", fontWeight: 900, fontSize: "clamp(30px, 3.8vw, 46px)", letterSpacing: "-0.04em", color: AB.navy }}>
            <em style={{ fontStyle: "normal", background: "linear-gradient(180deg, transparent 58%, rgba(255,214,10,0.45) 58%)", padding: "0 3px" }}>점수로 증명</em>된 리뉴젠 아카데미
          </h2>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 22, alignItems: "start" }}>
          <ABResultTable data={AB_RESULTS.suneung} />
          <div style={{ display: "grid", gap: 22 }}>
            <ABResultTable data={AB_RESULTS.hakpyeong} />
            <ABResultTable data={AB_RESULTS.toefl} />
          </div>
        </div>
        <p style={{ textAlign: "center", marginTop: 16, fontSize: 13, color: AB.muted, fontWeight: 500 }}>* 개인정보 보호를 위해 수강생 성함은 일부만 표기합니다.</p>

        {/* 후기 */}
        <div style={{ marginTop: 56, textAlign: "center" }}>
          <span style={{ display: "inline-block", background: AB.navy, color: "#fff", fontWeight: 900, fontSize: "clamp(20px, 2.4vw, 28px)", letterSpacing: "-0.035em", padding: "14px 34px", borderRadius: 999 }}>모두가 인정하는 리뉴젠 아카데미</span>
        </div>
        <div style={{ marginTop: 34, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 18 }}>
          {reviews.map((r) => (
            <div key={r.who} style={{ background: AB.paper, border: "1.5px solid " + AB.line, borderRadius: 16, padding: "26px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
              <span style={{ width: 40, height: 40, borderRadius: 10, background: AB.yel, color: AB.navy, display: "inline-flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 22, lineHeight: 1 }}>“</span>
              <p style={{ margin: 0, fontSize: 15.5, lineHeight: 1.7, color: AB.ink, fontWeight: 600, letterSpacing: "-0.02em", flex: 1 }}>{r.body}</p>
              <div style={{ fontSize: 13.5, fontWeight: 800, color: AB.muted }}>— 리뉴젠 아카데미 {r.who}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

Object.assign(window, { AboutKeyPoints, AboutObjections, AboutCompare, AboutResults });
