import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

type AppRole = 'owner' | 'admin' | 'moderator' | 'user';
type UserTier = 'free' | 'premium' | 'developer';
type AccessLevel = 'restricted' | 'standard' | 'unlimited';

interface ImpersonationState {
  active: boolean;
  tier: UserTier;
  accessLevel: AccessLevel;
}

interface RoleContextType {
  role: AppRole;
  tier: UserTier;
  accessLevel: AccessLevel;
  isHidden: boolean;
  loading: boolean;
  isOwner: boolean;
  isDeveloper: boolean;
  hasFullAccess: boolean;
  hasPremiumAccess: boolean;
  // Impersonation for owner testing
  impersonation: ImpersonationState;
  startImpersonation: (tier: UserTier, accessLevel: AccessLevel) => void;
  stopImpersonation: () => void;
  // Effective values (considering impersonation)
  effectiveTier: UserTier;
  effectiveAccessLevel: AccessLevel;
  effectiveHasFullAccess: boolean;
  effectiveHasPremiumAccess: boolean;
  refreshRole: () => Promise<void>;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export const useRole = () => {
  const context = useContext(RoleContext);
  if (context === undefined) {
    throw new Error('useRole must be used within a RoleProvider');
  }
  return context;
};

interface RoleProviderProps {
  children: ReactNode;
}

export const RoleProvider = ({ children }: RoleProviderProps) => {
  const { user, loading: authLoading } = useAuth();
  const [role, setRole] = useState<AppRole>('user');
  const [tier, setTier] = useState<UserTier>('free');
  const [accessLevel, setAccessLevel] = useState<AccessLevel>('restricted');
  const [isHidden, setIsHidden] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);
  const [impersonation, setImpersonation] = useState<ImpersonationState>({
    active: false,
    tier: 'free',
    accessLevel: 'restricted',
  });

  const fetchRole = async () => {
    if (!user) {
      setRole('user');
      setTier('free');
      setAccessLevel('restricted');
      setIsHidden(false);
      setLoading(false);
      return;
    }

    // Only set loading true if we haven't fetched yet
    if (!hasFetched) {
      setLoading(true);
    }

    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role, tier, access_level, is_hidden')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching user role:', error);
      } else if (data) {
        setRole(data.role as AppRole);
        setTier(data.tier as UserTier);
        setAccessLevel(data.access_level as AccessLevel);
        setIsHidden(data.is_hidden);
      } else {
        // No role entry exists, create one (non-blocking)
        supabase
          .from('user_roles')
          .insert({
            user_id: user.id,
            role: 'user',
            tier: 'free',
            access_level: 'restricted',
            is_hidden: false,
          })
          .then(() => {});
      }
    } catch (err) {
      console.error('Error in fetchRole:', err);
    } finally {
      setLoading(false);
      setHasFetched(true);
    }
  };

  useEffect(() => {
    // Don't fetch while auth is still loading
    if (authLoading) return;
    
    fetchRole();
  }, [user, authLoading]);

  const startImpersonation = (impTier: UserTier, impAccessLevel: AccessLevel) => {
    if (role !== 'owner') return; // Only owner can impersonate
    setImpersonation({
      active: true,
      tier: impTier,
      accessLevel: impAccessLevel,
    });
  };

  const stopImpersonation = () => {
    setImpersonation({
      active: false,
      tier: 'free',
      accessLevel: 'restricted',
    });
  };

  // Compute derived values
  const isOwner = role === 'owner';
  const isDeveloper = tier === 'developer';
  const hasFullAccess = accessLevel === 'unlimited' || isOwner;
  const hasPremiumAccess = tier === 'premium' || tier === 'developer' || isOwner;

  // Effective values when impersonating
  const effectiveTier = impersonation.active ? impersonation.tier : tier;
  const effectiveAccessLevel = impersonation.active ? impersonation.accessLevel : accessLevel;
  const effectiveHasFullAccess = impersonation.active 
    ? impersonation.accessLevel === 'unlimited' 
    : hasFullAccess;
  const effectiveHasPremiumAccess = impersonation.active 
    ? impersonation.tier === 'premium' || impersonation.tier === 'developer'
    : hasPremiumAccess;

  const value: RoleContextType = {
    role,
    tier,
    accessLevel,
    isHidden,
    loading,
    isOwner,
    isDeveloper,
    hasFullAccess,
    hasPremiumAccess,
    impersonation,
    startImpersonation,
    stopImpersonation,
    effectiveTier,
    effectiveAccessLevel,
    effectiveHasFullAccess,
    effectiveHasPremiumAccess,
    refreshRole: fetchRole,
  };

  return (
    <RoleContext.Provider value={value}>
      {children}
    </RoleContext.Provider>
  );
};
