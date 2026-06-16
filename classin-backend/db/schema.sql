-- ──────────────────────────────────────────────────────────────────
--  리뉴젠 아카데미 × 클래스인 연동 — MySQL 스키마
--  카페24 MySQL(utf8mb4)에서 실행하세요.
-- ──────────────────────────────────────────────────────────────────

-- 1) 클래스인이 보내주는 원본 이벤트 (Data Subscription 수신함)
CREATE TABLE IF NOT EXISTS classin_events (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  cmd         VARCHAR(64)     NOT NULL DEFAULT 'unknown',  -- 메시지 유형
  school_id   VARCHAR(32)     NULL,
  course_id   VARCHAR(32)     NULL,
  class_id    VARCHAR(32)     NULL,
  payload     MEDIUMTEXT      NULL,                        -- 원본 JSON 통째 보관
  received_at DATETIME        NOT NULL,
  PRIMARY KEY (id),
  KEY idx_course (course_id),
  KEY idx_class  (class_id),
  KEY idx_cmd    (cmd)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2) 우리 사용자 ↔ 클래스인 UID 매핑
CREATE TABLE IF NOT EXISTS classin_users (
  uid        VARCHAR(32)  NOT NULL,        -- 클래스인 UID (register 반환값)
  member_id  VARCHAR(64)  NULL,            -- 우리 홈페이지 회원 ID
  name       VARCHAR(64)  NULL,
  email      VARCHAR(128) NULL,            -- 클래스인 로그인 계정(이메일) ← 메인 매칭 키
  telephone  VARCHAR(32)  NULL,            -- 클래스인 로그인 계정(휴대폰) ← 보조 매칭 키
  role       ENUM('student','teacher') NOT NULL DEFAULT 'student',
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (uid),
  KEY idx_member (member_id),
  KEY idx_email  (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3) 코스/회차 캐시 (클래스인 courseId·classId 와 우리 강의 연결)
CREATE TABLE IF NOT EXISTS classin_classes (
  course_id  VARCHAR(32)  NOT NULL,
  class_id   VARCHAR(32)  NOT NULL,
  title      VARCHAR(255) NULL,
  begin_time DATETIME     NULL,
  end_time   DATETIME     NULL,
  is_free    TINYINT(1)   NOT NULL DEFAULT 0,   -- 1이면 무료 공개(구매 불필요)
  price      INT          NOT NULL DEFAULT 0,   -- 판매가(원)
  has_replay TINYINT(1)   NOT NULL DEFAULT 0,   -- 다시보기 준비됨
  PRIMARY KEY (course_id, class_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4) 영상 판매/수강권 — recordings.php 의 checkAccess 가 여기를 본다
CREATE TABLE IF NOT EXISTS purchases (
  id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  uid        VARCHAR(32)  NOT NULL,        -- 구매자 클래스인 UID
  course_id  VARCHAR(32)  NOT NULL,
  class_id   VARCHAR(32)  NULL,            -- 특정 회차만 구매했으면 채움(전체면 비움)
  order_no   VARCHAR(64)  NULL,            -- 결제 주문번호(카페24/PG)
  amount     INT          NOT NULL DEFAULT 0,
  purchased_at DATETIME   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME     NULL,            -- NULL=무기한, 값=수강기간 만료
  PRIMARY KEY (id),
  KEY idx_access (uid, course_id, class_id),
  KEY idx_order  (order_no)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4-b) 시험/답안카드 성적 — hook.php 가 ClassIn 'AnswerSheetScore'(OMR 답안카드)
--      'ExamScore'(테스트), 'HomeworkScore'(작업) 성적 푸시를 받아 적재한다.
--      어드민 성적표(scores.php)가 여기를 읽어 월말평가 성적표를 만든다.
--      ⚠️ 같은 시험을 학생이 재제출/재채점하면 ClassIn 이 같은 메시지를 다시 보낸다.
--         → (activity_id, student_uid, cmd) 를 UNIQUE 로 두고 UPSERT(최신값으로 덮어쓰기).
CREATE TABLE IF NOT EXISTS classin_scores (
  id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  cmd          VARCHAR(32)  NOT NULL DEFAULT 'AnswerSheetScore', -- 성적 종류
  sid          VARCHAR(32)  NULL,
  course_id    VARCHAR(32)  NULL,           -- ClassIn CourseID(클래스인 "코스/반")
  course_name  VARCHAR(255) NULL,           -- 코스명 (예: "중A")
  unit_id      VARCHAR(32)  NULL,           -- 단원 ID
  unit_name    VARCHAR(255) NULL,           -- 단원명
  activity_id  VARCHAR(32)  NOT NULL,       -- 답안카드/시험 활동 ID (= 한 회차/한 과목 시험)
  activity_name VARCHAR(255) NULL,          -- 시험 제목 (예: "중A 수학 월말평가")
  class_id     VARCHAR(32)  NULL,           -- 课节 ID (수업 중 발행 시에만)
  student_uid  VARCHAR(32)  NOT NULL,       -- 학생 ClassIn UID  ← 회원 매칭 키①
  student_name VARCHAR(128) NULL,           -- 클래스인 표시 이름
  student_account VARCHAR(64) NULL,         -- 학생 계정(휴대폰/이메일) ← 회원 매칭 키②
  member_id    VARCHAR(64)  NULL,           -- 우리 홈페이지 회원 ID (매칭되면 채움)
  max_score    FLOAT        NULL,           -- 만점
  score        FLOAT        NULL,           -- 취득 점수 (문항 합계 = 득점)
  scoring_rate FLOAT        NULL,           -- 득점률(0~1)
  topic_json   MEDIUMTEXT   NULL,           -- 문항별 정/오답 상세 (오답률 분석용)
  submitted_at DATETIME     NULL,           -- 답안카드 제출 시간
  corrected_at DATETIME     NULL,           -- 채점 시간
  received_at  DATETIME     NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uniq_attempt (activity_id, student_uid, cmd),
  KEY idx_activity (activity_id),
  KEY idx_student  (student_uid),
  KEY idx_account  (student_account),
  KEY idx_member   (member_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5) 다시보기 카탈로그 (RecordingFile 수신 시 채움 → 프론트가 목록 표시)
CREATE TABLE IF NOT EXISTS recordings (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  course_id   VARCHAR(32)  NOT NULL,
  class_id    VARCHAR(32)  NOT NULL,
  title       VARCHAR(255) NULL,
  duration    INT          NULL,           -- 초
  size_mb     INT          NULL,
  views_page  INT          NOT NULL DEFAULT 0,
  views_app   INT          NOT NULL DEFAULT 0,
  is_locked   TINYINT(1)   NOT NULL DEFAULT 0,
  ready_at    DATETIME     NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uniq_class (course_id, class_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
