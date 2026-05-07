const supabase = require("../lib/supabase");

/* ===============================
   CREATE LEAD (SAFE + IDENTITY CLEAN)
=============================== */
async function createLead({
  name,
  email,
  phone,
  city,
  source = "web",
}) {

  if (!email) throw new Error("Email required");

  const cleanEmail = email.trim().toLowerCase();

  const payload = {
    name,
    email: cleanEmail,
    phone,
    city,
    source,
  };

  const { data, error } = await supabase
    .from("leads")
    .insert([payload])
    .select()
    .single();

  if (error) {
    console.error("Supabase insert error:", error);
    throw error;
  }

  return data;
}

/* ===============================
   GET LEADS (LATEST FIRST)
=============================== */
async function getLeads(limit = 50) {
  const { data, error } = await supabase
    .from("leads")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;

  return data;
}

module.exports = {
  createLead,
  getLeads,
};