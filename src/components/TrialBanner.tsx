import { useSubscription } from '../hooks/useSubscription';
import { AlertCircle, Clock } from 'lucide-react';

export default function TrialBanner() {
  const { subscription, loading } = useSubscription();

  if (loading || !subscription.daysRemaining) return null;

  // Show warning when 3 days or less remaining
  if (subscription.daysRemaining <= 3 && subscription.daysRemaining > 0) {
    return (
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
        <div className="flex items-start">
          <Clock className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
          <div className="ml-3 flex-1">
            <p className="text-sm text-yellow-800">
              <strong>Trial ending soon!</strong> You have {subscription.daysRemaining} day{subscription.daysRemaining !== 1 ? 's' : ''} left. 
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

  // Show if trial expired
  if (subscription.isTrialExpired) {
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

  return null;
}
