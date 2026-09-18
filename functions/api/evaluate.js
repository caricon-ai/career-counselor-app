import OpenAI from "openai";
import { CORS, requireSubscriber } from "./_auth.js";

// JSONテキストを抽出する（AIがコードブロックで囲んで返した場合にも対応）
function extractJson(text) {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fenced?.[1]) return fenced[1];
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end > start) return text.slice(start, end + 1);
  return text;
}

// 会話ログを「CC1 / CL1」のように話者ごとの通し番号付きで整形する
function buildTranscript(messages) {
  let cc = 0;
  let cl = 0;
  return messages
    .map((m) => {
      const isCC = m.role === "user";
      const label = isCC ? `CC${++cc}` : `CL${++cl}`;
      return `[${label}] ${String(m.content || "")}`;
    })
    .join("\n");
}

// 同じケースの過去の練習結果（総数と、直近5回分の内容）を集める
async function loadPastAttempts(supabase, userId, caseId) {
  const { data, count } = await supabase
    .from("results")
    .select("created_at, score", { count: "exact" })
    .eq("user_id", userId)
    .eq("case_id", caseId)
    .order("created_at", { ascending: false })
    .limit(5);
  return { rows: (data || []).reverse(), count: count ?? (data || []).length };
}

export async function onRequestOptions() {
  return new Response(null, { status: 200, headers: CORS });
}

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const auth = await requireSubscriber(request, env);
    if (auth.error) return auth.error;

    const {
      messages, caseId, caseName, caseText, caseStatus, evaluationPoints,
      source = "chat", subjectName = "", oral = null,
    } = await request.json();

    if (!Array.isArray(messages)) {
      return Response.json({ error: "messages must be an array" }, { status: 400, headers: CORS });
    }
    const isRecording = source === "recording";
    const hasOral = Array.isArray(oral) && oral.length > 0;
    const isFreeCase = !caseId || caseId === "free";

    const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });
    const transcript = buildTranscript(messages);
    const ccCount = messages.filter((m) => m.role === "user").length;

    const { rows: past, count: pastCount } = await loadPastAttempts(auth.supabase, auth.user.id, caseId || "unknown");
    const attempt = pastCount + 1;
    const firstShownRp = pastCount - past.length + 1;
    const pastSummary = past
      .map((p, idx) => {
        const i = firstShownRp + idx - 1;
        const s = p.score || {};
        const avg = s.summary
          ? Math.round(Object.values(s.summary).reduce((a, v) => a + (Number(v.score) || 0), 0) / 4)
          : null;
        const issues = (s.ngPoints || []).map((n) => n.title).filter(Boolean).join("／");
        const legacy = s.mainIssue?.title;
        return `RP${i + 1}（平均${avg ?? "?"}点）：改善点＝${issues || legacy || "記録なし"}`;
      })
      .join("\n");

    const system = `
あなたは「キャリアコンサルティング技能検定2級（面接）」の試験官の評価思想を完全に理解し、
受検者を合格に導く指導者AIです。

以下の会話ログを読み、「CC（キャリアコンサルタント＝受検者）」の発話のみを評価してください。
CL（相談者）の発話は評価対象外です。発話は [CC3] [CL3] のように番号付きです。
発話を指す場合は必ずこの番号（例：CC3）を使ってください。

---
【評価区分と採点】
協議会基準の4区分で、各区分を 0〜100 点で採点します。
- basic：基本的態度（受容・共感・自己一致、態度の一貫性、名乗り・導入）
- relation：関係構築力（安心して語れる関係、感情への応答、語りの深まり）
- analysis：問題把握力（要約と仮説、相談者が語る問題とCC視点の問題の両方の把握）
- action：具体的展開力（焦点化、比較軸、行動化、相談者の主体的な意思決定の支援）

点数の目安：
- 75〜100：安定した到達（質を伴い、相談者の理解・整理が進んでいる）
- 60〜74：到達（方向性が正しく技能も出ているが、深さ・精度に余地）
- 50〜59：惜しい未達（方向性は正しいが、仮説が浅い／比較が形式的／行動化が抽象的）
- 0〜49：明確な未達（表面的対応、助言偏重、質問攻め、整理不足）
result は 60 以上なら「到達」、60 未満なら「所要基準未達」。
会話が極端に短い（CC発話が3回未満）場合は、実施できた範囲だけを評価し、点数は低くてよい。

【発話タグ（perTurn）】
- 学習上意味のあるCC発話だけを選び、最大8件
- tag は good（◎ 良い場面）／caution（△ 注意）／ng（✕ 改善必要）
- label は「◎ プレッシャーへの共感からやりがいの探索へ自然に展開」のように記号＋短い自然文

【良かった点・改善点】
- goodPoints：3〜5件。cc番号・見出し・具体的な解説（なぜ良いか、相談者にどう作用したか）
- ngPoints：2〜4件。priority は high／medium。cc番号・見出し・解説。
  better には「その場面で実際に使える問いかけ例」を相談者に言う口調で1文書く
- 過去の練習記録がある場合、同じ課題が繰り返されていれば必ず「RP◯から継続」「◯回連続」と明記する。
  改善が見られた点も「RP◯では〜だったが今回は〜できた」と明記する

【次の課題（priorities）】
- 次回の練習で取り組む優先課題を3つ、優先順位付きで。label は行動レベル、detail は練習方法まで

【coachHint】
- 指導者から受検者への一言（3〜5文）。今回最も評価できる介入を1つ具体的に挙げ、
  最優先で直す1点を「次回はこの一言を言えれば」という形で示す

【NG（未達に直結）】
形だけ共感／質問攻め／表面課題止まり／仮説ゼロ／焦点化不足／助言の羅列／抽象助言止まり／早すぎる結論・誘導

${isRecording ? `
【録音の評価について】
- この会話は人間同士のロールプレイを録音し文字起こししたものです。言いよどみ・相槌・誤変換が含まれます
- 文字起こしの乱れ自体は減点しない。発話の意図と流れで評価する
` : ""}${hasOral ? `
【口頭試問（oralEval）】
- 口頭試問の記録も評価する。試験官の質問ごとに受検者の回答を grade（○＝十分／△＝不足あり／✕＝不十分）で評価し、
  comment に一言、better に「さらに上を目指す回答例」を受検者の口調で3〜5文書く
- 口頭試問の内容は analysis（問題把握力）の採点にも反映する（試験官がロープレ中の見立てを確認する場だから）
` : ""}${isFreeCase ? `
【caseSummary】
- 相談者が語った状況と主訴を、試験のケース紹介文のように3〜4文で要約する（相談者の年齢・立場・きっかけ・迷いの内容）
` : ""}
【出力ルール】
- 指定されたJSON形式のみを出力。説明文・前置きは一切付けない
- 文章はすべて日本語
`.trim();

    const oralText = hasOral
      ? `\n口頭試問の記録：\n${oral.map((o, i) => `[${o.speaker === "試験官" ? `Q${Math.floor(i / 2) + 1} 試験官` : "受検者"}] ${String(o.text || "")}`).join("\n")}\n`
      : "";

    const user = `
ケース：${caseName || caseId || "不明"}
${caseStatus ? `相談者の状況：${caseStatus}\n` : ""}${caseText ? `相談内容：${caseText}\n` : ""}${Array.isArray(evaluationPoints) && evaluationPoints.length ? `このケースの評価ポイント：\n${evaluationPoints.map((p) => `- ${p}`).join("\n")}\n` : ""}
今回は同じケースの ${attempt} 回目の練習です（RP${attempt}）。
${past.length ? `過去の練習記録：\n${pastSummary}\n` : "過去の練習記録はありません。\n"}
${subjectName ? `受検者（CC役）：${subjectName}\n` : ""}${isRecording ? "形式：人間同士のロールプレイ録音の文字起こし\n" : ""}CC発話数：${ccCount}

会話ログ：
${transcript}
${oralText}
【出力は必ず次のJSONのみ】（前後に文章を付けない）
{${isFreeCase ? `
  "caseSummary": string,` : ""}${hasOral ? `
  "oralEval": [ { "q": string, "grade": "○"|"△"|"✕", "comment": string, "better": string } ],` : ""}
  "summary": {
    "basic":    { "score": number, "result": "到達"|"所要基準未達", "comment": string },
    "relation": { "score": number, "result": "到達"|"所要基準未達", "comment": string },
    "analysis": { "score": number, "result": "到達"|"所要基準未達", "comment": string },
    "action":   { "score": number, "result": "到達"|"所要基準未達", "comment": string }
  },
  "overall": string,
  "perTurn": [ { "cc": number, "tag": "good"|"caution"|"ng", "label": string } ],
  "goodPoints": [ { "cc": number, "title": string, "detail": string } ],
  "ngPoints": [ { "cc": number, "priority": "high"|"medium", "title": string, "detail": string, "better": string } ],
  "priorities": [ { "rank": 1|2|3, "label": string, "detail": string } ],
  "coachHint": string
}
`.trim();

    const completion = await openai.chat.completions.create({
      model: env.OPENAI_MODEL || "gpt-4o-mini",
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    });

    const raw = completion.choices?.[0]?.message?.content ?? "";
    const score = JSON.parse(extractJson(raw));

    if (!score?.summary?.basic || !Array.isArray(score?.perTurn) || !Array.isArray(score?.ngPoints)) {
      return Response.json({ error: "invalid score json from model", raw }, { status: 500, headers: CORS });
    }

    // 点数を整数・0〜100に揃え、到達判定を点数から機械的に決める（AIの表記ゆれを防ぐ）
    for (const key of ["basic", "relation", "analysis", "action"]) {
      const s = score.summary[key] || (score.summary[key] = { score: 0 });
      s.score = Math.max(0, Math.min(100, Math.round(Number(s.score) || 0)));
      s.result = s.score >= 60 ? "到達" : "所要基準未達";
    }
    score.attempt = attempt;
    score.version = 2; // 採点形式のバージョン（1〜9点の旧形式と区別する）
    score.meta = { source, subjectName: String(subjectName || "").slice(0, 50) };
    if (hasOral) {
      score.oral = {
        transcript: oral.map((o) => ({ speaker: o.speaker === "試験官" ? "試験官" : "受検者", text: String(o.text || "") })),
        eval: Array.isArray(score.oralEval) ? score.oralEval : [],
      };
      delete score.oralEval;
    }
    if (isFreeCase && typeof score.caseSummary !== "string") score.caseSummary = "";

    // 採点結果を履歴として保存する（保存に失敗しても採点結果自体は返す）
    let resultId = null;
    const { data: saved, error: saveError } = await auth.supabase
      .from("results")
      .insert({ user_id: auth.user.id, case_id: caseId || "unknown", score, messages })
      .select("id")
      .single();
    if (saveError) console.error("採点結果の保存エラー:", saveError);
    else resultId = saved.id;

    return Response.json({ ...score, resultId }, { headers: CORS });
  } catch (err) {
    console.error(err);
    return Response.json({ error: "evaluate failed" }, { status: 500, headers: CORS });
  }
}
