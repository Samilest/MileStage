import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useStore } from '../store/useStore';

interface SubscriptionStatus {
  canCreateProjects: boolean;
  isTrialExpired: boolean;
  daysRemaining: number | null;
  status: string;
}

export function useSubscription() {
  const user = useStore((state) => state.user);
  const [subscription, setSubscription] = useState<SubscriptionStatus>({
    canCreateProjects: true,
    isTrialExpired: false,
    daysRemaining: null,
    status: 'trialing',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('[useSubscription] Hook running, user:', user?.id);
    
    if (!user?.id) {
      console.log('[useSubscription] No user, skipping');
      setLoading(false);
      return;
    }

    async function checkSubscription() {
      try {
        console.log('[useSubscription] Fetching subscription data for user:', user.id);
        
        const { data, error } = await supabase
          .from('user_profiles')
          .select('subscription_status, trial_ends_at')
          .eq('id', user.id)
          .single();

        console.log('[useSubscription] Raw data from DB:', data);

        if (error) {
          console.error('[useSubscription] Error:', error);
          setLoading(false);
          return;
        }

        const now = new Date();
        const trialEndsAt = data.trial_ends_at ? new Date(data.trial_ends_at) : null;
        
        console.log('[useSubscription] Trial ends at:', trialEndsAt);
        console.log('[useSubscription] Current time:', now);
        
        // Calculate if trial is expired
        const isExpired = trialEndsAt ? now > trialEndsAt : false;
        
        console.log('[useSubscription] Is expired:', isExpired);
        
        // Calculate days remaining
        let daysRemaining = null;
        if (trialEndsAt) {
          const diffTime = trialEndsAt.getTime() - now.getTime();
          daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        }

        console.log('[useSubscription] Days remaining:', daysRemaining);

        // User can create projects if:
        // 1. Subscription is active (paid), OR
        // 2. Trial is not expired yet
        const canCreate = data.subscription_status === 'active' || !isExpired;

        console.log('[useSubscription] Can create projects:', canCreate);

        const subscriptionData = {
          canCreateProjects: canCreate,
          isTrialExpired: isExpired,
          daysRemaining,
          status: data.subscription_status,
        };

        console.log('[useSubscription] Setting subscription:', subscriptionData);

        setSubscription(subscriptionData);
      } catch (error) {
        console.error('[useSubscription] Error checking subscription:', error);
      } finally {
        setLoading(false);
      }
    }

    checkSubscription();
  }, [user?.id]);

  return { subscription, loading };
}
