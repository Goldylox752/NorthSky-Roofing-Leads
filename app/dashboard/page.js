"use client";

import { useEffect, useState, useRef } from "react";
import Navbar from "@/components/Navbar";

export default function Dashboard() {
  const [leads, setLeads] = useState([]);
  const [connected, setConnected] = useState(false);

  const eventRef = useRef(null);
  const lastEventId = useRef(null);
  const reconnectTimer = useRef(null);

  const API = process.env.NEXT_PUBLIC_API_URL;

  // ===============================
  // SMART UPSERT MERGE ENGINE
  // ===============================
  const upsertLead = (incoming) => {
    setLeads((prev) => {
      const idx = prev.findIndex((l) => l.id === incoming.id);

      if (idx !== -1) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], ...incoming };
        return copy;
      }

      return [incoming, ...prev].slice(0, 150);
    });
  };

  // ===============================
  // INITIAL STATE SYNC (IMPORTANT FIX)
  // ===============================
  const loadSnapshot = async () => {
    try {
      const res = await fetch(`${API}/api/leads?limit=50`);
      const data = await res.json();

      if (data?.leads) {
        setLeads(data.leads);
      }
    } catch (e) {
      console.error("Snapshot load failed:", e);
    }
  };

  // ===============================
  // REAL-TIME STREAM
  // ===============================
  useEffect(() => {
    if (!API) return;

    loadSnapshot();

    const connect = () => {
      const es = new EventSource(
        `${API}/api/leads/stream?after=${lastEventId.current || ""}`
      );

      eventRef.current = es;

      es.onopen = () => setConnected(true);

      es.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);

          // ignore old/duplicate events
          if (
            data.eventId &&
            data.eventId === lastEventId.current
          ) {
            return;
          }

          lastEventId.current = data.eventId;

          upsertLead(data);
        } catch (err) {
          console.error("Stream parse error:", err);
        }
      };

      es.onerror = () => {
        setConnected(false);
        es.close();

        if (reconnectTimer.current)
          clearTimeout(reconnectTimer.current);

        reconnectTimer.current = setTimeout(connect, 3000);
      };
    };

    connect();

    return () => {
      eventRef.current?.close();
      clearTimeout(reconnectTimer.current);
    };
  }, []);

  // ===============================
  // UI
  // ===============================
  return (
    <main style={styles.page}>
      <Navbar />

      <div style={styles.container}>
        <header style={styles.header}>
          <div>
            <h1 style={styles.title}>Live Lead Feed</h1>
            <p style={styles.sub}>
              Real-time SaaS marketplace engine
            </p>
          </div>

          <div style={{ ...styles.status, color: connected ? "#22c55e" : "#ef4444" }}>
            ● {connected ? "LIVE" : "RECONNECTING"}
          </div>
        </header>

        {leads.length === 0 && (
          <div style={styles.empty}>Waiting for leads...</div>
        )}

        <div style={styles.grid}>
          {leads.map((l) => (
            <div key={l.id} style={styles.card}>
              <div style={styles.row}>
                <span>📍 {l.city || "Unknown"}</span>
                <span style={badge(l.status)}>{l.status}</span>
              </div>

              <p style={styles.text}>⚡ Score: {l.score}</p>

              <p style={styles.text}>
                🧠 Contractor: {l.assigned_contractor_id || "pending"}
              </p>

              <p style={styles.textSmall}>
                💰 ${(l.price || 0) / 100}
              </p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

// ===============================
const styles = {
  page: {
    background: "#0b1220",
    minHeight: "100vh",
    color: "white",
  },
  container: {
    padding: 40,
    maxWidth: 1100,
    margin: "0 auto",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  title: { fontSize: 28, fontWeight: "bold" },
  sub: { opacity: 0.6, fontSize: 13 },
  status: { fontSize: 13, fontWeight: 600 },
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
  },
  text: { fontSize: 13, opacity: 0.85, marginTop: 6 },
  textSmall: { fontSize: 12, opacity: 0.6 },
  empty: {
    padding: 20,
    background: "#111827",
    borderRadius: 10,
    textAlign: "center",
    opacity: 0.7,
  },
};

function badge(status) {
  const base = {
    fontSize: 11,
    padding: "2px 8px",
    borderRadius: 999,
  };

  return {
    ...base,
    background:
      status === "assigned"
        ? "#16a34a"
        : status === "new"
        ? "#2563eb"
        : status === "billed"
        ? "#f59e0b"
        : "#374151",
  };
}