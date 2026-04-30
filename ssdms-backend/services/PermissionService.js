/**
 * PermissionService manages fine-grained user permissions.
 */
class PermissionService {
    /**
     * Checks if a user has a specific permission or is an Admin.
     * @param {Object} user User object with permissions and role_name
     * @param {string} permission Permission string to check
     * @returns {boolean}
     */
    hasPermission(user, permission) {
        if (!user || !user.permissions) return false;
        if (user.role_name === 'Admin' || user.permissions.includes('*')) return true;
        return user.permissions.includes(permission);
    }

    /**
     * Checks if a user is assigned to a specific workflow stage.
     * @param {Object} user User object with assigned_sections
     * @param {string} section Workflow stage/section name
     * @returns {boolean}
     */
    canAccessSection(user, section) {
        if (!user || !user.assigned_sections) return false;
        if (user.assigned_sections.includes('*')) return true;
        return user.assigned_sections.includes(section);
    }
}

module.exports = new PermissionService();
