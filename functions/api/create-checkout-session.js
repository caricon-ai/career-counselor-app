import Stripe from "stripe";

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const { userId, userEmail } = await request.json();

    const stripe = new Stripe(env.STRIPE_SECRET_KEY);
    const appUrl = env.VITE_APP_URL || "https://career-counselor-app-two.vercel.app";

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
      success_url: `${appUrl}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/payment`,
      metadata: { user_id: userId },
      subscription_data: { metadata: { user_id: userId } },
    });

    return Response.json({ url: session.url });
  } catch (error) {
    console.error("Stripeセッション作成エラー:", error);
    return Response.json({ error: "決済セッションの作成に失敗しました" }, { status: 500 });
  }
}
