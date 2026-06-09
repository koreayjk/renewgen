/* global React, COURSES, useApp, Icon, findCourse, findInstructor, findSubject, formatKRW */

const { useState: useStateK, useMemo: useMemoK } = React;

// ──────────────────────────────────────────────────────────────────
// /cart
// ──────────────────────────────────────────────────────────────────
function CartPage() {
  const { navigate, cart, removeFromCart } = useApp();
  const items = cart.map((c) => findCourse(c.courseId)).filter(Boolean);
  const subtotal = items.reduce((sum, c) => sum + c.salePrice, 0);
  const originalTotal = items.reduce((sum, c) => sum + c.price, 0);
  const bundleDiscount = items.length >= 2 ? Math.round(subtotal * 0.05) : 0;
  const total = subtotal - bundleDiscount;

  return (
    <div className="page-enter container-wide" style={{ paddingTop: 56, paddingBottom: 96 }}>
      <button className="btn-link" onClick={() => navigate("/courses")} style={{ color: "var(--rj-muted)", fontSize: 13, textDecoration: "none" }}><Icon name="arrowLeft" size={14} /> 강의 목록</button>
      <div className="eyebrow" style={{ color: "var(--rj-muted)", marginTop: 28 }}>Cart · 장바구니</div>
      <h1 style={{ fontFamily: "var(--font-kr-serif)", fontWeight: 500, fontSize: 56, letterSpacing: "-0.03em", margin: "12px 0 0" }}>장바구니 <span className="num-en" style={{ color: "var(--rj-muted)", fontWeight: 400 }}>({items.length})</span></h1>

      {items.length === 0 ? (
        <div style={{ marginTop: 56, padding: 96, textAlign: "center", border: "1px dashed var(--rj-faint)", borderRadius: "var(--rj-r)" }}>
          <Icon name="cart" size={48} className="" />
          <h3 style={{ fontFamily: "var(--font-kr-serif)", fontWeight: 500, fontSize: 28, marginTop: 16, letterSpacing: "-0.025em" }}>장바구니가 비어 있습니다</h3>
          <p style={{ color: "var(--rj-muted)", marginTop: 8 }}>관심 있는 강의를 담아보세요.</p>
          <button className="btn btn-primary btn-lg" style={{ marginTop: 24 }} onClick={() => navigate("/courses")}>강의 둘러보기 <Icon name="arrow" size={14} /></button>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 40, marginTop: 36 }}>
          <div style={{ display: "grid", gap: 16 }}>
            {items.map((c) => (
              <CartItem key={c.id} course={c} onRemove={() => removeFromCart(c.id)} onOpen={() => navigate("/courses/" + c.id)} />
            ))}
          </div>

          <aside>
            <div className="card" style={{ padding: 28, position: "sticky", top: 100 }}>
              <h3 style={{ fontFamily: "var(--font-kr-serif)", fontWeight: 500, fontSize: 22, letterSpacing: "-0.025em", margin: 0 }}>주문 요약</h3>
              <div style={{ height: 1, background: "var(--rj-faint)", margin: "20px 0" }} />
              <SummaryRow label="원가 합계" value={formatKRW(originalTotal)} muted strike />
              <SummaryRow label="강의 할인" value={"− " + formatKRW(originalTotal - subtotal)} />
              {bundleDiscount > 0 && (
                <SummaryRow label="2강의 이상 추가 5%" value={"− " + formatKRW(bundleDiscount)} accent />
              )}
              <div style={{ height: 1, background: "var(--rj-faint)", margin: "16px 0" }} />
              <SummaryRow label="결제 예정 금액" value={formatKRW(total)} big />
              <button className="btn btn-primary btn-lg btn-block" style={{ marginTop: 20 }} onClick={() => navigate("/checkout")}>
                결제하기 <Icon name="arrow" size={14} />
              </button>
              <div style={{ marginTop: 16, fontSize: 12, color: "var(--rj-muted)", textAlign: "center" }}>
                결제 즉시 강의 시청이 가능합니다. 7일 이내 100% 환불 보장.
              </div>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}

function CartItem({ course, onRemove, onOpen }) {
  const ins = findInstructor(course.instructor);
  return (
    <div className="card" style={{ padding: 20, display: "grid", gridTemplateColumns: "120px 1fr auto auto", gap: 24, alignItems: "center" }}>
      <button onClick={onOpen} style={{ background: "transparent", cursor: "pointer", aspectRatio: "4/5" }}>
        <window.CoursePoster course={course} onClick={onOpen} />
      </button>
      <div>
        <div className="eyebrow" style={{ color: "var(--rj-muted)" }}>No. {course.no} · {findSubject(course.subject)?.en}</div>
        <div style={{ fontFamily: "var(--font-kr-serif)", fontSize: 22, letterSpacing: "-0.025em", marginTop: 6 }}>{course.title}</div>
        <div style={{ fontSize: 13, color: "var(--rj-muted)", marginTop: 4 }}>{ins?.name} · {course.lessons}강 · {course.weeks}주</div>
        <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
          <span className="tag">{course.format}</span>
          <span className="tag">{course.level}</span>
        </div>
      </div>
      <div style={{ textAlign: "right" }}>
        <div className="num-en" style={{ fontSize: 13, color: "var(--rj-muted)", textDecoration: "line-through" }}>{formatKRW(course.price)}</div>
        <div className="num-en" style={{ fontSize: 22, fontWeight: 600, letterSpacing: "-0.02em" }}>{formatKRW(course.salePrice)}</div>
      </div>
      <button onClick={onRemove} className="icon-btn" aria-label="삭제"><Icon name="close" size={16} /></button>
    </div>
  );
}

function SummaryRow({ label, value, muted, strike, accent, big }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", alignItems: "baseline" }}>
      <span style={{ fontSize: big ? 15 : 13, color: muted ? "var(--rj-muted)" : "var(--rj-ink)", fontWeight: big ? 600 : 400 }}>{label}</span>
      <span className="num-en" style={{
        fontSize: big ? 26 : 14,
        fontWeight: big ? 700 : 500,
        color: accent ? "#1F8A5B" : (muted ? "var(--rj-muted)" : "var(--rj-ink)"),
        textDecoration: strike ? "line-through" : "none",
        letterSpacing: "-0.02em",
      }}>{value}</span>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────
// /checkout — 3 steps
// ──────────────────────────────────────────────────────────────────
function CheckoutPage() {
  const { navigate, cart, clearCart, user, showToast } = useApp();
  const [step, setStep] = useStateK(1); // 1: 정보, 2: 결제, 3: 완료
  const items = cart.map((c) => findCourse(c.courseId)).filter(Boolean);

  const subtotal = items.reduce((s, c) => s + c.salePrice, 0);
  const bundle = items.length >= 2 ? Math.round(subtotal * 0.05) : 0;
  const total = subtotal - bundle;

  const [info, setInfo] = useStateK({
    name: user?.name || "한도윤",
    email: user?.email || "student@renewjen.kr",
    phone: "010-1234-5678",
    parent: "이미정",
    parentPhone: "010-9876-5432",
  });
  const [pay, setPay] = useStateK({
    method: "card",
    cardNo: "4280  ••••  ••••  ••••",
    holder: "한도윤",
    expiry: "08 / 28",
    cvc: "•••",
    install: "일시불",
  });

  const orderId = useMemoK(() => "RJ-" + new Date().getFullYear().toString().slice(-2) + "-" + String(Math.floor(100000 + Math.random() * 900000)), []);

  if (items.length === 0 && step !== 3) {
    return (
      <div className="container page-enter" style={{ padding: "120px 0", textAlign: "center" }}>
        <h2 style={{ fontFamily: "var(--font-kr-serif)", fontWeight: 500, fontSize: 32 }}>장바구니가 비어 있습니다</h2>
        <button className="btn btn-primary" style={{ marginTop: 20 }} onClick={() => navigate("/courses")}>강의 둘러보기 <Icon name="arrow" size={14} /></button>
      </div>
    );
  }

  const submit = () => {
    // Simulate
    showToast("결제가 완료되었습니다");
    setStep(3);
    // Don't clear cart yet — used in success screen
    setTimeout(() => clearCart(), 0);
  };

  return (
    <div className="page-enter">
      <section style={{ borderBottom: "1px solid var(--rj-faint)" }}>
        <div className="container-wide" style={{ paddingTop: 48, paddingBottom: 32 }}>
          <button className="btn-link" onClick={() => navigate(step === 1 ? "/cart" : "/checkout")} style={{ color: "var(--rj-muted)", fontSize: 13, textDecoration: "none" }}>
            <Icon name="arrowLeft" size={14} /> {step === 1 ? "장바구니" : "이전 단계"}
          </button>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 24 }}>
            <div>
              <div className="eyebrow" style={{ color: "var(--rj-muted)" }}>Checkout · 결제</div>
              <h1 style={{ fontFamily: "var(--font-kr-serif)", fontWeight: 500, fontSize: 48, letterSpacing: "-0.03em", margin: "12px 0 0" }}>
                {step === 1 && "주문 정보 확인"}
                {step === 2 && "결제 수단 선택"}
                {step === 3 && "주문이 완료되었습니다."}
              </h1>
            </div>
            <StepIndicator step={step} />
          </div>
        </div>
      </section>

      <section className="container-wide" style={{ paddingTop: 48, paddingBottom: 96 }}>
        {step !== 3 ? (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 400px", gap: 48 }}>
            <div>
              {step === 1 && <CheckoutStep1 info={info} setInfo={setInfo} items={items} onNext={() => setStep(2)} />}
              {step === 2 && <CheckoutStep2 pay={pay} setPay={setPay} total={total} onPay={submit} onBack={() => setStep(1)} />}
            </div>
            <aside>
              <OrderSummary items={items} subtotal={subtotal} bundle={bundle} total={total} step={step} />
            </aside>
          </div>
        ) : (
          <CheckoutSuccess orderId={orderId} items={items} total={total} info={info} onGoMyPage={() => navigate("/mypage")} onGoCourses={() => navigate("/courses")} onPlay={(id) => navigate("/player/" + id)} />
        )}
      </section>
    </div>
  );
}

function StepIndicator({ step }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      {[
        { n: 1, label: "주문정보" },
        { n: 2, label: "결제" },
        { n: 3, label: "완료" },
      ].map((s, i) => (
        <React.Fragment key={s.n}>
          {i > 0 && <div style={{ width: 32, height: 1, background: step > i ? "var(--rj-ink)" : "var(--rj-faint)" }} />}
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
            <span style={{
              width: 28, height: 28, borderRadius: "50%",
              background: step >= s.n ? "var(--rj-ink)" : "transparent",
              color: step >= s.n ? "var(--rj-paper)" : "var(--rj-muted)",
              border: "1px solid",
              borderColor: step >= s.n ? "var(--rj-ink)" : "var(--rj-faint)",
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              fontFamily: "var(--font-en)", fontSize: 12, fontWeight: 700,
            }}>{step > s.n ? <Icon name="check" size={12} /> : s.n}</span>
            <span style={{ fontSize: 13, fontWeight: step === s.n ? 600 : 400, color: step >= s.n ? "var(--rj-ink)" : "var(--rj-muted)" }}>{s.label}</span>
          </div>
        </React.Fragment>
      ))}
    </div>
  );
}

function CheckoutStep1({ info, setInfo, onNext }) {
  return (
    <div>
      <h2 style={{ fontFamily: "var(--font-kr-serif)", fontWeight: 500, fontSize: 26, letterSpacing: "-0.025em", margin: 0 }}>수강자 정보</h2>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 20 }}>
        <div className="field"><label>이름</label><input className="input input-lg" value={info.name} onChange={(e) => setInfo({ ...info, name: e.target.value })} /></div>
        <div className="field"><label>휴대전화</label><input className="input input-lg" value={info.phone} onChange={(e) => setInfo({ ...info, phone: e.target.value })} /></div>
        <div className="field" style={{ gridColumn: "1 / 3" }}><label>이메일 (영수증 발송)</label><input className="input input-lg" value={info.email} onChange={(e) => setInfo({ ...info, email: e.target.value })} /></div>
      </div>

      <h2 style={{ fontFamily: "var(--font-kr-serif)", fontWeight: 500, fontSize: 26, letterSpacing: "-0.025em", marginTop: 40 }}>보호자 정보 <span style={{ fontSize: 13, color: "var(--rj-muted)" }}>(미성년자 결제 시 필수)</span></h2>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 20 }}>
        <div className="field"><label>보호자 성함</label><input className="input input-lg" value={info.parent} onChange={(e) => setInfo({ ...info, parent: e.target.value })} /></div>
        <div className="field"><label>보호자 연락처</label><input className="input input-lg" value={info.parentPhone} onChange={(e) => setInfo({ ...info, parentPhone: e.target.value })} /></div>
      </div>

      <div className="card-soft" style={{ padding: 20, marginTop: 40 }}>
        <label style={{ display: "flex", gap: 10, alignItems: "flex-start", fontSize: 14 }}>
          <input type="checkbox" defaultChecked style={{ marginTop: 4 }} />
          <span>
            <strong>[필수] 환불 정책 및 수강 약관에 동의합니다.</strong><br />
            <span style={{ color: "var(--rj-muted)", fontSize: 13 }}>결제 후 7일 이내, 진도 10% 미만 수강 시 100% 환불됩니다. 자세히 보기 ↗</span>
          </span>
        </label>
      </div>

      <button className="btn btn-primary btn-lg" style={{ marginTop: 32 }} onClick={onNext}>결제 수단 선택 <Icon name="arrow" size={14} /></button>
    </div>
  );
}

function CheckoutStep2({ pay, setPay, total, onPay, onBack }) {
  const methods = [
    { id: "card",    label: "신용·체크카드", en: "Credit / Debit", icon: "card" },
    { id: "kakao",   label: "카카오페이",    en: "KakaoPay",        icon: "sparkle" },
    { id: "naver",   label: "네이버페이",    en: "NaverPay",        icon: "sparkle" },
    { id: "bank",    label: "무통장 입금",   en: "Bank Transfer",   icon: "book" },
  ];
  return (
    <div>
      <h2 style={{ fontFamily: "var(--font-kr-serif)", fontWeight: 500, fontSize: 26, letterSpacing: "-0.025em", margin: 0 }}>결제 수단</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginTop: 20 }}>
        {methods.map((m) => (
          <button key={m.id} onClick={() => setPay({ ...pay, method: m.id })} style={{
            padding: "18px 14px", borderRadius: "var(--rj-r-sm)", border: "1px solid",
            borderColor: pay.method === m.id ? "var(--rj-ink)" : "var(--rj-faint)",
            background: pay.method === m.id ? "var(--rj-ink)" : "transparent",
            color: pay.method === m.id ? "var(--rj-paper)" : "var(--rj-ink)",
            cursor: "pointer", display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-start",
          }}>
            <Icon name={m.icon} size={18} />
            <div style={{ fontSize: 14, fontWeight: 600 }}>{m.label}</div>
            <div style={{ fontFamily: "var(--font-en)", fontStyle: "italic", fontWeight: 300, fontSize: 11, opacity: 0.7 }}>{m.en}</div>
          </button>
        ))}
      </div>

      {pay.method === "card" && (
        <div style={{ marginTop: 32 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
            <div>
              <h3 style={{ fontFamily: "var(--font-kr-serif)", fontWeight: 500, fontSize: 20, letterSpacing: "-0.025em", margin: "0 0 16px" }}>카드 정보</h3>
              <div style={{ display: "grid", gap: 14 }}>
                <div className="field"><label>카드 번호</label><input className="input input-lg" value={pay.cardNo} onChange={(e) => setPay({ ...pay, cardNo: e.target.value })} /></div>
                <div className="field"><label>카드 소유자</label><input className="input input-lg" value={pay.holder} onChange={(e) => setPay({ ...pay, holder: e.target.value })} /></div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div className="field"><label>유효기간</label><input className="input input-lg" value={pay.expiry} onChange={(e) => setPay({ ...pay, expiry: e.target.value })} /></div>
                  <div className="field"><label>CVC</label><input className="input input-lg" value={pay.cvc} onChange={(e) => setPay({ ...pay, cvc: e.target.value })} /></div>
                </div>
                <div className="field">
                  <label>할부 개월</label>
                  <select className="input input-lg" value={pay.install} onChange={(e) => setPay({ ...pay, install: e.target.value })}>
                    {["일시불", "2개월 (무이자)", "3개월 (무이자)", "6개월 (무이자)", "12개월"].map((o) => <option key={o}>{o}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div>
              <h3 style={{ fontFamily: "var(--font-kr-serif)", fontWeight: 500, fontSize: 20, letterSpacing: "-0.025em", margin: "0 0 16px" }}>카드 미리보기</h3>
              <CardVisual cardNo={pay.cardNo} holder={pay.holder} expiry={pay.expiry} />
              <div className="card-soft" style={{ padding: 18, marginTop: 16 }}>
                <div className="label-cap" style={{ color: "var(--rj-muted)", marginBottom: 8 }}>무이자 할부 안내</div>
                <p style={{ margin: 0, fontSize: 13, color: "var(--rj-muted)", lineHeight: 1.6 }}>국내 모든 신용카드사 2·3·6개월 무이자 할부 가능. 12개월부터는 카드사 할부 수수료가 적용됩니다.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {pay.method !== "card" && (
        <div className="card" style={{ padding: 32, marginTop: 32, textAlign: "center" }}>
          <Icon name="sparkle" size={28} className="" />
          <h3 style={{ fontFamily: "var(--font-kr-serif)", fontWeight: 500, fontSize: 24, marginTop: 12, letterSpacing: "-0.025em" }}>
            {{ kakao: "카카오페이", naver: "네이버페이", bank: "무통장 입금" }[pay.method]}로 결제
          </h3>
          <p style={{ color: "var(--rj-muted)", marginTop: 8 }}>
            ‘결제하기’를 누르면 외부 결제창이 열립니다. (데모에서는 즉시 결제 완료로 처리됩니다.)
          </p>
        </div>
      )}

      <div style={{ display: "flex", gap: 10, marginTop: 32 }}>
        <button className="btn btn-ghost btn-lg" onClick={onBack}><Icon name="arrowLeft" size={14} /> 이전</button>
        <button className="btn btn-primary btn-lg" style={{ flex: 1 }} onClick={onPay}>
          <Icon name="lock" size={14} /> {formatKRW(total)} 결제하기
        </button>
      </div>
      <div style={{ marginTop: 14, fontSize: 12, color: "var(--rj-muted)", textAlign: "center" }}>PG · KICC · 안전결제 / 결제 정보는 암호화되어 전송됩니다.</div>
    </div>
  );
}

function CardVisual({ cardNo, holder, expiry }) {
  return (
    <div style={{
      background: "linear-gradient(135deg, #0A0A0A 0%, #2A2A2A 100%)",
      color: "var(--rj-paper)",
      borderRadius: 16,
      padding: 28,
      aspectRatio: "1.6 / 1",
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
      position: "relative",
      overflow: "hidden",
    }}>
      <div style={{ position: "absolute", top: -40, right: -40, width: 200, height: 200, borderRadius: "50%", background: "var(--rj-accent)", opacity: 0.18 }} />
      <div style={{ position: "absolute", bottom: -60, right: -20, width: 220, height: 220, borderRadius: "50%", background: "var(--rj-accent)", opacity: 0.1 }} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div className="brand-wordmark" style={{ color: "var(--rj-paper)", fontSize: 18, alignItems: "center" }}>
          <img src="assets/logo-mark.png" alt="" className="brand-logo-mark brand-logo-mark--sm" style={{ height: 22 }} />
          리뉴젠
        </div>
        <div style={{ width: 36, height: 24, background: "linear-gradient(135deg, #d4af37, #f5e6a8 60%, #d4af37)", borderRadius: 4 }} />
      </div>
      <div className="num-en" style={{ fontSize: 20, letterSpacing: "0.2em", marginTop: 8 }}>{cardNo}</div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, fontFamily: "var(--font-en)", letterSpacing: "0.14em", textTransform: "uppercase" }}>
        <div>
          <div style={{ opacity: 0.6 }}>Cardholder</div>
          <div style={{ marginTop: 2 }}>{holder}</div>
        </div>
        <div>
          <div style={{ opacity: 0.6 }}>Valid Thru</div>
          <div style={{ marginTop: 2 }}>{expiry}</div>
        </div>
      </div>
    </div>
  );
}

function OrderSummary({ items, subtotal, bundle, total }) {
  return (
    <div className="card" style={{ padding: 24, position: "sticky", top: 100 }}>
      <h3 style={{ fontFamily: "var(--font-kr-serif)", fontWeight: 500, fontSize: 20, letterSpacing: "-0.025em", margin: 0 }}>주문 요약</h3>
      <div style={{ display: "grid", gap: 12, marginTop: 18, marginBottom: 18 }}>
        {items.map((c) => (
          <div key={c.id} style={{ display: "grid", gridTemplateColumns: "44px 1fr auto", gap: 12, alignItems: "center" }}>
            <div style={{ width: 44, height: 44, borderRadius: 8, background: c.color === "ink" ? "var(--rj-ink)" : c.color === "accent" ? "var(--rj-accent)" : "var(--rj-paper-2)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-en)", fontSize: 14, fontWeight: 700, color: c.color === "ink" ? "var(--rj-paper)" : "var(--rj-ink)" }}>{c.no}</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{c.title}</div>
              <div style={{ fontSize: 11, color: "var(--rj-muted)" }}>{findInstructor(c.instructor)?.name}</div>
            </div>
            <div className="num-en" style={{ fontSize: 13, fontWeight: 600 }}>{formatKRW(c.salePrice)}</div>
          </div>
        ))}
      </div>
      <div style={{ height: 1, background: "var(--rj-faint)" }} />
      <div style={{ display: "grid", gap: 6, marginTop: 14 }}>
        <SummaryRow label="강의 합계" value={formatKRW(subtotal)} />
        {bundle > 0 && <SummaryRow label="번들 5%" value={"− " + formatKRW(bundle)} accent />}
      </div>
      <div style={{ height: 1, background: "var(--rj-faint)", margin: "16px 0" }} />
      <SummaryRow label="총 결제 금액" value={formatKRW(total)} big />
    </div>
  );
}

function CheckoutSuccess({ orderId, items, total, info, onGoMyPage, onGoCourses, onPlay }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 420px", gap: 56 }}>
      <div>
        <div style={{ width: 72, height: 72, borderRadius: "50%", background: "var(--rj-accent)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
          <Icon name="check" size={32} strokeWidth={2} />
        </div>
        <h2 style={{ fontFamily: "var(--font-kr-serif)", fontWeight: 500, fontSize: 48, letterSpacing: "-0.03em", marginTop: 24, lineHeight: 1.1 }}>
          {info.name}님,<br />
          결제가 완료되었습니다.
        </h2>
        <p className="body-lg" style={{ color: "var(--rj-muted)", marginTop: 16, maxWidth: 520 }}>
          영수증을 <strong style={{ color: "var(--rj-ink)" }}>{info.email}</strong>으로 발송했습니다.
          마이페이지 ‘수강 중인 강의’에서 바로 시청하실 수 있습니다.
        </p>

        <div className="card" style={{ padding: 24, marginTop: 32 }}>
          <div className="label-cap" style={{ color: "var(--rj-muted)" }}>Order Number · 주문번호</div>
          <div className="num-en" style={{ fontSize: 24, fontWeight: 600, marginTop: 6, letterSpacing: "0.02em" }}>{orderId}</div>
          <div style={{ height: 1, background: "var(--rj-faint)", margin: "16px 0" }} />
          <div style={{ display: "grid", gap: 12 }}>
            {items.map((c) => (
              <div key={c.id} style={{ display: "grid", gridTemplateColumns: "1fr auto auto", gap: 16, alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{c.title}</div>
                  <div style={{ fontSize: 12, color: "var(--rj-muted)" }}>{findInstructor(c.instructor)?.name} · 강의실 {c.classInRoomId}</div>
                </div>
                <span className="num-en" style={{ fontSize: 13 }}>{formatKRW(c.salePrice)}</span>
                <button className="btn btn-sm btn-primary" onClick={() => onPlay(c.id)}><Icon name="play" size={12} /> 바로 시청</button>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
          <button className="btn btn-primary btn-lg" onClick={onGoMyPage}>마이페이지로 <Icon name="arrow" size={14} /></button>
          <button className="btn btn-ghost btn-lg" onClick={onGoCourses}>강의 더 보기</button>
        </div>
      </div>

      <aside className="card-ink" style={{ padding: 28 }}>
        <div className="eyebrow" style={{ color: "rgba(245,241,233,0.6)" }}>What's Next · 다음 단계</div>
        <h3 style={{ fontFamily: "var(--font-kr-serif)", fontWeight: 500, fontSize: 24, letterSpacing: "-0.025em", margin: "14px 0 0" }}>한 주의 학습이 시작됩니다.</h3>
        <ol style={{ marginTop: 24, paddingLeft: 0, listStyle: "none", display: "grid", gap: 18 }}>
          {[
            ["01", "라이브 강의실 입장 코드", `결제하신 강의의 룸 코드를 ${info.email}로 발송했습니다.`],
            ["02", "다음 라이브", "5월 22일 (목) 20:00 — 미적분 정수 1주차 OT"],
            ["03", "다시보기", "라이브 종료 후 5분 안에 ‘마이페이지’에 업로드됩니다."],
          ].map(([n, t, b]) => (
            <li key={n} style={{ display: "grid", gridTemplateColumns: "32px 1fr", gap: 14 }}>
              <span className="num-en" style={{ color: "var(--rj-accent)", fontSize: 12, letterSpacing: "0.18em", fontWeight: 700 }}>{n}</span>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{t}</div>
                <div style={{ fontSize: 13, color: "rgba(245,241,233,0.7)", marginTop: 4 }}>{b}</div>
              </div>
            </li>
          ))}
        </ol>
        <div className="num-en" style={{ marginTop: 24, paddingTop: 20, borderTop: "1px solid rgba(245,241,233,0.18)", fontSize: 13, color: "rgba(245,241,233,0.6)" }}>TOTAL PAID — {formatKRW(total)}</div>
      </aside>
    </div>
  );
}

window.CartPage = CartPage;
window.CheckoutPage = CheckoutPage;
