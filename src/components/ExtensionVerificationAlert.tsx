import { DollarSign } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { notifyExtensionVerified, notifyExtensionRejected } from '../lib/email';

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
  projectId?: string;
  projectName?: string;
  clientEmail?: string;
  clientName?: string;
  freelancerName?: string;
  shareCode?: string;
  currency?: string;
}

export default function ExtensionVerificationAlert({
  extensions,
  onVerified,
  projectId,
  projectName,
  clientEmail,
  clientName,
  freelancerName,
  shareCode,
  currency = 'USD',
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

  const handleVerifyExtension = async (extensionId: string, stageId: string, amount: number) => {
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
        .select('revisions_included, name, stage_number')
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

      // Send email notification to client
      try {
        console.log('[Extension Verified] Sending notification email to client...');
        if (clientEmail && projectName) {
          const stageName = stage?.name || `Stage ${stage?.stage_number || ''}`;
          const portalUrl = shareCode ? `https://milestage.com/client/${shareCode}` : 'https://milestage.com';
          
          await notifyExtensionVerified({
            clientEmail: clientEmail,
            clientName: clientName || 'there',
            projectName: projectName,
            stageName: stageName,
            amount: amount.toString(),
            currency: currency,
            freelancerName: freelancerName || 'Your freelancer',
            portalUrl: portalUrl,
          });
          
          console.log('[Extension Verified] ✅ Email sent to client');
        } else {
          console.log('[Extension Verified] Missing client email or project name for email');
        }
      } catch (emailError: any) {
        console.error('[Extension Verified] Email failed (non-critical):', emailError.message);
      }

      alert('✅ Extension verified! Client can now request 1 more revision.');
      onVerified();
    } catch (error: any) {
      console.error('Error verifying extension:', error);
      alert('Failed to verify extension: ' + (error?.message || 'Unknown error'));
    }
  };

  const handleRejectExtension = async (extensionId: string, stageId: string, amount: number) => {
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

      // Send email notification to client
      try {
        console.log('[Extension Rejected] Sending notification email to client...');
        if (clientEmail && projectName) {
          // Get stage info
          const { data: stage } = await supabase
            .from('stages')
            .select('name, stage_number')
            .eq('id', stageId)
            .maybeSingle();
          
          const stageName = stage?.name || `Stage ${stage?.stage_number || ''}`;
          const portalUrl = shareCode ? `https://milestage.com/client/${shareCode}` : 'https://milestage.com';
          
          await notifyExtensionRejected({
            clientEmail: clientEmail,
            clientName: clientName || 'there',
            projectName: projectName,
            stageName: stageName,
            amount: amount.toString(),
            currency: currency,
            freelancerName: freelancerName || 'Your freelancer',
            portalUrl: portalUrl,
          });
          
          console.log('[Extension Rejected] ✅ Email sent to client');
        } else {
          console.log('[Extension Rejected] Missing client email or project name for email');
        }
      } catch (emailError: any) {
        console.error('[Extension Rejected] Email failed (non-critical):', emailError.message);
      }

      alert('Extension payment marked as not received. Client has been notified.');
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
              onClick={() => handleVerifyExtension(ext.id, ext.stage_id, ext.amount)}
              className="flex-1 bg-green-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-600 transition-colors"
            >
              ✅ Verify Payment Received
            </button>
            <button
              onClick={() => handleRejectExtension(ext.id, ext.stage_id, ext.amount)}
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
