/* global React, useApp, Icon */
// ════════════════════════════════════════════════════════════════════
//   법적 고지 — 이용약관 / 개인정보처리방침 / 환불규정
//   라우트: /terms · /privacy · /refund
//   ⚠️ 사업자 정보·보호책임자 연락처·시행일 등 일부 값은 운영 정보에 맞게
//      확정해 주세요(아래 LEGAL_INFO 한 곳만 고치면 전부 반영됩니다).
// ════════════════════════════════════════════════════════════════════

const LG_NAVY = "var(--acad-navy)";
const LG_YEL = "var(--acad-yellow)";
const LG_PAPER = "var(--acad-paper)";
const LG_LINE = "var(--acad-line)";
const LG_INK = "var(--acad-ink)";
const LG_MUTED = "var(--acad-muted)";

// 한 곳에서 관리하는 사업자/연락처 정보 (실제 값으로 확정해 주세요)
const LEGAL_INFO = {
  company: "㈜리뉴젠",
  service: "리뉴젠 아카데미",
  ceo: "강이수",
  bizNo: "215-87-01284",
  mailOrder: "2026-서울강남-0418",
  address: "서울특별시 강남구 테헤란로 318, 7층",
  email: "help@renewgen.com",          // ← 실제 문의 이메일로 변경
  privacyOfficer: "강이수",            // 개인정보 보호책임자
  effectiveDate: "2026년 6월 28일",     // 시행일
};

// ── 공통 레이아웃 ───────────────────────────────────────────────────
function LegalLayout({ tag, title, sub, children }) {
  return (
    <div className="page-enter">
      <section style={{ background: LG_NAVY, color: "#fff", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(55% 90% at 88% 0%, rgba(255,214,10,0.14), transparent 60%)", pointerEvents: "none" }} />
        <div className="container-wide" style={{ position: "relative", paddingTop: 64, paddingBottom: 48 }}>
          <span style={{ display: "inline-block", background: LG_YEL, color: LG_NAVY, fontWeight: 800, fontSize: 13, padding: "7px 13px", borderRadius: 5, whiteSpace: "nowrap" }}>{tag}</span>
          <h1 style={{ fontWeight: 900, fontSize: "clamp(34px, 4.4vw, 54px)", letterSpacing: "-0.045em", lineHeight: 1.1, margin: "18px 0 0" }}>{title}</h1>
          {sub && <p style={{ fontSize: 15.5, lineHeight: 1.65, color: "rgba(255,255,255,0.78)", maxWidth: 680, marginTop: 14, fontWeight: 500 }}>{sub}</p>}
        </div>
      </section>
      <section style={{ background: LG_PAPER }}>
        <div className="container-wide" style={{ paddingTop: 48, paddingBottom: 90, maxWidth: 920 }}>
          {children}
          <div style={{ marginTop: 40, paddingTop: 20, borderTop: "1px solid " + LG_LINE, fontSize: 13, color: LG_MUTED, lineHeight: 1.7 }}>
            <div>시행일: {LEGAL_INFO.effectiveDate}</div>
            <div style={{ marginTop: 4 }}>{LEGAL_INFO.company} · 대표 {LEGAL_INFO.ceo} · 사업자등록번호 {LEGAL_INFO.bizNo} · 통신판매업신고 {LEGAL_INFO.mailOrder}</div>
            <div style={{ marginTop: 2 }}>{LEGAL_INFO.address} · 문의 {LEGAL_INFO.email}</div>
          </div>
        </div>
      </section>
    </div>
  );
}

// 본문 항목 렌더 — 문자열은 단락, {ol} 은 번호목록, React 엘리먼트는 그대로
function LItem(item, i) {
  if (item && item.ol) {
    return (
      <ol key={i} style={{ margin: "10px 0 0", padding: "0 0 0 20px", display: "grid", gap: 8 }}>
        {item.ol.map((t, j) => (
          <li key={j} style={{ fontSize: 14.5, lineHeight: 1.75, color: LG_INK, fontWeight: 500 }}>{t}</li>
        ))}
      </ol>
    );
  }
  if (React.isValidElement(item)) return <div key={i} style={{ marginTop: 14 }}>{item}</div>;
  return <p key={i} style={{ margin: "10px 0 0", fontSize: 14.5, lineHeight: 1.8, color: LG_INK, fontWeight: 500 }}>{item}</p>;
}

function LSection({ title, items }) {
  return (
    <section style={{ marginTop: 30 }}>
      <h2 style={{ fontWeight: 900, fontSize: 18, letterSpacing: "-0.03em", color: LG_NAVY, margin: 0, paddingBottom: 8, borderBottom: "2px solid " + LG_NAVY }}>{title}</h2>
      {items.map(LItem)}
    </section>
  );
}

// ── 환불규정 표 (이용약관·환불규정 공용) ────────────────────────────
function RefundTable() {
  const rows = [
    ["개강 전", "전액 환불"],
    ["개강 후 1개월 이내", "2개월분 환불"],
    ["개강 후 45일 이내", "45일분 환불"],
    ["개강 후 45일 이후", "환불 불가"],
  ];
  return (
    <div style={{ border: "1.5px solid " + LG_NAVY, borderRadius: 12, overflow: "hidden", marginTop: 4 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", background: LG_NAVY, color: "#fff" }}>
        <div style={{ padding: "13px 18px", fontWeight: 800, fontSize: 14.5 }}>환불 사유 발생 시점</div>
        <div style={{ padding: "13px 18px", fontWeight: 800, fontSize: 14.5, borderLeft: "1px solid rgba(255,255,255,0.18)" }}>환불 금액</div>
      </div>
      {rows.map(([a, b], i) => (
        <div key={a} style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", borderTop: "1px solid " + LG_LINE, background: i % 2 ? "rgba(0,29,61,0.03)" : "#fff" }}>
          <div style={{ padding: "13px 18px", fontWeight: 700, fontSize: 14.5, color: LG_NAVY }}>{a}</div>
          <div style={{ padding: "13px 18px", fontSize: 14.5, color: LG_INK, fontWeight: 600, borderLeft: "1px solid " + LG_LINE }}>{b}</div>
        </div>
      ))}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
//   이용약관
// ════════════════════════════════════════════════════════════════════
function TermsPage() {
  const I = LEGAL_INFO;
  const SECTIONS = [
    { title: "제1조 (목적)", items: [
      `이 약관은 ${I.company}(이하 “회사”)가 운영하는 ${I.service} 웹사이트 및 관련 서비스(이하 “서비스”)의 이용과 관련하여, 회사와 이용자 간의 권리·의무 및 책임사항, 이용조건 및 절차 등 기본적인 사항을 규정함을 목적으로 합니다.`,
    ]},
    { title: "제2조 (용어의 정의)", items: [
      { ol: [
        "“서비스”란 회사가 온라인으로 제공하는 강의 영상(녹화본 포함), 교재, 학습관리 등 일체의 교육 서비스를 말합니다.",
        "“회원”이란 이 약관에 동의하고 회원가입을 완료하여 서비스를 이용하는 자를 말합니다.",
        "“수강생”이란 강좌를 신청·결제하여 수강하는 회원을 말합니다.",
        "“콘텐츠”란 회사가 서비스에서 제공하는 강의 영상, 교재, 자료, 이미지 등 일체의 저작물을 말합니다.",
      ]},
    ]},
    { title: "제3조 (약관의 게시와 개정)", items: [
      "회사는 이 약관의 내용을 이용자가 쉽게 확인할 수 있도록 서비스 화면에 게시합니다.",
      "회사는 관계 법령을 위배하지 않는 범위에서 이 약관을 개정할 수 있으며, 개정 시 적용일자 및 개정사유를 명시하여 적용일 7일 전(이용자에게 불리하거나 중대한 변경은 30일 전)부터 공지합니다.",
      "이용자가 개정 약관의 적용일까지 거부 의사를 표시하지 않으면 개정에 동의한 것으로 봅니다.",
    ]},
    { title: "제4조 (서비스의 제공 및 변경)", items: [
      "회사는 강의 콘텐츠 제공, 학습관리, 평가·성적 안내 등의 서비스를 제공합니다.",
      "서비스는 연중무휴, 1일 24시간 제공함을 원칙으로 하나, 시스템 점검·교체, 통신 장애, 천재지변 등 부득이한 사유가 있는 경우 일시 중단될 수 있습니다.",
      "회사는 운영상·기술상 필요에 따라 제공 중인 콘텐츠나 서비스의 전부 또는 일부를 변경할 수 있으며, 중요한 변경은 사전에 공지합니다.",
    ]},
    { title: "제5조 (회원가입 및 계정 관리)", items: [
      "이용자는 회사가 정한 절차에 따라 회원정보를 기재하고 이 약관에 동의함으로써 회원가입을 신청합니다.",
      "회원은 가입 시 기재한 정보가 사실과 일치하도록 유지하여야 하며, 계정(이메일·비밀번호)을 직접 관리할 책임이 있습니다.",
      "회원의 계정은 본인만 이용할 수 있으며, 제3자에게 양도·대여·공유할 수 없습니다.",
    ]},
    { title: "제6조 (회원 탈퇴 및 이용제한)", items: [
      "회원은 언제든지 탈퇴를 요청할 수 있으며, 회사는 관계 법령이 정하는 바에 따라 이를 처리합니다.",
      "회원이 다음 각 호에 해당하는 경우 회사는 이용을 제한하거나 회원자격을 정지·상실시킬 수 있습니다.",
      { ol: [
        "타인의 정보를 도용하거나 허위 정보를 기재한 경우",
        "콘텐츠를 무단으로 복제·배포·공유하는 등 회사 또는 제3자의 권리를 침해한 경우",
        "서비스의 정상적인 운영을 고의로 방해한 경우",
        "기타 관계 법령 또는 이 약관에 위배되는 행위를 한 경우",
      ]},
    ]},
    { title: "제7조 (수강 신청 및 결제)", items: [
      "이용자는 회사가 정한 방법으로 강좌(또는 구독)를 신청하고 대금을 결제함으로써 수강할 수 있습니다.",
      "결제는 신용카드 등 회사가 제공하는 결제수단을 통해 이루어지며, 결제대행사를 통해 처리될 수 있습니다.",
      "회사는 결제 완료 후 수강에 필요한 정보를 회원에게 안내합니다.",
    ]},
    { title: "제8조 (환불 규정)", items: [
      "수강료 환불은 아래 기준에 따릅니다. 환불 사유 발생 시점은 환불 요청 접수일을 기준으로 합니다.",
      <RefundTable />,
      "환불 시 회사가 무료로 제공한 교재·사은품 등이 있는 경우, 그 상당액을 공제한 후 환불할 수 있습니다.",
      "기타 이 약관에 정하지 않은 사항은 「학원의 설립·운영 및 과외교습에 관한 법률」 등 관계 법령 및 소비자분쟁해결기준에 따릅니다.",
    ]},
    { title: "제9조 (콘텐츠의 저작권)", items: [
      "서비스에서 제공하는 모든 강의 영상·교재·자료 등 콘텐츠의 저작권은 회사 또는 정당한 권리자에게 있습니다.",
      "회원은 제공받은 콘텐츠를 수강 목적의 개인적 이용 범위를 넘어 복제·녹화·캡처·전송·배포·공유하거나 영리 목적으로 사용할 수 없습니다.",
      "이를 위반하여 발생한 모든 법적 책임은 위반한 회원에게 있습니다.",
    ]},
    { title: "제10조 (이용자의 의무)", items: [
      "이용자는 관계 법령, 이 약관의 규정, 이용안내 및 회사가 공지한 사항을 준수하여야 하며, 회사의 업무를 방해하는 행위를 하여서는 안 됩니다.",
    ]},
    { title: "제11조 (회사의 면책)", items: [
      "회사는 천재지변, 통신 장애 등 회사의 책임 없는 사유로 서비스를 제공할 수 없는 경우 그에 대한 책임이 면제됩니다.",
      "회사는 이용자의 귀책사유로 인한 서비스 이용 장애나, 이용자 상호 간 또는 이용자와 제3자 간에 발생한 분쟁에 대하여 책임을 지지 않습니다.",
    ]},
    { title: "제12조 (분쟁의 해결 및 준거법)", items: [
      "회사와 이용자 간에 발생한 분쟁은 상호 신의에 따라 원만히 해결함을 원칙으로 합니다.",
      "원만히 해결되지 않은 분쟁에 대하여는 대한민국 법령을 준거법으로 하며, 관할 법원은 민사소송법에 따른 법원으로 합니다.",
    ]},
  ];
  return (
    <LegalLayout tag="이용약관 · Terms" title="이용약관" sub={`${I.service} 서비스 이용에 관한 회사와 이용자 간의 권리·의무를 규정합니다.`}>
      {SECTIONS.map((s) => <LSection key={s.title} title={s.title} items={s.items} />)}
    </LegalLayout>
  );
}

// ════════════════════════════════════════════════════════════════════
//   환불규정 (단독 페이지)
// ════════════════════════════════════════════════════════════════════
function RefundPage() {
  return (
    <LegalLayout tag="환불규정 · Refund" title="환불규정" sub="수강료 환불은 아래 기준에 따라 처리됩니다.">
      <LSection title="환불 기준" items={[
        "환불 사유 발생 시점(환불 요청 접수일)을 기준으로 아래와 같이 환불액을 산정합니다.",
        <RefundTable />,
      ]} />
      <LSection title="유의사항" items={[
        "환불 시 회사가 무료로 제공한 교재·사은품 등이 있는 경우, 그 상당액을 공제한 후 환불할 수 있습니다.",
        "환불은 결제하신 수단으로 처리됨을 원칙으로 하며, 결제대행사 정책에 따라 영업일 기준 처리 기간이 소요될 수 있습니다.",
        "기타 이 규정에 정하지 않은 사항은 「학원의 설립·운영 및 과외교습에 관한 법률」 등 관계 법령 및 소비자분쟁해결기준에 따릅니다.",
      ]} />
    </LegalLayout>
  );
}

// ════════════════════════════════════════════════════════════════════
//   개인정보처리방침
// ════════════════════════════════════════════════════════════════════
function PrivacyPage() {
  const I = LEGAL_INFO;
  const SECTIONS = [
    { title: "1. 총칙", items: [
      `${I.company}(이하 “회사”)는 「개인정보 보호법」 등 관계 법령을 준수하며, 이용자의 개인정보를 보호하기 위하여 다음과 같이 개인정보처리방침을 수립·공개합니다.`,
    ]},
    { title: "2. 수집하는 개인정보 항목", items: [
      { ol: [
        "회원가입(필수): 이름, 이메일, 비밀번호",
        "회원가입(선택): 학년, 학교, 과목, 연령, 휴대전화번호",
        "결제 시: 결제수단 정보(카드사 승인정보 등은 결제대행사를 통해 처리)",
        "자동 수집: 서비스 이용기록, 접속 로그, 쿠키, 기기·브라우저 정보",
      ]},
    ]},
    { title: "3. 개인정보의 수집·이용 목적", items: [
      { ol: [
        "회원 식별 및 가입의사 확인, 본인 인증, 계정 관리",
        "강의·교재 등 서비스 제공, 수강 신청·결제 및 정산",
        "학습관리(출결·과제·평가·성적 안내) 및 고객 문의 응대",
        "공지사항 전달, 서비스 개선 및 통계 분석",
      ]},
    ]},
    { title: "4. 개인정보의 보유 및 이용 기간", items: [
      "회사는 원칙적으로 회원 탈퇴 시 지체 없이 개인정보를 파기합니다. 다만, 관계 법령에 따라 다음과 같이 일정 기간 보존합니다.",
      { ol: [
        "계약 또는 청약철회 등에 관한 기록: 5년 (전자상거래 등에서의 소비자보호에 관한 법률)",
        "대금결제 및 재화 등의 공급에 관한 기록: 5년",
        "소비자의 불만 또는 분쟁처리에 관한 기록: 3년",
        "표시·광고에 관한 기록: 6개월",
        "접속에 관한 로그기록: 3개월 (통신비밀보호법)",
      ]},
    ]},
    { title: "5. 개인정보 처리의 위탁", items: [
      "회사는 원활한 서비스 제공을 위하여 필요한 범위에서 아래 업무를 외부에 위탁할 수 있으며, 위탁계약 시 개인정보가 안전하게 관리되도록 필요한 사항을 규정합니다.",
      { ol: [
        "결제 처리: 결제대행사",
        "서버·클라우드 인프라 운영: 클라우드 서비스 제공사",
        "학습 플랫폼(LMS) 운영: 학습관리 시스템 제공사",
      ]},
      "※ 위탁 업체명은 운영 현황에 맞게 확정하여 기재해 주세요.",
    ]},
    { title: "6. 개인정보의 제3자 제공", items: [
      "회사는 이용자의 개인정보를 원칙적으로 외부에 제공하지 않습니다. 다만, 이용자가 사전에 동의한 경우 또는 법령에 따라 요구되는 경우에 한하여 제공할 수 있습니다.",
    ]},
    { title: "7. 정보주체의 권리·의무 및 행사 방법", items: [
      "이용자는 언제든지 자신의 개인정보에 대한 열람·정정·삭제·처리정지를 요청할 수 있으며, 회사는 관계 법령에 따라 지체 없이 조치합니다.",
      "권리 행사는 서비스 내 계정 설정 또는 아래 개인정보 보호책임자에게 서면·이메일 등으로 요청할 수 있습니다.",
    ]},
    { title: "8. 개인정보의 파기", items: [
      "보유기간이 경과하거나 처리 목적이 달성된 개인정보는 지체 없이 파기합니다. 전자적 파일은 복구가 불가능한 방법으로 삭제하고, 출력물은 분쇄 또는 소각합니다.",
    ]},
    { title: "9. 개인정보의 안전성 확보 조치", items: [
      "회사는 개인정보의 안전한 처리를 위하여 접근권한 관리, 비밀번호 암호화, 접속기록 보관, 보안 프로그램 운영 등 관리적·기술적 보호조치를 취합니다.",
    ]},
    { title: "10. 쿠키의 운영", items: [
      "회사는 맞춤형 서비스 제공을 위해 쿠키를 사용할 수 있으며, 이용자는 브라우저 설정을 통해 쿠키 저장을 거부할 수 있습니다. 다만 이 경우 일부 서비스 이용에 제한이 있을 수 있습니다.",
    ]},
    { title: "11. 개인정보 보호책임자", items: [
      { ol: [
        `개인정보 보호책임자: ${I.privacyOfficer}`,
        `연락처(이메일): ${I.email}`,
      ]},
      "이용자는 서비스 이용 중 발생하는 개인정보 관련 문의·불만·피해구제를 위 책임자에게 문의할 수 있습니다.",
    ]},
    { title: "12. 고지의 의무", items: [
      "이 개인정보처리방침은 법령·정책 또는 보안기술의 변경에 따라 내용이 추가·삭제·수정될 수 있으며, 변경 시 서비스 화면을 통해 공지합니다.",
    ]},
  ];
  return (
    <LegalLayout tag="개인정보처리방침 · Privacy" title="개인정보처리방침" sub={`${I.company}는 이용자의 개인정보를 소중히 보호합니다.`}>
      {SECTIONS.map((s) => <LSection key={s.title} title={s.title} items={s.items} />)}
    </LegalLayout>
  );
}

Object.assign(window, { TermsPage, PrivacyPage, RefundPage });
