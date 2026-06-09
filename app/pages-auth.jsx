/* global React, ACCOUNT, useApp, Icon */

const { useState: useStateA } = React;

function LoginPage() {
  const { navigate, login, showToast } = useApp();
  const [email, setEmail] = useStateA("");
  const [password, setPassword] = useStateA("");
  const [busy, setBusy] = useStateA(false);

  const submit = (e) => {
    e?.preventDefault();
    setBusy(true);
    setTimeout(() => {
      setBusy(false);
      if (!email || !password) { showToast("이메일과 비밀번호를 입력해주세요"); return; }
      // Demo: any creds work; tag account if matches
      if (email === ACCOUNT.email && password === ACCOUNT.password) {
        login(ACCOUNT.email, ACCOUNT.name, ACCOUNT.initials);
      } else {
        login(email, "게스트", "GU");
      }
      navigate("/mypage");
    }, 500);
  };

  return (
    <div className="page-enter">
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", minHeight: "calc(100vh - 72px)" }}>
        {/* Left — editorial pane */}
        <div style={{ background: "var(--rj-ink)", color: "var(--rj-paper)", padding: "64px 56px", position: "relative", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div>
            <button onClick={() => navigate("/")} className="brand-wordmark" style={{ color: "var(--rj-paper)", alignItems: "center" }}>
              <img src="assets/logo-mark.png" alt="" className="brand-logo-mark" />
              리뉴젠 아카데미
            </button>
            <div style={{ marginTop: 80, maxWidth: 460 }}>
              <div className="eyebrow" style={{ color: "rgba(245,241,233,0.5)" }}>Welcome Back</div>
              <h1 style={{ fontFamily: "var(--font-kr-serif)", fontWeight: 500, fontSize: 64, letterSpacing: "-0.03em", lineHeight: 1.05, margin: "20px 0 0" }}>
                다시 오신 걸<br /><span style={{ fontFamily: "var(--font-en)", fontStyle: "italic", fontWeight: 300 }}>welcome.</span>
              </h1>
              <p className="body-lg" style={{ color: "rgba(245,241,233,0.7)", marginTop: 24, maxWidth: 380 }}>
                지난 주에 멈췄던 강의가 마이페이지에서 기다리고 있습니다.
              </p>
            </div>
          </div>
          <div className="card" style={{ background: "transparent", border: "1px solid rgba(245,241,233,0.18)", color: "var(--rj-paper)", padding: 24 }}>
            <div className="label-cap" style={{ color: "rgba(245,241,233,0.5)" }}>Demo Credentials</div>
            <div style={{ marginTop: 10, fontFamily: "var(--font-en)", fontSize: 13 }}>
              <div>email · <span style={{ color: "var(--rj-accent)" }}>{ACCOUNT.email}</span></div>
              <div>pw · <span style={{ color: "var(--rj-accent)" }}>{ACCOUNT.password}</span></div>
            </div>
            <p style={{ marginTop: 12, color: "rgba(245,241,233,0.5)", fontSize: 12, marginBottom: 0 }}>아무 이메일·비밀번호로 로그인해도 마이페이지가 열립니다.</p>
          </div>
        </div>

        {/* Right — form */}
        <div style={{ padding: "64px 56px", display: "flex", flexDirection: "column", justifyContent: "center", maxWidth: 560, margin: "0 auto", width: "100%" }}>
          <h2 style={{ fontFamily: "var(--font-kr-serif)", fontWeight: 500, fontSize: 36, letterSpacing: "-0.025em", margin: 0 }}>로그인</h2>
          <p style={{ color: "var(--rj-muted)", marginTop: 8 }}>이메일로 로그인하거나 소셜 계정을 사용하세요.</p>

          <form onSubmit={submit} style={{ marginTop: 36, display: "grid", gap: 18 }}>
            <div className="field">
              <label>Email · 이메일</label>
              <input className="input input-lg" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
            </div>
            <div className="field">
              <label>Password · 비밀번호</label>
              <input className="input input-lg" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13 }}>
              <label style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "var(--rj-muted)" }}>
                <input type="checkbox" /> 자동 로그인
              </label>
              <a href="#/" onClick={(e) => e.preventDefault()} style={{ textDecoration: "underline", color: "var(--rj-muted)" }}>비밀번호를 잊으셨나요?</a>
            </div>
            <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={busy}>
              {busy ? "로그인 중…" : "로그인"}
            </button>
          </form>

          <div style={{ display: "flex", alignItems: "center", gap: 16, margin: "28px 0" }}>
            <div className="hairline-soft" style={{ flex: 1 }} />
            <span className="label-cap" style={{ color: "var(--rj-muted)" }}>OR · 또는</span>
            <div className="hairline-soft" style={{ flex: 1 }} />
          </div>

          <div style={{ display: "grid", gap: 10 }}>
            <button className="btn btn-lg" style={{ background: "#FEE500", color: "#191600" }} onClick={() => { login("user@kakao.com", "도윤", "도윤"); navigate("/mypage"); }}>
              <KakaoMark /> 카카오로 시작하기
            </button>
            <button className="btn btn-lg" style={{ background: "#03C75A", color: "#fff" }} onClick={() => { login("user@naver.com", "도윤", "도윤"); navigate("/mypage"); }}>
              <NaverMark /> 네이버로 시작하기
            </button>
          </div>

          <p style={{ marginTop: 32, fontSize: 14, color: "var(--rj-muted)", textAlign: "center" }}>
            계정이 없으신가요? <a href="#/signup" onClick={(e) => { e.preventDefault(); navigate("/signup"); }} style={{ textDecoration: "underline", color: "var(--rj-ink)" }}>회원가입</a>
          </p>
        </div>
      </div>
    </div>
  );
}

const KakaoMark = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3C6.48 3 2 6.58 2 11c0 2.79 1.78 5.22 4.45 6.66L5.5 21l3.71-2.42c.9.15 1.83.23 2.79.23 5.52 0 10-3.58 10-8s-4.48-7.81-10-7.81Z" /></svg>
);
const NaverMark = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M5 4h4l6 8V4h4v16h-4l-6-8v8H5V4Z" /></svg>
);

// ──────────────────────────────────────────────────────────────────
// Signup
// ──────────────────────────────────────────────────────────────────
function SignupPage() {
  const { navigate, login, showToast } = useApp();
  const [step, setStep] = useStateA(1);
  const [data, setData] = useStateA({ email: "", password: "", name: "", grade: "고2", subject: "math", school: "", agree: { service: false, privacy: false, marketing: false } });
  const update = (k, v) => setData((d) => ({ ...d, [k]: v }));
  const allAgree = data.agree.service && data.agree.privacy;

  const next = () => {
    if (step === 1) {
      if (!data.email || !data.password || !allAgree) { showToast("필수 항목을 입력해주세요"); return; }
    }
    if (step === 2) {
      if (!data.name || !data.school) { showToast("이름과 학교를 입력해주세요"); return; }
    }
    setStep((s) => s + 1);
  };

  const finish = () => {
    login(data.email, data.name, data.name.slice(-2));
    navigate("/mypage");
  };

  return (
    <div className="page-enter container" style={{ paddingTop: 56, paddingBottom: 96, maxWidth: 560 }}>
      <button className="btn-link" onClick={() => navigate("/")} style={{ color: "var(--rj-muted)", fontSize: 13, textDecoration: "none" }}><Icon name="arrowLeft" size={14} /> 처음으로</button>

      <div className="eyebrow" style={{ color: "var(--rj-muted)", marginTop: 28 }}>Create Account · 회원가입</div>
      <h1 style={{ fontFamily: "var(--font-kr-serif)", fontWeight: 500, fontSize: 48, letterSpacing: "-0.03em", margin: "16px 0 0" }}>리뉴젠과 함께 시작하기</h1>

      {/* Steps */}
      <div style={{ display: "flex", gap: 4, marginTop: 36 }}>
        {[1, 2, 3].map((n) => (
          <div key={n} style={{ flex: 1, height: 3, background: step >= n ? "var(--rj-ink)" : "var(--rj-faint)", borderRadius: 2 }} />
        ))}
      </div>
      <div className="label-cap" style={{ color: "var(--rj-muted)", marginTop: 12 }}>
        STEP {step} / 3 — {["계정 만들기", "프로필 입력", "관심 과목"][step - 1]}
      </div>

      {/* Step 1 */}
      {step === 1 && (
        <div style={{ marginTop: 32, display: "grid", gap: 18 }}>
          <div className="field"><label>Email · 이메일</label><input className="input input-lg" type="email" value={data.email} onChange={(e) => update("email", e.target.value)} placeholder="you@example.com" /></div>
          <div className="field"><label>Password · 비밀번호 (8자 이상)</label><input className="input input-lg" type="password" value={data.password} onChange={(e) => update("password", e.target.value)} /></div>

          <div style={{ marginTop: 12, padding: 20, background: "var(--rj-paper-2)", borderRadius: "var(--rj-r-sm)" }}>
            <label style={{ display: "flex", alignItems: "center", gap: 10, fontWeight: 600, fontSize: 14 }}>
              <input type="checkbox" checked={allAgree && data.agree.marketing} onChange={(e) => setData((d) => ({ ...d, agree: { service: e.target.checked, privacy: e.target.checked, marketing: e.target.checked } }))} />
              전체 동의
            </label>
            <div style={{ height: 1, background: "var(--rj-faint)", margin: "14px 0" }} />
            {[
              ["service", "이용약관 동의", true],
              ["privacy", "개인정보 수집·이용 동의", true],
              ["marketing", "마케팅 정보 수신 동의", false],
            ].map(([k, label, req]) => (
              <label key={k} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", fontSize: 13 }}>
                <input type="checkbox" checked={data.agree[k]} onChange={(e) => setData((d) => ({ ...d, agree: { ...d.agree, [k]: e.target.checked } }))} />
                <span>[{req ? "필수" : "선택"}] {label}</span>
                <a href="#/" onClick={(e) => e.preventDefault()} style={{ marginLeft: "auto", color: "var(--rj-muted)", fontSize: 12, textDecoration: "underline" }}>보기</a>
              </label>
            ))}
          </div>
          <button className="btn btn-primary btn-lg btn-block" onClick={next}>다음 <Icon name="arrow" size={14} /></button>
        </div>
      )}

      {/* Step 2 */}
      {step === 2 && (
        <div style={{ marginTop: 32, display: "grid", gap: 18 }}>
          <div className="field"><label>이름</label><input className="input input-lg" value={data.name} onChange={(e) => update("name", e.target.value)} placeholder="한도윤" /></div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div className="field">
              <label>학년</label>
              <select className="input input-lg" value={data.grade} onChange={(e) => update("grade", e.target.value)}>
                {["중2", "중3", "고1", "고2", "고3", "N수생"].map((g) => <option key={g}>{g}</option>)}
              </select>
            </div>
            <div className="field"><label>학교</label><input className="input input-lg" value={data.school} onChange={(e) => update("school", e.target.value)} placeholder="리뉴젠고등학교" /></div>
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
            <button className="btn btn-ghost btn-lg" onClick={() => setStep(1)}><Icon name="arrowLeft" size={14} /> 이전</button>
            <button className="btn btn-primary btn-lg" style={{ flex: 1 }} onClick={next}>다음 <Icon name="arrow" size={14} /></button>
          </div>
        </div>
      )}

      {/* Step 3 */}
      {step === 3 && (
        <div style={{ marginTop: 32 }}>
          <div className="label-cap" style={{ color: "var(--rj-muted)" }}>SUBJECTS · 관심 과목 (복수 선택)</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginTop: 12 }}>
            {window.SUBJECTS.map((s) => (
              <button key={s.id} onClick={() => update("subject", s.id)} style={{
                padding: 16, borderRadius: "var(--rj-r-sm)", border: "1px solid",
                borderColor: data.subject === s.id ? "var(--rj-ink)" : "var(--rj-faint)",
                background: data.subject === s.id ? "var(--rj-ink)" : "transparent",
                color: data.subject === s.id ? "var(--rj-paper)" : "var(--rj-ink)",
                cursor: "pointer",
                fontSize: 14, fontWeight: 600,
              }}>{s.ko}<div style={{ fontFamily: "var(--font-en)", fontStyle: "italic", fontWeight: 300, fontSize: 11, opacity: 0.6, marginTop: 4 }}>{s.en}</div></button>
            ))}
          </div>

          <div className="card-accent" style={{ marginTop: 28, padding: 24 }}>
            <div className="eyebrow">First Week Free</div>
            <div style={{ fontFamily: "var(--font-kr-serif)", fontSize: 24, letterSpacing: "-0.025em", marginTop: 10 }}>회원가입과 동시에 1주차 강의가 열립니다.</div>
            <p style={{ marginTop: 8, fontSize: 13 }}>모든 강의의 1주차 라이브와 다시보기를 결제 없이 시청할 수 있습니다.</p>
          </div>

          <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
            <button className="btn btn-ghost btn-lg" onClick={() => setStep(2)}><Icon name="arrowLeft" size={14} /> 이전</button>
            <button className="btn btn-primary btn-lg" style={{ flex: 1 }} onClick={finish}>가입 완료 → 마이페이지 <Icon name="arrow" size={14} /></button>
          </div>
        </div>
      )}
    </div>
  );
}

window.LoginPage = LoginPage;
window.SignupPage = SignupPage;
