import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

/**
 * Subscribe to live lead assignments
 */
export function subscribeToQueue(callback) {

  const channel = supabase.channel("queue_updates");

  channel
    .on("broadcast", { event: "lead_assigned" }, (payload) => {
      callback(payload.payload);
    })
    .on("broadcast", { event: "lead_updated" }, (payload) => {
      callback(payload.payload);
    })
    .subscribe();

  return channel;
}