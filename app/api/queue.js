import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing Supabase env vars");
}

const supabase = createClient(supabaseUrl, supabaseKey);

export async function loadInitialQueue(org_id) {
  const { data, error } = await supabase
    .from("leads")
    .select("*")
    .eq("org_id", org_id)
    .eq("status", "new")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Queue load error:", error);
    return [];
  }

  return data || [];
}

export function subscribeToQueue(org_id, callback) {
  const channel = supabase.channel(`queue_updates_${org_id}`);

  channel
    .on("broadcast", { event: "lead_assigned" }, (payload) => {
      if (payload.payload?.org_id === org_id) {
        callback(payload.payload);
      }
    })
    .on("broadcast", { event: "lead_updated" }, (payload) => {
      if (payload.payload?.org_id === org_id) {
        callback(payload.payload);
      }
    })
    .subscribe();

  return channel;
}

export function unsubscribeQueue(channel) {
  if (channel) supabase.removeChannel(channel);
}