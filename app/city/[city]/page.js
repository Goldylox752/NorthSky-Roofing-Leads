import LeadForm from "@/components/LeadForm";

export default function CityPage({ params }) {
  const city = decodeURIComponent(params.city).replace(/-/g, " ");

  return (
    <main style={styles.page}>
      <h1 style={styles.h1}>Roofing Leads in {city}</h1>

      <p style={styles.subtext}>
        Exclusive contractor demand marketplace for {city}.
      </p>

      <div style={styles.box}>
        <LeadForm city={city} />
      </div>
    </main>
  );
}

// ===============================
// STYLES
// ===============================
const styles = {
  page: {
    background: "#0b1220",
    color: "white",
    minHeight: "100vh",
    padding: 40,
  },

  h1: {
    fontSize: 32,
    marginBottom: 10,
  },

  subtext: {
    opacity: 0.7,
    marginBottom: 20,
  },

  box: {
    marginTop: 20,
    padding: 20,
    background: "#111a2e",
    borderRadius: 10,
    border: "1px solid #1f2937",
    maxWidth: 500,
  },
};