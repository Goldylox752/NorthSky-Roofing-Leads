module.exports = function validateLead(body) {
  const email = (body.email || "").trim().toLowerCase();
  const name = (body.name || "").trim();
  const phone = (body.phone || "").trim();

  // =====================
  // REQUIRED FIELDS
  // =====================
  if (!email) return "Email required";
  if (!name) return "Name required";

  // =====================
  // EMAIL VALIDATION
  // =====================
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return "Invalid email format";

  // =====================
  // NAME VALIDATION
  // =====================
  if (name.length < 2) return "Name too short";
  if (name.length > 50) return "Name too long";

  // =====================
  // PHONE VALIDATION (optional but safer)
  // =====================
  if (phone && phone.length < 7) {
    return "Invalid phone number";
  }

  return null;
};