<?php
/* ──────────────────────────────────────────────────────────────────
 *  ClassIn (EEO) API 연동 코어
 *  ────────────────────────────────────────────────────────────────
 *  공식 인증 규칙 (docs.eeo.cn):
 *   · v1 (course.api.php 계열, 대부분의 엔드포인트)
 *        safeKey = MD5( SECRET + timeStamp )      ← 32자리 소문자
 *        POST body 에 SID, safeKey, timeStamp + 각 파라미터
 *   · v2 (신규 LMS 계열)
 *        헤더 X-EEO-SIGN = md5( '정렬된파라미터&key=SECRET' )
 *        헤더 X-EEO-UID = SID,  X-EEO-TS = timeStamp
 *
 *  이 클래스는 둘 다 지원합니다. 실강/녹화/계정/자료는 v1 을 씁니다.
 * ──────────────────────────────────────────────────────────────── */

class ClassIn
{
    private string $sid;
    private string $secret;
    private string $host;

    public function __construct(array $cfg)
    {
        $this->sid    = (string)$cfg['SID'];
        $this->secret = (string)$cfg['SECRET'];
        $this->host   = rtrim($cfg['API_HOST'] ?? 'https://api.eeo.cn', '/');
    }

    /** v1 safeKey = MD5(SECRET + timeStamp) */
    private function safeKey(int $ts): string
    {
        return md5($this->secret . $ts);
    }

    /**
     * v1 호출 — course.api.php?action=XXX
     * @param string $action  예: 'getLoginLinked', 'getWebcastUrl', 'register'
     * @param array  $params  비즈니스 파라미터 (SID/safeKey/timeStamp 는 자동 추가)
     * @return array          디코드된 JSON (error_info.errno 등 포함)
     */
    public function call(string $action, array $params = []): array
    {
        $ts = time();
        $body = array_merge($params, [
            'SID'       => $this->sid,
            'safeKey'   => $this->safeKey($ts),
            'timeStamp' => $ts,
        ]);

        $url = $this->host . '/partner/api/course.api.php?action=' . rawurlencode($action);
        $raw = $this->post($url, $body, false);
        $json = json_decode($raw, true);

        if (!is_array($json)) {
            throw new RuntimeException('ClassIn 응답 파싱 실패: ' . substr($raw, 0, 300));
        }
        return $json;
    }

    /**
     * v2 호출 — 신규 LMS 엔드포인트 (헤더 서명 방식)
     * @param string $path   예: '/lms/unit/test'
     * @param array  $body   JSON body (배열/딕셔너리 값은 서명에서 자동 제외)
     */
    public function callV2(string $path, array $body = []): array
    {
        $ts = time();

        // 서명 대상: 배열/딕셔너리 제외, 1024바이트 초과 제외
        $signable = [];
        foreach ($body as $k => $v) {
            if (is_array($v)) continue;
            if (is_string($v) && strlen($v) > 1024) continue;
            $signable[$k] = $v;
        }
        $signable['sid']       = $this->sid;
        $signable['timeStamp'] = $ts;
        ksort($signable, SORT_STRING);

        $pairs = [];
        foreach ($signable as $k => $v) $pairs[] = $k . '=' . $v;
        $stringA = implode('&', $pairs) . '&key=' . $this->secret;
        $sign = md5($stringA);

        $url = $this->host . $path;
        $headers = [
            'X-EEO-SIGN: ' . $sign,
            'X-EEO-UID: '  . $this->sid,
            'X-EEO-TS: '   . $ts,
            'Content-Type: application/json',
        ];
        $raw = $this->post($url, json_encode($body, JSON_UNESCAPED_UNICODE), true, $headers);
        return json_decode($raw, true) ?: ['_raw' => $raw];
    }

    /** 공통 cURL POST */
    private function post(string $url, $data, bool $json, array $headers = []): string
    {
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_POST           => true,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT        => 20,
            CURLOPT_POSTFIELDS     => $json ? $data : http_build_query($data),
        ]);
        if (!$json) {
            $headers[] = 'Content-Type: application/x-www-form-urlencoded';
        }
        if ($headers) curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);

        $res  = curl_exec($ch);
        $err  = curl_error($ch);
        curl_close($ch);

        if ($res === false) {
            throw new RuntimeException('ClassIn 연결 실패: ' . $err);
        }
        return $res;
    }

    /** errno === 1 이면 성공 (클래스인 규칙) */
    public static function ok(array $resp): bool
    {
        return (int)($resp['error_info']['errno'] ?? 0) === 1;
    }
}
