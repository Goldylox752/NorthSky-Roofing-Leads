import { useMemo } from "react";

export default function StatsBar({ leads = [] }) {
  // 🔥 Optimized calculations (prevents re-filtering every render)
  const stats = useMemo(() => {
    const total = leads.length;
    const accepted = leads.filter((l) => l.status === "accepted").length;
    const rejected = leads.filter((l) => l.status === "rejected").length;
    const pending = total - accepted - rejected;

    return { total, accepted, rejected, pending };
  }, [leads]);

  return (
    <div style={styles.bar}>
      <Stat label="Total" value={stats.total} />
      <Stat label="Accepted" value={stats.accepted} color="#22c55e" />
      <Stat label="Rejected" value={stats.rejected} color="#ef4444" />
      <Stat label="Pending" value={stats.pending} color="#f59e0b" />
    </div>
  );
}

// 🔥 Small reusable stat block
function Stat({ label, value, color }) {
  return (
    <div style={styles.stat}>
      <div style={styles.label}>{label}</div>
      <div style={{ ...styles.value, color: color || "#fff" }}>
        {value}
      </div>
    </div>
  );
}

const styles = {
  bar: {
    display: "flex",
    gap: 20,
    marginBottom: 20,
    padding: 14,
    background: "#121a2b",
    borderRadius: 10,
    border: "1px solid #24314d",
    flexWrap: "wrap",
  },

  stat: {
    display: "flex",
    flexDirection: "column",
    minWidth: 80,
  },

  label: {
    fontSize: 12,
    opacity: 0.7,
  },

  value: {
    fontSize: 18,
    fontWeight: "bold",
  },
};
