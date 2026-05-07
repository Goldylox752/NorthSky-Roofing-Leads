const { createLead } = require("../services/leads.service");
const validateLead = require("../utils/validateLead");

exports.createLead = async (req, res, next) => {
  try {
    const error = validateLead(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error,
      });
    }

    const lead = await createLead(req.body);

    res.json({
      success: true,
      data: lead,
    });

  } catch (err) {
    next(err);
  }
};