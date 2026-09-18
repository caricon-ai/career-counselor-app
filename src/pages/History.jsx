// src/pages/History.jsx - 練習履歴（採点結果の一覧とスコア推移）
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { scenarios } from "../data/scenarios";

const CATEGORIES = [
  { key: "basic", label: "基本的態度", color: "#2a78d6" },
  { key: "relation", label: "関係構築力", color: "#eb6834" },
  { key: "analysis", label: "問題把握力", color: "#1baf7a" },
  { key: "action", label: "具体的展開力", color: "#eda100" },
];

const PASS_SCORE = 60;

// 旧形式（version無し・1〜9点）は100点満点に換算する
function normalize(score, version) {
  const n = Number(score);
  if (!Number.isFinite(n)) return null;
  return version ? Math.round(n) : Math.round((n * 100) / 9);
}

function caseName(caseId) {
  return scenarios.find((s) => s.id === caseId)?.name || "不明";
}

function formatDate(iso) {
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

// スコア推移の折れ線グラフ（古い→新しい順、縦軸1〜9）
function TrendChart({ rows, isMobile }) {
  const [hover, setHover] = useState(null);
  const W = 640, H = 240;
  const pad = { top: 16, right: 20, bottom: 30, left: 30 };
  const plotW = W - pad.left - pad.right;
  const plotH = H - pad.top - pad.bottom;
  const n = rows.length;

  const x = (i) => (n === 1 ? pad.left + plotW / 2 : pad.left + (plotW * i) / (n - 1));
  const y = (score) => pad.top + plotH - (score / 100) * plotH;
  const val = (r, key) => normalize(r.summary?.[key]?.score, r.version);

  return (
    <div style={{ position: "relative" }}>
      {/* 凡例 */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 16px", marginBottom: 8, fontSize: 12, color: "#4b5563" }}>
        {CATEGORIES.map((c) => (
          <span key={c.key} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 10, height: 10, borderRadius: 99, background: c.color, display: "inline-block" }} />
            {c.label}
          </span>
        ))}
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }} onMouseLeave={() => setHover(null)}>
        {/* 目盛り線（控えめに） */}
        {[0, 20, 40, 60, 80, 100].map((v) => (
          <g key={v}>
            <line x1={pad.left} x2={W - pad.right} y1={y(v)} y2={y(v)} stroke={v === PASS_SCORE ? "#9ca3af" : "#e5e7eb"} strokeDasharray={v === PASS_SCORE ? "4 4" : undefined} />
            <text x={pad.left - 8} y={y(v) + 4} textAnchor="end" fontSize="11" fill="#6b7280">{v}</text>
          </g>
        ))}
        <text x={W - pad.right} y={y(PASS_SCORE) - 5} textAnchor="end" fontSize="11" fill="#6b7280">合格ライン（{PASS_SCORE}点）</text>

        {/* 横軸ラベル：回数 */}
        {rows.map((r, i) => (
          <text key={r.id} x={x(i)} y={H - 8} textAnchor="middle" fontSize="11" fill="#6b7280">
            {n > 12 && i % Math.ceil(n / 12) !== 0 && i !== n - 1 ? "" : `${i + 1}回目`}
          </text>
        ))}

        {/* ホバー中の縦線 */}
        {hover !== null && (
          <line x1={x(hover)} x2={x(hover)} y1={pad.top} y2={pad.top + plotH} stroke="#9ca3af" strokeWidth="1" />
        )}

        {/* 折れ線とマーカー */}
        {CATEGORIES.map((c) => {
          const pts = rows.map((r, i) => [x(i), y(val(r, c.key) ?? 0)]);
          return (
            <g key={c.key}>
              {n > 1 && (
                <polyline points={pts.map((p) => p.join(",")).join(" ")} fill="none" stroke={c.color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
              )}
              {pts.map((p, i) => (
                <circle key={i} cx={p[0]} cy={p[1]} r={hover === i ? 5 : 4} fill={c.color} stroke="#fff" strokeWidth="2" />
              ))}
            </g>
          );
        })}

        {/* ホバー判定用の透明な帯 */}
        {rows.map((r, i) => {
          const left = i === 0 ? pad.left : (x(i - 1) + x(i)) / 2;
          const right = i === n - 1 ? W - pad.right : (x(i) + x(i + 1)) / 2;
          return (
            <rect key={r.id} x={left} y={pad.top} width={Math.max(right - left, 1)} height={plotH} fill="transparent" onMouseEnter={() => setHover(i)} onTouchStart={() => setHover(i)} />
          );
        })}
      </svg>

      {/* ツールチップ */}
      {hover !== null && rows[hover] && (
        <div style={{
          position: "absolute",
          top: 36,
          left: `${(x(hover) / W) * 100}%`,
          transform: x(hover) > W / 2 ? "translateX(calc(-100% - 12px))" : "translateX(12px)",
          background: "#fff",
          border: "1px solid #e5e7eb",
          borderRadius: 8,
          boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
          padding: "8px 12px",
          fontSize: isMobile ? 11 : 12,
          color: "#1f2937",
          pointerEvents: "none",
          whiteSpace: "nowrap",
        }}>
          <div style={{ fontWeight: "bold", marginBottom: 4 }}>{hover + 1}回目 · {formatDate(rows[hover].created_at)}</div>
          <div style={{ color: "#6b7280", marginBottom: 4 }}>{caseName(rows[hover].case_id)}</div>
          {CATEGORIES.map((c) => (
            <div key={c.key} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: 99, background: c.color, display: "inline-block" }} />
              {c.label}：{val(rows[hover], c.key) ?? "-"}点
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function History() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [rows, setRows] = useState(null);
  const [error, setError] = useState("");
  const [caseFilter, setCaseFilter] = useState(() => searchParams.get("case") || "all");
  const [openingId, setOpeningId] = useState(null);

  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);

  useEffect(() => {
    supabase
      .from("results")
      .select("id, case_id, created_at, summary:score->summary, version:score->version")
      .order("created_at", { ascending: false })
      .limit(100)
      .then(({ data, error }) => {
        if (error) {
          console.error("履歴取得エラー:", error);
          setError("履歴の読み込みに失敗しました。時間をおいて再度お試しください。");
          setRows([]);
          return;
        }
        setRows(data || []);
      });
  }, []);

  const filtered = useMemo(
    () => (rows || []).filter((r) => caseFilter === "all" || r.case_id === caseFilter),
    [rows, caseFilter]
  );
  const chronological = useMemo(() => [...filtered].reverse(), [filtered]);

  // 一覧から過去の結果を開く（本文はここで初めて取得する）
  const openResult = async (id) => {
    setOpeningId(id);
    const { data, error } = await supabase.from("results").select("case_id, score, messages, created_at").eq("id", id).single();
    setOpeningId(null);
    if (error || !data) { alert("結果の読み込みに失敗しました。"); return; }
    navigate("/result", { state: { caseId: data.case_id, score: data.score, messages: data.messages, createdAt: data.created_at } });
  };

  const cardStyle = { background: "#fff", borderRadius: 14, padding: isMobile ? 16 : 24, boxShadow: "0 4px 16px rgba(0,0,0,0.06)", marginBottom: 16 };
  const usedCaseIds = [...new Set((rows || []).map((r) => r.case_id))];

  return (
    <div style={{ background: "#f5f7fa", minHeight: "100vh", padding: isMobile ? "16px 12px" : "32px 16px" }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 10 }}>
          <h1 style={{ margin: 0, fontSize: isMobile ? 20 : 26, color: "#1f2937" }}>練習履歴</h1>
          <button onClick={() => navigate("/scenario")} style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid #e5e7eb", background: "#fff", cursor: "pointer", fontSize: 13, color: "#374151" }}>
            ケース一覧へ
          </button>
        </div>

        {rows === null && <div style={{ ...cardStyle, textAlign: "center", color: "#6b7280" }}>読み込み中...</div>}
        {error && <div style={{ ...cardStyle, color: "#b91c1c", background: "#fef2f2", border: "1px solid #fca5a5" }}>⚠️ {error}</div>}

        {rows !== null && rows.length === 0 && !error && (
          <div style={{ ...cardStyle, textAlign: "center", padding: 40 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📝</div>
            <p style={{ color: "#374151", fontSize: 15, margin: "0 0 20px", lineHeight: 1.8 }}>
              まだ採点結果がありません。<br />ロールプレイを終えて「AI採点」を行うと、ここに記録されます。
            </p>
            <button onClick={() => navigate("/scenario")} style={{ padding: "12px 24px", borderRadius: 10, border: "none", background: "linear-gradient(180deg,#2563eb,#1d4ed8)", color: "#fff", fontWeight: "bold", cursor: "pointer", fontSize: 14 }}>
              ケースを選んで練習する
            </button>
          </div>
        )}

        {rows !== null && rows.length > 0 && (
          <>
            {/* フィルタ */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, fontSize: 13, color: "#4b5563" }}>
              <span>ケース：</span>
              <select value={caseFilter} onChange={(e) => setCaseFilter(e.target.value)} style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 13, background: "#fff" }}>
                <option value="all">すべて（{rows.length}回）</option>
                {usedCaseIds.map((id) => (
                  <option key={id} value={id}>{caseName(id)}（{rows.filter((r) => r.case_id === id).length}回）</option>
                ))}
              </select>
            </div>

            {/* スコア推移 */}
            <div style={cardStyle}>
              <h2 style={{ margin: "0 0 12px", fontSize: isMobile ? 16 : 18, color: "#1f2937" }}>スコアの推移</h2>
              {chronological.length > 0
                ? <TrendChart rows={chronological} isMobile={isMobile} />
                : <p style={{ color: "#6b7280", fontSize: 14 }}>該当する記録がありません。</p>}
            </div>

            {/* 一覧 */}
            <div style={cardStyle}>
              <h2 style={{ margin: "0 0 12px", fontSize: isMobile ? 16 : 18, color: "#1f2937" }}>これまでの結果</h2>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: isMobile ? 12 : 14, minWidth: 520 }}>
                  <thead>
                    <tr style={{ color: "#6b7280", textAlign: "left", borderBottom: "1px solid #e5e7eb" }}>
                      <th style={{ padding: "8px 6px", fontWeight: "normal" }}>日時</th>
                      <th style={{ padding: "8px 6px", fontWeight: "normal" }}>ケース</th>
                      {CATEGORIES.map((c) => (
                        <th key={c.key} style={{ padding: "8px 6px", fontWeight: "normal", textAlign: "center", whiteSpace: "nowrap" }}>{c.label}</th>
                      ))}
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((r) => (
                      <tr key={r.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                        <td style={{ padding: "10px 6px", color: "#374151", whiteSpace: "nowrap" }}>{formatDate(r.created_at)}</td>
                        <td style={{ padding: "10px 6px", color: "#1f2937", whiteSpace: "nowrap" }}>{caseName(r.case_id)}</td>
                        {CATEGORIES.map((c) => {
                          const s = normalize(r.summary?.[c.key]?.score, r.version);
                          const pass = s !== null && s >= PASS_SCORE;
                          return (
                            <td key={c.key} style={{ padding: "10px 6px", textAlign: "center", fontWeight: "bold", color: pass ? "#15803d" : "#dc2626" }}>
                              {s ?? "-"}
                            </td>
                          );
                        })}
                        <td style={{ padding: "10px 6px", textAlign: "right" }}>
                          <button onClick={() => openResult(r.id)} disabled={openingId === r.id} style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid #bfdbfe", background: "#eff6ff", color: "#1d4ed8", fontSize: 12, cursor: "pointer", whiteSpace: "nowrap" }}>
                            {openingId === r.id ? "読込中..." : "詳細を見る"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
