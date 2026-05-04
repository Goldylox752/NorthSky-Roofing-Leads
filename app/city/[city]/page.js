import LeadForm from "@/components/LeadForm";

export default function CityPage({ params }) {
  const city = decodeURIComponent(params.city).replace(/-/g, " ");

  const source = `seo_${city.toLowerCase().replace(/\s+/g, "_")}`;

  // 🏙 CITY MARKETPLACE DATA (temporary logic hook)
  const cityTier = "exclusive"; // later: fetch from DB
  const spotsLeft = cityTier === "exclusive" ? 1 : 2;
  const priceHint = cityTier === "exclusive" ? "$2,000/mo territory" : "$99–$199/mo access";

  return (
    <main style={styles.page}>
      {/* HEADER */}
      <h1 style={styles.h1}>
        Roofing Leads in {city}
      </h1>

      <p style={styles.subtext}>
        Exclusive roofing demand in {city} — delivered directly to top contractors.
        No shared lists. No recycled leads.
      </p>

      {/* 🏙 CITY VALUE BLOCK (NEW MONETIZATION LAYER) */}
      <div style={styles.marketBox}>
        <h3>🏙 {city} Territory</h3>
        <p><b>Availability:</b> {cityTier.toUpperCase()}</p>
        <p><b>Spots left:</b> {spotsLeft}</p>
        <p><b>Market value:</b> {priceHint}</p>
      </div>

      {/* 🧲 LEAD FORM */}
      <div style={styles.formBox}>
        <LeadForm source={source} city={city} />
      </div>

      {/* 💰 CONTRACTOR CTA (NEW REVENUE LAYER) */}
      <div style={styles.ctaBox}>
        <h2>Want Exclusive {city} Leads?</h2>
        <p>Claim this territory before it’s taken.</p>

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