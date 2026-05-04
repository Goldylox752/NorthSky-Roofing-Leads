"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";

export default function Admin() {
  const [cities, setCities] = useState([]);

  useEffect(() => {
    fetch(process.env.NEXT_PUBLIC_API_URL + "/api/cities")
      .then((r) => r.json())
      .then((d) => setCities(d.cities));
  }, []);

  return (
    <main style={page}>
      <Navbar />

      <h1>Admin Dashboard</h1>

      {cities.map((c) => (
        <div key={c.id} style={card}>
          <h3>{c.city}</h3>
          <p>Status: {c.status}</p>
          <p>Tier: {c.tier}</p>
          <p>Contractors: {c.active_contractors?.length || 0}</p>
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
  padding: 15,
  marginTop: 10,
  borderRadius: 8,
};