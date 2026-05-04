"use client";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function Buy() {
  const buy = async (plan) => {
    const res = await fetch(`${API_URL}/api/checkout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        plan,
        mode: "payment",
      }),
    });

    const data = await res.json();
    window.location.href = data.url;
  };

  return (
    <main style={styles.page}>
      <h1>Buy Roofing Leads</h1>

      <button onClick={() => buy("starter")} style={styles.btn}>
        Starter ($99)
      </button>

      <button onClick={() => buy("growth")} style={styles.btn}>
        Growth ($199)
      </button>

      <button onClick={() => buy("elite")} style={styles.btn}>
        Elite ($499)
      </button>
    </main>
  );
}

const styles = {
  page: {
    padding: 40,
    background: "#0b1220",
    color: "white",
    minHeight: "100vh",
  },
  btn: {
    display: "block",
    margin: 10,
    padding: 15,
    width: 200,
    background: "#4da3ff",
    border: "none",
    color: "white",
    cursor: "pointer",
  },
};