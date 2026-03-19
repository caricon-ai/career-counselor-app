import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Supabaseの管理者クライアント（サーバー側のみで使う）
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "許可されていないメソッドです" });
  }

  const sig = req.headers["stripe-signature"];
  let event;

  try {
    // StripeからのWebhookを検証（なりすまし防止）
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Webhook署名の検証エラー:", err.message);
    return res.status(400).json({ error: `Webhookエラー: ${err.message}` });
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
          status: subscription.status, // "active" など
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
      // その他のイベントは無視
      break;
  }

  res.status(200).json({ received: true });
}
