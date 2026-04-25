import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
  try {
    const body = await req.json();

    const {
      name,
      phone,
      email,
      city,
      monthly_jobs,
      lead_spend,
      team_size
    } = body;

    let qualified = true;

    if (monthly_jobs === "0–5") qualified = false;
    if (lead_spend === "$0") qualified = false;

    const { error } = await supabase.from("applications").insert([
      {
        name,
        phone,
        email,
        city,
        monthly_jobs,
        lead_spend,
        team_size,
        qualified,
        created_at: new Date().toISOString()
      }
    ]);

    if (error) {
      return NextResponse.json({ error: "DB error" }, { status: 500 });
    }

    return NextResponse.json({ qualified });

  } catch (err) {
    return NextResponse.json({ error: "server error" }, { status: 500 });
  }
}
