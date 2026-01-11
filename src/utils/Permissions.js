export const ROLE_PERMISSIONS = {
  Admin: {
    users: true,
    masters: true,
    reports: true,
    vouchers: true,
    settings: true
  },

  Accountant: {
    users: false,
    masters: true,
    reports: true,
    vouchers: true,
    settings: false
  },

  Staff: {
    users: false,
    masters: false,
    reports: false,
    vouchers: true,
    settings: false
  },

  Viewer: {
    users: false,
    masters: false,
    reports: true,
    vouchers: false,
    settings: false
  }
};
export function hasPermission(user, key) {
  if (!user || !user.Role) return false;
  return !!ROLE_PERMISSIONS[user.Role]?.[key];
}
