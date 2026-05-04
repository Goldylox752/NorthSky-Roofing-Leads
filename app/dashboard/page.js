"use client";

import { useEffect, useState, useRef } from "react";
import Navbar from "@/components/Navbar";

export default function Dashboard() {
  const [leads, setLeads] = useState([]);
  const [connected, setConnected] = useState(false);
  const eventRef = useRef(null);

  // ===============================
  // REAL-TIME STREAM (RESILIENT)
  // ===============================
  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_API_URL;

    if (!url) {
      console.error("Missing API URL");
      return;
    }

    const connect = () => {
      const es = new EventSource(`${url}/api/leads/stream`);
      eventRef.current = es;

      es.onopen = () => setConnected(true);

      es.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          // prevent full overwrite spam
          setLeads((prev) => {
            const exists = prev.find((l) => l.id === data.id);

            if (exists) {
              return prev.map((l) => (l.id === data.id ? data : l));
            }

            return [data, ...prev].slice(0, 100);
          });
        } catch (err) {
          console.error("Stream parse error:", err);
        }
      };

      es.onerror = () => {
        setConnected(false);
        es.close();

        // auto-reconnect (important for SaaS reliability)
        setTimeout(connect, 3000);
      };
    };

    connect();

    return () => {
      if (eventRef.current) eventRef.current.close();
    };
  }, []);

  // ===============================
  // UI STATE
  // ===============================
  const statusColor = connected ? "#22c55e" : "#ef4444";

  return (
    <main style={styles.page}>
      <Navbar />

      <div style={styles.container}>
        {/* HEADER */}
        <div style={styles.header}>
          <h1 style={styles.title}>Live Lead Feed</h1>

          <div style={{ ...styles.status, color: statusColor }}>
            ● {connected ? "Live" : "Disconnected"}
          </div>
        </div>

        {/* EMPTY STATE */}
        {leads.length === 0 && (
          <div style={styles.empty}>
            No leads yet — waiting for incoming traffic...
          </div>
        )}

        {/* LEADS */}
        <div style={styles.grid}>
          {leads.map((l) => (
            <div key={l.id} style={styles.card}>
              <div style={styles.row}>
                <span>📍 {l.city || "Unknown"}</span>
                <span style={badge(l.status)}>{l.status}</span>
              </div>

              <p style={styles.text}>⚡ Score: {l.score ?? "N/A"}</p>

              <p style={styles.text}>
                🧠 Assigned:{" "}
                {l.assigned_contractor_id || "pending"}
              </p>

              <p style={styles.textSmall}>
                💰 Price: ${((l.price || 0) / 100).toFixed(2)}
              </p>
            </div>
          ))}
        </div>
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
    minHeight: "100vh",
    color: "white",
  },

  container: {
    padding: "40px",
    maxWidth: 1000,
    margin: "0 auto",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },

  title: {
    fontSize: 28,
    fontWeight: "bold",
  },

  status: {
    fontSize: 14,
    fontWeight: 600,
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
    gap: 12,
  },

  card: {
    background: "#111827",
    padding: 14,
    borderRadius: 10,
    border: "1px solid #1f2937",
  },

  row: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: 8,
  },

  text: {
    fontSize: 13,
    opacity: 0.85,
    margin: "4px 0",
  },

  textSmall: {
    fontSize: 12,
    opacity: 0.6,
  },

  empty: {
    padding: 20,
    background: "#111827",
    borderRadius: 10,
    textAlign: "center",
    opacity: 0.7,
  },
};

// ===============================
// BADGE STYLE FUNCTION
// ===============================
function badge(status) {
  const base = {
    fontSize: 11,
    padding: "2px 8px",
    borderRadius: 999,
    textTransform: "uppercase",
  };

  switch (status) {
    case "assigned":
      return { ...base, background: "#16a34a", color: "white" };
    case "new":
      return { ...base, background: "#2563eb", color: "white" };
    case "billed":
      return { ...base, background: "#f59e0b", color: "black" };
    case "failed":
      return { ...base, background: "#dc2626", color: "white" };
    default:
      return { ...base, background: "#374151", color: "white" };
  }
}