"use client";

import { useState, useMemo } from "react";

export default function Apply() {
  const [step, setStep] = useState(1);

  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [plan, setPlan] = useState("growth");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [lastSubmit, setLastSubmit] = useState(0);

  // 🕳️ honeypot field (bot trap)
  const [website, setWebsite] = useState("");

  const isValidEmail = (v) => /\S+@\S+\.\S+/.test(v);

  const disposableDomains = [
    "mailinator.com",
    "tempmail.com",
    "10minutemail.com",
    "guerrillamail.com",
    "yopmail.com",
    "trashmail.com",
  ];

  const isDisposableEmail = (email) => {
    const domain = email.split("@")[1];
    return disposableDomains.includes(domain);
  };

  const normalizePhone = (v) => v.replace(/\D/g, "");

  const formatPhone = (value) => {
    const digits = normalizePhone(value).slice(0, 10);

    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  };

  const handlePhoneChange = (e) => {
    setPhone(formatPhone(e.target.value));
  };

  const cleanedPhone = useMemo(() => normalizePhone(phone), [phone]);

  const isValidPhone = cleanedPhone.length === 10;

  const detectRegion = (digits) => {
    if (digits.startsWith("1")) return "US/CA (+1)";
    return "Local";
  };

  const region = useMemo(() => detectRegion(cleanedPhone), [cleanedPhone]);

  // 🧠 improved lead scoring (AI-ready structure)
  const leadScore = useMemo(() => {
    let score = 0;

    if (isValidEmail(email)) score += 40;
    if (isValidPhone) score += 40;
    if (!email.includes("gmail")) score += 10;
    if (email.startsWith("info@") || email.startsWith("admin@")) score += 10;

    return Math.min(score, 100);
  }, [email, isValidPhone]);

  const isQualified = leadScore >= 80;

  const handleNext = () => {
    setError("");

    if (!isValidEmail(email)) {
      setError("Please enter a valid business email.");
      return;
    }

    if (isDisposableEmail(email)) {
      setError("Disposable emails are not allowed.");
      return;
    }

    setStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // 🕳️ bot detection
    if (website) {
      setError("Bot detected.");
      return;
    }

    // 🛡️ IP / spam cooldown
    const now = Date.now();
    if (now - lastSubmit < 10000) {
      setError("Please wait before submitting again.");
      return;
    }
    setLastSubmit(now);

    if (!isValidPhone) {
      setError("Please enter a valid 10-digit phone number.");
      return;
    }

    if (!isQualified) {
      setError("We only accept qualified roofing contractors.");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        email,
        phone: cleanedPhone,
        plan,
        lead_score: leadScore,
        region,
        source: "apply_form",
        hot_lead: leadScore >= 90,
      };

      // 1️⃣ SAVE LEAD
      await fetch("/api/leads/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      // 2️⃣ CHECKOUT
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data?.error || "Checkout failed");

      if (data?.url) window.location.href = data.url;

    } catch (err) {
      setError(err.message || "Something went wrong. Try again.");
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>

        {/* 🕳️ honeypot field (hidden) */}
        <input
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          style={{ display: "none" }}
          tabIndex="-1"
          autoComplete="off"
        />

        <h1 style={styles.h1}>Apply to RoofFlow</h1>

        <p style={styles.subtext}>
          Automated roofing appointments delivered directly to your pipeline
        </p>

        {/* 🚨 HOT LEAD BADGE */}
        <p style={{
          fontSize: 13,
          fontWeight: "bold",
          marginTop: 8,
          color: isQualified ? "#22c55e" : "#f87171"
        }}>
          {isQualified ? "🔥 Hot Qualified Lead" : "⚠️ Not Qualified Yet"}
        </p>

        <p style={styles.step}>Step {step} of 2</p>

        <p style={styles.badges}>
          🌎 {region} · 🛡️ Anti-spam enabled · ⚡ AI scoring active
        </p>

        <div style={styles.planBox}>
          <p style={styles.labelSmall}>Select Plan</p>

          <select
            value={plan}
            onChange={(e) => setPlan(e.target.value)}
            style={styles.select}
          >
            <option value="starter">Starter — $499/mo</option>
            <option value="growth">Growth — $999/mo</option>
            <option value="domination">Domination — $1,999/mo</option>
          </select>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          {step === 1 && (
            <>
              <label style={styles.label}>Business Email</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                style={styles.input}
              />

              <button type="button" onClick={handleNext} style={styles.button}>
                Continue
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <label style={styles.label}>Phone Number</label>
              <input
                value={phone}
                onChange={handlePhoneChange}
                placeholder="(780) 123-4567"
                style={styles.input}
              />

              <button type="submit" style={styles.button} disabled={loading}>
                {loading ? "Redirecting..." : "Continue to Payment"}
              </button>
            </>
          )}

          {error && <p style={styles.error}>{error}</p>}
        </form>
      </div>
    </div>
  );
}
