import Stripe from "stripe";
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function chargeLead(contractor, lead) {
  return await stripe.paymentIntents.create({
    amount: lead.price,
    currency: "usd",
    customer: contractor.stripe_customer_id,
    description: `Lead ${lead.city}`,
    metadata: {
      leadId: lead.id,
      contractorId: contractor.id,
    },
  });
}