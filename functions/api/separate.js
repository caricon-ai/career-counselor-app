import OpenAI from "openai";
import { CORS, requireSubscriber } from "./_auth.js";

function mmss(sec) {
  const s = Math.max(0, Math.round(sec));
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

// 文字起こしの断片（5分ごとのチャンク）を時刻付きの1本のテキストにまとめる
function buildTimedTranscript(chunks) {
  const lines = [];
  for (const c of chunks) {
    const offset = Number(c.offset) || 0;
    if (Array.isArray(c.segments) && c.segments.length) {
      for (const s of c.segments) {
        if (!s.text) continue;
        lines.push(`[${mmss(offset + (Number(s.start) || 0))}] ${s.text}`);
      }
    } else if (c.text) {
      lines.push(`[${mmss(offset)}] ${c.text}`);
    }
  }
  return lines.join("\n");
}

// Whisperが無音部分で出しがちな決まり文句を取り除く
const HALLUCINATIONS = [
  /ご視聴ありがとうございました[。！!]?/g,
  /ご清聴ありがとうございました[。！!]?/g,
  /チャンネル登録(を)?(お願いします|よろしくお願いします)[。！!]?/g,
  /字幕[:：]?\s*[^\s。]*(さん)?[。]?/g,
  /おやすみなさい[。！!]?$/g,
];
function stripHallucination(text) {
  let t = text;
  for (const re of HALLUCINATIONS) t = t.replace(re, "");
  return t.trim();
}

// 同じ話者が連続している発話を1つにまとめる
function mergeSameSpeaker(list) {
  const out = [];
  for (const c of list) {
    const last = out[out.length - 1];
    if (last && last.speaker === c.speaker) last.text = `${last.text}${/[。！？!?]$/.test(last.text) ? "" : "。"}${c.text}`;
    else out.push({ ...c });
  }
  return out;
}

export async function onRequestOptions() {
  return new Response(null, { status: 200, headers: CORS });
}

// 文字起こしテキストを話者ごとの逐語録（JSON）に分ける
export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const auth = await requireSubscriber(request, env);
    if (auth.error) return auth.error;

    const { phase = "roleplay", chunks, markers = [], hints = {} } = await request.json();
    if (!Array.isArray(chunks) || chunks.length === 0) {
      return Response.json({ error: "chunks is required" }, { status: 400, headers: CORS });
    }

    const transcript = buildTimedTranscript(chunks);
    if (!transcript.trim()) {
      return Response.json({ conversation: [] }, { headers: CORS });
    }

    const isOral = phase === "oral";
    const speakerA = isOral ? "試験官" : "CC";
    const speakerB = isOral ? "受検者" : "CL";

    const markerText = Array.isArray(markers) && markers.length
      ? `\n【話者切替の記録（見学者がタップした時刻）】\n${markers.map((m) => `${mmss(m.t)} から ${m.speaker}`).join("\n")}\n`
      : "";

    const system = isOral
      ? `
あなたはキャリアコンサルティング技能検定2級の専門家です。
以下は「口頭試問」の音声を文字起こしした記録です。話者は2人です。
- 試験官：ロープレについて質問する側（「〜についてどう考えましたか」「〜を振り返ってください」など短い質問）
- 受検者：ロープレを振り返って答える側（「〜を意識しました」「〜が課題だと感じました」など長めの回答）
`.trim()
      : `
あなたはキャリアコンサルティング技能検定2級の専門家です。
以下は「面接ロールプレイ」の音声を文字起こしした記録です。話者は2人です。
- CC：キャリアコンサルタント役。名乗り・質問・共感・要約・確認が多い。相談者の言葉を繰り返す
- CL：相談者役。自分の状況・気持ち・悩みを語る。一人称で自分のことを話す
${hints.subjectName ? `CC役の名前：${hints.subjectName}\n` : ""}${hints.caseText ? `相談内容（参考）：${hints.caseText}\n` : ""}`.trim();

    const user = `
${system}

【ルール】
- 発話を話者ごとに分け、時系列のまま並べる
- 文字起こしの言葉はそのまま残す（言いよどみ・相槌も削らない）。要約・言い換え・追加はしない
- 明らかな誤変換（同音異義語など）だけは文脈に合う漢字に直してよい
- 同じ話者の連続した発話は1つにまとめる。相手の短い相槌（「はい」「そうですね」）は独立した発話として残す
- [mm:ss] の時刻は出力に含めない
${markerText}
【出力は必ず次のJSONのみ】
{ "conversation": [ { "speaker": "${speakerA}"|"${speakerB}", "text": string } ] }

【文字起こし】
${transcript}
`.trim();

    const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });
    const completion = await openai.chat.completions.create({
      model: env.OPENAI_MODEL || "gpt-4o-mini",
      temperature: 0.1,
      response_format: { type: "json_object" },
      messages: [{ role: "user", content: user }],
    });

    const raw = completion.choices?.[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(raw);
    const conversation = Array.isArray(parsed.conversation)
      ? mergeSameSpeaker(
          parsed.conversation
            .map((c) => ({ speaker: c.speaker === speakerB ? speakerB : speakerA, text: stripHallucination(String(c.text || "")) }))
            .filter((c) => c.text)
        )
      : [];

    return Response.json({ conversation }, { headers: CORS });
  } catch (err) {
    console.error("separate error:", err);
    return Response.json({ error: "separate failed" }, { status: 500, headers: CORS });
  }
}
