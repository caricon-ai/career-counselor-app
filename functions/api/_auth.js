import { createClient } from "@supabase/supabase-js";

// 常に利用できる運営者のメールアドレス
const OWNER_EMAILS = ["kasane1101@gmail.com"];

export const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

function errorResponse(message, status) {
  return Response.json({ error: message }, { status, headers: CORS });
}

// Authorizationヘッダーのトークンからログイン中のユーザーを特定する
// 戻り値：{ user, supabase } または { error: Response }
export async function requireUser(request, env) {
  const authHeader = request.headers.get("Authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  if (!token) return { error: errorResponse("ログインが必要です", 401) };

  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) return { error: errorResponse("ログイン情報が無効です", 401) };

  return { user: data.user, supabase };
}

// ログイン済みかつ有効なサブスクリプションを持つユーザーのみ通す
export async function requireSubscriber(request, env) {
  const result = await requireUser(request, env);
  if (result.error) return result;

  const { user, supabase } = result;
  if (OWNER_EMAILS.includes(user.email)) return result;

  const { data } = await supabase
    .from("subscriptions")
    .select("status")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (data?.status !== "active") {
    return { error: errorResponse("有効なサブスクリプションがありません", 403) };
  }
  return result;
}
