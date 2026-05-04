"use client";

import Link from "next/link";

export default function Navbar() {
  return (
    <nav style={nav}>
      <div style={{ fontWeight: "bold" }}>RoofFlow OS</div>

      <div style={links}>
        <Link href="/">Home</Link>
        <Link href="/dashboard">Dashboard</Link>
        <Link href="/admin">Admin</Link>
        <Link href="/contractor">Contractor</Link>
      </div>
    </nav>
  );
}

const nav = {
  display: "flex",
  justifyContent: "space-between",
  padding: 20,
  background: "#111827",
  color: "white",
};

const links = {
  display: "flex",
  gap: 20,
};