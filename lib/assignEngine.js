export function assignLead(lead) {
  if (!lead) return "unqualified";

  if (lead.score >= 80) return "priority";
  if (lead.score >= 50) return "standard";

  return "low";
}
