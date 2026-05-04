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

  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async () => {
    // validation
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
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error("Request failed");
      }

      alert("Application submitted. We’ll contact you within 24 hours.");

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

        <div style={styles.formBox}>
          <input name="name" placeholder="Name" value={form.name} onChange={handleChange} style={styles.input} />
          <input name="email" placeholder="Email *" value={form.email} onChange={handleChange} style={styles.input} />
          <input name="phone" placeholder="Phone *" value={form.phone} onChange={handleChange} style={styles.input} />
          <input name="city" placeholder="Service City" value={form.city} onChange={handleChange} style={styles.input} />

          <button onClick={handleSubmit} style={styles.button}>
            {loading ? "Processing..." : "Apply For Exclusive Access"}
          </button>

          <p style={styles.micro}>⚡ Only 2–3 contractors accepted per city</p>
        </div>

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

        <div style={styles.finalCta}>
          <h2>Apply Now</h2>
          <p style={styles.text}>
            We review every contractor manually. If approved, onboarding happens within 24 hours.
          </p>
        </div>
      </div>
    </main>
  );
}

const styles = {
  main: {
    background: "#0b1220",
    color: "white",
    fontFamily: "system-ui",
    padding: "40px 20px",
  },
  container: {
    maxWidth: "750px",
    margin: "0 auto",
    textAlign: "center",
  },
  h1: {
    fontSize: "48px",
    marginBottom: "15px",
  },
  subtext: {
    opacity: 0.8,
    marginBottom: "30px",
  },
  formBox: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    marginBottom: "40px",
  },
  input: {
    padding: "14px",
    borderRadius: "8px",
    border: "none",
  },
  button: {
    padding: "16px",
    background: "#4da3ff",
    border: "none",
    borderRadius: "8px",
    fontWeight: "bold",
    cursor: "pointer",
  },
  micro: {
    fontSize: "12px",
    opacity: 0.6,
  },
  section: {
    marginTop: "50px",
  },
  text: {
    opacity: 0.8,
    lineHeight: "1.6",
  },
  list: {
    listStyle: "none",
    padding: 0,
    opacity: 0.85,
  },
  finalCta: {
    marginTop: "60px",
  },
};