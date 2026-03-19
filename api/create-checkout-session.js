import Stripe from "stripe";

// Stripeの初期化（シークレットキーをVercelの環境変数から読み込む）
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  // POSTリクエスト以外は拒否
  if (req.method !== "POST") {
    return res.status(405).json({ error: "許可されていないメソッドです" });
  }

  try {
    const { userId, userEmail } = req.body;

    // Stripeのチェックアウトセッションを作成
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "subscription",
      customer_email: userEmail,
      line_items: [
        {
          price: "price_1TCeg44689YbRONo1rNc1UVa", // 月額5,000円のPrice ID
          quantity: 1,
        },
      ],
      // 支払い成功後にリダイレクトするURL
      success_url: `${process.env.VITE_APP_URL || "https://career-counselor-app-two.vercel.app"}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      // キャンセル時にリダイレクトするURL
      cancel_url: `${process.env.VITE_APP_URL || "https://career-counselor-app-two.vercel.app"}/payment`,
      // ユーザーIDをメタデータに保存（後でwebhookで使う）
      metadata: {
        user_id: userId,
      },
      subscription_data: {
        metadata: {
          user_id: userId,
        },
      },
    });

    // 決済ページのURLを返す
    res.status(200).json({ url: session.url });
  } catch (error) {
    console.error("Stripeセッション作成エラー:", error);
    res.status(500).json({ error: "決済セッションの作成に失敗しました" });
  }
}
