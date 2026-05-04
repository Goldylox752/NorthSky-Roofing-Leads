import LeadForm from "@/components/LeadForm";

export default function CityPage({ params }) {
  const city = decodeURIComponent(params.city).replace(/-/g, " ");

  const source = `seo_${city.toLowerCase().replace(/\s+/g, "_")}`;

  // 🏙 CITY MARKETPLACE DATA (temporary logic hook)
  const cityTier = "exclusive"; // later: fetch from DB
  const spotsLeft = cityTier === "exclusive" ? 1 : 2;
  const priceHint =
    cityTier === "exclusive"
      ? "$2,000/mo territory"
      : "$99–$199/mo access";

  return (
    <main style={styles.page}>
      {/* HEADER */}
      <h1 style={styles.h1}>Roofing Leads in {city}</h1>

      <p style={styles.subtext}>
        Exclusive roofing demand in {city} — delivered directly to top contractors.
        No shared lists. No recycled leads.
      </p>

      {/* 🏙 CITY VALUE BLOCK */}
      <div style={styles.marketBox}>
        <h3 style={styles.h3}>🏙 {city} Territory</h3>

        <p style={styles.text}>
          <b>Availability:</b> {cityTier.toUpperCase()}
        </p>

        <p style={styles.text}>
          <b>Spots left:</b> {spotsLeft}
        </p>

        <p style={styles.text}>
          <b>Market value:</b> {priceHint}
        </p>
      </div>

      {/* 🧲 LEAD FORM */}
      <div style={styles.formBox}>
        <LeadForm source={source} city={city} />
      </div>

      {/* 💰 CONTRACTOR CTA */}
      <div style={styles.ctaBox}>
        <h2 style={styles.h2}>Want Exclusive {city} Leads?</h2>

        <p style={styles.subtext}>
          Claim this territory before it’s taken.
        </p>

        <a href="/pricing" style={styles.ctaButton}>
          Become Exclusive Contractor
        </a>
      </div>

      {/* TRUST */}
      <div style={styles.trust}>
        <p>✔ Verified contractors in {city}</p>
        <p>✔ Storm damage & insurance specialists</p>
        <p>✔ 24–72 hour response window</p>
      </div>
    </main>
  );
}

// =====================
// STYLES
// =====================
const styles = {
  page: {
    padding: "60px 20px",
    background: "#0b1220",
    color: "white",
    minHeight: "100vh",
    fontFamily: "system-ui, -apple-system, sans-serif",
  },

  h1: {
    fontSize: "36px",
    marginBottom: "10px",
    fontWeight: "700",
  },

  h2: {
    fontSize: "22px",
    marginBottom: "10px",
  },

  h3: {
    fontSize: "18px",
    marginBottom: "10px",
  },

  subtext: {
    opacity: 0.75,
    maxWidth: "600px",
    lineHeight: "1.6",
    marginBottom: "25px",
  },

  text: {
    fontSize: "14px",
    opacity: 0.85,
    lineHeight: "1.6",
  },

  marketBox: {
    margin: "20px 0 30px",
    padding: "15px",
    background: "#0f172a",
    borderRadius: "10px",
    border: "1px solid #1f2a44",
  },

  formBox: {
    maxWidth: "520px",
    background: "#111a2e",
    padding: "20px",
    borderRadius: "12px",
    border: "1px solid #24314d",
    marginBottom: "30px",
  },

  ctaBox: {
    marginTop: "30px",
    padding: "20px",
    background: "#0f172a",
    borderRadius: "12px",
    border: "1px solid #24314d",
    textAlign: "center",
  },

  ctaButton: {
    display: "inline-block",
    marginTop: "10px",
    padding: "12px 18px",
    background: "#4da3ff",
    color: "white",
    borderRadius: "8px",
    textDecoration: "none",
    fontWeight: "600",
  },

  trust: {
    marginTop: "30px",
    fontSize: "13px",
    opacity: 0.7,
    lineHeight: "1.8",
  },
};