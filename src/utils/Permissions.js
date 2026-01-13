
export function hasPermission(user, key) {
  if (!user || !user.Permissions) return false;
  return user.Permissions[key] === true;
}


