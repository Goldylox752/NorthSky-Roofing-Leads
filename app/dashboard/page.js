"use client";

import { useEffect, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function Dashboard() {
  const [leads, setLeads] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);

  // ===============================
  // FETCH DASHBOARD DATA
  // ===============================
  const fetchData = async () => {
    try {
      setLoading(true);

      const res = await fetch(`${API_URL}/api/leads`);
      const data = await res.json();

      setLeads(data?.leads || []);
      setStats(data?.stats || {});
    } catch (err) {
      console.error("Dashboard error:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ===============================
  // UI
  // ===============================
  return (
    <main style={styles.page}>
      <h1 style={styles.h1}>RoofFlow SaaS Control Panel</h1>

      {/* STATS BAR */}
      <div style={styles.statsRow}>
        <div style={styles.statBox}>
          <h3>Total Leads</h3>
          <p>{stats.total || 0}</p>
        </div>

        <div style={styles.statBox}>
          <h3>Active Leads</h3>
          <p>{leads.length}</p>
        </div>

        <div style={styles.statBox}>
          <h3>Revenue</h3>
          <p>${(stats.revenue || 0) / 100}</p>
        </div>
      </div>

      {/* LEADS TABLE */}
      <div style={styles.table}>
        <div style={styles.rowHeader}>
          <span>City</span>
          <span>Status</span>
          <span>Score</span>
          <span>Price</span>
          <span>Contractor</span>
        </div>

        {loading ? (
          <p style={{ padding: 20 }}>Loading leads...</p>
        ) : (
          leads.map((lead) => (
            <div key={lead.id} style={styles.row}>
              <span>{lead.city}</span>
              <span>{lead.status}</span>
              <span>{lead.score}</span>
              <span>${(lead.price || 0) / 100}</span>
              <span>
                {lead.assigned_contractor_id || "Unassigned"}
              </span>
            </div>
          ))
        )}
      </div>
    </main>
  );
}

// ===============================
// STYLES
// ===============================
const styles = {
  page: {
    background: "#0b1220",
    color: "white",
    minHeight: "100vh",
    padding: "40px",
    fontFamily: "system-ui",
  },

  h1: {
    fontSize: "28px",
    marginBottom: "20px",
  },

  statsRow: {
    display: "flex",
    gap: "15px",
    marginBottom: "30px",
    flexWrap: "wrap",
  },

  statBox: {
    background: "#111a2e",
    padding: "20px",
    borderRadius: "10px",
    minWidth: "150px",
    border: "1px solid #24314d",
  },

  table: {
    background: "#111a2e",
    borderRadius: "10px",
    overflow: "hidden",
    border: "1px solid #24314d",
  },

  rowHeader: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr",
    padding: "12px",
    fontWeight: "bold",
    background: "#0f172a",
  },

  row: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr",
    padding: "12px",
    borderTop: "1px solid #24314d",
    fontSize: "14px",
  },
};