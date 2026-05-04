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
      alert("Please complete required fields.");
      return;
    }

    if (!API_URL) {
      alert("Backend not connected.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/lead`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...form,
          source: "landing_page",
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Request failed");
      }

      setSuccess(true);

      setForm({
        name: "",
        email: "",
        phone: "",
        city: "",
      });
    } catch (err) {
      console.error(err);
      alert("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={styles.main}>
      <div style={styles.container}>
        <h1 style={styles.h1}>
          Stop Chasing Roofing Leads.<br />Start Closing Them.
        </h1>

        <p style={styles.subtext}>
          RoofFlow delivers exclusive, high-intent roofing jobs directly to contractors.
          No competition. No wasted spend.
        </p>

        {/* SUCCESS STATE */}
        {success ? (
          <div style={styles.successBox}>
            <h2>Application Received ✔</h2>
            <p>We’ll review your application within 24 hours.</p>
          </div>
        ) : (
          <div style={styles.formBox}>
            <input
              name="name"
              placeholder="Name"
              value={form.name}
              onChange={handleChange}
              style={styles.input}
            />
            <input
              name="email"
              placeholder="Email *"
              value={form.email}
              onChange={handleChange}
              style={styles.input}
            />
            <input
              name="phone"
              placeholder="Phone *"
              value={form.phone}
              onChange={handleChange}
              style={styles.input}
            />
            <input
              name="city"
              placeholder="Service City"
              value={form.city}
              onChange={handleChange}
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
              {loading ? "Processing..." : "Apply For Exclusive Access"}
            </button>

            <p style={styles.micro}>
              ⚡ Only 2–3 contractors accepted per city
            </p>
          </div>
        )}

        <div style={styles.section}>
          <h2>What You Get</h2>
          <ul style={styles.list}>
            <li>✔ High-intent homeowner requests</li>
            <li>✔ AI-qualified leads (no tire kickers)</li>
            <li>✔ Direct SMS + call delivery</li>
            <li>✔ Zero shared leads</li>
          </ul>
        </div>

        <div style={styles.section}>
          <h2>Why Contractors Are Switching</h2>
          <ul style={styles.list}>
            <li>❌ Paying for junk leads</li>
            <li>❌ Competing with multiple contractors</li>
            <li>❌ Wasting ad spend</li>
          </ul>
        </div>
      </div>
    </main>
  );
}