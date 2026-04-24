import Stripe from "stripe";

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const { userEmail } = await request.json();

    if (!userEmail) {
      return Response.json({ error: "メールアドレスが必要です" }, { status: 400 });
    }

    const stripe = new Stripe(env.STRIPE_SECRET_KEY);
    const appUrl = env.VITE_APP_URL || "https://career-counselor-app-two.vercel.app";

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
