import { useState } from 'react';
import { useRole } from '@/contexts/RoleContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Shield, Eye, EyeOff, UserCog, Zap, Bug, RefreshCw } from 'lucide-react';

type UserTier = 'free' | 'premium' | 'developer';
type AccessLevel = 'restricted' | 'standard' | 'unlimited';

export const AdminPanel = () => {
  const { 
    isOwner, 
    role, 
    tier, 
    accessLevel, 
    impersonation,
    startImpersonation,
    stopImpersonation,
    effectiveTier,
    effectiveAccessLevel,
  } = useRole();

  const [selectedTier, setSelectedTier] = useState<UserTier>('free');
  const [selectedAccess, setSelectedAccess] = useState<AccessLevel>('restricted');

  // Only render for owner
  if (!isOwner) return null;

  const handleStartImpersonation = () => {
    startImpersonation(selectedTier, selectedAccess);
  };

  return (
    <Card className="glass border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-orange-500/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-amber-500">
          <Shield className="w-5 h-5" />
          Owner Admin Panel
        </CardTitle>
        <CardDescription>
          Developer tools and testing controls (visible only to you)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Status */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium flex items-center gap-2">
            <UserCog className="w-4 h-4" />
            Current Status
          </h3>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="border-amber-500/50 text-amber-500">
              Role: {role}
            </Badge>
            <Badge variant="outline" className="border-purple-500/50 text-purple-500">
              Tier: {tier}
            </Badge>
            <Badge variant="outline" className="border-blue-500/50 text-blue-500">
              Access: {accessLevel}
            </Badge>
          </div>
        </div>

        <Separator />

        {/* Impersonation Controls */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium flex items-center gap-2">
            {impersonation.active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            Impersonation Mode
          </h3>
          
          {impersonation.active ? (
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
                <p className="text-sm text-amber-200 mb-2">
                  Currently viewing as:
                </p>
                <div className="flex gap-2">
                  <Badge variant="secondary">Tier: {effectiveTier}</Badge>
                  <Badge variant="secondary">Access: {effectiveAccessLevel}</Badge>
                </div>
              </div>
              <Button 
                onClick={stopImpersonation}
                variant="outline"
                className="w-full gap-2 border-amber-500/50 hover:bg-amber-500/10"
              >
                <RefreshCw className="w-4 h-4" />
                Restore Owner Mode
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-2">
                {(['free', 'premium', 'developer'] as UserTier[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => setSelectedTier(t)}
                    className={`p-2 rounded-lg border text-xs font-medium transition-all ${
                      selectedTier === t
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-2">
                {(['restricted', 'standard', 'unlimited'] as AccessLevel[]).map((a) => (
                  <button
                    key={a}
                    onClick={() => setSelectedAccess(a)}
                    className={`p-2 rounded-lg border text-xs font-medium transition-all ${
                      selectedAccess === a
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    {a}
                  </button>
                ))}
              </div>
              <Button 
                onClick={handleStartImpersonation}
                variant="secondary"
                className="w-full gap-2"
              >
                <Eye className="w-4 h-4" />
                See App as {selectedTier} User
              </Button>
            </div>
          )}
        </div>

        <Separator />

        {/* Developer Features */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium flex items-center gap-2">
            <Bug className="w-4 h-4" />
            Developer Features
          </h3>
          <div className="grid grid-cols-2 gap-2">
            <div className="p-3 rounded-lg bg-muted/50 flex items-center gap-2">
              <Zap className="w-4 h-4 text-green-500" />
              <span className="text-xs">No Rate Limits</span>
            </div>
            <div className="p-3 rounded-lg bg-muted/50 flex items-center gap-2">
              <Zap className="w-4 h-4 text-green-500" />
              <span className="text-xs">All Features</span>
            </div>
            <div className="p-3 rounded-lg bg-muted/50 flex items-center gap-2">
              <Zap className="w-4 h-4 text-green-500" />
              <span className="text-xs">No Paywalls</span>
            </div>
            <div className="p-3 rounded-lg bg-muted/50 flex items-center gap-2">
              <Zap className="w-4 h-4 text-green-500" />
              <span className="text-xs">Debug Mode</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
