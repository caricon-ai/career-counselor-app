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
          'Access-Control-Allow-Headers': 'Content-Type',
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
};
