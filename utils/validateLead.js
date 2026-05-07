module.exports = function validateLead(body) {
  if (!body.email) return "Email required";
  if (!body.name) return "Name required";
  return null;
};