import { useSubscription } from '../hooks/useSubscription';
import { AlertCircle, Clock, CheckCircle } from 'lucide-react';

export default function TrialBanner() {
  const { subscription, loading } = useSubscription();

  console.log('[TrialBanner] Rendering - loading:', loading, 'subscription:', subscription);

  if (loading) {
    console.log('[TrialBanner] Still loading, returning null');
    return null;
  }

  const daysRemaining = subscription.daysRemaining;
  const isTrialExpired = subscription.isTrialExpired;
  const status = subscription.status;

  console.log('[TrialBanner] Days remaining:', daysRemaining);
  console.log('[TrialBanner] Is expired:', isTrialExpired);
  console.log('[TrialBanner] Status:', status);

  // Don't show banner for active (paid) subscriptions
  if (status === 'active') {
    console.log('[TrialBanner] Active subscription, no banner needed');
    return null;
  }

  // PRIORITY 1: Show RED banner if trial is expired
  if (isTrialExpired === true) {
    console.log('[TrialBanner] Showing RED expired banner');
    return (
      <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-r-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <p className="ml-3 text-sm text-red-800">
              <strong>Trial expired.</strong> Upgrade to create new projects. Your existing projects are safe.
            </p>
          </div>
          <button 
            onClick={() => window.location.href = 'mailto:hey@milestage.com?subject=Upgrade to MileStage Pro'}
            className="ml-4 px-4 py-1.5 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 transition-colors whitespace-nowrap"
          >
            Upgrade Now
          </button>
        </div>
      </div>
    );
  }

  // PRIORITY 2: Show YELLOW warning when 3 days or less remaining
  if (typeof daysRemaining === 'number' && daysRemaining > 0 && daysRemaining <= 3) {
    console.log('[TrialBanner] Showing YELLOW warning banner');
    return (
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Clock className="w-5 h-5 text-yellow-600 flex-shrink-0" />
            <p className="ml-3 text-sm text-yellow-800">
              <strong>Trial ending soon!</strong> You have {daysRemaining} day{daysRemaining !== 1 ? 's' : ''} left.
            </p>
          </div>
          <button 
            onClick={() => window.location.href = 'mailto:hey@milestage.com?subject=Upgrade to MileStage Pro'}
            className="ml-4 px-4 py-1.5 bg-yellow-600 text-white text-sm font-semibold rounded-lg hover:bg-yellow-700 transition-colors whitespace-nowrap"
          >
            Upgrade Now
          </button>
        </div>
      </div>
    );
  }

  // PRIORITY 3: Show GREEN info banner when 4+ days remaining
  if (typeof daysRemaining === 'number' && daysRemaining > 3) {
    console.log('[TrialBanner] Showing GREEN info banner');
    return (
      <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded-r-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
            <p className="ml-3 text-sm text-green-800">
              <strong>Trial:</strong> {daysRemaining} day{daysRemaining !== 1 ? 's' : ''} remaining
            </p>
          </div>
          <button 
            onClick={() => window.location.href = 'mailto:hey@milestage.com?subject=Upgrade to MileStage Pro'}
            className="ml-4 px-4 py-1.5 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 transition-colors whitespace-nowrap"
          >
            Upgrade Now
          </button>
        </div>
      </div>
    );
  }

  // Fallback - shouldn't reach here normally
  console.log('[TrialBanner] No conditions met, returning null. daysRemaining:', daysRemaining, 'isTrialExpired:', isTrialExpired);
  return null;
}
