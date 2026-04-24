import OpenAI from "openai";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

// JSONテキストを抽出する（AIがコードブロックで囲んで返した場合にも対応）
function extractJson(text) {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fenced?.[1]) return fenced[1];
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end > start) return text.slice(start, end + 1);
  return text;
}

export async function onRequestOptions() {
  return new Response(null, { status: 200, headers: CORS });
}

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const { messages, caseId } = await request.json();

    if (!Array.isArray(messages)) {
      return Response.json({ error: "messages must be an array" }, { status: 400, headers: CORS });
    }

    const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });

    const transcript = messages
      .map((m, i) => {
        const speaker = m.role === "user" ? "あなた(CC)" : "相談者(CL)";
        return `${i}. ${speaker}: ${String(m.content || "")}`;
      })
      .join("\n");

    const system = `
あなたは「キャリアコンサルティング技能検定2級（面接）」の
試験官の評価思想を完全に理解している指導者AIです。

以下の会話ログを読み、
「あなた(CC)」の発話のみを評価してください。
※「相談者(CL)」の発話は評価対象外です。

評価は、協議会基準に基づく次の4区分で行います。

- basic：基本的態度
- relation：関係構築力
- analysis：問題把握力
- action：具体的展開力

---

【このAIの立場】

- 試験官の評価基準を忠実に用いる
- ただし結果は「指導者」として返す
- なぜA／B／Cなのか、次に何を直せばよいかを明確に示す

---

【点数と判定】

- score は 1〜9 の整数（10は絶対に使わない）
- 7・8：A評価（到達・合格圏）
- 5：B評価（惜しい未達）
- 3・4：C評価（明確な未達）
- 6は絶対に使用しない（禁止）。6を出力した場合は採点ミスとみなす

result は必ず
「到達」または「所要基準未達」で示すこと。

---

【三段構え評価テンプレ（最重要）】

■ A評価（到達）
- 評価項目が質を伴って満たされている
- 相談者の理解・整理・意思決定が進んでいる

コメント方針：
① 水準の高さを明確に伝える
② なぜ合格圏かを説明する
③ 試験官視点で「合格可能性が高い」と言及する
④ さらに伸ばす行動を2〜3個示す

---

■ B評価（惜しい未達）
- 面接の方向性は正しい
- 共感・質問・要約などの技能は出ている
- ただし次のいずれかが不足している

  ・仮説（見立て）が浅い
  ・比較が形式的
  ・行動化が抽象的
  ・焦点化が遅く時間切れ

コメント方針：
① 方向性が適切だったことを最初に伝える
② mainIssue に該当する弱点を具体的に示す
③ 「ここが改善されていればAだった」と明言する
④ 次にやる行動を2〜3個、行動レベルで示す

---

■ C評価（明確な未達）
- 必須観点が十分に満たされていない
- 表面的対応、助言偏重、整理不足が目立つ

コメント方針：
① 事実として基準未達であることを伝える
② 何が足りなかったかを具体的に示す
③ 試験官視点で「合格水準に届かない」と明言する
④ 基本的な改善行動を2〜3個示す

---

【各評価区分の判断基準】

◆ basic（基本的態度）
- A：共感・受容が自然で一貫している
- B：態度は良いが感情への踏み込みが浅い
- C：否定・誘導・結論急ぎが見られる

◆ relation（関係構築力）
- A：語りが深まり感情や背景が出ている
- B：関係は成立しているが深化が不足
- C：質問攻め・詰問になっている

◆ analysis（問題把握力）
- A：要約と仮説があり核心に迫っている
- B：整理はあるが見立てが弱い
- C：表面課題止まり・概念語ラベリング

◆ action（具体的展開力）
- A：比較軸が明確で判断材料が整理されている
- B：方向性はあるが比較・行動が浅い
- C：助言羅列・抽象助言で終わる

---

【逐語（perTurn）の扱い】

- 全発話は評価しない
- 学習上意味のある CC 発話のみを選ぶ
- 1発話につき最大2タグ
- tag.label はUI用の自然文
- grade は A / B / C
- reason は1文で簡潔に

---

【NG（未達に直結）】

- 形だけ共感
- 質問攻め
- 表面課題止まり
- 仮説ゼロ
- 焦点化不足
- 助言の羅列
- 抽象助言止まり
- 早すぎる結論・誘導

---

【出力ルール】

- 指定されたJSON形式のみを出力
- 説明文・前置きは一切付けない
- mainIssue は必ず1つ
- improve は mainIssue の区分のみ 2〜3個
`.trim();

    const user = `
caseId: ${caseId || "unknown"}

会話ログ：
${transcript}

【出力は必ず次のJSONのみ】（前後に文章を付けない）
{
  "summary": {
    "basic":   { "score": number, "result": "到達"|"所要基準未達" },
    "relation":{ "score": number, "result": "到達"|"所要基準未達" },
    "analysis":{ "score": number, "result": "到達"|"所要基準未達" },
    "action":  { "score": number, "result": "到達"|"所要基準未達" }
  },
  "mainIssue": { "key": "basic"|"relation"|"analysis"|"action", "title": string, "reason": string },
  "evaluations": {
    "basic":   { "good": string[], "bad": string[], "improve": string[] },
    "relation":{ "good": string[], "bad": string[], "improve": string[] },
    "analysis":{ "good": string[], "bad": string[], "improve": string[] },
    "action":  { "good": string[], "bad": string[], "improve": string[] }
  },
  "perTurn": [
    {
      "index": number,
      "tags": [
        { "label": string, "grade": "A"|"B"|"C", "reason": string }
      ]
    }
  ]
}
`.trim();

    const completion = await openai.chat.completions.create({
      model: env.OPENAI_MODEL || "gpt-4o-mini",
      temperature: 0.2,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    });

    const raw = completion.choices?.[0]?.message?.content ?? "";
    const jsonText = extractJson(raw);
    const score = JSON.parse(jsonText);

    if (!score?.summary?.basic || !score?.mainIssue || !score?.evaluations) {
      return Response.json({ error: "invalid score json from model", raw }, { status: 500, headers: CORS });
    }

    return Response.json(score, { headers: CORS });
  } catch (err) {
    console.error(err);
    return Response.json({ error: "evaluate failed" }, { status: 500, headers: CORS });
  }
}
