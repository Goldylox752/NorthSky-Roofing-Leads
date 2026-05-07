"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getUser = async () => {
      const { data, error } = await supabase.auth.getUser();

      if (error) {
        console.error(error);
        setLoading(false);
        return;
      }

      setUser(data?.user || null);
      setLoading(false);
    };

    getUser();
  }, []);

  // 🔒 loading state
  if (loading) {
    return (
      <div style={{ padding: 40 }}>
        <h2>Loading dashboard...</h2>
      </div>
    );
  }

  // 🔒 not logged in
  if (!user) {
    return (
      <div style={{ padding: 40 }}>
        <h2>Access denied</h2>
        <p>Please log in to view your dashboard.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: 40 }}>

      <h1>Welcome to NorthSky Flow OS</h1>

      <p>Logged in as: {user.email}</p>

      <div style={{ marginTop: 20 }}>
        <h3>📊 Next steps</h3>
        <ul>
          <li>Connect your lead sources</li>
          <li>View incoming leads</li>
          <li>Track revenue</li>
        </ul>
      </div>

    </div>
  );
}