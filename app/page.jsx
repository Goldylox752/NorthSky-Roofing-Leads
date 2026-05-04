import Link from "next/link";

export default function Home() {
  return (
    <main style={styles.page}>
      {/* HERO */}
      <section style={styles.hero}>
        <h1 style={styles.h1}>RoofFlow AI</h1>

        <p style={styles.sub}>
          Real-time roofing lead marketplace. Cities, contractors, and AI routing — fully automated.
        </p>

        <div style={styles.ctaRow}>
          <Link href="/buy" style={styles.primaryBtn}>
            💰 Buy Leads
          </Link>

          <Link href="/dashboard" style={styles.secondaryBtn}>
            📊 Live Dashboard
          </Link>
        </div>
      </section>

      {/* VALUE BLOCK */}
      <section style={styles.grid}>
        <div style={styles.card}>
          <h3>🏙 City-Controlled Market</h3>
          <p>Each city is a limited supply marketplace with pricing power.</p>
        </div>

        <div style={styles.card}>
          <h3>⚡ Real-Time Lead Routing</h3>
          <p>Leads instantly assigned to active contractors.</p>
        </div>

        <div style={styles.card}>
          <h3>💰 Wallet-Based Monetization</h3>
          <p>Contractors pay per lead via prepaid credits system.</p>
        </div>
      </section>

      {/* FOOTER CTA */}
      <section style={styles.footer}>
        <Link href="/city/calgary" style={styles.cityBtn}>
          Explore Calgary Market →
        </Link>
      </section>
    </main>
  );
}