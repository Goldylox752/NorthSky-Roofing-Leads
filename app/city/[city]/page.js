import LeadForm from "@/components/LeadForm";

export default function CityPage({ params }) {
  const city = decodeURIComponent(params.city)
    .replace(/-/g, " ");

  const source = `seo_${city.toLowerCase().replace(/\s+/g, "_")}`;

  return (
    <main style={styles.page}>
      <h1 style={styles.h1}>
        Roofing Leads in {city}
      </h1>

      <p style={styles.subtext}>
        Get fast roofing estimates from verified contractors in {city}.
        No spam. No junk quotes.
      </p>

      {/* 🧲 HIGH-CONVERSION FORM BLOCK */}
      <div style={styles.formBox}>
        <LeadForm source={source} city={city} />
      </div>

      {/* 🔥 TRUST / SEO BOOST SECTION */}
      <div style={styles.trust}>
        <p>✔ Verified contractors in {city}</p>
        <p>✔ Storm damage & repair specialists</p>
        <p>✔ Fast response (24–72 hours)</p>
      </div>
    </main>
  );
}

const styles = {
  page: {
    padding: "60px 20px",
    color: "white",
    background: "#0b1220",
    minHeight: "100vh",
  },

  h1: {
    fontSize: 34,
    marginBottom: 10,
  },

  subtext: {
    opacity: 0.75,
    marginBottom: 30,
    maxWidth: 600,
    lineHeight: 1.5,
  },

  formBox: {
    maxWidth: 500,
    background: "#111a2e",
    padding: 20,
    borderRadius: 12,
    border: "1px solid #24314d",
  },

  trust: {
    marginTop: 30,
    fontSize: 13,
    opacity: 0.7,
    lineHeight: 1.8,
  },
};
