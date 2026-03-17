import { useEffect, useState } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import Home from "./pages/Home";
import Scenario from "./pages/Scenario";
import RolePlay from "./pages/RolePlay";
import Result from "./pages/Result";
import Login from "./pages/Login";
import LegalPage from "./pages/LegalPage";
import Header from "./components/Header";
import { supabase } from "./lib/supabase";

// ログイン不要で見られるページ
const PUBLIC_PATHS = ["/", "/legal"];

export default function App() {
  const [session, setSession] = useState(undefined);
  const location = useLocation();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

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

  // 公開ページ（/・/legal）は未ログインでも見られる
  const isPublic = PUBLIC_PATHS.includes(location.pathname);

  // 非公開ページで未ログインならログイン画面へ
  if (!session && !isPublic) {
    return <Login />;
  }

  return (
    <>
      <Header session={session} />
      <Routes>
        {/* 公開ページ */}
        <Route path="/" element={<Home />} />
        <Route path="/legal" element={<LegalPage />} />

        {/* ログイン必須ページ */}
        <Route path="/scenario" element={session ? <Scenario /> : <Login />} />
        <Route path="/roleplay" element={session ? <RolePlay /> : <Login />} />
        <Route path="/result" element={session ? <Result /> : <Login />} />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </>
  );
}
