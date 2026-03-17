// src/pages/RolePlay.jsx

import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { scenarios } from "../data/scenarios";

export default function RolePlay() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // URLから caseId を取得
  const caseId = searchParams.get("case");

  // caseId から該当ケースを取得
  const currentCase = scenarios.find((s) => s.id === caseId);

  // 表示用（保険付き）
  const caseLabel = currentCase?.name || "ロールプレイ";
  const caseText = currentCase?.caseText || "";

  const chatRef = useRef(null);

  // 初期メッセージ（相談者の最初の発話）
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: currentCase?.openingMessage || "",
    },
  ]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  // hover制御
  const [hoverSend, setHoverSend] = useState(false);
  const [hoverEnd, setHoverEnd] = useState(false);

  // 採点中フラグ（二重押し防止）
  const [evaluating, setEvaluating] = useState(false);

  // チャット欄を自動スクロール
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages]);

  // ===== 送信処理 =====
  const send = async () => {
    if (!input.trim() || loading) return;

    const next = [...messages, { role: "user", content: input }];
    setMessages(next);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: next,
          caseDisplayName: caseLabel,
        }),
      });

      const data = await res.json();

      setMessages([...next, { role: "assistant", content: data.content }]);
    } catch {
      setMessages([...next, { role: "assistant", content: "（通信エラー）" }]);
    } finally {
      setLoading(false);
    }
  };

  // ===== セッション終了 → 採点 =====
  const finishAndEvaluate = async () => {
    if (evaluating) return;

    setEvaluating(true);

    try {
      const res = await fetch("/api/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caseId,
          messages,
        }),
      });

      if (!res.ok) {
        alert("採点処理でエラーが発生しました");
        setEvaluating(false);
        return;
      }

      const score = await res.json();

      navigate("/result", {
        state: { caseId, messages, score },
      });
    } catch {
      alert("採点APIへの通信に失敗しました");
      setEvaluating(false);
    }
  };

  // 表示用カウンタ
  let cl = 0;
  let cc = 0;

  return (
    <div style={{ background: "#f3f6fb", minHeight: "100vh" }}>
      <div
        style={{
          maxWidth: 1100,
          margin: "24px auto",
          display: "grid",
          gridTemplateColumns: "2fr 1fr",
          gap: 24,
          padding: "0 16px",
        }}
      >
        {/* ===== チャット ===== */}
        <div
          style={{
            background: "#fff",
            borderRadius: 12,
            padding: 20,
            display: "flex",
            flexDirection: "column",
            height: "75vh",
          }}
        >
          <h2 style={{ margin: "0 0 8px" }}>ロールプレイ練習</h2>

          <div
            ref={chatRef}
            style={{
              flex: 1,
              overflowY: "auto",
              border: "1px solid #e5e7eb",
              borderRadius: 8,
              padding: 12,
              background: "#fafafa",
            }}
          >
            {messages.map((m, i) => {
              const isCL = m.role === "assistant";
              const label = isCL
                ? `CL${++cl}（相談者）`
                : `CC${++cc}（あなた）`;

              return (
                <div
                  key={i}
                  style={{
                    marginBottom: 12,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: isCL ? "flex-start" : "flex-end",
                  }}
                >
                  <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>
                    {label}
                  </div>

                  <div
                    style={{
                      padding: 10,
                      borderRadius: 8,
                      background: isCL ? "#e5edff" : "#2563eb",
                      color: isCL ? "#111" : "#fff",
                      maxWidth: "80%",
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                      lineHeight: 1.7,
                      textAlign: "left",
                    }}
                  >
                    {m.content}
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ display: "flex", marginTop: 12, gap: 8 }}>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              style={{
                flex: 1,
                resize: "none",
                padding: 10,
                borderRadius: 8,
                border: "1px solid #ccc",
              }}
              placeholder="メッセージを入力（Shift+Enterで送信）"
              onKeyDown={(e) => {
                if (e.key === "Enter" && e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
            />

            <button
              onClick={send}
              disabled={loading}
              onMouseEnter={() => setHoverSend(true)}
              onMouseLeave={() => setHoverSend(false)}
              style={{
                padding: "0 16px",
                borderRadius: 8,
                border: "none",
                background: hoverSend
                  ? "linear-gradient(180deg, #1d4ed8, #1e40af)"
                  : "linear-gradient(180deg, #2563eb, #1d4ed8)",
                color: "#fff",
                fontWeight: "bold",
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.6 : 1,
              }}
            >
              送信
            </button>
          </div>
        </div>

        {/* ===== ケース情報 ===== */}
        <div
          style={{
            background: "#fff",
            borderRadius: 12,
            padding: 20,
            height: "fit-content",
          }}
        >
          <h3>ケース情報</h3>

          <p>
            <strong>相談者：</strong>
            {caseLabel}
          </p>
          <p
  style={{
    fontSize: 14,
    color: "#111827",
    whiteSpace: "pre-wrap",
    lineHeight: 1.7,
    marginTop: 8,
    marginBottom: 12,
  }}
>
  {currentCase?.status}
</p>


          <p>
            <strong>相談したいこと</strong>
            <br />
            {caseText}
          </p>

          <button
            onClick={() => navigate("/scenario")}
            style={{ width: "100%", padding: 10, marginBottom: 8 }}
          >
            ケース一覧へ
          </button>

          <button
            onClick={finishAndEvaluate}
            disabled={evaluating}
            onMouseEnter={() => setHoverEnd(true)}
            onMouseLeave={() => setHoverEnd(false)}
            style={{
              width: "100%",
              padding: 12,
              background: hoverEnd
                ? "linear-gradient(180deg, #059669, #047857)"
                : "linear-gradient(180deg, #10b981, #059669)",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              fontWeight: "bold",
              cursor: evaluating ? "not-allowed" : "pointer",
              opacity: evaluating ? 0.7 : 1,
            }}
          >
            {evaluating ? "採点中..." : "セッション終了"}
          </button>
        </div>
      </div>
    </div>
  );
}
