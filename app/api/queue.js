"use client";

import { createClient } from "@supabase/supabase-js";

// ===============================
// INIT (SAFE)
// ===============================
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let supabase = null;

if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
} else {
  console.warn("⚠️ Supabase env vars missing");
}

// ===============================
// LOAD INITIAL QUEUE
// ===============================
export async function loadInitialQueue(org_id) {
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from("leads")
      .select("*")
      .eq("org_id", org_id)
      .eq("status", "new")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Queue load error:", error.message);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error("Queue crash:", err);
    return [];
  }
}

// ===============================
// REALTIME SUBSCRIBE
// ===============================
export function subscribeToQueue(org_id, callback) {
  if (!supabase) return null;

  const channel = supabase.channel(`queue_updates_${org_id}`);

  channel
    .on("broadcast", { event: "lead_assigned" }, (payload) => {
      if (payload?.payload?.org_id === org_id) {
        callback(payload.payload);
      }
    })
    .on("broadcast", { event: "lead_updated" }, (payload) => {
      if (payload?.payload?.org_id === org_id) {
        callback(payload.payload);
      }
    })
    .subscribe();

  return channel;
}

// ===============================
// CLEANUP
// ===============================
export function unsubscribeQueue(channel) {
  if (supabase && channel) {
    supabase.removeChannel(channel);
  }
}