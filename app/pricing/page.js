"use client";

import { useEffect, useState } from "react";

export default function Pricing() {
  const [loading, setLoading] = useState(null);
  const [demandMultiplier, setDemandMultiplier] = useState(1);

  // ===============================
  // 📡 LIVE DEMAND FETCH (HOOK INTO BACKEND LATER)
  // ===============================
  useEffect(() => {
    const fetchDemand = async () => {
      try {
        const res = await fetch("/api/demand-metrics");
        const data = await res.json();

        // fallback safe
        setDemandMultiplier(data?.multiplier || 1);
      } catch (e) {
        setDemandMultiplier(1);
      }
    };

    fetchDemand();

    // refresh every 30s (live pricing feel)
    const interval = setInterval(fetchDemand, 30000);
    return () => clearInterval(interval);
  }, []);

  const subscribe = async (priceId) => {
    if (loading) return;

    try {
      setLoading(priceId);

      const res = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          priceId,
          mode: "subscription",
          demandMultiplier, // 🔥 IMPORTANT: send pricing context
          source: "pricing_page_v2",
        }),
      });

      const data = await res.json();

      if (!res.ok || !data?.url) {
        throw new Error(data?.error || "Checkout failed");
      }

      window.location.href = data.url;
    } catch (err) {
      console.error(err);
      alert("Checkout failed. Try again.");
    } finally {
      setLoading(null);
    }
  };

  const plans = [
    {
      name: "Starter Territory",
      basePrice: 499,
      desc: "5–10 exclusive roofing opportunities",
      id: "price_STARTER_ID",
      cta: "Lock Territory",
    },
    {
      name: "Growth Territory",
      basePrice: 999,
      desc: "15–30 high-intent homeowners",
      id: "price_GROWTH_ID",
      cta: "Scale Leads",
      highlight: true,
    },
    {
      name: "Elite Exclusivity",
      basePrice: 1999,
      desc: "Full city control + priority routing",
      id: "price_DOMINATION_ID",
      cta: "Own Market",
    },
  ];

  return (
    <main className="bg-white text-gray-900">

      {/* LIVE SYSTEM STATUS */}
      <div className="bg-black text-white text-center py-3 text-sm">
        ⚡ Live demand multiplier:{" "}
        <span className="font-bold">
          {demandMultiplier.toFixed(2)}x
        </span>{" "}
        — pricing adjusts with lead demand
      </div>

      {/* HERO */}
      <section className="max-w-5xl mx-auto px-6 py-16 text-center">
        <h1 className="text-4xl font-bold">
          Exclusive Roofing Leads by Territory
        </h1>

        <p className="mt-4 text-gray-600">
          Real-time routing engine assigns homeowners to one contractor per city.
        </p>
      </section>

      {/* PRICING */}
      <section className="max-w-6xl mx-auto px-6 pb-16 grid md:grid-cols-3 gap-8">
        {plans.map((plan) => {
          const dynamicPrice = Math.round(
            plan.basePrice * demandMultiplier
          );

          return (
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

              {/* 🔥 DYNAMIC PRICE */}
              <p className="text-2xl font-bold mt-2">
                ${dynamicPrice} / month
              </p>

              <p className="text-sm text-gray-500 mt-2">
                {plan.desc}
              </p>

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
                Pricing increases with demand. Lock early for lower rates.
              </p>
            </div>
          );
        })}
      </section>

      {/* LEAD MARKET */}
      <section className="max-w-5xl mx-auto px-6 pb-20 text-center">
        <h2 className="text-2xl font-bold">
          Or Buy Individual Leads (Real-Time Market)
        </h2>

        <p className="text-gray-600 mt-2">
          Prices fluctuate based on demand + contractor saturation.
        </p>

        <div className="grid md:grid-cols-3 gap-6 mt-10 text-left">
          {[
            { name: "Hot Lead", base: 49 },
            { name: "Verified Lead", base: 99 },
            { name: "Exclusive Lead", base: 149 },
          ].map((lead) => (
            <div key={lead.name} className="border rounded-xl p-6">
              <h3 className="font-bold">{lead.name}</h3>

              <p className="text-gray-600">
                ${Math.round(lead.base * demandMultiplier)}
              </p>

              <p className="text-xs text-gray-500 mt-2">
                Demand-adjusted pricing
              </p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}