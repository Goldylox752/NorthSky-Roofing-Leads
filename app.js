<script>
  const btn = document.getElementById("checkoutBtn");

  btn.addEventListener("click", async () => {
    btn.disabled = true;
    btn.innerText = "Redirecting...";

    try {
      const email = prompt("Enter your email:");

      if (!email) {
        throw new Error("Email is required");
      }

      const res = await fetch("/api/payments/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email,
          name: "Guest User",
          plan: "starter"
        })
      });

      let data;
      try {
        data = await res.json();
      } catch {
        throw new Error("Invalid server response");
      }

      if (!res.ok) {
        throw new Error(data?.error || "Checkout failed");
      }

      if (!data?.url) {
        throw new Error("No checkout URL returned");
      }

      window.location.href = data.url;

    } catch (err) {
      console.error(err);
      alert(err.message || "Error starting checkout");

      btn.disabled = false;
      btn.innerText = "Get Started";
    }
  });
</script>