"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function AdminPanel() {
  const [leads, setLeads] = useState([]);
  const [revenue, setRevenue] = useState(0);

  // ===============================
  // LOAD ALL LEADS (GLOBAL VIEW)
  // ===============================
  const load = async () => {
    const { data } = await supabase
      .from("leads")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    setLeads(data || []);

    // revenue calc (basic)
    const total = (data || []).reduce(
      (sum, l) => sum + (l.price || 0),
      0
    );

    setRevenue(total);
  };

  // ===============================
  // REALTIME ADMIN STREAM
  // ===============================
  useEffect(() => {
    load();

    const channel = supabase
      .channel("admin-leads")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "leads",
        },
        () => {
          load();
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  return (
    <main style={styles.page}>
      <h1>Admin Control Center</h1>

      {/* REVENUE DASH */}
      <div style={styles.card}>
        <h2>Revenue</h2>
        <p>${(revenue / 100).toFixed(2)}</p>
      </div>

      {/* LEADS TABLE */}
      {leads.map((l) => (
        <div key={l.id} style={styles.card}>
          <p>📍 {l.city}</p>
          <p>⚡ {l.status}</p>
          <p>💰 ${(l.price || 0) / 100}</p>
          <p>🧠 {l.assigned_contractor_id || "unassigned"}</p>

          <div style={{ display: "flex", gap: 10 }}>
            {/* FORCE UNLOCK */}
            <button
              onClick={async () => {
                await supabase
                  .from("leads")
                  .update({
                    status: "new",
                    assigned_contractor_id: null,
                    lock_owner: null,
                  })
                  .eq("id", l.id);

                load();
              }}
            >
              Unlock
            </button>

            {/* FORCE ASSIGN */}
            <button
              onClick={async () => {
                const contractor = prompt("Contractor ID");

                await supabase
                  .from("leads")
                  .update({
                    status: "assigned",
                    assigned_contractor_id: contractor,
                  })
                  .eq("id", l.id);

                load();
              }}
            >
              Assign
            </button>
          </div>
        </div>
      ))}
    </main>
  );
}

const styles = {
  page: {
    background: "#0b1220",
    color: "white",
    minHeight: "100vh",
    padding: 40,
  },
  card: {
    background: "#111827",
    padding: 12,
    marginTop: 10,
    borderRadius: 8,
  },
};