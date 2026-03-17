import { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import Scenario from "./pages/Scenario";
import RolePlay from "./pages/RolePlay";
import Result from "./pages/Result";
import Login from "./pages/Login";
import Header from "./components/Header";
import { supabase } from "./lib/supabase";

export default function App() {
  const [session, setSession] = useState(undefined); // undefined = 確認中

  useEffect(() => {
    // 現在のセッションを取得
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    // ログイン・ログアウトを監視
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // 確認中はローディング表示
  if (session === undefined) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        読み込み中...
      </div>
    );
  }

  // 未ログインはログイン画面へ
  if (!session) {
    return <Login />;
  }

  // ログイン済みは通常のアプリ
  return (
    <>
      <Header session={session} />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/scenario" element={<Scenario />} />
        <Route path="/roleplay" element={<RolePlay />} />
        <Route path="/result" element={<Result />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </>
  );
}
