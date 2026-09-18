import { supabase } from "./supabase";

// ログイン中のアクセストークンを付けてAPIにPOSTする
export async function apiPost(path, body) {
  const { data: { session } } = await supabase.auth.getSession();
  const headers = { "Content-Type": "application/json" };
  if (session?.access_token) {
    headers.Authorization = `Bearer ${session.access_token}`;
  }
  return fetch(path, { method: "POST", headers, body: JSON.stringify(body) });
}

// ログイン中のアクセストークンを付けてファイル（音声など）をAPIにPOSTする
export async function apiUpload(path, formData) {
  const { data: { session } } = await supabase.auth.getSession();
  const headers = {};
  if (session?.access_token) {
    headers.Authorization = `Bearer ${session.access_token}`;
  }
  return fetch(path, { method: "POST", headers, body: formData });
}
