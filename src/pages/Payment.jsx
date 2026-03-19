import { useState } from "react";
import { supabase } from "../lib/supabase";

// 申し込みページ
export default function Payment() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // 「申し込む」ボタンを押したときの処理
  const handleSubscribe = async () => {
    setLoading(true);
    setError("");

    try {
      // 現在ログイン中のユーザー情報を取得
      const { data: { user } } = await supabase.auth.getUser();

      // Stripe決済セッションを作成するAPIを呼び出す
      const response = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          userEmail: user.email,
        }),
      });

      const data = await response.json();

      if (data.url) {
        // Stripeの決済ページへ移動
        window.location.href = data.url;
      } else {
        setError("決済ページの作成に失敗しました。もう一度お試しください。");
      }
    } catch (err) {
      console.error(err);
      setError("エラーが発生しました。もう一度お試しください。");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>キャリコン実技試験対策AI</h1>
        <p style={styles.subtitle}>月額サブスクリプション</p>

        <div style={styles.priceBox}>
          <span style={styles.price}>¥5,000</span>
          <span style={styles.period}> / 月</span>
        </div>

        <ul style={styles.features}>
          <li>✅ 5つのロールプレイケース</li>
          <li>✅ AIとの面接練習（何度でも）</li>
          <li>✅ 4区分のAI採点・フィードバック</li>
          <li>✅ いつでも解約可能</li>
        </ul>

        {error && <p style={styles.error}>{error}</p>}

        <button
          onClick={handleSubscribe}
          disabled={loading}
          style={loading ? styles.buttonDisabled : styles.button}
        >
          {loading ? "処理中..." : "今すぐ申し込む"}
        </button>

        <p style={styles.note}>
          クレジットカードで安全に決済（Stripe）
        </p>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f5f5f5",
    padding: "20px",
  },
  card: {
    backgroundColor: "white",
    borderRadius: "12px",
    padding: "40px",
    maxWidth: "480px",
    width: "100%",
    boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
    textAlign: "center",
  },
  title: {
    fontSize: "24px",
    fontWeight: "bold",
    color: "#1a1a1a",
    marginBottom: "8px",
  },
  subtitle: {
    color: "#666",
    marginBottom: "24px",
  },
  priceBox: {
    backgroundColor: "#f0f7ff",
    borderRadius: "8px",
    padding: "20px",
    marginBottom: "24px",
  },
  price: {
    fontSize: "48px",
    fontWeight: "bold",
    color: "#2563eb",
  },
  period: {
    fontSize: "18px",
    color: "#666",
  },
  features: {
    textAlign: "left",
    listStyle: "none",
    padding: "0",
    marginBottom: "32px",
    lineHeight: "2",
    color: "#333",
  },
  error: {
    color: "#dc2626",
    marginBottom: "16px",
    fontSize: "14px",
  },
  button: {
    width: "100%",
    padding: "16px",
    backgroundColor: "#2563eb",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontSize: "18px",
    fontWeight: "bold",
    cursor: "pointer",
    marginBottom: "16px",
  },
  buttonDisabled: {
    width: "100%",
    padding: "16px",
    backgroundColor: "#93c5fd",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontSize: "18px",
    fontWeight: "bold",
    cursor: "not-allowed",
    marginBottom: "16px",
  },
  note: {
    fontSize: "13px",
    color: "#999",
  },
};
