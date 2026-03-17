import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export default function Result() {
  const [hoveredButton, setHoveredButton] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  if (!location.state) {
    navigate("/");
    return null;
  }

  const { messages = [], caseId = "unknown", score } = location.state;
  // ===== AI採点がまだ来ていない場合 =====
if (!score || !score.summary) {
  return (
    <div style={{ padding: 40, textAlign: "center" }}>
      <h2>採点結果を生成しています…</h2>
      <p>しばらくお待ちください</p>
    </div>
  );
}


  /* ===== ケースID → 表示名 ===== */
  const CASE_LABELS = {
    yamazaki: "山崎 玲奈",
    case02: "渡辺 涼太",
    case03: "中田 真由美",
    case04: "西 孝之",
    case05: "橋本 美奈",
  };
  const caseLabel = CASE_LABELS[caseId] || "不明";

  /* ===== UI用サマリー ===== */
  const summaryItems = [
    { key: "basic", label: "基本的態度" },
    { key: "relation", label: "関係構築" },
    { key: "analysis", label: "問題把握力" },
    { key: "action", label: "具体的展開力" },
  ];

  /* ===== 色・スタイル ===== */
  const bg = "#f5f7fa";
  const card = "#ffffff";
  const text = "#1f2937";
  const sub = "#6b7280";
  const main = "#2563eb";
  const warn = "#dc2626";

  const cardStyle = {
    background: card,
    padding: 24,
    borderRadius: 14,
    boxShadow: "0 6px 18px rgba(0,0,0,0.06)",
    marginBottom: 24,
  };

  const primaryButtonStyle = (hover) => ({
    width: "100%",
    padding: 10,
    fontSize: 14,
    background: hover ? "#1d4ed8" : "#2563eb",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    fontWeight: 600,
    cursor: "pointer",
    boxShadow: hover ? "0 4px 10px rgba(37,99,235,0.35)" : "none",
    transform: hover ? "translateY(-2px)" : "none",
    transition: "all 0.2s ease",
  });

  return (
    <div style={{ background: bg, padding: "32px 16px" }}>
      {/* ヘッダー */}
      <div
        style={{
          maxWidth: 1100,
          margin: "0 auto 32px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: 26, color: text }}>
            面接ロールプレイ フィードバック
          </h1>
          <div style={{ color: sub, marginTop: 4 }}>
            ケース：{caseLabel}
          </div>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => window.print()}>PDFで保存</button>
          <button onClick={() => navigate("/")}>トップ（最初から）</button>
        </div>
      </div>

      <div
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "8fr 2fr",
          gap: 24,
        }}
      >
        {/* 左 */}
        <div>
          {/* サマリー */}
          <div style={cardStyle}>
            <h2 style={{ marginBottom: 16 }}>面接評価サマリー</h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              {summaryItems.map((i) => (
                <div
                  key={i.key}
                  style={{
                    border: "1px solid #e5e7eb",
                    borderRadius: 10,
                    padding: 14,
                  }}
                >
                  <strong>{i.label}</strong>
                  <div style={{ marginTop: 4 }}>
                    得点：{score.summary[i.key].score} / 10
                  </div>
                  <div style={{ color: warn, fontWeight: "bold" }}>
                    判定：{score.summary[i.key].result}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 最重要改善 */}
          <div style={{ ...cardStyle, borderLeft: `6px solid ${main}` }}>
            <h2>今回の最重要改善ポイント</h2>
            <strong>{score.mainIssue.title}</strong>
            <p style={{ color: sub }}>{score.mainIssue.reason}</p>
          </div>

          {/* 項目別 */}
          {summaryItems.map((i) => {
            const e = score.evaluations[i.key];
            const isMain = score.mainIssue.key === i.key;

            return (
              <div key={i.key} style={cardStyle}>
                <h2>{i.label}</h2>

                <h4>✅ 良いところ</h4>
                <ul>{e.good.map((g, idx) => <li key={idx}>{g}</li>)}</ul>

                <h4>⚠️ 悪いところ</h4>
                <ul>{e.bad.map((b, idx) => <li key={idx}>{b}</li>)}</ul>

                {isMain && (
                  <>
                    <h4>🛠 改善点</h4>
                    <ul>{e.improve.map((im, idx) => <li key={idx}>{im}</li>)}</ul>
                  </>
                )}
              </div>
            );
          })}

          {/* 逐語 */}
          <div style={cardStyle}>
            <h2>ロールプレイ逐語録（試験評価直結）</h2>

            {messages.map((m, i) => {
              if (m.role !== "user") {
                return (
                  <div key={i} style={{ marginBottom: 16 }}>
                    <strong>相談者：</strong>
                    <div>{m.content}</div>
                  </div>
                );
              }

              const turn = score.perTurn.find((t) => t.index === i);

              return (
                <div key={i} style={{ borderBottom: "1px solid #eee", padding: "16px 0" }}>
                  <strong>あなた：</strong>
                  <div>{m.content}</div>

                  {turn?.tags.map((t, idx) => (
                    <div
                      key={idx}
                      style={{
                        fontSize: 14,
                        background: "#f9fafb",
                        padding: 8,
                        borderRadius: 8,
                        marginTop: 6,
                      }}
                    >
                      評価ポイント：<strong>{t.label}</strong>
                      <div style={{ color: sub }}>理由：{t.reason}</div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>

        {/* 右 */}
        <div>
          <div style={{ ...cardStyle, position: "sticky", top: 24, padding: 12 }}>
            <h3 style={{ marginTop: 0, fontSize: 14, fontWeight: 600 }}>
              次のアクション
            </h3>

            <button
              onClick={() => navigate(`/roleplay?case=${caseId}`)}
              onMouseEnter={() => setHoveredButton("next")}
              onMouseLeave={() => setHoveredButton(null)}
              style={primaryButtonStyle(hoveredButton === "next")}
            >
              次のロールプレイを開始
            </button>

            <button
              onClick={() => navigate("/scenario")}
              style={{ width: "100%", padding: 10, marginTop: 8, fontSize: 13, opacity: 0.85 }}
            >
              ケース一覧へ戻る
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
