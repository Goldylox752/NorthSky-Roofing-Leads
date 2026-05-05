"use client";

import { useEffect, useMemo, useState } from "react";

export default function Pricing() {
  const [loading, setLoading] = useState(null);

  // CURRENT + PREDICTED DEMAND
  const [currentMultiplier, setCurrentMultiplier] = useState(1);
  const [forecastMultiplier, setForecastMultiplier] = useState(1);
  const [city, setCity] = useState("global");

  // ===============================
  // 📡 LOAD MARKET INTELLIGENCE
  // ===============================
  useEffect(() => {
    const fetchDemand = async () => {
      try {
        const res = await fetch("/api/demand-metrics?city=" + city);
        const data = await res.json();

        setCurrentMultiplier(data?.current || 1);
        setForecastMultiplier(data?.forecast || data?.current || 1);
      } catch {
        setCurrentMultiplier(1);
        setForecastMultiplier(1);
      }
    };

    fetchDemand();

    const interval = setInterval(fetchDemand, 30000);
    return () => clearInterval(interval);
  }, [city]);

  // ===============================
  // 🧠 STABILIZED PRICE ENGINE
  // prevents flickering / bot spikes
  // ===============================
  const stableMultiplier = useMemo(() => {
    // blend current + forecast (predictive pricing core)
    const blended =
      currentMultiplier * 0.6 + forecastMultiplier * 0.4;

    // clamp for safety (prevents runaway spikes)
    return Math.min(Math.max(blended, 0.8), 3.0);
  }, [currentMultiplier, forecastMultiplier]);

  // ===============================
  // 💳 CHECKOUT
  // ===============================
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
          demandMultiplier: stableMultiplier,
          city,
          source: "pricing_predictive_v2",
        }),
      });

      const data = await res.json();

      if (!res.ok || !data?.url) {
        throw new Error(data?.error || "Checkout failed");
      }

      window.location.href = data.url;
    } catch (err) {
      console.error(err);
      alert("Checkout failed");
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

      {/* 🧠 MARKET INTELLIGENCE BAR */}
      <div className="bg-black text-white text-center py-3 text-sm">
        Current: {currentMultiplier.toFixed(2)}x |
        Forecast: {forecastMultiplier.toFixed(2)}x |
        Stable: {stableMultiplier.toFixed(2)}x
      </div>

      {/* HERO */}
      <section className="max-w-5xl mx-auto px-6 py-16 text-center">
        <h1 className="text-4xl font-bold">
          Predictive Roofing Lead Pricing
        </h1>

        <p className="mt-4 text-gray-600">
          Prices adjust based on live demand + predicted market saturation.
        </p>
      </section>

      {/* PRICING */}
      <section className="max-w-6xl mx-auto px-6 pb-16 grid md:grid-cols-3 gap-8">
        {plans.map((plan) => {
          const dynamicPrice = Math.round(
            plan.basePrice * stableMultiplier
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
              <h2 className="text-xl font-bold">{plan.name}</h2>

              {/* 💰 PREDICTIVE PRICE */}
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
                Prices are forecast-adjusted based on market demand.
              </p>
            </div>
          );
        })}
      </section>

      {/* LEAD MARKET */}
      <section className="max-w-5xl mx-auto px-6 pb-20 text-center">
        <h2 className="text-2xl font-bold">
          Real-Time Lead Market
        </h2>

        <div className="grid md:grid-cols-3 gap-6 mt-10 text-left">
          {[
            { name: "Hot Lead", base: 49 },
            { name: "Verified Lead", base: 99 },
            { name: "Exclusive Lead", base: 149 },
          ].map((lead) => (
            <div key={lead.name} className="border rounded-xl p-6">
              <h3 className="font-bold">{lead.name}</h3>

              <p className="text-gray-600">
                ${Math.round(lead.base * stableMultiplier)}
              </p>

              <p className="text-xs text-gray-500 mt-2">
                Predictively priced inventory
              </p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}