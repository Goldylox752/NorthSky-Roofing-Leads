import Link from "next/link";

export default function Home() {
  return (
    <main style={styles.page}>
      <h1 style={styles.h1}>RoofFlow AI</h1>

      <p style={styles.sub}>
        Exclusive roofing leads + city marketplaces + automated contractor routing.
      </p>

      <div style={styles.grid}>
        <Link href="/buy" style={styles.card}>
          💰 Buy Leads
        </Link>

        <Link href="/dashboard" style={styles.card}>
          📊 Admin Dashboard
        </Link>

        <Link href="/city/calgary" style={styles.card}>
          🏙 City Pages
        </Link>
      </div>
    </main>
  );
}

const styles = {
  page: {
    background: "#0b1220",
    color: "white",
    minHeight: "100vh",
    padding: "60px",
    fontFamily: "system-ui",
  },
  h1: {
    fontSize: 42,
    marginBottom: 10,
  },
  sub: {
    opacity: 0.7,
    marginBottom: 40,
  },
  grid: {
    display: "flex",
    gap: 20,
  },
  card: {
    padding: 20,
    background: "#111a2e",
    borderRadius: 10,
    textDecoration: "none",
    color: "white",
    border: "1px solid #24314d",
  },
};