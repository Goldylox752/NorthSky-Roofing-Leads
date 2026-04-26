export function requireRole(profile, allowedRoles = []) {
  if (!profile) return false;

  // admin always passes
  if (profile.role === "admin") return true;

  return allowedRoles.includes(profile.role);
}