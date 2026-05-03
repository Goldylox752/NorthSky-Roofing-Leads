"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Home() {

  const API_BASE =
    process.env.NEXT_PUBLIC_API_URL ||
    "https://your-render-backend.onrender.com";

  const trackCTA = async (eventName) => {
    try {
      await fetch(`${API_BASE}/api/event`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event: eventName,
          page: "/",
          timestamp: Date.now(),
        }),
      });
    } catch (err) {
      console.log("Tracking failed (non-blocking)");
    }
  };

  useEffect(() => {
    let tracked = false;

    const onScroll = () => {
      const height =
        document.documentElement.scrollHeight - window.innerHeight;

      const progress = window.scrollY / height;

      if (progress > 0.5 && !tracked) {
        tracked = true;
        trackCTA("scroll_50");
      }
    };

    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <main style={styles.page}>

      {/* NAV */}
      <nav style={styles.nav}>
        <div style={styles.logo}>RoofFlow AI</div>

        <div style={styles.navLinks}>
          <Link href="/" style={styles.link}>Home</Link>
          <Link href="/pricing" style={styles.link}>Pricing</Link>
          <Link href="/apply" style={styles.link}>Apply</Link>
        </div>
      </nav>

      {/* HERO */}
      <section style={styles.hero}>
        <div style={styles.badge}>
          🚀 Exclusive Roofing Lead System
        </div>

        <h1 style={styles.h1}>
          Get High-Value Roofing Jobs<br />Without Paying for Shared Leads
        </h1>

        <p style={styles.sub}>
          We deliver <b>pre-qualified homeowners actively requesting roofing estimates</b>
          directly to contractors — no ads, no competition, no wasted time.
        </p>

        <div style={styles.ctaRow}>
          <Link
            href="/apply"
            onClick={() => trackCTA("apply_click")}
            style={styles.primaryBtn}
          >
            Apply For Territory
          </Link>

          <Link
            href="/pricing"
            onClick={() => trackCTA("pricing_click")}
            style={styles.secondaryBtn}
          >
            View Pricing
          </Link>
        </div>

        <p style={styles.small}>
          Limited contractors per city to protect lead exclusivity.
        </p>
      </section>

      {/* VALUE */}
      <section style={styles.card}>
        <h2>Why Contractors Switch</h2>
        <ul>
          <li>✔ Exclusive, non-shared roofing leads</li>
          <li>✔ Homeowners actively requesting quotes</li>
          <li>✔ AI filters low-quality inquiries</li>
          <li>✔ Automated follow-up increases booked jobs</li>
        </ul>
      </section>

      {/* HOW IT WORKS */}
      <section style={styles.card}>
        <h2>How It Works</h2>
        <ul>
          <li>1. Homeowners request roofing estimates</li>
          <li>2. AI qualifies urgency & intent</li>
          <li>3. You receive only high-value leads</li>
          <li>4. Automated follow-up closes more jobs</li>
        </ul>
      </section>

      {/* PROBLEM */}
      <section style={styles.highlight}>
        <h2>The Problem</h2>
        <p>
          Contractors waste thousands on shared leads and low-quality traffic.
        </p>
        <p>
          RoofFlow replaces that with <b>exclusive, intent-based job requests</b>.
        </p>
      </section>

      {/* SOCIAL PROOF */}
      <section style={styles.card}>
        <h2>Built for Growing Roofing Companies</h2>
        <p>
          Designed for contractors doing $500K+ annually who want predictable job flow.
        </p>
      </section>

      {/* FINAL CTA */}
      <section style={styles.final}>
        <h2>Ready to Claim Your Territory?</h2>

        <p>Applications are reviewed based on availability in your area.</p>

        <Link
          href="/apply"
          onClick={() => trackCTA("final_apply_click")}
          style={styles.primaryBtn}
        >
          Get Started
        </Link>
      </section>

    </main>
  );
}

/* ===================== */
/* STYLES (unchanged but clean) */
/* ===================== */

const styles = {
  page: {
    background: "#0b1220",
    color: "white",
    fontFamily: "Arial",
    minHeight: "100vh",
  },

  nav: {
    display: "flex",
    justifyContent: "space-between",
    padding: "20px 40px",
    borderBottom: "1px solid #1f2937",
  },

  logo: {
    fontWeight: "bold",
    color: "#22c55e",
  },

  navLinks: {
    display: "flex",
    gap: "20px",
  },

  link: {
    color: "#cbd5e1",
    textDecoration: "none",
  },

  hero: {
    textAlign: "center",
    padding: "100px 20px",
    maxWidth: "900px",
    margin: "auto",
  },

  badge: {
    display: "inline-block",
    background: "#1f2937",
    padding: "8px 14px",
    borderRadius: "20px",
    fontSize: "12px",
    marginBottom: "20px",
    color: "#a5b4fc",
  },

  h1: {
    fontSize: "44px",
    lineHeight: 1.2,
  },

  sub: {
    fontSize: "18px",
    color: "#cbd5e1",
    marginTop: "15px",
  },

  ctaRow: {
    marginTop: "25px",
    display: "flex",
    justifyContent: "center",
    gap: "15px",
    flexWrap: "wrap",
  },

  primaryBtn: {
    background: "#22c55e",
    color: "black",
    padding: "14px 20px",
    borderRadius: "10px",
    fontWeight: "bold",
    textDecoration: "none",
  },

  secondaryBtn: {
    background: "#1f2937",
    color: "white",
    padding: "14px 20px",
    borderRadius: "10px",
    textDecoration: "none",
  },

  small: {
    fontSize: "12px",
    color: "#94a3b8",
    marginTop: "10px",
  },

  card: {
    maxWidth: "900px",
    margin: "40px auto",
    background: "#111827",
    padding: "25px",
    borderRadius: "12px",
    border: "1px solid #1f2937",
  },

  highlight: {
    maxWidth: "900px",
    margin: "40px auto",
    background: "#0f172a",
    padding: "25px",
    borderRadius: "12px",
    border: "1px solid #22c55e",
  },

  final: {
    textAlign: "center",
    padding: "80px 20px",
  },
};