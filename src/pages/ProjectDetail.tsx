import { useParams, Link } from 'react-router-dom';
import { useState, useEffect, useCallback, useRef } from 'react';
import Navigation from '../components/Navigation';
import Card from '../components/Card';
import Button from '../components/Button';
import NoteBox from '../components/NoteBox';
import StageProgress from '../components/StageProgress';
import ExtensionVerificationAlert from '../components/ExtensionVerificationAlert';
import RealtimeStatus from '../components/RealtimeStatus';
import { formatCurrency, getCurrencySymbol, type CurrencyCode } from '../lib/currency';
import { ArrowLeft, Plus, FileText, ExternalLink, Trash2, X, Unlock, CheckCircle, MessageSquare, ChevronDown, ChevronUp, Edit } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Deliverable {
  id: string;
  stage_id: string;
  title: string;
  file_url: string;
  description: string | null;
  added_at: string;
}

interface Revision {
  id: string;
  stage_id: string;
  feedback: string;
  requested_at: string;
  completed_at: string | null;
}

interface Stage {
  id: string;
  stage_number: number;
  name: string;
  amount: number;
  status: string;
  revisions_included: number;
  revisions_used: number;
  extension_revisions_used: number;
  delivered_at: string | null;
  extension_enabled: boolean;
  extension_price: number;
  extension_purchased: boolean;
  payment_status: string;
  payment_received_at: string | null;
  deliverables: Deliverable[];
  revisions: Revision[];
}

interface Project {
  id: string;
  name: string;
  project_name: string;
  client_name: string;
  client_email: string;
  total_amount: number;
  status: string;
  currency: CurrencyCode;
}

export default function ProjectDetail() {
  const { id } = useParams();
  const [project, setProject] = useState<Project | null>(null);
  const [stages, setStages] = useState<Stage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStageId, setSelectedStageId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingDeliverableId, setEditingDeliverableId] = useState<string | null>(null);
  const [userName, setUserName] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    file_url: '',
    description: '',
  });
  const [formErrors, setFormErrors] = useState<{ title?: string; file_url?: string }>({});
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAllRevisions, setShowAllRevisions] = useState<{ [key: string]: boolean }>({});
  const [expandedRevisionBoxes, setExpandedRevisionBoxes] = useState<{ [key: string]: boolean }>({});
  const [expandedCompletedStages, setExpandedCompletedStages] = useState<{ [key: string]: boolean }>({});
  const [pendingExtensions, setPendingExtensions] = useState<Array<{
    id: string;
    amount: number;
    reference_code: string;
    marked_paid_at: string;
    stage_id: string;
  }>>([]);
  const [pendingStagePayments, setPendingStagePayments] = useState<Array<{
    id: string;
    stage_id: string;
    amount: number;
    reference_code: string;
    marked_paid_at: string;
  }>>([]);
  const [showMarkPaidModal, setShowMarkPaidModal] = useState(false);
  const [selectedStageForPayment, setSelectedStageForPayment] = useState<Stage | null>(null);
  const [isMarkingPaid, setIsMarkingPaid] = useState(false);
  const [markingRevisionUsedStageId, setMarkingRevisionUsedStageId] = useState<string | null>(null);

  const loadingRef = useRef(false);
  const hasLoadedRef = useRef(false);

  const loadUserProfile = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('name')
        .eq('id', user.id)
        .maybeSingle();

      setUserName(profile?.name || 'You');
    } catch (error) {
      console.error('[ProjectDetail] Error loading user profile:', error);
      setUserName('You');
    }
  }, []);

  const loadPendingExtensions = useCallback(async () => {
    if (!id) return;

    try {
      const { data: stagesData } = await supabase
        .from('stages')
        .select('id')
        .eq('project_id', id);

      if (!stagesData || stagesData.length === 0) return;

      const stageIds = stagesData.map((s) => s.id);

      const { data: extensions, error } = await supabase
        .from('extensions')
        .select('*')
        .in('stage_id', stageIds)
        .eq('status', 'marked_paid');

      if (error) throw error;

      setPendingExtensions(extensions || []);
    } catch (error) {
      console.error('[ProjectDetail] Error loading pending extensions:', error);
    }
  }, [id]);

  const loadPendingStagePayments = useCallback(async () => {
    if (!id) return;

    try {
      const { data: stagesData } = await supabase
        .from('stages')
        .select('id')
        .eq('project_id', id);

      if (!stagesData || stagesData.length === 0) return;

      const stageIds = stagesData.map((s) => s.id);

      const { data: payments, error } = await supabase
        .from('stage_payments')
        .select('*')
        .in('stage_id', stageIds)
        .eq('status', 'marked_paid')
        .order('marked_paid_at', { ascending: false });

      if (error) throw error;

      setPendingStagePayments(payments || []);
    } catch (error) {
      console.error('[ProjectDetail] Error loading pending stage payments:', error);
    }
  }, [id]);

  const loadProjectData = useCallback(async () => {
    if (!id) return;

    // Prevent duplicate loads
    if (loadingRef.current) {
      console.log('[ProjectDetail] Already loading, skipping duplicate request');
      return;
    }

    loadingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      console.log('[ProjectDetail] Loading project:', id);

      // Step 1: Load project basic info (CRITICAL)
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (projectError) {
        console.error('[ProjectDetail] Project query error:', {
          table: 'projects',
          projectId: id,
          error: projectError.message,
          code: projectError.code,
          details: projectError.details,
          hint: projectError.hint
        });
        throw new Error(`Failed to load project: ${projectError.message}`);
      }

      if (!projectData) {
        console.error('[ProjectDetail] Project not found:', id);
        throw new Error('Project not found');
      }

      console.log('[ProjectDetail] Project loaded:', projectData.project_name);
      setProject(projectData);

      // Step 2: Load stages (CRITICAL)
      const { data: stagesData, error: stagesError } = await supabase
        .from('stages')
        .select('*')
        .eq('project_id', id)
        .order('stage_number', { ascending: true });

      if (stagesError) {
        console.error('[ProjectDetail] Stages query error:', {
          table: 'stages',
          projectId: id,
          error: stagesError.message,
          code: stagesError.code
        });
        throw new Error(`Failed to load stages: ${stagesError.message}`);
      }

      console.log('[ProjectDetail] Loaded', stagesData?.length || 0, 'stages');

      // Step 3: Load optional data for each stage (NON-CRITICAL)
      const stagesWithData = await Promise.all(
        (stagesData || []).map(async (stage) => {
          console.log(`[ProjectDetail] Loading data for stage "${stage.name}"...`);

          // Fetch deliverables (optional)
          let deliverables = [];
          try {
            const { data: deliverablesData, error: deliverablesError } = await supabase
              .from('deliverables')
              .select('*')
              .eq('stage_id', stage.id)
              .order('added_at', { ascending: false });

            if (deliverablesError) {
              console.warn(`[ProjectDetail] Deliverables error for stage "${stage.name}":`, {
                error: deliverablesError.message,
                code: deliverablesError.code
              });
            } else {
              deliverables = deliverablesData || [];
              console.log(`  ✓ Loaded ${deliverables.length} deliverables`);
            }
          } catch (err: any) {
            console.warn(`[ProjectDetail] Deliverables fetch failed for stage "${stage.name}":`, err.message);
          }

          // Fetch revisions (optional)
          let revisions = [];
          try {
            const { data: revisionsData, error: revisionsError } = await supabase
              .from('revisions')
              .select('*')
              .eq('stage_id', stage.id)
              .order('requested_at', { ascending: false });

            if (revisionsError) {
              console.warn(`[ProjectDetail] Revisions error for stage "${stage.name}":`, {
                error: revisionsError.message,
                code: revisionsError.code
              });
            } else {
              revisions = revisionsData || [];
              console.log(`  ✓ Loaded ${revisions.length} revisions`);
            }
          } catch (err: any) {
            console.warn(`[ProjectDetail] Revisions fetch failed for stage "${stage.name}":`, err.message);
          }

          return {
            ...stage,
            deliverables,
            revisions,
          };
        })
      );

      console.log('[ProjectDetail] All stage data loaded successfully');
      setStages(stagesWithData);

      // Step 4: Mark as viewed (NON-CRITICAL - don't fail if this errors)
      try {
        await markStagesAsViewed(stagesData || []);
      } catch (err) {
        console.warn('[ProjectDetail] Failed to mark as viewed (non-critical):', err);
      }

    } catch (error: any) {
      console.error('[ProjectDetail] CRITICAL ERROR:', error);
      setError(error.message || 'Failed to load project. Please try again.');
    } finally {
      setLoading(false);
      loadingRef.current = false;
      hasLoadedRef.current = true;
    }
  }, [id]);

  const markStagesAsViewed = async (stages: any[]) => {
    try {
      // Only mark stages as viewed if they have been approved
      const approvedStageIds = stages
        .filter(s => s.approved_at && !s.viewed_by_freelancer_at)
        .map(s => s.id);
      
      if (approvedStageIds.length > 0) {
        await supabase
          .from('stages')
          .update({ viewed_by_freelancer_at: new Date().toISOString() })
          .in('id', approvedStageIds);
        console.log(`✅ Marked ${approvedStageIds.length} approved stages as viewed`);
      }

      // Mark all unviewed revisions as viewed
      for (const stage of stages) {
        const { data: unviewedRevisions } = await supabase
          .from('revisions')
          .select('id')
          .eq('stage_id', stage.id)
          .is('viewed_by_freelancer_at', null);

        if (unviewedRevisions && unviewedRevisions.length > 0) {
          const revisionIds = unviewedRevisions.map(r => r.id);
          await supabase
            .from('revisions')
            .update({ viewed_by_freelancer_at: new Date().toISOString() })
            .in('id', revisionIds);
          console.log(`✅ Marked ${revisionIds.length} revisions as viewed for stage ${stage.stage_number}`);
        }
      }

      // Mark all unviewed stage payments as viewed
      for (const stage of stages) {
        const { data: unviewedPayments } = await supabase
          .from('stage_payments')
          .select('id')
          .eq('stage_id', stage.id)
          .is('viewed_by_freelancer_at', null);

        if (unviewedPayments && unviewedPayments.length > 0) {
          const paymentIds = unviewedPayments.map(p => p.id);
          await supabase
            .from('stage_payments')
            .update({ viewed_by_freelancer_at: new Date().toISOString() })
            .in('id', paymentIds);
          console.log(`✅ Marked ${paymentIds.length} payments as viewed for stage ${stage.stage_number}`);
        }
      }

      // Mark all unviewed client messages as viewed
      for (const stage of stages) {
        const { data: unviewedMessages } = await supabase
          .from('stage_notes')
          .select('id')
          .eq('stage_id', stage.id)
          .eq('author_type', 'client')
          .is('viewed_by_freelancer_at', null);

        if (unviewedMessages && unviewedMessages.length > 0) {
          const messageIds = unviewedMessages.map(m => m.id);
          await supabase
            .from('stage_notes')
            .update({ viewed_by_freelancer_at: new Date().toISOString() })
            .in('id', messageIds);
          console.log(`✅ Marked ${messageIds.length} messages as viewed for stage ${stage.stage_number}`);
        }
      }

      console.log('✅ Finished marking items as viewed');
    } catch (error) {
      console.error('Error marking as viewed:', error);
    }
  };

  // Load all data once on mount
  useEffect(() => {
    let isMounted = true;

    if (id && isMounted) {
      loadProjectData();
      loadUserProfile();
      loadPendingExtensions();
      loadPendingStagePayments();
    }

    return () => {
      isMounted = false;
    };
  }, [id, loadProjectData, loadUserProfile, loadPendingExtensions, loadPendingStagePayments]);

  const validateUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleOpenModal = (stageId: string) => {
    setSelectedStageId(stageId);
    setIsModalOpen(true);
    setIsEditMode(false);
    setEditingDeliverableId(null);
    setFormData({ title: '', file_url: '', description: '' });
    setFormErrors({});
  };

  const handleOpenEditModal = (deliverable: Deliverable, stageId: string) => {
    setSelectedStageId(stageId);
    setIsModalOpen(true);
    setIsEditMode(true);
    setEditingDeliverableId(deliverable.id);
    setFormData({
      title: deliverable.title,
      file_url: deliverable.file_url,
      description: deliverable.description || '',
    });
    setFormErrors({});
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedStageId(null);
    setIsEditMode(false);
    setEditingDeliverableId(null);
    setFormData({ title: '', file_url: '', description: '' });
    setFormErrors({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const errors: { title?: string; file_url?: string } = {};
    if (!formData.title.trim() || formData.title.trim().length < 3) {
      errors.title = 'Title is required (minimum 3 characters)';
    }
    if (!formData.file_url.trim()) {
      errors.file_url = 'File URL is required';
    } else if (!formData.file_url.startsWith('http://') && !formData.file_url.startsWith('https://')) {
      errors.file_url = 'URL must start with http:// or https://';
    } else if (!validateUrl(formData.file_url)) {
      errors.file_url = 'Please enter a valid URL';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsSubmitting(true);

    try {
      if (isEditMode && editingDeliverableId) {
        const updateData = {
          name: formData.title.trim(),
          title: formData.title.trim(),
          file_url: formData.file_url.trim(),
          description: formData.description.trim() || null,
        };

        console.log('Updating deliverable:', editingDeliverableId, updateData);

        const { error } = await supabase
          .from('deliverables')
          .update(updateData)
          .eq('id', editingDeliverableId);

        if (error) {
          console.error('Supabase update error:', error);
          throw error;
        }

        setSuccessMessage('Deliverable updated!');
      } else {
        const insertData = {
          stage_id: selectedStageId,
          name: formData.title.trim(),
          title: formData.title.trim(),
          file_url: formData.file_url.trim(),
          description: formData.description.trim() || null,
        };

        console.log('Inserting deliverable:', insertData);

        const { error } = await supabase.from('deliverables').insert(insertData);

        if (error) {
          console.error('Supabase insert error:', error);
          throw error;
        }

        setSuccessMessage('Deliverable added successfully!');
      }

      setTimeout(() => setSuccessMessage(''), 3000);
      handleCloseModal();
      loadProjectData();
    } catch (error) {
      console.error('Error saving deliverable:', error);
      setFormErrors({ title: 'Failed to save deliverable. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteDeliverable = async (deliverableId: string) => {
    if (!confirm('Are you sure you want to delete this deliverable?')) return;

    try {
      const { error } = await supabase
        .from('deliverables')
        .delete()
        .eq('id', deliverableId);

      if (error) throw error;

      setSuccessMessage('Deliverable deleted successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
      loadProjectData();
    } catch (error) {
      console.error('Error deleting deliverable:', error);
    }
  };

  const handleStartStage = async (stageId: string) => {
    try {
      const { error } = await supabase
        .from('stages')
        .update({ status: 'in_progress' })
        .eq('id', stageId);

      if (error) throw error;

      setSuccessMessage('Stage started successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
      loadProjectData();
    } catch (error) {
      console.error('Error starting stage:', error);
    }
  };

  const handleMarkAsDelivered = async (stageId: string) => {
    if (!confirm('Submit your work for client review? The client will be notified to review your deliverables.')) {
      return;
    }

    console.log('[Mark as Delivered] Starting process for stage:', stageId);
    setIsSubmitting(true);

    try {
      // Update stage status to delivered
      console.log('[Mark as Delivered] Updating stage status...');
      const { error: stageError } = await supabase
        .from('stages')
        .update({
          status: 'delivered',
          delivered_at: new Date().toISOString()
        })
        .eq('id', stageId);

      if (stageError) {
        console.error('[Mark as Delivered] Stage update error:', stageError);
        throw stageError;
      }

      console.log('[Mark as Delivered] Stage status updated successfully');

      // Try to mark revisions as completed (but don't fail if this doesn't work)
      try {
        console.log('[Mark as Delivered] Updating revisions...');
        const { error: revisionError } = await supabase
          .from('revisions')
          .update({ completed_at: new Date().toISOString() })
          .eq('stage_id', stageId)
          .is('completed_at', null);

        if (revisionError) {
          console.warn('[Mark as Delivered] Revision update warning (non-critical):', revisionError);
        } else {
          console.log('[Mark as Delivered] Revisions updated successfully');
        }
      } catch (revisionErr) {
        console.warn('[Mark as Delivered] Could not update revisions (non-critical):', revisionErr);
      }

      console.log('[Mark as Delivered] Process completed successfully!');
      setSuccessMessage('✅ Work submitted! Client will be notified.');

      setTimeout(() => {
        setSuccessMessage('');
        loadProjectData();
      }, 2000);
    } catch (error: any) {
      console.error('[Mark as Delivered] Failed:', error);
      alert('Failed to mark as delivered: ' + (error?.message || 'Unknown error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const verifyStagePayment = async (paymentId: string, stageId: string) => {
    try {
      await supabase
        .from('stage_payments')
        .update({
          status: 'verified',
          verified_at: new Date().toISOString()
        })
        .eq('id', paymentId);

      await supabase
        .from('stages')
        .update({
          status: 'completed',
          payment_status: 'paid',
          payment_received_at: new Date().toISOString()
        })
        .eq('id', stageId);

      const currentStageIndex = stages.findIndex(s => s.id === stageId);
      if (currentStageIndex < stages.length - 1) {
        const nextStage = stages[currentStageIndex + 1];
        await supabase
          .from('stages')
          .update({ status: 'active' })
          .eq('id', nextStage.id);
      }

      setSuccessMessage('✅ Payment verified! Stage completed. Next stage unlocked.');
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err: any) {
      alert('Failed to verify payment: ' + err.message);
    }
  };

  const rejectStagePayment = async (paymentId: string) => {
    const reason = prompt('Why are you rejecting this payment? (This will be shown to the client)');
    if (!reason) return;

    try {
      await supabase
        .from('stage_payments')
        .update({
          status: 'rejected',
          rejected_at: new Date().toISOString(),
          rejection_reason: reason
        })
        .eq('id', paymentId);

      setSuccessMessage('Payment marked as not received. Client will be notified.');
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err: any) {
      alert('Failed to reject payment: ' + err.message);
    }
  };

  const handleVerifyPayment = async (stageId: string) => {
    try {
      const { error } = await supabase
        .from('stages')
        .update({
          status: 'complete',
          payment_verified_at: new Date().toISOString()
        })
        .eq('id', stageId);

      if (error) throw error;

      const currentStageIndex = stages.findIndex(s => s.id === stageId);
      if (currentStageIndex < stages.length - 1) {
        const nextStage = stages[currentStageIndex + 1];
        await supabase
          .from('stages')
          .update({ status: 'locked' })
          .eq('id', nextStage.id);
      }

      setSuccessMessage('Payment verified! Stage completed.');
      setTimeout(() => setSuccessMessage(''), 3000);
      loadProjectData();
    } catch (error) {
      console.error('Error verifying payment:', error);
    }
  };

  const handleMarkAsPaid = async () => {
    if (!selectedStageForPayment) return;

    setIsMarkingPaid(true);
    try {
      // Update stage_payments table (if payment record exists)
      const { error: paymentError } = await supabase
        .from('stage_payments')
        .update({
          status: 'paid',
          verified_at: new Date().toISOString()
        })
        .eq('stage_id', selectedStageForPayment.id)
        .eq('status', 'marked_paid');

      // Don't throw error if no payment record exists (for manual marking)
      if (paymentError && paymentError.code !== 'PGRST116') {
        console.error('Payment update error:', paymentError);
      }

      // Update the stage status
      const stageNumber = selectedStageForPayment.stage_number;
      const currentStageIndex = stages.findIndex(s => s.id === selectedStageForPayment.id);

      // Update current stage to completed
      const { error: stageError } = await supabase
        .from('stages')
        .update({
          status: 'completed',
          payment_status: 'paid',
          payment_received_at: new Date().toISOString()
        })
        .eq('id', selectedStageForPayment.id);

      if (stageError) throw stageError;

      // Handle Stage 0 (Down Payment) - unlock Stage 1 and update project
      if (stageNumber === 0) {
        // Find and unlock Stage 1
        const stage1 = stages.find(s => s.stage_number === 1);
        if (stage1) {
          await supabase
            .from('stages')
            .update({ status: 'active' })
            .eq('id', stage1.id);
        }

        // Update project current_stage to 1
        await supabase
          .from('projects')
          .update({ current_stage: 1 })
          .eq('id', id);
      }
      // Unlock next stage if there is one
      else if (currentStageIndex < stages.length - 1) {
        const nextStage = stages[currentStageIndex + 1];
        await supabase
          .from('stages')
          .update({ status: 'active' })
          .eq('id', nextStage.id);
      }
      // If this is the final stage, mark project as completed
      else {
        await supabase
          .from('projects')
          .update({ status: 'completed' })
          .eq('id', id);
      }

      setSuccessMessage('Payment marked as received!');
      setTimeout(() => setSuccessMessage(''), 3000);
      setShowMarkPaidModal(false);
      setSelectedStageForPayment(null);
      loadProjectData();
    } catch (error: any) {
      console.error('Error marking payment as received:', error);
      alert('Failed to mark payment: ' + (error?.message || 'Unknown error'));
    } finally {
      setIsMarkingPaid(false);
    }
  };

  const getNextLockedStage = () => {
    return stages.find(s => s.status === 'locked');
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handleMarkRevisionUsed = async (stageId: string, stage: Stage) => {
    const freeRevisionsRemaining = (stage.revisions_included || 0) - (stage.revisions_used || 0);
    const extensionRevisionsTotal = stage.extension_purchased ? 3 : 0;
    const extensionRevisionsUsed = stage.extension_revisions_used || 0;
    const extensionRevisionsRemaining = extensionRevisionsTotal - extensionRevisionsUsed;
    
    const totalRemaining = freeRevisionsRemaining + extensionRevisionsRemaining;
    
    if (totalRemaining <= 0) {
      alert('No revisions remaining. Client needs to purchase an extension for more revisions.');
      return;
    }

    // Determine which type to use
    const usingFreeRevision = freeRevisionsRemaining > 0;
    const revisionType = usingFreeRevision ? 'included' : 'extension';
    const remainingText = usingFreeRevision 
      ? `${freeRevisionsRemaining - 1} free revision${freeRevisionsRemaining - 1 !== 1 ? 's' : ''}`
      : `${extensionRevisionsRemaining - 1} extension revision${extensionRevisionsRemaining - 1 !== 1 ? 's' : ''}`;

    const confirmMessage = usingFreeRevision
      ? `Use 1 included revision?\n\nThis will deduct from your included revisions.\n${remainingText} will remain after this.\n\n⚠️ This cannot be undone.`
      : `Use 1 extension revision?\n\nThis will deduct from your purchased revisions.\n${remainingText} will remain after this.\n\n⚠️ This cannot be undone.`;

    if (!confirm(confirmMessage)) {
      return;
    }

    setMarkingRevisionUsedStageId(stageId);

    try {
      const updateData = usingFreeRevision
        ? { 
            revisions_used: (stage.revisions_used || 0) + 1,
            status: 'in_progress'
          }
        : { 
            extension_revisions_used: extensionRevisionsUsed + 1,
            status: 'in_progress'
          };

      const { error } = await supabase
        .from('stages')
        .update(updateData)
        .eq('id', stageId);

      if (error) throw error;

      // Refresh data
      await loadProjectData();
      
      alert(`✓ ${revisionType.charAt(0).toUpperCase() + revisionType.slice(1)} revision used. ${remainingText} remaining.`);
    } catch (error) {
      console.error('Error marking revision as used:', error);
      alert('Failed to mark revision as used. Please try again.');
    } finally {
      setMarkingRevisionUsedStageId(null);
    }
  };

  const renderStageActionButton = (stage: Stage) => {
    const nextLockedStage = getNextLockedStage();
    const isNextInSequence = nextLockedStage?.id === stage.id;

    if (stage.status === 'locked' && isNextInSequence) {
      return (
        <div className="flex justify-end">
          <button
            onClick={() => handleStartStage(stage.id)}
            className="bg-green-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-600 transition-all duration-200 flex items-center justify-center gap-2"
          >
            <Unlock className="w-5 h-5" />
            Start This Stage
          </button>
        </div>
      );
    }

    if (stage.status === 'locked' && !isNextInSequence) {
      return (
        <div className="bg-gray-100 border-2 border-gray-300 rounded-lg p-8 sm:p-12 text-center">
          <div className="bg-gray-200 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <p className="text-lg sm:text-xl font-bold text-gray-700 mb-2">
            🔒 Stage Locked
          </p>
          <p className="text-sm sm:text-base text-gray-600 max-w-md mx-auto">
            This stage will unlock once the previous stage is completed and payment is received.
          </p>
        </div>
      );
    }

    // Active/in_progress stages now handle submission in the deliverables section
    if (stage.status === 'active' || stage.status === 'in_progress') {
      return null;
    }

    if (stage.status === 'payment_marked') {
      return (
        <div className="flex justify-end">
          <button
            onClick={() => handleVerifyPayment(stage.id)}
            className="bg-green-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-600 transition-all duration-200 flex items-center justify-center gap-2"
          >
            <CheckCircle className="w-5 h-5" />
            Verify Payment Received
          </button>
        </div>
      );
    }

    return null;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_progress':
        return 'bg-blue-500';
      case 'delivered':
        return 'bg-green-500';
      case 'approved':
        return 'bg-emerald-500';
      case 'payment_pending':
        return 'bg-yellow-500';
      case 'payment_marked':
        return 'bg-yellow-500';
      case 'completed':
      case 'complete':
        return 'bg-emerald-600';
      case 'locked':
        return 'bg-neutral-400';
      default:
        return 'bg-neutral-400';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'in_progress':
        return 'In Progress';
      case 'delivered':
        return 'Delivered - Awaiting Review';
      case 'approved':
        return 'Approved - Payment Pending';
      case 'payment_pending':
        return 'Payment Pending Verification';
      case 'payment_marked':
        return 'Payment Sent';
      case 'completed':
      case 'complete':
        return 'Completed';
      case 'locked':
        return 'Locked';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Navigation />
        <main className="max-w-6xl mx-auto px-4 sm:px-8 py-4 sm:py-6">
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-500 border-t-transparent mb-4"></div>
            <p className="text-gray-600">Loading project...</p>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white">
        <Navigation />
        <main className="max-w-6xl mx-auto px-4 sm:px-8 py-4 sm:py-6">
          <Link
            to="/dashboard"
            className="inline-flex items-center text-neutral-600 hover:text-black mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Link>
          <Card className="max-w-md mx-auto text-center py-12 px-6">
            <div className="text-red-500 text-5xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Failed to Load Project</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                onClick={() => window.location.href = '/dashboard'}
                variant="secondary"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
              <Button
                onClick={() => {
                  setError(null);
                  loadProjectData();
                }}
                variant="primary"
              >
                🔄 Retry
              </Button>
            </div>
          </Card>
        </main>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-white">
        <Navigation />
        <main className="max-w-6xl mx-auto px-4 sm:px-8 py-4 sm:py-6">
          <Link
            to="/dashboard"
            className="inline-flex items-center text-neutral-600 hover:text-black mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Link>
          <div className="text-center py-12">
            <p className="text-neutral-600">Project not found</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      {/* Fixed bottom-right container */}
      <div className="fixed bottom-4 sm:bottom-6 right-4 sm:right-6 z-50">
        <RealtimeStatus />
      </div>
      <main className="max-w-6xl mx-auto px-4 sm:px-8 py-4 sm:py-6 space-y-8">
        <Link
          to={`/project/${id}`}
          className="inline-flex items-center text-neutral-600 hover:text-black mb-8 transition-colors font-medium"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Project
        </Link>

<div className="mb-8 flex items-start justify-between gap-4">
  <div>
    <h1 className="text-4xl lg:text-5xl font-black tracking-tight text-black mb-2">
      {project.project_name || project.name}
    </h1>
    <p className="text-neutral-600 text-lg">
      Client: {project.client_name}
    </p>
  </div>
  <div className="flex items-center gap-4 flex-shrink-0">
<button
  onClick={() => loadProjectData()}
  className="px-3 py-2 border-2 border-gray-200 hover:border-gray-300 bg-white text-gray-700 rounded-lg transition-all flex items-center gap-2"
  title="Refresh"
>
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="18" 
    height="18" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
  </svg>
  <span className="text-sm font-medium">Refresh</span>
</button>
    <div className="text-right">
      <p className="text-sm text-gray-500">Total Project Value</p>
      <p className="text-2xl font-bold text-gray-900">
        {formatCurrency(project.total_amount, project.currency || 'USD')}
      </p>
    </div>
  </div>
</div>

        {successMessage && (
          <div className="mb-6 bg-emerald-50 border border-emerald-500 text-emerald-700 px-4 py-3 rounded-lg">
            {successMessage}
          </div>
        )}

        <ExtensionVerificationAlert
          extensions={pendingExtensions}
          onVerified={() => {
            loadProjectData();
            loadPendingExtensions();
          }}
        />

        {pendingStagePayments.length > 0 && (
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
            <h3 className="font-bold text-lg mb-3">
              💰 Stage Payment Pending Verification
            </h3>
            {pendingStagePayments.map(payment => {
              const stage = stages.find(s => s.id === payment.stage_id);
              if (!stage) return null;

              return (
                <div key={payment.id} className="bg-white p-4 rounded mb-3 border">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-bold text-lg text-gray-900">
                        Stage {stage.stage_number}: {stage.name}
                      </p>
                      <p className="text-2xl font-bold text-green-600 mt-1">
                        {formatCurrency(payment.amount, project.currency || 'USD')}
                      </p>
                      <p className="text-sm text-gray-600 mt-2">
                        Reference: {payment.reference_code}
                      </p>
                      <p className="text-sm text-gray-600">
                        Marked paid: {new Date(payment.marked_paid_at).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3 mt-4 justify-end">
                    <button
                      onClick={() => rejectStagePayment(payment.id)}
                      className="px-4 py-3 bg-gray-300 rounded-lg hover:bg-gray-400 font-semibold"
                    >
                      ❌ Not Received
                    </button>
                    <button
                      onClick={() => verifyStagePayment(payment.id, stage.id)}
                      className="bg-green-500 text-white px-4 py-3 rounded-lg font-semibold hover:bg-green-600"
                    >
                      ✅ Verify Payment Received
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="space-y-8 sm:space-y-12">
          {stages.length === 0 ? (
            <Card className="text-center py-12">
              <div className="max-w-md mx-auto">
                <div className="text-6xl mb-6">📦</div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-4">
                  No stages yet
                </h3>
                <p className="text-base text-gray-600 mb-8">
                  This project doesn't have any stages. Add stages to start tracking your work.
                </p>
                <Button className="w-full sm:w-auto">
                  Add Stage
                </Button>
              </div>
            </Card>
          ) : (
            stages.map((stage) => {
            // COMPLETED STAGE - Collapsed green bar
            if (stage.status === 'completed') {
              return (
                <div
                  key={stage.id}
                  className="bg-green-50 border-2 border-green-500 rounded-lg p-3 sm:p-4 hover:bg-green-100 transition-all cursor-pointer"
                  onClick={() => setExpandedCompletedStages(prev => ({ ...prev, [stage.id]: !prev[stage.id] }))}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                      <div className="bg-green-500 rounded-full p-2 flex-shrink-0">
                        <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                          <h3 className="font-bold text-base sm:text-lg text-green-900">
                            Stage {stage.stage_number}: {stage.name}
                          </h3>
                          <span className="px-2 sm:px-3 py-0.5 sm:py-1 bg-green-500 text-white text-xs font-semibold rounded-full">
                            COMPLETED
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm text-green-700 mt-1">
                          Completed {formatDate(stage.payment_received_at)} • {formatCurrency(stage.amount, project.currency || 'USD')} paid
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:gap-4 flex-shrink-0">
                      <div className="bg-green-500 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-bold text-sm sm:text-base">
                        {formatCurrency(stage.amount, project.currency || 'USD')}
                      </div>

                      <div className="text-green-600">
                        {expandedCompletedStages[stage.id] ? (
                          <ChevronUp className="w-5 h-5 sm:w-6 sm:h-6" />
                        ) : (
                          <ChevronDown className="w-5 h-5 sm:w-6 sm:h-6" />
                        )}
                      </div>
                    </div>
                  </div>

                  {expandedCompletedStages[stage.id] && (
                    <div className="mt-4 pt-4 border-t border-green-200" onClick={(e) => e.stopPropagation()}>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Amount</p>
                          <p className="font-semibold text-gray-900">{formatCurrency(stage.amount, project.currency || 'USD')}</p>
                        </div>
                        {stage.stage_number !== 0 && (
                          <div>
                            <p className="text-gray-600">Revisions Used</p>
                            <p className="font-semibold text-gray-900">
                              {stage.revisions_used || 0}/{stage.revisions_included || 2}
                            </p>
                          </div>
                        )}
                        <div>
                          <p className="text-gray-600">Completed</p>
                          <p className="font-semibold text-gray-900">{formatDate(stage.payment_received_at)}</p>
                        </div>
                      </div>

                      {stage.deliverables && stage.deliverables.length > 0 && (
                        <div className="mt-4">
                          <p className="text-sm font-semibold text-gray-700 mb-2">Deliverables ({stage.deliverables.length})</p>
                          <div className="space-y-2">
                            {stage.deliverables.map((deliverable) => (
                              <div key={deliverable.id} className="flex items-center gap-2 text-sm">
                                <FileText className="w-4 h-4 text-green-600" />
                                <span className="text-gray-700">{deliverable.title}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            }

            // STAGE 0 (DOWN PAYMENT) - Simplified payment gate
            if (stage.stage_number === 0) {
              const isDownPaymentPaid = stage.status === 'completed' && stage.payment_received_at;

              return (
                <div
                  key={stage.id}
                  className={`bg-white border-2 rounded-xl overflow-hidden transition-all duration-300 ${
                    isDownPaymentPaid
                      ? 'border-green-400 shadow-md'
                      : 'border-blue-400 shadow-md'
                  }`}
                >
                  <div className="p-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="bg-blue-500 rounded-full p-3 flex-shrink-0">
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                            {stage.name}
                          </h2>
                          <p className="text-sm text-gray-600 mt-1">
                            Payment gate to unlock project stages
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
                        <div className="text-left sm:text-right">
                          <p className="text-sm text-gray-600">Amount</p>
                          <p className="text-2xl sm:text-3xl font-bold text-green-600">
                            {formatCurrency(stage.amount, project.currency || 'USD')}
                          </p>
                        </div>

                        {isDownPaymentPaid ? (
                          <div className="flex items-center gap-2 px-4 py-2 bg-green-100 border-2 border-green-400 rounded-lg">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                            <span className="font-semibold text-green-700">Paid ✓</span>
                          </div>
                        ) : (
                          <div className="flex flex-col gap-2">
                            <span className="inline-block px-3 py-1 bg-orange-100 text-orange-800 text-sm font-semibold rounded-full text-center">
                              Status: Unpaid
                            </span>
                            <button
                              onClick={() => {
                                setSelectedStageForPayment(stage);
                                setShowMarkPaidModal(true);
                              }}
                              className="bg-green-500 text-white px-6 py-2 rounded-lg font-semibold hover:bg-green-600 transition-colors whitespace-nowrap"
                            >
                              Mark as Paid
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {isDownPaymentPaid && stage.payment_received_at && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <p className="text-sm text-gray-600 text-center">
                          Payment received on {formatDate(stage.payment_received_at)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            }

            // ACTIVE/LOCKED/OTHER STAGES - Regular card
            return (
            <div
              key={stage.id}
              className={`bg-white border-2 rounded-xl overflow-hidden transition-all duration-300 ${
                stage.status === 'locked'
                  ? 'border-gray-300 opacity-75 shadow-sm'
                  : stage.status === 'active' || stage.status === 'in_progress'
                    ? 'border-green-500 shadow-md hover:shadow-lg'
                    : stage.status === 'delivered' || stage.status === 'payment_pending'
                      ? 'border-blue-300 shadow-md'
                      : 'border-neutral-200 shadow-md'
              }`}
            >
              <div className={`p-4 sm:p-6 border-b ${
                stage.status === 'locked'
                  ? 'bg-gray-50 border-gray-300'
                  : stage.status === 'active' || stage.status === 'in_progress'
                    ? 'bg-yellow-50 border-green-500'
                    : stage.status === 'delivered' || stage.status === 'payment_pending'
                      ? 'bg-blue-50 border-blue-300'
                      : 'bg-white border-neutral-200'
              }`}>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                    <div className={`${getStatusColor(stage.status)} rounded-full p-2 sm:p-3 flex-shrink-0`}>
                      <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h2 className={`text-lg sm:text-xl font-bold truncate ${
                        stage.status === 'locked' ? 'text-gray-600' : 'text-gray-900'
                      }`}>
                        Stage {stage.stage_number}: {stage.name}
                      </h2>
                      <p className="text-sm sm:text-base text-neutral-600 mt-0.5 sm:mt-1">
                        {getStatusLabel(stage.status)}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 sm:block sm:text-right flex-shrink-0">
                    <div>
                      <p className="text-neutral-600 text-xs sm:text-sm">Amount</p>
                      <p className="text-xl sm:text-2xl font-bold text-black">
                        {formatCurrency(stage.amount, project.currency || 'USD')}
                      </p>
                    </div>
                    {stage.stage_number !== 0 && (
                      <div className="sm:mt-1">
                        <p className="text-neutral-600 text-xs sm:text-sm sm:hidden">Revisions</p>
                        <p className="text-xs sm:text-sm font-semibold" style={{
                          color: stage.revisions_used === 0 ? '#10b981' : stage.revisions_used === stage.revisions_included ? '#ef4444' : '#f59e0b'
                        }}>
                          Revisions: {stage.revisions_used}/{stage.revisions_included}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-6 sm:p-8 space-y-8 sm:space-y-12">
                <StageProgress
                  status={stage.status}
                  isLocked={stage.status === 'locked'}
                  deliverablesCount={stage.deliverables.length}
                />

                {/* Payment Status Display with Mark as Paid Button */}
                {stage.status === 'payment_pending' && stage.payment_status !== 'paid' && (
                  <div className="bg-orange-50 border-2 border-orange-400 rounded-lg p-4 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-orange-400 rounded-full p-2 flex-shrink-0">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <span className="inline-block px-3 py-1 bg-red-100 text-red-800 text-sm font-semibold rounded-full">
                          Unpaid
                        </span>
                        <p className="text-sm text-gray-600 mt-1">
                          Client has marked payment as sent
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedStageForPayment(stage);
                        setShowMarkPaidModal(true);
                      }}
                      className="bg-green-500 text-white px-6 py-2 rounded-lg font-semibold hover:bg-green-600 transition-colors whitespace-nowrap"
                    >
                      Mark as Paid
                    </button>
                  </div>
                )}

                {stage.revisions_used > 0 && (
                  <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg shadow-lg overflow-hidden">
                    <button
                      onClick={() => setExpandedRevisionBoxes(prev => ({ ...prev, [`main-${stage.id}`]: !prev[`main-${stage.id}`] }))}
                      className="w-full flex items-center justify-between p-6 hover:bg-yellow-100 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="bg-yellow-400 rounded-full p-3 flex-shrink-0">
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                        </div>
                        <div className="text-left">
                          <h3 className="text-xl font-bold text-gray-900">
                            {stage.revisions_used} Revision Request{stage.revisions_used > 1 ? 's' : ''} from Client
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">
                            {stage.revisions_used} of {stage.revisions_included || 2} revisions used
                          </p>
                        </div>
                      </div>
                      {expandedRevisionBoxes[`main-${stage.id}`] ? (
                        <ChevronUp className="w-6 h-6 text-gray-600 flex-shrink-0" />
                      ) : (
                        <ChevronDown className="w-6 h-6 text-gray-600 flex-shrink-0" />
                      )}
                    </button>

                    {expandedRevisionBoxes[`main-${stage.id}`] && (
                      <div className="px-6 pb-6">
                        {stage.revisions && stage.revisions.length > 0 ? (
                          <>
                            <div className="bg-white rounded-lg p-4 mb-3 border border-yellow-200 shadow-sm">
                              <p className="text-sm text-gray-500 mb-1 font-medium">Latest feedback:</p>
                              <p className="text-gray-900 font-medium text-base whitespace-pre-wrap">
                                {stage.revisions[0].feedback}
                              </p>
                              <p className="text-xs text-gray-500 mt-2">
                                Requested {new Date(stage.revisions[0].requested_at).toLocaleString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: 'numeric',
                                  minute: '2-digit',
                                  hour12: true
                                })}
                              </p>
                            </div>

                            {stage.revisions.length > 1 && (
                              <button
                                onClick={() => setShowAllRevisions(prev => ({ ...prev, [stage.id]: !prev[stage.id] }))}
                                className="text-blue-600 hover:underline font-medium text-sm"
                              >
                                {showAllRevisions[stage.id] ? 'Hide older requests' : 'View all requests →'}
                              </button>
                            )}

                            {showAllRevisions[stage.id] && stage.revisions.length > 1 && (
                              <div className="mt-4 space-y-2">
                                {stage.revisions.map((revision, idx) => (
                                  <div key={revision.id} className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                                    <div className="flex items-start justify-between gap-2 mb-2">
                                      <p className="text-sm font-semibold text-gray-700">
                                        Revision {stage.revisions.length - idx}
                                      </p>
                                      <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                                        revision.completed_at
                                          ? 'bg-green-100 text-green-700'
                                          : 'bg-yellow-100 text-yellow-700'
                                      }`}>
                                        {revision.completed_at ? 'Completed' : 'Pending'}
                                      </span>
                                    </div>
                                    <p className="text-sm text-gray-900 whitespace-pre-wrap mb-2">
                                      {revision.feedback}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      Requested {new Date(revision.requested_at).toLocaleString('en-US', {
                                        month: 'short',
                                        day: 'numeric',
                                        hour: 'numeric',
                                        minute: '2-digit',
                                        hour12: true
                                      })}
                                    </p>
                                    {revision.completed_at && (
                                      <p className="text-xs text-green-600 mt-1">
                                        Completed {new Date(revision.completed_at).toLocaleString('en-US', {
                                          month: 'short',
                                          day: 'numeric',
                                          hour: 'numeric',
                                          minute: '2-digit',
                                          hour12: true
                                        })}
                                      </p>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </>
                        ) : (
                          <p className="text-gray-600">Loading revision feedback...</p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                <div className="bg-gray-50 border-2 border-gray-200 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-black flex items-center gap-2">
                      <div className="bg-black rounded-full p-2">
                        <FileText className="w-4 h-4 text-white" />
                      </div>
                      Deliverables ({stage.deliverables.length})
                    </h3>
                    {((stage.status === 'active' || stage.status === 'in_progress') || 
                      (stage.status === 'delivered' && stage.revisions_used > 0)) && (
                      <button
                        onClick={() => handleOpenModal(stage.id)}
                        className="flex items-center gap-2 bg-emerald-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-emerald-600 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        Add Link
                      </button>
                    )}
                  </div>

                  {stage.deliverables.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <p className="text-gray-600 mb-2">No deliverables yet</p>
                      <p className="text-sm text-gray-500">Add deliverable links when you're ready to share work</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {stage.deliverables.map((deliverable) => {
                        const canEdit = (stage.status === 'active' || stage.status === 'in_progress') || 
                                       (stage.status === 'delivered' && stage.revisions_used > 0);
                        return (
                          <div
                            key={deliverable.id}
                            className="bg-white border border-neutral-200 rounded-lg p-4 transition-all duration-200"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start gap-2">
                                  <span className="text-gray-600 mt-0.5">•</span>
                                  <div className="flex-1">
                                    <h4 className="font-semibold text-black break-words">
                                      {deliverable.title}
                                    </h4>
                                    {deliverable.description && (
                                      <p className="text-sm text-neutral-600 mt-1 break-words">
                                        {deliverable.description}
                                      </p>
                                    )}
                                    <a
                                      href={deliverable.file_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 text-sm text-emerald-600 hover:text-emerald-700 font-medium break-all mt-2"
                                    >
                                      <span className="truncate">{deliverable.file_url}</span>
                                    </a>
                                  </div>
                                </div>
                              </div>
                              {canEdit && (
                                <div className="flex gap-2 flex-shrink-0">
                                  <button
                                    onClick={() => handleOpenEditModal(deliverable, stage.id)}
                                    className="text-blue-600 hover:text-blue-700 text-sm font-medium px-2 py-1"
                                    title="Edit deliverable"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => handleDeleteDeliverable(deliverable.id)}
                                    className="text-red-600 hover:text-red-700 text-sm font-medium px-2 py-1"
                                    title="Delete deliverable"
                                  >
                                    Delete
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {(stage.status === 'active' || stage.status === 'in_progress') && (
                    <div className="mt-6 flex justify-center">
                      <button
                        onClick={() => handleMarkAsDelivered(stage.id)}
                        disabled={stage.deliverables.length === 0 || isSubmitting}
                        className={`px-8 py-3 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center gap-2 w-full sm:w-auto ${
                          stage.deliverables.length > 0 && !isSubmitting
                            ? 'bg-green-500 text-white hover:bg-green-600 hover:shadow-lg'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        {isSubmitting ? (
                          <>
                            <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                            Submitting...
                          </>
                        ) : (
                          'Submit for Client Review'
                        )}
                      </button>
                    </div>
                  )}

                  {stage.status === 'delivered' && stage.revisions_used === 0 && (
                    <div className="mt-6 flex justify-center">
                      <div className="px-8 py-3 bg-green-100 border-2 border-green-500 text-green-700 rounded-lg font-semibold flex items-center gap-2">
                        <CheckCircle className="w-5 h-5" />
                        ✓ Submitted
                      </div>
                    </div>
                  )}

                  {stage.status === 'delivered' && (
                    <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-6 text-center mt-6">
                      <CheckCircle className="w-12 h-12 text-blue-600 mx-auto mb-3" />
                      <p className="font-bold text-black text-lg mb-2">Work Submitted!</p>
                      <p className="text-neutral-700">Client will be notified to review your work.</p>
                    </div>
                  )}
                </div>

                <div>
                  <NoteBox
                    stageId={stage.id}
                    authorType="freelancer"
                    authorName={userName || 'You'}
                    stage={stage}
                    onMarkRevisionUsed={handleMarkRevisionUsed}
                    isMarkingRevisionUsed={markingRevisionUsedStageId === stage.id}
                  />
                </div>

                {stage.status === 'in_progress' && stage.revisions.length > 0 && (
                  <div className="bg-orange-50 border-2 border-orange-300 rounded-lg overflow-hidden">
                    <button
                      onClick={() => setExpandedRevisionBoxes(prev => ({ ...prev, [`orange-${stage.id}`]: !prev[`orange-${stage.id}`] }))}
                      className="w-full flex items-center justify-between p-6 hover:bg-orange-100 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <MessageSquare className="w-5 h-5 text-orange-600" />
                        <div className="text-left">
                          <h4 className="font-bold text-black">
                            Client Revision Request
                          </h4>
                          <p className="text-sm text-orange-700 font-semibold mt-1">
                            Revision {stage.revisions_used} of {stage.revisions_included}
                          </p>
                        </div>
                      </div>
                      {expandedRevisionBoxes[`orange-${stage.id}`] ? (
                        <ChevronUp className="w-5 h-5 text-gray-600 flex-shrink-0" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-600 flex-shrink-0" />
                      )}
                    </button>

                    {expandedRevisionBoxes[`orange-${stage.id}`] && (
                      <div className="px-6 pb-6">
                        <div className="bg-white border border-orange-200 rounded-lg p-4">
                          <p className="text-neutral-700 mb-2 whitespace-pre-wrap">
                            {stage.revisions[0].feedback}
                          </p>
                          <p className="text-sm text-neutral-500">
                            Requested: {new Date(stage.revisions[0].requested_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {stage.status === 'locked' && (
                  <div className="mt-6">
                    {renderStageActionButton(stage)}
                  </div>
                )}
              </div>
            </div>
            );
          })
          )}
        </div>
      </main>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-lg w-full p-6" role="dialog" aria-labelledby="modal-title" aria-describedby="modal-description">
            <div className="flex items-center justify-between mb-6">
              <h2 id="modal-title" className="text-2xl font-bold text-black">
                {isEditMode ? 'Edit Deliverable' : 'Add Deliverable'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="text-neutral-600 hover:text-black transition-colors"
                aria-label="Close dialog"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <p id="modal-description" className="sr-only">
              {isEditMode ? 'Edit an existing deliverable' : 'Add a new deliverable for this stage'}
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-black mb-2">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => {
                    setFormData({ ...formData, title: e.target.value });
                    setFormErrors({ ...formErrors, title: undefined });
                  }}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:scale-[1.01] transition-all duration-150 ${
                    formErrors.title ? 'border-red-500' : 'border-neutral-300'
                  }`}
                  placeholder="Enter deliverable title"
                />
                {formErrors.title && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.title}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-bold text-black mb-2">
                  File URL <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.file_url}
                  onChange={(e) => {
                    setFormData({ ...formData, file_url: e.target.value });
                    setFormErrors({ ...formErrors, file_url: undefined });
                  }}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:scale-[1.01] transition-all duration-150 ${
                    formErrors.file_url ? 'border-red-500' : 'border-neutral-300'
                  }`}
                  placeholder="https://example.com/file.pdf"
                />
                {formErrors.file_url && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.file_url}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-bold text-black mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={3}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:scale-[1.01] transition-all duration-150"
                  placeholder="Optional description"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-2 border border-neutral-300 text-black rounded-lg font-medium hover:bg-neutral-50 transition-colors"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-emerald-500 text-white rounded-lg font-medium hover:bg-emerald-600 transition-colors disabled:bg-neutral-300 disabled:cursor-not-allowed"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Saving...' : (isEditMode ? 'Save Changes' : 'Save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Mark as Paid Confirmation Modal */}
      {showMarkPaidModal && selectedStageForPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 modal-backdrop">
          <div className="bg-white rounded-lg max-w-md w-full p-6 modal-content">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-black">Confirm Payment Received</h2>
              <button
                onClick={() => {
                  setShowMarkPaidModal(false);
                  setSelectedStageForPayment(null);
                }}
                className="text-gray-600 hover:text-black transition-colors"
                aria-label="Close dialog"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="mb-6">
              <p className="text-gray-700 mb-4">
                Mark payment as received for:
              </p>
              <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4">
                <p className="font-bold text-lg text-gray-900">
                  Stage {selectedStageForPayment.stage_number}: {selectedStageForPayment.name}
                </p>
                <p className="text-2xl font-bold text-green-600 mt-2">
                  {formatCurrency(selectedStageForPayment.amount, project.currency || 'USD')}
                </p>
              </div>
              <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4 mt-4">
                <p className="text-sm text-yellow-800">
                  <strong>This will:</strong>
                </p>
                <ul className="text-sm text-yellow-800 mt-2 space-y-1 list-disc list-inside">
                  <li>Mark the payment as received</li>
                  <li>Complete this stage</li>
                  {selectedStageForPayment.stage_number === 0 && (
                    <li>Unlock Stage 1</li>
                  )}
                  {selectedStageForPayment.stage_number > 0 && selectedStageForPayment.stage_number < stages.length - 1 && (
                    <li>Unlock Stage {selectedStageForPayment.stage_number + 1}</li>
                  )}
                  {selectedStageForPayment.stage_number === stages.length - 1 && (
                    <li>Mark the project as completed</li>
                  )}
                </ul>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowMarkPaidModal(false);
                  setSelectedStageForPayment(null);
                }}
                disabled={isMarkingPaid}
                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleMarkAsPaid}
                disabled={isMarkingPaid}
                className="flex-1 px-6 py-3 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isMarkingPaid ? 'Processing...' : 'Yes, Mark as Paid'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
