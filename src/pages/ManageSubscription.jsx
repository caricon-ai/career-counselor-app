// src/pages/ManageSubscription.jsx
// サブスクリプション管理ページ（解約・プラン変更）
// Stripeのカスタマーポータルへ誘導する

import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function ManageSubscription({ session }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handlePortal = async () => {
    setLoading(true);
    setError("");

    try {
      // サーバーレス関数を呼び出してStripeポータルのURLを取得する
      const res = await fetch("/api/create-portal-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userEmail: session.user.email }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error);

      // StripeのカスタマーポータルページへリダイレクトO
      window.location.href = data.url;
    } catch (err) {
      setError("ページの読み込みに失敗しました。しばらく時間をおいてから再度お試しください。");
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f3f6fb",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 12,
          padding: 40,
          width: "100%",
          maxWidth: 440,
          boxShadow: "0 2px 16px rgba(0,0,0,0.08)",
        }}
      >
        <h2 style={{ fontSize: 22, fontWeight: "bold", marginBottom: 8, textAlign: "center" }}>
          サブスクリプション管理
        </h2>
        <p style={{ fontSize: 13, color: "#6b7280", textAlign: "center", marginBottom: 32, lineHeight: 1.7 }}>
          解約・支払い方法の変更はStripeの<br />管理ページから行えます。
        </p>

        {/* 現在のプラン情報 */}
        <div style={{
          background: "#f0fdf4",
          border: "1px solid #86efac",
          borderRadius: 8,
          padding: "14px 16px",
          marginBottom: 24,
          fontSize: 14,
          color: "#166534",
        }}>
          ✅ 現在のプラン：月額5,000円（税込）
        </div>

        {error && (
          <div style={{
            background: "#fef2f2",
            border: "1px solid #fca5a5",
            borderRadius: 8,
            padding: "10px 14px",
            marginBottom: 16,
            fontSize: 14,
            color: "#b91c1c",
          }}>
            ⚠️ {error}
          </div>
        )}

        {/* ポータルへ進むボタン */}
        <button
          onClick={handlePortal}
          disabled={loading}
          style={{
            width: "100%",
            padding: 12,
            background: loading ? "#9ca3af" : "linear-gradient(180deg, #2563eb, #1d4ed8)",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            fontWeight: "bold",
            cursor: loading ? "not-allowed" : "pointer",
            fontSize: 15,
            marginBottom: 12,
          }}
        >
          {loading ? "読み込み中..." : "支払い・解約の管理ページへ →"}
        </button>

        <button
          onClick={() => navigate("/scenario")}
          style={{
            width: "100%",
            padding: 12,
            background: "transparent",
            color: "#6b7280",
            border: "1px solid #e5e7eb",
            borderRadius: 8,
            cursor: "pointer",
            fontSize: 14,
          }}
        >
          戻る
        </button>

        {/* 解約に関する注意書き */}
        <div style={{
          marginTop: 24,
          padding: "12px 16px",
          background: "#fefce8",
          border: "1px solid #fde68a",
          borderRadius: 8,
          fontSize: 12,
          color: "#92400e",
          lineHeight: 1.7,
        }}>
          💡 解約後も現在の契約期間の終了日まで利用できます。
        </div>
      </div>
    </div>
  );
}
