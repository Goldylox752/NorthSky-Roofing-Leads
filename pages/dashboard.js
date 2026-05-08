"use client";

import { useEffect, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [access, setAccess] = useState(false);
  const [data, setData] = useState(null);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const email = localStorage.getItem("user_email");

        if (!email) {
          setAccess(false);
          setLoading(false);
          return;
        }

        /* ===============================
           VERIFY ACCESS
        =============================== */
        const accessRes = await fetch(`${API_URL}/api/dashboard`, {
          headers: {
            "x-user-email": email,
          },
        });

        if (!accessRes.ok) {
          setAccess(false);
          setLoading(false);
          return;
        }

        setAccess(true);

        /* ===============================
           LOAD REVENUE DATA
        =============================== */
        const res = await fetch(`${API_URL}/api/analytics/revenue`);
        const json = await res.json();

        setData(json);

      } catch (err) {
        console.error(err);
        setAccess(false);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  /* ===============================
     LOADING STATE
  =============================== */
  if (loading) {
    return (
      <div style={{ padding: 40 }}>
        <h2>Loading dashboard...</h2>
      </div>
    );
  }

  /* ===============================
     ACCESS DENIED
  =============================== */
  if (!access) {
    return (
      <div style={{ padding: 40 }}>
        <h2>Access denied</h2>
        <p>You are not an active user.</p>
      </div>
    );
  }

  /* ===============================
     DASHBOARD UI
  =============================== */
  return (
    <div style={{ padding: 40 }}>
      <h1>NorthSky Dashboard</h1>

      <p>📊 Live System Overview</p>

      {/* ===================== */}
      {/* REVENUE SECTION */}
      {/* ===================== */}
      <div style={{ marginTop: 20 }}>
        <h3>💰 Revenue</h3>

        {data ? (
          <>
            <p>
              Total Revenue: $
              {(data.totalRevenue / 100).toFixed(2)}
            </p>

            <p>Total Leads: {data.totalLeads}</p>
            <p>Paid Leads: {data.paidLeads}</p>
            <p>Conversion Rate: {data.conversionRate}%</p>
          </>
        ) : (
          <p>Loading revenue...</p>
        )}
      </div>

      {/* ===================== */}
      {/* SYSTEM STATUS */}
      {/* ===================== */}
      <div style={{ marginTop: 30 }}>
        <h3>⚙️ System Status</h3>
        <ul>
          <li>Leads Engine: Active</li>
          <li>Stripe Payments: Connected</li>
          <li>Webhook Processing: Live</li>
          <li>Revenue Tracking: Enabled</li>
        </ul>
      </div>
    </div>
  );
}