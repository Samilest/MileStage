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
import { supabase } from '../lib/supabase';
import NoteBox from './NoteBox';
import StageProgress from './StageProgress';
import ExtensionPurchaseModal from './ExtensionPurchaseModal';
import ExtensionStatusAlerts from './ExtensionStatusAlerts';

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
  paymentMethods?: {
    paypal?: string;
    venmo?: string;
    bank_transfer?: string;
    other?: string;
  };
}

export default function StageCard({ stage, readOnly = false, showNoteBox = false, authorType = 'client', authorName, shareCode, paymentMethods = {} }: StageCardProps) {
  const [isRevisionModalOpen, setIsRevisionModalOpen] = useState(false);
  const [revisionFeedback, setRevisionFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [validationError, setValidationError] = useState('');
  const [isExtensionModalOpen, setIsExtensionModalOpen] = useState(false);
  const [pendingExtensions, setPendingExtensions] = useState<Extension[]>([]);
  const [rejectedExtensions, setRejectedExtensions] = useState<Extension[]>([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isMarkingPayment, setIsMarkingPayment] = useState(false);
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
  const [actualPaymentStatus, setActualPaymentStatus] = useState<string>(stage.payment_status || 'unpaid');

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      await checkExtensionStatus(isMounted);
      await checkStagePaymentStatus(isMounted);
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [stage.id]);

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
          label: 'Locked',
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-300',
          iconBg: 'bg-gray-200',
        };
      case 'active':
        return {
          label: 'Active - Waiting for Payment',
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          iconBg: 'bg-blue-100',
        };
      case 'in_progress':
        return {
          label: 'In Progress',
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          iconBg: 'bg-yellow-100',
        };
      case 'delivered':
        return {
          label: 'Delivered - Awaiting Approval',
          color: 'text-purple-600',
          bgColor: 'bg-purple-50',
          borderColor: 'border-purple-200',
          iconBg: 'bg-purple-100',
        };
      case 'approved':
        return {
          label: 'Approved',
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          iconBg: 'bg-green-100',
        };
      case 'completed':
        return {
          label: 'Completed',
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          iconBg: 'bg-green-100',
        };
      case 'revision_requested':
        return {
          label: 'Revision Requested',
          color: 'text-orange-600',
          bgColor: 'bg-orange-50',
          borderColor: 'border-orange-200',
          iconBg: 'bg-orange-100',
        };
      default:
        return {
          label: 'Unknown',
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-300',
          iconBg: 'bg-gray-200',
        };
    }
  };

  const getPaymentStatusInfo = () => {
    if (actualPaymentStatus === 'paid') {
      return {
        label: '✓ Paid',
        color: 'text-green-700',
        bgColor: 'bg-green-100',
      };
    }
    if (stage.payment_status === 'pending') {
      return {
        label: '⏳ Payment Pending',
        color: 'text-yellow-700',
        bgColor: 'bg-yellow-100',
      };
    }
    return {
      label: 'Not Paid',
      color: 'text-gray-700',
      bgColor: 'bg-gray-100',
    };
  };

  const statusInfo = getStatusInfo();
  const paymentInfo = getPaymentStatusInfo();

  const StatusIcon = stage.status === 'locked' ? Lock
    : stage.status === 'active' || stage.status === 'in_progress' ? Clock
      : stage.status === 'delivered' ? FileText
        : stage.status === 'approved' || stage.status === 'completed' ? CheckCircle2
          : stage.status === 'revision_requested' ? RotateCcw
            : Circle;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const handleRequestRevision = async () => {
    if (!revisionFeedback.trim()) {
      setValidationError('Please provide feedback for the revision');
      return;
    }

    if (revisionFeedback.trim().length < 10) {
      setValidationError('Please provide at least 10 characters of feedback');
      return;
    }

    setIsSubmitting(true);
    setValidationError('');

    try {
      const nextRevisionNumber = stage.revisions.length + 1;

      const { error: revisionError } = await supabase
        .from('revisions')
        .insert({
          stage_id: stage.id,
          revision_number: nextRevisionNumber,
          feedback: revisionFeedback.trim(),
          status: 'requested',
        });

      if (revisionError) throw revisionError;

      const { error: stageUpdateError } = await supabase
        .from('stages')
        .update({
          status: 'revision_requested',
          revisions_used: stage.revisions_used + 1,
        })
        .eq('id', stage.id);

      if (stageUpdateError) throw stageUpdateError;

      const { error: activityError } = await supabase
        .from('activity_log')
        .insert({
          stage_id: stage.id,
          action: 'revision_requested',
          description: `Revision ${nextRevisionNumber} requested`,
          user_id: (await supabase.auth.getUser()).data.user?.id,
        });

      if (activityError) throw activityError;

      setSuccessMessage('✓ Revision request sent!');
      setIsRevisionModalOpen(false);
      setRevisionFeedback('');

      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error('Error requesting revision:', error);
      setValidationError('Failed to submit revision request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApproveStage = async () => {
    setIsSubmitting(true);
    try {
      const { error: updateError } = await supabase
        .from('stages')
        .update({ status: 'approved' })
        .eq('id', stage.id);

      if (updateError) throw updateError;

      const { error: activityError } = await supabase
        .from('activity_log')
        .insert({
          stage_id: stage.id,
          action: 'stage_approved',
          description: 'Stage deliverables approved',
          user_id: (await supabase.auth.getUser()).data.user?.id,
        });

      if (activityError) throw activityError;

      setShowPaymentModal(true);
    } catch (error) {
      console.error('Error approving stage:', error);
      alert('Failed to approve stage. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMarkPaymentSent = async () => {
    setIsMarkingPayment(true);
    try {
      const referenceCode = `STAGE${stage.stage_number}-${stage.id.slice(0, 8).toUpperCase()}`;

      const { data: existingPayment } = await supabase
        .from('stage_payments')
        .select('id')
        .eq('stage_id', stage.id)
        .eq('reference_code', referenceCode)
        .maybeSingle();

      if (existingPayment) {
        alert('This payment has already been marked as sent.');
        setIsMarkingPayment(false);
        return;
      }

      const { error: insertError } = await supabase
        .from('stage_payments')
        .insert({
          stage_id: stage.id,
          amount: stage.amount,
          reference_code: referenceCode,
          status: 'marked_paid',
        });

      if (insertError) throw insertError;

      const { error: stageUpdateError } = await supabase
        .from('stages')
        .update({ payment_status: 'pending' })
        .eq('id', stage.id);

      if (stageUpdateError) throw stageUpdateError;

      const { error: activityError } = await supabase
        .from('activity_log')
        .insert({
          stage_id: stage.id,
          action: 'payment_marked',
          description: `Payment marked as sent: ${referenceCode}`,
          user_id: (await supabase.auth.getUser()).data.user?.id,
        });

      if (activityError) throw activityError;

      setShowPaymentModal(false);
      setTimeout(() => window.location.reload(), 500);
    } catch (error) {
      console.error('Error marking payment:', error);
      alert('Failed to mark payment as sent. Please try again.');
    } finally {
      setIsMarkingPayment(false);
    }
  };

  const revisionsRemaining = stage.revisions_included - stage.revisions_used;
  const canRequestRevision = revisionsRemaining > 0;

  // If this is a locked stage (not yet active), show minimal info
  if (stage.status === 'locked') {
    return (
      <div className={`bg-white border-2 ${statusInfo.borderColor} rounded-xl overflow-hidden shadow-sm opacity-75`}>
        <div className={`${statusInfo.bgColor} px-4 sm:px-6 py-4 sm:py-6 border-b ${statusInfo.borderColor}`}>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className={`${statusInfo.iconBg} rounded-full p-2 flex items-center justify-center flex-shrink-0`}>
                <StatusIcon className={`w-5 h-5 sm:w-6 sm:h-6 ${statusInfo.color}`} />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-600">
                  Stage {stage.stage_number}: {stage.name}
                </h3>
                <span className={`text-sm sm:text-base font-semibold ${statusInfo.color}`}>
                  {statusInfo.label}
                </span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">Amount</div>
              <div className="text-2xl lg:text-3xl font-black text-gray-600">
                ${stage.amount.toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-6">
          <div className="text-center p-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <Lock className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p className="text-gray-600 font-medium">
              This stage is locked
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Complete previous stages to unlock
            </p>
          </div>
        </div>
      </div>
    );
  }

  // FREELANCER VIEW - Expanded info in dropdown
  if (!readOnly) {
    return (
      <div className={`bg-white border-2 ${statusInfo.borderColor} rounded-xl overflow-hidden transition-shadow duration-300 ${
        stage.status === 'active' || stage.status === 'in_progress'
          ? 'shadow-lg hover:shadow-xl'
          : 'shadow-md hover:shadow-lg'
      }`}>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`w-full ${statusInfo.bgColor} px-4 sm:px-6 py-4 sm:py-6 border-b ${statusInfo.borderColor} hover:opacity-90 transition-opacity`}
        >
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className={`${statusInfo.iconBg} rounded-full p-2 flex items-center justify-center flex-shrink-0`}>
                <StatusIcon className={`w-5 h-5 sm:w-6 sm:h-6 ${statusInfo.color}`} />
              </div>
              <div className="text-left">
                <h3 className="text-lg sm:text-xl font-bold text-gray-900">
                  Stage {stage.stage_number}: {stage.name}
                </h3>
                <span className={`text-sm sm:text-base font-semibold ${statusInfo.color}`}>
                  {statusInfo.label}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className={`px-4 py-2 rounded-full text-base font-semibold ${paymentInfo.bgColor} ${paymentInfo.color}`}>
                {paymentInfo.label}
              </span>
              <div className="text-right">
                <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">Amount</div>
                <div className="text-2xl lg:text-3xl font-black text-gray-900">
                  ${stage.amount.toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        </button>

        {isExpanded && (
          <div className="p-4 sm:p-6 space-y-4">
            <StageProgress
              status={stage.status}
              isLocked={false}
              deliverablesCount={stage.deliverables.length}
            />

            {stage.deliverables.length > 0 && (
              <>
                <div>
                  <h4 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-3">
                    <FileText className="w-5 h-5" />
                    Deliverables ({stage.deliverables.length})
                  </h4>
                  <div className="space-y-2">
                    {stage.deliverables.map((deliverable) => (
                      <div key={deliverable.id} className="bg-white rounded p-3 border border-green-200 hover:border-green-400 transition-colors">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-gray-900 truncate">{deliverable.name}</div>
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
        <div className="flex items-center justify-between flex-wrap gap-4 sm:gap-6">
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
                ${stage.amount.toLocaleString()}
              </div>
              {/* ✅ BUG FIX #1: Only show revisions if NOT Stage 0 (Down Payment) */}
              {stage.stage_number !== 0 && (
                <div className="text-sm mt-1 font-semibold" style={{
                  color: stage.revisions_used === 0 ? '#10b981' : stage.revisions_used === stage.revisions_included ? '#ef4444' : '#f59e0b'
                }}>
                  Revisions: {stage.revisions_used}/{stage.revisions_included}
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
        />

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
          {readOnly && stage.status === 'delivered' && (
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
                {canRequestRevision ? (
                  <button
                    onClick={() => setIsRevisionModalOpen(true)}
                    className="flex-1 sm:flex-initial bg-orange-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-600 transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    <RotateCcw className="w-5 h-5" />
                    Request Changes ({revisionsRemaining})
                  </button>
                ) : (
                  <button
                    disabled
                    className="flex-1 sm:flex-initial bg-gray-300 text-gray-600 px-6 py-3 rounded-lg font-semibold cursor-not-allowed flex items-center justify-center gap-2 opacity-60"
                  >
                    <RotateCcw className="w-5 h-5" />
                    All Revisions Used
                  </button>
                )}
              </div>

              <p className="text-center text-sm text-gray-600 mb-4">
                Revisions remaining: <strong className={revisionsRemaining === 0 ? 'text-red-600' : revisionsRemaining === 1 ? 'text-orange-600' : 'text-green-600'}>{revisionsRemaining}/{stage.revisions_included}</strong>
              </p>
            </>
          )}

          {/* ✅ BUG FIX #2: Show extra revision box ALWAYS when extension is enabled AND stage 0 (no revisions for down payment) */}
          {readOnly && stage.status === 'delivered' && stage.extension_enabled && stage.stage_number !== 0 && (
            <div className="mb-4">
              <ExtensionStatusAlerts
                pendingExtensions={pendingExtensions}
                rejectedExtensions={rejectedExtensions}
              />

              {!canRequestRevision ? (
                // Show when all revisions are used (original behavior)
                <div className="bg-orange-50 border border-orange-300 rounded-lg p-4 text-center">
                  <p className="text-orange-800 font-semibold mb-2">
                    All included revisions used ({stage.revisions_used}/{stage.revisions_included})
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
                        className="bg-green-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-600 transition-all duration-200"
                      >
                        Buy Extra Revision - ${stage.extension_price}
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                // ✅ NEW: Show info box even when revisions remain
                <div className="bg-blue-50 border border-blue-300 rounded-lg p-4 text-center">
                  <p className="text-blue-800 font-semibold mb-2">
                    💡 Extra Revisions Available
                  </p>
                  <p className="text-blue-700 text-sm mb-3">
                    If you need more than the {stage.revisions_included} included revisions, you can purchase extra revisions for ${stage.extension_price} each.
                  </p>
                  <p className="text-xs text-blue-600">
                    You have {revisionsRemaining} included revision{revisionsRemaining !== 1 ? 's' : ''} remaining.
                  </p>
                </div>
              )}
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

        {pendingPayments.length > 0 && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-yellow-900 mb-2 flex items-center gap-2">
              <Clock className="w-5 h-5" />
              ⏳ Payment Verification Pending
            </h3>
            <p className="text-yellow-800">
              Your payment of ${stage.amount.toLocaleString()} is pending verification by the freelancer.
            </p>
            <p className="text-sm text-yellow-700 mt-2">
              Reference Code: <span className="font-mono font-bold">{pendingPayments[0].reference_code}</span>
            </p>
          </div>
        )}

        {rejectedPayments.length > 0 && (
          <div className="bg-red-50 border-l-4 border-red-400 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-red-900 mb-2 flex items-center gap-2">
              <XCircle className="w-5 h-5" />
              ⚠️ Payment Issue
            </h3>
            <p className="text-red-800">
              Your payment for ${stage.amount.toLocaleString()} was not received by the freelancer.
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
                  setRejectedPayments([]);
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
          paymentMethods={paymentMethods}
          onClose={() => setIsExtensionModalOpen(false)}
        />
      )}

      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">
                Stage {stage.stage_number} Payment - ${stage.amount.toLocaleString()}
              </h2>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="text-gray-600 hover:text-black"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-6">
              <p className="font-semibold text-green-900">
                ✅ You approved this stage's deliverables!
              </p>
              <p className="text-sm text-green-800 mt-1">
                Now complete the payment to unlock the next stage.
              </p>
            </div>

            <div className="bg-blue-50 p-4 rounded mb-6">
              <h3 className="font-semibold mb-3">Payment Instructions:</h3>
              <p className="text-sm mb-4">
                Pay ${stage.amount.toLocaleString()} using one of these methods:
              </p>

              {paymentMethods && (paymentMethods.paypal || paymentMethods.venmo || paymentMethods.bank_transfer || paymentMethods.other) ? (
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
                className="w-full bg-green-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isMarkingPayment && <Loader2 className="w-5 h-5 animate-spin" />}
                {isMarkingPayment ? 'Processing...' : '✅ I\'ve Paid'}
              </button>

              <button
                onClick={() => setShowPaymentModal(false)}
                className="w-full bg-white hover:bg-gray-50 text-gray-900 border-2 border-gray-300 px-6 py-3 rounded-lg font-semibold transition-all duration-200"
              >
                Cancel
              </button>
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
              You have <strong className={revisionsRemaining === 1 ? 'text-orange-600' : 'text-green-600'}>{revisionsRemaining} of {stage.revisions_included}</strong> revisions remaining for this stage.
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
                maxLength={500}
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
                <p className="text-xs text-gray-500">{revisionFeedback.length}/500 characters</p>
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
