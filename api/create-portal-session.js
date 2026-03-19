// api/create-portal-session.js
// Stripeのカスタマーポータルセッションを作成するサーバーレス関数
// ユーザーがここ経由でStripeの解約・プラン管理ページへ遷移する

import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "許可されていないメソッドです" });
  }

  try {
    const { userEmail } = req.body;

    if (!userEmail) {
      return res.status(400).json({ error: "メールアドレスが必要です" });
    }

    // メールアドレスからStripeの顧客IDを検索する
    const customers = await stripe.customers.list({ email: userEmail, limit: 1 });

    if (customers.data.length === 0) {
      return res.status(404).json({ error: "顧客情報が見つかりません" });
    }

    const customerId = customers.data[0].id;

    // カスタマーポータルセッションを作成する
    // ポータルでの操作後にリダイレクトするURLを指定
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${process.env.VITE_APP_URL || "https://career-counselor-app-two.vercel.app"}/scenario`,
    });

    res.status(200).json({ url: session.url });
  } catch (error) {
    console.error("カスタマーポータルセッション作成エラー:", error);
    res.status(500).json({ error: "ポータルセッションの作成に失敗しました" });
  }
}
