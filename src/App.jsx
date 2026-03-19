import { useEffect, useState } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import Home from "./pages/Home";
import Scenario from "./pages/Scenario";
import RolePlay from "./pages/RolePlay";
import Result from "./pages/Result";
import Login from "./pages/Login";
import LegalPage from "./pages/LegalPage";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import Terms from "./pages/Terms";
import Payment from "./pages/Payment";
import PaymentSuccess from "./pages/PaymentSuccess";
import Header from "./components/Header";
import { supabase } from "./lib/supabase";

// ログイン不要で見られるページ
const PUBLIC_PATHS = ["/", "/legal", "/privacy", "/terms", "/payment", "/payment-success"];

export default function App() {
  const [session, setSession] = useState(undefined);
  const [isSubscribed, setIsSubscribed] = useState(false);
  // 最初からtrueにして、確認完了まで必ずローディングを表示する
  const [checkingSubscription, setCheckingSubscription] = useState(true);
  const location = useLocation();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      // ログインしたとき、サブスクリプション確認が終わるまでローディング状態にする
      // こうしないと「確認前に /payment に飛ばされる」バグが起きる
      if (session) {
        setCheckingSubscription(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // ログイン済みのときにサブスクリプション状態を確認
  useEffect(() => {
    // sessionがまだ確認中（undefined）の場合は何もしない
    if (session === undefined) return;

    // 未ログインの場合
    if (!session) {
      setIsSubscribed(false);
      setCheckingSubscription(false);
      return;
    }

    // オーナーは常にアクセス可能
    const OWNER_EMAILS = ["kasane1101@gmail.com"];
    if (OWNER_EMAILS.includes(session.user.email)) {
      setIsSubscribed(true);
      setCheckingSubscription(false);
      return;
    }

    // ログイン済みの場合、サブスクリプションを確認
    const checkSubscription = async () => {
      const { data, error } = await supabase
        .from("subscriptions")
        .select("status")
        .eq("user_id", session.user.id)
        .limit(1)
        .maybeSingle();

      if (error) console.error("サブスクリプション確認エラー:", error);
      setIsSubscribed(data?.status === "active");
      setCheckingSubscription(false);
    };

    checkSubscription();
  }, [session]);

  // 確認中はローディング表示
  if (session === undefined || checkingSubscription) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        読み込み中...
      </div>
    );
  }

  // 公開ページは未ログインでも見られる
  const isPublic = PUBLIC_PATHS.includes(location.pathname);

  // 非公開ページで未ログインならログイン画面へ
  if (!session && !isPublic) {
    return <Login />;
  }

  // ログイン済みだが未払いの場合、アプリページへのアクセスは支払いページへ
  const appPaths = ["/scenario", "/roleplay", "/result"];
  const isAppPath = appPaths.includes(location.pathname);
  if (session && !isSubscribed && isAppPath) {
    return <Navigate to="/payment" />;
  }

  return (
    <>
      <Header session={session} />
      <Routes>
        {/* 公開ページ */}
        <Route path="/" element={<Home />} />
        <Route path="/legal" element={<LegalPage />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/payment" element={<Payment />} />
        <Route path="/payment-success" element={<PaymentSuccess />} />

        {/* ログイン＋サブスクリプション必須ページ */}
        <Route path="/scenario" element={session ? <Scenario /> : <Login />} />
        <Route path="/roleplay" element={session ? <RolePlay /> : <Login />} />
        <Route path="/result" element={session ? <Result /> : <Login />} />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </>
  );
}
