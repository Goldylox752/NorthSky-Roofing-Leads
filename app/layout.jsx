"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function RootLayout({ children }) {
  const pathname = usePathname();

  const navItems = [
    { label: "Home", href: "/" },
    { label: "Buy Leads", href: "/buy" },
    { label: "Dashboard", href: "/dashboard" },
    { label: "Admin", href: "/admin" },
  ];

  return (
    <html lang="en">
      <body style={styles.body}>
        {/* NAVBAR */}
        <header style={styles.navbar}>
          <div style={styles.logo}>RoofFlow</div>

          <nav style={styles.nav}>
            {navItems.map((item) => {
              const active = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  style={{
                    ...styles.link,
                    opacity: active ? 1 : 0.7,
                    borderBottom: active
                      ? "2px solid #4da3ff"
                      : "2px solid transparent",
                  }}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </header>

        {/* PAGE CONTENT */}
        <main style={styles.main}>{children}</main>
      </body>
    </html>
  );
}

const styles = {
  body: {
    margin: 0,
    fontFamily: "system-ui",
    background: "#0b1220",
    color: "white",
  },

  navbar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "14px 24px",
    borderBottom: "1px solid #1f2937",
    position: "sticky",
    top: 0,
    background: "#0b1220",
    zIndex: 100,
  },

  logo: {
    fontWeight: "bold",
    fontSize: "18px",
    color: "#4da3ff",
  },

  nav: {
    display: "flex",
    gap: "18px",
  },

  link: {
    color: "white",
    textDecoration: "none",
    fontSize: "14px",
    paddingBottom: "4px",
    transition: "0.2s",
  },

  main: {
    minHeight: "100vh",
  },
};