"use client";

import { useEffect, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function Dashboard() {
  const [data, setData] = useState([]);

  useEffect(() => {
    fetch(`${API_URL}/api/leads?contractorId=me`)
      .then((r) => r.json())
      .then((d) => setData(d.leads || []));
  }, []);

  const revenue = data.reduce((sum, l) => sum + (l.price || 0), 0);

  return (
    <main style={styles.page}>
      <h1>Contractor Dashboard</h1>

      <div style={styles.stats}>
        <div>Leads: {data.length}</div>
        <div>Revenue: ${revenue / 100}</div>
      </div>

      <div style={styles.list}>
        {data.map((l) => (
          <div key={l.id} style={styles.card}>
            <p>{l.city}</p>
            <p>Status: {l.status}</p>
            <p>Value: ${l.price / 100}</p>
          </div>
        ))}
      </div>
    </main>
  );
}

const styles = {
  page: { padding: 40, background: "#0b1220", color: "white" },
  stats: { display: "flex", gap: 20 },
  list: { marginTop: 20 },
  card: {
    padding: 15,
    background: "#111827",
    marginBottom: 10,
    borderRadius: 8,
  },
};