// src/pages/Home.jsx - ランディングページ
import { useNavigate, Link } from "react-router-dom";
import { useState } from "react";

// よくある質問のデータ
const FAQS = [
  {
    q: "AIとの練習で本当に効果がありますか？",
    a: "はい。本番を想定した5種類のケースで繰り返し練習できるため、実際の面接試験に近い感覚を身につけられます。また試験の4区分評価（態度・展開・見立て・具体的展開）に沿ったフィードバックにより、自分の弱点を客観的に把握できます。",
  },
  {
    q: "どんなケースが用意されていますか？",
    a: "転職・キャリアチェンジ・職場の人間関係・将来への不安など、実際の試験で出題されやすいテーマを5種類用意しています。いずれも2級の実技試験を想定したシナリオです。",
  },
  {
    q: "スマートフォンでも使えますか？",
    a: "はい、スマートフォン・タブレット・PCどのデバイスでも利用できます。通勤中や隙間時間にも練習できます。",
  },
  {
    q: "解約はいつでもできますか？",
    a: "はい、いつでも解約できます。解約後も現在の契約期間の終了日まで利用可能です。違約金・手数料は一切かかりません。",
  },
  {
    q: "1級の試験にも使えますか？",
    a: "現在のコンテンツは2級の実技試験に特化して設計されています。1級向けのケースは現在準備中です。",
  },
];

// FAQ 1件分のコンポーネント
function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      style={{
        borderBottom: "1px solid #e5e7eb",
        padding: "18px 0",
      }}
    >
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: "100%",
          background: "none",
          border: "none",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          cursor: "pointer",
          textAlign: "left",
          gap: 12,
          padding: 0,
        }}
      >
        <span style={{ fontWeight: "bold", fontSize: 15, color: "#1f2937", lineHeight: 1.6 }}>
          {q}
        </span>
        <span style={{ fontSize: 20, color: "#2563eb", flexShrink: 0, transition: "transform 0.2s", transform: open ? "rotate(45deg)" : "none" }}>
          +
        </span>
      </button>
      {open && (
        <p style={{ marginTop: 12, fontSize: 14, color: "#4b5563", lineHeight: 1.9 }}>
          {a}
        </p>
      )}
    </div>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const [hoverStart, setHoverStart] = useState(false);
  const [hoverStart2, setHoverStart2] = useState(false);

  return (
    <div style={{ background: "#f8fafc", minHeight: "100vh", fontFamily: "sans-serif" }}>

      {/* ===== B. ヒーローセクション（強化版） ===== */}
      <section style={{
        background: "linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 50%, #2563eb 100%)",
        minHeight: "92vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "80px 20px 60px",
        position: "relative",
        overflow: "hidden",
      }}>
        {/* 背景装飾 */}
        <div style={{
          position: "absolute", top: -80, right: -80,
          width: 300, height: 300,
          background: "rgba(255,255,255,0.05)",
          borderRadius: "50%",
        }} />
        <div style={{
          position: "absolute", bottom: -60, left: -60,
          width: 200, height: 200,
          background: "rgba(255,255,255,0.05)",
          borderRadius: "50%",
        }} />

        {/* バッジ */}
        <div style={{
          display: "inline-block",
          background: "rgba(255,255,255,0.15)",
          color: "#fff",
          fontSize: 13,
          fontWeight: "bold",
          padding: "6px 16px",
          borderRadius: 99,
          marginBottom: 28,
          border: "1px solid rgba(255,255,255,0.3)",
          letterSpacing: "0.05em",
        }}>
          2級キャリアコンサルティング技能検定 実技対策
        </div>

        {/* メインタイトル */}
        <h1 style={{
          fontSize: "clamp(26px, 5vw, 42px)",
          fontWeight: "bold",
          lineHeight: 1.5,
          marginBottom: 24,
          maxWidth: 620,
          color: "#fff",
        }}>
          面接試験の合格を、<br />
          AIで近づける。
        </h1>

        {/* サブタイトル */}
        <p style={{
          fontSize: 16,
          color: "rgba(255,255,255,0.85)",
          maxWidth: 500,
          lineHeight: 2,
          marginBottom: 16,
        }}>
          本番を想定したロールプレイ練習と、<br />
          試験の4区分評価に沿ったAIフィードバック。<br />
          何度でも、いつでも、自分のペースで。
        </p>

        {/* 緊迫感 */}
        <p style={{
          fontSize: 13,
          color: "rgba(255,255,255,0.6)",
          marginBottom: 36,
        }}>
          ※ 2026年前期試験まであとわずか
        </p>

        {/* CTAボタン */}
        <button
          onClick={() => navigate("/login?mode=signup")}
          onMouseEnter={() => setHoverStart(true)}
          onMouseLeave={() => setHoverStart(false)}
          style={{
            background: hoverStart ? "#fff" : "#fff",
            color: hoverStart ? "#1d4ed8" : "#1d4ed8",
            border: "none",
            padding: "18px 48px",
            fontSize: 17,
            borderRadius: 12,
            fontWeight: "bold",
            cursor: "pointer",
            transition: "all 0.2s ease",
            transform: hoverStart ? "translateY(-3px)" : "none",
            boxShadow: hoverStart
              ? "0 12px 32px rgba(0,0,0,0.25)"
              : "0 4px 16px rgba(0,0,0,0.2)",
          }}
        >
          無料で登録して練習を始める →
        </button>

        <p style={{ marginTop: 16, fontSize: 13, color: "rgba(255,255,255,0.55)" }}>
          月額5,000円（税込）・いつでも解約可能
        </p>
      </section>

      {/* ===== A. ペインポイントセクション ===== */}
      <section style={{ background: "#fff", padding: "72px 20px" }}>
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          <h2 style={{
            textAlign: "center",
            fontSize: 22,
            fontWeight: "bold",
            marginBottom: 12,
            color: "#1f2937",
          }}>
            こんな悩み、ありませんか？
          </h2>
          <p style={{ textAlign: "center", color: "#6b7280", fontSize: 14, marginBottom: 40 }}>
            2級受験者が抱えがちな課題です
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
            {[
              { icon: "😰", text: "練習相手がいなくて、一人で面接の準備ができない" },
              { icon: "📅", text: "仕事をしながら勉強しているので、練習の時間が取りにくい" },
              { icon: "🤔", text: "自分の面接がどこがダメなのか、客観的にわからない" },
              { icon: "💸", text: "練習のためにスクールや勉強会に通うのはコストが高い" },
              { icon: "😓", text: "ロールプレイの場数が少なく、本番で緊張してしまいそう" },
              { icon: "📋", text: "4区分の評価基準で自分がどう採点されるか知りたい" },
            ].map((item) => (
              <div key={item.text} style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 12,
                background: "#fef2f2",
                border: "1px solid #fecaca",
                borderRadius: 10,
                padding: "14px 16px",
              }}>
                <span style={{ fontSize: 22, flexShrink: 0 }}>{item.icon}</span>
                <p style={{ fontSize: 14, color: "#374151", lineHeight: 1.7, margin: 0 }}>{item.text}</p>
              </div>
            ))}
          </div>

          {/* 解決策への橋渡し */}
          <div style={{
            textAlign: "center",
            marginTop: 48,
            padding: "28px 24px",
            background: "linear-gradient(135deg, #eff6ff, #dbeafe)",
            borderRadius: 16,
            border: "1px solid #bfdbfe",
          }}>
            <p style={{ fontSize: 17, fontWeight: "bold", color: "#1d4ed8", margin: 0, lineHeight: 1.8 }}>
              そのすべての悩みを、<br />
              <span style={{ fontSize: 22 }}>Career Counselor AI が解決します。</span>
            </p>
          </div>
        </div>
      </section>

      {/* ===== 特徴セクション（デザイン強化） ===== */}
      <section style={{ background: "#f8fafc", padding: "72px 20px" }}>
        <div style={{ maxWidth: 860, margin: "0 auto" }}>
          <h2 style={{ textAlign: "center", fontSize: 22, fontWeight: "bold", marginBottom: 12, color: "#1f2937" }}>
            このサービスでできること
          </h2>
          <p style={{ textAlign: "center", color: "#6b7280", fontSize: 14, marginBottom: 48 }}>
            合格に必要な練習環境がすべて揃っています
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 24 }}>
            {[
              {
                icon: "🎭",
                title: "本番想定のロールプレイ",
                desc: "転職・職場の悩みなど実際の試験に出やすい5種類のケースでAIクライアントと面接練習。",
                color: "#eff6ff",
                border: "#bfdbfe",
              },
              {
                icon: "📊",
                title: "4区分評価のフィードバック",
                desc: "「態度」「展開」「見立て」「具体的展開」の4区分で採点。自分の弱点が一目でわかります。",
                color: "#f0fdf4",
                border: "#bbf7d0",
              },
              {
                icon: "🔄",
                title: "何度でも繰り返し練習",
                desc: "場所・時間を選ばず24時間いつでも練習可能。繰り返すことで確実に面接力が身につきます。",
                color: "#fefce8",
                border: "#fde68a",
              },
            ].map((item) => (
              <div key={item.title} style={{
                background: item.color,
                border: `1px solid ${item.border}`,
                borderRadius: 16,
                padding: "32px 24px",
                textAlign: "center",
              }}>
                <div style={{ fontSize: 40, marginBottom: 16 }}>{item.icon}</div>
                <h3 style={{ fontSize: 16, fontWeight: "bold", marginBottom: 12, color: "#1f2937" }}>{item.title}</h3>
                <p style={{ fontSize: 14, color: "#4b5563", lineHeight: 1.8, margin: 0 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== こんな方におすすめ ===== */}
      <section style={{ background: "#fff", padding: "72px 20px" }}>
        <div style={{ maxWidth: 620, margin: "0 auto" }}>
          <h2 style={{ textAlign: "center", fontSize: 22, fontWeight: "bold", marginBottom: 40, color: "#1f2937" }}>
            こんな方におすすめ
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[
              "2級キャリアコンサルティング技能検定の実技試験を受ける予定がある",
              "面接練習の相手が見つからず、自分のペースで繰り返し練習したい",
              "試験の4区分評価に沿った客観的なフィードバックが欲しい",
              "スクールや勉強会に通う時間・費用が確保できない",
              "本番前に少しでも多く場数を踏んでおきたい",
            ].map((text) => (
              <div key={text} style={{
                background: "#f8fafc",
                border: "1px solid #e5e7eb",
                borderRadius: 10,
                padding: "14px 20px",
                display: "flex",
                alignItems: "flex-start",
                gap: 12,
                fontSize: 15,
                color: "#374151",
                lineHeight: 1.6,
              }}>
                <span style={{
                  color: "#fff",
                  background: "#2563eb",
                  fontWeight: "bold",
                  flexShrink: 0,
                  width: 22,
                  height: 22,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 13,
                }}>✓</span>
                {text}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== 使い方セクション ===== */}
      <section style={{ background: "#f8fafc", padding: "72px 20px" }}>
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          <h2 style={{ textAlign: "center", fontSize: 22, fontWeight: "bold", marginBottom: 12, color: "#1f2937" }}>
            使い方は3ステップ
          </h2>
          <p style={{ textAlign: "center", color: "#6b7280", fontSize: 14, marginBottom: 48 }}>
            登録してすぐに練習を始められます
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {[
              { step: "01", title: "ケースを選ぶ", desc: "5種類のケースから練習したいシナリオを選択します。どのケースも実際の試験を想定したシナリオです。" },
              { step: "02", title: "AIとロールプレイ", desc: "AIクライアントと面接のロールプレイを行います。本番だと思って真剣に取り組んでみましょう。" },
              { step: "03", title: "フィードバックを確認", desc: "4区分評価に沿ったAIのフィードバックを確認し、改善ポイントを把握して次の練習に活かします。" },
            ].map((item, i) => (
              <div key={item.step} style={{
                display: "flex",
                gap: 20,
                alignItems: "flex-start",
                position: "relative",
                paddingBottom: i < 2 ? 32 : 0,
              }}>
                {/* ステップ番号 */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
                  <div style={{
                    background: "#2563eb",
                    color: "#fff",
                    fontWeight: "bold",
                    fontSize: 15,
                    borderRadius: "50%",
                    width: 48,
                    height: 48,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}>
                    {item.step}
                  </div>
                  {i < 2 && (
                    <div style={{ width: 2, flex: 1, background: "#bfdbfe", marginTop: 8, minHeight: 32 }} />
                  )}
                </div>
                <div style={{ paddingTop: 10 }}>
                  <h3 style={{ fontWeight: "bold", marginBottom: 6, fontSize: 17, color: "#1f2937" }}>{item.title}</h3>
                  <p style={{ fontSize: 14, color: "#6b7280", lineHeight: 1.8, margin: 0 }}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== 料金セクション ===== */}
      <section style={{ background: "#fff", padding: "72px 20px" }}>
        <div style={{ maxWidth: 480, margin: "0 auto", textAlign: "center" }}>
          <h2 style={{ fontSize: 22, fontWeight: "bold", marginBottom: 12, color: "#1f2937" }}>料金</h2>
          <p style={{ color: "#6b7280", fontSize: 14, marginBottom: 40 }}>シンプルな月額プラン1つだけ</p>
          <div style={{
            background: "#fff",
            border: "2px solid #2563eb",
            borderRadius: 20,
            padding: "40px 32px",
            boxShadow: "0 8px 32px rgba(37,99,235,0.12)",
          }}>
            <div style={{ fontSize: 13, color: "#2563eb", fontWeight: "bold", marginBottom: 8, letterSpacing: "0.05em" }}>
              月額プラン
            </div>
            <div style={{ fontSize: 44, fontWeight: "bold", color: "#1f2937", marginBottom: 4 }}>
              ¥5,000
              <span style={{ fontSize: 15, fontWeight: "normal", color: "#6b7280" }}> / 月（税込）</span>
            </div>
            <p style={{ fontSize: 13, color: "#9ca3af", marginBottom: 32 }}>いつでも解約可能・違約金なし</p>
            <ul style={{ textAlign: "left", fontSize: 14, color: "#374151", lineHeight: 2.4, marginBottom: 32, paddingLeft: 0, listStyle: "none" }}>
              {[
                "5種類のケースが使い放題",
                "ロールプレイ練習は回数無制限",
                "AIによる4区分評価フィードバック",
                "スマホ・PC・タブレット対応",
                "解約はいつでもOK",
              ].map((t) => (
                <li key={t} style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <span style={{ color: "#2563eb", fontWeight: "bold" }}>✓</span> {t}
                </li>
              ))}
            </ul>
            <button
              onClick={() => navigate("/login?mode=signup")}
              onMouseEnter={() => setHoverStart2(true)}
              onMouseLeave={() => setHoverStart2(false)}
              style={{
                background: hoverStart2 ? "#1d4ed8" : "#2563eb",
                color: "#fff",
                border: "none",
                padding: "16px 0",
                width: "100%",
                fontSize: 16,
                borderRadius: 12,
                fontWeight: "bold",
                cursor: "pointer",
                transition: "all 0.2s ease",
                transform: hoverStart2 ? "translateY(-2px)" : "none",
                boxShadow: hoverStart2 ? "0 8px 20px rgba(37,99,235,0.35)" : "none",
              }}
            >
              今すぐ始める →
            </button>
          </div>
        </div>
      </section>

      {/* ===== C. FAQセクション ===== */}
      <section style={{ background: "#f8fafc", padding: "72px 20px" }}>
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          <h2 style={{ textAlign: "center", fontSize: 22, fontWeight: "bold", marginBottom: 12, color: "#1f2937" }}>
            よくある質問
          </h2>
          <p style={{ textAlign: "center", color: "#6b7280", fontSize: 14, marginBottom: 48 }}>
            ご不明な点があればお気軽にご確認ください
          </p>
          <div style={{ background: "#fff", borderRadius: 16, padding: "8px 28px", border: "1px solid #e5e7eb" }}>
            {FAQS.map((faq) => (
              <FaqItem key={faq.q} q={faq.q} a={faq.a} />
            ))}
          </div>
        </div>
      </section>

      {/* ===== 最終CTA ===== */}
      <section style={{
        background: "linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)",
        padding: "72px 20px",
        textAlign: "center",
      }}>
        <h2 style={{ fontSize: 24, fontWeight: "bold", color: "#fff", marginBottom: 16 }}>
          今日から練習を始めましょう
        </h2>
        <p style={{ color: "rgba(255,255,255,0.8)", fontSize: 15, marginBottom: 36, lineHeight: 1.9 }}>
          面接試験の合格に向けて、<br />
          AIと一緒に着実にスキルを積み上げましょう。
        </p>
        <button
          onClick={() => navigate("/login?mode=signup")}
          style={{
            background: "#fff",
            color: "#1d4ed8",
            border: "none",
            padding: "18px 48px",
            fontSize: 17,
            borderRadius: 12,
            fontWeight: "bold",
            cursor: "pointer",
            boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
          }}
        >
          無料で登録して練習を始める →
        </button>
        <p style={{ marginTop: 16, fontSize: 13, color: "rgba(255,255,255,0.55)" }}>
          月額5,000円（税込）・いつでも解約可能
        </p>
      </section>

      {/* ===== フッター ===== */}
      <footer style={{
        textAlign: "center",
        padding: "28px 20px",
        fontSize: 13,
        color: "#9ca3af",
        borderTop: "1px solid #e5e7eb",
        background: "#fff",
        display: "flex",
        justifyContent: "center",
        gap: 20,
        flexWrap: "wrap",
      }}>
        <Link to="/legal" style={{ color: "#6b7280", textDecoration: "none" }}>特定商取引法に基づく表記</Link>
        <Link to="/privacy" style={{ color: "#6b7280", textDecoration: "none" }}>プライバシーポリシー</Link>
        <Link to="/terms" style={{ color: "#6b7280", textDecoration: "none" }}>利用規約</Link>
      </footer>

    </div>
  );
}
