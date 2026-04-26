const FLOW_API = "https://northsky-flow-os.onrender.com";

export async function createLead(data) {
  return fetch(`${FLOW_API}/api/leads`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  }).then(r => r.json());
}