import { Lock } from 'lucide-react';

interface StageProgressProps {
  status: string;
  isLocked: boolean;
  deliverablesCount?: number;
}

export default function StageProgress({ status, isLocked }: StageProgressProps) {
  if (isLocked) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Lock className="w-4 h-4" />
          <span>Waiting for previous stage to complete</span>
        </div>
      </div>
    );
  }

  const isStarted = status !== 'locked';
  const isInProgress = ['active', 'in_progress', 'delivered', 'payment_pending', 'completed', 'complete'].includes(status);
  const isDelivered = ['delivered', 'payment_pending', 'completed', 'complete'].includes(status);
  const isPaid = ['completed', 'complete'].includes(status);
  const isAwaitingPayment = status === 'payment_pending';

  const getStepColor = (step: 'started' | 'progress' | 'delivered' | 'payment'): string => {
    switch (step) {
      case 'started':
        if (!isStarted) return 'bg-gray-400';
        if (isStarted && !isInProgress) return 'bg-red-500';
        return 'bg-green-500';

      case 'progress':
        if (!isInProgress) return 'bg-gray-400';
        if (isInProgress && !isDelivered && status !== 'active') return 'bg-red-500';
        if (status === 'active' || status === 'in_progress') return 'bg-red-500';
        return 'bg-green-500';

      case 'delivered':
        if (!isDelivered) return 'bg-gray-400';
        if (isDelivered && !isPaid && status === 'delivered') return 'bg-red-500';
        return 'bg-green-500';

      case 'payment':
        if (!isPaid && !isAwaitingPayment) return 'bg-gray-400';
        if (isAwaitingPayment) return 'bg-red-500';
        return 'bg-green-500';

      default:
        return 'bg-gray-400';
    }
  };

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between">
        <div className="flex flex-col items-center gap-1.5">
          <div className={`w-2 h-2 rounded-full ${getStepColor('started')}`} />
          <span className="text-xs text-gray-500">Started</span>
        </div>

        <div className="flex-1 h-px bg-gray-300 mx-2" />

        <div className="flex flex-col items-center gap-1.5">
          <div className={`w-2 h-2 rounded-full ${getStepColor('progress')}`} />
          <span className="text-xs text-gray-500 text-center whitespace-nowrap">Work in Progress</span>
        </div>

        <div className="flex-1 h-px bg-gray-300 mx-2" />

        <div className="flex flex-col items-center gap-1.5">
          <div className={`w-2 h-2 rounded-full ${getStepColor('delivered')}`} />
          <span className="text-xs text-gray-500">Delivered</span>
        </div>

        <div className="flex-1 h-px bg-gray-300 mx-2" />

        <div className="flex flex-col items-center gap-1.5">
          <div className={`w-2 h-2 rounded-full ${getStepColor('payment')}`} />
          <span className="text-xs text-gray-500">Payment</span>
        </div>
      </div>
    </div>
  );
}
