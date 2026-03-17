// server.js
import express from "express";
import cors from "cors";
import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ===============================
// 相談者ロールプレイ（あなたが既に持っている想定）
// ===============================
app.post("/api/chat", async (req, res) => {
  try {
    const { messages, caseDisplayName } = req.body;

    if (!Array.isArray(messages)) {
      return res.status(400).json({ error: "messages must be an array" });
    }

    const systemPrompt = `
あなたは「キャリアコンサルティング技能検定2級 実技（面接）」の相談者です。
相談者名は「${caseDisplayName || "相談者"}」です。

あなたはキャリアコンサルタントではありません。
助言・整理・評価・解説・理論的まとめは一切しません。

【あなたの基本姿勢】
・自分なりに困っている
・しかし、何が本当の問題かは分かっていない
・キャリアコンサルティング視点の課題には気づいていない
・考えが整理されていない状態で話している

【話し方のルール（重要）】
・自分から長く説明しすぎない
・聞かれたことに対して、1〜2文程度で答える
・迷い、感情、言葉の揺れを含めて話す
・結論を断定しない
・「どうすればいいか」は自分では言わない

【内容のルール】
・表面的な困りごとは語ってよい
・気持ちや違和感は語ってよい
・価値観・判断軸は曖昧なままでよい
・「本当は〇〇が問題だと思う」とは言わない

【禁止事項】
・自分で話を整理すること
・「私の課題は〜だと思います」と言うこと
・キャリア理論・正解っぽい言い回し
・試験対策的な発言
・一人で気づきを完結させること

あなたは
「話すことで少し楽になるが、整理はできていない相談者」
として、自然な会話を続けてください。
`.trim();

    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      temperature: 0.8,
      messages: [
        { role: "system", content: systemPrompt },
        ...messages,
      ],
    });

    const content = completion.choices?.[0]?.message?.content ?? "";
    return res.json({ content });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "chat failed" });
  }
});

// ===============================
// 本番：AI採点（Result.jsx が要求する score を返す）
// ===============================
app.post("/api/evaluate", async (req, res) => {
  try {
    const { messages, caseId } = req.body;

    if (!Array.isArray(messages)) {
      return res.status(400).json({ error: "messages must be an array" });
    }

    // あなたの実装では：
    // - m.role !== "user" を「相談者」として表示
    // - m.role === "user" を「あなた（CC）」として採点している
    // なので採点対象は role === "user"（あなたの発話）
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
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      temperature: 0.2,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    });

    const raw = completion.choices?.[0]?.message?.content ?? "";
    const jsonText = extractJson(raw);
    const score = JSON.parse(jsonText);

    // 最低限の形チェック（壊れたら500）
    if (!score?.summary?.basic || !score?.mainIssue || !score?.evaluations) {
      return res.status(500).json({ error: "invalid score json from model", raw });
    }

    return res.json(score);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "evaluate failed" });
  }
});

// ---------- JSON抽出ヘルパ ----------
function extractJson(text) {
  // ```json ... ``` 形式を剥がす
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fenced?.[1]) return fenced[1];

  // 最初の { から最後の } までを抜く
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end > start) return text.slice(start, end + 1);

  // ダメならそのまま
  return text;
}

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`API server listening on ${port}`));
