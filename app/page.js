"use client";

import { useEffect, useState } from "react";

export default function Onboarding() {
  const [status, setStatus] = useState("Verifying payment...");
  const [done, setDone] = useState(false);

  useEffect(() => {
    const run = async () => {
      try {
        const sessionId = new URLSearchParams(window.location.search).get(
          "session_id"
        );

        const API_URL = process.env.NEXT_PUBLIC_API_URL;

        const res = await fetch(
          `${API_URL}/api/payments/verify-session`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ sessionId }),
          }
        );

        const data = await res.json();

        if (data.success) {
          setStatus("Account activated 🚀");

          setTimeout(() => {
            setDone(true);
            window.location.href = "/dashboard";
          }, 1500);
        } else {
          setStatus("Payment verification failed");
        }

      } catch (err) {
        console.error(err);
        setStatus("Something went wrong");
      }
    };

    run();
  }, []);

  return (
    <div style={{ padding: 60, textAlign: "center" }}>
      <h1>Setting up your account</h1>

      <p>{status}</p>

      {!done && <p>Please wait...</p>}
    </div>
  );
}