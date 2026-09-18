import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { scenarios } from "../data/scenarios";

export default function Result() {
  const [hoveredButton, setHoveredButton] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  // スマホ判定
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  if (!location.state) {
    navigate("/");
    return null;
  }

  const { messages = [], caseId = "unknown", score, createdAt } = location.state;
  const dateLabel = createdAt ? new Date(createdAt).toLocaleString("ja-JP", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" }) : null;

  if (!score || !score.summary) {
    return (
      <div style={{ padding: 40, textAlign: "center" }}>
        <h2>採点結果を生成しています…</h2>
        <p>しばらくお待ちください</p>
      </div>
    );
  }

  // ケース名はシナリオデータから引く（ケース追加時に更新漏れが起きないように）
  const caseLabel = scenarios.find((s) => s.id === caseId)?.name || "不明";

  const summaryItems = [
    { key: "basic", label: "基本的態度" },
    { key: "relation", label: "関係構築" },
    { key: "analysis", label: "問題把握力" },
    { key: "action", label: "具体的展開力" },
  ];

  const cardStyle = {
    background: "#fff",
    padding: isMobile ? 16 : 24,
    borderRadius: 14,
    boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
    marginBottom: 16,
  };

  return (
    <div style={{ background: "#f5f7fa", minHeight: "100vh", padding: isMobile ? "16px 12px" : "32px 16px" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>

        {/* ===== ヘッダー ===== */}
        <div style={{ marginBottom: 20 }}>
          <h1 style={{ margin: "0 0 4px", fontSize: isMobile ? 20 : 26, color: "#1f2937" }}>
            面接ロールプレイ フィードバック
          </h1>
          <div style={{ color: "#6b7280", fontSize: 14 }}>
            ケース：{caseLabel}{dateLabel && ` ／ 実施：${dateLabel}`}
          </div>
        </div>

        {/* ===== アクションボタン（スマホ：上部に表示） ===== */}
        {isMobile && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
            <button
              onClick={() => navigate(`/roleplay?case=${caseId}`)}
              style={{
                width: "100%",
                padding: 14,
                background: "linear-gradient(180deg, #2563eb, #1d4ed8)",
                color: "#fff",
                border: "none",
                borderRadius: 10,
                fontWeight: "bold",
                fontSize: 15,
                cursor: "pointer",
                boxShadow: "0 2px 8px rgba(37,99,235,0.3)",
              }}
            >
              もう一度このケースで練習する
            </button>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => navigate("/scenario")}
                style={{
                  flex: 1,
                  padding: 11,
                  background: "#fff",
                  border: "1.5px solid #e5e7eb",
                  borderRadius: 10,
                  color: "#374151",
                  fontWeight: "bold",
                  fontSize: 13,
                  cursor: "pointer",
                }}
              >
                ケース一覧へ
              </button>
              <button
                onClick={() => navigate("/history")}
                style={{
                  flex: 1,
                  padding: 11,
                  background: "#eff6ff",
                  border: "1.5px solid #bfdbfe",
                  borderRadius: 10,
                  color: "#1d4ed8",
                  fontSize: 13,
                  cursor: "pointer",
                }}
              >
                練習履歴
              </button>
            </div>
          </div>
        )}

        {/* ===== PC：ヘッダー右のボタン ===== */}
        {!isMobile && (
          <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
            <button onClick={() => window.print()} style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid #e5e7eb", background: "#fff", cursor: "pointer", fontSize: 13 }}>PDFで保存</button>
            <button onClick={() => navigate("/history")} style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid #bfdbfe", background: "#eff6ff", color: "#1d4ed8", cursor: "pointer", fontSize: 13 }}>📈 練習履歴を見る</button>
            <button onClick={() => navigate("/")} style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid #e5e7eb", background: "#fff", cursor: "pointer", fontSize: 13 }}>トップへ戻る</button>
          </div>
        )}

        {/* ===== メインレイアウト ===== */}
        <div style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "8fr 2fr",
          gap: 24,
          alignItems: "start",
        }}>

          {/* ===== 左：メインコンテンツ ===== */}
          <div>

            {/* 評価サマリー */}
            <div style={cardStyle}>
              <h2 style={{ margin: "0 0 16px", fontSize: isMobile ? 17 : 20, color: "#1f2937" }}>面接評価サマリー</h2>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {summaryItems.map((item) => {
                  const s = score.summary[item.key];
                  const isPass = s.result && !s.result.includes("未達");
                  return (
                    <div key={item.key} style={{
                      border: `1.5px solid ${isPass ? "#bbf7d0" : "#fca5a5"}`,
                      borderRadius: 10,
                      padding: isMobile ? 10 : 14,
                      background: isPass ? "#f0fdf4" : "#fef2f2",
                    }}>
                      <div style={{ fontWeight: "bold", fontSize: isMobile ? 13 : 14, color: "#1f2937", marginBottom: 4 }}>{item.label}</div>
                      <div style={{ fontSize: isMobile ? 15 : 18, fontWeight: "bold", color: isPass ? "#15803d" : "#dc2626" }}>
                        {s.score}<span style={{ fontSize: 12, fontWeight: "normal", color: "#6b7280" }}> / 10</span>
                      </div>
                      <div style={{ fontSize: 11, color: isPass ? "#15803d" : "#dc2626", fontWeight: "bold", marginTop: 2 }}>
                        {s.result}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 最重要改善ポイント */}
            <div style={{ ...cardStyle, borderLeft: "5px solid #2563eb" }}>
              <h2 style={{ margin: "0 0 10px", fontSize: isMobile ? 16 : 20, color: "#1f2937" }}>今回の最重要改善ポイント</h2>
              <div style={{ fontWeight: "bold", color: "#1d4ed8", fontSize: isMobile ? 15 : 16, marginBottom: 6 }}>{score.mainIssue.title}</div>
              <p style={{ color: "#4b5563", margin: 0, fontSize: 14, lineHeight: 1.8 }}>{score.mainIssue.reason}</p>
            </div>

            {/* 項目別評価 */}
            {summaryItems.map((item) => {
              const e = score.evaluations[item.key];
              const isMain = score.mainIssue.key === item.key;
              return (
                <div key={item.key} style={cardStyle}>
                  <h2 style={{ margin: "0 0 12px", fontSize: isMobile ? 16 : 20, color: "#1f2937" }}>{item.label}</h2>

                  <div style={{ marginBottom: 10 }}>
                    <div style={{ fontWeight: "bold", color: "#15803d", fontSize: 14, marginBottom: 6 }}>✅ 良いところ</div>
                    <ul style={{ margin: 0, paddingLeft: 20, color: "#374151", fontSize: 14, lineHeight: 2 }}>
                      {e.good.map((g, idx) => <li key={idx}>{g}</li>)}
                    </ul>
                  </div>

                  <div style={{ marginBottom: isMain ? 10 : 0 }}>
                    <div style={{ fontWeight: "bold", color: "#dc2626", fontSize: 14, marginBottom: 6 }}>⚠️ 改善が必要なところ</div>
                    <ul style={{ margin: 0, paddingLeft: 20, color: "#374151", fontSize: 14, lineHeight: 2 }}>
                      {e.bad.map((b, idx) => <li key={idx}>{b}</li>)}
                    </ul>
                  </div>

                  {isMain && (
                    <div>
                      <div style={{ fontWeight: "bold", color: "#7c3aed", fontSize: 14, marginBottom: 6 }}>🛠 具体的な改善方法</div>
                      <ul style={{ margin: 0, paddingLeft: 20, color: "#374151", fontSize: 14, lineHeight: 2 }}>
                        {e.improve.map((im, idx) => <li key={idx}>{im}</li>)}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })}

            {/* 逐語録 */}
            <div style={cardStyle}>
              <h2 style={{ margin: "0 0 16px", fontSize: isMobile ? 16 : 20, color: "#1f2937" }}>ロールプレイ逐語録</h2>
              {messages.map((m, i) => {
                if (m.role !== "user") {
                  return (
                    <div key={i} style={{ marginBottom: 14, padding: "10px 12px", background: "#eff6ff", borderRadius: 8, fontSize: 14, lineHeight: 1.8 }}>
                      <div style={{ fontWeight: "bold", color: "#1d4ed8", marginBottom: 4, fontSize: 12 }}>相談者</div>
                      <div style={{ color: "#1e3a8a" }}>{m.content}</div>
                    </div>
                  );
                }
                const turn = score.perTurn.find((t) => t.index === i);
                return (
                  <div key={i} style={{ marginBottom: 14, borderBottom: "1px solid #f3f4f6", paddingBottom: 14 }}>
                    <div style={{ padding: "10px 12px", background: "#f0fdf4", borderRadius: 8, marginBottom: 6, fontSize: 14, lineHeight: 1.8 }}>
                      <div style={{ fontWeight: "bold", color: "#15803d", marginBottom: 4, fontSize: 12 }}>あなた（カウンセラー）</div>
                      <div style={{ color: "#1f2937" }}>{m.content}</div>
                    </div>
                    {turn?.tags.map((t, idx) => (
                      <div key={idx} style={{
                        fontSize: 13,
                        background: "#fafafa",
                        border: "1px solid #e5e7eb",
                        padding: "8px 12px",
                        borderRadius: 8,
                        marginTop: 4,
                        lineHeight: 1.7,
                      }}>
                        <span style={{ fontWeight: "bold", color: "#374151" }}>評価：{t.label}</span>
                        <div style={{ color: "#6b7280", marginTop: 2 }}>{t.reason}</div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>

            {/* スマホ：下部にも再練習ボタン */}
            {isMobile && (
              <button
                onClick={() => navigate(`/roleplay?case=${caseId}`)}
                style={{
                  width: "100%",
                  padding: 14,
                  background: "linear-gradient(180deg, #2563eb, #1d4ed8)",
                  color: "#fff",
                  border: "none",
                  borderRadius: 10,
                  fontWeight: "bold",
                  fontSize: 15,
                  cursor: "pointer",
                  marginBottom: 8,
                }}
              >
                もう一度このケースで練習する
              </button>
            )}
          </div>

          {/* ===== PC：右パネル（次のアクション） ===== */}
          {!isMobile && (
            <div style={{ position: "sticky", top: 24 }}>
              <div style={{ ...cardStyle, padding: 16, marginBottom: 0 }}>
                <h3 style={{ marginTop: 0, fontSize: 14, fontWeight: "bold", color: "#1f2937", marginBottom: 12 }}>次のアクション</h3>

                <button
                  onClick={() => navigate(`/roleplay?case=${caseId}`)}
                  onMouseEnter={() => setHoveredButton("next")}
                  onMouseLeave={() => setHoveredButton(null)}
                  style={{
                    width: "100%",
                    padding: 10,
                    fontSize: 13,
                    background: hoveredButton === "next" ? "#1d4ed8" : "#2563eb",
                    color: "#fff",
                    border: "none",
                    borderRadius: 8,
                    fontWeight: "bold",
                    cursor: "pointer",
                    marginBottom: 8,
                    boxShadow: hoveredButton === "next" ? "0 4px 10px rgba(37,99,235,0.35)" : "none",
                  }}
                >
                  次のロールプレイを開始
                </button>

                <button
                  onClick={() => navigate("/scenario")}
                  style={{
                    width: "100%",
                    padding: 10,
                    fontSize: 13,
                    background: "#fff",
                    border: "1.5px solid #e5e7eb",
                    borderRadius: 8,
                    color: "#6b7280",
                    cursor: "pointer",
                  }}
                >
                  ケース一覧へ戻る
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
