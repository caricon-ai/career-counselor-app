// src/pages/RolePlay.jsx

import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { scenarios } from "../data/scenarios";
import { apiPost } from "../lib/api";

export default function RolePlay() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const caseId = searchParams.get("case");
  const currentCase = scenarios.find((s) => s.id === caseId);
  const caseLabel = currentCase?.name || "ロールプレイ";
  const caseText = currentCase?.caseText || "";

  const chatRef = useRef(null);
  const SAVE_KEY = `roleplay_messages_${caseId}`;

  const [messages, setMessages] = useState(() => {
    try {
      const saved = localStorage.getItem(SAVE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return [{ role: "assistant", content: currentCase?.openingMessage || "" }];
  });

  const [hasSavedSession] = useState(() => {
    try {
      const saved = localStorage.getItem(SAVE_KEY);
      return saved && JSON.parse(saved).length > 1;
    } catch {}
    return false;
  });

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [caseInfoOpen, setCaseInfoOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef(null);

  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);

  // メッセージ自動保存
  useEffect(() => {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(messages)); } catch {}
  }, [messages, SAVE_KEY]);

  // メッセージ追加時にスクロール
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages]);

  const startFresh = () => {
    if (!window.confirm("現在の練習内容を消去して最初からやり直しますか？")) return;
    localStorage.removeItem(SAVE_KEY);
    setMessages([{ role: "assistant", content: currentCase?.openingMessage || "" }]);
  };

  const toggleMic = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { alert("ChromeまたはSafariをお試しください。"); return; }
    if (isRecording) { recognitionRef.current?.stop(); return; }
    const r = new SR();
    r.lang = "ja-JP";
    r.continuous = false;
    r.interimResults = false;
    recognitionRef.current = r;
    r.onstart = () => setIsRecording(true);
    r.onend = () => setIsRecording(false);
    r.onerror = () => setIsRecording(false);
    r.onresult = (e) => {
      const t = e.results[0][0].transcript;
      setInput((p) => p ? p + "　" + t : t);
    };
    r.start();
  };

  const send = async () => {
    if (!input.trim() || loading) return;
    const next = [...messages, { role: "user", content: input }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const res = await apiPost("/api/chat", { messages: next, caseDisplayName: caseLabel });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMessages([...next, { role: "assistant", content: data.content }]);
    } catch {
      setMessages([...next, { role: "assistant", content: "（通信エラー。もう一度お試しください）" }]);
    } finally {
      setLoading(false);
    }
  };

  const finishAndEvaluate = async () => {
    if (evaluating) return;
    setEvaluating(true);
    try {
      const res = await apiPost("/api/evaluate", { caseId, messages });
      if (!res.ok) { alert("採点処理でエラーが発生しました。"); setEvaluating(false); return; }
      const score = await res.json();
      navigate("/result", { state: { caseId, messages, score } });
    } catch {
      alert("通信エラーが発生しました。");
      setEvaluating(false);
    }
  };

  let cl = 0;
  let cc = 0;

  // ===== スマホ：dvhを使ったレイアウト =====
  if (isMobile) {
    return (
      <div style={{
        // 100dvh = キーボードが開いても自動的に高さが変わる（iOSに対応）
        // 56px = ヘッダーの高さを引く
        height: "calc(100dvh - 56px)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        background: "#f3f6fb",
      }}>

        {/* ケース情報バー */}
        <div style={{ flexShrink: 0, background: "#fff", borderBottom: "1px solid #e5e7eb" }}>
          <button
            onClick={() => setCaseInfoOpen(!caseInfoOpen)}
            style={{ width: "100%", padding: "10px 14px", background: "none", border: "none", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ background: "#eff6ff", color: "#2563eb", fontSize: 11, fontWeight: "bold", padding: "2px 8px", borderRadius: 99, border: "1px solid #bfdbfe" }}>ケース</span>
              <span style={{ fontSize: 14, fontWeight: "bold", color: "#1f2937" }}>{caseLabel}</span>
            </div>
            <span style={{ fontSize: 11, color: "#6b7280" }}>{caseInfoOpen ? "▲ 閉じる" : "▼ 詳細"}</span>
          </button>
          {caseInfoOpen && (
            <div style={{ padding: "0 14px 12px", fontSize: 13, color: "#374151", lineHeight: 1.8, borderTop: "1px solid #f3f4f6", maxHeight: 180, overflowY: "auto" }}>
              <div style={{ background: "#f8fafc", borderRadius: 8, padding: "8px 10px", margin: "8px 0 6px", whiteSpace: "pre-wrap", color: "#4b5563" }}>{currentCase?.status}</div>
              <p style={{ margin: 0 }}><strong>相談したいこと：</strong><br />{caseText}</p>
            </div>
          )}
        </div>

        {/* チャットエリア（残りの全スペースを使う） */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", background: "#fff", minHeight: 0 }}>

          {/* チャットヘッダー */}
          <div style={{ flexShrink: 0, padding: "8px 14px", borderBottom: "1px solid #f0f0f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 14, fontWeight: "bold", color: "#1f2937" }}>ロールプレイ練習</span>
            <div style={{ display: "flex", gap: 6 }}>
              <span style={{ fontSize: 11, color: "#9ca3af", background: "#f3f4f6", padding: "2px 8px", borderRadius: 99 }}>{messages.length}回</span>
              <button onClick={startFresh} style={{ fontSize: 11, color: "#9ca3af", background: "none", border: "1px solid #e5e7eb", borderRadius: 6, padding: "2px 7px", cursor: "pointer" }}>最初から</button>
            </div>
          </div>

          {hasSavedSession && (
            <div style={{ flexShrink: 0, background: "#fffbeb", borderBottom: "1px solid #fde68a", padding: "6px 14px", fontSize: 11, color: "#92400e", display: "flex", justifyContent: "space-between" }}>
              <span>💾 前回の続きから再開</span>
              <button onClick={startFresh} style={{ background: "none", border: "none", color: "#2563eb", fontSize: 11, cursor: "pointer" }}>最初からやり直す</button>
            </div>
          )}

          {/* メッセージ一覧（ここだけスクロール） */}
          <div ref={chatRef} style={{ flex: 1, overflowY: "auto", padding: "12px 12px", display: "flex", flexDirection: "column", gap: 10, minHeight: 0 }}>
            {messages.map((m, i) => {
              const isCL = m.role === "assistant";
              const label = isCL ? `CL${++cl}（相談者）` : `CC${++cc}（あなた）`;
              return (
                <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: isCL ? "flex-start" : "flex-end" }}>
                  <div style={{ fontSize: 10, color: "#9ca3af", marginBottom: 3, fontWeight: "bold" }}>{label}</div>
                  <div style={{
                    padding: "9px 13px",
                    borderRadius: isCL ? "4px 12px 12px 12px" : "12px 4px 12px 12px",
                    background: isCL ? "#eff6ff" : "linear-gradient(135deg, #2563eb, #1d4ed8)",
                    color: isCL ? "#1e3a8a" : "#fff",
                    maxWidth: "88%",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                    lineHeight: 1.7,
                    fontSize: 15,
                    border: isCL ? "1px solid #bfdbfe" : "none",
                  }}>
                    {m.content}
                  </div>
                </div>
              );
            })}
            {loading && (
              <div style={{ padding: "8px 13px", borderRadius: "4px 12px 12px 12px", background: "#eff6ff", border: "1px solid #bfdbfe", fontSize: 13, color: "#6b7280", alignSelf: "flex-start" }}>
                入力中...
              </div>
            )}
          </div>

          {/* 入力エリア（常に下に固定） */}
          <div style={{ flexShrink: 0, padding: "10px 12px", background: "#fff", borderTop: "1px solid #e5e7eb", boxShadow: "0 -2px 8px rgba(0,0,0,0.05)" }}>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              style={{
                width: "100%",
                boxSizing: "border-box",
                resize: "none",
                padding: "11px 13px",
                borderRadius: 12,
                border: isRecording ? "2px solid #ef4444" : "1.5px solid #e5e7eb",
                fontSize: 16,
                height: 80,
                outline: "none",
                lineHeight: 1.6,
                fontFamily: "sans-serif",
                background: isRecording ? "#fff5f5" : "#fff",
                display: "block",
                marginBottom: 8,
              }}
              placeholder={isRecording ? "🎤 話してください..." : "返答を入力してください"}
            />
            <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <button onClick={toggleMic} style={{ flex: 1, padding: "11px 0", borderRadius: 10, border: isRecording ? "none" : "1.5px solid #e5e7eb", background: isRecording ? "linear-gradient(180deg,#ef4444,#dc2626)" : "#f9fafb", color: isRecording ? "#fff" : "#374151", fontSize: 14, fontWeight: "bold", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
                <span style={{ fontSize: 17 }}>🎤</span>
                <span>{isRecording ? "停止" : "マイク"}</span>
              </button>
              <button onClick={send} disabled={loading} style={{ flex: 2, padding: "11px 0", borderRadius: 10, border: "none", background: loading ? "#93c5fd" : "linear-gradient(180deg,#2563eb,#1d4ed8)", color: "#fff", fontWeight: "bold", fontSize: 16, cursor: loading ? "not-allowed" : "pointer" }}>
                {loading ? "送信中..." : "送信"}
              </button>
            </div>
            <button onClick={finishAndEvaluate} disabled={evaluating} style={{ width: "100%", padding: 12, background: evaluating ? "#6ee7b7" : "linear-gradient(180deg,#10b981,#059669)", color: "#fff", border: "none", borderRadius: 10, fontWeight: "bold", fontSize: 14, cursor: evaluating ? "not-allowed" : "pointer" }}>
              {evaluating ? "採点中..." : "✅ セッション終了 → AI採点"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ===== PC用レイアウト =====
  return (
    <div style={{ background: "#f3f6fb", minHeight: "100vh" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", display: "grid", gridTemplateColumns: "2fr 1fr", gap: 24, padding: "24px 16px" }}>
        <div style={{ background: "#fff", borderRadius: 16, boxShadow: "0 2px 16px rgba(0,0,0,0.07)", display: "flex", flexDirection: "column", height: "78vh", overflow: "hidden" }}>
          <div style={{ padding: "14px 20px", borderBottom: "1px solid #f0f0f0", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: "bold", color: "#1f2937" }}>ロールプレイ練習</div>
              <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>{caseLabel}</div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <span style={{ fontSize: 12, color: "#6b7280", background: "#f3f4f6", padding: "4px 10px", borderRadius: 99 }}>{messages.length}回のやりとり</span>
              <button onClick={startFresh} style={{ fontSize: 11, color: "#9ca3af", background: "none", border: "1px solid #e5e7eb", borderRadius: 6, padding: "3px 8px", cursor: "pointer" }}>最初から</button>
            </div>
          </div>
          {hasSavedSession && (
            <div style={{ background: "#fffbeb", borderBottom: "1px solid #fde68a", padding: "7px 16px", fontSize: 12, color: "#92400e", display: "flex", justifyContent: "space-between", flexShrink: 0 }}>
              <span>💾 前回の続きから再開しています</span>
              <button onClick={startFresh} style={{ background: "none", border: "none", color: "#2563eb", fontSize: 12, cursor: "pointer", fontWeight: "bold" }}>最初からやり直す</button>
            </div>
          )}
          <div ref={chatRef} style={{ flex: 1, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 12, minHeight: 0 }}>
            {messages.map((m, i) => {
              const isCL = m.role === "assistant";
              const label = isCL ? `CL${++cl}（相談者）` : `CC${++cc}（あなた）`;
              return (
                <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: isCL ? "flex-start" : "flex-end" }}>
                  <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 4, fontWeight: "bold" }}>{label}</div>
                  <div style={{ padding: "10px 14px", borderRadius: isCL ? "4px 14px 14px 14px" : "14px 4px 14px 14px", background: isCL ? "#eff6ff" : "linear-gradient(135deg, #2563eb, #1d4ed8)", color: isCL ? "#1e3a8a" : "#fff", maxWidth: "80%", whiteSpace: "pre-wrap", wordBreak: "break-word", lineHeight: 1.75, fontSize: 14, border: isCL ? "1px solid #bfdbfe" : "none" }}>{m.content}</div>
                </div>
              );
            })}
            {loading && <div style={{ padding: "8px 14px", borderRadius: "4px 14px 14px 14px", background: "#eff6ff", border: "1px solid #bfdbfe", fontSize: 13, color: "#6b7280", alignSelf: "flex-start" }}>入力中...</div>}
          </div>
          <div style={{ padding: "12px 16px", borderTop: "1px solid #f0f0f0", background: "#fafafa", flexShrink: 0 }}>
            <textarea value={input} onChange={(e) => setInput(e.target.value)} style={{ width: "100%", boxSizing: "border-box", resize: "none", padding: "10px 12px", borderRadius: 10, border: isRecording ? "2px solid #ef4444" : "1.5px solid #e5e7eb", fontSize: 14, height: 64, outline: "none", lineHeight: 1.6, fontFamily: "sans-serif", background: isRecording ? "#fff5f5" : "#fff", display: "block", marginBottom: 8 }}
              placeholder={isRecording ? "🎤 話してください..." : "メッセージを入力（Shift+Enterで送信）"}
              onKeyDown={(e) => { if (e.key === "Enter" && e.shiftKey) { e.preventDefault(); send(); } }}
            />
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={toggleMic} style={{ padding: "9px 14px", borderRadius: 8, border: isRecording ? "none" : "1.5px solid #e5e7eb", background: isRecording ? "linear-gradient(180deg,#ef4444,#dc2626)" : "#f3f4f6", color: isRecording ? "#fff" : "#374151", fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
                <span>🎤</span><span>{isRecording ? "停止" : "マイク"}</span>
              </button>
              <button onClick={send} disabled={loading} style={{ flex: 1, padding: "9px 0", borderRadius: 8, border: "none", background: loading ? "#93c5fd" : "linear-gradient(180deg,#2563eb,#1d4ed8)", color: "#fff", fontWeight: "bold", fontSize: 14, cursor: loading ? "not-allowed" : "pointer" }}>
                {loading ? "送信中..." : "送信"}
              </button>
            </div>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ background: "#fff", borderRadius: 16, padding: 20, boxShadow: "0 2px 16px rgba(0,0,0,0.07)" }}>
            <div style={{ display: "inline-block", background: "#eff6ff", color: "#2563eb", fontSize: 11, fontWeight: "bold", padding: "3px 10px", borderRadius: 99, border: "1px solid #bfdbfe", marginBottom: 12 }}>ケース情報</div>
            <h3 style={{ margin: "0 0 10px", fontSize: 16, color: "#1f2937" }}>{caseLabel}</h3>
            <div style={{ background: "#f8fafc", border: "1px solid #e5e7eb", borderRadius: 10, padding: "10px 12px", marginBottom: 12, fontSize: 13, color: "#4b5563", whiteSpace: "pre-wrap", lineHeight: 1.8 }}>{currentCase?.status}</div>
            <div style={{ fontSize: 13, color: "#374151", lineHeight: 1.8 }}><strong>相談したいこと</strong><p style={{ margin: "4px 0 0", color: "#4b5563" }}>{caseText}</p></div>
          </div>
          <div style={{ background: "#fff", borderRadius: 16, padding: 16, boxShadow: "0 2px 16px rgba(0,0,0,0.07)", display: "flex", flexDirection: "column", gap: 10 }}>
            <button onClick={finishAndEvaluate} disabled={evaluating} style={{ width: "100%", padding: 14, background: evaluating ? "#6ee7b7" : "linear-gradient(180deg,#10b981,#059669)", color: "#fff", border: "none", borderRadius: 10, fontWeight: "bold", fontSize: 15, cursor: evaluating ? "not-allowed" : "pointer" }}>
              {evaluating ? "採点中..." : "✅ セッション終了 → AI採点"}
            </button>
            <button onClick={() => navigate("/scenario")} style={{ width: "100%", padding: 10, background: "none", border: "1.5px solid #e5e7eb", borderRadius: 10, color: "#6b7280", fontSize: 13, cursor: "pointer" }}>← ケース一覧に戻る</button>
          </div>
          <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 12, padding: "12px 14px", fontSize: 12, color: "#92400e", lineHeight: 1.8 }}>
            💡 <strong>ヒント</strong><br />本番を想定して応答してください。終わったら「セッション終了」を押すと採点が始まります。
          </div>
        </div>
      </div>
    </div>
  );
}
