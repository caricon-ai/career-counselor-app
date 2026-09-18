import { createClient } from "@supabase/supabase-js";

// ビルド環境（Cloudflareの自動ビルド等）で「VITE_SUPABASE_ANON_KEY=sb_...」のように
// 変数名ごと値に入ってしまった場合でも動くように、先頭の「NAME=」を取り除く
const clean = (value) => String(value || "").replace(/^\s*VITE_[A-Z0-9_]+=/, "").trim();

const supabaseUrl = clean(import.meta.env.VITE_SUPABASE_URL);
const supabaseAnonKey = clean(import.meta.env.VITE_SUPABASE_ANON_KEY);

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
