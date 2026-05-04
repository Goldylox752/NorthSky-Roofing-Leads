"use client";

import { useState } from "react";

export default function BuyLeads() {
  const [loading, setLoading] = useState(null);

  const buyLead = async (priceId) => {
    try {
      setLoading(priceId);

      const res = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ priceId }),
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
      name: "Hot Lead",
      price: "$49",
      id: "price_hot_lead",
      desc: "Recently submitted. High intent.",
      highlight: false,
    },
    {
      name: "Verified Lead",
      price: "$99",
      id: "price_verified_lead",
      desc: "Contact confirmed. Ready to talk.",
      highlight: true,
    },
    {
      name: "Exclusive Lead",
      price: "$149",
      id: "price_exclusive_lead",
      desc: "Sold once. Highest close rate.",
      highlight: false,
    },
  ];

  return (
    <main className="max-w-5xl mx-auto px-6 py-20 text-center">
      <h1 className="text-4xl font-bold">
        Buy High-Intent Roofing Leads
      </h1>

      <p className="text-gray-600 mt-4">
        Skip cold outreach. Get homeowners ready to buy — delivered instantly.
      </p>

      <div className="grid md:grid-cols-3 gap-8 mt-12">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`border rounded-2xl p-6 transition ${
              plan.highlight
                ? "border-black shadow-lg scale-105"
                : "border-gray-200"
            }`}
          >
            {plan.highlight && (
              <p className="text-xs font-bold mb-2">MOST POPULAR</p>
            )}

            <h2 className="text-xl font-bold">{plan.name}</h2>
            <p className="text-3xl font-bold mt-2">{plan.price}</p>
            <p className="text-gray-500 mt-2 text-sm">{plan.desc}</p>

            <button
              onClick={() => buyLead(plan.id)}
              disabled={loading === plan.id}
              className={`mt-6 w-full py-3 rounded-lg font-medium transition ${
                loading === plan.id
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-black text-white hover:opacity-90"
              }`}
            >
              {loading === plan.id ? "Processing..." : "Buy Now"}
            </button>
          </div>
        ))}
      </div>

      <p className="text-xs text-gray-400 mt-10">
        Limited supply per area. First come, first served.
      </p>
    </main>
  );
}