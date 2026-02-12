// FORCE REBUILD v8 - UX improvements: simplified layout, contextual actions, reduced visual noise
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
  ChevronDown,
  ExternalLink,
  AlertCircle,
  Send,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '../lib/supabase';
import { notifyRevisionRequested, notifyStageApproved, notifyPaymentMarked, notifyExtensionPurchased } from '../lib/email';
import NoteBox from './NoteBox';
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

// Simple status badge component to replace progress bar
function StatusBadge({ status, paymentStatus }: { status: string; paymentStatus: string }) {
  const getStatusConfig = () => {
    // Check payment status first for completed stages
    if (paymentStatus === 'received' || paymentStatus === 'paid') {
      return { label: 'Completed', color: 'bg-green-100 text-green-700', dot: 'bg-green-500' };
    }
    
    switch (status) {
      case 'locked':
        return { label: 'Locked', color: 'bg-gray-100 text-gray-600', dot: 'bg-gray-400' };
      case 'active':
      case 'in_progress':
        return { label: 'Work in Progress', color: 'bg-yellow-100 text-yellow-700', dot: 'bg-yellow-500' };
      case 'delivered':
        return { label: 'Delivered - Awaiting Review', color: 'bg-blue-100 text-blue-700', dot: 'bg-blue-500' };
      case 'payment_pending':
        return { label: 'Payment Pending', color: 'bg-orange-100 text-orange-700', dot: 'bg-orange-500' };
      case 'review':
        return { label: 'In Review', color: 'bg-yellow-100 text-yellow-700', dot: 'bg-yellow-500' };
      case 'completed':
      case 'complete':
        return { label: 'Completed', color: 'bg-green-100 text-green-700', dot: 'bg-green-500' };
      case 'paused':
        return { label: 'Paused', color: 'bg-orange-100 text-orange-700', dot: 'bg-orange-500' };
      case 'cancelled':
        return { label: 'Cancelled', color: 'bg-red-100 text-red-700', dot: 'bg-red-500' };
      default:
        return { label: status, color: 'bg-gray-100 text-gray-600', dot: 'bg-gray-400' };
    }
  };

  const config = getStatusConfig();

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`}></span>
      {config.label}
    </span>
  );
}

export default function StageCard({ stage, readOnly = false, showNoteBox = false, authorType = 'freelancer', authorName, projectId, shareCode, currency = 'USD', paymentMethods = {}, manualPaymentInstructions }: StageCardProps) {
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
  const [isRevisionHistoryOpen, setIsRevisionHistoryOpen] = useState(false);
  const [isDeliverablesOpen, setIsDeliverablesOpen] = useState(true);
  const [isNotesOpen, setIsNotesOpen] = useState(false);
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
          borderColor: 'border-gray-200',
          iconBg: 'bg-gray-200',
          cardOpacity: 'opacity-75',
        };
      case 'active':
      case 'in_progress':
        return {
          icon: Circle,
          label: 'In Progress',
          color: 'text-yellow-600',
          bgColor: 'bg-white',
          borderColor: 'border-green-500',
          iconBg: 'bg-green-500',
          cardOpacity: '',
        };
      case 'delivered':
        return {
          icon: CheckCircle2,
          label: 'Delivered',
          color: 'text-blue-600',
          bgColor: 'bg-white',
          borderColor: 'border-blue-400',
          iconBg: 'bg-blue-500',
          cardOpacity: '',
        };
      case 'payment_pending':
        return {
          icon: DollarSign,
          label: 'Payment Pending',
          color: 'text-orange-600',
          bgColor: 'bg-white',
          borderColor: 'border-orange-400',
          iconBg: 'bg-orange-500',
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
          bgColor: 'bg-white',
          borderColor: 'border-yellow-400',
          iconBg: 'bg-yellow-500',
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

  // Check for pending/active revision requests
  const pendingRevisions = stage.revisions?.filter(r => !r.completed_at) || [];
  const hasPendingRevision = pendingRevisions.length > 0;

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
                  <div className="mt-4 border border-gray-200 rounded-lg overflow-hidden">
                    <button
                      onClick={() => setIsRevisionHistoryOpen(!isRevisionHistoryOpen)}
                      className="w-full px-4 py-3 bg-gray-50 flex items-center justify-between hover:bg-gray-100 transition-colors"
                    >
                      <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
                        <MessageSquare className="w-4 h-4" />
                        Revision History ({stage.revisions.length})
                      </span>
                      <ChevronDown 
                        className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${
                          isRevisionHistoryOpen ? 'rotate-180' : ''
                        }`} 
                      />
                    </button>
                    {isRevisionHistoryOpen && (
                      <div className="p-3 space-y-2 bg-white">
                        {stage.revisions.map((revision) => (
                          <div key={revision.id} className="p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium text-gray-900">
                                Revision {revision.revision_number}
                              </span>
                              <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-green-100 text-green-700">
                                Done
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 whitespace-pre-wrap">{revision.feedback}</p>
                            <p className="text-xs text-gray-400 mt-1">
                              {formatDate(revision.created_at)}
                              {revision.completed_at && ` • Completed ${formatDate(revision.completed_at)}`}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    );
  }

  // Main active stage card render
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
      {/* HEADER - Simplified with inline status badge */}
      <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-100">
        <div className="flex items-start justify-between gap-4">
          {/* Left: Icon + Title + Status Badge */}
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className={`${statusInfo.iconBg} rounded-full p-2 flex items-center justify-center flex-shrink-0`}>
              <StatusIcon className={`w-5 h-5 text-white`} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className={`text-lg sm:text-xl font-bold ${
                stage.status === 'locked' ? 'text-gray-500' : 'text-gray-900'
              } truncate`}>
                Stage {stage.stage_number}: {stage.name}
              </h3>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <StatusBadge status={stage.status} paymentStatus={actualPaymentStatus} />
                {stage.stage_number !== 0 && (
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    stage.revisions_used === 0 
                      ? 'bg-green-100 text-green-700' 
                      : stage.revisions_used >= totalRevisions 
                        ? 'bg-red-100 text-red-700' 
                        : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {stage.revisions_used}/{totalRevisions} rev
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right: Amount */}
          <div className="text-right flex-shrink-0">
            <div className="text-xs font-medium uppercase tracking-wide text-gray-400">Amount</div>
            <div className="text-xl sm:text-2xl font-black text-gray-900">
              {formatCurrency(stage.amount, currency)}
            </div>
          </div>
        </div>
      </div>

      {/* CONTEXTUAL ACTION BAR - Shows primary action based on state */}
      {stage.status !== 'locked' && (
        <div className="px-4 sm:px-6 py-3 bg-gray-50 border-b border-gray-100">
          {/* Payment Pending - Freelancer view */}
          {!readOnly && pendingPayments.length > 0 && (
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2 text-orange-700">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm font-medium">Client marked payment as sent</span>
              </div>
              <button
                onClick={() => {/* This would be handled by parent - mark as paid */}}
                className="px-4 py-2 bg-green-500 text-white rounded-lg font-semibold text-sm hover:bg-green-600 transition-colors flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                Mark as Paid
              </button>
            </div>
          )}

          {/* Payment Pending - Client view */}
          {readOnly && pendingPayments.length > 0 && (
            <div className="flex items-center gap-2 text-yellow-700">
              <Clock className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm">Payment pending verification • Ref: {pendingPayments[0].reference_code}</span>
            </div>
          )}

          {/* Revision Requested - Show for both views */}
          {hasPendingRevision && pendingPayments.length === 0 && (
            <div className="flex items-center gap-2 text-orange-700">
              <RotateCcw className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm font-medium">Revision requested - changes needed</span>
            </div>
          )}

          {/* Work in Progress - Freelancer: Ready to submit */}
          {!readOnly && (stage.status === 'active' || stage.status === 'in_progress') && stage.deliverables.length > 0 && !hasPendingRevision && pendingPayments.length === 0 && (
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <span className="text-sm text-gray-600">Ready to submit? Add deliverables below, then:</span>
              <button
                onClick={() => {/* Handled by parent component */}}
                className="px-4 py-2 bg-green-500 text-white rounded-lg font-semibold text-sm hover:bg-green-600 transition-colors flex items-center gap-1.5"
              >
                <Send className="w-4 h-4" />
                Submit for Client Review
              </button>
            </div>
          )}

          {/* Delivered - Client: Review actions */}
          {readOnly && stage.status === 'delivered' && stage.payment_status !== 'received' && pendingPayments.length === 0 && (
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <button
                onClick={handleApproveStage}
                className="px-5 py-2.5 bg-green-500 text-white rounded-lg font-semibold text-sm hover:bg-green-600 transition-colors flex items-center gap-2"
              >
                <ThumbsUp className="w-4 h-4" />
                Approve & Pay
              </button>
              {canRequestRevision && (
                <button
                  onClick={() => setIsRevisionModalOpen(true)}
                  className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg font-medium text-sm hover:bg-gray-50 transition-colors flex items-center gap-1.5"
                >
                  <RotateCcw className="w-4 h-4" />
                  Request Changes
                </button>
              )}
            </div>
          )}

          {/* No deliverables yet - Freelancer */}
          {!readOnly && (stage.status === 'active' || stage.status === 'in_progress') && stage.deliverables.length === 0 && !hasPendingRevision && pendingPayments.length === 0 && (
            <div className="flex items-center gap-2 text-gray-500">
              <FileText className="w-4 h-4" />
              <span className="text-sm">Add deliverables to submit for review</span>
            </div>
          )}

          {/* Awaiting Review - Freelancer */}
          {!readOnly && stage.status === 'delivered' && pendingPayments.length === 0 && !hasPendingRevision && (
            <div className="flex items-center gap-2 text-blue-600">
              <Clock className="w-4 h-4" />
              <span className="text-sm font-medium">Work submitted - waiting for client review</span>
            </div>
          )}
        </div>
      )}

      <div className="p-4 sm:p-6 space-y-4">
        {/* Show locked message and hide all content for locked stages */}
        {stage.status === 'locked' ? (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 sm:p-12 text-center">
            <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-lg font-semibold text-gray-600 mb-2">
              Stage Locked
            </p>
            <p className="text-sm text-gray-500 max-w-md mx-auto">
              This stage will unlock once the previous stage is completed and payment is received.
            </p>
          </div>
        ) : (
          <>
            {/* REVISION REQUESTS - Collapsible, less prominent */}
            {stage.revisions.length > 0 && (
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => setIsRevisionHistoryOpen(!isRevisionHistoryOpen)}
                  className="w-full px-4 py-3 bg-gray-50 flex items-center justify-between hover:bg-gray-100 transition-colors"
                >
                  <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <RotateCcw className="w-4 h-4" />
                    {hasPendingRevision ? (
                      <span className="text-orange-700">Revision Requested</span>
                    ) : (
                      <>Revision History ({stage.revisions.length})</>
                    )}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">
                      {stage.revisions_used}/{totalRevisions} used
                    </span>
                    <ChevronDown 
                      className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
                        isRevisionHistoryOpen ? 'rotate-180' : ''
                      }`} 
                    />
                  </div>
                </button>
                {isRevisionHistoryOpen && (
                  <div className="p-3 space-y-2 bg-white border-t border-gray-100">
                    {stage.revisions.map((revision) => (
                      <div key={revision.id} className={`p-3 rounded-lg ${
                        !revision.completed_at ? 'bg-orange-50 border border-orange-200' : 'bg-gray-50'
                      }`}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-gray-900">
                            Revision {revision.revision_number}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            revision.completed_at
                              ? 'bg-green-100 text-green-700'
                              : 'bg-orange-100 text-orange-700'
                          }`}>
                            {revision.completed_at ? 'Done' : 'Pending'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 whitespace-pre-wrap">{revision.feedback}</p>
                        <p className="text-xs text-gray-400 mt-2">
                          {formatDate(revision.created_at)}
                          {revision.completed_at && ` • Completed ${formatDate(revision.completed_at)}`}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* DELIVERABLES SECTION */}
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <button
                onClick={() => setIsDeliverablesOpen(!isDeliverablesOpen)}
                className="w-full px-4 py-3 bg-white flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <span className="text-sm font-medium text-gray-900 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-gray-500" />
                  Deliverables ({stage.deliverables.length})
                </span>
                <ChevronDown 
                  className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
                    isDeliverablesOpen ? 'rotate-180' : ''
                  }`} 
                />
              </button>

              {isDeliverablesOpen && (
                <div className="border-t border-gray-100">
                  {stage.deliverables.length > 0 ? (
                    <div className="p-3 space-y-2">
                      {stage.deliverables.map((deliverable) => (
                        <div
                          key={deliverable.id}
                          className="flex items-center justify-between gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-gray-900 text-sm">{deliverable.name}</div>
                            {deliverable.description && (
                              <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                                {deliverable.description}
                              </p>
                            )}
                            <p className="text-xs text-gray-400 mt-0.5 truncate">
                              {deliverable.file_url}
                            </p>
                          </div>
                          <a
                            href={deliverable.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-shrink-0 px-3 py-1.5 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm font-medium flex items-center gap-1"
                          >
                            Open <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-6 text-center">
                      <FileText className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">
                        {readOnly ? 'Waiting for deliverables' : 'No deliverables yet'}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* NOTES & FEEDBACK - Collapsible, collapsed by default when empty */}
            {showNoteBox && (
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => setIsNotesOpen(!isNotesOpen)}
                  className="w-full px-4 py-3 bg-white flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <span className="text-sm font-medium text-gray-900 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-gray-500" />
                    Notes & Feedback
                  </span>
                  <ChevronDown 
                    className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
                      isNotesOpen ? 'rotate-180' : ''
                    }`} 
                  />
                </button>
                {isNotesOpen && (
                  <div className="border-t border-gray-100">
                    <NoteBox
                      stageId={stage.id}
                      authorType={authorType}
                      authorName={authorName || 'You'}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Extension status alerts */}
            {readOnly && stage.status === 'delivered' && !canRequestRevision && stage.extension_enabled && pendingExtensions.length > 0 && (
              <div className="mt-4">
                <ExtensionStatusAlerts
                  pendingExtensions={pendingExtensions}
                  rejectedExtensions={rejectedExtensions}
                />
                <p className="text-center text-xs text-gray-500 mt-2">
                  Extra revision payment pending verification
                </p>
              </div>
            )}

            {/* Buy extra revision - only for client when no revisions left */}
            {readOnly && stage.status === 'delivered' && !canRequestRevision && stage.extension_enabled && pendingExtensions.length === 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-center">
                <p className="text-sm text-amber-800 mb-3">
                  You've used all {totalRevisions} revisions. Need more changes?
                </p>
                <button
                  onClick={() => setIsExtensionModalOpen(true)}
                  className="px-4 py-2 bg-amber-500 text-white rounded-lg font-medium hover:bg-amber-600 transition-colors text-sm flex items-center gap-1.5 mx-auto"
                >
                  <Plus className="w-4 h-4" />
                  Buy Extra Revision – {formatCurrency(stage.extension_price, currency)}
                </button>
              </div>
            )}
          </>
        )}

        {successMessage && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
            {successMessage}
          </div>
        )}

        {/* Rejected Payment Warning - Client view */}
        {readOnly && rejectedPayments.length > 0 && pendingPayments.length === 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="font-medium text-red-800 text-sm mb-2">
              ⚠️ Payment not received
            </p>
            {rejectedPayments[0].rejection_reason && (
              <p className="text-xs text-red-700 mb-3">
                {rejectedPayments[0].rejection_reason}
              </p>
            )}
            <button
              onClick={() => setShowPaymentModal(true)}
              className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 text-sm font-medium transition-colors"
            >
              Retry Payment
            </button>
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
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">
                Complete Payment - {formatCurrency(stage.amount, currency)}
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
                Choose your preferred payment method below.
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
