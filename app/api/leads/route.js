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
    // 🧠 IDEMPOTENCY KEY (PREVENT DUPLICATES)
    // =====================
    const idempotencyKey = crypto
      .createHash("sha256")
      .update(`${email || ""}:${phone || ""}:${city || ""}`)
      .digest("hex");

    // =====================
    // CREATE LEAD ID
    // =====================
    const leadId = crypto.randomUUID();

    // =====================
    // 🧠 LEAD SCORING ENGINE (MONEY PRIORITY)
    // =====================
    let score = 50;

    if (email) score += 10;
    if (phone) score += 20;
    if (city) score += 10;

    if (phone && email) score += 10; // high intent

    const tier =
      score >= 80 ? "hot" :
      score >= 60 ? "warm" :
      "cold";

    // =====================
    // 💰 PRICING ENGINE (SCALABLE)
    // =====================
    const basePrices = {
      Edmonton: 14900,
      Calgary: 12900,
      default: 9900,
    };

    let price = basePrices[city] || basePrices.default;

    if (tier === "hot") price += 2000;
    if (tier === "cold") price -= 1000;

    // =====================
    // 🧭 CONTRACTOR ROUTING HOOK (FUTURE SYSTEM)
    // =====================
    const contractorId =
      city === "Edmonton"
        ? "contractor_edm_1"
        : city === "Calgary"
        ? "contractor_cal_1"
        : "contractor_default";

    // =====================
    // LEAD OBJECT
    // =====================
    const lead = {
      id: leadId,
      name: name?.trim() || null,
      email: email?.trim().toLowerCase() || null,
      phone: phone?.trim() || null,
      city: city?.trim() || null,

      status: "new",
      tier,
      score,

      contractorId,

      createdAt: new Date().toISOString(),
      requestId: req.id,
      idempotencyKey,
    };

    // =====================
    // LOG (STRUCTURED EVENT)
    // =====================
    console.log("📩 LEAD_CREATED", {
      leadId,
      tier,
      score,
      city,
      price,
    });

    // =====================
    // 💰 RESPONSE (STRIPE READY FORMAT)
    // =====================
    return res.status(200).json({
      success: true,
      message: "Lead created successfully",

      lead,

      monetization: {
        enabled: true,
        currency: "usd",
        price: price / 100,
        tier,
      },

      checkout: {
        required: true,
        endpoint: "/api/checkout",
        payload: {
          leadId,
          amount: price / 100,
          email,
        },
      },

      routing: {
        contractorId,
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