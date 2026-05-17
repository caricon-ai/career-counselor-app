import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "../lib/supabase";

// ステップ表示コンポーネント（Login.jsx と同じデザイン）
function StepIndicator({ currentStep }) {
  const steps = ["アカウント作成", "お支払い", "練習スタート"];
  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0 }}>
        {steps.map((label, i) => {
          const step = i + 1;
          const isActive = step === currentStep;
          const isDone = step < currentStep;
          return (
            <div key={label} style={{ display: "flex", alignItems: "center" }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                <div style={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  background: isDone ? "#2563eb" : isActive ? "#2563eb" : "#e5e7eb",
                  color: isDone || isActive ? "#fff" : "#9ca3af",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 13,
                  fontWeight: "bold",
                }}>
                  {isDone ? "✓" : step}
                </div>
                <span style={{
                  fontSize: 10,
                  color: isActive ? "#2563eb" : isDone ? "#2563eb" : "#9ca3af",
                  fontWeight: isActive ? "bold" : "normal",
                  whiteSpace: "nowrap",
                }}>
                  {label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div style={{
                  width: 32,
                  height: 2,
                  background: isDone ? "#2563eb" : "#e5e7eb",
                  marginBottom: 16,
                  flexShrink: 0,
                }} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// 申し込みページ
export default function Payment() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchParams] = useSearchParams();
  const isConfirmed = searchParams.get("confirmed") === "true";

  const handleSubscribe = async () => {
    setLoading(true);
    setError("");

    try {
      const { data: { user } } = await supabase.auth.getUser();

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
    <div style={{ minHeight: "100vh", background: "#f3f6fb", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ background: "#fff", borderRadius: 16, padding: 40, width: "100%", maxWidth: 460, boxShadow: "0 2px 20px rgba(0,0,0,0.08)" }}>

        {/* ステップ表示（ステップ3） */}
        <StepIndicator currentStep={2} />

        {/* メール確認完了の案内 */}
        {isConfirmed && (
          <div style={{
            background: "#f0fdf4",
            border: "1px solid #86efac",
            borderRadius: 10,
            padding: "12px 16px",
            marginBottom: 24,
            fontSize: 14,
            color: "#15803d",
            lineHeight: 1.7,
            textAlign: "center",
          }}>
            ✅ メールアドレスの確認が完了しました！
          </div>
        )}

        {/* タイトル */}
        <h2 style={{ textAlign: "center", fontSize: 20, fontWeight: "bold", color: "#1f2937", marginBottom: 6 }}>
          あと一歩で練習開始です！
        </h2>
        <p style={{ textAlign: "center", fontSize: 14, color: "#6b7280", marginBottom: 28, lineHeight: 1.7 }}>
          お支払いが完了するとすぐに練習を始められます
        </p>

        {/* 料金ボックス */}
        <div style={{
          background: "linear-gradient(135deg, #eff6ff, #dbeafe)",
          border: "2px solid #2563eb",
          borderRadius: 14,
          padding: "24px 28px",
          marginBottom: 24,
          textAlign: "center",
        }}>
          <div style={{ fontSize: 13, color: "#2563eb", fontWeight: "bold", marginBottom: 6, letterSpacing: "0.05em" }}>
            月額プラン
          </div>
          <div style={{ fontSize: 44, fontWeight: "bold", color: "#1d4ed8", lineHeight: 1.1 }}>
            ¥5,000
          </div>
          <div style={{ fontSize: 14, color: "#6b7280", marginTop: 4 }}>/ 月（税込）</div>
        </div>

        {/* 含まれる内容 */}
        <ul style={{ listStyle: "none", padding: 0, margin: "0 0 28px", display: "flex", flexDirection: "column", gap: 10 }}>
          {[
            "5種類のロールプレイケースが使い放題",
            "AIとの面接練習（何度でも）",
            "4区分のAI採点・フィードバック",
            "スマホ・PC・タブレット対応",
            "いつでも解約可能・違約金なし",
          ].map((text) => (
            <li key={text} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: "#374151" }}>
              <span style={{
                color: "#fff",
                background: "#2563eb",
                fontWeight: "bold",
                flexShrink: 0,
                width: 20,
                height: 20,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 11,
              }}>✓</span>
              {text}
            </li>
          ))}
        </ul>

        {error && (
          <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 14, color: "#b91c1c" }}>
            ⚠️ {error}
          </div>
        )}

        {/* 申し込みボタン */}
        <button
          onClick={handleSubscribe}
          disabled={loading}
          style={{
            width: "100%",
            padding: "16px",
            background: loading ? "#93c5fd" : "linear-gradient(180deg, #2563eb, #1d4ed8)",
            color: "#fff",
            border: "none",
            borderRadius: 10,
            fontSize: 17,
            fontWeight: "bold",
            cursor: loading ? "not-allowed" : "pointer",
            marginBottom: 12,
            letterSpacing: "0.02em",
          }}
        >
          {loading ? "処理中..." : "クレジットカードでお支払い →"}
        </button>

        <p style={{ textAlign: "center", fontSize: 12, color: "#9ca3af", lineHeight: 1.8 }}>
          🔒 Stripeの安全な決済ページに移動します<br />
          カード情報はStripeが管理し、このサービスには保存されません
        </p>
      </div>
    </div>
  );
}
