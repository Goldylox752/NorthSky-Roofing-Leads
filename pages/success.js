import { useEffect, useState } from "react";
import { useRouter } from "next/router";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function Success() {
  const router = useRouter();
  const { session_id } = router.query;

  const [status, setStatus] = useState("verifying");

  useEffect(() => {
    if (!session_id) return;

    const verifyPayment = async () => {
      try {
        const res = await fetch(
          `${API_URL}/api/payments/verify?session_id=${session_id}`
        );

        const data = await res.json();

        if (data?.paid) {
          setStatus("success");

          setTimeout(() => {
            router.push("/dashboard");
          }, 1500);
        } else {
          setStatus("failed");
        }

      } catch (err) {
        console.error(err);
        setStatus("failed");
      }
    };

    verifyPayment();
  }, [session_id]);

  return (
    <div style={{ padding: 40, textAlign: "center" }}>
      <h1>Payment Status</h1>

      {status === "verifying" && <p>Verifying payment...</p>}
      {status === "success" && <p>Payment confirmed! Redirecting...</p>}
      {status === "failed" && <p>Payment not verified.</p>}
    </div>
  );
}