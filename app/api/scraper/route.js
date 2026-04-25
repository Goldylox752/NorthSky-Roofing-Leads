import { rateLimit } from "@/lib/rateLimit";

export async function POST(req) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";

  // 🔒 Rate limit protection
  if (!rateLimit(ip)) {
    return new Response("Too many requests", { status: 429 });
  }

  try {
    const body = await req.json();
    const { url } = body;

    // 🔒 Validate input
    if (!url || typeof url !== "string") {
      return new Response("Invalid URL", { status: 400 });
    }

    if (!url.startsWith("http")) {
      return new Response("Invalid protocol", { status: 400 });
    }

    // 🔒 Timeout safety (Render protection)
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "RoofFlowBot/1.0",
      },
    });

    clearTimeout(timeout);

    if (!res.ok) {
      return new Response("Failed to fetch URL", { status: 400 });
    }

    const html = await res.text();

    // 🔥 Extract title
    const titleMatch = html.match(/<title>(.*?)<\/title>/i);
    const title = titleMatch?.[1] || "No title found";

    // 🔥 Extract emails
    const emails =
      html.match(
        /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-z]{2,}/g
      ) || [];

    // 🔥 Extract basic metadata (lightweight lead signal)
    const phoneMatches =
      html.match(
        /(\+?\d{1,2}[\s-]?)?\(?\d{3}\)?[\s-]?\d{3}[\s-]?\d{4}/g
      ) || [];

    return Response.json({
      success: true,
      url,
      title,
      emails: [...new Set(emails)],
      phones: [...new Set(phoneMatches)],
      length: html.length,
    });
  } catch (err) {
    return Response.json(
      {
        success: false,
        error: err.message || "Scraper failed",
      },
      { status: 500 }
    );
  }
}
