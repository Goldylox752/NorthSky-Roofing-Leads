import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET(req) {
  const { data, error } = await supabaseAdmin.auth.getUser();

  if (error) {
    return Response.json({ error: error.message }, { status: 401 });
  }

  return Response.json({ user: data.user });
}
