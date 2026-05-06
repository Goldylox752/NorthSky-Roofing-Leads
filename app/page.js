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

      setLeadId(data.lead?.id);
      setSuccess(true);

      setForm({
        name: "",
        email: "",
        phone: "",
        city: "",
      });
    } catch (err) {
      alert("Submission failed. Try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ fontFamily: "Arial", padding: 40, maxWidth: 700, margin: "0 auto" }}>
      
      {/* HERO */}
      <h1 style={{ fontSize: 40, marginBottom: 10 }}>
        RoofFlow AI Leads
      </h1>

      <p style={{ marginBottom: 20 }}>
        Exclusive roofing leads. One contractor per city.
      </p>

      {/* FORM / SUCCESS */}
      {success ? (
        <div style={{ padding: 20, background: "#eaffea", borderRadius: 10 }}>
          <h2>Application Received ✔</h2>
          <p>We will review your request shortly.</p>
          <p><b>Tracking ID:</b> {leadId}</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          
          <input
            name="name"
            placeholder="Name"
            value={form.name}
            onChange={handleChange}
            style={inputStyle}
          />

          <input
            name="email"
            placeholder="Email *"
            value={form.email}
            onChange={handleChange}
            style={inputStyle}
          />

          <input
            name="phone"
            placeholder="Phone *"
            value={form.phone}
            onChange={handleChange}
            style={inputStyle}
          />

          <input
            name="city"
            placeholder="City"
            value={form.city}
            onChange={handleChange}
            style={inputStyle}
          />

          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{
              padding: 12,
              background: loading ? "#999" : "#000",
              color: "#fff",
              border: "none",
              cursor: "pointer",
            }}
          >
            {loading ? "Submitting..." : "Apply Now"}
          </button>
        </div>
      )}
    </main>
  );
}

const inputStyle = {
  padding: 12,
  border: "1px solid #ccc",
  borderRadius: 6,
};