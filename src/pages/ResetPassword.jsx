// src/pages/ResetPassword.jsx
// パスワードリセットメールのリンクをクリックした後に表示されるページ
// ユーザーが新しいパスワードを入力して更新する

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  // リセットリンクが有効かどうか（セッションが確立されているか）
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Supabaseはメールリンクからアクセスすると onAuthStateChange で
    // PASSWORD_RECOVERY イベントを発火する。
    // このイベントが来たら「パスワード変更可能な状態」になる。
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsReady(true);
      }
    });

    // すでにセッションがある場合（リロード時など）も対応
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setIsReady(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // パスワード確認チェック
    if (password !== passwordConfirm) {
      setError("パスワードが一致しません。もう一度確認してください。");
      return;
    }
    if (password.length < 6) {
      setError("パスワードは6文字以上で設定してください。");
      return;
    }

    setLoading(true);
    try {
      // Supabaseでパスワードを更新する
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setDone(true);
    } catch (err) {
      setError("パスワードの更新に失敗しました。リンクの有効期限が切れている可能性があります。");
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
        {/* 更新完了後の画面 */}
        {done ? (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>✅</div>
            <h2 style={{ fontSize: 20, fontWeight: "bold", marginBottom: 12 }}>
              パスワードを変更しました
            </h2>
            <p style={{ color: "#4b5563", lineHeight: 1.8, marginBottom: 24, fontSize: 14 }}>
              新しいパスワードで<br />ログインしてください。
            </p>
            <button
              onClick={() => navigate("/login")}
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
        ) : !isReady ? (
          /* リンクが無効または期限切れの場合 */
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>⚠️</div>
            <h2 style={{ fontSize: 20, fontWeight: "bold", marginBottom: 12 }}>
              リンクが無効です
            </h2>
            <p style={{ color: "#4b5563", lineHeight: 1.8, marginBottom: 24, fontSize: 14 }}>
              リセットリンクの有効期限が切れているか、<br />
              すでに使用されています。<br />
              再度パスワードリセットを行ってください。
            </p>
            <button
              onClick={() => navigate("/login")}
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
              ログイン画面へ戻る
            </button>
          </div>
        ) : (
          /* 新しいパスワード入力フォーム */
          <>
            <h2 style={{ textAlign: "center", marginBottom: 6, fontSize: 22 }}>
              新しいパスワードを設定
            </h2>
            <p style={{ textAlign: "center", fontSize: 13, color: "#6b7280", marginBottom: 24 }}>
              新しいパスワードを入力してください
            </p>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", marginBottom: 6, fontWeight: "bold", fontSize: 14 }}>
                  新しいパスワード
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="6文字以上で入力"
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
                  新しいパスワード（確認）
                </label>
                <input
                  type="password"
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  placeholder="もう一度入力してください"
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

              <p style={{ fontSize: 12, color: "#9ca3af", marginBottom: 20, marginTop: 4 }}>
                ※ 6文字以上で設定してください
              </p>

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
                {loading ? "更新中..." : "パスワードを変更する"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
