"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/router";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function Dashboard() {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [access, setAccess] = useState(false);

  useEffect(() => {
    const checkAccess = async () => {
      try {
        const email = localStorage.getItem("user_email");

        // ❌ no email = no access
        if (!email) {
          router.push("/");
          return;
        }

        // 🔥 REAL CHECK AGAINST BACKEND (NOT TRUST LOCAL STATE)
        const res = await fetch(`${API_URL}/api/dashboard/access`, {
          method: "GET",
          headers: {
            "x-user-email": email,
          },
        });

        if (!res.ok) {
          router.push("/");
          return;
        }

        const data = await res.json();

        // backend decides if paid or not
        if (!data?.active) {
          router.push("/");
          return;
        }

        setUser({
          email,
          plan: data.plan || "starter",
        });

        setAccess(true);
      } catch (err) {
        console.error(err);
        router.push("/");
      } finally {
        setLoading(false);
      }
    };

    checkAccess();
  }, []);

  // =====================
  // LOADING
  // =====================
  if (loading) {
    return (
      <div style={{ padding: 40 }}>
        <h2>Loading dashboard...</h2>
      </div>
    );
  }

  // =====================
  // BLOCKED
  // =====================
  if (!access) {
    return (
      <div style={{ padding: 40 }}>
        <h2>Access denied</h2>
        <p>No active subscription found.</p>
      </div>
    );
  }

  // =====================
  // DASHBOARD
  // =====================
  return (
    <div style={{ padding: 40 }}>
      <h1>NorthSky Flow OS</h1>

      <p>Logged in as: {user.email}</p>
      <p>Plan: {user.plan}</p>

      <div style={{ marginTop: 20 }}>
        <h3>📊 System Status</h3>

        <ul>
          <li>Lead system: Active</li>
          <li>Stripe billing: Connected</li>
          <li>Automation: Running</li>
        </ul>
      </div>
    </div>
  );
}