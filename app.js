<script>
  const btn = document.getElementById("checkoutBtn");

  btn.addEventListener("click", async () => {
    const originalText = btn.innerText;

    try {
      /* ===============================
         LOADING STATE
      =============================== */
      btn.disabled = true;
      btn.innerText = "Redirecting...";

      /* ===============================
         GET EMAIL
      =============================== */
      const input = prompt("Enter your email address:");

      if (!input) {
        throw new Error("Email is required");
      }

      /* ===============================
         CLEAN + VALIDATE EMAIL
      =============================== */
      const email = input.trim().toLowerCase();

      const emailRegex =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!emailRegex.test(email)) {
        throw new Error("Please enter a valid email");
      }

      /* ===============================
         CREATE CHECKOUT SESSION
      =============================== */
      const response = await fetch(
        "/api/payments/checkout",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            email,
            name: "Guest User",
            plan: "starter",
          }),
        }
      );

      /* ===============================
         SAFE RESPONSE PARSE
      =============================== */
      let data = null;

      try {
        data = await response.json();
      } catch (parseError) {
        throw new Error("Server returned invalid JSON");
      }

      /* ===============================
         API ERROR HANDLING
      =============================== */
      if (!response.ok) {
        throw new Error(
          data?.error ||
          data?.message ||
          "Checkout request failed"
        );
      }

      /* ===============================
         VALIDATE STRIPE URL
      =============================== */
      if (!data?.url) {
        throw new Error(
          "Stripe checkout URL missing"
        );
      }

      /* ===============================
         REDIRECT USER
      =============================== */
      window.location.href = data.url;

    } catch (err) {
      console.error("Checkout Error:", err);

      alert(
        err.message ||
        "Unable to start checkout"
      );

      /* ===============================
         RESET BUTTON
      =============================== */
      btn.disabled = false;
      btn.innerText = originalText;
    }
  });
</script>