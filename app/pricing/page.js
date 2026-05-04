"use client";

import { useState } from "react";

export default function Pricing() {
  const [loading, setLoading] = useState(null);

  const subscribe = async (priceId) => {
    try {
      setLoading(priceId);

      const res = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          priceId,
          mode: "subscription",
        }),
      });

      const data = await res.json();

      if (data?.url) {
        window.location.href = data.url;
      } else {
        alert("Checkout failed. Try again.");
      }
    } catch (err) {
      console.error(err);
      alert("Something went wrong.");
    } finally {
      setLoading(null);
    }
  };

  const plans = [
    {
      name: "Starter",
      price: "$499 / month",
      desc: "5–10 qualified requests",
      id: "price_STARTER_ID",
      cta: "Secure Territory",
      highlight: false,
    },
    {
      name: "Growth",
      price: "$999 / month",
      desc: "15–30 booked opportunities",
      id: "price_GROWTH_ID",
      cta: "Get More Jobs",
      highlight: true,
    },
    {
      name: "Domination",
      price: "$1,999 / month",
      desc: "Full territory exclusivity",
      id: "price_DOMINATION_ID",
      cta: "Lock Market",
      highlight: false,
    },
  ];

  return (
    <main className="bg-white text-gray-900">
      {/* URGENCY */}
      <div className="bg-black text-white text-center py-3 text-sm">
        ⚠️ Only 1 contractor per territory — real-time availability
      </div>

      {/* HEADER */}
      <section className="max-w-5xl mx-auto px-6 py-16 text-center">
        <h1 className="text-4xl font-bold">
          Exclusive Roofing Leads by Territory
        </h1>

        <p className="mt-4 text-gray-600">
          No shared leads. No bidding wars. Just homeowners ready to buy.
        </p>

        <div className="mt-6 text-sm text-gray-500 space-y-1">
          <p>🔥 Avg ROI: 3–7x per closed job</p>
          <p>⚡ Instant lead delivery</p>
          <p>📍 One contractor per area</p>
        </div>
      </section>

      {/* SOCIAL PROOF */}
      <section className="max-w-5xl mx-auto px-6 pb-6 text-center">
        <p className="text-sm text-gray-500">
          Used by contractors scaling consistent high-ticket roofing jobs
        </p>
      </section>

      {/* PRICING */}
      <section className="max-w-6xl mx-auto px-6 pb-16 grid md:grid-cols-3 gap-8">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`rounded-2xl p-6 transition ${
              plan.highlight
                ? "border-2 border-black shadow-lg scale-105"
                : "border border-gray-200"
            }`}
          >
            {plan.highlight && (
              <p className="text-xs font-bold mb-2">MOST POPULAR</p>
            )}

            <h2 className="text-xl font-bold">{plan.name}</h2>
            <p className="text-2xl font-bold mt-2">{plan.price}</p>
            <p className="text-sm text-gray-500 mt-2">{plan.desc}</p>

            <button
              onClick={() => subscribe(plan.id)}
              disabled={loading === plan.id}
              className={`mt-6 w-full py-3 rounded-lg font-medium transition ${
                loading === plan.id
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-black text-white hover:opacity-90"
              }`}
            >
              {loading === plan.id
                ? "Processing..."
                : `${plan.cta} →`}
            </button>

            <p className="text-xs text-gray-500 mt-3">
              Cancel anytime. Keep all leads generated.
            </p>
          </div>
        ))}
      </section>

      {/* PAY PER LEAD */}
      <section className="max-w-5xl mx-auto px-6 pb-20 text-center">
        <h2 className="text-2xl font-bold">
          Not ready for a subscription?
        </h2>

        <p className="text-gray-600 mt-2">
          Buy individual high-intent leads. No commitment.
        </p>

        <div className="grid md:grid-cols-3 gap-6 mt-10 text-left">
          <div className="border rounded-xl p-6">
            <h3 className="font-bold">Hot Lead</h3>
            <p className="text-gray-600">$49</p>
            <p className="text-xs text-gray-500 mt-2">
              Recent inquiry with strong intent
            </p>
          </div>

          <div className="border rounded-xl p-6">
            <h3 className="font-bold">Verified Lead</h3>
            <p className="text-gray-600">$99</p>
            <p className="text-xs text-gray-500 mt-2">
              Confirmed contact + project need
            </p>
          </div>

          <div className="border rounded-xl p-6">
            <h3 className="font-bold">Exclusive Lead</h3>
            <p className="text-gray-600">$149</p>
            <p className="text-xs text-gray-500 mt-2">
              Sold to one contractor only
            </p>
          </div>
        </div>

        <button
          onClick={() => (window.location.href = "/buy-leads")}
          className="mt-8 bg-gray-900 text-white px-6 py-3 rounded-lg hover:opacity-90 transition"
        >
          Browse Single Leads →
        </button>
      </section>
    </main>
  );
}