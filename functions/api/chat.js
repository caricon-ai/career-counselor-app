import OpenAI from "openai";
import { CORS, requireSubscriber } from "./_auth.js";

// ブラウザの事前確認リクエスト（OPTIONSメソッド）への応答
export async function onRequestOptions() {
  return new Response(null, { status: 200, headers: CORS });
}

// チャットAPIの本体（POSTリクエストを処理）
export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const auth = await requireSubscriber(request, env);
    if (auth.error) return auth.error;

    const { messages, caseDisplayName, caseStatus, caseText } = await request.json();

    if (!Array.isArray(messages)) {
      return Response.json({ error: "messages must be an array" }, { status: 400, headers: CORS });
    }

    const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });

    const background = [
      caseStatus ? `【あなたの状況】\n${caseStatus}` : "",
      caseText ? `【あなたが相談したいこと】\n${caseText}` : "",
    ].filter(Boolean).join("\n\n");

    const clientName = caseDisplayName || "相談者";
    const systemPrompt = `
これは「キャリアコンサルティング技能検定2級 実技（面接）」のロールプレイです。

【役割】
・あなた＝相談者「${clientName}」本人。悩みを抱えて相談に来た側です
・会話相手（userの発言）＝キャリアコンサルタント。面談を進め、あなたに質問する側です
・あなたは一人称（私）で話します。自分の名前を「${clientName.replace(/（.*$/, "")}さん」と三人称で呼ぶことは絶対にありません
・あなたは相手に質問して面談を進める側ではありません。相手の気持ちや状況を尋ねてはいけません
  （NG例：「どのようなお気持ちですか？」「お話をお聞かせください」「今日はどうされましたか？」）
・挨拶や名乗りをされたら、相談者として自然に返し（例：「よろしくお願いします。」）、その後は聞かれたことに答えます

${background || "（背景情報なし）"}

【背景の扱い】
・上の状況・相談内容は「あなた自身の事実」です。聞かれたら、これに沿って具体的に答えてください
・上に書かれていない細部（職場の様子、家族の言葉、日々の出来事など）を聞かれたら、
  上の状況と矛盾しない範囲で自然に補って答え、一度話した内容はその後も一貫させてください
・相談内容に書かれていることを、聞かれる前に自分から全部説明しないでください

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
      model: env.OPENAI_MODEL || "gpt-4o-mini",
      temperature: 0.8,
      messages: [
        { role: "system", content: systemPrompt },
        ...messages,
        // 会話が長くなっても役割を忘れないよう、毎回最後に念押しする
        { role: "system", content: `あなたは相談者「${clientName}」本人です。相手はキャリアコンサルタントです。相手に質問で返さず、相談者として1〜2文で答えてください。` },
      ],
    });

    const content = completion.choices?.[0]?.message?.content ?? "";
    return Response.json({ content }, { headers: CORS });
  } catch (err) {
    console.error(err);
    return Response.json({ error: "chat failed" }, { status: 500, headers: CORS });
  }
}
