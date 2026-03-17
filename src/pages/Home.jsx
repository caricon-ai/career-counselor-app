import { useNavigate, Link } from "react-router-dom";
import { useState } from "react";

import Header from "../components/Header";


export default function Home() {
  const navigate = useNavigate();
  const [hoverStart, setHoverStart] = useState(false); 
  return (
    <div style={{ minHeight: "100vh", background: "#f3f6fb" }}>
      
      

      <main
        style={{
          minHeight: "calc(100vh - 56px)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: "0 20px",
        }}
      >
        <h1
          style={{
            fontSize: 28,
            fontWeight: "bold",
            marginBottom: 20,
            lineHeight: 1.4,
          }}
        >
          2級キャリアコンサルティング技能検定
          <br />
          実技（面接）ロールプレイ
        </h1>

        <p
          style={{
            fontSize: 16,
            color: "#4b5563",
            maxWidth: 520,
            marginBottom: 32,
            lineHeight: 1.8,
          }}
        >
          本番試験を想定したロールプレイと
          <br />
          AIによる客観的フィードバックで
          <br />
          実践力を高める練習ができます。
        </p>

        <button
  onClick={() => navigate("/scenario")}
  onMouseEnter={() => setHoverStart(true)}
  onMouseLeave={() => setHoverStart(false)}
  style={{
    background: hoverStart
      ? "linear-gradient(180deg, #1d4ed8, #1e40af)"
      : "linear-gradient(180deg, #2563eb, #1d4ed8)",
    color: "#fff",
    border: "none",
    padding: "14px 28px",
    fontSize: 16,
    borderRadius: 12,
    fontWeight: "bold",
    cursor: "pointer",
    transition: "all 0.2s ease",
    transform: hoverStart ? "translateY(-2px)" : "none",
    boxShadow: hoverStart
      ? "0 6px 14px rgba(37,99,235,0.35)"
      : "none",
  }}
>
  ケースを選んで始める
</button>

      </main>

      <footer style={{ textAlign: "center", padding: "20px", fontSize: 13, color: "#9ca3af" }}>
        <Link to="/legal" style={{ color: "#6b7280", textDecoration: "underline" }}>
          特定商取引法に基づく表記
        </Link>
      </footer>
    </div>
  );
}
