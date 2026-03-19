// src/pages/Scenario.jsx
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { scenarios } from "../data/scenarios";


export default function Scenario({ username, loginStreak }) {
  const navigate = useNavigate();
  const [hoverId, setHoverId] = useState(null);


  return (
    <main
      style={{
        maxWidth: 900,
        margin: "0 auto",
        padding: "40px 20px",
      }}
    >
      {/* ユーザー名がある場合は挨拶とストリークを表示 */}
      {username && (
        <div style={{ marginBottom: 20 }}>
          <p style={{ fontSize: 15, color: "#2563eb", fontWeight: "bold", margin: "0 0 6px" }}>
            {username}さん、今日も面談力を磨きましょう。
          </p>
          {loginStreak >= 1 && (
            <p style={{ fontSize: 13, color: "#ea580c", margin: 0, fontWeight: "bold" }}>
              🔥 {loginStreak}日連続継続中！
            </p>
          )}
        </div>
      )}
      <h1
        style={{
          fontSize: 24,
          marginBottom: 24,
        }}
      >
        ケース一覧
      </h1>

      {scenarios.map((s, index) => (
        <div
          key={s.id}
          style={{
            border: "1px solid #e5e7eb",
            borderRadius: 12,
            padding: 20,
            marginBottom: 20,
            background: "#ffffff",
            boxShadow: "0 4px 12px rgba(0,0,0,0.04)",
          }}
        >
          <div
            style={{
              marginBottom: 8,
              color: "#2563eb",
              fontWeight: "bold",
            }}
          >
            CASE {String(index + 1).padStart(2, "0")}
          </div>

          <h3 style={{ margin: "4px 0 8px" }}>{s.name}</h3>

          <p
  style={{
    margin: 0,
    color: "#6b7280",
    fontSize: 14,
  }}
>
  テーマ：{s.theme}
</p>


          <p
            style={{
              margin: "4px 0 16px",
              fontSize: 13,
              color: "#9ca3af",
            }}
          >
            難易度：{s.difficulty}
          </p>

          <button
  onClick={() => navigate(`/roleplay?case=${s.id}`)}
  onMouseEnter={() => setHoverId(s.id)}
  onMouseLeave={() => setHoverId(null)}
  style={{
    padding: "10px 18px",
    borderRadius: 8,
    border: "none",
    background:
      hoverId === s.id
        ? "linear-gradient(180deg, #1d4ed8, #1e40af)"
        : "linear-gradient(180deg, #2563eb, #1d4ed8)",
    color: "#fff",
    fontWeight: "bold",
    cursor: "pointer",
    transition: "all 0.2s ease",
    transform: hoverId === s.id ? "translateY(-2px)" : "none",
    boxShadow:
      hoverId === s.id
        ? "0 6px 14px rgba(37,99,235,0.35)"
        : "none",
  }}
>
  ロールプレイ開始
</button>

        </div>
      ))}
    </main>
  );
}
