app.post("/api/leads", async (req, res) => {
  try {
    const error = validateLead(req.body);

    if (error) {
      return res.status(400).json({
        success: false,
        error,
        requestId: req.id,
      });
    }

    const { name, email, phone, city } = req.body;

    // =====================
    // CREATE LEAD ID (SAFE + UNIQUE)
    // =====================
    const leadId = crypto.randomUUID();

    const lead = {
      id: leadId,
      name: name?.trim() || null,
      email: email?.trim().toLowerCase() || null,
      phone: phone?.trim() || null,
      city: city?.trim() || null,
      status: "new",
      createdAt: new Date().toISOString(),
      requestId: req.id,
    };

    // =====================
    // LOG LEAD
    // =====================
    console.log("📩 NEW_LEAD", lead);

    // =====================
    // 💰 PRICING LOGIC (IMPORTANT FOR MONEY FLOW)
    // =====================
    let price = 9900; // default $99

    if (city === "Edmonton") price = 14900;
    if (city === "Calgary") price = 12900;

    if (phone && email) price += 2000; // higher quality lead

    // =====================
    // RESPONSE (FRONTEND + STRIPE FLOW)
    // =====================
    return res.status(200).json({
      success: true,
      message: "Lead created successfully",

      lead,

      // 🔥 THIS IS WHAT MAKES YOU MONEY
      monetization: {
        enabled: true,
        currency: "usd",
        price: price / 100,
        checkoutRequired: true,
        checkoutEndpoint: "/api/checkout",
      },

      nextStep: {
        action: "checkout_required",
        leadId,
      },
    });

  } catch (err) {
    console.error("🔥 LEAD_ERROR", {
      message: err.message,
      stack: err.stack,
    });

    return res.status(500).json({
      success: false,
      error: "Internal server error",
      requestId: req.id,
    });
  }
});