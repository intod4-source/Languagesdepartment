import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  const url = Deno.env.get("SUPABASE_URL")!;
  const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const authorization = req.headers.get("Authorization") || "";
  if (!authorization.startsWith("Bearer ")) return json({ error: "Authentication required" }, 401);

  const callerResponse = await fetch(`${url}/auth/v1/user`, { headers: { Authorization: authorization, apikey: service } });
  if (!callerResponse.ok) return json({ error: "Invalid session" }, 401);
  const caller = await callerResponse.json();
  const profileResponse = await fetch(`${url}/rest/v1/language_app_users?user_id=eq.${encodeURIComponent(caller.id)}&select=role,status,permissions`, {
    headers: { Authorization: `Bearer ${service}`, apikey: service },
  });
  const profiles = profileResponse.ok ? await profileResponse.json() : [];
  const profile = profiles[0];
  if (!profile || profile.status !== "active" || (profile.role !== "super_admin" && profile.permissions?.manage_users !== true)) {
    return json({ error: "Only an authorized administrator can create accounts" }, 403);
  }

  let input: Record<string, unknown>;
  try { input = await req.json(); } catch { return json({ error: "Invalid request" }, 400); }
  const email = String(input.email || "").trim().toLowerCase();
  const password = String(input.password || "");
  const fullName = String(input.full_name || "").trim();
  const role = String(input.role || "user");
  const languageCodes = [...new Set((Array.isArray(input.language_codes) ? input.language_codes : []).map(x => String(x).trim().toLowerCase()).filter(Boolean))];
  if (!/^\S+@\S+\.\S+$/.test(email)) return json({ error: "Enter a valid email address" }, 400);
  if (password.length < 8) return json({ error: "Password must contain at least 8 characters" }, 400);
  if (!fullName) return json({ error: "Full name is required" }, 400);
  if (!["admin", "manager", "user"].includes(role)) return json({ error: "Invalid role" }, 400);
  if (!languageCodes.length) return json({ error: "Select at least one language" }, 400);

  const createResponse = await fetch(`${url}/auth/v1/admin/users`, {
    method: "POST",
    headers: { Authorization: `Bearer ${service}`, apikey: service, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, email_confirm: true, user_metadata: { full_name: fullName } }),
  });
  const created = await createResponse.json();
  if (!createResponse.ok) return json({ error: created.msg || created.message || "Account could not be created" }, createResponse.status);

  const profileWrite = await fetch(`${url}/rest/v1/language_app_users?on_conflict=user_id`, {
    method: "POST",
    headers: { Authorization: `Bearer ${service}`, apikey: service, "Content-Type": "application/json", Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify({ user_id: created.id, email, full_name: fullName, role, status: "active", language_codes: languageCodes, approved_by: caller.id, approved_at: new Date().toISOString() }),
  });
  if (!profileWrite.ok) {
    await fetch(`${url}/auth/v1/admin/users/${created.id}`, { method: "DELETE", headers: { Authorization: `Bearer ${service}`, apikey: service } });
    return json({ error: "Profile could not be created" }, 500);
  }
  return json({ success: true, user_id: created.id, email, role, language_codes: languageCodes });
});
