// src/pages/Login.jsx
import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

function toJapaneseError(message) {
  if (!message) return "エラーが発生しました。もう一度お試しください。";
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
  return "エラーが発生しました。もう一度お試しください。";
}

// 新規登録時のステップ表示
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

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(searchParams.get("mode") === "signup");
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const resetSuccess = searchParams.get("reset") === "success";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    try {
      if (isForgotPassword) {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        setMessage("reset");
        return;
      }

      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        // メール確認オフのため登録直後にセッションが作られる → 支払いページへ
        if (data.session) {
          navigate("/payment");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err) {
      setError(toJapaneseError(err.message));
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: "100%",
    padding: "12px 14px",
    borderRadius: 8,
    border: "1.5px solid #d1d5db",
    boxSizing: "border-box",
    fontSize: 15,
    outline: "none",
    transition: "border-color 0.2s",
  };

  const primaryBtn = {
    width: "100%",
    padding: "14px",
    background: loading ? "#93c5fd" : "linear-gradient(180deg, #2563eb, #1d4ed8)",
    color: "#fff",
    border: "none",
    borderRadius: 10,
    fontWeight: "bold",
    cursor: loading ? "not-allowed" : "pointer",
    fontSize: 16,
    letterSpacing: "0.02em",
  };

  // メール送信完了画面
  if (message === "signup") {
    return (
      <div style={{ minHeight: "100vh", background: "#f3f6fb", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
        <div style={{ background: "#fff", borderRadius: 16, padding: 40, width: "100%", maxWidth: 420, boxShadow: "0 2px 20px rgba(0,0,0,0.08)", textAlign: "center" }}>
          <StepIndicator currentStep={2} />
          <div style={{ fontSize: 52, marginBottom: 16 }}>📧</div>
          <h2 style={{ fontSize: 20, fontWeight: "bold", marginBottom: 12, color: "#1f2937" }}>確認メールを送りました</h2>
          <p style={{ color: "#4b5563", lineHeight: 1.9, marginBottom: 20, fontSize: 14 }}>
            <strong style={{ color: "#1f2937" }}>{email}</strong> 宛にメールを送信しました。<br />
            メール内の「<strong>確認リンク</strong>」をクリックすると<br />お支払いページへ進めます。
          </p>
          <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 10, padding: "14px 16px", fontSize: 13, color: "#92400e", marginBottom: 24, textAlign: "left", lineHeight: 1.8 }}>
            💡 メールが届かない場合は、<strong>迷惑メールフォルダ</strong>もご確認ください。
          </div>
          <div style={{ background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: 10, padding: "14px 16px", fontSize: 13, color: "#0369a1", textAlign: "left", lineHeight: 1.8, marginBottom: 28 }}>
            <strong>次のステップ：</strong><br />
            メール確認 → お支払い（月額5,000円）→ 練習スタート
          </div>
          <button
            onClick={() => { setIsSignUp(false); setIsForgotPassword(false); setMessage(""); setEmail(""); setPassword(""); }}
            style={{ ...primaryBtn, background: "#f3f4f6", color: "#374151", fontSize: 14 }}
          >
            ログイン画面へ戻る
          </button>
        </div>
      </div>
    );
  }

  if (message === "reset") {
    return (
      <div style={{ minHeight: "100vh", background: "#f3f6fb", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
        <div style={{ background: "#fff", borderRadius: 16, padding: 40, width: "100%", maxWidth: 420, boxShadow: "0 2px 20px rgba(0,0,0,0.08)", textAlign: "center" }}>
          <div style={{ fontSize: 52, marginBottom: 16 }}>📧</div>
          <h2 style={{ fontSize: 20, fontWeight: "bold", marginBottom: 12 }}>リセットメールを送りました</h2>
          <p style={{ color: "#4b5563", lineHeight: 1.8, marginBottom: 24, fontSize: 14 }}>
            <strong>{email}</strong> 宛にパスワードリセット用のメールを送信しました。<br />
            メール内のリンクをクリックしてパスワードを再設定してください。
          </p>
          <div style={{ background: "#fefce8", border: "1px solid #fde68a", borderRadius: 8, padding: "12px 16px", fontSize: 13, color: "#92400e", marginBottom: 24, textAlign: "left" }}>
            💡 メールが届かない場合は、迷惑メールフォルダもご確認ください。
          </div>
          <button onClick={() => { setIsForgotPassword(false); setMessage(""); setError(""); }} style={primaryBtn}>
            ログイン画面へ戻る
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f3f6fb", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ background: "#fff", borderRadius: 16, padding: "36px 40px", width: "100%", maxWidth: 420, boxShadow: "0 2px 20px rgba(0,0,0,0.08)" }}>

        {/* パスワードリセットフォーム */}
        {isForgotPassword ? (
          <>
            <h2 style={{ textAlign: "center", marginBottom: 8, fontSize: 20, fontWeight: "bold", color: "#1f2937" }}>
              パスワードをお忘れの方
            </h2>
            <p style={{ textAlign: "center", fontSize: 13, color: "#6b7280", marginBottom: 28, lineHeight: 1.7 }}>
              登録済みのメールアドレスを入力してください。<br />パスワード再設定用のメールをお送りします。
            </p>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", marginBottom: 6, fontWeight: "bold", fontSize: 14, color: "#374151" }}>メールアドレス</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="example@email.com" required style={inputStyle} />
              </div>
              {error && <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 14, color: "#b91c1c" }}>⚠️ {error}</div>}
              <button type="submit" disabled={loading} style={primaryBtn}>
                {loading ? "送信中..." : "リセットメールを送る"}
              </button>
            </form>
            <div style={{ textAlign: "center", marginTop: 20 }}>
              <button onClick={() => { setIsForgotPassword(false); setError(""); }} style={{ background: "none", border: "none", color: "#2563eb", cursor: "pointer", fontSize: 14 }}>
                ← ログイン画面に戻る
              </button>
            </div>
          </>
        ) : (
          <>
            {/* 新規登録時のステップ表示 */}
            {isSignUp && <StepIndicator currentStep={1} />}

            <h2 style={{ textAlign: "center", marginBottom: 6, fontSize: 22, fontWeight: "bold", color: "#1f2937" }}>
              {isSignUp ? "アカウント作成" : "ログイン"}
            </h2>

            {/* 新規登録時の説明 */}
            {isSignUp && (
              <div style={{ marginBottom: 24 }}>
                <p style={{ textAlign: "center", fontSize: 13, color: "#6b7280", marginBottom: 16, lineHeight: 1.7 }}>
                  メールアドレスとパスワードを入力してください
                </p>
                <div style={{ background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: 10, padding: "12px 16px", fontSize: 13, color: "#0369a1", lineHeight: 1.8 }}>
                  <strong>登録の流れ：</strong><br />
                  ① アカウント作成 → ② 確認メール → ③ お支払い（月額5,000円）→ 練習スタート
                </div>
              </div>
            )}

            {resetSuccess && !isSignUp && (
              <div style={{ background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 8, padding: "10px 14px", marginBottom: 20, fontSize: 14, color: "#166534" }}>
                ✅ パスワードを変更しました。新しいパスワードでログインしてください。
              </div>
            )}

            {!isSignUp && !resetSuccess && <div style={{ marginBottom: 24 }} />}

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", marginBottom: 6, fontWeight: "bold", fontSize: 14, color: "#374151" }}>メールアドレス</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="example@email.com" required style={inputStyle} />
              </div>
              <div style={{ marginBottom: isSignUp ? 4 : 24 }}>
                <label style={{ display: "block", marginBottom: 6, fontWeight: "bold", fontSize: 14, color: "#374151" }}>パスワード</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={isSignUp ? "6文字以上で入力" : "パスワードを入力"} required style={inputStyle} />
              </div>
              {isSignUp && (
                <p style={{ fontSize: 12, color: "#9ca3af", marginBottom: 20, marginTop: 4 }}>※ 6文字以上で設定してください</p>
              )}

              {error && (
                <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 14, color: "#b91c1c", lineHeight: 1.6 }}>
                  ⚠️ {error}
                </div>
              )}

              <button type="submit" disabled={loading} style={primaryBtn}>
                {loading ? "処理中..." : isSignUp ? "アカウントを作成する" : "ログイン"}
              </button>
            </form>

            <div style={{ textAlign: "center", marginTop: 20 }}>
              <button onClick={() => { setIsSignUp(!isSignUp); setError(""); }} style={{ background: "none", border: "none", color: "#2563eb", cursor: "pointer", fontSize: 14 }}>
                {isSignUp ? "すでにアカウントをお持ちの方はこちら" : "新規登録はこちら"}
              </button>
            </div>

            {!isSignUp && (
              <div style={{ textAlign: "center", marginTop: 10 }}>
                <button onClick={() => { setIsForgotPassword(true); setError(""); }} style={{ background: "none", border: "none", color: "#9ca3af", cursor: "pointer", fontSize: 13 }}>
                  パスワードをお忘れの方はこちら
                </button>
              </div>
            )}

            <div style={{ textAlign: "center", marginTop: 20, paddingTop: 16, borderTop: "1px solid #f3f4f6" }}>
              <button onClick={() => navigate("/")} style={{ background: "none", border: "none", color: "#9ca3af", cursor: "pointer", fontSize: 13 }}>
                ← トップページへ戻る
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
