// src/pages/Share.jsx - 共有リンクで採点結果を見る（ログイン不要・閲覧のみ）
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ReportView } from "./Result";

export default function Share() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const [state, setState] = useState({ data: null, error: "" });

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    fetch(`/api/share?token=${encodeURIComponent(token)}`)
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "not found");
        if (!cancelled) setState({ data: json, error: "" });
      })
      .catch(() => { if (!cancelled) setState({ data: null, error: "このレポートは見つかりませんでした。リンクが正しいかご確認ください。" }); });
    return () => { cancelled = true; };
  }, [token]);

  const error = token ? state.error : "リンクが正しくありません。";
  if (error) {
    return <div style={{ padding: 40, textAlign: "center", color: "#374151" }}><h2 style={{ fontSize: 18 }}>{error}</h2></div>;
  }
  if (!state.data) {
    return <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#6b7280" }}>読み込み中...</div>;
  }
  const d = state.data;
  return <ReportView score={d.score} messages={d.messages || []} caseId={d.case_id} createdAt={d.created_at} shareMode />;
}
