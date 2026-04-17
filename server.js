fetch("https://formspree.io/f/YOUR_ID", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    name,
    email,
    city,
    message: "New lead submitted and sent to Stripe checkout"
  })
});