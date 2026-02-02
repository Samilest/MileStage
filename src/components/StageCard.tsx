// FORCE REBUILD v7 - payment_status='received' fix deployed
import {
  Lock,
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
  MessageSquare,
  DollarSign,
  Calendar,
  Plus,
  ThumbsUp,
  RotateCcw,
  X,
  Circle,
  Pause,
  Loader2,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '../lib/supabase';
import { notifyRevisionRequested, notifyStageApproved, notifyPaymentMarked, notifyExtensionPurchased } from '../lib/email';
import NoteBox from './NoteBox';
import StageProgress from './StageProgress';
import ExtensionPurchaseModal from './ExtensionPurchaseModal';
import ExtensionStatusAlerts from './ExtensionStatusAlerts';
import StripePaymentButton from './StripePaymentButton';
import { formatCurrency, getCurrencySymbol, type CurrencyCode } from '../lib/currency';

interface Extension {
  id: string;
  purchased_at?: string;
  additional_revisions?: number;
  amount?: number;
  reference_code?: string;
  status?: string;
  marked_paid_at?: string;
  rejected_at?: string;
  rejection_reason?: string;
}

interface Stage {
  id: string;
  stage_number: number;
  name: string;
  amount: number;
  status: string;
  revisions_included: number;
  revisions_used: number;
  extension_enabled: boolean;
  extension_price: number;
  extension_purchased: boolean;
  payment_status: string;
  payment_received_at: string | null;
  deliverables: Array<{
    id: string;
    name: string;
    file_url: string;
    description?: string;
    uploaded_at: string;
  }>;
  revisions: Array<{
    id: string;
    revision_number: number;
    feedback: string;
    status: string;
    created_at: string;
    completed_at: string | null;
  }>;
  extensions: Extension[];
}

interface StageCardProps {
  stage: Stage;
  readOnly?: boolean;
  showNoteBox?: boolean;
  authorType?: 'freelancer' | 'client';
  authorName?: string;
  projectId?: string;
  shareCode?: string;
  currency?: CurrencyCode;
  paymentMethods?: {
    paypal?: string;
    venmo?: string;
    bank_transfer?: string;
    other?: string;
  };
  manualPaymentInstructions?: string | null;
}

export default function StageCard({ stage, readOnly = false, showNoteBox = false, authorType = 'client', authorName, projectId, shareCode, currency = 'USD', paymentMethods = {}, manualPaymentInstructions }: StageCardProps) {
  const [isRevisionModalOpen, setIsRevisionModalOpen] = useState(false);
  const [revisionFeedback, setRevisionFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [validationError, setValidationError] = useState('');
  const [isExtensionModalOpen, setIsExtensionModalOpen] = useState(false);
  const [pendingExtensions, setPendingExtensions] = useState<Extension[]>([]);
  const [paidExtensions, setPaidExtensions] = useState<Extension[]>([]);
  const [rejectedExtensions, setRejectedExtensions] = useState<Extension[]>([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showOfflinePayment, setShowOfflinePayment] = useState(false);
  const [isMarkingPayment, setIsMarkingPayment] = useState(false);
  const [isMarkingRevisionUsed, setIsMarkingRevisionUsed] = useState(false);
  const [pendingPayments, setPendingPayments] = useState<Array<{
    id: string;
    amount: number;
    reference_code: string;
    marked_paid_at: string;
    status: string;
  }>>([]);
  const [rejectedPayments, setRejectedPayments] = useState<Array<{
    id: string;
    amount: number;
    reference_code: string;
    rejected_at: string;
    rejection_reason: string | null;
  }>>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [creatingPayment, setCreatingPayment] = useState(false);
  const [actualPaymentStatus, setActualPaymentStatus] = useState<string>(
  stage.payment_status === 'received' ? 'paid' : (stage.payment_status || 'unpaid')
);

  // Create a stable dependency key for extensions
  const extensionsKey = JSON.stringify(stage.extensions?.map(e => ({ id: e.id, status: e.status })) || []);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      await checkExtensionStatus(isMounted);
      await checkStagePaymentStatus(isMounted);
    };

    loadData();

    // Subscribe to stage_payments changes for real-time updates
    const stagePaymentsChannel = supabase
      .channel(`stage-payments-${stage.id}`)
      .on(
        'postgres_changes',
        {
          event: '*', // Listen for all changes (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'stage_payments',
          filter: `stage_id=eq.${stage.id}`,
        },
        (payload) => {
          if (!isMounted) return;
          console.log('[StageCard] stage_payments changed:', payload);
          // Reload payment status when any change occurs
          checkStagePaymentStatus(isMounted);
        }
      )
      .subscribe();

    // Subscribe to stages changes for status updates
    const stagesChannel = supabase
      .channel(`stage-status-${stage.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'stages',
          filter: `id=eq.${stage.id}`,
        },
        (payload) => {
          if (!isMounted) return;
          console.log('[StageCard] stage updated:', payload);
          // Reload payment status when stage is updated
          checkStagePaymentStatus(isMounted);
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(stagePaymentsChannel);
      supabase.removeChannel(stagesChannel);
    };
  }, [stage.id, extensionsKey]);

  useEffect(() => {
    // Update actualPaymentStatus when stage.payment_status changes
    if (stage.payment_status === 'received') {
      setActualPaymentStatus('paid');
    }
  }, [stage.payment_status]);
  const checkExtensionStatus = async (isMounted: boolean) => {
    try {
      const { data: pending, error: pendingError } = await supabase
        .from('extensions')
        .select('*')
        .eq('stage_id', stage.id)
        .eq('status', 'marked_paid');

      if (pendingError) throw pendingError;
      if (!isMounted) return;
      setPendingExtensions(pending || []);

      const { data: verified, error: verifiedError } = await supabase
        .from('extensions')
        .select('*')
        .eq('stage_id', stage.id)
        .eq('status', 'verified')
        .order('verified_at', { ascending: false })
        .limit(1);

      if (verifiedError) throw verifiedError;

      // Also check for Stripe-paid extensions (status = 'paid')
      const { data: paid, error: paidError } = await supabase
        .from('extensions')
        .select('*')
        .eq('stage_id', stage.id)
        .eq('status', 'paid');

      if (paidError) throw paidError;
      if (!isMounted) return;
      setPaidExtensions(paid || []);

      const { data: rejected, error: rejectedError } = await supabase
        .from('extensions')
        .select('*')
        .eq('stage_id', stage.id)
        .eq('status', 'rejected')
        .order('rejected_at', { ascending: false });

      if (rejectedError) throw rejectedError;
      if (!isMounted) return;

      if (verified && verified.length > 0 && rejected && rejected.length > 0) {
        const latestVerified = new Date(verified[0].verified_at || 0);
        const filteredRejected = rejected.filter(r => {
          const rejectedDate = new Date(r.rejected_at || 0);
          return rejectedDate > latestVerified;
        });
        setRejectedExtensions(filteredRejected);
      } else {
        setRejectedExtensions(rejected || []);
      }
    } catch (error) {
      console.error('Error checking extension status:', error);
    }
  };

  const checkStagePaymentStatus = async (isMounted: boolean) => {
    try {
      // Check for verified payments first
      const { data: verified, error: verifiedError } = await supabase
        .from('stage_payments')
        .select('*')
        .eq('stage_id', stage.id)
        .eq('status', 'verified')
        .order('verified_at', { ascending: false })
        .limit(1);

      if (verifiedError) throw verifiedError;
      if (!isMounted) return;

      // If there's a verified payment, update actual status to 'paid'
      if (verified && verified.length > 0) {
        setActualPaymentStatus('paid');
      }

      const { data: pending, error: pendingError } = await supabase
        .from('stage_payments')
        .select('*')
        .eq('stage_id', stage.id)
        .eq('status', 'marked_paid');

      if (pendingError) throw pendingError;
      if (!isMounted) return;
      setPendingPayments(pending || []);

      const { data: rejected, error: rejectedError } = await supabase
        .from('stage_payments')
        .select('*')
        .eq('stage_id', stage.id)
        .eq('status', 'rejected')
        .order('rejected_at', { ascending: false });

      if (rejectedError) throw rejectedError;
      if (!isMounted) return;
      setRejectedPayments(rejected || []);
    } catch (error) {
      console.error('Error checking stage payment status:', error);
    }
  };
  const getStatusInfo = () => {
    switch (stage.status) {
      case 'locked':
        return {
          icon: Lock,
          label: 'Locked',
          color: 'text-gray-500',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-300',
          iconBg: 'bg-gray-200',
          cardOpacity: 'opacity-75',
        };
      case 'active':
      case 'in_progress':
        return {
          icon: Circle,
          label: 'In Progress',
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-green-500',
          iconBg: 'bg-yellow-100',
          cardOpacity: '',
        };
      case 'delivered':
        return {
          icon: CheckCircle2,
          label: 'Delivered',
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          iconBg: 'bg-blue-100',
          cardOpacity: '',
        };
      case 'payment_pending':
        return {
          icon: DollarSign,
          label: 'Payment Pending',
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          iconBg: 'bg-yellow-100',
          cardOpacity: '',
        };
      case 'paused':
        return {
          icon: Pause,
          label: 'Paused',
          color: 'text-orange-600',
          bgColor: 'bg-orange-50',
          borderColor: 'border-orange-200',
          iconBg: 'bg-orange-100',
          cardOpacity: '',
        };
      case 'review':
        return {
          icon: MessageSquare,
          label: 'In Review',
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          iconBg: 'bg-yellow-100',
          cardOpacity: '',
        };
      case 'completed':
      case 'complete':
        return {
          icon: CheckCircle2,
          label: 'Completed',
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-500',
          iconBg: 'bg-green-100',
          cardOpacity: '',
        };
      case 'cancelled':
        return {
          icon: XCircle,
          label: 'Cancelled',
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          iconBg: 'bg-red-100',
          cardOpacity: '',
        };
      default:
        return {
          icon: Clock,
          label: stage.status,
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          iconBg: 'bg-gray-100',
          cardOpacity: '',
        };
    }
  };

  const getPaymentStatusInfo = () => {
    switch (stage.payment_status) {
      case 'received':
      case 'paid':
        return {
          label: '✅ Verified',
          color: 'text-green-700',
          bgColor: 'bg-green-100',
        };
      case 'pending':
        return {
          label: '⏳ Pending',
          color: 'text-yellow-700',
          bgColor: 'bg-yellow-100',
        };
      case 'unpaid':
        return {
          label: 'Awaiting Payment',
          color: 'text-gray-700',
          bgColor: 'bg-gray-100',
        };
      case 'overdue':
        return {
          label: '❌ Overdue',
          color: 'text-red-700',
          bgColor: 'bg-red-100',
        };
      default:
        return {
          label: stage.payment_status,
          color: 'text-gray-700',
          bgColor: 'bg-gray-100',
        };
    }
  };

  const statusInfo = getStatusInfo();
  const paymentInfo = getPaymentStatusInfo();
  const StatusIcon = statusInfo.icon;

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleApproveStage = async () => {
    setShowPaymentModal(true);
  };

  const handleMarkPaymentSent = async () => {
    setIsMarkingPayment(true);
    try {
      const referenceCode = `STAGE${stage.stage_number}-${stage.id.slice(0, 8).toUpperCase()}`;

      const { error: paymentError } = await supabase
        .from('stage_payments')
        .insert({
          stage_id: stage.id,
          amount: stage.amount,
          reference_code: referenceCode,
          status: 'marked_paid',
          marked_paid_at: new Date().toISOString()
        });

      if (paymentError) throw paymentError;

      const { error: stageError } = await supabase
        .from('stages')
        .update({
          status: 'payment_pending',
          approved_at: new Date().toISOString()
        })
        .eq('id', stage.id);

      if (stageError) throw stageError;

      // Send email notification to freelancer (wrapped in try-catch - won't break if fails)
      try {
        console.log('[Payment Marked] Sending notification email to freelancer...');
        console.log('[Payment Marked] projectId:', projectId);
        
        if (projectId) {
          // Fetch project details
          const { data: projectData, error: projectError } = await supabase
            .from('projects')
            .select('project_name, client_name, user_id')
            .eq('id', projectId)
            .single();
          
          console.log('[Payment Marked] projectData:', projectData);
          console.log('[Payment Marked] projectError:', projectError);
          
          if (projectData && projectData.user_id) {
            // Fetch freelancer email separately
            const { data: freelancerData, error: freelancerError } = await supabase
              .from('user_profiles')
              .select('email, name')
              .eq('id', projectData.user_id)
              .single();
            
            console.log('[Payment Marked] freelancerData:', freelancerData);
            console.log('[Payment Marked] freelancerError:', freelancerError);
            
            if (freelancerData && freelancerData.email) {
              await notifyPaymentMarked({
                freelancerEmail: freelancerData.email,
                freelancerName: freelancerData.name || 'there',
                projectName: projectData.project_name,
                stageName: stage.name || `Stage ${stage.stage_number}`,
                amount: stage.amount.toString(),
                currency: currency || 'USD',
                clientName: projectData.client_name || 'Your client',
                referenceCode: referenceCode,
                projectId: projectId,
              });
              
              console.log('[Payment Marked] ✅ Payment notification email sent to freelancer');
            } else {
              console.log('[Payment Marked] No freelancer email found');
            }
          } else {
            console.log('[Payment Marked] No project data or user_id found');
          }
        } else {
          console.log('[Payment Marked] No projectId available for email');
        }
      } catch (emailError: any) {
        console.error('[Payment Marked] Email sending failed (non-critical):', emailError.message);
        // Don't throw - payment marking still succeeds even if email fails
      }

      setSuccessMessage('Payment marked! Waiting for freelancer verification.');
      setShowPaymentModal(false);
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err: any) {
      alert('Failed to mark payment: ' + err.message);
    } finally {
      setIsMarkingPayment(false);
    }
  };

  const handleRequestRevision = async () => {
    console.log('🔍 === REVISION SUBMISSION DEBUG ===');
    console.log('Stage object:', stage);
    console.log('Stage ID:', stage?.id);
    console.log('Stage ID type:', typeof stage?.id);
    console.log('Feedback:', revisionFeedback);
    console.log('Feedback length:', revisionFeedback?.length);

    const trimmed = revisionFeedback.trim();

    if (trimmed.length === 0) {
      setValidationError('Please describe what changes you need');
      return;
    }

    if (trimmed.length < 10) {
      setValidationError('Please provide more detail (at least 10 characters)');
      return;
    }

    setIsSubmitting(true);
    setValidationError('');

    try {
      console.log('Attempting INSERT...');

      const insertData = {
        stage_id: stage.id,
        feedback: trimmed,
        revision_number: (stage.revisions_used || 0) + 1,
      };

      console.log('Insert data:', insertData);

      const { data, error: revisionError } = await supabase
        .from('revisions')
        .insert(insertData)
        .select();

      if (revisionError) {
        console.error('❌ INSERT ERROR:', {
          message: revisionError.message,
          code: revisionError.code,
          details: revisionError.details,
          hint: revisionError.hint
        });
        alert('Insert failed: ' + revisionError.message);
        throw revisionError;
      }

      console.log('✅ INSERT SUCCESS:', data);

      console.log('═══ STAGE UPDATE DEBUG ═══');
      console.log('Stage object:', stage);
      console.log('Stage ID:', stage.id);
      console.log('Stage ID type:', typeof stage.id);
      console.log('Current revisions_used:', stage.revisions_used);
      console.log('Will update to:', (stage.revisions_used || 0) + 1);
      console.log('═══════════════════════════');

      console.log('Updating stage...');
      const { data: updatedData, error: stageError } = await supabase
        .from('stages')
        .update({
          status: 'in_progress',
          revisions_used: (stage.revisions_used || 0) + 1,
        })
        .eq('id', stage.id)
        .select();

      console.log('Update result:', updatedData);
      console.log('Update error:', stageError);

      if (!updatedData || updatedData.length === 0) {
        console.error('❌ UPDATE MATCHED ZERO ROWS!');
        console.error('This means stage.id does not exist in the database');
      }

      if (stageError) {
        console.error('❌ STAGE UPDATE ERROR:', {
          message: stageError.message,
          code: stageError.code,
          details: stageError.details,
          hint: stageError.hint
        });
        throw stageError;
      }

      console.log('✅ Stage updated');

      // Send email notification to freelancer (wrapped in try-catch - won't break if fails)
      try {
        console.log('[Revision Request] Sending notification email to freelancer...');
        console.log('[Revision Request] projectId:', projectId);
        
        if (projectId) {
          // Fetch project details
          const { data: projectData, error: projectError } = await supabase
            .from('projects')
            .select('project_name, client_name, user_id')
            .eq('id', projectId)
            .single();
          
          console.log('[Revision Request] projectData:', projectData);
          console.log('[Revision Request] projectError:', projectError);
          
          if (projectData && projectData.user_id) {
            // Fetch freelancer email separately
            const { data: freelancerData, error: freelancerError } = await supabase
              .from('user_profiles')
              .select('email, name')
              .eq('id', projectData.user_id)
              .single();
            
            console.log('[Revision Request] freelancerData:', freelancerData);
            console.log('[Revision Request] freelancerError:', freelancerError);
            
            if (freelancerData && freelancerData.email) {
              await notifyRevisionRequested({
                freelancerEmail: freelancerData.email,
                freelancerName: freelancerData.name || 'there',
                projectName: projectData.project_name,
                stageName: stage.name || `Stage ${stage.stage_number}`,
                feedback: trimmed,
                clientName: authorName || 'Your client',
                projectId: projectId,
              });
              
              console.log('[Revision Request] ✅ Revision notification email sent to freelancer');
            } else {
              console.log('[Revision Request] No freelancer email found');
            }
          } else {
            console.log('[Revision Request] No project data or user_id found');
          }
        } else {
          console.log('[Revision Request] No projectId available for email');
        }
      } catch (emailError: any) {
        console.error('[Revision Request] Email sending failed (non-critical):', emailError.message);
        // Don't throw - revision submission still succeeds even if email fails
      }

      setSuccessMessage('Revision requested successfully!');
      setIsRevisionModalOpen(false);
      setRevisionFeedback('');
      setValidationError('');

      setTimeout(() => {
        setSuccessMessage('');
        window.location.reload();
      }, 1500);
    } catch (error: any) {
      console.error('❌ CATCH ERROR:', error);
      alert('Failed: ' + (error?.message || 'Unknown error'));
      setValidationError('Failed to submit revision request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMarkRevisionUsed = async () => {
    if (revisionsRemaining <= 0) {
      alert('No revisions remaining to mark as used.');
      return;
    }

    if (!confirm(`Mark 1 revision as used? This will update the count from ${stage.revisions_used}/${totalRevisions} to ${stage.revisions_used + 1}/${totalRevisions}.`)) {
      return;
    }

    setIsMarkingRevisionUsed(true);

    try {
      const { error } = await supabase
        .from('stages')
        .update({ 
          revisions_used: (stage.revisions_used || 0) + 1 
        })
        .eq('id', stage.id);

      if (error) throw error;

      // Success - trigger parent refresh
      window.dispatchEvent(new Event('revisionMarkedUsed'));
      
      alert(`✓ Revision marked as used. ${revisionsRemaining - 1} remaining.`);
    } catch (error) {
      console.error('Error marking revision as used:', error);
      alert('Failed to mark revision as used. Please try again.');
    } finally {
      setIsMarkingRevisionUsed(false);
    }
  };

  // Calculate additional revisions from paid/verified extensions
  const additionalRevisions = paidExtensions.reduce((sum, ext) => sum + (ext.additional_revisions || 0), 0);
  const totalRevisions = (stage.revisions_included || 2) + additionalRevisions;
  const revisionsRemaining = totalRevisions - (stage.revisions_used || 0);
  const canRequestRevision = revisionsRemaining > 0;
  const isCompleted = stage.status === 'completed' || stage.status === 'complete';

  if (stage.stage_number === 0) {
    const isPaid = actualPaymentStatus === 'received' || actualPaymentStatus === 'paid' || stage.payment_status === 'received';
    const hasPendingPayment = pendingPayments.length > 0;
    const hasRejectedPayment = rejectedPayments.length > 0;
    
    return (
      <div
        className={`bg-white border-2 ${
          isPaid ? 'border-green-500' : hasPendingPayment ? 'border-green-400' : 'border-yellow-400'
        } rounded-xl overflow-hidden shadow-md`}
      >
        <div className={`${
          isPaid ? 'bg-green-50' : hasPendingPayment ? 'bg-green-50' : 'bg-yellow-50'
        } px-4 sm:px-6 py-5 sm:py-6 space-y-4`}>
          <div className="flex items-start gap-3">
            <div className={`${
              isPaid ? 'bg-green-100' : hasPendingPayment ? 'bg-green-100' : 'bg-yellow-100'
            } rounded-full p-2 flex items-center justify-center flex-shrink-0`}>
              <DollarSign className={`w-5 h-5 ${
                isPaid ? 'text-green-600' : hasPendingPayment ? 'text-green-600' : 'text-yellow-600'
              }`} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-xl font-bold text-gray-900">
                Stage 0: Down Payment
              </h3>
              <span className={`text-base font-semibold ${
                isPaid ? 'text-green-600' : hasPendingPayment ? 'text-green-600' : 'text-yellow-600'
              }`}>
                {isPaid ? 'Paid ✓' : hasPendingPayment ? '⏳ Pending Verification' : 'Awaiting Payment'}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="text-lg font-semibold text-gray-900">
              Amount: <span className="text-2xl font-black">{formatCurrency(stage.amount, currency)}</span>
            </div>
            {!isPaid && !hasPendingPayment && (
              <button
                onClick={() => setShowPaymentModal(true)}
                disabled={creatingPayment}
                className="px-6 py-2.5 bg-green-500 text-white rounded-lg hover:bg-green-600 font-semibold transition-all duration-200 shadow-sm hover:shadow disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {creatingPayment ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Pay Now'
                )}
              </button>
            )}
          </div>
        </div>

        {/* Pending Payment Status */}
        {hasPendingPayment && !isPaid && (
          <div className="p-4 sm:p-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-green-800 mb-2">
                <Clock className="w-5 h-5 flex-shrink-0" />
                <p className="text-sm font-semibold">
                  Payment Pending Verification
                </p>
              </div>
              <p className="text-sm text-green-700">
                You marked the payment as sent. Waiting for the freelancer to verify payment received.
              </p>
              <div className="mt-2 text-xs text-green-600">
                Amount: {formatCurrency(stage.amount, currency)} | Reference: {pendingPayments[0]?.reference_code}
              </div>
            </div>
          </div>
        )}

        {/* Rejected Payment Warning */}
        {hasRejectedPayment && !isPaid && !hasPendingPayment && (
          <div className="p-4 sm:p-6">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-gray-800 mb-2">
                <XCircle className="w-5 h-5 flex-shrink-0" />
                <p className="text-sm font-semibold">
                  Payment Not Received
                </p>
              </div>
              <p className="text-sm text-gray-700">
                The freelancer could not verify your previous payment. Please try again or contact them directly.
              </p>
            </div>
          </div>
        )}

        {isPaid && (
          <div className="p-4 sm:p-6">
            <div className="flex items-center gap-2 text-green-700 bg-green-100 rounded-lg p-4">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm font-medium">
                Payment received on {formatDate(stage.payment_received_at)}
              </p>
            </div>
          </div>
        )}

        {/* Payment Modal for Stage 0 */}
        {showPaymentModal && createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center">
            {/* Backdrop */}
            <div 
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowPaymentModal(false)}
            />
            {/* Modal Content */}
            <div className="relative bg-white rounded-lg max-w-2xl w-full mx-4 p-6 max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold">
                  Pay Down Payment - {formatCurrency(stage.amount, currency)}
                </h2>
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="text-gray-600 hover:text-black"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
                <p className="font-semibold text-yellow-900">
                  💰 Down Payment Required
                </p>
                <p className="text-sm text-yellow-800 mt-1">
                  Pay this deposit to start the project. Choose your preferred payment method below.
                </p>
              </div>

              {/* Stripe Payment Button */}
              <div className="mb-6">
                <h3 className="font-semibold mb-3 text-lg">Pay with Card</h3>
                <StripePaymentButton
                  stageId={stage.id}
                  stageName={stage.name}
                  stageNumber={stage.stage_number}
                  amount={stage.amount}
                  currency={currency}
                  shareCode={shareCode || ''}
                  onSuccess={() => {
                    setShowPaymentModal(false);
                    setTimeout(() => window.location.reload(), 1000);
                  }}
                />
              </div>

              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-gray-500 font-medium">Or pay offline</span>
                </div>
              </div>

              {/* Manual Payment Instructions */}
              <div className="bg-gray-50 p-4 rounded mb-6">
                <h3 className="font-semibold mb-3">Manual Payment Instructions:</h3>
                <p className="text-sm mb-4 text-gray-700">
                  Pay {formatCurrency(stage.amount, currency)} using one of these methods:
                </p>

                {manualPaymentInstructions ? (
                  <div className="bg-white p-3 rounded border">
                    <p className="font-medium text-sm mb-2">Payment Details:</p>
                    <p className="text-sm text-gray-900 whitespace-pre-line">{manualPaymentInstructions}</p>
                  </div>
                ) : paymentMethods && (paymentMethods.paypal || paymentMethods.venmo || paymentMethods.bank_transfer || paymentMethods.other) ? (
                  <div className="space-y-2">
                    {paymentMethods.paypal && (
                      <div className="bg-white p-3 rounded border">
                        <p className="font-medium text-sm">PayPal</p>
                        <p className="text-sm text-gray-900 font-mono">{paymentMethods.paypal}</p>
                      </div>
                    )}
                    {paymentMethods.venmo && (
                      <div className="bg-white p-3 rounded border">
                        <p className="font-medium text-sm">Venmo</p>
                        <p className="text-sm text-gray-900 font-mono">{paymentMethods.venmo}</p>
                      </div>
                    )}
                    {paymentMethods.bank_transfer && (
                      <div className="bg-white p-3 rounded border">
                        <p className="font-medium text-sm">Bank Transfer</p>
                        <p className="text-sm text-gray-900 whitespace-pre-line">{paymentMethods.bank_transfer}</p>
                      </div>
                    )}
                    {paymentMethods.other && (
                      <div className="bg-white p-3 rounded border">
                        <p className="font-medium text-sm">Other</p>
                        <p className="text-sm text-gray-900 whitespace-pre-line">{paymentMethods.other}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-white p-3 rounded border">
                    <p className="text-sm text-gray-600">Contact the freelancer for payment details</p>
                  </div>
                )}

                <div className="mt-4 p-3 bg-white rounded border-2 border-blue-300">
                  <p className="font-semibold text-sm">Reference Code:</p>
                  <p className="text-lg font-mono font-bold text-blue-600">
                    STAGE{stage.stage_number}-{stage.id.slice(0, 8).toUpperCase()}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Include this code with your payment
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleMarkPaymentSent}
                  disabled={isMarkingPayment}
                  className="w-full bg-gray-700 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isMarkingPayment && <Loader2 className="w-5 h-5 animate-spin" />}
                  {isMarkingPayment ? 'Processing...' : '✅ I Paid Offline'}
                </button>

                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="w-full bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-all duration-200"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
      </div>
    );
  }

  if (isCompleted) {
    return (
      <div
        className="bg-green-50 border-2 border-green-500 rounded-lg p-4 sm:p-6 cursor-pointer hover:bg-green-100 transition-all shadow-md hover:shadow-lg"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
            <div className="bg-green-500 rounded-full p-2 flex-shrink-0">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-medium text-green-900 truncate">
                Stage {stage.stage_number}: {stage.name}
              </h3>
              <p className="text-sm text-green-700">
                Completed {formatDate(stage.payment_received_at)} • {formatCurrency(stage.amount, currency)} paid
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0">
            <div className="bg-green-500 text-white px-3 py-1 sm:px-4 sm:py-2 rounded-lg font-bold text-sm sm:text-base">
              {formatCurrency(stage.amount, currency)}
            </div>

            <div className="text-green-600">
              {isExpanded ? (
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
              ) : (
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              )}
            </div>
          </div>
        </div>

        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-green-200" onClick={(e) => e.stopPropagation()}>
            {stage.stage_number === 0 ? (
              // Stage 0 (Down Payment) - Simple display, no work/revisions
              <div className="text-center py-2">
                <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-lg">
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="font-medium">Down payment completed</span>
                </div>
              </div>
            ) : (
              // Regular stages - Show deliverables and revisions
              <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                <div>
                  <p className="text-gray-600">Deliverables:</p>
                  <p className="font-semibold text-gray-900">{stage.deliverables?.length || 0} files</p>
                </div>
                <div>
                  <p className="text-gray-600">Revisions Used:</p>
                  <p className="font-semibold text-gray-900">
                    {stage.revisions_used || 0}/{totalRevisions}
                  </p>
                  {!readOnly && revisionsRemaining > 0 && (
                    <button
                      onClick={handleMarkRevisionUsed}
                      disabled={isMarkingRevisionUsed}
                      className="mt-2 text-xs px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Mark 1 revision as used"
                    >
                      {isMarkingRevisionUsed ? 'Updating...' : 'Use Revision'}
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Only show deliverables and revisions for non-down-payment stages */}
            {stage.stage_number !== 0 && (
              <>
                {stage.deliverables && stage.deliverables.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-semibold text-gray-700 mb-3">Deliverables:</h4>
                    <div className="space-y-2">
                      {stage.deliverables.map((deliverable) => (
                        <div key={deliverable.id} className="bg-white rounded p-3 border border-green-200 hover:border-green-400 transition-colors">
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-gray-900 truncate">{deliverable.name}</div>
                              {deliverable.description && (
                                <p className="text-xs text-gray-600 mt-1 whitespace-pre-wrap line-clamp-2">
                                  {deliverable.description}
                                </p>
                              )}
                              <div className="text-xs text-gray-500 mt-1">
                                Uploaded {formatDate(deliverable.uploaded_at)}
                              </div>
                            </div>
                            <a
                              href={deliverable.file_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-shrink-0 px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600 transition-colors"
                            >
                              Open →
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {stage.revisions && stage.revisions.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-semibold text-gray-700 mb-3">Revision History:</h4>
                    <div className="space-y-2">
                      {stage.revisions.map((revision) => (
                        <div key={revision.id} className="bg-white rounded p-3 border border-green-200">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-gray-900 text-sm">
                              Revision {revision.revision_number}
                            </span>
                            <span className="text-xs text-gray-500">
                              {formatDate(revision.created_at)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700 whitespace-pre-wrap">{revision.feedback}</p>
                          {revision.completed_at && (
                            <p className="text-xs text-green-600 mt-2">
                              ✓ Completed {formatDate(revision.completed_at)}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={`bg-white border-2 ${statusInfo.borderColor} rounded-xl overflow-hidden transition-shadow duration-300 ${
        stage.status === 'locked'
          ? 'shadow-sm opacity-75'
          : stage.status === 'active' || stage.status === 'in_progress'
            ? 'shadow-lg hover:shadow-xl'
            : 'shadow-md hover:shadow-lg'
      }`}
    >
      <div className={`${statusInfo.bgColor} px-4 sm:px-6 py-4 sm:py-6 border-b ${statusInfo.borderColor}`}>
        {/* Mobile Layout */}
        <div className="flex sm:hidden flex-col gap-4">
          {/* Top Row: Stage Title */}
          <div className="flex items-center gap-3">
            <div className={`${statusInfo.iconBg} rounded-full p-2 flex items-center justify-center flex-shrink-0`}>
              <StatusIcon className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className={`text-lg font-bold ${
                stage.status === 'locked' ? 'text-gray-600' : 'text-gray-900'
              } truncate`}>
                Stage {stage.stage_number}: {stage.name}
              </h3>
              <span className={`text-sm font-semibold ${statusInfo.color}`}>
                {statusInfo.label}
              </span>
            </div>
          </div>
          
          {/* Bottom Row: Status Badge Left, Amount + Revisions Right */}
          <div className="flex items-center justify-between">
            <span
              className={`px-3 py-1.5 rounded-full text-sm font-semibold ${paymentInfo.bgColor} ${paymentInfo.color} ${
                stage.payment_status === 'pending' ? 'animate-pulse-slow' : ''
              }`}
            >
              {paymentInfo.label}
            </span>
            <div className="text-right">
              <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">Amount</div>
              <div className="text-2xl font-black text-gray-900">
                {formatCurrency(stage.amount, currency)}
              </div>
              {stage.stage_number !== 0 && (
                <div className="text-sm font-semibold" style={{
                  color: stage.revisions_used === 0 ? '#10b981' : stage.revisions_used >= totalRevisions ? '#ef4444' : '#f59e0b'
                }}>
                  Revisions: {stage.revisions_used}/{totalRevisions}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Desktop Layout (unchanged) */}
        <div className="hidden sm:flex items-center justify-between flex-wrap gap-4 sm:gap-6">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className={`${statusInfo.iconBg} rounded-full p-2 flex items-center justify-center flex-shrink-0`}>
              <StatusIcon className={`w-5 h-5 sm:w-6 sm:h-6 ${statusInfo.color}`} />
            </div>
            <div className="min-w-0">
              <h3 className={`text-lg sm:text-xl font-bold ${
                stage.status === 'locked' ? 'text-gray-600' : 'text-gray-900'
              } truncate`}>
                Stage {stage.stage_number}: {stage.name}
              </h3>
              <span className={`text-sm sm:text-base font-semibold ${statusInfo.color}`}>
                {statusInfo.label}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span
              className={`px-4 py-2 rounded-full text-base font-semibold ${paymentInfo.bgColor} ${paymentInfo.color} ${
                stage.payment_status === 'pending' ? 'animate-pulse-slow' : ''
              }`}
            >
              {paymentInfo.label}
            </span>
            <div className="text-right">
              <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">Amount</div>
              <div className="text-2xl lg:text-3xl font-black text-gray-900">
                {formatCurrency(stage.amount, currency)}
              </div>
              {stage.stage_number !== 0 && (
                <div className="flex items-center justify-end gap-2">
                  <div className="text-sm font-semibold" style={{
                    color: stage.revisions_used === 0 ? '#10b981' : stage.revisions_used >= totalRevisions ? '#ef4444' : '#f59e0b'
                  }}>
                    Revisions: {stage.revisions_used}/{totalRevisions}
                  </div>
                  {!readOnly && revisionsRemaining > 0 && (
                    <button
                      onClick={handleMarkRevisionUsed}
                      disabled={isMarkingRevisionUsed}
                      className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Mark 1 revision as used"
                    >
                      {isMarkingRevisionUsed ? '...' : 'Use'}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
        <StageProgress
          status={stage.status}
          isLocked={stage.status === 'locked'}
          deliverablesCount={stage.deliverables.length}
          payment_status={actualPaymentStatus}
        />

        {/* Show locked message and hide all content for locked stages */}
        {stage.status === 'locked' ? (
          <div className="bg-gray-100 border-2 border-gray-300 rounded-lg p-8 sm:p-12 text-center">
            <div className="bg-gray-200 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
              <Lock className="w-10 h-10 text-gray-500" />
            </div>
            <p className="text-lg sm:text-xl font-bold text-gray-700 mb-2">
              🔒 Stage Locked
            </p>
            <p className="text-sm sm:text-base text-gray-600 max-w-md mx-auto">
              This stage will unlock once the previous stage is completed and payment is received.
            </p>
          </div>
        ) : (
          <>
        {/* DELIVERABLES SECTION - Prioritized at top for client review */}
        <div>
          <h4 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-3">
            <FileText className="w-5 h-5" />
            Deliverables ({stage.deliverables.length})
          </h4>

          {stage.deliverables.length > 0 ? (
            <div className="space-y-3 mb-4">
              {stage.deliverables.map((deliverable) => (
                <div
                  key={deliverable.id}
                  className="bg-white border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-900 mb-1">{deliverable.name}</div>
                      {deliverable.description && (
                        <p className="text-sm text-gray-600 mb-2 whitespace-pre-wrap">
                          {deliverable.description}
                        </p>
                      )}
                      <a
                        href={deliverable.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:text-blue-700 hover:underline break-all"
                      >
                        {deliverable.file_url}
                      </a>
                    </div>
                    <a
                      href={deliverable.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-shrink-0 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm font-medium"
                    >
                      Open →
                    </a>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center p-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200 mb-4">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-white flex items-center justify-center">
                <FileText className="w-6 h-6 text-gray-400" />
              </div>
              <p className="text-gray-600 text-sm">
                {readOnly ? 'Waiting for freelancer to deliver work' : 'No deliverables yet'}
              </p>
            </div>
          )}

          {/* CLIENT ACTION BUTTONS - Directly below deliverables */}
          {readOnly && stage.status === 'delivered' && stage.payment_status !== 'received' && (
            <>
              <div className="bg-blue-50 border-l-4 border-blue-400 rounded-lg p-4 mb-4 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-blue-900 mb-1">Work has been delivered!</p>
                  <p className="text-sm text-blue-800">Please review the deliverables above and choose your next step.</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-center mb-3">
                <button
                  onClick={handleApproveStage}
                  className="flex-1 sm:flex-initial bg-green-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-600 transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <ThumbsUp className="w-5 h-5" />
                  Approve & Pay
                </button>
                {canRequestRevision && (
                  <button
                    onClick={() => setIsRevisionModalOpen(true)}
                    className="flex-1 sm:flex-initial bg-orange-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-600 transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    <RotateCcw className="w-5 h-5" />
                    Request Changes ({revisionsRemaining})
                  </button>
                )}
              </div>

              <p className="text-center text-sm text-gray-600 mb-4">
                Revisions remaining: <strong className={revisionsRemaining === 0 ? 'text-red-600' : revisionsRemaining === 1 ? 'text-orange-600' : 'text-green-600'}>{revisionsRemaining}/{totalRevisions}</strong>
              </p>
            </>
          )}

          {/* Extension purchase section */}
          {readOnly && stage.status === 'delivered' && !canRequestRevision && stage.extension_enabled && (
            <div className="mb-4 mt-12">
              <ExtensionStatusAlerts
                pendingExtensions={pendingExtensions}
                rejectedExtensions={rejectedExtensions}
              />

              <div className="bg-orange-50 border border-orange-300 rounded-lg p-4 text-center">
                <p className="text-orange-800 font-semibold mb-2">
                  All included revisions used ({stage.revisions_used}/{totalRevisions})
                </p>
                <p className="text-orange-700 text-sm mb-3">
                  Need more changes? Purchase an extra revision to get one additional revision beyond what's included.
                </p>

                <div className="flex justify-center">
                  {pendingExtensions.length > 0 ? (
                    <div className="text-center">
                      <button
                        disabled
                        className="bg-gray-300 text-gray-600 px-6 py-3 rounded-lg font-semibold cursor-not-allowed opacity-60"
                      >
                        ⏳ Extra Revision Payment Pending
                      </button>
                      <p className="text-xs text-gray-500 mt-2">
                        You have a pending extra revision payment awaiting verification
                      </p>
                    </div>
                  ) : (
                    <button
                      onClick={() => setIsExtensionModalOpen(true)}
                      className="bg-orange-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-600 transition-all duration-200"
                    >
                      Buy Extra Revision - {formatCurrency(stage.extension_price, currency)}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* NOTES & COMMUNICATION - Moved to bottom */}
        {showNoteBox && (
          <div>
            <NoteBox
              stageId={stage.id}
              authorType={authorType}
              authorName={authorName || 'You'}
            />
          </div>
        )}

        {/* REVISION HISTORY - Moved to bottom */}
        {stage.revisions.length > 0 && (
          <div>
            <h4 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Revision History
            </h4>
            <div className="space-y-2">
              {stage.revisions.map((revision) => (
                <div key={revision.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-gray-900">
                      Revision {revision.revision_number}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatDate(revision.created_at)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{revision.feedback}</p>
                  <span
                    className={`inline-block mt-2 px-2 py-1 rounded text-xs font-medium ${
                      revision.completed_at
                        ? 'bg-green-100 text-green-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}
                  >
                    {revision.completed_at ? 'Completed' : 'Pending'}
                  </span>
                  {revision.completed_at && (
                    <p className="text-xs text-green-600 mt-1">
                      Completed {formatDate(revision.completed_at)}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        </>
        )}

        {successMessage && (
          <div className="bg-green-50 border border-green-500 text-green-700 px-4 py-3 rounded-lg">
            {successMessage}
          </div>
        )}

        {/* Payment status alerts - Only show ONE at a time for clarity */}
        {/* Priority: Pending (newest state) > Rejected (old state) */}
        {readOnly && pendingPayments.length > 0 && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg">
            <h3 className="font-bold text-yellow-900 mb-2">
              ⏳ Payment Pending Verification
            </h3>
            <p className="text-sm text-yellow-800">
              You marked the payment as sent. Waiting for the freelancer to verify payment received.
            </p>
            <p className="text-xs text-yellow-700 mt-2">
              Amount: {formatCurrency(stage.amount, currency)} | Reference: {pendingPayments[0].reference_code}
            </p>
          </div>
        )}

        {/* Only show rejected alert if there's NO pending payment (client hasn't retried yet) */}
        {readOnly && rejectedPayments.length > 0 && pendingPayments.length === 0 && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-lg">
            <h3 className="font-bold text-red-900 mb-2">
              ⚠️ Payment Issue
            </h3>
            <p className="text-red-800">
              Your payment for {formatCurrency(stage.amount, currency)} was not received by the freelancer.
            </p>
            {rejectedPayments[0].rejection_reason && (
              <p className="text-sm text-red-700 mt-2">
                Reason: {rejectedPayments[0].rejection_reason}
              </p>
            )}
            <p className="text-sm text-red-700 mt-2">
              Please verify your payment was sent, or try again using a different method.
            </p>
            <div className="flex justify-start mt-3">
              <button
                onClick={() => {
                  setShowPaymentModal(true);
                }}
                className="bg-red-500 text-white px-6 py-3 rounded-lg hover:bg-red-600 font-semibold transition-all duration-200"
              >
                Retry Payment
              </button>
            </div>
          </div>
        )}
      </div>

      {isExtensionModalOpen && (
        <ExtensionPurchaseModal
          stageId={stage.id}
          stageName={stage.name}
          extensionPrice={stage.extension_price}
          projectId={projectId}
          currency={currency}
          paymentMethods={paymentMethods}
          manualPaymentInstructions={manualPaymentInstructions}
          onClose={() => setIsExtensionModalOpen(false)}
        />
      )}

      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">
                Complete Payment
              </h2>
              <button
                onClick={() => {
                  setShowPaymentModal(false);
                  setShowOfflinePayment(false);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="bg-green-50 border-l-4 border-green-500 p-3 mb-6">
              <p className="font-medium text-green-800 text-sm">
                ✓ Stage approved! Complete payment to continue.
              </p>
            </div>

            {/* Primary: Stripe Payment Button */}
            <StripePaymentButton
              stageId={stage.id}
              stageName={stage.name}
              stageNumber={stage.stage_number}
              amount={stage.amount}
              currency={currency}
              shareCode={shareCode || ''}
              onSuccess={() => {
                setShowPaymentModal(false);
                setShowOfflinePayment(false);
                setTimeout(() => window.location.reload(), 1000);
              }}
            />

            {/* Collapsible: Offline Payment */}
            <div className="mt-4">
              <button
                onClick={() => setShowOfflinePayment(!showOfflinePayment)}
                className="w-full text-left text-sm text-gray-500 hover:text-gray-700 flex items-center gap-2 py-2"
              >
                <span className={`transition-transform ${showOfflinePayment ? 'rotate-90' : ''}`}>▶</span>
                Pay another way (PayPal, bank transfer, etc.)
              </button>

              {showOfflinePayment && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="text-sm text-gray-600 mb-3">
                    Send {formatCurrency(stage.amount, currency)} using the details below, then click "I've Sent Payment".
                  </p>

                  {manualPaymentInstructions ? (
                    <div className="bg-gray-50 p-3 rounded-lg mb-3">
                      <p className="text-sm text-gray-900 whitespace-pre-line">{manualPaymentInstructions}</p>
                    </div>
                  ) : paymentMethods && (paymentMethods.paypal || paymentMethods.venmo || paymentMethods.bank_transfer || paymentMethods.other) ? (
                    <div className="bg-gray-50 p-3 rounded-lg mb-3 space-y-2">
                      {paymentMethods.paypal && (
                        <p className="text-sm"><span className="text-gray-500">PayPal:</span> <span className="font-medium">{paymentMethods.paypal}</span></p>
                      )}
                      {paymentMethods.venmo && (
                        <p className="text-sm"><span className="text-gray-500">Venmo:</span> <span className="font-medium">{paymentMethods.venmo}</span></p>
                      )}
                      {paymentMethods.bank_transfer && (
                        <p className="text-sm"><span className="text-gray-500">Bank:</span> <span className="font-medium whitespace-pre-line">{paymentMethods.bank_transfer}</span></p>
                      )}
                      {paymentMethods.other && (
                        <p className="text-sm"><span className="text-gray-500">Other:</span> <span className="font-medium whitespace-pre-line">{paymentMethods.other}</span></p>
                      )}
                    </div>
                  ) : (
                    <div className="bg-gray-50 p-3 rounded-lg mb-3">
                      <p className="text-sm text-gray-500">Contact the freelancer for payment details.</p>
                    </div>
                  )}

                  <p className="text-xs text-gray-500 mb-3">
                    Reference: <span className="font-mono font-medium">STAGE{stage.stage_number}-{stage.id.slice(0, 8).toUpperCase()}</span>
                  </p>

                  <button
                    onClick={handleMarkPaymentSent}
                    disabled={isMarkingPayment}
                    className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
                  >
                    {isMarkingPayment && <Loader2 className="w-4 h-4 animate-spin" />}
                    {isMarkingPayment ? 'Processing...' : "I've Sent Payment"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {isRevisionModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-lg w-full p-6" role="dialog" aria-labelledby="revision-modal-title">
            <div className="flex items-center justify-between mb-6">
              <h2 id="revision-modal-title" className="text-2xl font-bold text-black">Request Changes</h2>
              <button
                onClick={() => {
                  setIsRevisionModalOpen(false);
                  setRevisionFeedback('');
                  setValidationError('');
                }}
                className="text-gray-600 hover:text-gray-900 transition-colors"
                aria-label="Close dialog"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <p className="text-gray-600 mb-4">
              You have <strong className={revisionsRemaining === 1 ? 'text-orange-600' : 'text-green-600'}>{revisionsRemaining} of {totalRevisions}</strong> revisions remaining for this stage.
            </p>

            <div className="mb-6">
              <label className="block text-sm font-bold text-black mb-2">
                What changes would you like? <span className="text-red-500">*</span>
              </label>
              <textarea
                value={revisionFeedback}
                onChange={(e) => {
                  setRevisionFeedback(e.target.value);
                  setValidationError('');
                }}
                rows={6}
                maxLength={1000}
                spellCheck={false}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                  validationError ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Be specific to get best results:
• 'Make logo 20% larger'
• 'Change blue to navy (#003366)'
• 'Add shadow to header section'"
              />
              <div className="flex items-center justify-between mt-1">
                <p className="text-xs text-gray-500">{revisionFeedback.length}/1000 characters</p>
                {revisionFeedback.trim().length > 0 && revisionFeedback.trim().length < 10 && (
                  <p className="text-xs text-orange-600">At least 10 characters needed</p>
                )}
              </div>
              {validationError && (
                <p className="text-red-600 text-sm mt-2 font-semibold">
                  {validationError}
                </p>
              )}
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsRevisionModalOpen(false);
                  setRevisionFeedback('');
                  setValidationError('');
                }}
                className="flex-1 bg-white hover:bg-gray-50 text-gray-900 border-2 border-gray-300 px-6 py-3 rounded-lg font-semibold transition-all duration-200"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                onClick={handleRequestRevision}
                className="flex-1 bg-orange-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isSubmitting || !revisionFeedback.trim()}
              >
                {isSubmitting ? 'Submitting...' : 'Send Request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
