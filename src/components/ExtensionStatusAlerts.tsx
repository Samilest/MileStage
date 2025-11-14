import { Clock, XCircle } from 'lucide-react';

interface Extension {
  id: string;
  amount?: number;
  reference_code?: string;
  status?: string;
  marked_paid_at?: string;
  rejected_at?: string;
  rejection_reason?: string;
}

interface ExtensionStatusAlertsProps {
  pendingExtensions: Extension[];
  rejectedExtensions: Extension[];
}

export default function ExtensionStatusAlerts({
  pendingExtensions,
  rejectedExtensions,
}: ExtensionStatusAlertsProps) {
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const latestRejected = rejectedExtensions.length > 0 ? rejectedExtensions[0] : null;

  return (
    <>
      {pendingExtensions.length > 0 && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4 rounded-lg">
          <h3 className="font-bold text-yellow-900 mb-2 flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Extra Revision Payment Pending Verification
          </h3>
          <div className="mt-2">
            <p className="text-sm text-yellow-800">
              You marked an extra revision payment as sent on{' '}
              <strong>{formatDate(pendingExtensions[0].marked_paid_at)}</strong>.
            </p>
            <p className="text-sm text-yellow-800 mt-1">
              Waiting for freelancer to verify payment received.
            </p>
            <div className="mt-2 bg-yellow-100 rounded p-2">
              <p className="text-xs text-yellow-700">
                <strong>Amount:</strong> ${pendingExtensions[0].amount} |{' '}
                <strong>Reference:</strong> {pendingExtensions[0].reference_code}
              </p>
            </div>
          </div>
        </div>
      )}

      {pendingExtensions.length === 0 && latestRejected && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4 rounded-lg">
          <h3 className="font-bold text-red-900 mb-2 flex items-center gap-2">
            <XCircle className="w-5 h-5" />
            Extra Revision Payment Issue
          </h3>
          <div>
            <p className="text-red-800 font-medium">
              Your extra revision payment for ${latestRejected.amount} was not received by the freelancer.
            </p>
            <p className="text-sm text-red-700 mt-1">
              <strong>Rejected on:</strong> {formatDate(latestRejected.rejected_at)}
            </p>
            <p className="text-sm text-red-700 mt-1">
              <strong>Reason:</strong> {latestRejected.rejection_reason || 'Payment not received'}
            </p>
            <div className="mt-3 bg-red-100 rounded p-3">
              <p className="text-sm text-red-800">
                <strong>Next steps:</strong> Please verify your payment was sent correctly, or purchase again using a different payment method.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
