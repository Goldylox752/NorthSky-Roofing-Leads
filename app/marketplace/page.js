"use client";

import { useEffect, useState } from "react";

export default function Marketplace() {
  const [cities, setCities] = useState([]);

  useEffect(() => {
    fetch(process.env.NEXT_PUBLIC_API_URL + "/api/cities")
      .then((r) => r.json())
      .then((d) => setCities(d.cities || []));
  }, []);

  return (
    <div>
      <h1>🏙 City Marketplace</h1>

      <div style={styles.grid}>
        {cities.map((c) => (
          <div key={c.city} style={styles.card}>
            <h3>{c.city}</h3>
            <p>Tier: {c.tier}</p>
            <p>Status: {c.status}</p>
            <p>
              Contractors: {c.active_contractors?.length || 0}/
              {c.max_contractors}
            </p>

            <button style={styles.button}>Buy City</button>
          </div>
        ))}
      </div>
    </div>
  );
}

const styles = {
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
    gap: 12,
    marginTop: 20,
  },
  card: {
    background: "#111827",
    padding: 15,
    borderRadius: 10,
  },
  button: {
    marginTop: 10,
    padding: 10,
    width: "100%",
    background: "#3b82f6",
    border: "none",
    color: "white",
    borderRadius: 6,
  },
};