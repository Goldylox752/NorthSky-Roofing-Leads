import Sidebar from "@/components/Sidebar";
import { createClient } from "@supabase/supabase-js";

// ===============================
// SAFE SERVER CLIENT (READ ONLY)
// ===============================
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default async function RootLayout({ children }) {
  // ===============================
  // DEFAULT USER STATE
  // ===============================
  let user = {
    role: "viewer",
    name: "Guest",
  };

  try {
    // NOTE: This only works if you use Supabase auth properly in server context
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (authUser) {
      const { data: contractor } = await supabase
        .from("contractors")
        .select("role, name")
        .eq("id", authUser.id)
        .single();

      user = {
        role: contractor?.role || "contractor",
        name: contractor?.name || authUser.email || "User",
      };
    }
  } catch (err) {
    console.error("Auth load failed:", err.message);
  }

  // ===============================
  // UI
  // ===============================
  return (
    <html lang="en">
      <body style={styles.body}>
        <div style={styles.shell}>
          <Sidebar role={user.role} />

          <main style={styles.main}>
            <header style={styles.topbar}>
              <div>
                <h3 style={{ margin: 0 }}>RoofFlow OS</h3>
                <p style={styles.sub}>
                  {user.name} • Role: {user.role}
                </p>
              </div>
            </header>

            <div style={styles.content}>{children}</div>
          </main>
        </div>
      </body>
    </html>
  );
}