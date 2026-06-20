<?php
/* ──────────────────────────────────────────────────────────────────
 *  리뉴젠 아카데미 — 클래스인(ClassIn / EEO) 연동 설정
 *  ────────────────────────────────────────────────────────────────
 *  사용법:
 *   1) 이 파일을 같은 폴더에 config.php 로 복사하세요.
 *   2) SID 와 SECRET 을 본인 학원 값으로 채우세요.
 *   3) config.php 는 절대 GitHub 등 공개 저장소에 올리지 마세요.
 *      (.htaccess 가 외부 접근을 막지만, 애초에 커밋하지 않는 게 안전)
 * ──────────────────────────────────────────────────────────────── */

return [
    // 클래스인에서 발급한 학교 식별자 (School ID)
    'SID'    => '75949974',

    // ⚠️ 비밀키 — 절대 외부 노출 금지. 프론트엔드(HTML/JS)에 넣지 마세요.
    'SECRET' => 'PASTE_YOUR_SECRET_KEY_HERE',

    // 클래스인 API 호스트 (보통 그대로 둡니다)
    'API_HOST' => 'https://api.eeo.cn',

    // 데이터 수신(Data Subscription) 검증용 — 클래스인이 push 할 때
    // 약속한 토큰을 헤더/쿼리로 함께 보내도록 설정했다면 여기에 적어
    // hook.php 에서 대조합니다. 안 쓰면 빈 문자열로 두세요.
    'HOOK_TOKEN' => '',

    // 우리 홈페이지(프론트엔드) 도메인 — CORS 허용용
    // 예: 'https://renewgen.cafe24.com'
    'SITE_ORIGIN' => 'https://renewgen.com',

    // ⚠️ 토스페이먼츠 결제위젯 '시크릿 키'(gsk) — 절대 외부 노출 금지.
    //   개발자센터 → 결제위젯 연동 키에서 확인. 클라이언트 키(gck)와 한 세트여야 함.
    //   테스트: test_gsk_…  /  라이브: live_gsk_…
    //   (미설정 시 toss-confirm.php 가 문서용 테스트 시크릿키로 폴백)
    'TOSS_SECRET_KEY' => 'test_gsk_docs_2GNmP0vBQ85qBwz5rmZ8VEojaPQB',

    // MySQL (카페24에서 발급받은 DB 정보)
    'DB' => [
        'host' => 'localhost',
        'name' => 'renewgen',
        'user' => 'renewgen',
        'pass' => 'PASTE_DB_PASSWORD',
        'charset' => 'utf8mb4',
    ],
];
