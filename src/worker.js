import { onRequestPost as chatPost } from '../functions/api/chat.js';
import { onRequestPost as evaluatePost } from '../functions/api/evaluate.js';
import { onRequestPost as checkoutPost } from '../functions/api/create-checkout-session.js';
import { onRequestPost as webhookPost } from '../functions/api/stripe-webhook.js';
import { onRequestPost as portalPost } from '../functions/api/create-portal-session.js';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    // CORSプリフライト対応
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
    }

    // APIリクエストのルーティング
    if (path.startsWith('/api/')) {
      const context = { request, env, ctx };
      switch (path) {
        case '/api/chat':
          return chatPost(context);
        case '/api/evaluate':
          return evaluatePost(context);
        case '/api/create-checkout-session':
          return checkoutPost(context);
        case '/api/stripe-webhook':
          return webhookPost(context);
        case '/api/create-portal-session':
          return portalPost(context);
        default:
          return new Response('API not found', { status: 404 });
      }
    }

    // それ以外は静的ファイルを返す
    return env.ASSETS.fetch(request);
  },

  // 定期実行：Supabase無料枠が「1週間アクセスなし」で停止するのを防ぐために軽くアクセスする
  async scheduled(_event, env, ctx) {
    const ping = fetch(`${env.SUPABASE_URL}/rest/v1/profiles?select=id&limit=1`, {
      headers: {
        apikey: env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
    }).then((res) => console.log(`Supabase keep-alive: HTTP ${res.status}`));
    ctx.waitUntil(ping);
  },
};
