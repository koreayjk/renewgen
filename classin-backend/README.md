# 리뉴젠 아카데미 × 클래스인(ClassIn) 연동 — 백엔드 패키지

카페24(PHP + MySQL)에 그대로 올려서 동작하는 **실제 연동 코드**입니다.
이 폴더가 "비밀키를 안전하게 들고 클래스인 API를 호출하는 서버" 역할을 합니다.
홈페이지(HTML)는 이 서버만 부르고, 비밀키는 절대 만지지 않습니다.

```
[클래스인 api.eeo.cn]  ←(SID+SECRET 서명)→  [이 폴더 / 카페24 PHP]  ←(fetch)→  [홈페이지 화면]
```

---

## 📁 구성

| 파일 | 역할 | 클래스인 API |
|---|---|---|
| `config.sample.php` | 설정 템플릿 → `config.php` 로 복사해 채움 | — |
| `lib/classin.php` | 서명·요청 코어 (v1 safeKey + v2 헤더서명) | 인증 |
| `api/enter.php` | **원클릭 입장 URL 발급** | `getLoginLinked` |
| `api/recordings.php` | **다시보기 재생 주소** (수강권 확인 포함) | `getWebcastUrl` |
| `api/hook.php` | **데이터 수신** (출석·트로피·정답·리포트·**OMR 답안카드 성적**) | Data Subscription |
| `api/scores.php` | **성적 조회** (어드민 성적표가 호출) | — (DB 조회) |
| `api/sync-user.php` | **회원 ↔ 클래스인 계정 연결** (회원가입 시 1회) | `register` |
| `db/schema.sql` | MySQL 테이블 (이벤트·구매·다시보기·**성적**·**계정매핑**) | — |
| `frontend-example/classin-live.js` | 홈페이지에서 호출하는 예시 JS | — |
| `.htaccess` | config·logs 외부 접근 차단 | — |

---

## 🚀 카페24 설치 (5단계)

### 1. 업로드
이 `classin-backend` 폴더를 FTP로 웹폴더에 올리고 이름을 **`classin`** 으로 두세요.
→ 최종 주소 예: `https://renewgen.com/classin/api/enter.php`

### 2. 설정 파일 만들기
`config.sample.php` 를 같은 폴더에 **`config.php`** 로 복사하고 값을 채웁니다.
```php
'SID'    => '75949974',
'SECRET' => '본사에서 받은 진짜 비밀키',   // ← 여기에 붙여넣기
'SITE_ORIGIN' => 'https://renewgen.com', // ← 홈페이지 도메인
'DB' => [ ... 카페24 MySQL 정보 ... ],
```
> ⚠️ `config.php` 는 GitHub 등 공개 저장소에 올리지 마세요.

### 3. DB 만들기
카페24 **MySQL 관리 → phpMyAdmin** 에서 `db/schema.sql` 내용을 실행하면
필요한 테이블(이벤트·구매·다시보기 등)이 생성됩니다.

### 4. 데이터 수신 주소 등록
클래스인 본사/관리콘솔에 **데이터 수신(Data Subscription) 주소**로 아래를 등록 요청하세요.
```
https://renewgen.com/classin/api/hook.php
```
이 주소로 클래스인이 출석·트로피·정답·수업요약을 실시간으로 보내줍니다.
(수신은 한 시스템으로만 가능 / 과거 데이터 소급은 안 됨)

### 5. 홈페이지 버튼 연결
`frontend-example/classin-live.js` 를 홈페이지에 넣고,
입장 버튼의 동작을 `enterClassroom({uid, courseId, classId})` 로 바꾸면 끝입니다.

---

## 🔑 인증 방식 (개발자 참고)

클래스인 공식 규칙(docs.eeo.cn) 그대로 구현되어 있습니다.

- **v1** (대부분의 엔드포인트, `course.api.php`)
  `safeKey = MD5(SECRET + timeStamp)` — POST body 에 `SID, safeKey, timeStamp` 동봉
- **v2** (신규 LMS 엔드포인트)
  헤더 `X-EEO-SIGN = md5('정렬된파라미터&key=SECRET')`, `X-EEO-UID=SID`, `X-EEO-TS=timeStamp`
- 성공 판정: `error_info.errno === 1`

`lib/classin.php` 의 `call()`(v1) / `callV2()`(v2) 로 어떤 엔드포인트든 호출할 수 있습니다.
예) 계정 등록:
```php
$ci = new ClassIn(require 'config.php');
$r = $ci->call('register', ['telephone' => '01012345678', 'password' => '...']);
$uid = $r['data'] ?? null;
```

---

## 💰 "영상 판매" 흐름은 어디까지가 클래스인인가

| 단계 | 담당 |
|---|---|
| 실강 진행 / 자동 녹화 | **클래스인** |
| 녹화본 재생 주소 발급 | **클래스인** (`getWebcastUrl`) |
| 결제 / 주문 / 수강권 | **우리 서버** (카페24 PG + `purchases` 테이블) |
| "산 사람만 잠금해제" 판정 | **우리 서버** (`recordings.php` 의 `checkAccess`) |

즉 **녹화 영상은 클래스인이 주고, "팔고 잠그는" 건 우리 서버**가 합니다.
`recordings.php` 가 구매 여부를 먼저 확인한 뒤에만 재생 주소를 내주도록 이미 짜여 있습니다.
카페24 결제(또는 PG)가 성공하면 `purchases` 에 1줄 INSERT 하면 그 사람부터 시청 가능해집니다.

---

## ✅ 동작 점검

설치 후 브라우저/curl 로 확인:
```bash
# 입장 링크 발급 테스트 (실제 uid/courseId/classId 필요)
curl -X POST https://renewgen.com/classin/api/enter.php \
  -H "Content-Type: application/json" \
  -d '{"uid":"10293847","courseId":"444451","classId":"1424463"}'
```
정상이면 `{"ok":true,"launchUrl":"classin://...","invokeUrl":"https://..."}` 가 옵니다.
`logs/날짜.log` 에 수신/오류 기록이 남습니다.

---

## 📊 OMR 답안카드 성적 자동 수신 (엑셀 업로드 대체)

클래스인 **답안카드(OMR)** 로 시험을 보면 — 시험지는 PDF로 올리고 학생은 OMR에 답을
작성, 클래스인이 자동 채점 — 그 성적을 클래스인이 **데이터 수신(push)** 으로 쏴줍니다.
조회(pull) API는 없고, **푸시만** 지원하므로 `hook.php` 로 받아 쌓는 구조입니다.

```
[학생 OMR 제출] → [클래스인 자동채점] → push(AnswerSheetScore) → hook.php → classin_scores
                                                                          ↓
                          어드민 성적표 ──fetch── scores.php ─────────────┘
```

**받는 메시지 (`Cmd`)**
| Cmd | 무엇 | 비고 |
|---|---|---|
| `AnswerSheetScore` | **OMR 답안카드 성적** | 월말평가 핵심. 자동채점 즉시 푸시 |
| `ExamScore` | LMS 테스트(측험) 성적 | 자동/수동 채점 모두 |
| `HomeworkScore` | 작업(숙제) 성적 | 교사 채점 후 |

`hook.php` 의 `saveScore()` 가 위 메시지를 받아 `classin_scores` 에 **UPSERT** 합니다
(같은 시험을 재채점하면 같은 행을 최신값으로 덮어씀).
취득점수는 문항별 `TopicScore` 합계, 없으면 `StudentScoringRate × 만점` 으로 계산합니다.

**어드민에서 쓰는 법**
- 홈페이지 어드민 → 성적표 → **"클래스인에서 자동으로 불러오기"** 버튼 → 회차 생성.
- CSV 업로드도 그대로 남아 있어, 과거 데이터/백업용으로 병행 가능합니다.

**⚠️ 전제 조건**
1. 시험을 **LMS(단원·課堂활동) 안의 답안카드** 로 출제해야 LMS 성적 푸시가 옵니다.
2. 본사/관리콘솔에 `hook.php` 주소를 등록하고 **LMS 메시지 수신을 켜** 달라고 요청.
3. 수신은 **한 시스템으로만**, **과거 시험 소급 불가**(등록 시점부터).
4. 활동 제목을 `"중A 수학 월말평가"` 처럼 두면 레벨·과목이 자동 분류됩니다.

---

## 🪪 "회원가입한 사람 = 이 클래스인 학생" 식별 방법

핵심 열쇠는 **가입 이메일**입니다. 같은 이메일 = 같은 클래스인 계정 = 같은 **UID**.
(휴대폰은 선택 — 입력하면 보조 매칭 키로 함께 저장됩니다.)

```
[리뉴젠 회원가입(이메일)] → sync-user.php → register(email) → 클래스인 UID 반환
                                              ↓
                                    classin_users (uid ↔ member_id · email 저장)
                                              ↓
   이후 OMR 성적 푸시(StudentUid·StudentAccount=이메일)가 이 매핑으로 회원에 자동 연결
```

1. **회원가입 시 1회** `sync-user.php` 호출 (`email`, `memberId` 전달 · `telephone` 선택).
2. 클래스인 `register` 가 그 이메일의 **UID** 를 돌려줌.
   - 클래스인 계정이 **없으면** → 가입 이메일로 새로 만들어 새 UID 발급.
   - 그 이메일로 **이미 클래스인 계정이 있으면** → `errno=461` 과 함께 **기존 UID** 를
     주므로 그대로 저장 → 자동으로 같은 UID 에 연결(동일인 보장).
   - (휴대폰까지 넘겼고 그 번호가 이미 있으면 `errno=135` 도 동일 처리.)
3. `classin_scores` 의 `StudentUid`(1순위) / `StudentAccount`(이메일·휴대폰) 로 회원과 매칭.
   가입 전에 본 시험도 `sync-user.php` 가 `member_id` 를 **소급 연결**합니다.

> **Q. 클래스인 계정 이메일과 같은 이메일로 홈페이지도 가입해야 하나요?**
> 학생에게 **기존 클래스인 계정이 있다면, 그 이메일과 같은 이메일로 홈페이지에 가입**해야
> 자동으로 같은 UID 에 붙습니다(이메일이 다르면 클래스인이 다른 계정으로 인식).
> 기존 계정이 없다면 신경 쓸 필요 없습니다 — 가입 이메일로 계정이 새로 만들어집니다.
>
> **Q. 같은 이메일이면 UID 가 자동으로 공유되나요?**
> 네. 같은 이메일은 항상 하나의 UID 로 귀결됩니다. `register` 가 그 이메일에 대해
> 신규면 새 UID, 기존이면 `errno=461 + 기존 UID` 를 돌려주고 우리가 그대로 저장하므로
> **자동으로 공유**됩니다. 학생 본인 성적표(마이페이지)는 이 `member_id` 로 자기 성적만 봅니다.
