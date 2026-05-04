import { supabase } from "@/lib/supabase";

export const runtime = "nodejs";

// ===============================
// GET LEADS (ADMIN DASHBOARD)
// Supports: pagination, filtering, sorting
// ===============================
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);

    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);

    const status = searchParams.get("status"); // optional filter
    const city = searchParams.get("city"); // optional filter

    const offset = (page - 1) * limit;

    let query = supabase
      .from("leads")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    // filters
    if (status) {
      query = query.eq("status", status);
    }

    if (city) {
      query = query.eq("city", city);
    }

    const { data, error, count } = await query;

    if (error) {
      return Response.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return Response.json({
      success: true,
      leads: data,
      pagination: {
        page,
        limit,
        total: count,
        hasMore: offset + limit < count,
      },
    });
  } catch (err) {
    return Response.json(
      { success: false, error: "Server error" },
      { status: 500 }
    );
  }
}