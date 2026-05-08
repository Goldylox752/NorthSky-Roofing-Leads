<script>
  const btn = document.getElementById("checkoutBtn");

  btn.addEventListener("click", async () => {
    btn.disabled = true;
    btn.innerText = "Redirecting...";

    try {
      const res = await fetch("/api/payments/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email: `user_${Date.now()}@flowos.app`,
          name: "Guest User",
          plan: "starter"
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Checkout failed");
      }

      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL returned");
      }

    } catch (err) {
      console.error(err);
      alert(err.message || "Error starting checkout");
      btn.disabled = false;
      btn.innerText = "Get Started";
    }
  });
</script>