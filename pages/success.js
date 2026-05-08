import { useEffect, useState } from "react";
import { useRouter } from "next/router";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function Success() {
  const router = useRouter();
  const { session_id } = router.query;

  const [status, setStatus] = useState("verifying");

  useEffect(() => {
    if (!session_id || !API_URL) return;

    let isMounted = true;

    const verifyPayment = async () => {
      try {
        setStatus("verifying");

        const res = await fetch(
          `${API_URL}/api/payments/verify?session_id=${session_id}`
        );

        const data = await res.json();

        if (!isMounted) return;

        if (data?.paid) {
          setStatus("success");

          // small delay for UX
          setTimeout(() => {
            if (isMounted) {
              router.push("/dashboard");
            }
          }, 1200);
        } else {
          setStatus("failed");
        }
      } catch (err) {
        console.error("Payment verification error:", err);
        if (isMounted) setStatus("failed");
      }
    };

    verifyPayment();

    return () => {
      isMounted = false;
    };
  }, [session_id, router]);

  return (
    <div style={{ padding: 40, textAlign: "center" }}>
      <h1>Payment Status</h1>

      {status === "verifying" && <p>Verifying payment...</p>}
      {status === "success" && (
        <p style={{ color: "green" }}>
          Payment confirmed! Redirecting...
        </p>
      )}
      {status === "failed" && (
        <p style={{ color: "red" }}>
          Payment could not be verified.
        </p>
      )}
    </div>
  );
}