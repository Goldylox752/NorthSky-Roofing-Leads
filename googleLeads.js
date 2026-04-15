const { createClient } = require("@supabase/supabase-js");
const axios = require("axios");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const KEYWORDS = ["roofing contractor", "roof repair", "hail damage roof"];
const LOCATIONS = ["Leduc, Alberta", "Edmonton, Alberta"];

function scoreLead(lead) {
  let score = 0;
  if (lead.user_ratings_total > 20) score += 20;
  if (lead.rating >= 4.0) score += 25;
  if (lead.name.toLowerCase().includes("roof")) score += 30;
  if (lead.user_ratings_total > 100) score += 25;
  return score;
}

async function searchGooglePlaces(query, location) {
  const url = "https://maps.googleapis.com/maps/api/place/textsearch/json";

  const res = await axios.get(url, {
    params: {
      query: `${query} in ${location}`,
      key: process.env.GOOGLE_MAPS_API_KEY
    }
  });

  return res.data.results || [];
}

async function runGoogleLeadEngine() {
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
          score: 0,
          created_at: new Date()
        };

        lead.score = scoreLead(lead);

        // ❌ filter low quality leads
        if (lead.score < 40) continue;

        // ❌ duplicate check
        const { data: existing } = await supabase
          .from("leads")
          .select("id")
          .eq("place_id", lead.place_id)
          .maybeSingle();

        if (existing) continue;

        // 💾 save lead
        await supabase.from("leads").insert([lead]);

        console.log("🔥 New Lead:", lead.name, "Score:", lead.score);
      }
    }
  }
}

module.exports = { runGoogleLeadEngine };