await supabase
  .from("leads")
  .update({
    status: "assigned",

    assigned_contractor_id: contractor.id,

    final_price: pricing.finalPrice,      // 🔥 LOCKED HERE
    price_locked_at: new Date().toISOString(),

    lock_owner: contractor.id,
    locked_at: new Date().toISOString(),
  })
  .eq("id", lead.id)
  .eq("status", "new");