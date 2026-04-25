export default function LeadCard({
  lead,
  status,
  onAccept,
  onReject
}) {
  return (
    <div style={styles.card}>

      <div>
        <h3>{lead.name}</h3>
        <p>{lead.phone}</p>
        <p>{lead.city}</p>
      </div>

      <div style={styles.actions}>
        <button onClick={onAccept} style={styles.accept}>
          Accept
        </button>

        <button onClick={onReject} style={styles.reject}>
          Reject
        </button>
      </div>

      <small>Status: {status}</small>

    </div>
  );
}

const styles = {
  card: {
    background: "#121a2b",
    padding: 16,
    borderRadius: 12,
    border: "1px solid #24314d",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  },
  actions: {
    display: "flex",
    gap: 8
  },
  accept: {
    background: "#22c55e",
    border: "none",
    padding: "6px 12px",
    color: "white",
    borderRadius: 6,
    cursor: "pointer"
  },
  reject: {
    background: "#ef4444",
    border: "none",
    padding: "6px 12px",
    color: "white",
    borderRadius: 6,
    cursor: "pointer"
  }
};
