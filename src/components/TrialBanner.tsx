import { useSubscription } from '../hooks/useSubscription';
import { AlertCircle, Clock } from 'lucide-react';

export default function TrialBanner() {
  const { subscription, loading } = useSubscription();

  console.log('[TrialBanner] Rendering - loading:', loading, 'subscription:', subscription);

  if (loading) {
    console.log('[TrialBanner] Still loading, returning null');
    return null;
  }

  const daysRemaining = subscription.daysRemaining;
  const isTrialExpired = subscription.isTrialExpired;

  console.log('[TrialBanner] Days remaining:', daysRemaining);
  console.log('[TrialBanner] Is expired:', isTrialExpired);

  // PRIORITY 1: Show RED banner if trial is expired
  // Check this FIRST before checking daysRemaining
  if (isTrialExpired === true) {
    console.log('[TrialBanner] Showing RED expired banner');
    return (
      <div className="bg-red-50 border-l-4 border-red-400 p-4">
        <div className="flex items-start">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
          <div className="ml-3 flex-1">
            <p className="text-sm text-red-800">
              <strong>Trial expired.</strong> Upgrade to create new projects. Your existing projects are safe.
              <button 
                onClick={() => window.location.href = 'mailto:hey@milestage.com?subject=Upgrade to MileStage Pro'}
                className="ml-2 font-semibold underline hover:no-underline"
              >
                Upgrade now
              </button>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // PRIORITY 2: Show YELLOW warning when 3 days or less remaining (but not expired)
  // daysRemaining must be a positive number between 1-3
  if (typeof daysRemaining === 'number' && daysRemaining > 0 && daysRemaining <= 3) {
    console.log('[TrialBanner] Showing YELLOW warning banner');
    return (
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
        <div className="flex items-start">
          <Clock className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
          <div className="ml-3 flex-1">
            <p className="text-sm text-yellow-800">
              <strong>Trial ending soon!</strong> You have {daysRemaining} day{daysRemaining !== 1 ? 's' : ''} left. 
              <button 
                onClick={() => window.location.href = 'mailto:hey@milestage.com?subject=Upgrade to MileStage Pro'}
                className="ml-2 font-semibold underline hover:no-underline"
              >
                Upgrade now
              </button>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // No banner needed - trial is active with more than 3 days remaining
  console.log('[TrialBanner] No conditions met, returning null. daysRemaining:', daysRemaining, 'isTrialExpired:', isTrialExpired);
  return null;
}
