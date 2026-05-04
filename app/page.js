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

  // ===============================
  // SUBMIT → EVENT-DRIVEN PIPELINE ENTRY
  // ===============================
  const handleSubmit = async () => {
    if (loading) return;

    if (!form.email || !form.phone) {
      alert("Email and phone are required.");
      return;
    }

    if (!API_URL) {
      alert("System not connected.");
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

      // ===============================
      // CAPTURE LEAD ID (IMPORTANT FOR TRACKING)
      // ===============================
      setLeadId(data.lead?.id || null);
      setSuccess(true);

      // reset form
      setForm({
        name: "",
        email: "",
        phone: "",
        city: "",
      });

    } catch (err) {
      console.error(err);
      alert("Submission failed. Try again.");
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
        </p>

        {/* SUCCESS STATE */}
        {success ? (
          <div style={styles.successBox}>
            <h2>Application Received ✔</h2>
            <p>We’ll review your application within 24 hours.</p>

            {leadId && (
              <p style={styles.meta}>
                Tracking ID: {leadId}
              </p>
            )}
          </div>
        ) : (
          <div style={styles.formBox}>
            <input name="name" placeholder="Name" value={form.name} onChange={handleChange} style={styles.input} />
            <input name="email" placeholder="Email *" value={form.email} onChange={handleChange} style={styles.input} />
            <input name="phone" placeholder="Phone *" value={form.phone} onChange={handleChange} style={styles.input} />
            <input name="city" placeholder="Service City" value={form.city} onChange={handleChange} style={styles.input} />

            <button
              onClick={handleSubmit}
              disabled={loading}
              style={{ ...styles.button, opacity: loading ? 0.7 : 1 }}
            >
              {loading ? "Submitting..." : "Apply For Exclusive Access"}
            </button>

            <p style={styles.micro}>
              ⚡ Limited contractor slots per city
            </p>
          </div>
        )}
      </div>
    </main>
  );
}