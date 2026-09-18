import { CORS, requireSubscriber } from "./_auth.js";

const MAX_BYTES = 20 * 1024 * 1024;

// Uint8Array を base64 文字列にする（大きな配列でもスタックを溢れさせない）
function toBase64(bytes) {
  let binary = "";
  const step = 0x8000;
  for (let i = 0; i < bytes.length; i += step) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + step));
  }
  return btoa(binary);
}

export async function onRequestOptions() {
  return new Response(null, { status: 200, headers: CORS });
}

// 音声（WAV/mp4/webm など）を受け取り、Cloudflare内蔵Whisperで日本語の文字起こしを返す
export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const auth = await requireSubscriber(request, env);
    if (auth.error) return auth.error;

    const form = await request.formData();
    const file = form.get("audio");
    if (!file || typeof file === "string") {
      return Response.json({ error: "audio file is required" }, { status: 400, headers: CORS });
    }
    const bytes = new Uint8Array(await file.arrayBuffer());
    if (bytes.length === 0) return Response.json({ error: "empty audio" }, { status: 400, headers: CORS });
    if (bytes.length > MAX_BYTES) return Response.json({ error: "audio too large" }, { status: 413, headers: CORS });

    let result;
    let model = "@cf/openai/whisper-large-v3-turbo";
    try {
      result = await env.AI.run(model, { audio: toBase64(bytes), language: "ja", task: "transcribe" });
    } catch (err) {
      console.error("whisper-large-v3-turbo 失敗、旧モデルで再試行:", err?.message || err);
      model = "@cf/openai/whisper";
      result = await env.AI.run(model, { audio: Array.from(bytes) });
    }

    const text = String(result?.text || "").trim();
    // 区間ごとの時刻情報（あれば話者分けの精度向上に使う）
    const segments = Array.isArray(result?.segments)
      ? result.segments.map((s) => ({ start: Number(s.start) || 0, end: Number(s.end) || 0, text: String(s.text || "").trim() }))
      : Array.isArray(result?.words)
        ? result.words.map((w) => ({ start: Number(w.start) || 0, end: Number(w.end) || 0, text: String(w.word || w.text || "").trim() }))
        : [];

    return Response.json({ text, segments, model }, { headers: CORS });
  } catch (err) {
    console.error("transcribe error:", err);
    return Response.json({ error: "transcribe failed" }, { status: 500, headers: CORS });
  }
}
