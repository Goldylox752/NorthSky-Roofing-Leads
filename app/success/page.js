import Link from "next/link";

export default function Home() {
  return (
    <main style={styles.container}>
      {/* HERO */}
      <section style={styles.hero}>
        <h1 style={styles.title}>RoofFlow</h1>
        <p style={styles.subtitle}>
          We book roofing jobs for you — you just show up and close.
        </p>

        <div style={styles.buttons}>
          <Link href="/apply" style={styles.primaryBtn}>
            Apply Now
          </Link>

          <Link href="/dashboard" style={styles.secondaryBtn}>
            View Dashboard
          </Link>
        </div>
      </section>

      {/* FEATURES */}
      <section style={styles.grid}>
        <div style={styles.card}>
          <h3>Qualified Leads</h3>
          <p>We filter out low-quality traffic and send you real homeowners.</p>
        </div>

        <div style={styles.card}>
          <h3>Pay Per Result</h3>
          <p>Only pay when leads are delivered or subscriptions activate.</p>
        </div>

        <div style={styles.card}>
          <h3>Automated System</h3>
          <p>Stripe + Supabase + AI lead engine fully automated.</p>
        </div>
      </section>
    </main>
  );
}

const styles = {
  container: {
    fontFamily: "Arial, sans-serif",
    padding: "40px",
    background: "#0b1220",
    color: "#fff",
    minHeight: "100vh",
  },

  hero: {
    textAlign: "center",
    marginBottom: "60px",
  },

  title: {
    fontSize: "48px",
    fontWeight: "bold",
    marginBottom: "10px",
  },

  subtitle: {
    fontSize: "18px",
    color: "#b0b0b0",
    marginBottom: "30px",
  },

  buttons: {
    display: "flex",
    gap: "12px",
    justifyContent: "center",
  },

  primaryBtn: {
    padding: "12px 20px",
    background: "#2563eb",
    color: "#fff",
    borderRadius: "10px",
    textDecoration: "none",
  },

  secondaryBtn: {
    padding: "12px 20px",
    background: "#1f2937",
    color: "#fff",
    borderRadius: "10px",
    textDecoration: "none",
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "20px",
  },

  card: {
    background: "#111827",
    padding: "20px",
    borderRadius: "12px",
    border: "1px solid #1f2937",
  },
};
