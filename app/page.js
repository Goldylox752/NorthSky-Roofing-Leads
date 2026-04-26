export default function Home() {
  return (
    <main className="bg-white text-gray-900">

      {/* HERO */}
      <section className="max-w-5xl mx-auto px-6 py-24 text-center">
        <h1 className="text-4xl md:text-5xl font-bold leading-tight">
          Exclusive Roofing Leads That Turn Into Booked Jobs
        </h1>

        <p className="mt-6 text-lg text-gray-600 max-w-2xl mx-auto">
          RoofFlow connects roofing contractors with high-intent homeowners actively requesting estimates in their area — not clicks, not cold traffic, real demand.
        </p>

        <div className="mt-8 flex gap-4 justify-center flex-wrap">
          <a
            href="/apply"
            className="bg-black text-white px-6 py-3 rounded-lg font-medium"
          >
            Apply for Access
          </a>

          <a
            href="#how-it-works"
            className="border border-gray-300 px-6 py-3 rounded-lg font-medium"
          >
            See How It Works
          </a>
        </div>

        <p className="mt-6 text-xs text-gray-500">
          Exclusive territories. No shared leads. No spam traffic.
        </p>
      </section>

      {/* TRUST STRIP */}
      <section className="bg-gray-50 py-10 px-6 text-center text-gray-600">
        <p className="max-w-3xl mx-auto">
          Built for roofing contractors across Canada & the U.S. focused on real homeowner intent — not lead lists or paid clicks.
        </p>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="max-w-6xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-bold text-center">
          How RoofFlow Works
        </h2>

        <div className="mt-10 grid md:grid-cols-3 gap-6">
          <div className="p-6 border rounded-xl">
            <h3 className="font-semibold mb-2">1. Capture Local Demand</h3>
            <p className="text-gray-600">
              Homeowners actively searching for roofing services request estimates in your service area.
            </p>
          </div>

          <div className="p-6 border rounded-xl">
            <h3 className="font-semibold mb-2">2. Filter & Qualify</h3>
            <p className="text-gray-600">
              Every request is screened for intent, location, and urgency before delivery.
            </p>
          </div>

          <div className="p-6 border rounded-xl">
            <h3 className="font-semibold mb-2">3. Get Booked Opportunities</h3>
            <p className="text-gray-600">
              Receive ready-to-book roofing appointments — not raw or unverified leads.
            </p>
          </div>
        </div>
      </section>

      {/* POSITIONING */}
      <section className="bg-gray-900 text-white py-20 px-6">
        <h2 className="text-3xl font-bold text-center">
          Why Contractors Switch to RoofFlow
        </h2>

        <div className="mt-10 grid md:grid-cols-3 gap-6">
          <div className="p-6 bg-gray-800 rounded-xl">
            <h3 className="font-semibold mb-2">Google Ads</h3>
            <p className="text-gray-300">
              Pay per click with no guarantee of intent or conversion.
            </p>
          </div>

          <div className="p-6 bg-gray-800 rounded-xl">
            <h3 className="font-semibold mb-2">Lead Marketplaces</h3>
            <p className="text-gray-300">
              Shared leads sold to multiple competing contractors.
            </p>
          </div>

          <div className="p-6 bg-green-600 rounded-xl">
            <h3 className="font-semibold mb-2">RoofFlow</h3>
            <p>
              Exclusive homeowners actively requesting roofing estimates.
            </p>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-bold text-center">
          Contractor Results
        </h2>

        <div className="mt-10 grid md:grid-cols-2 gap-6">
          <div className="p-6 border rounded-xl">
            <p className="text-gray-700">
              “Every lead we receive is actually looking for roofing work. Huge difference.”
            </p>
            <span className="text-sm text-gray-500 mt-3 block">
              — Roofing Contractor, Alberta
            </span>
          </div>

          <div className="p-6 border rounded-xl">
            <p className="text-gray-700">
              “We started booking inspections within the first week.”
            </p>
            <span className="text-sm text-gray-500 mt-3 block">
              — Roofing Business Owner
            </span>
          </div>
        </div>
      </section>

      {/* SERVICE AREAS */}
      <section className="max-w-6xl mx-auto px-6 py-20 text-center">
        <h2 className="text-3xl font-bold">
          Service Areas
        </h2>

        <div className="mt-8 flex flex-wrap justify-center gap-4 text-blue-600">
          <a href="/roofing-leads/edmonton">Edmonton</a>
          <a href="/roofing-leads/calgary">Calgary</a>
          <a href="/roofing-leads/leduc">Leduc</a>
          <a href="/roofing-leads/red-deer">Red Deer</a>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="bg-gray-50 py-20 px-6">
        <h2 className="text-3xl font-bold text-center">
          Simple Monthly Access
        </h2>

        <div className="mt-10 grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          <div className="p-6 border rounded-xl">
            <h3 className="font-semibold">Starter</h3>
            <p className="text-gray-600">$499 / month</p>
          </div>

          <div className="p-6 border-2 border-black rounded-xl">
            <h3 className="font-semibold">Growth</h3>
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
            Apply for Access
          </a>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-gray-900 text-white py-20 px-6">
        <h2 className="text-3xl font-bold text-center">
          Frequently Asked Questions
        </h2>

        <div className="mt-10 max-w-3xl mx-auto space-y-6 text-gray-300">
          <p><b className="text-white">Are leads exclusive?</b><br />Yes — only one contractor per territory.</p>
          <p><b className="text-white">Do you guarantee sales?</b><br />No — we deliver qualified opportunities, not closed deals.</p>
          <p><b className="text-white">How fast do leads arrive?</b><br />Usually within 24–72 hours.</p>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="text-center py-24 px-6">
        <h2 className="text-3xl font-bold">
          Ready to stop chasing leads?
        </h2>

        <a
          href="/apply"
          className="mt-6 inline-block bg-black text-white px-8 py-3 rounded-lg"
        >
          Get Exclusive Roofing Leads
        </a>

        <p className="text-xs text-gray-500 mt-4">
          Start receiving qualified roofing appointments in your area.
        </p>
      </section>

    </main>
  );
}
