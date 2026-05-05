import { supabase } from "@/lib/supabase";
import { lockLeadPrice } from "./lockLeadPrice";
import { routeLead } from "./routeLead";

export async function assignLead({
  lead,
  contractors,
  cityRow,
  systemMetrics,
}) {
  const contractor = routeLead(lead, contractors);

  if (!contractor) return null;

  const price = lockLeadPrice({
    lead,
    contractor,
    cityRow,
    systemMetrics,
  });

  const { data, error } = await supabase
    .from("leads")
    .update({
      status: "assigned",
      assigned_contractor_id: contractor.id,

      final_price: price.final_price,
      price_locked_at: price.price_locked_at,
    })
    .eq("id", lead.id)
    .eq("status", "processing")
    .select()
    .single();

  if (error) throw error;

  return {
    lead: data,
    contractor,
    price: price.final_price,
  };
}