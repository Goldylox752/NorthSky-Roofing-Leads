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

        // 🔒 no identity = block
        if (!email) {
          router.push("/");
          return;
        }

        const res = await fetch(`${API_URL}/api/dashboard`, {
          headers: {
            "x-user-email": email,
          },
        });

        if (!res.ok) {
          router.push("/");
          return;
        }

        const data = await res.json();

        setUser({ email });
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

  // 🔒 loading state
  if (loading) {
    return (
      <div style={{ padding: 40 }}>
        <h2>Loading dashboard...</h2>
      </div>
    );
  }

  // 🔒 blocked access
  if (!access) {
    return (
      <div style={{ padding: 40 }}>
        <h2>Access denied</h2>
        <p>You do not have an active subscription.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>NorthSky Flow OS</h1>

      <p>Logged in as: {user.email}</p>

      <div style={{ marginTop: 20 }}>
        <h3>📊 Dashboard</h3>

        <ul>
          <li>Lead system: Active</li>
          <li>Stripe billing: Connected</li>
          <li>Automation: Running</li>
        </ul>
      </div>
    </div>
  );
}