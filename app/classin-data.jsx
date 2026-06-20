/* global window, COURSES, INSTRUCTORS */
// ──────────────────────────────────────────────────────────────────
// ClassIn API — mock data layer
// Mirrors the five API chapters in the ClassIn docs:
//   User · Classroom · Cloud Disk · Broadcast · Data Subscription
// Plus Login/Download URL helpers. All values are demo/mock — a real
// integration pushes these via the SID/Secret + a backend endpoint.
// ──────────────────────────────────────────────────────────────────

// Connection identity (from the test API registered for Renewjen Academy)
const CLASSIN = {
  sid: "75949974",
  secretMasked: "••••••••••••••••",
  school: "리뉴젠 아카데미",
  plan: "School 계정 (강사 15 · 수업 3만 시간)",
  apiBase: "https://api.eeo.cn",
  docs: "https://docs.eeo.cn/api/en/",
  status: "connected",        // connected | pending | error
  testApproved: true,         // 본사 승인 완료
  dataEndpoint: "https://api.renewjen.kr/classin/hook",
  lastSync: "방금 전",
};

// The student viewing the dashboard (their ClassIn user record)
const CLASSIN_ME = {
  uid: "10293847",
  name: "한도윤",
  initials: "도윤",
  mobile: "+82 10-4xxx-2841",
  email: "student@renewjen.kr",
  identity: "student",
  device: "MacBook Pro · ClassIn 5.2.1",
};

// Roster used across realtime + roster views
const ROSTER = [
  { uid: "10293847", name: "한도윤", initials: "도윤", me: true,  device: "Mac",     net: 96, cpu: 22, cam: false, mic: true,  stage: false, online: true },
  { uid: "10288120", name: "김민재", initials: "민재", me: false, device: "Windows", net: 88, cpu: 41, cam: true,  mic: false, stage: true,  online: true },
  { uid: "10277431", name: "이수아", initials: "수아", me: false, device: "iPad",    net: 73, cpu: 33, cam: true,  mic: true,  stage: true,  online: true },
  { uid: "10266902", name: "박현우", initials: "현우", me: false, device: "Android", net: 41, cpu: 64, cam: false, mic: false, stage: false, online: true },
  { uid: "10255810", name: "정은비", initials: "은비", me: false, device: "Mac",     net: 91, cpu: 28, cam: true,  mic: true,  stage: false, online: true },
  { uid: "10244773", name: "최지호", initials: "지호", me: false, device: "Windows", net: 67, cpu: 52, cam: false, mic: false, stage: false, online: true },
  { uid: "10233655", name: "윤서연", initials: "서연", me: false, device: "iPhone",  net: 80, cpu: 30, cam: true,  mic: true,  stage: false, online: true },
  { uid: "10222019", name: "장도현", initials: "도현", me: false, device: "Mac",     net: 0,  cpu: 0,  cam: false, mic: false, stage: false, online: false },
];

// ── Data Subscription — realtime class signals ──────────────────────
// Each maps to a message type in the ClassIn Data Subscription doc.
const REALTIME = {
  classId: "RJ-2026-MATH-A1-0522",
  courseId: "math-calc-2026",
  startedAt: "20:00",
  elapsed: "00:42:18",
  recording: true,           // Recording Start
  online: 187,
  capacity: 200,
  attendance: { present: 184, late: 3, absent: 13, rate: 93 },   // Enter / Exit
  handsUp: 6,                // Hands Up
  rewards: 41,               // Rewards (trophy)
  myRewards: 5,
  // Selector / Responder tool results
  poll: {
    cmd: "selector",
    question: "lim(x→0) sin x / x 의 값은?",
    options: ["0", "1", "∞", "정의되지 않음"],
    correct: 1,
    dist: [12, 156, 9, 7],
    participants: 184,
    committed: 178,
  },
  // Network Condition + Equipment Detection feed
  helpSeeking: 2,            // Help Seeking
  muted: 31,                 // Mute (by teacher)
  onStage: 2,                // Up / down the stage
  // live event ticker (Hands Up / Rewards / Enter / Exit / Help)
  feed: [
    { t: "20:42:02", type: "reward",  who: "이수아", msg: "트로피 +1 (정답 발표)" },
    { t: "20:41:48", type: "handsup", who: "김민재", msg: "손들기" },
    { t: "20:41:30", type: "answer",  who: "184명",  msg: "Selector 응답 수집 완료 · 정답률 85%" },
    { t: "20:40:55", type: "help",    who: "박현우", msg: "도움 요청 — '풀이 3번 다시 설명'" },
    { t: "20:40:12", type: "enter",   who: "윤서연", msg: "입장 (iPhone)" },
    { t: "20:39:40", type: "stage",   who: "이수아", msg: "온 스테이지" },
    { t: "20:39:02", type: "reward",  who: "정은비", msg: "트로피 +1" },
    { t: "20:38:30", type: "mute",    who: "강사",   msg: "전체 마이크 음소거" },
  ],
};

// ── Broadcast — recordings / replay (Recording File, Watching Data) ─
const RECORDINGS = [
  { id: "rec-0519", courseId: "math-calc-2026", title: "3주차 2강 — 여러 가지 함수의 미분", date: "2026.05.19", start: "20:00", end: "21:32", duration: "1:32:11", size: "842 MB", viewsPage: 1240, viewsApp: 980, locked: false, ready: true },
  { id: "rec-0517", courseId: "math-calc-2026", title: "3주차 1강 — 미분계수의 기하적 의미", date: "2026.05.17", start: "20:00", end: "21:28", duration: "1:28:40", size: "806 MB", viewsPage: 1602, viewsApp: 1120, locked: false, ready: true },
  { id: "rec-0515", courseId: "korean-lit-2026", title: "2주차 — 주제어와 흐름 어휘", date: "2026.05.15", start: "19:00", end: "20:24", duration: "1:24:03", size: "770 MB", viewsPage: 2104, viewsApp: 1530, locked: false, ready: true },
  { id: "rec-0512", courseId: "english-struct-2026", title: "1주차 — 구조의 원자: 5형식 재정의", date: "2026.05.12", start: "21:00", end: "22:10", duration: "1:10:55", size: "640 MB", viewsPage: 880, viewsApp: 612, locked: true, ready: true },
  { id: "rec-0510", courseId: "math-calc-2026", title: "2주차 4강 — 합성함수 미분 집중", date: "2026.05.10", start: "20:00", end: "21:40", duration: "1:40:20", size: "910 MB", viewsPage: 1740, viewsApp: 1290, locked: false, ready: true },
  { id: "rec-live", courseId: "math-calc-2026", title: "오늘 라이브 — 4주차 1강 (녹화 중)", date: "2026.05.22", start: "20:00", end: "—", duration: "녹화 중", size: "—", viewsPage: 0, viewsApp: 0, locked: false, ready: false },
];

// ── Cloud Disk — courseware folders + files ─────────────────────────
const CLOUD_FOLDERS = [
  { id: "f-root", name: "리뉴젠 강의자료", parent: null, count: 5, top: true },
  { id: "f-math", name: "수학 · 미적분", parent: "f-root", count: 12 },
  { id: "f-kor",  name: "국어 · 문학독서", parent: "f-root", count: 9 },
  { id: "f-eng",  name: "영어 · 구문독해", parent: "f-root", count: 7 },
  { id: "f-exam", name: "모의고사", parent: "f-root", count: 14 },
];
const CLOUD_FILES = [
  { id: "c1", folder: "f-math", name: "4주차_도함수의활용_판서노트.edb", type: "edb",  size: "4.2 MB", modified: "오늘 20:41", from: "라이브", converted: true,  status: "ready" },
  { id: "c2", folder: "f-math", name: "미적분_예제모음_v3.pdf",          type: "pdf",  size: "8.8 MB", modified: "어제 18:02", from: "업로드",  converted: true,  status: "ready" },
  { id: "c3", folder: "f-math", name: "극한_개념정리.pptx",              type: "ppt",  size: "12.4 MB", modified: "05.20",     from: "eeo.cn 동기화", converted: false, status: "converting" },
  { id: "c4", folder: "f-math", name: "3주차_라이브_판서.img",            type: "img",  size: "2.1 MB", modified: "05.19",     from: "라이브",  converted: true,  status: "ready" },
  { id: "c5", folder: "f-math", name: "도함수_워크북.docx",              type: "doc",  size: "3.6 MB", modified: "05.18",     from: "업로드",  converted: true,  status: "ready" },
  { id: "c6", folder: "f-math", name: "단원평가_4주차.mp4",              type: "mp4",  size: "228 MB", modified: "05.17",     from: "업로드",  converted: true,  status: "ready" },
];

// ── Class Summary + Appraise — post-class report ────────────────────
const REPORTS = [
  {
    id: "rep-0519", courseId: "math-calc-2026", title: "3주차 2강 — 여러 가지 함수의 미분",
    date: "2026.05.19", duration: "1:32:11",
    attendanceRate: 96, present: 192, late: 5, absent: 3,
    handsUp: 22, rewards: 58, myRewards: 4,
    answerRate: 84, polls: 5, focus: 91,
    chatCount: 312, blackboardImgs: 7,
    appraiseTeacher: 4.9, appraiseStudent: 4.8,
    comment: "도함수의 기하적 의미를 정확히 이해했습니다. 합성함수 미분에서 실수가 줄었어요. 다음 주 예습 권장: 몫의 미분.",
  },
  {
    id: "rep-0517", courseId: "math-calc-2026", title: "3주차 1강 — 미분계수의 기하적 의미",
    date: "2026.05.17", duration: "1:28:40",
    attendanceRate: 94, present: 188, late: 8, absent: 4,
    handsUp: 17, rewards: 44, myRewards: 6,
    answerRate: 79, polls: 4, focus: 88,
    chatCount: 268, blackboardImgs: 6,
    appraiseTeacher: 4.8, appraiseStudent: 4.7,
    comment: "접선의 기울기 개념이 안정적입니다. 극한 정의로 돌아가 미분계수를 유도하는 연습을 한 번 더.",
  },
];

// ── Classroom — Homework (과제 배포·수집·채점) ────────────────────
// myStatus: pending(미제출) · submitted(제출·채점대기) · graded(채점완료) · late(지각제출)
const HOMEWORK = [
  { id: "hw-0521", courseId: "math-calc-2026", title: "4주차 — 도함수의 활용 워크북", type: "문제풀이",
    assignedAt: "2026.05.20", due: "2026.05.24 23:59", maxScore: 100,
    myStatus: "pending", submittedAt: null, myScore: null, feedback: "",
    submitted: 142, total: 200, attachments: [{ name: "도함수_워크북.pdf", type: "pdf" }] },
  { id: "hw-0519", courseId: "korean-lit-2026", title: "비문학 지문 분석 — 과학·기술", type: "첨삭",
    assignedAt: "2026.05.18", due: "2026.05.22 23:59", maxScore: 100,
    myStatus: "submitted", submittedAt: "2026.05.21 21:30", myScore: null, feedback: "",
    submitted: 168, total: 184, attachments: [{ name: "지문분석_양식.docx", type: "doc" }] },
  { id: "hw-0515", courseId: "english-struct-2026", title: "구문 분석 퀴즈 — 관계사", type: "퀴즈",
    assignedAt: "2026.05.13", due: "2026.05.16 23:59", maxScore: 20,
    myStatus: "graded", submittedAt: "2026.05.15 19:10", myScore: 18,
    feedback: "관계대명사 생략 구문에서 1개 실수. 전반적으로 우수합니다.",
    submitted: 88, total: 96, attachments: [] },
  { id: "hw-0512", courseId: "korean-lit-2026", title: "주제어 흐름 요약 과제", type: "첨삭",
    assignedAt: "2026.05.10", due: "2026.05.13 23:59", maxScore: 100,
    myStatus: "graded", submittedAt: "2026.05.12 22:40", myScore: 92,
    feedback: "문단 간 연결이 매끄러워졌습니다. 결론 압축을 한 번 더.",
    submitted: 175, total: 184, attachments: [] },
];

// ── App download (Download URL) ─────────────────────────────────────
const DOWNLOADS = [
  { os: "Windows", note: "Win 7 이상", ver: "5.2.1" },
  { os: "macOS",   note: "macOS 11+", ver: "5.2.1" },
  { os: "iOS",     note: "App Store", ver: "5.2.0" },
  { os: "Android", note: "Google Play", ver: "5.2.0" },
];

// ── Admin — accounts (User API) + classes (Classroom API) ───────────
const ADMIN_ACCOUNTS = [
  { uid: "20011001", name: "김지원", role: "teacher", mobile: "+82 10-2xxx-1180", status: "active",   classes: 6, label: "수학" },
  { uid: "20011002", name: "박세라", role: "teacher", mobile: "+82 10-3xxx-7741", status: "active",   classes: 8, label: "국어" },
  { uid: "20011003", name: "이현우", role: "teacher", mobile: "+82 10-5xxx-2093", status: "active",   classes: 5, label: "영어" },
  { uid: "20011004", name: "정민호", role: "teacher", mobile: "+82 10-7xxx-5510", status: "stopped",  classes: 4, label: "탐구" },
  { uid: "10293847", name: "한도윤", role: "student", mobile: "+82 10-4xxx-2841", status: "active",   classes: 2, label: "고2" },
  { uid: "10288120", name: "김민재", role: "student", mobile: "+82 10-6xxx-9920", status: "active",   classes: 3, label: "고3" },
  { uid: "10277431", name: "이수아", role: "student", mobile: "+82 10-8xxx-3372", status: "active",   classes: 1, label: "N수" },
  { uid: "10266902", name: "박현우", role: "student", mobile: "+82 10-9xxx-1184", status: "pending",  classes: 0, label: "고3" },
];

const ADMIN_CLASSES = [
  { id: "RJ-2026-MATH-A1", course: "2026 미적분 정수", teacher: "김지원", date: "2026.05.22", time: "20:00", students: 200, state: "live" },
  { id: "RJ-2026-KOR-B2",  course: "문학·독서 정도",   teacher: "박세라", date: "2026.05.22", time: "19:00", students: 184, state: "ended" },
  { id: "RJ-2026-ENG-C1",  course: "구문독해 RE:BUILD", teacher: "이현우", date: "2026.05.22", time: "21:00", students: 96,  state: "scheduled" },
  { id: "RJ-2026-SCI-D1",  course: "생명과학 메커니즘", teacher: "정민호", date: "2026.05.23", time: "20:00", students: 88,  state: "scheduled" },
];

// Data Subscription message types received (admin monitor)
const SUB_MESSAGES = [
  { name: "Enter the Classroom", n: 1842, last: "방금 전" },
  { name: "Hands Up", n: 96, last: "12초 전" },
  { name: "Rewards", n: 41, last: "8초 전" },
  { name: "Selector", n: 5, last: "1분 전" },
  { name: "Class Summary Data", n: 28, last: "수업 종료 시" },
  { name: "Recording File", n: 28, last: "수업 종료 시" },
  { name: "Network Condition", n: 1240, last: "실시간" },
  { name: "Help Seeking", n: 12, last: "2분 전" },
  { name: "Web-Live Likes", n: 3120, last: "실시간" },
];

// ── Web-Live — public broadcast (Broadcast / Web-Live API) ──────────
const WEBLIVE = {
  title: "수능 D-179 미적분 공개특강 — 도함수의 활용 총정리",
  instructor: "김지원",
  classId: "RJ-WEBLIVE-0522",
  viewers: 3284,
  peak: 4120,
  likes: 18742,
  reserved: 5610,
  protocols: ["HLS", "RTMP", "FLV"],
  chat: [
    { who: "수험생A", msg: "오늘도 명강의 감사합니다 🙏", reward: false },
    { who: "민지맘", msg: "아이랑 같이 듣고 있어요", reward: false },
    { who: "리뉴젠", msg: "📌 교재 PDF는 더보기에서 받으세요", reward: true },
    { who: "고3이수", msg: "합성함수 부분 다시 한 번요!", reward: false },
    { who: "익명", msg: "판서 깔끔해서 좋아요", reward: false },
    { who: "N수생", msg: "좋아요 1000개째 ㅋㅋ", reward: false },
  ],
};

// 예시 데이터 비움 — 실제 운영 데이터로 채웁니다
ROSTER.length = 0; RECORDINGS.length = 0; CLOUD_FOLDERS.length = 0; CLOUD_FILES.length = 0;
REPORTS.length = 0; HOMEWORK.length = 0; ADMIN_ACCOUNTS.length = 0; ADMIN_CLASSES.length = 0; SUB_MESSAGES.length = 0;

Object.assign(window, {
  CLASSIN, CLASSIN_ME, ROSTER, REALTIME, RECORDINGS,
  CLOUD_FOLDERS, CLOUD_FILES, REPORTS, HOMEWORK, DOWNLOADS,
  ADMIN_ACCOUNTS, ADMIN_CLASSES, SUB_MESSAGES, WEBLIVE,
});
