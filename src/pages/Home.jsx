// src/pages/Home.jsx - ランディングページ
import { useNavigate, Link } from "react-router-dom";
import { useState } from "react";

export default function Home() {
  const navigate = useNavigate();
  const [hoverStart, setHoverStart] = useState(false);

  return (
    <div style={{ background: "#f3f6fb", minHeight: "100vh", fontFamily: "sans-serif" }}>

      {/* ===== ヒーローセクション ===== */}
      <section style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "60px 20px 40px",
      }}>
        {/* バッジ */}
        <div style={{
          display: "inline-block",
          background: "#dbeafe",
          color: "#1d4ed8",
          fontSize: 13,
          fontWeight: "bold",
          padding: "4px 14px",
          borderRadius: 99,
          marginBottom: 20,
        }}>
          2級キャリアコンサルティング技能検定 対策
        </div>

        {/* メインタイトル */}
        <h1 style={{ fontSize: 30, fontWeight: "bold", lineHeight: 1.5, marginBottom: 20, maxWidth: 560 }}>
          本番さながらの面接練習を、<br />
          AIと一緒に。
        </h1>

        {/* サブタイトル */}
        <p style={{ fontSize: 16, color: "#4b5563", maxWidth: 480, lineHeight: 1.9, marginBottom: 36 }}>
          実技（面接）試験のロールプレイをAIクライアントと練習し、
          試験の4区分評価に沿った客観的なフィードバックを受けられます。
        </p>

        {/* CTAボタン：1つに絞る（ログインはヘッダーへ） */}
        <button
          onClick={() => navigate("/scenario?mode=signup")}
          onMouseEnter={() => setHoverStart(true)}
          onMouseLeave={() => setHoverStart(false)}
          style={{
            background: hoverStart ? "#1d4ed8" : "#2563eb",
            color: "#fff",
            border: "none",
            padding: "16px 40px",
            fontSize: 17,
            borderRadius: 12,
            fontWeight: "bold",
            cursor: "pointer",
            transition: "all 0.2s ease",
            transform: hoverStart ? "translateY(-2px)" : "none",
            boxShadow: hoverStart ? "0 8px 20px rgba(37,99,235,0.4)" : "0 2px 8px rgba(37,99,235,0.2)",
          }}
        >
          今すぐ始める
        </button>

        {/* 料金ヒント */}
        <p style={{ marginTop: 16, fontSize: 13, color: "#9ca3af" }}>
          月額5,000円（税込）・いつでも解約可能
        </p>
      </section>

      {/* ===== 特徴セクション ===== */}
      <section style={{ background: "#fff", padding: "60px 20px" }}>
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <h2 style={{ textAlign: "center", fontSize: 22, fontWeight: "bold", marginBottom: 40 }}>
            このサービスでできること
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 24 }}>
            {[
              {
                icon: "🎭",
                title: "本番想定のロールプレイ",
                desc: "実際の試験を想定した5種類のケースでAIクライアントと面接練習ができます。",
              },
              {
                icon: "📊",
                title: "AIによる4区分評価",
                desc: "試験の評価基準（態度・展開・見立て・具体的展開）に沿ったフィードバックを受けられます。",
              },
              {
                icon: "🔄",
                title: "何度でも繰り返し練習",
                desc: "場所・時間を選ばず、繰り返し練習することで着実にスキルアップできます。",
              },
            ].map((item) => (
              <div key={item.title} style={{
                background: "#f9fafb",
                borderRadius: 12,
                padding: 28,
                textAlign: "center",
              }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>{item.icon}</div>
                <h3 style={{ fontSize: 16, fontWeight: "bold", marginBottom: 10 }}>{item.title}</h3>
                <p style={{ fontSize: 14, color: "#6b7280", lineHeight: 1.7 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== こんな方におすすめセクション ===== */}
      <section style={{ padding: "60px 20px" }}>
        <div style={{ maxWidth: 600, margin: "0 auto" }}>
          <h2 style={{ textAlign: "center", fontSize: 22, fontWeight: "bold", marginBottom: 32 }}>
            こんな方におすすめ
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[
              "2級キャリアコンサルティング技能検定の実技試験を受ける予定がある",
              "面接練習の機会が少なく、自分のペースで繰り返し練習したい",
              "試験の評価基準に沿ったフィードバックが欲しい",
              "本番前に場数を踏んでおきたい",
            ].map((text) => (
              <div key={text} style={{
                background: "#fff",
                border: "1px solid #e5e7eb",
                borderRadius: 10,
                padding: "14px 20px",
                display: "flex",
                alignItems: "flex-start",
                gap: 10,
                fontSize: 15,
                color: "#374151",
                lineHeight: 1.6,
              }}>
                <span style={{ color: "#2563eb", fontWeight: "bold", flexShrink: 0 }}>✓</span>
                {text}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== 使い方セクション ===== */}
      <section style={{ background: "#fff", padding: "60px 20px" }}>
        <div style={{ maxWidth: 700, margin: "0 auto" }}>
          <h2 style={{ textAlign: "center", fontSize: 22, fontWeight: "bold", marginBottom: 40 }}>
            使い方は3ステップ
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {[
              { step: "01", title: "ケースを選ぶ", desc: "5種類のケースから練習したいシナリオを選択します。" },
              { step: "02", title: "AIとロールプレイ", desc: "AIクライアントと面接のロールプレイを行います。本番を想定して取り組んでみましょう。" },
              { step: "03", title: "フィードバックを確認", desc: "試験の4区分評価に沿ったAIのフィードバックを確認し、改善点を把握します。" },
            ].map((item) => (
              <div key={item.step} style={{
                display: "flex",
                gap: 20,
                alignItems: "flex-start",
              }}>
                <div style={{
                  background: "#2563eb",
                  color: "#fff",
                  fontWeight: "bold",
                  fontSize: 14,
                  borderRadius: 8,
                  padding: "6px 12px",
                  flexShrink: 0,
                }}>
                  {item.step}
                </div>
                <div>
                  <h3 style={{ fontWeight: "bold", marginBottom: 4, fontSize: 16 }}>{item.title}</h3>
                  <p style={{ fontSize: 14, color: "#6b7280", lineHeight: 1.7 }}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== 料金セクション ===== */}
      <section style={{ padding: "60px 20px" }}>
        <div style={{ maxWidth: 480, margin: "0 auto", textAlign: "center" }}>
          <h2 style={{ fontSize: 22, fontWeight: "bold", marginBottom: 32 }}>料金</h2>
          <div style={{
            background: "#fff",
            border: "2px solid #2563eb",
            borderRadius: 16,
            padding: "36px 32px",
          }}>
            <div style={{ fontSize: 14, color: "#6b7280", marginBottom: 8 }}>月額プラン</div>
            <div style={{ fontSize: 40, fontWeight: "bold", color: "#1f2937", marginBottom: 4 }}>
              ¥5,000
              <span style={{ fontSize: 16, fontWeight: "normal", color: "#6b7280" }}> / 月（税込）</span>
            </div>
            <p style={{ fontSize: 13, color: "#9ca3af", marginBottom: 28 }}>いつでも解約可能</p>
            <ul style={{ textAlign: "left", fontSize: 14, color: "#4b5563", lineHeight: 2.2, marginBottom: 28, paddingLeft: 20 }}>
              <li>5種類のケースが使い放題</li>
              <li>何度でもロールプレイ練習可能</li>
              <li>AIによる4区分評価フィードバック</li>
              <li>解約はいつでもOK</li>
            </ul>
            <button
              onClick={() => navigate("/scenario")}
              style={{
                background: "#2563eb",
                color: "#fff",
                border: "none",
                padding: "14px 0",
                width: "100%",
                fontSize: 16,
                borderRadius: 10,
                fontWeight: "bold",
                cursor: "pointer",
              }}
            >
              今すぐ始める
            </button>
          </div>
        </div>
      </section>

      {/* ===== フッター ===== */}
      <footer style={{
        textAlign: "center",
        padding: "24px 20px",
        fontSize: 13,
        color: "#9ca3af",
        borderTop: "1px solid #e5e7eb",
        display: "flex",
        justifyContent: "center",
        gap: 16,
        flexWrap: "wrap",
      }}>
        <Link to="/legal" style={{ color: "#6b7280", textDecoration: "underline" }}>特定商取引法に基づく表記</Link>
        <Link to="/privacy" style={{ color: "#6b7280", textDecoration: "underline" }}>プライバシーポリシー</Link>
        <Link to="/terms" style={{ color: "#6b7280", textDecoration: "underline" }}>利用規約</Link>
      </footer>

    </div>
  );
}
