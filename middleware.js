import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// ===============================
// EDGE AUTH CLIENT
// ===============================
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// ===============================
// ROUTE MAP
// ===============================
const RULES = [
  { match: "/dashboard", roles: ["admin", "contractor"] },
  { match: "/admin", roles: ["admin"] },
  { match: "/contractor", roles: ["contractor", "admin"] },
  { match: "/api/wallet", roles: ["contractor"] },
  { match: "/api/lead", roles: ["contractor", "admin"] },
];

// ===============================
// MIDDLEWARE
// ===============================
export async function middleware(req) {
  const path = req.nextUrl.pathname;
  const isApi = path.startsWith("/api/");

  // allow public routes
  if (
    path === "/" ||
    path.startsWith("/login") ||
    path.startsWith("/_next") ||
    path.startsWith("/favicon")
  ) {
    return NextResponse.next();
  }

  const authHeader = req.headers.get("authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    return unauthorized(isApi);
  }

  const token = authHeader.replace("Bearer ", "");

  // ===============================
  // VERIFY SESSION (FAST PATH)
  // ===============================
  const {
    data: { user },
  } = await supabase.auth.getUser(token);

  if (!user) {
    return unauthorized(isApi);
  }

  // ===============================
  // ⚡ OPTIMIZATION STRATEGY:
  // We DO NOT query DB here anymore
  // Role must be stored in JWT or Supabase user metadata
  // ===============================
  const role =
    user.user_metadata?.role ||
    user.app_metadata?.role ||
    "contractor";

  const rule = RULES.find((r) => path.startsWith(r.match));

  if (rule && !rule.roles.includes(role)) {
    return forbidden(isApi);
  }

  return NextResponse.next();
}

// ===============================
// HELPERS
// ===============================
function unauthorized(isApi) {
  if (isApi) {
    return new NextResponse(
      JSON.stringify({ error: "UNAUTHORIZED" }),
      { status: 401 }
    );
  }

  return NextResponse.redirect(new URL("/login", "http://localhost"));
}

function forbidden(isApi) {
  if (isApi) {
    return new NextResponse(
      JSON.stringify({ error: "FORBIDDEN" }),
      { status: 403 }
    );
  }

  return new NextResponse("FORBIDDEN", { status: 403 });
}

// ===============================
// ROUTE MATCHER
// ===============================
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
    "/contractor/:path*",
    "/api/:path*",
  ],
};