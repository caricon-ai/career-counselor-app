import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function Header({ rightContent, session }) {
  const navigate = useNavigate();
  const location = useLocation();
  const isHome = location.pathname === "/";
  const [hoverLogin, setHoverLogin] = useState(false);

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
        padding: "0 24px",
        color: "#ffffff",
      }}
    >
      {/* 左：ロゴ（クリックでトップへ） */}
      <div
        onClick={() => navigate("/")}
        style={{ fontWeight: "bold", fontSize: 15, cursor: "pointer", letterSpacing: "0.02em" }}
      >
        Career Counselor AI
      </div>

      {/* 右：ナビゲーション */}
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        {rightContent}

        {/* ホームページで未ログインの場合：ログインボタンを表示 */}
        {isHome && !session && (
          <button
            onClick={() => navigate("/scenario")}
            onMouseEnter={() => setHoverLogin(true)}
            onMouseLeave={() => setHoverLogin(false)}
            style={{
              background: "transparent",
              border: "1px solid #4b5563",
              color: hoverLogin ? "#ffffff" : "#d1d5db",
              padding: "6px 16px",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: "bold",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            ログイン
          </button>
        )}

        {/* ホーム以外のページ：トップへ戻るボタン */}
        {!isHome && !session && (
          <button
            onClick={() => navigate("/")}
            style={{
              background: "transparent",
              border: "1px solid #4b5563",
              color: "#d1d5db",
              padding: "6px 16px",
              borderRadius: 8,
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            トップへ戻る
          </button>
        )}

        {/* ログイン済みの場合：ログアウトボタン */}
        {session && (
          <button
            onClick={() => supabase.auth.signOut()}
            style={{
              background: "transparent",
              border: "1px solid #6b7280",
              color: "#d1d5db",
              padding: "6px 16px",
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
