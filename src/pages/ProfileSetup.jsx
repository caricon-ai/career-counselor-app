// src/pages/ProfileSetup.jsx
// 初回ログイン後に表示されるプロフィール設定ページ
// ユーザー名と受験予定時期を登録する

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

// 受験予定時期の選択肢
const EXAM_PERIODS = [
  "2026年前期",
  "2026年後期",
  "2027年前期",
  "2027年後期",
  "まだ決まっていない",
];

export default function ProfileSetup({ userId, onComplete }) {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [examPeriod, setExamPeriod] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim()) {
      setError("お名前（呼び名）を入力してください。");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Supabaseのprofilesテーブルにデータを保存する
      const { error } = await supabase.from("profiles").insert({
        id: userId,
        username: username.trim(),
        exam_period: examPeriod || null,
      });
      if (error) throw error;

      // 完了したら親コンポーネントに通知（App.jsxがプロフィールを再読み込みする）
      onComplete({ username: username.trim(), exam_period: examPeriod || null });
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
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>👤</div>
          <h2 style={{ fontSize: 22, fontWeight: "bold", marginBottom: 8 }}>
            プロフィールを設定しましょう
          </h2>
          <p style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.7 }}>
            練習中にお名前でお呼びします。<br />
            呼び名は本名でなくても大丈夫です。
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* ユーザー名入力 */}
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
            <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 4 }}>
              ※ 20文字以内・本名でなくてもOK
            </p>
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
                color: examPeriod ? "#111827" : "#9ca3af",
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
            }}
          >
            {loading ? "保存中..." : "練習を始める →"}
          </button>
        </form>
      </div>
    </div>
  );
}
