import Sidebar from "@/components/Sidebar";

export default function RootLayout({ children }) {
  // TODO: replace with Supabase auth session
  const user = {
    role: "admin", // admin | contractor | viewer
    name: "System User",
  };

  return (
    <html lang="en">
      <body style={styles.body}>
        <div style={styles.shell}>
          {/* SIDEBAR (ROLE AWARE) */}
          <Sidebar role={user.role} />

          {/* MAIN APP AREA */}
          <main style={styles.main}>
            {/* TOP BAR (future: search / notifications / revenue) */}
            <header style={styles.topbar}>
              <div>
                <h3 style={{ margin: 0 }}>RoofFlow OS</h3>
                <p style={styles.sub}>
                  Role: {user.role}
                </p>
              </div>
            </header>

            {/* PAGE CONTENT */}
            <div style={styles.content}>{children}</div>
          </main>
        </div>
      </body>
    </html>
  );
}