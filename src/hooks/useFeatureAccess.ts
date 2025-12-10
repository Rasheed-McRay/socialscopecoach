import { useRole } from '@/contexts/RoleContext';

/**
 * Hook for checking feature access based on user role and tier
 * Uses effective values which respect impersonation mode
 */
export const useFeatureAccess = () => {
  const {
    isOwner,
    effectiveTier,
    effectiveAccessLevel,
    effectiveHasFullAccess,
    effectiveHasPremiumAccess,
    impersonation,
  } = useRole();

  /**
   * Check if user can access a premium feature
   * Owner always has access (unless impersonating)
   */
  const canAccessPremium = (featureId?: string): boolean => {
    // During impersonation, use effective values
    if (impersonation.active) {
      return effectiveHasPremiumAccess;
    }
    // Owner always has access
    if (isOwner) return true;
    return effectiveHasPremiumAccess;
  };

  /**
   * Check if user can access an unlimited feature (no rate limits, etc.)
   */
  const canAccessUnlimited = (featureId?: string): boolean => {
    if (impersonation.active) {
      return effectiveHasFullAccess;
    }
    if (isOwner) return true;
    return effectiveHasFullAccess;
  };

  /**
   * Check if user can bypass paywalls
   */
  const canBypassPaywall = (): boolean => {
    if (impersonation.active) {
      return effectiveHasFullAccess;
    }
    return isOwner;
  };

  /**
   * Check if user can bypass rate limits
   */
  const canBypassRateLimits = (): boolean => {
    if (impersonation.active) {
      return effectiveAccessLevel === 'unlimited';
    }
    return isOwner;
  };

  /**
   * Get the current tier for feature gating
   */
  const getCurrentTier = () => effectiveTier;

  /**
   * Get the current access level
   */
  const getCurrentAccessLevel = () => effectiveAccessLevel;

  return {
    canAccessPremium,
    canAccessUnlimited,
    canBypassPaywall,
    canBypassRateLimits,
    getCurrentTier,
    getCurrentAccessLevel,
    isOwner,
    isImpersonating: impersonation.active,
  };
};
