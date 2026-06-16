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
  telephone  VARCHAR(32)  NULL,            -- 클래스인 로그인 계정(휴대폰)
  role       ENUM('student','teacher') NOT NULL DEFAULT 'student',
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (uid),
  KEY idx_member (member_id)
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
