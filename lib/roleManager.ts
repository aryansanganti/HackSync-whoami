
export type UserRole = 'citizen' | 'officer' | 'volunteer' | 'admin';

export const RoleManager = {
  /**
   * Detect user role based on email domain or metadata
   * In a production app, this would come from a user_roles table
   */
  async detectUserRole(email: string | null): Promise<UserRole> {
    if (!email) return 'citizen';
    
    const emailLower = email.toLowerCase();
    
    // Officer detection (simple domain-based for now)
    if (emailLower.includes('officer') || 
        emailLower.includes('admin') || 
        emailLower.includes('gov') ||
        emailLower.includes('municipal') ||
        emailLower.includes('city')) {
      return 'officer';
    }
    
    // Admin detection
    if (emailLower.includes('admin') || emailLower.includes('superuser')) {
      return 'admin';
    }
    
    // Volunteer detection (future feature)
    if (emailLower.includes('volunteer')) {
      return 'volunteer';
    }
    
    // Default to citizen
    return 'citizen';
  },

  /**
   * Check if user has permission to perform an action
   */
  hasPermission(userRole: UserRole, action: string): boolean {
    const permissions: Record<UserRole, string[]> = {
      citizen: [
        'report_issue',
        'view_own_issues',
        'view_public_map',
        'edit_own_profile'
      ],
      officer: [
        'report_issue',
        'view_all_issues',
        'update_issue_status',
        'view_public_map',
        'view_analytics',
        'edit_own_profile'
      ],
      volunteer: [
        'report_issue',
        'view_public_issues',
        'moderate_issues',
        'view_public_map',
        'edit_own_profile'
      ],
      admin: [
        'report_issue',
        'view_all_issues',
        'update_issue_status',
        'delete_issues',
        'manage_users',
        'view_analytics',
        'view_public_map',
        'edit_own_profile',
        'system_settings'
      ]
    };

    return permissions[userRole]?.includes(action) || false;
  },

  /**
   * Get role display name
   */
  getRoleDisplayName(role: UserRole): string {
    switch (role) {
      case 'officer':
        return 'Officer'; // was "Shield Officer"
      case 'admin':
        return 'Admin';
      case 'citizen':
      default:
        return 'Citizen';
    }
  },

  /**
   * Get role icon name
   */
  getRoleIcon(role: UserRole): string {
    const icons: Record<UserRole, string> = {
      citizen: 'person',
      officer: 'civic',
      volunteer: 'heart',
      admin: 'settings'
    };
    
    return icons[role] || 'person';
  },

  /**
   * Check if user can access officer features
   */
  canAccessOfficerFeatures(role: UserRole): boolean {
    return ['officer', 'admin'].includes(role);
  },

  /**
   * Check if user can access admin features
   */
  canAccessAdminFeatures(role: UserRole): boolean {
    return role === 'admin';
  }
};
