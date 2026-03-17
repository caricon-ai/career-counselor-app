// src/pages/Login.jsx
import { useState } from "react";
import { supabase } from "../lib/supabase";

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
        setMessage("確認メールを送信しました。メールを確認してください。");
      } else {
        // ログイン
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err) {
      setError(err.message || "エラーが発生しました");
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
            <div style={{ color: "red", marginBottom: 16, fontSize: 14 }}>{error}</div>
          )}
          {message && (
            <div style={{ color: "green", marginBottom: 16, fontSize: 14 }}>{message}</div>
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
