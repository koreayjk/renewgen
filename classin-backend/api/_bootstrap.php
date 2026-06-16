<?php
/* 공통 부트스트랩 — 설정 로드 · JSON 응답 · CORS · 에러 처리
 * 모든 api/*.php 파일이 맨 위에서 require 합니다. */

declare(strict_types=1);
error_reporting(E_ALL);
ini_set('display_errors', '0'); // 운영: 에러를 화면에 노출하지 않음 (로그로만)

$cfgPath = __DIR__ . '/../config.php';
if (!is_file($cfgPath)) {
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['ok' => false, 'msg' => 'config.php 가 없습니다. config.sample.php 를 복사해 채우세요.'], JSON_UNESCAPED_UNICODE);
    exit;
}
$CONFIG = require $cfgPath;

require __DIR__ . '/../lib/classin.php';

/** CORS — 우리 홈페이지 도메인만 허용 */
$origin = $CONFIG['SITE_ORIGIN'] ?? '*';
header('Access-Control-Allow-Origin: ' . $origin);
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json; charset=utf-8');
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') { http_response_code(204); exit; }

/** JSON 응답 헬퍼 */
function reply($data, int $code = 200): void {
    http_response_code($code);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}
function fail(string $msg, int $code = 400): void {
    reply(['ok' => false, 'msg' => $msg], $code);
}

/** 입력 읽기 (POST form 또는 JSON body 모두 지원) */
function input(): array {
    $raw = file_get_contents('php://input');
    if ($raw && ($j = json_decode($raw, true)) && is_array($j)) return $j;
    return $_POST ?: $_GET;
}

/** PDO 연결 (DB 쓸 때만 호출) */
function db(array $cfg): PDO {
    static $pdo = null;
    if ($pdo) return $pdo;
    $d = $cfg['DB'];
    $dsn = "mysql:host={$d['host']};dbname={$d['name']};charset={$d['charset']}";
    $pdo = new PDO($dsn, $d['user'], $d['pass'], [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
    return $pdo;
}

/** 간단한 파일 로그 */
function logline(string $tag, $payload): void {
    $dir = __DIR__ . '/../logs';
    if (!is_dir($dir)) @mkdir($dir, 0775, true);
    @file_put_contents(
        $dir . '/' . date('Ymd') . '.log',
        '[' . date('H:i:s') . "] $tag " . (is_string($payload) ? $payload : json_encode($payload, JSON_UNESCAPED_UNICODE)) . "\n",
        FILE_APPEND
    );
}
