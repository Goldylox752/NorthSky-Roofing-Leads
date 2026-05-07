"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function SuccessPage() {
  const [status, setStatus] = useState("verifying");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");

  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    const verify = async () => {
      try {
        const session_id = new URLSearchParams(window.location.search).get(
          "session_id"
        );

        if (!session_id) {
          setStatus("error");
          setMessage("Missing session ID");
          return;
        }

        if (!API_URL) {
          setStatus("error");
          setMessage("Backend not configured");
          return;
        }

        const res = await fetch(
          `${API_URL}/api/stripe/verify-session`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ session_id }),
          }
        );

        const data = await res.json();

        if (!res.ok || !data?.success) {
          throw new Error(data?.error || "Verification failed");
        }

        setEmail(data.email || "");
        setStatus("active");

        // 🔥 store activation state locally (important for dashboard gating)
        localStorage.setItem("isActive", "true");
      } catch (err) {
        console.error(err);
        setStatus("error");
        setMessage("Payment verification failed");
      }
    };

    verify();
  }, []);

  // =====================
  // LOADING STATE
  // =====================
  if (status === "verifying") {
    return (
      <main style={styles.container}>
        <div style={styles.card}>
          <h1 style={styles.title}>Verifying Payment...</h1>
          <p style={styles.text}>
            Confirming your activation with Stripe and syncing your account.
          </p>
        </div>
      </main>
    );
  }

  // =====================
  // ERROR STATE
  // =====================
  if (status === "error") {
    return (
      <main style={styles.container}>
        <div style={styles.card}>
          <h1 style={styles.title}>Payment Verification Failed</h1>
          <p style={styles.text}>{message}</p>

          <div style={styles.actions}>
            <Link href="/" style={styles.secondaryBtn}>
              Back to Home
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // =====================
  // SUCCESS STATE
  // =====================
  return (
    <main style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>🎉 You're Live</h1>

        <p style={styles.text}>
          Your contractor account is now active and receiving leads.
        </p>

        {email && (
          <p style={styles.subtext}>
            Activated account: <b>{email}</b>
          </p>
        )}

        <div style={styles.statusBox}>
          <p>✔ Payment confirmed</p>
          <p>✔ Account activated in system</p>
          <p>✔ Lead delivery enabled</p>
        </div>

        <p style={styles.note}>
          You may start receiving leads within minutes depending on demand in your area.
        </p>

        <div style={styles.actions}>
          <Link href="/dashboard" style={styles.primaryBtn}>
            Go to Dashboard
          </Link>

          <Link href="/" style={styles.secondaryBtn}>
            Back to Home
          </Link>
        </div>
      </div>
    </main>
  );
}

/* ===============================
   STYLES (UNCHANGED BUT CLEANED)
=============================== */
const styles = {
  container: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#0b0f19",
    color: "#fff",
    padding: 20,
  },
  card: {
    maxWidth: 600,
    width: "100%",
    background: "#111827",
    padding: 40,
    borderRadius: 12,
    textAlign: "center",
  },
  title: {
    fontSize: 32,
    marginBottom: 10,
  },
  text: {
    fontSize: 16,
    color: "#cbd5e1",
  },
  subtext: {
    fontSize: 14,
    color: "#94a3b8",
    marginTop: 10,
  },
  statusBox: {
    marginTop: 20,
    textAlign: "left",
    background: "#0f172a",
    padding: 15,
    borderRadius: 8,
    fontSize: 14,
  },
  note: {
    marginTop: 15,
    fontSize: 12,
    color: "#94a3b8",
  },
  actions: {
    marginTop: 25,
    display: "flex",
    justifyContent: "center",
    gap: 10,
  },
  primaryBtn: {
    background: "#22c55e",
    padding: "12px 20px",
    borderRadius: 8,
    color: "#000",
    textDecoration: "none",
    fontWeight: "bold",
  },
  secondaryBtn: {
    background: "#1f2937",
    padding: "12px 20px",
    borderRadius: 8,
    color: "#fff",
    textDecoration: "none",
  },
};