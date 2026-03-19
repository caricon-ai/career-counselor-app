// src/pages/ProfileEdit.jsx
// ログイン済みユーザーがプロフィールを編集するページ

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

const EXAM_PERIODS = [
  "2026年前期", "2026年後期", "2027年前期", "2027年後期", "まだ決まっていない",
];

const PREFECTURES = [
  "北海道", "青森県", "岩手県", "宮城県", "秋田県", "山形県", "福島県",
  "茨城県", "栃木県", "群馬県", "埼玉県", "千葉県", "東京都", "神奈川県",
  "新潟県", "富山県", "石川県", "福井県", "山梨県", "長野県", "岐阜県",
  "静岡県", "愛知県", "三重県", "滋賀県", "京都府", "大阪府", "兵庫県",
  "奈良県", "和歌山県", "鳥取県", "島根県", "岡山県", "広島県", "山口県",
  "徳島県", "香川県", "愛媛県", "高知県", "福岡県", "佐賀県", "長崎県",
  "熊本県", "大分県", "宮崎県", "鹿児島県", "沖縄県",
];

const STUDY_HISTORIES = [
  "勉強を始めたばかり（3ヶ月未満）",
  "3ヶ月〜6ヶ月",
  "6ヶ月〜1年",
  "1年〜2年",
  "2年以上",
];

function Field({ label, required, children }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <label style={{ display: "block", marginBottom: 6, fontWeight: "bold", fontSize: 14 }}>
        {label}{required && <span style={{ color: "#ef4444" }}>*</span>}
      </label>
      {children}
    </div>
  );
}

const inputStyle = {
  width: "100%",
  padding: 10,
  borderRadius: 8,
  border: "1px solid #ccc",
  boxSizing: "border-box",
  fontSize: 15,
  background: "#fff",
};

export default function ProfileEdit({ profile, userId, onUpdate }) {
  const navigate = useNavigate();
  const [username, setUsername] = useState(profile?.username || "");
  const [age, setAge] = useState(profile?.age ? String(profile.age) : "");
  const [prefecture, setPrefecture] = useState(profile?.prefecture || "");
  const [examPeriod, setExamPeriod] = useState(profile?.exam_period || "");
  const [studyHistory, setStudyHistory] = useState(profile?.study_history || "");
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
      const { data, error } = await supabase
        .from("profiles")
        .update({
          username: username.trim(),
          age: age ? parseInt(age) : null,
          prefecture: prefecture || null,
          exam_period: examPeriod || null,
          study_history: studyHistory || null,
        })
        .eq("id", userId)
        .select("username, age, prefecture, exam_period, study_history, login_streak, last_login_date")
        .maybeSingle();

      if (error) throw error;

      onUpdate(data);
      setDone(true);
    } catch (err) {
      setError("保存に失敗しました。もう一度お試しください。");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f3f6fb", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
      <div style={{ background: "#fff", borderRadius: 12, padding: 40, width: "100%", maxWidth: 440, boxShadow: "0 2px 16px rgba(0,0,0,0.08)" }}>
        {done ? (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
            <h2 style={{ fontSize: 20, fontWeight: "bold", marginBottom: 20 }}>プロフィールを更新しました</h2>
            <button
              onClick={() => navigate("/scenario")}
              style={{ width: "100%", padding: 12, background: "linear-gradient(180deg, #2563eb, #1d4ed8)", color: "#fff", border: "none", borderRadius: 8, fontWeight: "bold", cursor: "pointer", fontSize: 15 }}
            >
              ケース一覧へ戻る
            </button>
          </div>
        ) : (
          <>
            <h2 style={{ textAlign: "center", marginBottom: 28, fontSize: 22, fontWeight: "bold" }}>プロフィール編集</h2>

            <form onSubmit={handleSubmit}>
              {/* ユーザー名 */}
              <Field label="お名前（呼び名）" required>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="例：田中、たなか、Tanaka"
                  maxLength={20}
                  required
                  style={inputStyle}
                />
              </Field>

              {/* 年齢 */}
              <Field label="年齢">
                <input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="例：35"
                  min={18}
                  max={80}
                  style={inputStyle}
                />
              </Field>

              {/* 都道府県 */}
              <Field label="都道府県">
                <select value={prefecture} onChange={(e) => setPrefecture(e.target.value)} style={inputStyle}>
                  <option value="">選択してください（任意）</option>
                  {PREFECTURES.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </Field>

              {/* キャリコン勉強歴 */}
              <Field label="キャリコン勉強歴">
                <select value={studyHistory} onChange={(e) => setStudyHistory(e.target.value)} style={inputStyle}>
                  <option value="">選択してください（任意）</option>
                  {STUDY_HISTORIES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </Field>

              {/* 受験予定時期 */}
              <Field label="受験予定時期">
                <select value={examPeriod} onChange={(e) => setExamPeriod(e.target.value)} style={inputStyle}>
                  <option value="">選択してください（任意）</option>
                  {EXAM_PERIODS.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </Field>

              {error && (
                <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 14, color: "#b91c1c" }}>
                  ⚠️ {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                style={{ width: "100%", padding: 12, background: "linear-gradient(180deg, #2563eb, #1d4ed8)", color: "#fff", border: "none", borderRadius: 8, fontWeight: "bold", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1, fontSize: 16, marginBottom: 12, marginTop: 8 }}
              >
                {loading ? "保存中..." : "保存する"}
              </button>

              <button
                type="button"
                onClick={() => navigate("/scenario")}
                style={{ width: "100%", padding: 12, background: "transparent", color: "#6b7280", border: "1px solid #e5e7eb", borderRadius: 8, cursor: "pointer", fontSize: 14 }}
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
