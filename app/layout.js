import Sidebar from "@/components/Sidebar";
import { createClient } from "@supabase/supabase-js";

// ===============================
// SUPABASE SERVER CLIENT
// ===============================
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function RootLayout({ children }) {
  // ===============================
  // AUTH SESSION (SERVER-SIDE SAFE)
  // ===============================
  let user = {
    role: "viewer",
    name: "Guest",
  };

  try {
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (authUser) {
      // fetch role from your contractors table
      const { data: contractor } = await supabase
        .from("contractors")
        .select("role, name")
        .eq("id", authUser.id)
        .single();

      user = {
        role: contractor?.role || "contractor",
        name: contractor?.name || "User",
      };
    }
  } catch (err) {
    console.error("Auth load failed:", err);
  }

  // ===============================
  // UI
  // ===============================
  return (
    <html lang="en">
      <body style={styles.body}>
        <div style={styles.shell}>
          {/* SIDEBAR (ROLE-DRIVEN NAV) */}
          <Sidebar role={user.role} />

          {/* MAIN AREA */}
          <main style={styles.main}>
            {/* TOP BAR */}
            <header style={styles.topbar}>
              <div>
                <h3 style={{ margin: 0 }}>RoofFlow OS</h3>
                <p style={styles.sub}>
                  {user.name} • Role: {user.role}
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