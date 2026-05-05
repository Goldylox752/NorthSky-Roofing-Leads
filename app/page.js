"use client";

import { useState } from "react";

export default function Page() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    city: "",
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [leadId, setLeadId] = useState(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async () => {
    if (loading) return;

    if (!form.email || !form.phone) {
      alert("Email and phone are required.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/leads`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          source: "landing_page",
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Request failed");
      }

      setLeadId(data.lead?.id || null);
      setSuccess(true);

      setForm({
        name: "",
        email: "",
        phone: "",
        city: "",
      });
    } catch (err) {
      alert("Submission failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={styles.main}>
      <div style={styles.container}>

        {/* =========================
            HERO SECTION (HOOK STACK)
        ========================= */}
        <h1 style={styles.h1}>
          Exclusive Roofing Leads.<br />
          <span style={{ color: "#00ffb3" }}>
            Only 1 Contractor Per City.
          </span>
        </h1>

        <p style={styles.subtext}>
          Stop paying for shared leads. Get real homeowners ready to hire —
          delivered directly to your business.
        </p>

        {/* VALUE ANCHOR */}
        <div style={styles.priceTag}>
          Leads range: <b>$15 – $50 each</b>
        </div>

        {/* TRUST / PROOF BAR */}
        <div style={styles.trustBar}>
          ✔ Verified homeowners  
          ✔ Real-time AI routing  
          ✔ No shared leads  
          ✔ Cancel anytime  
        </div>

        {/* =========================
            SUCCESS STATE
        ========================= */}
        {success ? (
          <div style={styles.successBox}>
            <h2>Application Received ✔</h2>

            <p>
              Your contractor profile is now in the approval queue.
            </p>

            <p style={styles.meta}>
              Tracking ID: <b>{leadId}</b>
            </p>

            <p style={styles.nextSteps}>
              Expect approval within 24 hours if your city is available.
            </p>
          </div>
        ) : (
          <div style={styles.formBox}>

            <h3 style={styles.formTitle}>
              Get Exclusive Access
            </h3>

            <p style={styles.formSub}>
              Join limited contractors per city before slots fill.
            </p>

            <input name="name" placeholder="Full Name" value={form.name} onChange={handleChange} style={styles.input} />
            <input name="email" placeholder="Email *" value={form.email} onChange={handleChange} style={styles.input} />
            <input name="phone" placeholder="Phone *" value={form.phone} onChange={handleChange} style={styles.input} />
            <input name="city" placeholder="Service City" value={form.city} onChange={handleChange} style={styles.input} />

            <button
              onClick={handleSubmit}
              disabled={loading}
              style={{
                ...styles.button,
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading
                ? "Processing..."
                : "Claim Your City Access"}
            </button>

            <p style={styles.micro}>
              ⚡ Only 1–3 contractors allowed per city
            </p>
          </div>
        )}

        {/* =========================
            HOW IT WORKS (BIG CONVERSION BOOST)
        ========================= */}
        <div style={styles.valueBox}>
          <h3>How RoofFlow Works</h3>

          <ol>
            <li>Apply for your city access</li>
            <li>Get approved within 24 hours</li>
            <li>Receive exclusive homeowner leads</li>
            <li>Pay only per lead ($15–$50)</li>
          </ol>
        </div>

        {/* =========================
            WHY IT CONVERTS SECTION
        ========================= */}
        <div style={styles.valueBox}>
          <h3>Why Contractors Switch to RoofFlow</h3>

          <ul>
            <li>🔥 No more shared leads</li>
            <li>💰 Pay only for real homeowners</li>
            <li>📍 Territory exclusivity per city</li>
            <li>⚡ AI-powered routing system</li>
          </ul>
        </div>

        {/* FINAL CTA (IMPORTANT) */}
        <div style={styles.finalCTA}>
          Ready to dominate your city? Apply now before slots fill.
        </div>

      </div>
    </main>
  );
}