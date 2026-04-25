import LeadForm from "@/components/LeadForm";

export default function CityPage({ params }) {
  const city = params.city.replace("-", " ");

  return (
    <div style={{ padding: 40, color: "white" }}>
      <h1>Roof Repair in {city}</h1>

      <p>
        Get a free roofing estimate from trusted contractors in {city}.
      </p>

      <LeadForm source={`seo_${city}`} />
    </div>
  );
}
