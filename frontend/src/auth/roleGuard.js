export const hasRole = (userRole, allowedRoles = []) => {
  if (!userRole) return false
  return allowedRoles.includes(userRole)
}
