app.post("/api/leads", async (req, res) => {
  const start = Date.now();

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
    // 🔐 IDEMPOTENCY KEY (GLOBAL SAFE)
    // =====================
    const idempotencyKey = crypto
      .createHash("sha256")
      .update(`${email || ""}:${phone || ""}:${city || ""}`)
      .digest("hex");

    // 🔥 CHECK DB FIRST (CRITICAL FIX)
    const existing = await supabase
      .from("leads")
      .select("id, status")
      .eq("idempotency_key", idempotencyKey)
      .maybeSingle();

    if (existing?.data) {
      return res.status(200).json({
        success: true,
        duplicate: true,
        lead: existing.data,
      });
    }

    // =====================
    // 🧠 IMPROVED SCORING ENGINE
    // =====================
    let score = 40;

    const signals = {
      hasEmail: !!email,
      hasPhone: !!phone,
      hasCity: !!city,
      fullIntent: !!(email && phone),
      geoSignal: city === "Edmonton" || city === "Calgary",
    };

    score += signals.hasEmail ? 10 : 0;
    score += signals.hasPhone ? 15 : 0;
    score += signals.hasCity ? 10 : 0;
    score += signals.fullIntent ? 15 : 0;
    score += signals.geoSignal ? 10 : 0;

    const tier =
      score >= 85 ? "hot" :
      score >= 65 ? "warm" :
      "cold";

    // =====================
    // 💰 SMART DYNAMIC PRICING ENGINE
    // =====================
    const basePrices = {
      Edmonton: 14900,
      Calgary: 12900,
      default: 9900,
    };

    let price = basePrices[city] || basePrices.default;

    // demand-based adjustments
    if (tier === "hot") price *= 1.25;
    if (tier === "cold") price *= 0.85;

    price = Math.round(price);

    // =====================
    // 🧭 REAL ROUTING (SUPABASE-READY)
    // =====================
    const { data: contractor } = await supabase
      .rpc("get_best_contractor", {
        city_input: city || "default",
        lead_score: score,
      });

    const contractorId =
      contractor?.id || "unassigned";

    // =====================
    // 🧾 CREATE LEAD (ATOMIC + SAFE)
    // =====================
    const { data: lead, error: insertError } = await supabase
      .from("leads")
      .insert({
        id: crypto.randomUUID(),

        name: name?.trim() || null,
        email: email?.trim().toLowerCase() || null,
        phone: phone?.trim() || null,
        city: city?.trim() || null,

        status: "new",
        tier,
        score,

        price,
        contractor_id: contractorId,

        idempotency_key: idempotencyKey,

        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      throw insertError;
    }

    // =====================
    // 📡 EVENT LOG (NON BLOCKING)
    // =====================
    supabase.from("events").insert({
      lead_id: lead.id,
      type: "lead_created",
      payload: {
        tier,
        score,
        price,
        contractorId,
      },
    }).catch(() => {});

    // =====================
    // 🧠 RESPONSE (STRIPE READY)
    // =====================
    return res.status(200).json({
      success: true,

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
          leadId: lead.id,
          amount: price / 100,
          email,
        },
      },

      routing: {
        contractorId,
      },

      latency_ms: Date.now() - start,
    });

  } catch (err) {
    console.error("🔥 LEAD_ERROR", err);

    return res.status(500).json({
      success: false,
      error: "Internal server error",
      requestId: req.id,
    });
  }
});