// src/pages/Record.jsx - 人と練習したロープレを録音（またはファイル選択）して採点する
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { scenarios } from "../data/scenarios";
import { apiPost, apiUpload } from "../lib/api";
import { blobToWavChunks, pickRecorderMime, CHUNK_SECONDS } from "../lib/audio";

const PHASES = {
  roleplay: { label: "ロープレ", minutes: 20, badge: "🎭", a: "CC", b: "CL" },
  oral: { label: "口頭試問", minutes: 7, badge: "🎤", a: "試験官", b: "受検者" },
};
const SAVE_KEY = "record_session_v1";

function fmt(sec) {
  const s = Math.max(0, Math.floor(sec));
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

export default function Record() {
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);

  // 設定（任意）
  const [caseSel, setCaseSel] = useState("free");
  const [freeText, setFreeText] = useState("");
  const [subjectName, setSubjectName] = useState("");
  const [showMarkers, setShowMarkers] = useState(() => { try { return localStorage.getItem("record_show_markers") === "1"; } catch { return false; } });
  const [setupOpen, setSetupOpen] = useState(false);
  const [fileOpen, setFileOpen] = useState(false);

  // 進行状態
  const [step, setStep] = useState("idle"); // idle | recording | askOral | processing | transcript | evaluating
  const [phase, setPhase] = useState("roleplay");
  const [elapsed, setElapsed] = useState(0);
  const [chunks, setChunks] = useState({ roleplay: [], oral: [] });
  const [markers, setMarkers] = useState({ roleplay: [], oral: [] });
  const [conversation, setConversation] = useState({ roleplay: [], oral: [] });
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(null); // { phase, index, text }
  const [uploading, setUploading] = useState(false); // ファイル読み込み中は話者分けを始めない

  const streamRef = useRef(null);
  const recorderRef = useRef(null);
  const tickRef = useRef(null);
  const wakeLockRef = useRef(null);
  const phaseRef = useRef("roleplay");
  const elapsedRef = useRef(0);
  const segStartRef = useRef(0);
  const seqRef = useRef({ roleplay: 0, oral: 0 });
  const currentSegRef = useRef(null); // 録音中の区間 { ph, seq, offset }
  const blobStore = useRef({}); // 再試行用に WAV を保持（key: phase-seq）
  const stoppingRef = useRef(false);

  useEffect(() => { try { localStorage.setItem("record_show_markers", showMarkers ? "1" : "0"); } catch { /* 無視 */ } }, [showMarkers]);

  // 途中経過をブラウザに保存（クラッシュ時の保険）
  useEffect(() => {
    if (step === "idle") return;
    try { localStorage.setItem(SAVE_KEY, JSON.stringify({ chunks, markers, caseSel, freeText, subjectName, savedAt: Date.now() })); } catch { /* 無視 */ }
  }, [chunks, markers, caseSel, freeText, subjectName, step]);

  // 画面を消さない（Wake Lock）
  const requestWakeLock = async () => {
    try {
      if (navigator.wakeLock && !wakeLockRef.current) {
        wakeLockRef.current = await navigator.wakeLock.request("screen");
        wakeLockRef.current.addEventListener("release", () => { wakeLockRef.current = null; });
      }
    } catch { /* 対応していない端末では無視 */ }
  };
  useEffect(() => {
    const onVisible = () => { if (document.visibilityState === "visible" && step === "recording") requestWakeLock(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [step]);

  const currentCase = caseSel === "free" ? null : scenarios.find((s) => s.id === caseSel);
  const caseText = currentCase ? currentCase.caseText : freeText;

  // ===== 文字起こしチャンクの管理 =====
  const upsertChunk = (ph, seq, patch) => {
    setChunks((prev) => {
      const list = [...prev[ph]];
      const i = list.findIndex((c) => c.seq === seq);
      if (i >= 0) list[i] = { ...list[i], ...patch };
      else list.push({ seq, ...patch });
      list.sort((a, b) => a.seq - b.seq);
      return { ...prev, [ph]: list };
    });
  };

  const uploadWav = async (ph, seq, offset, wavBlob) => {
    blobStore.current[`${ph}-${seq}`] = { offset, wavBlob };
    upsertChunk(ph, seq, { offset, status: "uploading" });
    try {
      const fd = new FormData();
      fd.append("audio", wavBlob, `${ph}-${seq}.wav`);
      const res = await apiUpload("/api/transcribe", fd);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "transcribe failed");
      upsertChunk(ph, seq, { status: "done", text: data.text || "", segments: data.segments || [] });
    } catch (e) {
      console.error(e);
      upsertChunk(ph, seq, { status: "error" });
    }
  };

  // 録音セグメント（webm/mp4）→ WAV → アップロード
  const handleSegmentBlob = async (ph, seq, offset, blob) => {
    if (!blob || blob.size === 0) return;
    upsertChunk(ph, seq, { offset, status: "converting" });
    try {
      const wavs = await blobToWavChunks(blob, CHUNK_SECONDS + 60); // 1セグメント＝1チャンク
      if (wavs.length === 0) { upsertChunk(ph, seq, { status: "done", text: "", segments: [] }); return; }
      await uploadWav(ph, seq, offset, wavs[0].blob);
    } catch (e) {
      console.error(e);
      upsertChunk(ph, seq, { status: "error" });
    }
  };

  const retryChunk = async (ph, seq) => {
    const saved = blobStore.current[`${ph}-${seq}`];
    if (!saved) { setError("この区間の音声が残っていないため再試行できません。"); return; }
    await uploadWav(ph, seq, saved.offset, saved.wavBlob);
  };

  // ===== 録音 =====
  const startSegment = () => {
    const ph = phaseRef.current;
    const seq = seqRef.current[ph]++;
    const offset = elapsedRef.current;
    segStartRef.current = offset;
    currentSegRef.current = { ph, seq, offset };
    // 先に「処理待ち」として登録しておく（区間が未登録のまま処理へ進むのを防ぐ）
    upsertChunk(ph, seq, { offset, status: "recording" });
    const mime = pickRecorderMime();
    const rec = new MediaRecorder(streamRef.current, mime ? { mimeType: mime } : undefined);
    const parts = [];
    rec.ondataavailable = (e) => { if (e.data && e.data.size > 0) parts.push(e.data); };
    rec.onstop = () => handleSegmentBlob(ph, seq, offset, new Blob(parts, { type: rec.mimeType || mime || "audio/webm" }));
    rec.start(1000);
    recorderRef.current = rec;
  };

  const rotateSegment = () => {
    const rec = recorderRef.current;
    if (rec && rec.state === "recording") rec.stop();
    startSegment();
  };

  const startPhase = async (ph) => {
    setError("");
    try {
      if (!streamRef.current) {
        streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      }
    } catch {
      setError("マイクの使用を許可してください（ブラウザの設定で許可できます）。うまくいかない場合は「音声ファイルから」をお使いください。");
      return;
    }
    phaseRef.current = ph;
    setPhase(ph);
    elapsedRef.current = 0;
    setElapsed(0);
    setStep("recording");
    await requestWakeLock();
    startSegment();
    clearInterval(tickRef.current);
    tickRef.current = setInterval(() => {
      elapsedRef.current += 1;
      setElapsed(elapsedRef.current);
      if (elapsedRef.current - segStartRef.current >= CHUNK_SECONDS) rotateSegment();
    }, 1000);
  };

  const stopPhase = () => {
    if (stoppingRef.current) return;
    stoppingRef.current = true;
    clearInterval(tickRef.current);
    const rec = recorderRef.current;
    if (rec && rec.state === "recording") rec.stop();
    recorderRef.current = null;
    if (phaseRef.current === "roleplay") setStep("askOral");
    else finishRecording();
    stoppingRef.current = false;
  };

  const releaseMedia = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    try { wakeLockRef.current?.release(); } catch { /* 無視 */ }
    wakeLockRef.current = null;
  };

  const finishRecording = () => {
    releaseMedia();
    setStep("processing");
  };

  const addMarker = (speaker) => {
    const ph = phaseRef.current;
    setMarkers((prev) => ({ ...prev, [ph]: [...prev[ph], { t: elapsedRef.current, speaker }] }));
  };

  // ===== ファイルから =====
  const [files, setFiles] = useState({ roleplay: null, oral: null });
  const processFiles = async () => {
    if (!files.roleplay) { setError("ロープレの音声ファイルを選んでください。"); return; }
    setError("");
    setUploading(true);
    setStep("processing");
    try {
      for (const ph of ["roleplay", "oral"]) {
        const f = files[ph];
        if (!f) continue;
        setStatus(`${PHASES[ph].label}の音声を変換しています…`);
        let wavs;
        try {
          wavs = await blobToWavChunks(f);
        } catch (e) {
          console.error(e);
          setError(`${PHASES[ph].label}の音声ファイルを読み込めませんでした。別の形式（m4a / mp3 / wav）でお試しください。`);
          setStep("idle");
          return;
        }
        for (let i = 0; i < wavs.length; i++) {
          setStatus(`${PHASES[ph].label}を文字起こし中… ${i + 1}/${wavs.length}`);
          await uploadWav(ph, i, wavs[i].offset, wavs[i].blob);
        }
      }
    } finally {
      setUploading(false);
    }
  };

  // ===== 文字起こし完了 → 話者分け =====
  const pending = [...chunks.roleplay, ...chunks.oral].filter((c) => c.status !== "done" && c.status !== "error").length;
  const failed = [...chunks.roleplay, ...chunks.oral].filter((c) => c.status === "error").length;
  const separatingRef = useRef(false);

  useEffect(() => {
    if (step !== "processing" || uploading || pending > 0 || failed > 0 || separatingRef.current) return;
    separatingRef.current = true;
    (async () => {
      try {
        const result = { roleplay: [], oral: [] };
        for (const ph of ["roleplay", "oral"]) {
          const done = chunks[ph].filter((c) => c.status === "done" && (c.text || (c.segments || []).length));
          if (done.length === 0) continue;
          setStatus(`${PHASES[ph].label}の話者を分けています…`);
          const res = await apiPost("/api/separate", {
            phase: ph,
            chunks: done.map((c) => ({ seq: c.seq, offset: c.offset, text: c.text, segments: c.segments })),
            markers: markers[ph],
            hints: { subjectName, caseText },
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || "separate failed");
          result[ph] = data.conversation || [];
        }
        if (result.roleplay.length === 0) {
          setError("音声から会話を読み取れませんでした。録音の音量や周囲の音を確認して、もう一度お試しください。");
          setStep("idle");
          separatingRef.current = false;
          return;
        }
        setConversation(result);
        setStatus("");
        setStep("transcript");
      } catch (e) {
        console.error(e);
        setError("話者分けに失敗しました。「もう一度試す」を押してください。");
      } finally {
        separatingRef.current = false;
      }
    })();
  }, [step, uploading, pending, failed]); // eslint-disable-line react-hooks/exhaustive-deps

  // ===== 逐語録の修正 =====
  const toggleSpeaker = (ph, i) => {
    setConversation((prev) => {
      const list = prev[ph].map((c, idx) => idx === i ? { ...c, speaker: c.speaker === PHASES[ph].a ? PHASES[ph].b : PHASES[ph].a } : c);
      return { ...prev, [ph]: list };
    });
  };
  const saveEdit = () => {
    if (!editing) return;
    setConversation((prev) => ({ ...prev, [editing.phase]: prev[editing.phase].map((c, idx) => idx === editing.index ? { ...c, text: editing.text } : c) }));
    setEditing(null);
  };
  const removeLine = (ph, i) => {
    setConversation((prev) => ({ ...prev, [ph]: prev[ph].filter((_, idx) => idx !== i) }));
  };

  // ===== 採点 =====
  const evaluate = async () => {
    setStep("evaluating");
    setError("");
    try {
      const messages = conversation.roleplay.map((c) => ({ role: c.speaker === "CC" ? "user" : "assistant", content: c.text }));
      const res = await apiPost("/api/evaluate", {
        caseId: currentCase ? currentCase.id : "free",
        caseName: currentCase ? currentCase.name : (subjectName ? `${subjectName}さんのロープレ` : "自由ケース"),
        caseText,
        caseStatus: currentCase?.status || "",
        evaluationPoints: currentCase?.evaluationPoints || [],
        source: "recording",
        subjectName,
        oral: conversation.oral.length ? conversation.oral : null,
        messages,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "evaluate failed");
      try { localStorage.removeItem(SAVE_KEY); } catch { /* 無視 */ }
      navigate("/result", { state: { caseId: currentCase ? currentCase.id : "free", messages, score: data, createdAt: new Date().toISOString() } });
    } catch (e) {
      console.error(e);
      setError("採点に失敗しました。もう一度「AI採点」を押してください。");
      setStep("transcript");
    }
  };

  const resetAll = () => {
    clearInterval(tickRef.current);
    releaseMedia();
    setStep("idle"); setElapsed(0); setChunks({ roleplay: [], oral: [] }); setMarkers({ roleplay: [], oral: [] });
    setConversation({ roleplay: [], oral: [] }); setStatus(""); setError(""); setFiles({ roleplay: null, oral: null });
    seqRef.current = { roleplay: 0, oral: 0 }; blobStore.current = {};
    try { localStorage.removeItem(SAVE_KEY); } catch { /* 無視 */ }
  };

  useEffect(() => () => { clearInterval(tickRef.current); releaseMedia(); }, []);

  // ===== 見た目 =====
  const wrap = { background: "#f0f2f8", minHeight: "100vh", padding: isMobile ? "16px 12px" : "28px 16px" };
  const card = { background: "#fff", borderRadius: 14, padding: isMobile ? 18 : 24, boxShadow: "0 2px 10px rgba(0,0,0,0.06)", marginBottom: 14 };
  const bigBtn = (bg) => ({ width: "100%", padding: isMobile ? "20px 0" : "22px 0", borderRadius: 14, border: "none", background: bg, color: "#fff", fontSize: isMobile ? 20 : 22, fontWeight: "bold", cursor: "pointer", boxShadow: "0 4px 14px rgba(0,0,0,0.15)" });
  const subBtn = { padding: "10px 16px", borderRadius: 10, border: "1px solid #e5e7eb", background: "#fff", cursor: "pointer", fontSize: 14, color: "#374151" };
  const ph = PHASES[phase];
  const remaining = ph.minutes * 60 - elapsed;
  const doneCount = (p) => chunks[p].filter((c) => c.status === "done").length;

  return (
    <div style={wrap}>
      <div style={{ maxWidth: 720, margin: "0 auto" }}>

        {/* ===== 待機画面 ===== */}
        {step === "idle" && (
          <>
            <div style={{ ...card, textAlign: "center" }}>
              <div style={{ fontSize: 13, color: "#2563eb", fontWeight: "bold", marginBottom: 6 }}>人と練習したロープレを採点</div>
              <h1 style={{ margin: "0 0 8px", fontSize: isMobile ? 22 : 26, color: "#1f2937" }}>録音して採点</h1>
              <p style={{ color: "#6b7280", fontSize: 14, lineHeight: 1.8, margin: "0 0 20px" }}>
                スマホを2人の間に置いて「録音開始」。<br />終わったら「終了」を押すだけで、逐語録と採点レポートができます。
              </p>
              {error && <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 10, padding: "10px 14px", marginBottom: 14, fontSize: 14, color: "#b91c1c", textAlign: "left" }}>⚠️ {error}</div>}
              <button onClick={() => startPhase("roleplay")} style={bigBtn("linear-gradient(180deg,#ef4444,#dc2626)")}>🎙 録音開始（ロープレ）</button>
              <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 12, lineHeight: 1.7 }}>
                録音中は画面を点けたまま、伏せないでください。<br />相手（相談者役）に録音の了承を得てからお使いください。
              </p>
            </div>

            {/* 任意設定 */}
            <div style={card}>
              <button onClick={() => setSetupOpen(!setupOpen)} style={{ width: "100%", background: "none", border: "none", textAlign: "left", cursor: "pointer", fontSize: 14, fontWeight: "bold", color: "#374151", padding: 0, display: "flex", justifyContent: "space-between" }}>
                <span>⚙️ 設定（任意）：ケース・受検者名</span><span style={{ color: "#9ca3af" }}>{setupOpen ? "▲" : "▼"}</span>
              </button>
              {setupOpen && (
                <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 12 }}>
                  <label style={{ fontSize: 13, color: "#4b5563" }}>ケース
                    <select value={caseSel} onChange={(e) => setCaseSel(e.target.value)} style={{ display: "block", width: "100%", marginTop: 4, padding: "10px 12px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 14, background: "#fff" }}>
                      <option value="free">自由（相談内容はAIが要約します）</option>
                      {scenarios.map((s) => <option key={s.id} value={s.id}>{s.name}：{s.theme}</option>)}
                    </select>
                  </label>
                  {caseSel === "free" && (
                    <label style={{ fontSize: 13, color: "#4b5563" }}>相談内容のメモ（任意）
                      <textarea value={freeText} onChange={(e) => setFreeText(e.target.value)} rows={2} placeholder="例：35歳・店長。転職すべきか迷っている" style={{ display: "block", width: "100%", marginTop: 4, padding: "10px 12px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 14, boxSizing: "border-box", fontFamily: "inherit" }} />
                    </label>
                  )}
                  <label style={{ fontSize: 13, color: "#4b5563" }}>受検者（CC役）の名前（任意）
                    <input value={subjectName} onChange={(e) => setSubjectName(e.target.value)} placeholder="例：山田" style={{ display: "block", width: "100%", marginTop: 4, padding: "10px 12px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 14, boxSizing: "border-box" }} />
                  </label>
                  <label style={{ fontSize: 13, color: "#4b5563", display: "flex", alignItems: "center", gap: 8 }}>
                    <input type="checkbox" checked={showMarkers} onChange={(e) => setShowMarkers(e.target.checked)} />
                    録音中に「話者切替」ボタンを表示する（見学者向け・話者分けの精度が上がります）
                  </label>
                </div>
              )}
            </div>

            {/* ファイルから */}
            <div style={card}>
              <button onClick={() => setFileOpen(!fileOpen)} style={{ width: "100%", background: "none", border: "none", textAlign: "left", cursor: "pointer", fontSize: 14, fontWeight: "bold", color: "#374151", padding: 0, display: "flex", justifyContent: "space-between" }}>
                <span>📁 音声ファイルから採点する（ボイスメモで録った場合）</span><span style={{ color: "#9ca3af" }}>{fileOpen ? "▲" : "▼"}</span>
              </button>
              {fileOpen && (
                <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 12 }}>
                  <label style={{ fontSize: 13, color: "#4b5563" }}>ロープレの音声（必須）
                    <input type="file" accept="audio/*,video/mp4,.m4a,.mp3,.wav,.webm" onChange={(e) => setFiles((f) => ({ ...f, roleplay: e.target.files?.[0] || null }))} style={{ display: "block", marginTop: 4, fontSize: 14 }} />
                  </label>
                  <label style={{ fontSize: 13, color: "#4b5563" }}>口頭試問の音声（任意）
                    <input type="file" accept="audio/*,video/mp4,.m4a,.mp3,.wav,.webm" onChange={(e) => setFiles((f) => ({ ...f, oral: e.target.files?.[0] || null }))} style={{ display: "block", marginTop: 4, fontSize: 14 }} />
                  </label>
                  <button onClick={processFiles} disabled={!files.roleplay} style={{ ...bigBtn(files.roleplay ? "linear-gradient(180deg,#2563eb,#1d4ed8)" : "#93c5fd"), fontSize: 17, padding: "14px 0", cursor: files.roleplay ? "pointer" : "not-allowed" }}>
                    この音声で採点する
                  </button>
                </div>
              )}
            </div>

            <div style={{ textAlign: "center" }}>
              <button onClick={() => navigate("/scenario")} style={subBtn}>← ケース一覧に戻る</button>
            </div>
          </>
        )}

        {/* ===== 録音中 ===== */}
        {step === "recording" && (
          <div style={{ ...card, textAlign: "center", borderTop: `6px solid ${phase === "oral" ? "#7c3aed" : "#ef4444"}` }}>
            <div style={{ display: "inline-block", background: phase === "oral" ? "#f3e8ff" : "#fee2e2", color: phase === "oral" ? "#6d28d9" : "#b91c1c", fontWeight: "bold", fontSize: 14, padding: "4px 14px", borderRadius: 99, marginBottom: 14 }}>
              {ph.badge} {ph.label} 録音中
            </div>
            <div style={{ fontSize: isMobile ? 56 : 68, fontWeight: "bold", color: remaining <= 60 ? "#dc2626" : remaining <= 300 ? "#d97706" : "#1f2937", fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>
              {fmt(Math.max(0, remaining))}
            </div>
            <div style={{ fontSize: 13, color: "#6b7280", marginTop: 6 }}>残り時間（目安 {ph.minutes}分） ／ 経過 {fmt(elapsed)}</div>
            <div style={{ display: "flex", justifyContent: "center", gap: 4, margin: "18px 0" }}>
              {[0, 1, 2, 3, 4].map((i) => <span key={i} style={{ width: 6, height: 22 + (i % 3) * 8, background: "#ef4444", borderRadius: 3, animation: `recpulse 1s ${i * 0.15}s infinite alternate` }} />)}
            </div>
            <style>{`@keyframes recpulse{from{transform:scaleY(0.4);opacity:.5}to{transform:scaleY(1);opacity:1}}`}</style>

            {showMarkers && (
              <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                {[ph.a, ph.b].map((sp) => (
                  <button key={sp} onClick={() => addMarker(sp)} style={{ flex: 1, padding: "14px 0", borderRadius: 10, border: "2px solid #bfdbfe", background: "#eff6ff", color: "#1d4ed8", fontWeight: "bold", fontSize: 15, cursor: "pointer" }}>
                    {sp} が話し始めた
                  </button>
                ))}
              </div>
            )}

            <button onClick={stopPhase} style={bigBtn("linear-gradient(180deg,#1f2937,#111827)")}>
              ⏹ {ph.label}を終了
            </button>
            <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 12 }}>画面を点けたままにしてください。文字起こし済み：{doneCount(phase)}区間</p>
            {error && <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 10, padding: "10px 14px", marginTop: 10, fontSize: 13, color: "#b91c1c" }}>⚠️ {error}</div>}
          </div>
        )}

        {/* ===== 口頭試問に進むか ===== */}
        {step === "askOral" && (
          <div style={{ ...card, textAlign: "center" }}>
            <h2 style={{ margin: "0 0 8px", fontSize: 20, color: "#1f2937" }}>ロープレの録音を終了しました</h2>
            <p style={{ color: "#6b7280", fontSize: 14, lineHeight: 1.8, margin: "0 0 20px" }}>続けて口頭試問（7分）も録音しますか？<br />試験官役の人が質問し、受検者が答える場面です。</p>
            <button onClick={() => startPhase("oral")} style={{ ...bigBtn("linear-gradient(180deg,#7c3aed,#6d28d9)"), marginBottom: 12 }}>🎤 口頭試問を録音する</button>
            <button onClick={finishRecording} style={{ ...bigBtn("linear-gradient(180deg,#10b981,#059669)") }}>✅ 録音せずに採点へ進む</button>
          </div>
        )}

        {/* ===== 処理中 ===== */}
        {step === "processing" && (
          <div style={{ ...card, textAlign: "center" }}>
            <div style={{ width: 44, height: 44, border: "4px solid #dbeafe", borderTopColor: "#2563eb", borderRadius: "50%", margin: "8px auto 16px", animation: "spin 1s linear infinite" }} />
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            <h2 style={{ margin: "0 0 8px", fontSize: 20, color: "#1f2937" }}>処理中です…</h2>
            <p style={{ color: "#6b7280", fontSize: 14, lineHeight: 1.8 }}>
              {status || (pending > 0 ? `文字起こし中（残り ${pending} 区間）` : "話者を分けています…")}
            </p>
            {failed > 0 && (
              <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 10, padding: "12px 14px", marginTop: 12, fontSize: 13, color: "#b91c1c" }}>
                ⚠️ 一部の区間の文字起こしに失敗しました。
                <div style={{ marginTop: 8, display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "center" }}>
                  {["roleplay", "oral"].flatMap((p) => chunks[p].filter((c) => c.status === "error").map((c) => (
                    <button key={`${p}-${c.seq}`} onClick={() => retryChunk(p, c.seq)} style={{ ...subBtn, fontSize: 13 }}>{PHASES[p].label} 区間{c.seq + 1} を再試行</button>
                  )))}
                </div>
              </div>
            )}
            {error && <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 10, padding: "10px 14px", marginTop: 12, fontSize: 13, color: "#b91c1c" }}>⚠️ {error}
              <div style={{ marginTop: 8 }}><button onClick={() => { setError(""); setStep("idle"); setTimeout(() => setStep("processing"), 0); }} style={subBtn}>もう一度試す</button></div>
            </div>}
            <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 16 }}>このページを閉じずにお待ちください（1〜2分）</p>
          </div>
        )}

        {/* ===== 逐語録の確認・修正 ===== */}
        {(step === "transcript" || step === "evaluating") && (
          <>
            <div style={card}>
              <h2 style={{ margin: "0 0 6px", fontSize: 20, color: "#1f2937" }}>逐語録を確認してください</h2>
              <p style={{ color: "#6b7280", fontSize: 13, lineHeight: 1.7, margin: 0 }}>
                話者（CC／CL）が違っていたら<strong>名前をタップ</strong>で入れ替え、文章は<strong>吹き出しをタップ</strong>で直せます。確認できたら下の「AI採点」を押してください。
              </p>
            </div>

            {["roleplay", "oral"].map((p) => conversation[p].length > 0 && (
              <div key={p} style={card}>
                <div style={{ fontSize: 14, fontWeight: "bold", color: "#1f2937", marginBottom: 12 }}>{PHASES[p].badge} {PHASES[p].label}（{conversation[p].length}発話）</div>
                {conversation[p].map((c, i) => {
                  const isA = c.speaker === PHASES[p].a;
                  const isEditing = editing && editing.phase === p && editing.index === i;
                  return (
                    <div key={i} style={{ display: "flex", flexDirection: isA ? "row" : "row-reverse", gap: 8, alignItems: "flex-start", marginBottom: 10 }}>
                      <button onClick={() => toggleSpeaker(p, i)} title="タップで話者を入れ替え" style={{ fontSize: 11, fontWeight: "bold", color: isA ? "#1e3a8a" : "#880e4f", background: isA ? "#e8eaf6" : "#fce4ec", border: "1px dashed transparent", borderRadius: 6, padding: "6px 8px", minWidth: 44, cursor: "pointer", flexShrink: 0 }}>
                        {c.speaker} ⇄
                      </button>
                      {isEditing ? (
                        <div style={{ flex: 1 }}>
                          <textarea value={editing.text} onChange={(e) => setEditing({ ...editing, text: e.target.value })} rows={3} style={{ width: "100%", boxSizing: "border-box", padding: 10, borderRadius: 8, border: "1.5px solid #2563eb", fontSize: 14, fontFamily: "inherit", lineHeight: 1.7 }} />
                          <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                            <button onClick={saveEdit} style={{ ...subBtn, background: "#2563eb", color: "#fff", border: "none" }}>保存</button>
                            <button onClick={() => setEditing(null)} style={subBtn}>キャンセル</button>
                            <button onClick={() => { removeLine(p, i); setEditing(null); }} style={{ ...subBtn, color: "#b91c1c", marginLeft: "auto" }}>この発話を削除</button>
                          </div>
                        </div>
                      ) : (
                        <div onClick={() => setEditing({ phase: p, index: i, text: c.text })} style={{ flex: 1, background: isA ? "#fff" : "#fdf6ff", border: `1px solid ${isA ? "#e0e0e0" : "#e1bee7"}`, borderRadius: 8, padding: "10px 14px", fontSize: 14, lineHeight: 1.75, color: "#333", cursor: "text", whiteSpace: "pre-wrap" }}>
                          {c.text}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}

            {error && <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 10, padding: "10px 14px", marginBottom: 12, fontSize: 14, color: "#b91c1c" }}>⚠️ {error}</div>}

            <div style={{ position: "sticky", bottom: 12 }}>
              <button onClick={evaluate} disabled={step === "evaluating"} style={{ ...bigBtn(step === "evaluating" ? "#6ee7b7" : "linear-gradient(180deg,#10b981,#059669)"), cursor: step === "evaluating" ? "not-allowed" : "pointer" }}>
                {step === "evaluating" ? "採点中…（1分ほど）" : "🤖 AI採点する"}
              </button>
            </div>
            <div style={{ textAlign: "center", marginTop: 14 }}>
              <button onClick={resetAll} style={{ ...subBtn, fontSize: 13, color: "#9ca3af" }}>最初からやり直す</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
