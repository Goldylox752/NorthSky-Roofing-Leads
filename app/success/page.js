import Link from "next/link";

export default function SuccessPage() {
  return (
    <main style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Payment Successful 🎉</h1>

        <p style={styles.text}>
          Your subscription has been activated. Welcome to RoofFlow.
        </p>

        <p style={styles.subtext}>
          You can now start receiving qualified roofing leads automatically.
        </p>

        <div style={styles.actions}>
          <Link href="/dashboard" style={styles.primaryBtn}>
            Go to Dashboard
          </Link>

          <Link href="/" style={styles.secondaryBtn}>
            Back to Home
          </Link>
        </div>
      </div>
    </main>
  );
}

const styles = {
  container: {
    fontFamily: "Arial, sans-serif",
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "#0b1220",
    color: "#fff",
    padding: "20px",
  },

  card: {
    background: "#111827",
    padding: "40px",
    borderRadius: "16px",
    border: "1px solid #1f2937",
    textAlign: "center",
    maxWidth: "500px",
  },

  title: {
    fontSize: "32px",
    marginBottom: "10px",
  },

  text: {
    fontSize: "16px",
    color: "#d1d5db",
    marginBottom: "10px",
  },

  subtext: {
    fontSize: "14px",
    color: "#9ca3af",
    marginBottom: "30px",
  },

  actions: {
    display: "flex",
    gap: "12px",
    justifyContent: "center",
    flexWrap: "wrap",
  },

  primaryBtn: {
    padding: "12px 18px",
    background: "#2563eb",
    color: "#fff",
    borderRadius: "10px",
    textDecoration: "none",
  },

  secondaryBtn: {
    padding: "12px 18px",
    background: "#1f2937",
    color: "#fff",
    borderRadius: "10px",
    textDecoration: "none",
  },
};
