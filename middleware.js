import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// ===============================
// LIGHTWEIGHT AUTH CLIENT
// ===============================
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// ===============================
// ROUTE RULES (YOUR SAAS MAP)
// ===============================
const PROTECTED_ROUTES = {
  "/dashboard": ["admin", "contractor"],
  "/admin": ["admin"],
  "/contractor": ["contractor", "admin"],
  "/api/wallet": ["contractor"],
  "/api/lead": ["contractor", "admin"],
};

// ===============================
// MIDDLEWARE
// ===============================
export async function middleware(req) {
  const path = req.nextUrl.pathname;

  // ignore static + public routes
  if (
    path.startsWith("/_next") ||
    path.startsWith("/favicon") ||
    path === "/" ||
    path.startsWith("/login")
  ) {
    return NextResponse.next();
  }

  const authHeader = req.headers.get("authorization");

  if (!authHeader) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const token = authHeader.replace("Bearer ", "");

  // ===============================
  // VERIFY USER
  // ===============================
  const {
    data: { user },
  } = await supabase.auth.getUser(token);

  if (!user) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // ===============================
  // FETCH ROLE (LIGHTWEIGHT CHECK)
  // ===============================
  const { data: profile } = await supabase
    .from("contractors")
    .select("role")
    .eq("id", user.id)
    .single();

  const role = profile?.role || "contractor";

  // ===============================
  // ROUTE PROTECTION
  // ===============================
  for (const route in PROTECTED_ROUTES) {
    if (path.startsWith(route)) {
      const allowedRoles = PROTECTED_ROUTES[route];

      if (!allowedRoles.includes(role)) {
        return new NextResponse("FORBIDDEN", { status: 403 });
      }
    }
  }

  // allow request through
  return NextResponse.next();
}

// ===============================
// APPLY ONLY TO APP ROUTES
// ===============================
export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*", "/contractor/:path*", "/api/:path*"],
};