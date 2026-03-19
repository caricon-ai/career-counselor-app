// src/pages/ProfileEdit.jsx
// ログイン済みユーザーがプロフィールを編集するページ

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

const EXAM_PERIODS = [
  "2026年前期",
  "2026年後期",
  "2027年前期",
  "2027年後期",
  "まだ決まっていない",
];

export default function ProfileEdit({ profile, userId, onUpdate }) {
  const navigate = useNavigate();
  const [username, setUsername] = useState(profile?.username || "");
  const [examPeriod, setExamPeriod] = useState(profile?.exam_period || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim()) {
      setError("お名前（呼び名）を入力してください。");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Supabaseのprofilesテーブルを更新する
      const { data, error } = await supabase
        .from("profiles")
        .update({
          username: username.trim(),
          exam_period: examPeriod || null,
        })
        .eq("id", userId)
        .select("username, exam_period, login_streak, last_login_date")
        .maybeSingle();

      if (error) throw error;

      // 親コンポーネント（App.jsx）のプロフィール情報を更新
      onUpdate(data);
      setDone(true);
    } catch (err) {
      setError("保存に失敗しました。もう一度お試しください。");
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
          maxWidth: 440,
          boxShadow: "0 2px 16px rgba(0,0,0,0.08)",
        }}
      >
        {done ? (
          /* 保存完了画面 */
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
            <h2 style={{ fontSize: 20, fontWeight: "bold", marginBottom: 12 }}>
              プロフィールを更新しました
            </h2>
            <button
              onClick={() => navigate("/scenario")}
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
              ケース一覧へ戻る
            </button>
          </div>
        ) : (
          <>
            <h2 style={{ textAlign: "center", marginBottom: 28, fontSize: 22, fontWeight: "bold" }}>
              プロフィール編集
            </h2>

            <form onSubmit={handleSubmit}>
              {/* ユーザー名 */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", marginBottom: 6, fontWeight: "bold", fontSize: 14 }}>
                  お名前（呼び名）<span style={{ color: "#ef4444" }}>*</span>
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="例：田中、たなか、Tanaka"
                  maxLength={20}
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

              {/* 受験予定時期 */}
              <div style={{ marginBottom: 28 }}>
                <label style={{ display: "block", marginBottom: 6, fontWeight: "bold", fontSize: 14 }}>
                  受験予定時期
                </label>
                <select
                  value={examPeriod}
                  onChange={(e) => setExamPeriod(e.target.value)}
                  style={{
                    width: "100%",
                    padding: 10,
                    borderRadius: 8,
                    border: "1px solid #ccc",
                    boxSizing: "border-box",
                    fontSize: 15,
                    background: "#fff",
                  }}
                >
                  <option value="">選択してください（任意）</option>
                  {EXAM_PERIODS.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
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
                  marginBottom: 12,
                }}
              >
                {loading ? "保存中..." : "保存する"}
              </button>

              <button
                type="button"
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
                キャンセル
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
