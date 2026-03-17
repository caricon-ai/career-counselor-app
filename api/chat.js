import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req, res) {
  // CORS設定
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

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
}
