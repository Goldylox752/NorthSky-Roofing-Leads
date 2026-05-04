"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";

export default function Dashboard() {
  const [leads, setLeads] = useState([]);

  useEffect(() => {
    const eventSource = new EventSource(
      process.env.NEXT_PUBLIC_API_URL + "/api/leads/stream"
    );

    eventSource.onmessage = (event) => {
      setLeads(JSON.parse(event.data));
    };

    return () => eventSource.close();
  }, []);

  return (
    <main style={{ background: "#0b1220", minHeight: "100vh", color: "white" }}>
      <Navbar />

      <div style={{ padding: 40 }}>
        <h1>Live Lead Feed</h1>

        {leads.map((l) => (
          <div key={l.id} style={card}>
            <p>📍 {l.city}</p>
            <p>⚡ Status: {l.status}</p>
            <p>💰 Score: {l.score}</p>
            <p>🧠 Assigned: {l.assigned_contractor_id || "pending"}</p>
          </div>
        ))}
      </div>
    </main>
  );
}

const card = {
  background: "#111827",
  padding: 12,
  marginTop: 10,
  borderRadius: 8,
};