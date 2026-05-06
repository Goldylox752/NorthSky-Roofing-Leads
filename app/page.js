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

  // ✅ SAFE fallback prevents broken deploy if env missing
  const API_URL =
    process.env.NEXT_PUBLIC_API_URL ||
    "https://your-backend.onrender.com";

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

      setLeadId(data.lead?.id ?? null);
      setSuccess(true);

      setForm({
        name: "",
        email: "",
        phone: "",
        city: "",
      });
    } catch (err) {
      console.error(err);
      alert(err.message || "Submission failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={styles.main}>
      <div style={styles.container}>

        {/* HERO */}
        <h1 style={styles.h1}>
          Exclusive Roofing Leads.<br />
          <span style={{ color: "#00ffb3" }}>
            Only 1 Contractor Per City.
          </span>
        </h1>

        <p style={styles.subtext}>
          Stop paying for shared leads. Get real homeowners ready to hire.
        </p>

        <div style={styles.priceTag}>
          Leads range: <b>$15 – $50 each</b>
        </div>

        <div style={styles.trustBar}>
          ✔ Verified homeowners ✔ AI routing ✔ No shared leads ✔ Cancel anytime
        </div>

        {/* SUCCESS STATE */}
        {success ? (
          <div style={styles.successBox}>
            <h2>Application Received ✔</h2>

            <p>Your contractor profile is in review.</p>

            <p style={styles.meta}>
              Tracking ID: <b>{leadId}</b>
            </p>

            <p style={styles.nextSteps}>
              Expect approval within 24 hours.
            </p>
          </div>
        ) : (
          <div style={styles.formBox}>

            <h3 style={styles.formTitle}>Get Exclusive Access</h3>

            <p style={styles.formSub}>
              Limited contractors per city.
            </p>

            <input name="name" placeholder="Full Name"
              value={form.name} onChange={handleChange}
              style={styles.input}
            />

            <input name="email" placeholder="Email *"
              value={form.email} onChange={handleChange}
              style={styles.input}
            />

            <input name="phone" placeholder="Phone *"
              value={form.phone} onChange={handleChange}
              style={styles.input}
            />

            <input name="city" placeholder="Service City"
              value={form.city} onChange={handleChange}
              style={styles.input}
            />

            <button
              onClick={handleSubmit}
              disabled={loading}
              style={{
                ...styles.button,
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? "Processing..." : "Claim Your City Access"}
            </button>

            <p style={styles.micro}>
              ⚡ Only 1–3 contractors per city
            </p>
          </div>
        )}

        {/* VALUE SECTION */}
        <div style={styles.valueBox}>
          <h3>How RoofFlow Works</h3>
          <ol>
            <li>Apply for city access</li>
            <li>Get approved within 24h</li>
            <li>Receive exclusive leads</li>
            <li>Pay per lead only</li>
          </ol>
        </div>

        <div style={styles.valueBox}>
          <h3>Why Contractors Switch</h3>
          <ul>
            <li>🔥 No shared leads</li>
            <li>💰 Pay per real homeowner</li>
            <li>📍 City exclusivity</li>
            <li>⚡ AI routing system</li>
          </ul>
        </div>

        <div style={styles.finalCTA}>
          Ready to dominate your city? Apply now.
        </div>

      </div>
    </main>
  );
}