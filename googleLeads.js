const { createClient } = require("@supabase/supabase-js");
const axios = require("axios");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

/* ================= CONFIG ================= */
const KEYWORDS = [
  "roofing contractor",
  "roof repair",
  "emergency roof leak",
  "hail damage roof"
];

const LOCATIONS = [
  "Leduc, Alberta",
  "Edmonton, Alberta"
];

/* ================= LEAD SCORING (UPGRADED) ================= */
function scoreLead(lead) {
  let score = 0;

  const name = (lead.name || "").toLowerCase();

  // intent signals
  if (name.includes("emergency")) score += 40;
  if (name.includes("roof")) score += 25;
  if (name.includes("repair")) score += 20;

  // authority signals
  if (lead.rating >= 4.5) score += 25;
  else if (lead.rating >= 4.0) score += 15;

  if (lead.user_ratings_total > 100) score += 25;
  else if (lead.user_ratings_total > 20) score += 15;

  // high intent bonus
  if (lead.keyword.includes("emergency")) score += 20;
  if (lead.keyword.includes("hail")) score += 15;

  return Math.min(score, 100);
}

/* ================= GOOGLE PLACES SEARCH ================= */
async function searchGooglePlaces(query, location) {
  const url = "https://maps.googleapis.com/maps/api/place/textsearch/json";

  try {
    const res = await axios.get(url, {
      params: {
        query: `${query} in ${location}`,
        key: process.env.GOOGLE_MAPS_API_KEY
      }
    });

    return res.data.results || [];
  } catch (err) {
    console.log("Google API error:", err.message);
    return [];
  }
}

/* ================= DUPLICATE CHECK ================= */
async function leadExists(place_id) {
  const { data } = await supabase
    .from("leads")
    .select("id")
    .eq("place_id", place_id)
    .maybeSingle();

  return !!data;
}

/* ================= MAIN ENGINE ================= */
async function runGoogleLeadEngine() {

  console.log("🚀 Running Lead Engine...");

  for (const location of LOCATIONS) {
    for (const keyword of KEYWORDS) {

      const results = await searchGooglePlaces(keyword, location);

      for (const place of results) {

        const lead = {
          name: place.name,
          address: place.formatted_address,
          rating: place.rating || 0,
          user_ratings_total: place.user_ratings_total || 0,
          place_id: place.place_id,
          keyword,
          location,
          created_at: new Date().toISOString()
        };

        // score lead
        lead.score = scoreLead(lead);

        // filter low quality
        if (lead.score < 45) continue;

        // dedupe
        if (await leadExists(lead.place_id)) continue;

        // enrich funnel metadata
        lead.funnel_source = "google_places_engine";
        lead.intent_level =
          lead.score >= 75 ? "hot" :
          lead.score >= 55 ? "warm" :
          "cold";

        // save to database
        await supabase.from("leads").insert([lead]);

        console.log(
          "🔥 LEAD:",
          lead.name,
          "| Score:",
          lead.score,
          "| Intent:",
          lead.intent_level
        );
      }
    }
  }

  console.log("✅ Lead engine complete");
}

module.exports = { runGoogleLeadEngine };