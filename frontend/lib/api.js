const API = process.env.NEXT_PUBLIC_API_URL;

export async function createLead(data) {
  const res = await fetch(`${API}/api/leads`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) throw new Error("Failed to create lead");

  return res.json();
}

export async function scoreLead(data) {
  const res = await fetch(`${API}/api/score`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  return res.json();
}