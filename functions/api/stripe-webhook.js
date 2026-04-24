import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

export async function onRequestPost(context) {
  const { request, env } = context;

  const stripe = new Stripe(env.STRIPE_SECRET_KEY);
  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

  const sig = request.headers.get("stripe-signature");

  // Stripeの署名検証のために生のテキストとして取得する（重要）
  const rawBody = await request.text();

  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("Webhook署名の検証エラー:", err.message);
    return Response.json({ error: `Webhookエラー: ${err.message}` }, { status: 400 });
  }

  // イベントの種類に応じて処理を分ける
  switch (event.type) {
    // サブスクリプションが有効になったとき
    case "customer.subscription.created":
    case "customer.subscription.updated": {
      const subscription = event.data.object;
      const userId = subscription.metadata?.user_id;
      if (userId) {
        await supabase.from("subscriptions").upsert({
          user_id: userId,
          stripe_customer_id: subscription.customer,
          stripe_subscription_id: subscription.id,
          status: subscription.status,
          updated_at: new Date().toISOString(),
        }, { onConflict: "user_id" });
      }
      break;
    }

    // サブスクリプションが解約・期限切れになったとき
    case "customer.subscription.deleted": {
      const subscription = event.data.object;
      const userId = subscription.metadata?.user_id;
      if (userId) {
        await supabase.from("subscriptions")
          .update({ status: "canceled", updated_at: new Date().toISOString() })
          .eq("user_id", userId);
      }
      break;
    }

    default:
      break;
  }

  return Response.json({ received: true });
}
