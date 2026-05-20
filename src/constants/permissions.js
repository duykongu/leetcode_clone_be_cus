const PERMISSIONS = {
  // --- Admin Permissions ---
  VIEW_HIDDEN_PROBLEMS: "view_hidden_problems",
  MANAGE_PROBLEMS: "manage_problems",
  VIEW_USERS: "view_users",
  MANAGE_USERS: "manage_users",
  VIEW_ADMIN_STATS: "view_admin_stats",

  // --- User Permissions (Standard) ---
  VIEW_PUBLIC_PROBLEMS: "view_public_problems",
  SOLVE_PROBLEMS: "solve_problems",
  MANAGE_SELF_PROFILE: "manage_self_profile",
};

// Định nghĩa quyền cơ bản của một User thường
const BASIC_USER_PERMISSIONS = [
  PERMISSIONS.VIEW_PUBLIC_PROBLEMS,
  PERMISSIONS.SOLVE_PROBLEMS,
  PERMISSIONS.MANAGE_SELF_PROFILE,
];

const ROLE_PERMISSIONS = {
  // Admin có tất cả các quyền (Admin + User)
  admin: [
    ...Object.values(PERMISSIONS),
  ],
  // User chỉ có các quyền cơ bản
  user: [
    ...BASIC_USER_PERMISSIONS,
  ],
};

module.exports = {
  PERMISSIONS,
  ROLE_PERMISSIONS,
};
