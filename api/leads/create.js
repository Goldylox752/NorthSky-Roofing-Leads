import { assignLead } from "../../engine/assignLead";

export default async function handler(req, res) {
  const lead = req.body;

  // save lead
  const { data } = await supabase
    .from("leads")
    .insert(lead)
    .select()
    .single();

  // assign instantly
  const agent = await assignLead(data);

  res.json({
    success: true,
    assignedTo: agent.name
  });
}