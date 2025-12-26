// Enhanced Dashboard v6 - CORRECT VERSION - Preserves ALL original logic
import { useEffect, useState, useCallback, useRef, useMemo, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useStore } from '../store/useStore';
import { supabase } from '../lib/supabase';
import Navigation from '../components/Navigation';
import Card from '../components/Card';
import Button from '../components/Button';
import RealtimeStatus from '../components/RealtimeStatus';
import ProjectCard from '../components/ProjectCard';
import PaymentTracker from '../components/PaymentTracker';
import StripeConnect from '../components/StripeConnect';
import WelcomeModal from '../components/WelcomeModal';
import TrialBanner from '../components/TrialBanner';
import TrialExpiredModal from '../components/TrialExpiredModal';
import PaymentSetupModal from '../components/PaymentSetupModal';
import ManualPaymentSetup from '../components/ManualPaymentSetup';
import { useSubscription } from '../hooks/useSubscription';
import { retryOperation } from '../lib/errorHandling';
import { getPrimaryNotification } from '../lib/notificationMessages';
import { formatCurrency, type CurrencyCode } from '../lib/currency';
import { RefreshCw, Search, Archive, ArchiveRestore, X } from 'lucide-react';

interface Project {
  id: string;
  project_name: string;
  client_name: string;
  total_amount: number;
  status: string;
  completed_stages: number;
  total_stages: number;
  amount_earned: number;
  has_unread_actions: boolean;
  primary_notification?: string;
  currency: CurrencyCode;
  share_code: string;
  archived_at?: string | null;
}

type FilterOption = 'active' | 'completed' | 'archived' | 'all';
type SortOption = 'recent' | 'client' | 'amount' | 'status';

export default function Dashboard() {
  const navigate = useNavigate();
  const user = useStore((state) => state.user);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stripeConnected, setStripeConnected] = useState(false);
  const [connectingStripe, setConnectingStripe] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  
  // New state for search/filter/sort/archive
  const [searchQuery, setSearchQuery] = useState('');
  const [filterBy, setFilterBy] = useState<FilterOption>('active');
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [archivingProjectId, setArchivingProjectId] = useState<string | null>(null);
  const [newCompletedCount, setNewCompletedCount] = useState(0);
  const [showTrialModal, setShowTrialModal] = useState(false);
  const [showPaymentSetupModal, setShowPaymentSetupModal] = useState(false);
  const [showManualPaymentSetup, setShowManualPaymentSetup] = useState(false);
  const [hasPaymentMethod, setHasPaymentMethod] = useState(false);
  const [checkingPayment, setCheckingPayment] = useState(true);
  
  // Subscription check
  const { subscription } = useSubscription();
  
  const fetchingRef = useRef(false);
  const userId = user?.id;

  // When user clicks Completed filter, mark all completed projects as viewed
  useEffect(() => {
    if (filterBy === 'completed' && userId && newCompletedCount > 0) {
      console.log('[Dashboard] User viewing Completed filter - clearing badge');
      
      const currentCompletedIds = projects
        .filter(p => p.status === 'completed' && !p.archived_at)
        .map(p => p.id)
        .sort()
        .join(',');
      
      localStorage.setItem(`lastViewedCompleted_${userId}`, currentCompletedIds);
      setNewCompletedCount(0);
    }
  }, [filterBy, userId, newCompletedCount, projects]);

  const fetchProjects = useCallback(async (isRefresh = false) => {
    if (!userId) return;

    // Prevent duplicate fetches
    if (fetchingRef.current) {
      console.log('[Dashboard] Already fetching, skipping duplicate request');
      return;
    }

    fetchingRef.current = true;

    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      console.log('[Dashboard] Fetching projects...');

      const projectsData = await retryOperation(
        async () => {
          const { data, error } = await supabase
            .from('projects')
            .select(`
              id,
              project_name,
              client_name,
              total_amount,
              status,
              currency,
              share_code,
              archived_at,
              stages (
                id,
                stage_number,
                status,
                amount,
                payment_status,
                approved_at,
                viewed_by_freelancer_at,
                revisions!revisions_stage_id_fkey (
                  id,
                  viewed_by_freelancer_at,
                  requested_at
                ),
                stage_payments!stage_payments_stage_id_fkey (
                  id,
                  status,
                  marked_paid_at,
                  viewed_by_freelancer_at
                ),
                stage_notes!stage_notes_stage_id_fkey (
                  id,
                  author_type,
                  viewed_by_freelancer_at,
                  created_at
                )
              )
            `)
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .order('stage_number', { foreignTable: 'stages', ascending: true });

          if (error) throw error;
          return data;
        },
        3,
        'fetch projects'
      );

      const projectsWithStats = projectsData?.map((project: any) => {
        // Ensure stages are sorted by stage_number
        const stages = (project.stages || []).sort((a: any, b: any) => a.stage_number - b.stage_number);
        const completedStages = stages.filter((s: any) => s.payment_status === 'received').length;
        const amountEarned = stages
          .filter((s: any) => s.payment_status === 'received')
          .reduce((sum: number, s: any) => sum + (s.amount || 0), 0);

        // EXACT ORIGINAL LOGIC - Find the first stage with unread actions
        let primaryNotification = '';
        let hasUnreadActions = false;

        for (const stage of stages) {
          // ✅ Skip completed/closed stages - they're locked and inaccessible
          if (stage.status === 'complete' || stage.status === 'completed') {
            continue;
          }

          const hasUnreadRevision = stage.revisions?.some((rev: any) =>
            rev.requested_at && !rev.viewed_by_freelancer_at
          ) || false;

          const hasUnreadPayment = stage.stage_payments?.some((payment: any) =>
            payment.status === 'marked_paid' &&
            payment.marked_paid_at &&
            !payment.viewed_by_freelancer_at
          ) || false;

          const hasUnreadApproval = stage.approved_at && !stage.viewed_by_freelancer_at;

          const unreadMessageCount = stage.stage_notes?.filter((note: any) =>
            note.author_type === 'client' && !note.viewed_by_freelancer_at
          ).length || 0;

          const stageHasUnread = hasUnreadRevision || hasUnreadPayment || hasUnreadApproval || unreadMessageCount > 0;

          if (stageHasUnread) {
            hasUnreadActions = true;
            if (!primaryNotification) {
              console.log(`[Dashboard] Stage ${stage.stage_number} has unread actions`);
              primaryNotification = getPrimaryNotification(
                {
                  hasUnviewedPayment: hasUnreadPayment,
                  hasUnviewedRevision: hasUnreadRevision,
                  hasUnviewedApproval: hasUnreadApproval,
                  unreadMessageCount: unreadMessageCount
                },
                ''
              );
              console.log(`[Dashboard] Generated notification: ${primaryNotification}`);
            }
          }
        }

        return {
          id: project.id,
          project_name: project.project_name,
          client_name: project.client_name,
          total_amount: project.total_amount,
          status: project.status,
          completed_stages: completedStages,
          total_stages: stages.length,
          amount_earned: amountEarned,
          has_unread_actions: hasUnreadActions,
          primary_notification: primaryNotification,
          currency: project.currency || 'USD',
          share_code: project.share_code,
          archived_at: project.archived_at,
        };
      }) || [];

      console.log('[Dashboard] Loaded', projectsWithStats.length, 'projects');
      setProjects(projectsWithStats);

      // SUPER SIMPLE: Count completed projects
      const completedCount = projectsWithStats.filter(p => 
        p.status === 'completed' && !p.archived_at
      ).length;
      
      console.log('[Dashboard] Completed projects count:', completedCount);
      
      // Check if user has viewed completed filter since last completion
      const lastViewedCompleted = localStorage.getItem(`lastViewedCompleted_${userId}`) || '0';
      const currentCompletedIds = projectsWithStats
        .filter(p => p.status === 'completed' && !p.archived_at)
        .map(p => p.id)
        .sort()
        .join(',');
      
      console.log('[Dashboard] Last viewed completed IDs:', lastViewedCompleted);
      console.log('[Dashboard] Current completed IDs:', currentCompletedIds);
      
      // If the list of completed projects has changed, show badge
      if (currentCompletedIds !== lastViewedCompleted && completedCount > 0) {
        setNewCompletedCount(completedCount);
        console.log('[Dashboard] NEW COMPLETIONS DETECTED!');
      } else {
        setNewCompletedCount(0);
        console.log('[Dashboard] No new completions');
      }

      if (isRefresh) {
        toast.success('Refreshed!');
      }
    } catch (error: any) {
      console.error('[Dashboard] Error:', error);

      if (error?.message?.includes('fetch') || error?.message?.includes('network')) {
        toast.error('Connection lost. Retrying...');
      } else {
        toast.error('Could not load Projects');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
      fetchingRef.current = false;
    }
  }, [userId]);

  // Archive/Restore project
  const handleArchiveProject = async (projectId: string, projectName: string, isArchived: boolean) => {
    const action = isArchived ? 'restore' : 'archive';
    const confirmMessage = isArchived 
      ? `Restore "${projectName}"?\n\nThis will move it back to your active projects.`
      : `Archive "${projectName}"?\n\nYou can restore it later from the Archived filter.`;
    
    if (!confirm(confirmMessage)) {
      return;
    }

    setArchivingProjectId(projectId);
    
    try {
      const { error } = await supabase
        .from('projects')
        .update({ archived_at: isArchived ? null : new Date().toISOString() })
        .eq('id', projectId)
        .eq('user_id', userId);

      if (error) throw error;

      // Update local state
      setProjects(prev => prev.map(p => 
        p.id === projectId 
          ? { ...p, archived_at: isArchived ? null : new Date().toISOString() }
          : p
      ));

      toast.success(isArchived ? 'Project restored successfully' : 'Project archived successfully');
    } catch (error) {
      console.error(`[Dashboard] Error ${action}ing project:`, error);
      toast.error(`Failed to ${action} project`);
    } finally {
      setArchivingProjectId(null);
    }
  };

  // Payment setup handlers
  const handleConnectStripe = () => {
    setShowPaymentSetupModal(false);
    // The StripeConnect component handles the actual connection
    // Just close the modal - user can click the Stripe Connect banner
    toast.success('Please complete Stripe setup using the banner above');
  };

  const handleSetupManual = () => {
    setShowPaymentSetupModal(false);
    setShowManualPaymentSetup(true);
  };

  const handleManualPaymentSaved = () => {
    setHasPaymentMethod(true);
    toast.success('Payment instructions saved! You can now share projects with clients.');
  };

  // Filter and sort projects
  const filteredProjects = useMemo(() => {
    let filtered = [...projects];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(project => 
        project.project_name.toLowerCase().includes(query) ||
        project.client_name.toLowerCase().includes(query)
      );
    }

    // Apply archive/status filter - FIXED LOGIC!
    filtered = filtered.filter(project => {
      const isArchived = !!project.archived_at;
      const isComplete = project.total_stages > 0 && project.completed_stages === project.total_stages;

      switch (filterBy) {
        case 'active':
          return !isArchived && !isComplete; // Only active, not archived
        case 'completed':
          return !isArchived && isComplete; // Only completed, not archived
        case 'archived':
          return isArchived; // Only archived (regardless of completion)
        case 'all':
          return !isArchived; // All non-archived (both active and completed)
        default:
          return true;
      }
    });

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'client':
          return a.client_name.localeCompare(b.client_name);
        case 'amount':
          return b.total_amount - a.total_amount;
        case 'status':
          if (a.has_unread_actions && !b.has_unread_actions) return -1;
          if (!a.has_unread_actions && b.has_unread_actions) return 1;
          return 0;
        case 'recent':
        default:
          return 0; // Already sorted by created_at DESC from query
      }
    });

    return filtered;
  }, [projects, searchQuery, filterBy, sortBy]);

  const handleRefresh = () => {
    fetchProjects(true);
  };

  const handleNavigateToProject = (shareCode: string) => {
    if (!shareCode) {
      toast.error('Project link not available');
      return;
    }
    navigate(`/projects/${shareCode}/overview`);
  };

  const checkStripeStatus = useCallback(async () => {
    if (!userId) return;
    
    try {
      const { data } = await supabase
        .from('user_profiles')
        .select('stripe_account_id')
        .eq('id', userId)
        .single();
      
      setStripeConnected(!!data?.stripe_account_id);
    } catch (error) {
      console.error('[Dashboard] Error checking Stripe status:', error);
    }
  }, [userId]);

  const checkWelcomeModal = useCallback(async () => {
    if (!userId) return;
    
    try {
      const { data } = await supabase
        .from('user_profiles')
        .select('welcome_modal_seen')
        .eq('id', userId)
        .single();

      if (!data?.welcome_modal_seen) {
        setShowWelcomeModal(true);
      }
    } catch (error) {
      console.error('[Dashboard] Error checking welcome modal:', error);
    }
  }, [userId]);

  const checkPaymentSetup = useCallback(async () => {
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('stripe_account_id, manual_payment_instructions')
        .eq('id', userId)
        .single();

      if (error) throw error;

      // User has payment method if EITHER Stripe connected OR manual instructions exist
      const hasStripe = !!data?.stripe_account_id;
      const hasManual = !!data?.manual_payment_instructions?.trim();
      
      setHasPaymentMethod(hasStripe || hasManual);
    } catch (error) {
      console.error('[Dashboard] Error checking payment setup:', error);
    } finally {
      setCheckingPayment(false);
    }
  }, [userId]);

  // Separate effect for initial load
  useEffect(() => {
    if (userId) {
      fetchProjects();
      checkStripeStatus();
      checkWelcomeModal();
      checkPaymentSetup();
    }
  }, [userId, fetchProjects, checkStripeStatus, checkWelcomeModal, checkPaymentSetup]);

  // Separate effect for realtime subscription (doesn't depend on projects array)
  useEffect(() => {
    if (!userId) return;

    console.log('[Dashboard] Setting up realtime subscription...');
    
    // Subscribe to changes in tables that affect notifications
    const channel = supabase
      .channel('dashboard-updates')
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'stages'
        },
        (payload) => {
          console.log('[Dashboard] Stage changed:', payload);
          fetchProjects(false); // Silent refresh - no toast
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'stage_payments'
        },
        (payload) => {
          console.log('[Dashboard] Payment changed:', payload);
          fetchProjects(false);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'revisions'
        },
        (payload) => {
          console.log('[Dashboard] Revision changed:', payload);
          fetchProjects(false);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'stage_notes'
        },
        (payload) => {
          console.log('[Dashboard] Note changed:', payload);
          fetchProjects(false);
        }
      )
      .subscribe((status) => {
        console.log('[Dashboard] Realtime status:', status);
      });

    // Cleanup on unmount
    return () => {
      console.log('[Dashboard] Cleaning up realtime subscription');
      supabase.removeChannel(channel);
    };
  }, [userId, fetchProjects]);

  const getStatusColor = (status: string, completedStages: number, totalStages: number, hasUnreadActions: boolean, isArchived?: boolean) => {
    // Check if archived first
    if (isArchived) {
      return 'bg-gray-100 text-gray-600 border-gray-300';
    }
    
    // Check if completed (100% progress)
    const isCompleted = totalStages > 0 && completedStages === totalStages;
    if (isCompleted) {
      return 'bg-green-100 text-green-700 border-green-200';
    }
    
    // Otherwise show active status
    switch (status) {
      case 'active':
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusLabel = (status: string, completedStages: number, totalStages: number, hasUnreadActions: boolean, isArchived?: boolean) => {
    // Check if archived first
    if (isArchived) {
      return 'Archived';
    }
    
    // Check if completed (100% progress)
    const isCompleted = totalStages > 0 && completedStages === totalStages;
    if (isCompleted) {
      return 'Completed';
    }
    
    // Otherwise show active status
    switch (status) {
      case 'active':
        return 'Active';
      case 'in_progress':
        return 'In Progress';
      case 'completed':
        return 'Completed';
      default:
        return status;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      {/* Welcome Modal for first-time users */}
      {showWelcomeModal && (
        <WelcomeModal 
          userId={userId!} 
          onClose={() => setShowWelcomeModal(false)} 
        />
      )}
      
      {/* Fixed bottom-right container */}
      <div className="fixed bottom-4 sm:bottom-6 right-4 sm:right-6 z-50">
        <RealtimeStatus />
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Stripe Connect Component */}
        <StripeConnect userId={userId!} />

        {/* Trial Banner - Shows subscription status */}
        <TrialBanner />

        {/* Payment Tracker Section */}
        <PaymentTracker userId={userId!} />

        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900">
              Dashboard
            </h1>
            <p className="text-base sm:text-lg text-gray-600 mt-2">
              Manage your projects and track payments
            </p>
          </div>
          {/* Only show buttons when there are projects */}
          {projects.length > 0 && (
            <div className="flex gap-3">
              <Button
                onClick={handleRefresh}
                disabled={refreshing}
                variant="secondary"
                className="flex-shrink-0"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
                <span className="sm:hidden">↻</span>
              </Button>
              <Button
                onClick={() => {
                  // Check subscription first
                  if (!subscription.canCreateProjects) {
                    setShowTrialModal(true);
                    return;
                  }
                  
                  // Check payment setup before creating project
                  if (!hasPaymentMethod && !checkingPayment) {
                    setShowPaymentSetupModal(true);
                    return;
                  }
                  
                  navigate('/templates');
                }}
                variant="primary"
                className="flex-1 sm:flex-initial whitespace-nowrap"
              >
                <span className="hidden sm:inline">Create Project</span>
                <span className="sm:hidden">Create</span>
              </Button>
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-500 border-t-transparent mb-4"></div>
            <p className="text-gray-600">Loading projects...</p>
          </div>
        ) : projects.length === 0 ? (
          <Card className="text-center py-12 sm:py-16 px-4">
            <div className="max-w-2xl mx-auto">
              <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-6 rounded-full bg-green-100 flex items-center justify-center">
                <svg className="w-10 h-10 sm:w-12 sm:h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
                Ready to track your first project?
              </h3>
              <p className="text-base sm:text-lg text-gray-600 mb-8 sm:mb-10">
                Create a project in 30 seconds with our templates. Get paid faster with clear milestones.
              </p>
              <div className="flex justify-center">
                <Button
                  onClick={() => {
                    // Check subscription first
                    if (!subscription.canCreateProjects) {
                      setShowTrialModal(true);
                      return;
                    }
                    
                    // Check payment setup before creating project
                    if (!hasPaymentMethod && !checkingPayment) {
                      setShowPaymentSetupModal(true);
                      return;
                    }
                    
                    navigate('/templates');
                  }}
                  className="px-8 py-4 text-base sm:text-lg min-h-[44px]"
                >
                  Create Your First Project
                </Button>
              </div>

              <div className="mt-8 sm:mt-12 pt-8 sm:pt-12 border-t border-gray-200">
                <h4 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6">
                  Quick Start Guide
                </h4>
                <div className="grid gap-4 sm:gap-6 sm:grid-cols-3 text-left">
                  <div className="bg-gray-50 rounded-lg p-4 sm:p-6">
                    <div className="text-2xl sm:text-3xl font-bold text-primary mb-2 sm:mb-3">1</div>
                    <h5 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Choose a Template</h5>
                    <p className="text-xs sm:text-sm text-gray-600">
                      Select from pre-built Project templates or create a custom workflow
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 sm:p-6">
                    <div className="text-2xl sm:text-3xl font-bold text-primary mb-2 sm:mb-3">2</div>
                    <h5 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Set Up Stages</h5>
                    <p className="text-xs sm:text-sm text-gray-600">
                      Define Stages with payment amounts, revision limits, and deliverables
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 sm:p-6">
                    <div className="text-2xl sm:text-3xl font-bold text-primary mb-2 sm:mb-3">3</div>
                    <h5 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Share with Client</h5>
                    <p className="text-xs sm:text-sm text-gray-600">
                      Send the unique portal link to your Client for progress tracking and payments
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ) : (
          <>
            {/* Search, Filter, Sort Bar */}
            <Card className="p-4 sm:p-6">
              <div className="flex flex-col lg:flex-row gap-4">
                {/* Search Bar */}
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search projects or clients..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>

                {/* Filter and Sort Dropdowns */}
                <div className="flex gap-3">
                  <div className="relative inline-block">
                    <select
                      value={filterBy}
                      onChange={(e) => setFilterBy(e.target.value as FilterOption)}
                      className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all bg-white min-w-[140px]"
                    >
                      <option value="active">Active</option>
                      <option value="completed">Completed{newCompletedCount > 0 ? ` (${newCompletedCount} new)` : ''}</option>
                      <option value="archived">Archived</option>
                      <option value="all">All Projects</option>
                    </select>
                    {newCompletedCount > 0 && filterBy !== 'completed' && (
                      <div className="absolute -top-2 -right-2 flex items-center justify-center w-6 h-6 bg-green-500 text-white text-xs font-bold rounded-full border-2 border-white shadow-lg animate-pulse">
                        {newCompletedCount}
                      </div>
                    )}
                  </div>

                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                    className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all bg-white min-w-[160px]"
                  >
                    <option value="recent">Most Recent</option>
                    <option value="client">Client Name</option>
                    <option value="amount">Amount</option>
                    <option value="status">Needs Attention</option>
                  </select>
                </div>
              </div>

              {/* Search Results Counter */}
              {searchQuery && (
                <div className="mt-4 flex items-center gap-2 text-sm text-gray-600">
                  <span>Showing {filteredProjects.length} of {projects.filter(p => !p.archived_at).length} projects</span>
                  <button
                    onClick={() => setSearchQuery('')}
                    className="text-green-600 hover:text-green-700 font-medium transition-colors"
                  >
                    Clear search
                  </button>
                </div>
              )}
            </Card>

            {/* Projects Display */}
            {filterBy === 'archived' ? (
              /* ARCHIVED PROJECTS VIEW */
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-gray-900 mb-4">
                  Archived Projects ({filteredProjects.length})
                </h2>
                {filteredProjects.length === 0 ? (
                  <Card className="text-center py-12 px-4">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                      <Archive className="w-8 h-8 text-gray-400" />
                    </div>
                    {searchQuery ? (
                      <>
                        <p className="text-gray-600 mb-2">No archived projects match your search</p>
                        <button
                          onClick={() => setSearchQuery('')}
                          className="text-green-600 hover:text-green-700 font-medium"
                        >
                          Clear search
                        </button>
                      </>
                    ) : (
                      <>
                        <p className="text-gray-600 mb-2">No archived projects</p>
                        <p className="text-sm text-gray-500">Archived projects will appear here</p>
                      </>
                    )}
                  </Card>
                ) : (
                  <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 opacity-75">
                    {filteredProjects.map((project) => (
                      <div key={project.id} className="relative group">
                        <ProjectCard
                          project={project}
                          onNavigate={handleNavigateToProject}
                          getStatusColor={getStatusColor}
                          getStatusLabel={getStatusLabel}
                        />
                        
                        {/* Restore Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleArchiveProject(project.id, project.project_name, true);
                          }}
                          disabled={archivingProjectId === project.id}
                          className="absolute top-4 right-4 p-2 bg-white rounded-lg shadow-md opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-green-50 hover:text-green-600 disabled:opacity-50 z-10"
                          title="Restore project"
                        >
                          {archivingProjectId === project.id ? (
                            <div className="w-5 h-5 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <ArchiveRestore className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              /* ORIGINAL ACTIVE/COMPLETED LAYOUT - EXACT COPY */
              <>
                {(() => {
                  const activeProjects = filteredProjects.filter(p => {
                    const isComplete = p.total_stages > 0 && p.completed_stages === p.total_stages;
                    return !isComplete;
                  }).sort((a, b) => {
                    // First: Sort by notification status (needs attention first)
                    if (a.has_unread_actions && !b.has_unread_actions) return -1;
                    if (!a.has_unread_actions && b.has_unread_actions) return 1;

                    // Then: Keep existing order (already sorted by created_at DESC from query)
                    return 0;
                  });

                  const completedProjects = filteredProjects.filter(p => {
                    const isComplete = p.total_stages > 0 && p.completed_stages === p.total_stages;
                    return isComplete;
                  });

                  return (
                    <>
                      {/* Active Projects Section - Hide when viewing Completed filter */}
                      {filterBy !== 'completed' && (
                        <div>
                          <h2 className="text-2xl font-bold tracking-tight text-gray-900 mb-4">
                            Active Projects ({activeProjects.length})
                          </h2>
                        {activeProjects.length === 0 ? (
                          <Card className="text-center py-12 px-4">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            </div>
                            {searchQuery ? (
                              <>
                                <p className="text-gray-600 mb-2">No active projects match your search</p>
                                <button
                                  onClick={() => setSearchQuery('')}
                                  className="text-green-600 hover:text-green-700 font-medium"
                                >
                                  Clear search
                                </button>
                              </>
                            ) : (
                              <>
                                <p className="text-gray-600 mb-2">All caught up!</p>
                                <p className="text-sm text-gray-500">Your active projects will appear here</p>
                              </>
                            )}
                          </Card>
                        ) : (
                          <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                            {activeProjects.map((project) => (
                              <div key={project.id} className="relative group">
                                <ProjectCard
                                  project={project}
                                  onNavigate={handleNavigateToProject}
                                  getStatusColor={getStatusColor}
                                  getStatusLabel={getStatusLabel}
                                />
                                
                                {/* Archive Button */}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleArchiveProject(project.id, project.project_name, false);
                                  }}
                                  disabled={archivingProjectId === project.id}
                                  className="absolute top-4 right-4 p-2 bg-white rounded-lg shadow-md opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50 z-10"
                                  title="Archive project"
                                >
                                  {archivingProjectId === project.id ? (
                                    <div className="w-5 h-5 border-2 border-gray-600 border-t-transparent rounded-full animate-spin" />
                                  ) : (
                                    <Archive className="w-5 h-5" />
                                  )}
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      )}

                      {/* Completed Projects Section */}
                      {completedProjects.length > 0 && (
                        <div className={filterBy === 'completed' ? '' : 'mt-12'}>
                          <h2 className="text-2xl font-bold tracking-tight text-gray-900 mb-4">
                            Completed Projects ({completedProjects.length})
                          </h2>
                          <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 opacity-90">
                            {completedProjects.map((project) => (
                              <div key={project.id} className="relative group">
                                <ProjectCard
                                  project={project}
                                  onNavigate={handleNavigateToProject}
                                  getStatusColor={getStatusColor}
                                  getStatusLabel={getStatusLabel}
                                />
                                
                                {/* Archive Button */}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleArchiveProject(project.id, project.project_name, false);
                                  }}
                                  disabled={archivingProjectId === project.id}
                                  className="absolute top-4 right-4 p-2 bg-white rounded-lg shadow-md opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50 z-10"
                                  title="Archive project"
                                >
                                  {archivingProjectId === project.id ? (
                                    <div className="w-5 h-5 border-2 border-gray-600 border-t-transparent rounded-full animate-spin" />
                                  ) : (
                                    <Archive className="w-5 h-5" />
                                  )}
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  );
                })()}
              </>
            )}
          </>
        )}
      </main>
      
      {/* Trial Expired Modal */}
      <TrialExpiredModal 
        isOpen={showTrialModal}
        onClose={() => setShowTrialModal(false)}
      />
      
      {/* Payment Setup Modal */}
      <PaymentSetupModal
        isOpen={showPaymentSetupModal}
        onClose={() => setShowPaymentSetupModal(false)}
        onConnectStripe={handleConnectStripe}
        onSetupManual={handleSetupManual}
      />

      {/* Manual Payment Setup */}
      <ManualPaymentSetup
        isOpen={showManualPaymentSetup}
        onClose={() => setShowManualPaymentSetup(false)}
        userId={userId!}
        onSaved={handleManualPaymentSaved}
      />
    </div>
  );
}
