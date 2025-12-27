import { DollarSign } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Extension {
  id: string;
  amount: number;
  reference_code: string;
  marked_paid_at: string;
  stage_id: string;
}

interface ExtensionVerificationAlertProps {
  extensions: Extension[];
  onVerified: () => void;
}

export default function ExtensionVerificationAlert({
  extensions,
  onVerified,
}: ExtensionVerificationAlertProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const handleVerifyExtension = async (extensionId: string, stageId: string) => {
    try {
      const { error: extensionError } = await supabase
        .from('extensions')
        .update({
          status: 'verified',
          verified_at: new Date().toISOString(),
        })
        .eq('id', extensionId);

      if (extensionError) throw extensionError;

      const { data: stage, error: stageSelectError } = await supabase
        .from('stages')
        .select('revisions_included')
        .eq('id', stageId)
        .maybeSingle();

      if (stageSelectError) throw stageSelectError;

      const { error: stageError } = await supabase
        .from('stages')
        .update({
          revisions_included: (stage?.revisions_included || 2) + 1,
        })
        .eq('id', stageId);

      if (stageError) throw stageError;

      alert('✅ Extension verified! Client can now request 1 more revision.');
      onVerified();
    } catch (error: any) {
      console.error('Error verifying extension:', error);
      alert('Failed to verify extension: ' + (error?.message || 'Unknown error'));
    }
  };

  const handleRejectExtension = async (extensionId: string) => {
    if (!confirm('Confirm that you have NOT received this payment?')) return;

    try {
      const { error } = await supabase
        .from('extensions')
        .update({
          status: 'rejected',
          rejected_at: new Date().toISOString(),
        })
        .eq('id', extensionId);

      if (error) throw error;

      alert('Extension payment marked as not received. Client will be notified.');
      onVerified();
    } catch (error: any) {
      console.error('Error rejecting extension:', error);
      alert('Failed to reject extension: ' + (error?.message || 'Unknown error'));
    }
  };

  if (extensions.length === 0) return null;

  return (
    <div className="bg-blue-50 border-l-4 border-blue-400 p-6 mb-6">
      <h3 className="font-bold text-xl mb-4 flex items-center gap-2">
        <DollarSign className="w-6 h-6 text-blue-600" />
        Extra Revision Payment Pending
      </h3>
      {extensions.map((ext) => (
        <div key={ext.id} className="bg-white p-4 rounded-lg mb-3 shadow-sm border border-blue-200">
          <p className="font-semibold text-gray-900 text-lg mb-2">
            Client purchased extra revision for ${ext.amount}
          </p>
          <p className="text-sm text-gray-600 mb-1">
            <strong>Reference:</strong> {ext.reference_code}
          </p>
          <p className="text-sm text-gray-600 mb-4">
            <strong>Marked paid:</strong> {formatDate(ext.marked_paid_at)}
          </p>

          <div className="flex gap-3">
            <button
              onClick={() => handleVerifyExtension(ext.id, ext.stage_id)}
              className="flex-1 bg-green-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-600 transition-colors"
            >
              ✅ Verify Payment Received
            </button>
            <button
              onClick={() => handleRejectExtension(ext.id)}
              className="flex-1 bg-gray-300 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-400 transition-colors"
            >
              ❌ Payment Not Received
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
