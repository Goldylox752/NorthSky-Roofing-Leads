const axios = require("axios");
const cheerio = require("cheerio");
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// --------------------
// SIMPLE SCRAPER
// --------------------
async function scrapeLeads() {
  try {
    const url = "https://example-directory.com/roofing-leads";

    const { data } = await axios.get(url);
    const $ = cheerio.load(data);

    const leads = [];

    $(".listing").each((i, el) => {
      const name = $(el).find(".name").text().trim();
      const phone = $(el).find(".phone").text().trim();
      const location = $(el).find(".location").text().trim();

      if (name && phone) {
        leads.push({
          name,
          phone,
          location,
          source: "directory-scrape",
          created_at: new Date().toISOString(),
        });
      }
    });

    for (const lead of leads) {
      // avoid duplicates
      const { data: existing } = await supabase
        .from("leads")
        .select("*")
        .eq("phone", lead.phone)
        .single();

      if (!existing) {
        await supabase.from("leads").insert([lead]);
        console.log("New lead saved:", lead.phone);
      }
    }

    return leads;
  } catch (err) {
    console.error("Scraper error:", err.message);
  }
}

module.exports = { scrapeLeads };
