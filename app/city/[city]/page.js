import LeadForm from "@/components/LeadForm";

export default async function CityPage({ params }) {
  const city = decodeURIComponent(params.city);

  // fetch live city state (Supabase or API)
  const res = await fetch(
    process.env.NEXT_PUBLIC_API_URL + `/api/cities/${city}`,
    { cache: "no-store" }
  );

  const data = await res.json();
  const cityData = data.city;

  return (
    <main style={page}>
      <h1>Roofing Leads in {city}</h1>

      <p>
        Status: <b>{cityData?.status || "open"}</b> | Tier:{" "}
        <b>{cityData?.tier}</b>
      </p>

      <div style={box}>
        <LeadForm city={city} />
      </div>
    </main>
  );
}

const page = {
  background: "#0b1220",
  minHeight: "100vh",
  color: "white",
  padding: 40,
};

const box = {
  marginTop: 20,
  padding: 20,
  background: "#111827",
  borderRadius: 10,
};