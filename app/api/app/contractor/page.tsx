"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function ContractorDashboard() {
  const contractorId = "demo-contractor"; // replace with auth

  const [leads, setLeads] = useState([]);

  // ===============================
  // LOAD ASSIGNED LEADS
  // ===============================
  const load = async () => {
    const { data } = await supabase
      .from("leads")
      .select("*")
      .eq("assigned_contractor_id", contractorId)
      .order("created_at", { ascending: false });

    setLeads(data || []);
  };

  // ===============================
  // REALTIME UPDATES
  // ===============================
  useEffect(() => {
    load();

    const channel = supabase
      .channel("contractor-leads")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "leads",
          filter: `assigned_contractor_id=eq.${contractorId}`,
        },
        (payload) => {
          const row = payload.new;
          if (!row) return;

          setLeads((prev) => {
            const exists = prev.find((l) => l.id === row.id);

            if (exists) {
              return prev.map((l) =>
                l.id === row.id ? row : l
              );
            }

            return [row, ...prev];
          });
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  return (
    <main style={{ padding: 40, color: "white", background: "#0b1220" }}>
      <h1>Contractor Portal</h1>

      {leads.map((l) => (
        <div key={l.id} style={card}>
          <p>📍 {l.city}</p>
          <p>⚡ {l.status}</p>
          <p>💰 ${(l.price || 0) / 100}</p>

          <button
            onClick={async () => {
              await fetch("/api/leads/claim", {
                method: "POST",
                body: JSON.stringify({
                  leadId: l.id,
                  contractorId,
                }),
              });

              load();
            }}
          >
            Claim Lead
          </button>
        </div>
      ))}
    </main>
  );
}

const card = {
  background: "#111827",
  padding: 12,
  marginTop: 10,
  borderRadius: 8,
};