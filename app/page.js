main page


"use client";

import { useEffect } from "react";

export default function Home() {
  const trackCTA = async (eventName) => {
    try {
      await fetch("/api/event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event: eventName,
          page: "/",
          timestamp: Date.now(),
        }),
      });
    } catch (err) {
      console.error("Tracking failed:", err);
    }
  };

  useEffect(() => {
    const onScroll = () => {
      const scrollProgress =
        window.scrollY /
        (document.documentElement.scrollHeight - window.innerHeight);

      if (scrollProgress > 0.5 && !window.__tracked) {
        window.__tracked = true;
        trackCTA("scroll_50");
      }
    };

    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <main style={styles.page}>
      <section style={styles.hero}>
        <div style={styles.badge}>RoofFlow — Roofing Job Booking System</div>

        <h1 style={styles.h1}>
          We Book Roofing Jobs<br />Directly Into Your Calendar
        </h1>

        <p style={styles.p}>
          No shared leads. No chasing homeowners. No competition.
          <br /><br />
          <b>Just qualified roofing appointments sent directly to you.</b>
        </p>

        <a
          href="/apply"
          onClick={() => trackCTA("apply_click")}
          style={styles.btn}
        >
          Apply For Your City
        </a>

        <p style={styles.small}>
          We only onboard a limited number of contractors per city.
        </p>
      </section>

      <section style={styles.card}>
        <h2>Who This Is For</h2>
        <ul>
          <li>Roofing contractors already doing consistent jobs</li>
          <li>Companies spending on ads or lead platforms</li>
          <li>Teams who want predictable booked work</li>
        </ul>
      </section>

      <section style={styles.card}>
        <h2>What We Do Instead</h2>
        <ul>
          <li>Filter homeowners before you see them</li>
          <li>Identify real roofing intent</li>
          <li>Book only confirmed appointments</li>
        </ul>
      </section>
    </main>
  );
}

const styles = {
  page: {
    fontFamily: "Inter, sans-serif",
    background: "#0b1220",
    color: "#fff",
    minHeight: "100vh",
    padding: 20,
  },
  hero: {
    textAlign: "center",
    padding: "80px 20px",
  },
  badge: {
    fontSize: 12,
    opacity: 0.7,
    marginBottom: 10,
  },
  h1: {
    fontSize: 48,
    fontWeight: 800,
    lineHeight: 1.1,
  },
  p: {
    maxWidth: 700,
    margin: "20px auto",
    opacity: 0.8,
  },
  small: {
    fontSize: 12,
    opacity: 0.6,
    marginTop: 10,
  },
  btn: {
    display: "inline-block",
    background: "#4f46e5",
    padding: "14px 20px",
    borderRadius: 10,
    color: "#fff",
    textDecoration: "none",
    marginTop: 20,
  },
  card: {
    maxWidth: 900,
    margin: "20px auto",
    background: "#121a2b",
    padding: 20,
    borderRadius: 12,
    border: "1px solid #24314d",
  },
};