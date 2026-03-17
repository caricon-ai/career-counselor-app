import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function Header({ rightContent, session }) {
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
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        {!isHome && (
          rightContent ? rightContent : (
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
              }}
            >
              トップへ戻る
            </button>
          )
        )}
        {session && (
          <button
            onClick={() => supabase.auth.signOut()}
            style={{
              background: "transparent",
              border: "1px solid #6b7280",
              color: "#d1d5db",
              padding: "6px 14px",
              borderRadius: 8,
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            ログアウト
          </button>
        )}
      </div>

    </header>
  );
}
