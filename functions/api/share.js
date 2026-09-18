import { createClient } from "@supabase/supabase-js";
import { CORS, requireUser } from "./_auth.js";

export async function onRequestOptions() {
  return new Response(null, { status: 200, headers: CORS });
}

// GET /api/share?token=xxx ：共有トークンで採点結果を返す（ログイン不要・読み取り専用）
export async function onRequestGet(context) {
  const { request, env } = context;
  try {
    const token = new URL(request.url).searchParams.get("token") || "";
    if (!/^[0-9a-f-]{20,}$/i.test(token)) {
      return Response.json({ error: "invalid token" }, { status: 400, headers: CORS });
    }
    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
    const { data, error } = await supabase
      .from("results")
      .select("case_id, score, messages, created_at")
      .eq("share_token", token)
      .maybeSingle();
    if (error || !data) {
      return Response.json({ error: "not found" }, { status: 404, headers: CORS });
    }
    return Response.json(data, { headers: CORS });
  } catch (err) {
    console.error("share get error:", err);
    return Response.json({ error: "share failed" }, { status: 500, headers: CORS });
  }
}

// POST /api/share { resultId } ：自分の採点結果に共有トークンを発行する
export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    const auth = await requireUser(request, env);
    if (auth.error) return auth.error;

    const { resultId } = await request.json();
    if (!resultId) return Response.json({ error: "resultId is required" }, { status: 400, headers: CORS });

    const { data: row } = await auth.supabase
      .from("results")
      .select("id, share_token")
      .eq("id", resultId)
      .eq("user_id", auth.user.id)
      .maybeSingle();
    if (!row) return Response.json({ error: "not found" }, { status: 404, headers: CORS });

    if (row.share_token) return Response.json({ token: row.share_token }, { headers: CORS });

    const token = crypto.randomUUID();
    const { error } = await auth.supabase.from("results").update({ share_token: token }).eq("id", resultId);
    if (error) throw error;
    return Response.json({ token }, { headers: CORS });
  } catch (err) {
    console.error("share post error:", err);
    return Response.json({ error: "share failed" }, { status: 500, headers: CORS });
  }
}
