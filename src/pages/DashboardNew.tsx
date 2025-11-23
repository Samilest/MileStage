// NUCLEAR FIX: Create this as a NEW file to force Vercel rebuild
// This is Dashboard.tsx renamed to DashboardNew.tsx

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
  share_code: string; // CRITICAL: Must be here!
}

export default function DashboardNew() {
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
                revisions_used,
                revisions_included,
                deliverables (id),
                revisions (id, status)
              )
            `)
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

          if (error) throw error;
          return data || [];
        },
        3,
        1000
      );

      const enriched = projectsData.map((proj: any) => {
        const stages = proj.stages || [];
        const completed = stages.filter((s: any) => s.status === 'completed').length;
        const earned = stages
          .filter((s: any) => s.payment_status === 'received')
          .reduce((sum: number, s: any) => sum + (s.amount || 0), 0);

        const hasUnreadActions = stages.some((s: any) => {
          const hasNewRevisions = (s.revisions || []).some((r: any) => r.status === 'pending');
          const needsDeliverables = s.status === 'active' && (s.deliverables || []).length === 0;
          return hasNewRevisions || needsDeliverables;
        });

        const primaryNotification = getPrimaryNotification(stages);

        return {
          id: proj.id,
          project_name: proj.project_name,
          client_name: proj.client_name,
          total_amount: proj.total_amount,
          status: proj.status,
          completed_stages: completed,
          total_stages: stages.length,
          amount_earned: earned,
          has_unread_actions: hasUnreadActions,
          primary_notification: primaryNotification,
          currency: proj.currency || 'USD',
          share_code: proj.share_code, // CRITICAL: Pass through share_code!
        };
      });

      setProjects(enriched);
      console.log('[Dashboard] Loaded', enriched.length, 'projects');
      console.log('[Dashboard] First project share_code:', enriched[0]?.share_code); // DEBUG LOG

    } catch (error: any) {
      console.error('[Dashboard] Failed to fetch projects:', error);
      toast.error('Failed to load projects. Please refresh.');
    } finally {
      setLoading(false);
      setRefreshing(false);
      fetchingRef.current = false;
    }
  }, [userId]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleNavigateToProject = useCallback((shareCode: string) => {
    console.log('[Dashboard] Navigating to project with share code:', shareCode);
    if (!shareCode || shareCode === 'undefined') {
      console.error('[Dashboard] ERROR: share_code is undefined!');
      toast.error('Cannot open project - invalid share code');
      return;
    }
    navigate(`/project/${shareCode}`);
  }, [navigate]);

  const getStatusColor = (status: string, completedStages: number, totalStages: number, hasUnreadActions: boolean) => {
    if (completedStages === totalStages && totalStages > 0) {
      return 'bg-green-100 text-green-800 border-green-200';
    }
    if (hasUnreadActions) {
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
    return 'bg-blue-100 text-blue-800 border-blue-200';
  };

  const getStatusLabel = (status: string, completedStages: number, totalStages: number, hasUnreadActions: boolean) => {
    if (completedStages === totalStages && totalStages > 0) {
      return 'Complete';
    }
    if (hasUnreadActions) {
      return 'Action Needed';
    }
    if (completedStages > 0) {
      return 'In Progress';
    }
    return 'Active';
  };

  const activeProjects = projects.filter((p) => p.completed_stages < p.total_stages);
  const completedProjects = projects.filter((p) => p.completed_stages === p.total_stages && p.total_stages > 0);

  return (
    <div className="min-h-screen bg-secondary-bg">
      <Navigation />
      
      <div className="fixed bottom-6 right-6 z-50">
        <RealtimeStatus />
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Your Projects</h1>
            <p className="text-gray-600 mt-1">
              {activeProjects.length} active • {completedProjects.length} completed
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => fetchProjects(true)}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <Button onClick={() => navigate('/templates')}>
              + New Project
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-500 border-t-transparent"></div>
          </div>
        ) : projects.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <p className="text-gray-600 mb-4">No projects yet</p>
              <Button onClick={() => navigate('/templates')}>Create Your First Project</Button>
            </div>
          </Card>
        ) : (
          <>
            {activeProjects.length > 0 && (
              <div className="mb-8">
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
              </div>
            )}

            {completedProjects.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
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
        )}
      </main>
    </div>
  );
}
