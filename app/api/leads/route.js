import { calculateLeadValue } from "@/lib/pricingEngine";

export async function POST(req) {
  try {
    const { phone, score = 5, cityTier = "basic" } =
      await req.json();

    if (!phone) {
      return Response.json(
        { error: "Missing phone" },
        { status: 400 }
      );
    }

    const leadValue = calculateLeadValue(score, cityTier);

    return Response.json({
      success: true,
      leadValue,
      tier: cityTier,
    });
  } catch (err) {
    return Response.json(
      { error: "Lead engine error" },
      { status: 500 }
    );
  }
}