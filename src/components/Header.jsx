import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";



export default function Header({ rightContent }) {
  const navigate = useNavigate();
  const location = useLocation();
const isHome = location.pathname === "/";
  const [hoverTop, setHoverTop] = useState(false);


  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 100,
        height: 56,
        background: "#1f2937",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 20px",
        color: "#ffffff",
      }}
    >
      {/* 左：ロゴ */}
      <div style={{ fontWeight: "bold", fontSize: 14 }}>
        Career Counselor AI
      </div>

      {/* 右：任意ボタン or デフォルト */}
      <div>
  {!isHome && (
    rightContent ? (
      rightContent
    ) : (
      <button
        onClick={() => navigate("/")}
        onMouseEnter={() => setHoverTop(true)}
        onMouseLeave={() => setHoverTop(false)}
        style={{
          background: hoverTop ? "#1d4ed8" : "#2563eb",
          border: "none",
          color: "#fff",
          padding: "6px 14px",
          borderRadius: 8,
          fontSize: 13,
          fontWeight: "bold",
          cursor: "pointer",
          transition: "all 0.2s ease",
          transform: hoverTop ? "translateY(-1px)" : "none",
          boxShadow: hoverTop
            ? "0 4px 10px rgba(37,99,235,0.35)"
            : "none",
        }}
      >
        トップへ戻る
      </button>
    )
  )}
</div>

    </header>
  );
}
