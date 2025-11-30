import Anthropic from '@anthropic-ai/sdk';

export default async function handler(req, res) {
  // CORSヘッダーを追加（すべてのオリジンからのアクセスを許可）
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // OPTIONSリクエスト（プリフライト）に対応
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // POSTメソッドのみ許可
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Anthropic クライアントを初期化
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY, // 環境変数から取得
    });

    // リクエストボディから必要な情報を取得
    const { messages, max_tokens } = req.body;

    // バリデーション
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Invalid messages format' });
    }

    // Anthropic APIを呼び出し
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: max_tokens || 1000,
      messages: messages,
    });

    // 成功レスポンスを返す
    return res.status(200).json(response);
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ 
      error: error.message || 'Internal server error' 
    });
  }
}