export function hasAccess(profile, requiredRoles = []) {
  if (!profile) return false;

  // admin override
  if (profile.role === "admin") return true;

  // 🔥 GLOBAL STRIPE LOCK
  if (profile.subscription_status !== "active") return false;

  return requiredRoles.includes(profile.role);
}