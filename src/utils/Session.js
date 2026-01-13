export const session = {
  user: null
};

export function setSessionUser(user) {
  session.user = user;
}

export function updatePermissions(permissions, version) {
  if (!session.user) return;
  session.user.permissions = permissions;
  session.user.permissionVersion = version;
}
