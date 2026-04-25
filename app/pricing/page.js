"use client";

export default function PricingButton() {
  const handleCheckout = async () => {
    const res = await fetch("/api/checkout", {
      method: "POST",
    });

    const data = await res.json();

    if (data.url) {
      window.location.href = data.url;
    }
  };

  return (
    <button onClick={handleCheckout}>
      Get Started
    </button>
  );
}
