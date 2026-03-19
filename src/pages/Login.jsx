// src/pages/Login.jsx
import { useState } from "react";
import { supabase } from "../lib/supabase";

// Supabaseから返ってくる英語エラーを日本語に変換する関数
function toJapaneseError(message) {
  if (!message) return "エラーが発生しました。もう一度お試しください。";

  // よくあるエラーメッセージを日本語に変換
  if (message.includes("Invalid login credentials"))
    return "メールアドレスまたはパスワードが正しくありません。";
  if (message.includes("Email not confirmed"))
    return "メールアドレスの確認が完了していません。届いたメールのリンクをクリックしてください。";
  if (message.includes("User already registered"))
    return "このメールアドレスはすでに登録されています。ログインをお試しください。";
  if (message.includes("Password should be at least"))
    return "パスワードは6文字以上で設定してください。";
  if (message.includes("Unable to validate email address") || message.includes("invalid format"))
    return "正しいメールアドレスの形式で入力してください。";
  if (message.includes("Email rate limit exceeded") || message.includes("rate limit"))
    return "しばらく時間をおいてから再度お試しください。";
  if (message.includes("Network") || message.includes("fetch"))
    return "通信エラーが発生しました。インターネット接続を確認してください。";

  // 上記に当てはまらない場合はそのまま表示（開発中の確認用）
  return "エラーが発生しました。もう一度お試しください。";
}

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    try {
      if (isSignUp) {
        // 新規登録
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setMessage("確認メールを送信しました。受信ボックスをご確認ください。");
      } else {
        // ログイン
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err) {
      // 英語エラーを日本語に変換して表示
      setError(toJapaneseError(err.message));
    } finally {
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
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 12,
          padding: 40,
          width: 360,
          boxShadow: "0 2px 16px rgba(0,0,0,0.08)",
        }}
      >
        <h2 style={{ textAlign: "center", marginBottom: 24 }}>
          {isSignUp ? "新規登録" : "ログイン"}
        </h2>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", marginBottom: 6, fontWeight: "bold" }}>
              メールアドレス
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: "100%",
                padding: 10,
                borderRadius: 8,
                border: "1px solid #ccc",
                boxSizing: "border-box",
              }}
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ display: "block", marginBottom: 6, fontWeight: "bold" }}>
              パスワード
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: "100%",
                padding: 10,
                borderRadius: 8,
                border: "1px solid #ccc",
                boxSizing: "border-box",
              }}
            />
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
              lineHeight: 1.6,
            }}>
              ⚠️ {error}
            </div>
          )}
          {message && (
            <div style={{
              background: "#f0fdf4",
              border: "1px solid #86efac",
              borderRadius: 8,
              padding: "10px 14px",
              marginBottom: 16,
              fontSize: 14,
              color: "#15803d",
              lineHeight: 1.6,
            }}>
              ✅ {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: 12,
              background: "linear-gradient(180deg, #2563eb, #1d4ed8)",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              fontWeight: "bold",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
              fontSize: 16,
            }}
          >
            {loading ? "処理中..." : isSignUp ? "登録する" : "ログイン"}
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: 20 }}>
          <button
            onClick={() => { setIsSignUp(!isSignUp); setError(""); setMessage(""); }}
            style={{ background: "none", border: "none", color: "#2563eb", cursor: "pointer" }}
          >
            {isSignUp ? "すでにアカウントをお持ちの方はこちら" : "新規登録はこちら"}
          </button>
        </div>
      </div>
    </div>
  );
}
