// src/pages/Result.jsx - 採点結果レポート
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { scenarios } from "../data/scenarios";

const CATEGORIES = [
  { key: "basic", label: "基本的態度", color: "#2a78d6" },
  { key: "relation", label: "関係構築力", color: "#1baf7a" },
  { key: "analysis", label: "問題把握力", color: "#eda100" },
  { key: "action", label: "具体的展開力", color: "#eb6834" },
];
const PASS = 60;

const TAG_STYLE = {
  good: { bg: "#e8f5e9", text: "#2e7d32", border: "#81c784" },
  caution: { bg: "#fff8e1", text: "#f57f17", border: "#ffd54f" },
  ng: { bg: "#ffebee", text: "#c62828", border: "#ef9a9a" },
};

// 1〜50 を ①〜㊿ の丸数字にする
function circled(n) {
  if (n >= 1 && n <= 20) return String.fromCharCode(0x2460 + n - 1);
  if (n >= 21 && n <= 35) return String.fromCharCode(0x3251 + n - 21);
  if (n >= 36 && n <= 50) return String.fromCharCode(0x32b1 + n - 36);
  return `(${n})`;
}

// 旧形式（1〜9点・evaluations）の採点結果を新形式に揃える
function normalizeScore(score, messages) {
  if (!score?.summary) return null;
  const isLegacy = !score.version;
  const summary = {};
  for (const c of CATEGORIES) {
    const s = score.summary[c.key] || {};
    const raw = Number(s.score) || 0;
    const pts = isLegacy ? Math.round((raw * 100) / 9) : raw;
    summary[c.key] = { score: pts, result: pts >= PASS ? "到達" : "所要基準未達", comment: s.comment || score.evaluations?.[c.key]?.bad?.[0] || "" };
  }
  if (!isLegacy || !score.evaluations) return { ...score, summary };

  // 旧perTurnは messages の index 参照なので CC番号に変換する
  const indexToCc = {};
  let cc = 0;
  messages.forEach((m, i) => { if (m.role === "user") indexToCc[i] = ++cc; });
  const perTurn = (score.perTurn || []).flatMap((t) =>
    (t.tags || []).slice(0, 1).map((tag) => ({
      cc: indexToCc[t.index],
      tag: tag.grade === "A" ? "good" : tag.grade === "B" ? "caution" : "ng",
      label: `${tag.grade === "A" ? "◎" : tag.grade === "B" ? "△" : "✕"} ${tag.label}`,
    }))
  ).filter((t) => t.cc);
  const goodPoints = CATEGORIES.flatMap((c) => (score.evaluations[c.key]?.good || []).map((g) => ({ title: c.label, detail: g })));
  const ngPoints = CATEGORIES.flatMap((c) => (score.evaluations[c.key]?.bad || []).map((b) => ({ priority: score.mainIssue?.key === c.key ? "high" : "medium", title: c.label, detail: b, better: (score.evaluations[c.key]?.improve || [])[0] })));
  const priorities = (score.evaluations[score.mainIssue?.key]?.improve || []).slice(0, 3).map((im, i) => ({ rank: i + 1, label: im, detail: "" }));
  return { ...score, summary, overall: score.mainIssue?.reason || "", perTurn, goodPoints, ngPoints, priorities, coachHint: "" };
}

export default function Result() {
  const navigate = useNavigate();
  const location = useLocation();
  const [tab, setTab] = useState("score");
  const [showTags, setShowTags] = useState(true);

  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  useEffect(() => { if (!location.state) navigate("/"); }, [location.state, navigate]);
  if (!location.state) return null;

  const { messages = [], caseId = "unknown", createdAt } = location.state;
  const score = normalizeScore(location.state.score, messages);
  const caseLabel = scenarios.find((s) => s.id === caseId)?.name || "不明";
  const dateLabel = new Date(createdAt || Date.now()).toLocaleString("ja-JP", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" });

  if (!score) {
    return (
      <div style={{ padding: 40, textAlign: "center" }}>
        <h2>採点結果を読み込めませんでした</h2>
        <button onClick={() => navigate("/scenario")} style={{ marginTop: 12, padding: "10px 20px", borderRadius: 8, border: "1px solid #e5e7eb", background: "#fff", cursor: "pointer" }}>ケース一覧へ</button>
      </div>
    );
  }

  const avg = Math.round(CATEGORIES.reduce((a, c) => a + score.summary[c.key].score, 0) / CATEGORIES.length);
  const allPass = CATEGORIES.every((c) => score.summary[c.key].score >= PASS);

  // CC番号 → 発話、タグの対応表
  const TAG_MARK = { good: "◎", caution: "△", ng: "✕" };
  const tagByCc = {};
  (score.perTurn || []).forEach((t) => {
    if (!t.cc || tagByCc[t.cc]) return;
    const label = String(t.label || "").replace(/^[◎△✕×○]\s*/, "");
    tagByCc[t.cc] = { ...t, label: `${TAG_MARK[t.tag] || "△"} ${label}` };
  });
  const ccText = {};
  let ccNo = 0, clNo = 0;
  const numbered = messages.map((m) => {
    const isCC = m.role === "user";
    const no = isCC ? ++ccNo : ++clNo;
    if (isCC) ccText[no] = m.content;
    return { ...m, isCC, no };
  });
  const scene = (cc) => (cc ? `CC${circled(cc)}` : "");

  const card = { background: "#fff", borderRadius: 12, padding: isMobile ? 16 : 22, boxShadow: "0 2px 8px rgba(0,0,0,0.07)", marginBottom: 14 };
  const btn = { padding: "8px 14px", borderRadius: 8, border: "1px solid #e5e7eb", background: "#fff", cursor: "pointer", fontSize: 13, color: "#374151", whiteSpace: "nowrap" };

  const tabs = [
    { key: "score", label: "📊 評価スコア" },
    { key: "dialogue", label: "📝 逐語録" },
    { key: "good", label: "✅ 良かった点" },
    { key: "ng", label: "⚠️ 改善点" },
    { key: "next", label: "🎯 次の課題" },
  ];

  return (
    <div style={{ background: "#f0f2f8", minHeight: "100vh", padding: isMobile ? "16px 12px" : "24px 16px" }}>
      <div style={{ maxWidth: 840, margin: "0 auto" }}>

        {/* ヘッダー */}
        <div style={{ background: "linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)", borderRadius: 14, padding: isMobile ? "18px 18px" : "22px 26px", marginBottom: 14, color: "#fff" }}>
          <div style={{ fontSize: 11, opacity: 0.75, marginBottom: 3 }}>2級キャリアコンサルティング技能検定 実技（面接）練習</div>
          <div style={{ fontSize: isMobile ? 18 : 21, fontWeight: 700, marginBottom: 8 }}>
            {caseLabel} ケース{score.attempt ? ` — RP${circled(score.attempt)}` : ""}
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <span style={{ background: "rgba(255,255,255,0.18)", borderRadius: 6, padding: "3px 10px", fontSize: 12 }}>実施：{dateLabel}</span>
            <span style={{ background: allPass ? "#ffeb3b" : "rgba(255,255,255,0.18)", color: allPass ? "#1e3a8a" : "#fff", borderRadius: 6, padding: "3px 10px", fontSize: 12, fontWeight: 700 }}>
              {allPass ? "🏆 全区分 合格圏・" : ""}平均{avg}点
            </span>
          </div>
        </div>

        {/* アクション */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
          <button onClick={() => navigate(`/roleplay?case=${caseId}`)} style={{ ...btn, background: "linear-gradient(180deg,#2563eb,#1d4ed8)", color: "#fff", border: "none", fontWeight: "bold" }}>もう一度このケースで練習</button>
          <button onClick={() => navigate(`/history?case=${caseId}`)} style={{ ...btn, background: "#eff6ff", border: "1px solid #bfdbfe", color: "#1d4ed8" }}>📈 このケースの推移</button>
          <button onClick={() => navigate("/scenario")} style={btn}>ケース一覧へ</button>
          {!isMobile && <button onClick={() => window.print()} style={btn}>PDFで保存</button>}
        </div>

        {/* タブ */}
        <div style={{ display: "flex", gap: 5, marginBottom: 14, flexWrap: "wrap" }}>
          {tabs.map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              padding: "7px 11px", borderRadius: 8, border: "none", cursor: "pointer",
              fontSize: 12, fontWeight: tab === t.key ? 700 : 400,
              background: tab === t.key ? "#2563eb" : "#fff",
              color: tab === t.key ? "#fff" : "#555",
              boxShadow: "0 1px 4px rgba(0,0,0,0.1)",
            }}>{t.label}</button>
          ))}
        </div>

        {/* 評価スコア */}
        {tab === "score" && (
          <div style={card}>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#1e3a8a", marginBottom: 4 }}>評価区分別スコア</div>
            <div style={{ fontSize: 12, color: "#888", marginBottom: 20 }}>合格基準：各区分{PASS}点以上</div>
            {CATEGORIES.map((c) => {
              const s = score.summary[c.key];
              const pass = s.score >= PASS;
              return (
                <div key={c.key} style={{ marginBottom: 20 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, gap: 8 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: "#1f2937" }}>{c.label}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 4, background: pass ? "#e8f5e9" : "#ffebee", color: pass ? "#2e7d32" : "#c62828" }}>{s.result}</span>
                      <span style={{ fontSize: 22, fontWeight: 700, color: c.color }}>{s.score}</span>
                    </div>
                  </div>
                  <div style={{ position: "relative", background: "#f0f0f0", borderRadius: 6, height: 12, marginBottom: 8 }}>
                    <div style={{ width: `${s.score}%`, height: "100%", background: c.color, borderRadius: 6 }} />
                    <div style={{ position: "absolute", left: `${PASS}%`, top: -3, bottom: -3, width: 2, background: "#9ca3af" }} title="合格ライン" />
                  </div>
                  {s.comment && <div style={{ fontSize: 12.5, color: "#666", lineHeight: 1.7 }}>{s.comment}</div>}
                  <div style={{ borderBottom: "1px solid #f0f0f0", marginTop: 14 }} />
                </div>
              );
            })}
            <div style={{ background: "#e8eaf6", borderRadius: 10, padding: 14 }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: "#1e3a8a", marginBottom: 6 }}>総合判定</div>
              <div style={{ fontSize: 13, color: "#444", lineHeight: 1.8 }}>
                平均スコア：<strong style={{ color: "#2563eb", fontSize: 16 }}>{avg}点</strong> ／ 合格ライン{PASS}点<br />
                {score.overall}
              </div>
            </div>
          </div>
        )}

        {/* 逐語録 */}
        {tab === "dialogue" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, gap: 8, flexWrap: "wrap" }}>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {[["good", "◎ 良い場面"], ["caution", "△ 注意"], ["ng", "✕ 改善必要"]].map(([key, label]) => (
                  <span key={key} style={{ background: TAG_STYLE[key].bg, color: TAG_STYLE[key].text, padding: "2px 8px", borderRadius: 4, fontSize: 11 }}>{label}</span>
                ))}
              </div>
              <button onClick={() => setShowTags(!showTags)} style={{ fontSize: 11, color: "#2563eb", background: "#fff", border: "1px solid #bfdbfe", borderRadius: 6, padding: "4px 10px", cursor: "pointer" }}>
                {showTags ? "タグ非表示" : "タグ表示"}
              </button>
            </div>
            {numbered.map((m, i) => {
              const t = m.isCC && showTags ? tagByCc[m.no] : null;
              const ts = t ? TAG_STYLE[t.tag] || TAG_STYLE.caution : null;
              return (
                <div key={i} style={{ marginBottom: 10 }}>
                  {t && (
                    <div style={{ fontSize: 11, fontWeight: 700, color: ts.text, background: ts.bg, border: `1px solid ${ts.border}`, borderRadius: "4px 4px 0 0", padding: "3px 10px", display: "inline-block" }}>
                      {t.label}
                    </div>
                  )}
                  <div style={{ display: "flex", flexDirection: m.isCC ? "row" : "row-reverse", gap: 8, alignItems: "flex-start" }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: m.isCC ? "#1e3a8a" : "#880e4f", background: m.isCC ? "#e8eaf6" : "#fce4ec", borderRadius: 6, padding: "4px 7px", minWidth: 40, textAlign: "center", marginTop: 2, flexShrink: 0 }}>
                      {m.isCC ? "CC" : "CL"}{circled(m.no)}
                    </div>
                    <div style={{ flex: 1, background: t ? ts.bg : (m.isCC ? "#fff" : "#fdf6ff"), border: t ? `1.5px solid ${ts.border}` : `1px solid ${m.isCC ? "#e0e0e0" : "#e1bee7"}`, borderRadius: 8, padding: "10px 14px", fontSize: 13.5, lineHeight: 1.75, color: "#333", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                      {m.content}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 良かった点 */}
        {tab === "good" && (
          <div style={card}>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#2e7d32", marginBottom: 16 }}>✅ 良かった点</div>
            {(score.goodPoints || []).length === 0 && <p style={{ color: "#6b7280", fontSize: 13 }}>記録がありません。</p>}
            {(score.goodPoints || []).map((p, i) => (
              <div key={i} style={{ background: "#f1f8f4", borderLeft: "4px solid #4caf50", borderRadius: "0 10px 10px 0", padding: "12px 16px", marginBottom: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
                  {p.cc && <span style={{ fontSize: 11, fontWeight: 700, background: "#c8e6c9", color: "#1b5e20", padding: "2px 8px", borderRadius: 4 }}>{scene(p.cc)}</span>}
                  <div style={{ fontWeight: 700, fontSize: 14, color: "#2e7d32" }}>{p.title}</div>
                </div>
                {p.cc && ccText[p.cc] && <div style={{ fontSize: 12, color: "#6b7280", background: "#fff", borderRadius: 6, padding: "6px 10px", marginBottom: 8, lineHeight: 1.6 }}>「{ccText[p.cc]}」</div>}
                <div style={{ fontSize: 13, color: "#555", lineHeight: 1.8 }}>{p.detail}</div>
              </div>
            ))}
          </div>
        )}

        {/* 改善点 */}
        {tab === "ng" && (
          <div style={card}>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#c62828", marginBottom: 16 }}>⚠️ 改善が必要な点</div>
            {(score.ngPoints || []).length === 0 && <p style={{ color: "#6b7280", fontSize: 13 }}>記録がありません。</p>}
            {(score.ngPoints || []).map((p, i) => {
              const isHigh = p.priority === "high";
              return (
                <div key={i} style={{ background: isHigh ? "#fff5f5" : "#fffde7", borderLeft: `4px solid ${isHigh ? "#f44336" : "#ffc107"}`, borderRadius: "0 10px 10px 0", padding: "12px 16px", marginBottom: 14 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 4, background: isHigh ? "#ffebee" : "#fff8e1", color: isHigh ? "#c62828" : "#f57f17" }}>{isHigh ? "優先度：高" : "優先度：中"}</span>
                    {p.cc && <span style={{ fontSize: 11, fontWeight: 700, background: "#f5f5f5", color: "#666", padding: "2px 8px", borderRadius: 4 }}>{scene(p.cc)}</span>}
                    <div style={{ fontWeight: 700, fontSize: 13, color: "#333" }}>{p.title}</div>
                  </div>
                  {p.cc && ccText[p.cc] && <div style={{ fontSize: 12, color: "#6b7280", background: "#fff", borderRadius: 6, padding: "6px 10px", marginBottom: 8, lineHeight: 1.6 }}>「{ccText[p.cc]}」</div>}
                  <div style={{ fontSize: 13, color: "#555", lineHeight: 1.8, marginBottom: p.better ? 10 : 0 }}>{p.detail}</div>
                  {p.better && (
                    <div style={{ background: "#e8f5e9", borderRadius: 8, padding: "8px 12px", border: "1px solid #a5d6a7" }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#2e7d32", marginBottom: 4 }}>◎ 使える問いかけ例</div>
                      <div style={{ fontSize: 12.5, color: "#444", lineHeight: 1.8 }}>{p.better}</div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* 次の課題 */}
        {tab === "next" && (
          <div>
            <div style={card}>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#1e3a8a", marginBottom: 16 }}>🎯 次の練習の優先課題</div>
              {(score.priorities || []).length === 0 && <p style={{ color: "#6b7280", fontSize: 13 }}>記録がありません。</p>}
              {(score.priorities || []).map((p, i) => (
                <div key={i} style={{ display: "flex", gap: 14, marginBottom: 16, alignItems: "flex-start" }}>
                  <div style={{ width: 34, height: 34, borderRadius: "50%", background: ["#e53935", "#ef8c00", "#1b5e20"][i] || "#2563eb", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 15, flexShrink: 0 }}>{p.rank || i + 1}</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: "#333", marginBottom: 4 }}>{p.label}</div>
                    {p.detail && <div style={{ fontSize: 13, color: "#666", lineHeight: 1.7 }}>{p.detail}</div>}
                  </div>
                </div>
              ))}
            </div>
            {score.coachHint && (
              <div style={{ background: "#e8eaf6", border: "1px solid #9fa8da", borderRadius: 12, padding: 20 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: "#1e3a8a", marginBottom: 10 }}>💡 指導者からのヒント</div>
                <div style={{ fontSize: 13, color: "#444", lineHeight: 1.9, whiteSpace: "pre-wrap" }}>{score.coachHint}</div>
              </div>
            )}
          </div>
        )}

        <div style={{ textAlign: "center", fontSize: 11, color: "#aaa", marginTop: 20 }}>Career Counselor AI｜2級キャリコン 実技対策</div>
      </div>
    </div>
  );
}
