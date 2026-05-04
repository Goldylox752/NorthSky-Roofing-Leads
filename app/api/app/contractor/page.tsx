"use client";

import { useEffect, useState } from "react";

export default function Contractor() {
  const [leads, setLeads] = useState([]);

  useEffect(() => {
    fetch(process.env.NEXT_PUBLIC_API_URL + "/api/my-leads")
      .then((r) => r.json())
      .then((d) => setLeads(d.leads));
  }, []);

  return (
    <main style={page}>
      <h1>My Leads</h1>

      {leads.map((l) => (
        <div key={l.id} style={card}>
          <p>{l.city}</p>
          <p>Status: {l.status}</p>
          <p>Score: {l.score}</p>
        </div>
      ))}
    </main>
  );
}

const page = {
  background: "#0b1220",
  color: "white",
  minHeight: "100vh",
  padding: 40,
};

const card = {
  background: "#111827",
  padding: 10,
  marginTop: 10,
  borderRadius: 8,
};