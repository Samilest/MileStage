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
import { retryOperation } from '../lib/errorHandling';
import { getPrimaryNotification } from '../lib/notificationMessages';
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
}

export default function Dashboard() {
  const navigate = useNavigate();
  const user = useStore((state) => state.user);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stripeConnected, setStripeConnected] = useState(false);
  const [connectingStripe, setConnectingStripe] = useState(false);
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
        const completedStages = stages.filter((s: any) => s.status === 'complete' || s.status === 'completed').length;
        const amountEarned = stages
          .filter((s: any) => s.status === 'complete' || s.status === 'completed')
          .reduce((sum: number, s: any) => sum + (s.amount || 0), 0);

        // Find the first stage with unread actions and get its primary notification
        let primaryNotification = '';
        let hasUnreadActions = false;

        for (const stage of stages) {
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
              console.log(`[Dashboard] Stage ${stage.stage_number} has ${unreadMessageCount} unread messages`);
              primaryNotification = getPrimaryNotification(
                {
                  hasUnviewedPayment: hasUnreadPayment,
                  hasUnviewedRevision: hasUnreadRevision,
                  hasUnviewedApproval: hasUnreadApproval,
                  unreadMessageCount: unreadMessageCount
                },
                `Stage ${stage.stage_number}`
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

  const handleNavigateToProject = useCallback((id: string) => {
    navigate(`/project/${id}`);
  }, [navigate]);

  const getStatusColor = useCallback((status: string, completedStages: number, totalStages: number, hasUnreadActions: boolean) => {
    const isFullyComplete = totalStages > 0 && completedStages === totalStages;

    // Completed projects always show green, ignore unread actions
    if (isFullyComplete) {
      return 'bg-green-100 text-green-700 border-green-200';
    }

    switch (status) {
      case 'active':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'paused':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'complete':
      case 'completed':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'archived':
        return 'bg-gray-100 text-gray-700 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  }, []);

  const getStatusLabel = useCallback((status: string, completedStages: number, totalStages: number, hasUnreadActions: boolean) => {
    const isFullyComplete = totalStages > 0 && completedStages === totalStages;

    // Completed projects always show Complete, ignore unread actions
    if (isFullyComplete) {
      return 'Complete';
    }

    switch (status) {
      case 'active':
        return 'Active';
      case 'paused':
        return 'Paused';
      case 'complete':
      case 'completed':
        return 'Complete';
      case 'archived':
        return 'Archived';
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  }, []);

  // Check Stripe connection status
  useEffect(() => {
    const checkStripeStatus = async () => {
      if (!userId) return;

      const { data } = await supabase
        .from('user_profiles')
        .select('stripe_account_id, stripe_charges_enabled')
        .eq('id', userId)
        .single();

      if (data?.stripe_account_id && data?.stripe_charges_enabled) {
        setStripeConnected(true);
      }
    };

    checkStripeStatus();
  }, [userId]);

  // Handle Stripe connection redirect
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('stripe') === 'success') {
      setStripeConnected(true);
      toast.success('Stripe connected successfully!');
      window.history.replaceState({}, '', '/dashboard');
    }
    if (urlParams.get('stripe') === 'refresh') {
      toast.error('Please complete Stripe setup');
      window.history.replaceState({}, '', '/dashboard');
    }
  }, []);

  // Load projects once on mount
  useEffect(() => {
    let isMounted = true;

    if (userId && isMounted) {
      fetchProjects();
    }

    return () => {
      isMounted = false;
    };
  }, [userId, fetchProjects]);

  const handleConnectStripe = async () => {
    setConnectingStripe(true);
    console.log('=== STRIPE CONNECT DEBUG START ===');

    try {
      console.log('[Dashboard] Step 1: Getting auth session...');
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        console.error('[Dashboard] Auth error:', error);
        throw new Error('Authentication error: ' + error.message);
      }

      if (!data.session) {
        console.error('[Dashboard] No session found');
        throw new Error('Not authenticated - please log in again');
      }

      console.log('[Dashboard] Step 2: Session obtained successfully');
      console.log('[Dashboard] User ID:', data.session.user.id);

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-connect-onboarding`;
      console.log('[Dashboard] Step 3: Calling API endpoint:', apiUrl);
      console.log('[Dashboard] Request headers:', {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer [REDACTED]'
      });

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${data.session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('[Dashboard] Step 4: Got response - Status:', response.status, response.statusText);
      console.log('[Dashboard] Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[Dashboard] Response not OK. Status:', response.status);
        console.error('[Dashboard] Error text:', errorText);
        throw new Error(`API error (${response.status}): ${errorText}`);
      }

      const result = await response.json();
      console.log('[Dashboard] Step 5: Parsed response:', result);

      if (result.error) {
        console.error('[Dashboard] API returned error:', result.error);
        throw new Error(result.error);
      }

      if (!result.url) {
        console.error('[Dashboard] No URL in response:', result);
        throw new Error('No onboarding URL received from server');
      }

      console.log('[Dashboard] Step 6: Redirecting to Stripe onboarding...');
      console.log('[Dashboard] Target URL:', result.url);
      console.log('=== STRIPE CONNECT DEBUG END - REDIRECTING ===');

      // Do a full page redirect to Stripe onboarding (not iframe or popup)
      window.location.href = result.url;
      // Note: Code after this won't execute because we're redirecting

    } catch (error: any) {
      console.error('=== STRIPE CONNECT ERROR ===');
      console.error('[Dashboard] Error type:', error.constructor.name);
      console.error('[Dashboard] Error message:', error.message);
      console.error('[Dashboard] Error stack:', error.stack);
      console.error('=== STRIPE CONNECT DEBUG END ===');

      let userMessage = 'Failed to connect Stripe';
      if (error.message.includes('STRIPE_SECRET_KEY')) {
        userMessage = 'Stripe is not configured on the server. Please contact support.';
      } else if (error.message.includes('Not authenticated')) {
        userMessage = 'Please log in again to connect Stripe.';
      } else if (error.message.includes('network') || error.message.includes('fetch')) {
        userMessage = 'Network error. Please check your connection and try again.';
      } else {
        userMessage = `Failed to connect Stripe: ${error.message}`;
      }

      toast.error(userMessage);
      setConnectingStripe(false);
    }
  };

  return (
    <div className="min-h-screen bg-secondary-bg">
      <Navigation />
      {/* Fixed bottom-right container */}
      <div className="fixed bottom-4 sm:bottom-6 right-4 sm:right-6 z-50">
        <RealtimeStatus />
      </div>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 space-y-6 sm:space-y-8 page-enter">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6 animate-fade-in">
          <div>
            <h1 className="text-4xl lg:text-5xl font-black tracking-tight text-gray-900">My Projects</h1>
            <p className="mt-1 sm:mt-2 text-sm sm:text-base text-gray-600">Welcome back, {user?.name}!</p>
          </div>
          <div className="flex gap-3 w-full sm:w-auto">
            <Button
              onClick={handleRefresh}
              variant="secondary"
              disabled={refreshing || loading}
              className="flex items-center justify-center gap-2 min-h-[44px] flex-1 sm:flex-initial"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
            <Button
              onClick={() => navigate('/templates')}
              variant="primary"
              className="flex-1 sm:flex-initial min-h-[44px] whitespace-nowrap"
            >
              <span className="hidden sm:inline">Create Project</span>
              <span className="sm:hidden">Create</span>
            </Button>
          </div>
        </div>

        {!stripeConnected && (
          <Card className="bg-blue-50 border-2 border-blue-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-start gap-3">
                <CreditCard className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-lg font-semibold text-blue-900 mb-1">Connect Stripe to Accept Payments</h3>
                  <p className="text-sm text-blue-700">
                    Set up your Stripe account to receive payments from clients. It takes less than 2 minutes.
                  </p>
                </div>
              </div>
              <Button
                onClick={handleConnectStripe}
                disabled={connectingStripe}
                className="w-full sm:w-auto min-h-[44px] whitespace-nowrap flex items-center gap-2"
              >
                {connectingStripe ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4" />
                    Connect Stripe
                  </>
                )}
              </Button>
            </div>
          </Card>
        )}

        {stripeConnected && (
          <Card className="bg-green-50 border-2 border-green-200">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-semibold text-green-900">Stripe Connected</h3>
                <p className="text-sm text-green-700">
                  Your clients can now pay you directly through Stripe.
                </p>
              </div>
            </div>
          </Card>
        )}

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
              <Button
                onClick={() => navigate('/templates')}
                className="w-full sm:w-auto px-8 py-4 text-base sm:text-lg min-h-[44px]"
              >
                Create Your First Project
              </Button>

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
