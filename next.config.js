/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // 🔥 Performance + SaaS stability
  swcMinify: true,
  compress: true,

  // 🌐 Allow backend/API calls (Render, Stripe, Twilio, Supabase)
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
        ],
      },
    ];
  },

  // 🌍 Environment-safe public config
  env: {
    APP_NAME: "RoofFlow AI",
  },

  // ⚙️ Image optimization (important for landing pages)
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },

  // 🔌 API rewrites (optional: dev proxy to backend)
  async rewrites() {
    return [
      {
        source: "/api/backend/:path*",
        destination:
          process.env.NEXT_PUBLIC_API_URL + "/api/:path*",
      },
    ];
  },
};

module.exports = nextConfig;