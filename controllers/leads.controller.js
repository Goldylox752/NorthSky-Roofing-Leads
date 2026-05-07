const supabase = require("../lib/supabase");

exports.createLead = async (req, res) => {
  try {
    const { name, email, phone, city } = req.body;

    const { data, error } = await supabase
      .from("leads")
      .insert([{ name, email, phone, city }]);

    if (error) throw error;

    res.json({
      success: true,
      data,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};