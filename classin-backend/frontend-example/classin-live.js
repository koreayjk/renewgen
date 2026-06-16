/* ──────────────────────────────────────────────────────────────────
 *  classin-live.js — 프론트엔드(홈페이지)에서 백엔드를 호출하는 예시
 *  ────────────────────────────────────────────────────────────────
 *  지금 "리뉴젠 아카데미.html" 의 입장 버튼은 목업입니다.
 *  실제 연동 시, 그 onClick 을 아래 enterClassroom() 로 바꾸면 됩니다.
 *
 *  ⚠️ 비밀키(SECRET)는 여기 절대 없습니다. 프론트는 "우리 서버"만 부르고,
 *     서명/시크릿은 카페24의 PHP(api/enter.php)가 처리합니다.
 * ──────────────────────────────────────────────────────────────── */

// 우리 백엔드 위치 (카페24에 업로드한 폴더 기준)
const CLASSIN_API = "/classin/api";

/** 원클릭 입장 — getLoginLinked 로 받은 링크로 클래스인 앱 실행 */
async function enterClassroom({ uid, courseId, classId }) {
  // 모바일/PC 구분 (1=Win/Mac, 2=iOS, 3=Android)
  const ua = navigator.userAgent;
  const deviceType = /iPhone|iPad|iPod/i.test(ua) ? 2 : /Android/i.test(ua) ? 3 : 1;

  const res = await fetch(`${CLASSIN_API}/enter.php`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include", // 로그인 세션 쿠키 전달
    body: JSON.stringify({ uid, courseId, classId, deviceType }),
  });
  const json = await res.json();

  if (!json.ok) {
    alert(json.msg || "입장 링크 발급에 실패했습니다.");
    return;
  }
  // invokeUrl: 클라이언트 미설치 시 안내까지 포함된 안전한 링크
  window.location.href = json.invokeUrl || json.launchUrl;
}

/** 다시보기 재생 — 수강권 확인 후 재생 주소 받기 */
async function playRecording({ uid, courseId, classId }) {
  const res = await fetch(`${CLASSIN_API}/recordings.php`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ uid, courseId, classId }),
  });
  if (res.status === 402) {
    // 수강권 없음 → 구매 페이지로
    location.hash = "#/subscribe";
    return;
  }
  const json = await res.json();
  if (!json.ok) { alert(json.msg || "재생 주소 조회 실패"); return; }
  return json.data; // 플레이어에 넘길 재생 주소(들)
}

// 전역 노출 (HTML 의 버튼에서 사용)
window.enterClassroom = enterClassroom;
window.playRecording = playRecording;

/* 사용 예 (리뉴젠 아카데미.html 의 입장 버튼 자리):
 *
 *   <button onclick="enterClassroom({
 *      uid: CURRENT_USER.classinUid,   // 로그인 사용자의 클래스인 UID
 *      courseId: '444451',             // 강의 courseId
 *      classId:  '1424463'             // 오늘 회차 classId
 *   })">원클릭 입장</button>
 */
