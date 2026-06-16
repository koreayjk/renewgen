/* global React, ACCOUNT, useApp, Icon */

const { useState: useStateA } = React;

function LoginPage() {
  const { navigate, login, signIn, showToast } = useApp();
  const [email, setEmail] = useStateA("");
  const [password, setPassword] = useStateA("");
  const [busy, setBusy] = useStateA(false);

  const google = async () => {
    if (!window.SUPABASE_ENABLED) { showToast("구글 로그인은 Supabase 연결 후 작동합니다"); return; }
    const r = await window.signInWithGoogle();
    if (!r.ok) showToast(r.error || "구글 로그인을 시작할 수 없습니다");
  };

  const submit = async (e) => {
    e?.preventDefault();
    if (!email || !password) { showToast("이메일과 비밀번호를 입력해주세요"); return; }
    setBusy(true);
    const res = await signIn(email, password);
    setBusy(false);
    if (!res.ok) { showToast(res.error === "Invalid login credentials" ? "이메일 또는 비밀번호가 올바르지 않습니다" : (res.error || "로그인에 실패했습니다")); return; }
    navigate("/mypage");
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
            <div className="label-cap" style={{ color: "rgba(245,241,233,0.5)" }}>Supabase 연동</div>
            <p style={{ marginTop: 10, color: "rgba(245,241,233,0.7)", fontSize: 13, marginBottom: 0, lineHeight: 1.6 }}>
              실제 계정으로 로그인됩니다. 계정이 없으시면 먼저 <a href="#/signup" style={{ color: "var(--rj-accent)" }}>회원가입</a> 해주세요.
            </p>
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
            <button className="btn btn-lg" style={{ background: "#fff", color: "#1f1f1f", border: "1px solid #dadce0" }} onClick={google}>
              <GoogleMark /> Google로 시작하기
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
const GoogleMark = () => (
  <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.26 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"/><path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38Z"/></svg>
);

// ──────────────────────────────────────────────────────────────────
// Signup
// ──────────────────────────────────────────────────────────────────
function SignupPage() {
  const { navigate, login, signUp, showToast } = useApp();
  const [step, setStep] = useStateA(1);
  const [busy, setBusy] = useStateA(false);
  const [data, setData] = useStateA({ email: "", password: "", name: "", phone: "", grade: "고2", subject: "math", school: "", agree: { service: false, privacy: false, marketing: false } });
  const update = (k, v) => setData((d) => ({ ...d, [k]: v }));
  const allAgree = data.agree.service && data.agree.privacy;

  const google = async () => {
    if (!window.SUPABASE_ENABLED) { showToast("구글 로그인은 Supabase 연결 후 작동합니다"); return; }
    const r = await window.signInWithGoogle();
    if (!r.ok) showToast(r.error || "구글 로그인을 시작할 수 없습니다");
  };

  const next = () => {
    if (step === 1) {
      if (!data.email || !data.password || !allAgree) { showToast("필수 항목을 입력해주세요"); return; }
    }
    if (step === 2) {
      if (!data.name || !data.school) { showToast("이름과 학교를 입력해주세요"); return; }
    }
    setStep((s) => s + 1);
  };

  const finish = async () => {
    setBusy(true);
    const res = await signUp({ email: data.email, password: data.password, name: data.name, grade: data.grade, school: data.school, subject: data.subject });
    setBusy(false);
    if (!res.ok) {
      showToast(res.error && res.error.includes("already") ? "이미 가입된 이메일입니다" : (res.error || "가입에 실패했습니다"));
      return;
    }
    if (res.needsConfirm) {
      showToast("확인 이메일을 보냈습니다. 메일 인증 후 로그인해주세요");
      navigate("/login");
      return;
    }
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
          <button className="btn btn-lg" style={{ background: "#fff", color: "#1f1f1f", border: "1px solid #dadce0" }} onClick={google}>
            <GoogleMark /> Google로 간편 가입
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 14, color: "var(--rj-muted)", fontSize: 13 }}>
            <div className="hairline-soft" style={{ flex: 1 }} /> 또는 이메일로 가입 <div className="hairline-soft" style={{ flex: 1 }} />
          </div>
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
          <div className="field">
            <label>휴대폰 <span style={{ color: "var(--rj-muted)", fontWeight: 400 }}>· 선택 (없으면 가입 이메일로 클래스인 계정이 생성됩니다)</span></label>
            <input className="input input-lg" value={data.phone} onChange={(e) => update("phone", e.target.value)} placeholder="010-0000-0000" inputMode="tel" />
          </div>
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
            <button className="btn btn-primary btn-lg" style={{ flex: 1 }} onClick={finish} disabled={busy}>{busy ? "가입 중…" : <>가입 완료 → 마이페이지 <Icon name="arrow" size={14} /></>}</button>
          </div>
        </div>
      )}
    </div>
  );
}

window.LoginPage = LoginPage;
window.SignupPage = SignupPage;
