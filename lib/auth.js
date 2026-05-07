const supabase = require("./supabase").supabaseAdmin;

/* ===============================
   GET USER BY EMAIL
   (PRIMARY IDENTITY METHOD)
=============================== */
async function getUserByEmail(email) {
  if (!email) return null;

  const { data, error } = await supabase
    .from("leads")
    .select("*")
    .eq("email", email.toLowerCase().trim())
    .maybeSingle();

  if (error) {
    console.error("Auth lookup error:", error);
    return null;
  }

  return data;
}

/* ===============================
   CHECK IF USER HAS PAID ACCESS
=============================== */
function isPaidUser(user) {
  if (!user) return false;

  return (
    user.paid === true ||
    user.status === "paid" ||
    user.status === "active"
  );
}

/* ===============================
   ATTACH STRIPE CUSTOMER ID
   (USED AFTER WEBHOOK)
=============================== */
async function attachStripeCustomer(email, stripeCustomerId) {
  if (!email || !stripeCustomerId) return;

  const { error } = await supabase
    .from("leads")
    .update({
      stripe_customer_id: stripeCustomerId,
    })
    .eq("email", email.toLowerCase().trim());

  if (error) {
    console.error("Stripe attach error:", error);
  }
}

/* ===============================
   ACTIVATE USER AFTER PAYMENT
=============================== */
async function activateUser(email, plan = "starter") {
  if (!email) return;

  const { error } = await supabase
    .from("leads")
    .update({
      paid: true,
      status: "paid",
      plan,
      activated_at: new Date().toISOString(),
    })
    .eq("email", email.toLowerCase().trim());

  if (error) {
    console.error("Activation error:", error);
  }
}

module.exports = {
  getUserByEmail,
  isPaidUser,
  attachStripeCustomer,
  activateUser,
};