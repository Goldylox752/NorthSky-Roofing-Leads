import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// 🔥 Get highest bid
export async function getHighestBid(auction_id) {
  const { data } = await supabase
    .from("bids")
    .select("*")
    .eq("auction_id", auction_id)
    .order("bid_amount", { ascending: false })
    .limit(1);

  return data?.[0] || null;
}

// 🔒 Close auction + pick winner
export async function closeAuction(auction_id) {
  const winner = await getHighestBid(auction_id);

  if (!winner) {
    return { error: "No bids found" };
  }

  await supabase
    .from("auction_leads")
    .update({ status: "closed" })
    .eq("id", auction_id);

  return { winner };
}