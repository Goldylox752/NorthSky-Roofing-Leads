"use client";

import { useState, useRef } from "react";

export default function LeadForm() {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    city: "",
    message: "",
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [aiReply, setAiReply] = useState("");

  // =========================
  // 🔐 IDEMPOTENCY KEY (CLIENT SIDE)
  // =========================
  const idempotencyKeyRef = useRef(null);

  const getIdempotencyKey = () => {
    if (!idempotencyKeyRef.current) {
      idempotencyKeyRef.current =
        crypto.randomUUID?.() ||
        `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    }
    return idempotencyKeyRef.current;
  };

  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  // =========================
  // 🚀 SUBMIT (RESILIENT)
  // =========================
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (loading) return;

    setLoading(true);
    setError("");
    setSuccess("");
    setAiReply("");

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-idempotency-key": getIdempotencyKey(),
        },
        signal: controller.signal,
        body: JSON.stringify({
          name: form.name,
          phone: form.phone,
          email: form.email,
          location: form.city,
          message: form.message,
          source: "website_form",
        }),
      });

      clearTimeout(timeout);

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Request failed");
      }

      // =========================
      // SUCCESS STATES
      // =========================
      setSuccess(
        data.duplicate
          ? "We already received your request — we’ll be in touch soon."
          : "Request received. You’ll be contacted shortly."
      );

      setAiReply(data.aiMessage || "");

      setForm({
        name: "",
        phone: "",
        email: "",
        city: "",
        message: "",
      });

      // reset idempotency for next lead
      idempotencyKeyRef.current = null;
    } catch (err) {
      if (err.name === "AbortError") {
        setError("Request timed out. Please try again.");
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      clearTimeout(timeout);
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Get Your Free Estimate</h2>

      <form onSubmit={handleSubmit} style={styles.form}>
        <input
          name="name"
          placeholder="Full Name"
          value={form.name}
          onChange={handleChange}
          style={styles.input}
        />

        <input
          name="phone"
          placeholder="Phone Number"
          value={form.phone}
          onChange={handleChange}
          style={styles.input}
          required
        />

        <input
          name="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          style={styles.input}
        />

        <input
          name="city"
          placeholder="City"
          value={form.city}
          onChange={handleChange}
          style={styles.input}
          required
        />

        <textarea
          name="message"
          placeholder="Tell us what you need..."
          value={form.message}
          onChange={handleChange}
          style={styles.textarea}
        />

        <button type="submit" style={styles.button} disabled={loading}>
          {loading ? "Sending..." : "Get Estimate"}
        </button>

        {success && <p style={styles.success}>{success}</p>}
        {error && <p style={styles.error}>{error}</p>}

        {aiReply && (
          <div style={styles.aiBox}>
            <strong>Instant AI Response:</strong>
            <p>{aiReply}</p>
          </div>
        )}
      </form>
    </div>
  );
}