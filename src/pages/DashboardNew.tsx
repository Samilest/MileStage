// Enhanced Dashboard v4 - QUICK FIX - Removed stage_notes.note column
import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
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
import { RefreshCw, Search, Trash2, X } from 'lucide-react';

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
  created_at?: string;
}

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
  
  // New state for search/sort/delete
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [deletingProjectId, setDeletingProjectId] = useState<string | null>(null);
  
  const fetchingRef = useRef(false);
  const userId = user?.id;

  const fetchProjects = useCallback(async (isRefresh = false) => {
    if (!userId) return;

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
              created_at,
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
                  created_at,
                  viewed_by_freelancer_at
                )
              )
            `)
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

          if (error) throw error;
          return data;
        },
        3,
        1000
      );

      const enrichedProjects = (projectsData || []).map((project: any) => {
        const stages = project.stages || [];
        const totalStages = stages.length;
        const completedStages = stages.filter((stage: any) => 
          stage.status === 'completed' && 
          stage.payment_status === 'paid'
        ).length;

        const hasUnreadActions = stages.some((stage: any) => {
          const hasUnreadRevision = stage.revisions?.some((rev: any) => !rev.viewed_by_freelancer_at);
          const hasUnreadPayment = stage.stage_payments?.some((payment: any) => 
            payment.status === 'pending_verification' && !payment.viewed_by_freelancer_at
          );
          const hasUnreadNote = stage.stage_notes?.some((note: any) => 
            note.author_type === 'client' && !note.viewed_by_freelancer_at
          );
          const hasUnreadApproval = stage.status === 'approved' && !stage.viewed_by_freelancer_at;

          return hasUnreadRevision || hasUnreadPayment || hasUnreadNote || hasUnreadApproval;
        });

        const primaryNotification = getPrimaryNotification(stages);

        const amountEarned = stages
          .filter((stage: any) => stage.payment_status === 'paid')
          .reduce((sum: number, stage: any) => sum + stage.amount, 0);

        return {
          id: project.id,
          project_name: project.project_name,
          client_name: project.client_name,
          total_amount: project.total_amount,
          status: project.status,
          completed_stages: completedStages,
          total_stages: totalStages,
          amount_earned: amountEarned,
          has_unread_actions: hasUnreadActions,
          primary_notification: primaryNotification,
          currency: project.currency || 'USD',
          share_code: project.share_code,
          created_at: project.created_at,
        };
      });

      setProjects(enrichedProjects);
    } catch (error) {
      console.error('[Dashboard] Error fetching projects:', error);
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
      setRefreshing(false);
      fetchingRef.current = false;
    }
  }, [userId]);

  const handleDeleteProject = async (projectId: string, projectName: string) => {
    if (!confirm(`Are you sure you want to delete "${projectName}"?\n\nThis will permanently delete:\n• All project stages\n• All payments and revisions\n• All notes and files\n\nThis action cannot be undone.`)) {
      return;
    }

    setDeletingProjectId(projectId);
    
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId)
        .eq('user_id', userId);

      if (error) throw error;

      setProjects(prev => prev.filter(p => p.id !== projectId));
      toast.success('Project deleted successfully');
    } catch (error) {
      console.error('[Dashboard] Error deleting project:', error);
      toast.error('Failed to delete project');
    } finally {
      setDeletingProjectId(null);
    }
  };

  // Apply search and sort to all projects
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
          return 0;
      }
    });

    return filtered;
  }, [projects, searchQuery, sortBy]);

  const handleRefresh = () => {
    fetchProjects(true);
  };

  const handleNavigateToProject = (shareCode: string) => {
    if (!shareCode) {
      toast.error('Project link not available');
      return;
    }
    navigate(`/projects/${shareCode}/detail`);
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

  useEffect(() => {
    if (userId) {
      fetchProjects();
      checkStripeStatus();
      checkWelcomeModal();
    }
  }, [userId, fetchProjects, checkStripeStatus, checkWelcomeModal]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
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
      
      {showWelcomeModal && (
        <WelcomeModal 
          userId={userId!} 
          onClose={() => setShowWelcomeModal(false)} 
        />
      )}
      
      <div className="fixed bottom-4 sm:bottom-6 right-4 sm:right-6 z-50">
        <RealtimeStatus />
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <StripeConnect userId={userId!} />
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
            {/* Search and Sort Bar */}
            <Card className="p-4 sm:p-6">
              <div className="flex flex-col md:flex-row gap-4">
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

                {/* Sort Dropdown */}
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

              {/* Search Results Counter */}
              {searchQuery && (
                <div className="mt-4 flex items-center gap-2 text-sm text-gray-600">
                  <span>Showing {filteredProjects.length} of {projects.length} projects</span>
                  <button
                    onClick={() => setSearchQuery('')}
                    className="text-green-600 hover:text-green-700 font-medium transition-colors"
                  >
                    Clear search
                  </button>
                </div>
              )}
            </Card>

            {/* Active and Completed Projects Sections */}
            {(() => {
              const activeProjects = filteredProjects.filter(p => {
                const isComplete = p.total_stages > 0 && p.completed_stages === p.total_stages;
                return !isComplete;
              }).sort((a, b) => {
                if (a.has_unread_actions && !b.has_unread_actions) return -1;
                if (!a.has_unread_actions && b.has_unread_actions) return 1;
                return 0;
              });

              const completedProjects = filteredProjects.filter(p => {
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
                            
                            {/* Delete Button */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteProject(project.id, project.project_name);
                              }}
                              disabled={deletingProjectId === project.id}
                              className="absolute top-4 right-4 p-2 bg-white rounded-lg shadow-md opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-red-50 hover:text-red-600 disabled:opacity-50 z-10"
                              title="Delete project"
                            >
                              {deletingProjectId === project.id ? (
                                <div className="w-5 h-5 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <Trash2 className="w-5 h-5" />
                              )}
                            </button>
                          </div>
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
                          <div key={project.id} className="relative group">
                            <ProjectCard
                              project={project}
                              onNavigate={handleNavigateToProject}
                              getStatusColor={getStatusColor}
                              getStatusLabel={getStatusLabel}
                            />
                            
                            {/* Delete Button */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteProject(project.id, project.project_name);
                              }}
                              disabled={deletingProjectId === project.id}
                              className="absolute top-4 right-4 p-2 bg-white rounded-lg shadow-md opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-red-50 hover:text-red-600 disabled:opacity-50 z-10"
                              title="Delete project"
                            >
                              {deletingProjectId === project.id ? (
                                <div className="w-5 h-5 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <Trash2 className="w-5 h-5" />
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
      </main>
    </div>
  );
}
