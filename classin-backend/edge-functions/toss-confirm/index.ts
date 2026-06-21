// ═════════════════════════════════════════════════════════════════
//  Supabase Edge Function — toss-confirm
//  토스페이먼츠 결제 승인 + 주문/수강권 부여
//
//  배포:
//    1) Supabase CLI 또는 대시보드 → Edge Functions → "Create function"
//    2) 이름: toss-confirm
//    3) 이 파일 내용을 복사해서 붙여넣기
//    4) 환경변수(Secrets) 설정:
//        - TOSS_SECRET_KEY  : 결제위젯 시크릿 키 (test_gsk_… / live_gsk_…)
//        - SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (자동 주입됨)
//    5) Deploy
//    6) Frontend (app/toss-payments.jsx) 에서:
//        window.TOSS_CONFIRM_API = "https://<프로젝트>.supabase.co/functions/v1/toss-confirm"
//
//  흐름:
//    1) 프론트 → 이 함수 호출 (paymentKey, orderId, amount)
//    2) DB에서 pending 주문 조회 → amount 일치 검증 (위변조 방지)
//    3) 토스 승인 API 호출 (시크릿 키)
//    4) 성공 시: orders 갱신 + enrollments 자동 발급
// ═════════════════════════════════════════════════════════════════

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const CORS = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...CORS },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST")    return json({ ok: false, message: "POST 만 지원합니다" }, 405);

  let body: { paymentKey?: string; orderId?: string; amount?: number };
  try { body = await req.json(); }
  catch { return json({ ok: false, message: "JSON 본문이 필요합니다" }, 400); }

  const paymentKey = String(body.paymentKey || "").trim();
  const orderId    = String(body.orderId    || "").trim();
  const amount     = Number(body.amount || 0);
  if (!paymentKey || !orderId || amount <= 0) {
    return json({ ok: false, message: "paymentKey · orderId · amount 가 필요합니다" }, 400);
  }

  const TOSS_SECRET = Deno.env.get("TOSS_SECRET_KEY");
  if (!TOSS_SECRET) return json({ ok: false, message: "서버에 TOSS_SECRET_KEY 가 설정되지 않았습니다" }, 500);

  // ── service_role 클라이언트(RLS 우회 — orders/enrollments insert/update)
  const supa = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );

  // ── 1) DB 의 pending 주문 조회 (없으면 폴백으로 진행)
  const { data: order } = await supa
    .from("orders")
    .select("order_id, user_id, course_ids, amount, status")
    .eq("order_id", orderId)
    .maybeSingle();

  if (order) {
    if (order.status === "paid") {
      return json({ ok: true, payment: { orderId, amount: order.amount, status: "DONE", method: "이미 승인된 주문" } });
    }
    if (order.amount !== amount) {
      return json({ ok: false, code: "AMOUNT_MISMATCH", message: "금액이 일치하지 않습니다" }, 400);
    }
  }

  // ── 2) 토스 승인 API
  const tossRes = await fetch("https://api.tosspayments.com/v1/payments/confirm", {
    method: "POST",
    headers: {
      "Authorization": "Basic " + btoa(TOSS_SECRET + ":"),
      "Content-Type":  "application/json",
    },
    body: JSON.stringify({ paymentKey, orderId, amount }),
  });
  const tossJson = await tossRes.json().catch(() => ({}));

  if (!tossRes.ok) {
    if (order) {
      await supa.from("orders").update({
        status: "failed", payment_key: paymentKey, raw: tossJson,
      }).eq("order_id", orderId);
    }
    return json({
      ok: false,
      code:    tossJson.code    || "CONFIRM_FAILED",
      message: tossJson.message || "결제 승인에 실패했습니다",
    }, tossRes.status || 500);
  }

  // ── 3) 주문 갱신 + 수강권 부여
  if (order) {
    await supa.from("orders").update({
      status: "paid",
      payment_key: tossJson.paymentKey || paymentKey,
      method: tossJson.method || null,
      approved_at: tossJson.approvedAt || new Date().toISOString(),
      raw: tossJson,
    }).eq("order_id", orderId);

    if (order.user_id && Array.isArray(order.course_ids) && order.course_ids.length) {
      const rows = order.course_ids.map((cid) => ({
        user_id:    order.user_id,
        course_id:  cid,
        order_id:   orderId,
        status:     "active",
        granted_at: new Date().toISOString(),
      }));
      // 중복 방지: 동일 (user_id, course_id) 가 이미 active 면 무시
      await supa.from("enrollments").upsert(rows, { onConflict: "user_id,course_id", ignoreDuplicates: true });
    }
  }

  return json({
    ok: true,
    payment: {
      orderId:    tossJson.orderId    || orderId,
      amount:     tossJson.totalAmount|| amount,
      method:     tossJson.method     || "",
      status:     tossJson.status     || "DONE",
      approvedAt: tossJson.approvedAt || null,
      receipt:    tossJson.receipt?.url || null,
      paymentKey: tossJson.paymentKey || paymentKey,
    },
  });
});
