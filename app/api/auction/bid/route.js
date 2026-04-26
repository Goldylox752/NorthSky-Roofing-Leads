import { createClient } from "@supabase/supabase-js";
import { getHighestBid } from "@/lib/auctionEngine";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
  const { auction_id, user_id, bid_amount } = await req.json();

  const highest = await getHighestBid(auction_id);

  if (highest && bid_amount <= highest.bid_amount) {
    return Response.json(
      { error: "Bid must be higher than current highest" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("bids")
    .insert([
      {
        auction_id,
        user_id,
        bid_amount,
        created_at: new Date().toISOString(),
      },
    ])
    .select()
    .single();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ success: true, bid: data });
}