const supabase = require("../lib/supabase");

async function createLead({ name, email, phone, city }) {
  const { data, error } = await supabase
    .from("leads")
    .insert([{ name, email, phone, city }])
    .select();

  if (error) throw error;

  return data;
}

module.exports = {
  createLead,
};