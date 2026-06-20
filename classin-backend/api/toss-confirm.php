<?php
/* ──────────────────────────────────────────────────────────────────
 *  토스페이먼츠 결제 승인 (서버) — POST /api/toss-confirm.php
 *  프론트(TossPayPanel)에서 결제창 인증을 마치면 successUrl 로 돌아오고,
 *  브라우저가 { paymentKey, orderId, amount } 를 이 엔드포인트로 보냅니다.
 *  서버는 '시크릿 키'로 토스 승인 API를 호출해 실제 결제를 확정합니다.
 *  (시크릿 키는 절대 프론트엔드에 넣지 않습니다)
 *
 *  배포 후 프론트에서 다음을 설정하세요:
 *    window.TOSS_CONFIRM_API = "https://<내도메인>/classin/api/toss-confirm.php";
 * ──────────────────────────────────────────────────────────────── */

require __DIR__ . '/_bootstrap.php';

$in = input();
$paymentKey = trim((string)($in['paymentKey'] ?? ''));
$orderId    = trim((string)($in['orderId'] ?? ''));
$amount     = (int)($in['amount'] ?? 0);

if ($paymentKey === '' || $orderId === '' || $amount <= 0) {
    fail('필수 파라미터(paymentKey·orderId·amount)가 없습니다.', 400);
}

// 결제위젯 시크릿 키 (gsk). config.php 의 TOSS_SECRET_KEY 를 우선 사용.
// 미설정 시 토스 '문서용' 테스트 시크릿 키로 폴백(테스트 전용).
$secret = $CONFIG['TOSS_SECRET_KEY'] ?? 'test_gsk_docs_2GNmP0vBQ85qBwz5rmZ8VEojaPQB';

// ── (권장) 결제 요청 전에 서버에 저장해 둔 금액과 대조해 위변조 방지 ──
//  주문 생성 시 orders 테이블에 (orderId, amount) 를 저장했다면 여기서 확인하세요.
//  예시는 주석으로만 둡니다(스키마에 맞춰 활성화):
//
//  try {
//      $pdo = db($CONFIG);
//      $row = $pdo->prepare('SELECT amount FROM orders WHERE order_id = ?');
//      $row->execute([$orderId]);
//      $saved = $row->fetchColumn();
//      if ($saved !== false && (int)$saved !== $amount) fail('금액 불일치', 400);
//  } catch (Throwable $e) { /* orders 테이블이 아직 없으면 통과 */ }

// ── 토스 승인 API 호출 ───────────────────────────────────────────────
$ch = curl_init('https://api.tosspayments.com/v1/payments/confirm');
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST           => true,
    CURLOPT_HTTPHEADER     => [
        'Authorization: Basic ' . base64_encode($secret . ':'),
        'Content-Type: application/json',
    ],
    CURLOPT_POSTFIELDS => json_encode([
        'paymentKey' => $paymentKey,
        'orderId'    => $orderId,
        'amount'     => $amount,
    ], JSON_UNESCAPED_UNICODE),
    CURLOPT_TIMEOUT => 20,
]);
$res    = curl_exec($ch);
$status = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlErr = curl_error($ch);
curl_close($ch);

if ($res === false) {
    logline('TOSS_CONFIRM_NETERR', $curlErr);
    fail('토스 승인 서버에 연결하지 못했습니다.', 502);
}

$json = json_decode($res, true);

if ($status === 200 && is_array($json)) {
    logline('TOSS_CONFIRM_OK', ['orderId' => $orderId, 'amount' => $amount, 'method' => $json['method'] ?? '']);
    // 여기서 enrollments/subscriptions 등 접근권을 DB에 부여하면 됩니다(스키마에 맞춰 구현).
    reply([
        'ok'      => true,
        'payment' => [
            'orderId'   => $json['orderId']   ?? $orderId,
            'amount'    => $json['totalAmount'] ?? $amount,
            'method'    => $json['method']    ?? '',
            'status'    => $json['status']    ?? 'DONE',
            'approvedAt'=> $json['approvedAt'] ?? null,
            'receipt'   => $json['receipt']['url'] ?? null,
            'paymentKey'=> $json['paymentKey'] ?? $paymentKey,
        ],
    ]);
}

// 실패 — 토스가 준 코드/메시지를 그대로 전달
logline('TOSS_CONFIRM_FAIL', $json ?: $res);
reply([
    'ok'      => false,
    'code'    => $json['code']    ?? 'CONFIRM_FAILED',
    'message' => $json['message'] ?? '결제 승인에 실패했습니다.',
], $status ?: 500);
