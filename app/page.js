export default function Home() {
  return (
    <main className="bg-white text-gray-900">

      {/* HERO — HOOK + URGENCY */}
      <section className="max-w-5xl mx-auto px-6 py-24 text-center">

        <p className="text-sm text-red-600 font-medium">
          ⚠️ Contractor access is limited per city
        </p>

        <h1 className="text-4xl md:text-5xl font-bold leading-tight mt-3">
          Exclusive Roofing Leads That Turn Into Booked Jobs — Not Clicks
        </h1>

        <p className="mt-6 text-lg text-gray-600 max-w-2xl mx-auto">
          RoofFlow connects roofing contractors with verified homeowners actively requesting estimates in your service area.
          No cold traffic. No shared leads. Just high-intent demand.
        </p>

        <div className="mt-8 flex gap-4 justify-center flex-wrap">
          <a
            href="/apply"
            className="bg-black text-white px-6 py-3 rounded-lg font-medium"
          >
            Check Availability
          </a>

          <a
            href="#system"
            className="border border-gray-300 px-6 py-3 rounded-lg font-medium"
          >
            See System
          </a>
        </div>

        <p className="mt-6 text-xs text-gray-500">
          Territories are assigned per region • Approval required
        </p>
      </section>

      {/* PROBLEM AWARENESS */}
      <section className="bg-gray-50 py-20 px-6 text-center">
        <h2 className="text-3xl font-bold">
          Why Most Contractors Stay Stuck
        </h2>

        <div className="mt-10 max-w-3xl mx-auto space-y-4 text-gray-600">
          <p>• Paying for clicks that never turn into real jobs</p>
          <p>• Shared leads sold to multiple competitors</p>
          <p>• Low-intent inquiries that waste time and sales energy</p>
        </div>
      </section>

      {/* SYSTEM EXPLANATION */}
      <section id="system" className="max-w-6xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-bold text-center">
          The RoofFlow Demand Engine
        </h2>

        <div className="mt-10 grid md:grid-cols-3 gap-6">

          <div className="p-6 border rounded-xl">
            <h3 className="font-semibold mb-2">1. Capture Intent</h3>
            <p className="text-gray-600">
              Homeowners actively request roofing estimates in your service area.
            </p>
          </div>

          <div className="p-6 border rounded-xl">
            <h3 className="font-semibold mb-2">2. Filter Demand</h3>
            <p className="text-gray-600">
              Leads are screened by location, urgency, and buying intent before delivery.
            </p>
          </div>

          <div className="p-6 border rounded-xl">
            <h3 className="font-semibold mb-2">3. Deliver Booked Opportunities</h3>
            <p className="text-gray-600">
              You receive appointment-ready jobs, not raw lead lists.
            </p>
          </div>

        </div>
      </section>

      {/* POSITIONING */}
      <section className="bg-gray-900 text-white py-20 px-6">
        <h2 className="text-3xl font-bold text-center">
          Why RoofFlow Wins
        </h2>

        <div className="mt-10 grid md:grid-cols-3 gap-6">

          <div className="p-6 bg-gray-800 rounded-xl">
            <h3 className="font-semibold mb-2">Google Ads</h3>
            <p className="text-gray-300">
              Pay per click with unpredictable intent and conversion rates.
            </p>
          </div>

          <div className="p-6 bg-gray-800 rounded-xl">
            <h3 className="font-semibold mb-2">Lead Brokers</h3>
            <p className="text-gray-300">
              Same lead sold to multiple competing contractors.
            </p>
          </div>

          <div className="p-6 bg-green-600 rounded-xl">
            <h3 className="font-semibold mb-2">RoofFlow</h3>
            <p>
              Exclusive homeowner requests with verified purchase intent.
            </p>
          </div>

        </div>
      </section>

      {/* SOCIAL PROOF */}
      <section className="max-w-6xl mx-auto px-6 py-20 text-center">
        <h2 className="text-3xl font-bold">
          Contractors Using RoofFlow
        </h2>

        <div className="mt-10 grid md:grid-cols-2 gap-6 text-left">

          <div className="p-6 border rounded-xl">
            <p className="text-gray-700">
              “Every lead is actual homeowner intent. We stopped wasting time completely.”
            </p>
            <span className="text-sm text-gray-500 mt-3 block">
              — Roofing Contractor, Alberta
            </span>
          </div>

          <div className="p-6 border rounded-xl">
            <p className="text-gray-700">
              “We booked inspections within 7 days of joining.”
            </p>
            <span className="text-sm text-gray-500 mt-3 block">
              — Roofing Business Owner
            </span>
          </div>

        </div>
      </section>

      {/* SCARCITY ENGINE */}
      <section className="bg-gray-50 py-20 px-6 text-center">
        <h2 className="text-3xl font-bold">
          Territory Availability
        </h2>

        <p className="mt-4 text-gray-600">
          We limit contractor access per city to protect lead quality.
        </p>

        <div className="mt-6 text-lg font-semibold text-red-600">
          Only 2 contractor spots remaining in your region
        </div>
      </section>

      {/* SERVICE AREAS */}
      <section className="py-20 px-6 text-center">
        <h2 className="text-3xl font-bold">
          Active Service Areas
        </h2>

        <div className="mt-8 flex flex-wrap justify-center gap-4 text-blue-600">
          <a href="/roofing-leads/edmonton">Edmonton</a>
          <a href="/roofing-leads/calgary">Calgary</a>
          <a href="/roofing-leads/leduc">Leduc</a>
          <a href="/roofing-leads/red-deer">Red Deer</a>
        </div>
      </section>

      {/* PRICING ANCHOR */}
      <section className="bg-gray-50 py-20 px-6">
        <h2 className="text-3xl font-bold text-center">
          Simple Monthly Access
        </h2>

        <div className="mt-10 grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">

          <div className="p-6 border rounded-xl">
            <h3 className="font-semibold">Starter</h3>
            <p className="text-gray-600">$499 / month</p>
          </div>

          <div className="p-6 border-2 border-black rounded-xl">
            <h3 className="font-semibold">Growth (Recommended)</h3>
            <p className="text-gray-600">$999 / month</p>
          </div>

          <div className="p-6 border rounded-xl">
            <h3 className="font-semibold">Domination</h3>
            <p className="text-gray-600">$1,999 / month</p>
          </div>

        </div>

        <div className="text-center mt-10">
          <a
            href="/apply"
            className="bg-black text-white px-6 py-3 rounded-lg"
          >
            Check Availability
          </a>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="text-center py-24 px-6">
        <h2 className="text-3xl font-bold">
          Ready to take exclusive leads in your area?
        </h2>

        <p className="text-gray-600 mt-3">
          Get booked roofing appointments, not random inquiries.
        </p>

        <a
          href="/apply"
          className="mt-6 inline-block bg-black text-white px-8 py-3 rounded-lg"
        >
          Apply Now
        </a>
      </section>

    </main>
  );
}
