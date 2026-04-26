export function requireRole(profile, allowedRoles = []) {
  if (!profile) return false;
  return allowedRoles.includes(profile.role);
}