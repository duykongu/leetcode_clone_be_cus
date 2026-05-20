const { ROLE_PERMISSIONS } = require("../constants/permissions");

/**
 * Checks if a user has a specific permission
 * @param {Object} user - The user object from request
 * @param {string} permission - The permission to check
 * @returns {boolean}
 */
const can = (user, permission) => {
  if (!user || !user.role) return false;
  
  const permissions = ROLE_PERMISSIONS[user.role] || [];
  return permissions.includes(permission);
};

module.exports = { can };
