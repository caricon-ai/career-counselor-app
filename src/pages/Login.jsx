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
        // 新規登録（確認リンクを踏んだ後は /payment に遷移させる）
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/payment?confirmed=true`,
          },
        });
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
        padding: "20px",
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 12,
          padding: 40,
          width: "100%",
          maxWidth: 400,
          boxShadow: "0 2px 16px rgba(0,0,0,0.08)",
        }}
      >
        {/* 登録完了後は専用の案内画面を表示 */}
        {message ? (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>📧</div>
            <h2 style={{ fontSize: 20, fontWeight: "bold", marginBottom: 12 }}>
              確認メールを送りました
            </h2>
            <p style={{ color: "#4b5563", lineHeight: 1.8, marginBottom: 24, fontSize: 14 }}>
              <strong>{email}</strong> 宛にメールを送信しました。<br />
              メール内の「確認リンク」をクリックすると<br />
              登録が完了します。
            </p>
            <div style={{
              background: "#fefce8",
              border: "1px solid #fde68a",
              borderRadius: 8,
              padding: "12px 16px",
              fontSize: 13,
              color: "#92400e",
              marginBottom: 24,
              textAlign: "left",
              lineHeight: 1.7,
            }}>
              💡 メールが届かない場合は、迷惑メールフォルダもご確認ください。
            </div>
            <button
              onClick={() => { setIsSignUp(false); setMessage(""); setEmail(""); setPassword(""); }}
              style={{
                width: "100%",
                padding: 12,
                background: "linear-gradient(180deg, #2563eb, #1d4ed8)",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                fontWeight: "bold",
                cursor: "pointer",
                fontSize: 15,
              }}
            >
              ログイン画面へ
            </button>
          </div>
        ) : (
          <>
            <h2 style={{ textAlign: "center", marginBottom: 6, fontSize: 22 }}>
              {isSignUp ? "新規登録" : "ログイン"}
            </h2>
            {/* 新規登録時のみ説明文を表示 */}
            {isSignUp && (
              <p style={{ textAlign: "center", fontSize: 13, color: "#6b7280", marginBottom: 24 }}>
                メールアドレスとパスワードを入力して<br />アカウントを作成してください
              </p>
            )}
            {!isSignUp && <div style={{ marginBottom: 24 }} />}

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", marginBottom: 6, fontWeight: "bold", fontSize: 14 }}>
                  メールアドレス
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@email.com"
                  required
                  style={{
                    width: "100%",
                    padding: 10,
                    borderRadius: 8,
                    border: "1px solid #ccc",
                    boxSizing: "border-box",
                    fontSize: 15,
                  }}
                />
              </div>

              <div style={{ marginBottom: 8 }}>
                <label style={{ display: "block", marginBottom: 6, fontWeight: "bold", fontSize: 14 }}>
                  パスワード
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={isSignUp ? "6文字以上で入力" : "パスワードを入力"}
                  required
                  style={{
                    width: "100%",
                    padding: 10,
                    borderRadius: 8,
                    border: "1px solid #ccc",
                    boxSizing: "border-box",
                    fontSize: 15,
                  }}
                />
              </div>

              {/* 新規登録時のみパスワード条件を表示 */}
              {isSignUp && (
                <p style={{ fontSize: 12, color: "#9ca3af", marginBottom: 20, marginTop: 4 }}>
                  ※ 6文字以上で設定してください
                </p>
              )}
              {!isSignUp && <div style={{ marginBottom: 20 }} />}

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
                onClick={() => { setIsSignUp(!isSignUp); setError(""); }}
                style={{ background: "none", border: "none", color: "#2563eb", cursor: "pointer", fontSize: 14 }}
              >
                {isSignUp ? "すでにアカウントをお持ちの方はこちら" : "新規登録はこちら"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
