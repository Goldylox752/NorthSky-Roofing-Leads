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
  const [error, setError] = useState(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async () => {
    if (loading) return;

    setError(null);

    if (!API_URL) {
      setError("API not configured");
      return;
    }

    if (!form.email || !form.phone) {
      setError("Email and phone are required");
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

      if (!res.ok) {
        throw new Error(data?.error || "Request failed");
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
      console.error(err);
      setError("Submission failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={styles.container}>
      <h1>RoofFlow AI Leads</h1>

      <p>Exclusive roofing leads. One contractor per city.</p>

      {error && <p style={styles.error}>{error}</p>}

      {success ? (
        <div style={styles.success}>
          <h2>Application Received ✔</h2>
          <p>Tracking ID: {leadId}</p>
        </div>
      ) : (
        <div style={styles.form}>
          <input name="name" placeholder="Name" value={form.name} onChange={handleChange} style={styles.input} />
          <input name="email" placeholder="Email *" value={form.email} onChange={handleChange} style={styles.input} />
          <input name="phone" placeholder="Phone *" value={form.phone} onChange={handleChange} style={styles.input} />
          <input name="city" placeholder="City" value={form.city} onChange={handleChange} style={styles.input} />

          <button onClick={handleSubmit} disabled={loading} style={styles.button}>
            {loading ? "Submitting..." : "Apply Now"}
          </button>
        </div>
      )}
    </main>
  );
}

const styles = {
  container: {
    fontFamily: "Arial",
    padding: 40,
    maxWidth: 600,
    margin: "0 auto",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  input: {
    padding: 12,
    border: "1px solid #ccc",
    borderRadius: 6,
  },
  button: {
    padding: 12,
    background: "#000",
    color: "#fff",
    border: "none",
    cursor: "pointer",
  },
  success: {
    padding: 20,
    background: "#eaffea",
    borderRadius: 10,
  },
  error: {
    color: "red",
  },
};