import { supabase } from "@/lib/supabase";
import { geoEngine } from "@/lib/geoEngine";

export const runtime = "nodejs";

// CREATE LEAD
export async function POST(req) {
  try {
    const body = await req.json();

    const { name, email, phone, city = "", zip = "", source = "website" } = body;

    if (!phone) {
      return Response.json({ error: "Phone required" }, { status: 400 });
    }

    // 🧠 scoring
    let lead_score = 0;
    if (email) lead_score += 40;
    if (phone) lead_score += 30;
    if (zip) lead_score += 30;

    const { region, priority } = geoEngine({ city, zip, lead_score });

    const { data, error } = await supabase
      .from("leads")
      .insert([
        {
          name,
          email,
          phone,
          city,
          zip,
          source,
          lead_score,
          status: "new",
          geo_region: region,
          priority,
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ success: true, lead: data });

  } catch (err) {
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}

// GET ALL LEADS (Admin OS)
export async function GET() {
  const { data, error } = await supabase
    .from("leads")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ leads: data });
}