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
import ResetPassword from "./pages/ResetPassword";
import ProfileSetup from "./pages/ProfileSetup";
import ProfileEdit from "./pages/ProfileEdit";
import Header from "./components/Header";
import { supabase } from "./lib/supabase";

// ログイン不要で見られるページ
const PUBLIC_PATHS = ["/", "/legal", "/privacy", "/terms", "/payment", "/payment-success", "/reset-password"];

export default function App() {
  const [session, setSession] = useState(undefined);
  const [isSubscribed, setIsSubscribed] = useState(false);
  // 最初からtrueにして、確認完了まで必ずローディングを表示する
  const [checkingSubscription, setCheckingSubscription] = useState(true);
  // プロフィール情報（null=未確認、false=未設定、object=設定済み）
  const [profile, setProfile] = useState(null);
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

    // ログイン連続日数を更新する関数
    // 今日初めてのアクセスかどうかを判定してストリークを更新する
    const updateLoginStreak = async (userId, currentProfile) => {
      if (!currentProfile) return currentProfile;

      const today = new Date().toISOString().slice(0, 10); // "2026-03-20" 形式
      const lastDate = currentProfile.last_login_date;

      // 今日すでにアクセス済みなら何もしない
      if (lastDate === today) return currentProfile;

      // 昨日かどうかを計算
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().slice(0, 10);

      // 昨日ログインしていれば+1、それ以外はリセット
      const newStreak = lastDate === yesterdayStr
        ? (currentProfile.login_streak || 1) + 1
        : 1;

      const { data } = await supabase
        .from("profiles")
        .update({ login_streak: newStreak, last_login_date: today })
        .eq("id", userId)
        .select("username, exam_period, login_streak, last_login_date")
        .maybeSingle();

      return data || currentProfile;
    };

    // オーナーは常にアクセス可能（プロフィールは確認する）
    const OWNER_EMAILS = ["kasane1101@gmail.com"];
    if (OWNER_EMAILS.includes(session.user.email)) {
      setIsSubscribed(true);
      supabase
        .from("profiles")
        .select("username, exam_period, login_streak, last_login_date")
        .eq("id", session.user.id)
        .maybeSingle()
        .then(async ({ data }) => {
          const updated = await updateLoginStreak(session.user.id, data);
          setProfile(updated || false);
          setCheckingSubscription(false);
        });
      return;
    }

    // ログイン済みの場合、サブスクリプションとプロフィールを確認
    const checkSubscription = async () => {
      const [subResult, profileResult] = await Promise.all([
        supabase
          .from("subscriptions")
          .select("status")
          .eq("user_id", session.user.id)
          .limit(1)
          .maybeSingle(),
        supabase
          .from("profiles")
          .select("username, exam_period, login_streak, last_login_date")
          .eq("id", session.user.id)
          .maybeSingle(),
      ]);

      if (subResult.error) console.error("サブスクリプション確認エラー:", subResult.error);
      setIsSubscribed(subResult.data?.status === "active");

      const updated = await updateLoginStreak(session.user.id, profileResult.data);
      setProfile(updated || false);
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

  // サブスク済みでプロフィール未設定の場合はプロフィール入力画面を表示
  const appPaths2 = ["/scenario", "/roleplay", "/result"];
  if (session && isSubscribed && profile === false && appPaths2.includes(location.pathname)) {
    return (
      <ProfileSetup
        userId={session.user.id}
        onComplete={(newProfile) => setProfile(newProfile)}
      />
    );
  }

  return (
    <>
      <Header session={session} username={profile?.username} />
      <Routes>
        {/* 公開ページ */}
        <Route path="/" element={<Home />} />
        <Route path="/legal" element={<LegalPage />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/payment" element={<Payment />} />
        <Route path="/payment-success" element={<PaymentSuccess />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* ログイン＋サブスクリプション必須ページ */}
        <Route path="/scenario" element={session ? <Scenario username={profile?.username} loginStreak={profile?.login_streak} /> : <Login />} />
        <Route path="/profile-edit" element={session ? <ProfileEdit profile={profile} userId={session.user.id} onUpdate={(p) => setProfile(p)} /> : <Login />} />
        <Route path="/roleplay" element={session ? <RolePlay /> : <Login />} />
        <Route path="/result" element={session ? <Result /> : <Login />} />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </>
  );
}
