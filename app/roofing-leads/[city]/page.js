import Link from "next/link";

function formatCity(slug = "") {
  return slug
    .replace(/-/g, " ")
    .replace(/\b\w/g, (l) => l.toUpperCase());
}

/* =========================
   SEO METADATA (SAFE)
========================= */
export async function generateMetadata({ params }) {
  const city = params?.city ? formatCity(params.city) : "Your City";

  return {
    title: `Exclusive Roofing Leads in ${city} | RoofFlow`,
    description: `Get exclusive roofing leads in ${city}. RoofFlow connects contractors with high-intent homeowners ready to book estimates.`,

    openGraph: {
      title: `Roofing Leads in ${city}`,
      description: `Exclusive contractor-only roofing leads in ${city}.`,
      type: "website",
    },
  };
}

/* =========================
   PAGE
========================= */
export default function CityPage({ params }) {
  const city = params?.city ? formatCity(params.city) : "Your City";

  return (
    <main style={styles.main}>
      <div style={styles.container}>

        {/* HERO */}
        <header style={styles.hero}>
          <h1 style={styles.h1}>
            Exclusive Roofing Leads in {city}
          </h1>

          <p style={styles.subtext}>
            RoofFlow delivers <b>high-intent homeowners</b> in {city} directly to contractors.
            No shared lists. No recycled data. Only real booking opportunities.
          </p>

          <div style={styles.ctaRow}>
            <Link href="/apply" style={styles.primaryButton}>
              Apply for {city} Access →
            </Link>
          </div>

          <div style={styles.trustBar}>
            ✔ Exclusive territories&nbsp;&nbsp; ✔ Verified homeowners&nbsp;&nbsp; ✔ Real-time routing
          </div>
        </header>

        {/* VALUE */}
        <section style={styles.section}>
          <h2>Why Contractors in {city} Switch to RoofFlow</h2>
          <p style={styles.text}>
            Traditional lead providers in {city} distribute the same lead to multiple contractors.
            RoofFlow filters intent and assigns leads exclusively.
          </p>
        </section>

        {/* HOW IT WORKS */}
        <section style={styles.section}>
          <h2>How It Works</h2>
          <ul style={styles.list}>
            <li>Homeowners in {city} request roofing estimates</li>
            <li>AI filters urgency, budget, and intent</li>
            <li>Qualified leads are assigned to one contractor</li>
          </ul>
        </section>

        {/* VALUE STACK */}
        <section style={styles.section}>
          <h2>What You Get</h2>
          <ul style={styles.list}>
            <li>Exclusive territory access in {city}</li>
            <li>No shared or recycled leads</li>
            <li>High-intent homeowner pipeline</li>
            <li>Instant lead delivery system</li>
          </ul>
        </section>

        {/* URGENCY */}
        <div style={styles.urgency}>
          ⚡ Limited contractor slots available in {city}
        </div>

        {/* FINAL CTA */}
        <section style={styles.finalCta}>
          <h2>Start Receiving Roofing Leads in {city}</h2>

          <p style={styles.text}>
            Applications are reviewed to maintain lead quality and exclusivity per market.
          </p>

          <Link href="/apply" style={styles.primaryButton}>
            Apply Now →
          </Link>
        </section>

      </div>
    </main>
  );
}

/* =========================
   STYLES
========================= */
const styles = {
  main: {
    background: "#070d18",
    color: "white",
    fontFamily: "system-ui",
    padding: "70px 20px",
  },

  container: {
    maxWidth: "900px",
    margin: "0 auto",
  },

  hero: {
    marginBottom: "50px",
  },

  h1: {
    fontSize: "44px",
    fontWeight: 800,
    marginBottom: "16px",
  },

  subtext: {
    opacity: 0.85,
    fontSize: "18px",
    lineHeight: "1.6",
    marginBottom: "25px",
  },

  ctaRow: {
    marginBottom: "20px",
  },

  primaryButton: {
    display: "inline-block",
    padding: "14px 20px",
    background: "#3b82f6",
    color: "white",
    borderRadius: "10px",
    fontWeight: 700,
    textDecoration: "none",
  },

  trustBar: {
    fontSize: "13px",
    opacity: 0.7,
    marginTop: "10px",
  },

  section: {
    marginTop: "45px",
  },

  text: {
    opacity: 0.85,
    lineHeight: "1.7",
  },

  list: {
    opacity: 0.85,
    lineHeight: "1.9",
  },

  urgency: {
    marginTop: "45px",
    padding: "16px",
    background: "#111b2e",
    borderRadius: "10px",
    textAlign: "center",
    fontWeight: 700,
  },

  finalCta: {
    marginTop: "70px",
    textAlign: "center",
  },
};