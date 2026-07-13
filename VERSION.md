# 리뉴젠 아카데미 — 버전 구조 (v1 / v2)

## v1 — 현재 운영 (ClassIn 기반)
- **URL:** `https://renewgenacademy.com/`
- **엔트리:** `index.html`
- **실시간 수업 엔진:** ClassIn (훅으로 성적·출결·녹화 수신)
- **상태:** 운영 중 — 실제 수업이 계속 돌아가므로 **안정성 최우선, 함부로 바꾸지 않음**
- **태그:** `v1.0` (안정 스냅샷)

## v2 — 개발 중 (BBB 기반)
- **URL:** `https://renewgenacademy.com/v2/` (프리뷰)
- **엔트리:** `v2/index.html` — v1과 **같은 `app/`·`shared/`·`assets/` 공유**
- **차이:** 상단에서 `window.RJ_LIVE_ENGINE = "bbb"`, `window.RJ_APP_VERSION = "v2"` 플래그 설정
- **실시간 수업 엔진:** BigBlueButton(BBB) — 브라우저 내 화상수업, 앱 불필요, API 개방
- **개발 원칙:**
  - 공통 코드(마케팅·회원·성적·결제 등)는 **v1과 공유** → v1 개선이 v2에 자동 반영
  - **실시간 수업 관련 코드만** `window.RJ_LIVE_ENGINE === "bbb"` 분기로 v2에서 갈아끼움
  - v1 코드 경로는 이 플래그가 없으므로 **v1은 영향 없음(안전)**

## 작업 방식
- v1 급한 수정·운영 반영 → 평소처럼 `main` 배포
- v2(BBB) 개발 → 실시간 수업 관련 모듈을 플래그 뒤에서 추가/교체
- 두 버전은 같은 배포에 공존: 루트(=v1), `/v2/`(=v2 프리뷰)
