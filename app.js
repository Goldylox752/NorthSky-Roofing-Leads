<script>
  const btn = document.getElementById("checkoutBtn");

  if (!btn) {
    console.error("❌ checkoutBtn not found");
  } else {
    btn.addEventListener("click", async () => {
      const originalText = btn.innerText;

      let timeoutId;

      try {
        /* ===============================
           LOADING STATE
        =============================== */
        btn.disabled = true;
        btn.innerText = "Redirecting...";

        /* ===============================
           EMAIL INPUT
        =============================== */
        const input = prompt("Enter your email address:");

        if (!input) throw new Error("Email is required");

        const email = input.trim().toLowerCase();

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(email)) {
          throw new Error("Invalid email format");
        }

        /* ===============================
           TIMEOUT SAFETY (8s)
        =============================== */
        const controller = new AbortController();

        timeoutId = setTimeout(() => {
          controller.abort();
        }, 8000);

        /* ===============================
           API CALL
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
            signal: controller.signal,
          }
        );

        clearTimeout(timeoutId);

        let data;

        try {
          data = await response.json();
        } catch {
          throw new Error("Invalid server response");
        }

        if (!response.ok) {
          throw new Error(
            data?.error || "Checkout failed"
          );
        }

        if (!data?.url) {
          throw new Error("Missing checkout URL");
        }

        /* ===============================
           REDIRECT TO STRIPE
        =============================== */
        window.location.href = data.url;

      } catch (err) {
        console.error("Checkout Error:", err);

        alert(err.name === "AbortError"
          ? "Request timed out. Try again."
          : err.message || "Checkout failed"
        );

        btn.disabled = false;
        btn.innerText = originalText;

        if (timeoutId) clearTimeout(timeoutId);
      }
    });
  }
</script>