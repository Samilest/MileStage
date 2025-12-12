// Force rebuild v3 - ensure share_code is included in query
import { useEffect, useState, useCallback, useRef } from 'react';
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
import { retryOperation } from '../lib/errorHandling';
import { getPrimaryNotification } from '../lib/notificationMessages';
import { formatCurrency, type CurrencyCode } from '../lib/currency';
import { RefreshCw, CreditCard, CheckCircle2 } from 'lucide-react';

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
}

export default function Dashboard() {
  const navigate = useNavigate();
  const user = useStore((state) => state.user);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stripeConnected, setStripeConnected] = useState(false);
  const [connectingStripe, setConnectingStripe] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const fetchingRef = useRef(false);
  const userId = user?.id;

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

        // Find the first stage with unread actions and get its primary notification
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
        };
      }) || [];

      console.log('[Dashboard] Loaded', projectsWithStats.length, 'projects');
      setProjects(projectsWithStats);

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

  const handleRefresh = useCallback(() => {
    fetchProjects(true);
  }, [fetchProjects]);

  useEffect(() => {
    console.log('[Dashboard] Component mounted, fetching projects');
    fetchProjects();
    
    // Also fetch when component becomes visible again (user navigates back)
    return () => {
      console.log('[Dashboard] Component unmounting');
    };
  }, [fetchProjects]);

  // Refetch data when user comes back to this tab/window
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('[Dashboard] Tab became visible, refreshing data...');
        fetchProjects(true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [fetchProjects]);

  useEffect(() => {
    if (!userId) return;

    console.log('[Dashboard] Setting up realtime subscription');

    const channel = supabase
      .channel('dashboard-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'projects',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          console.log('[Dashboard] Project change detected, refreshing...');
          fetchProjects(true);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'stages',
        },
        () => {
          console.log('[Dashboard] Stage change detected, refreshing...');
          fetchProjects(true);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'stage_notes',
        },
        () => {
          console.log('[Dashboard] New note detected, refreshing...');
          fetchProjects(true);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'stage_payments',
        },
        () => {
          console.log('[Dashboard] Payment change detected, refreshing...');
          fetchProjects(true);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'revisions',
        },
        () => {
          console.log('[Dashboard] Revision change detected, refreshing...');
          fetchProjects(true);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'stage_notes',
        },
        () => {
          console.log('[Dashboard] Message viewed, refreshing...');
          fetchProjects(true);
        }
      )
      .subscribe((status) => {
        console.log('[Dashboard] Realtime subscription status:', status);
      });

    return () => {
      console.log('[Dashboard] Cleaning up realtime subscription');
      supabase.removeChannel(channel);
    };
  }, [userId, fetchProjects]);

  useEffect(() => {
    const checkStripeConnection = async () => {
      if (!userId) return;

      try {
        const { data } = await supabase
          .from('user_profiles')
          .select('stripe_account_id')
          .eq('user_id', userId)
          .single();

        setStripeConnected(!!data?.stripe_account_id);
      } catch (error) {
        console.error('[Dashboard] Error checking Stripe connection:', error);
      }
    };

    checkStripeConnection();
  }, [userId]);

  // Check if user should see welcome modal
  useEffect(() => {
    const checkWelcomeModal = async () => {
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
        console.error('Error checking welcome modal status:', error);
      }
    };

    checkWelcomeModal();
  }, [userId]);

  const handleConnectStripe = async () => {
    setConnectingStripe(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-stripe-connect-account', {
        body: { userId },
      });

      if (error) throw error;

      if (data?.url) {
        window.location.href = data.url;
      } else {
        toast.error('Could not generate Stripe connection link');
      }
    } catch (error: any) {
      console.error('[Dashboard] Stripe connection error:', error);
      toast.error('Could not connect to Stripe. Please try again.');
    } finally {
      setConnectingStripe(false);
    }
  };

  const handleNavigateToProject = useCallback((projectId: string) => {
    console.log('[Dashboard] Navigating to project overview:', projectId);
    navigate(`/projects/${projectId}/overview`);
  }, [navigate]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
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
                onClick={() => navigate('/templates')}
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
                  onClick={() => navigate('/templates')}
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
            {(() => {
              const activeProjects = projects.filter(p => {
                const isComplete = p.total_stages > 0 && p.completed_stages === p.total_stages;
                return !isComplete;
              }).sort((a, b) => {
                // First: Sort by notification status (needs attention first)
                if (a.has_unread_actions && !b.has_unread_actions) return -1;
                if (!a.has_unread_actions && b.has_unread_actions) return 1;

                // Then: Keep existing order (already sorted by created_at DESC from query)
                return 0;
              });

              const completedProjects = projects.filter(p => {
                const isComplete = p.total_stages > 0 && p.completed_stages === p.total_stages;
                return isComplete;
              });

              return (
                <>
                  {/* Active Projects Section */}
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
                        <p className="text-gray-600 mb-2">All caught up!</p>
                        <p className="text-sm text-gray-500">Your active projects will appear here</p>
                      </Card>
                    ) : (
                      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                        {activeProjects.map((project) => (
                          <ProjectCard
                            key={project.id}
                            project={project}
                            onNavigate={handleNavigateToProject}
                            getStatusColor={getStatusColor}
                            getStatusLabel={getStatusLabel}
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Completed Projects Section */}
                  {completedProjects.length > 0 && (
                    <div className="mt-12">
                      <h2 className="text-2xl font-bold tracking-tight text-gray-900 mb-4">
                        Completed Projects ({completedProjects.length})
                      </h2>
                      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 opacity-90">
                        {completedProjects.map((project) => (
                          <ProjectCard
                            key={project.id}
                            project={project}
                            onNavigate={handleNavigateToProject}
                            getStatusColor={getStatusColor}
                            getStatusLabel={getStatusLabel}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </>
              );
            })()}
          </>
        )}
      </main>
    </div>
  );
}
