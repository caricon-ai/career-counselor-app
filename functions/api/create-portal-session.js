import Stripe from "stripe";
import { requireUser } from "./_auth.js";

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    // 本人確認済みのメールアドレスで顧客を検索する（他人の解約ページを開けないようにする）
    const auth = await requireUser(request, env);
    if (auth.error) return auth.error;
    const userEmail = auth.user.email;

    const stripe = new Stripe(env.STRIPE_SECRET_KEY);
    const appUrl = env.VITE_APP_URL || "https://career-counselor-app.caricon.workers.dev";

    // メールアドレスからStripeの顧客IDを検索する
    const customers = await stripe.customers.list({ email: userEmail, limit: 1 });

    if (customers.data.length === 0) {
      return Response.json({ error: "顧客情報が見つかりません" }, { status: 404 });
    }

    const customerId = customers.data[0].id;

    // カスタマーポータルセッションを作成する
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${appUrl}/scenario`,
    });

    return Response.json({ url: session.url });
  } catch (error) {
    console.error("カスタマーポータルセッション作成エラー:", error);
    return Response.json({ error: "ポータルセッションの作成に失敗しました" }, { status: 500 });
  }
}
