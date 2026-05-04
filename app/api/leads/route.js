import { supabase } from "@/lib/supabase";

export const runtime = "nodejs";

// ===============================
// GET LEADS (ADMIN + SaaS READY)
// Supports pagination, filters, scoring, revenue tracking
// ===============================
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);

    const page = Math.max(parseInt(searchParams.get("page") || "1"), 1);
    const limit = Math.min(
      Math.max(parseInt(searchParams.get("limit") || "20"), 1),
      100
    );

    const status = searchParams.get("status");
    const city = searchParams.get("city");
    const minScore = searchParams.get("minScore");
    const contractorId = searchParams.get("contractorId");

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase
      .from("leads")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to);

    // ===============================
    // FILTERS
    // ===============================
    if (status) {
      query = query.eq("status", status);
    }

    if (city) {
      query = query.eq("city", city);
    }

    if (contractorId) {
      query = query.eq("assigned_contractor_id", contractorId);
    }

    if (minScore) {
      query = query.gte("score", parseInt(minScore));
    }

    const { data, error, count } = await query;

    if (error) {
      return Response.json(
        {
          success: false,
          error: error.message,
        },
        { status: 500 }
      );
    }

    const total = count || 0;

    return Response.json({
      success: true,
      leads: data ?? [],
      stats: {
        total,
        returned: data?.length ?? 0,
      },
      pagination: {
        page,
        limit,
        total,
        hasMore: from + limit < total,
      },
    });
  } catch (err) {
    return Response.json(
      {
        success: false,
        error: "Unexpected server error",
      },
      { status: 500 }
    );
  }
}