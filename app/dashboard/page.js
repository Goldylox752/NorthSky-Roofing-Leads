"use client";

import { useEffect, useState } from "react";

export default function Dashboard() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadLeads = async () => {
      try {
        setLoading(true);

        const res = await fetch("/api/leads");

        if (!res.ok) {
          throw new Error("Failed to fetch leads");
        }

        const data = await res.json();
        setLeads(data || []);
      } catch (err) {
        setError("Unable to load leads. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    loadLeads();
  }, []);

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>RoofFlow Dashboard</h1>

      <p style={styles.subtext}>
        Real-time lead pipeline overview
      </p>

      <h3 style={styles.sectionTitle}>Active Leads</h3>

      {/* LOADING STATE */}
      {loading && <p style={styles.text}>Loading leads...</p>}

      {/* ERROR STATE */}
      {error && <p style={styles.error}>{error}</p>}

      {/* EMPTY STATE */}
      {!loading && leads.length === 0 && (
        <p style={styles.text}>No leads yet.</p>
      )}

      {/* LEADS LIST */}
      {leads.map((l) => (
        <div key={l.id} style={styles.card}>
          <b>{l.email}</b>

          <p style={styles.meta}>
            Status: {l.status || "unknown"} | Stage: {l.stage || "new"}
          </p>
        </div>
      ))}
    </div>
  );
}

const styles = {
  container: {
    padding: 40,
    fontFamily: "Arial",
    background: "#0b1220",
    minHeight: "100vh",
    color: "white",
  },

  title: {
    fontSize: 28,
    marginBottom: 5,
  },

  subtext: {
    fontSize: 13,
    opacity: 0.7,
    marginBottom: 20,
  },

  sectionTitle: {
    marginTop: 20,
    marginBottom: 10,
  },

  text: {
    opacity: 0.7,
  },

  error: {
    color: "#ff6b6b",
  },

  card: {
    background: "#111827",
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    border: "1px solid #1f2937",
  },

  meta: {
    fontSize: 12,
    opacity: 0.7,
    marginTop: 5,
  },
};
