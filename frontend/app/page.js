"use client";

import { createClient } from "@supabase/supabase-js";

// ===============================
// INIT (SAFE + SINGLETON)
// ===============================
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// prevent multiple clients in dev/hot reload
let supabase = globalThis.__supabase;

if (!supabase && supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
  globalThis.__supabase = supabase;
}

if (!supabase) {
  console.warn("⚠️ Supabase not initialized (missing env vars)");
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

    return data ?? [];
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
      const data = payload?.payload;
      if (data?.org_id === org_id) callback(data);
    })
    .on("broadcast", { event: "lead_updated" }, (payload) => {
      const data = payload?.payload;
      if (data?.org_id === org_id) callback(data);
    })
    .subscribe();

  return channel;
}

// ===============================
// CLEANUP
// ===============================
export function unsubscribeQueue(channel) {
  if (!supabase || !channel) return;
  supabase.removeChannel(channel);
}