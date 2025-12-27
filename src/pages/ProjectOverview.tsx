console.log('[ProjectOverview v9] Loaded - payment_status=received fix active');
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import { useStore } from '../store/useStore';
import Navigation from '../components/Navigation';
import Card from '../components/Card';
import Button from '../components/Button';
import { ErrorFallback } from '../components/ErrorFallback';
import { retryOperation } from '../lib/errorHandling';
import { getStageNotificationMessage } from '../lib/notificationMessages';
import { formatCurrency, type CurrencyCode } from '../lib/currency';
import { ArrowLeft, Copy, Check, ExternalLink, DollarSign, Clock, CheckCircle2 } from 'lucide-react';

interface ProjectData {
  id: string;
  project_name: string;
  client_name: string;
  client_email: string;
  total_amount: number;
  status: string;
  share_code: string;
  created_at: string;
  currency: CurrencyCode;
  stages: Array<{
    id: string;
    stage_number: number;
    name: string;
    amount: number;
    status: string;
    payment_status: string;
    revisions_included: number;
    revisions_used: number;
    approved_at: string | null;
    viewed_by_freelancer_at: string | null;
    revisions: Array<{
      id: string;
      requested_at: string | null;
      viewed_by_freelancer_at: string | null;
    }>;
    stage_payments: Array<{
      id: string;
      status: string;
      marked_paid_at: string | null;
      viewed_by_freelancer_at: string | null;
    }>;
    stage_notes: Array<{
      id: string;
      author_type: string;
      viewed_by_freelancer_at: string | null;
    }>;
  }>;
}

export default function ProjectOverview() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = useStore((state) => state.user);
  const [project, setProject] = useState<ProjectData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [pendingExtensions, setPendingExtensions] = useState<Array<{
    id: string;
    stage_id: string;
    amount: number;
    reference_code: string;
  }>>([]);

  useEffect(() => {
    if (!user?.id || !id) return;
    fetchProject();
  }, [user, id]);

  const fetchProject = async () => {
    try {
      setLoading(true);
      setError('');
      console.log('[ProjectOverview] Fetching project:', id);

      const data = await retryOperation(
        async () => {
          const { data, error: fetchError } = await supabase
            .from('projects')
            .select(`
              id,
              project_name,
              client_name,
              client_email,
              total_amount,
              status,
              share_code,
              created_at,
              currency,
              stages (
                id,
                stage_number,
                name,
                amount,
                status,
                payment_status,
                revisions_included,
                revisions_used,
                approved_at,
                viewed_by_freelancer_at,
                revisions!revisions_stage_id_fkey (
                  id,
                  requested_at,
                  viewed_by_freelancer_at
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
                  viewed_by_freelancer_at
                )
              )
            `)
            .eq('id', id)
            .eq('user_id', user?.id)
            .maybeSingle();

          if (fetchError) {
            console.error('[ProjectOverview] Fetch error:', fetchError);

            if (fetchError.code === '42501') {
              setError('permission');
              throw new Error('Permission denied');
            }

            throw fetchError;
          }

          if (!data) {
            setError('notfound');
            throw new Error('Project not found');
          }

          return data;
        },
        3,
        'fetch project'
      );

      if (data?.stages) {
        data.stages.sort((a: any, b: any) => a.stage_number - b.stage_number);
        
        // Load pending extensions for all stages
        const stageIds = data.stages.map((s: any) => s.id);
        if (stageIds.length > 0) {
          const { data: extensions } = await supabase
            .from('extensions')
            .select('id, stage_id, amount, reference_code')
            .in('stage_id', stageIds)
            .eq('status', 'marked_paid');
          
          setPendingExtensions(extensions || []);
        }
      }

      console.log('[ProjectOverview] Project loaded:', data?.project_name);
      setProject(data as ProjectData);
    } catch (err: any) {
      console.error('[ProjectOverview] Error:', err);

      if (err.message?.includes('fetch') || err.message?.includes('network')) {
        setError('network');
        toast.error('Connection lost. Trying again...');
      } else if (!error) {
        setError('general');
      }
    } finally {
      setLoading(false);
    }
  };

  const copyPortalLink = useCallback(async () => {
    if (!project) return;
    try {
      const portalUrl = `${window.location.origin}/portal/${project.share_code}`;
      await navigator.clipboard.writeText(portalUrl);
      setCopied(true);
      toast.success('Link copied!');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      toast.error('Could not copy link');
    }
  }, [project]);

  const openPortal = useCallback(() => {
    if (!project) return;
    window.open(`/portal/${project.share_code}`, '_blank');
  }, [project]);

  const getProjectStatusColor = (status: string, completedStages: number, totalStages: number) => {
    const isFullyComplete = totalStages > 0 && completedStages === totalStages;

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
  };

  const getProjectStatusLabel = (status: string, completedStages: number, totalStages: number) => {
    const isFullyComplete = totalStages > 0 && completedStages === totalStages;

    if (isFullyComplete) {
      return '✅ Complete';
    }

    switch (status) {
      case 'active':
        return '🟡 Active';
      case 'paused':
        return '⏸️ Paused';
      case 'complete':
      case 'completed':
        return '✅ Complete';
      case 'archived':
        return '📦 Archived';
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  const hasUnreadActions = useCallback((stage: ProjectData['stages'][0]) => {
    // Check for unread revision requests
    const hasUnreadRevision = stage.revisions?.some((rev) =>
      rev.requested_at && !rev.viewed_by_freelancer_at
    ) || false;

    // Check for marked payments not yet viewed
    const hasUnreadPayment = stage.stage_payments?.some((payment) =>
      payment.status === 'marked_paid' &&
      payment.marked_paid_at &&
      !payment.viewed_by_freelancer_at
    ) || false;

    // Check if stage was approved but not yet viewed
    const hasUnreadApproval = stage.approved_at && !stage.viewed_by_freelancer_at;

    // Check for unread messages from client
    const hasUnreadMessages = stage.stage_notes?.some((note) =>
      note.author_type === 'client' && !note.viewed_by_freelancer_at
    ) || false;

    return hasUnreadRevision || hasUnreadPayment || hasUnreadApproval || hasUnreadMessages;
  }, []);

  const getUnreadMessageCount = useCallback((stage: ProjectData['stages'][0]) => {
    return stage.stage_notes?.filter((note) =>
      note.author_type === 'client' && !note.viewed_by_freelancer_at
    ).length || 0;
  }, []);

  const projectStats = useMemo(() => {
    if (!project) return null;

    const completedStages = project.stages.filter(s => s.payment_status === 'received').length;
    const totalStages = project.stages.length;
    const paidAmount = project.stages
      .filter(s => s.payment_status === 'received')
      .reduce((sum, s) => sum + s.amount, 0);
    const progressPercentage = totalStages > 0
      ? Math.round((completedStages / totalStages) * 100)
      : 0;

    return {
      completedStages,
      totalStages,
      paidAmount,
      progressPercentage
    };
  }, [project]);

  if (loading) {
    return (
      <div className="min-h-screen bg-secondary-bg">
        <Navigation />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="text-center py-12">
            <p className="text-base text-gray-600">Loading project...</p>
          </Card>
        </main>
      </div>
    );
  }

  if (error) {
    if (error === 'notfound') {
      return <ErrorFallback type="notfound" />;
    }
    if (error === 'permission') {
      return <ErrorFallback type="permission" />;
    }
    if (error === 'network') {
      return (
        <ErrorFallback
          type="general"
          message="Unable to connect. Please check your internet connection."
          onRetry={fetchProject}
        />
      );
    }
    return (
      <ErrorFallback
        type="general"
        message="Failed to load project"
        onRetry={fetchProject}
      />
    );
  }

  if (!project || !projectStats) {
    return <ErrorFallback type="notfound" />;
  }

  const { completedStages, totalStages, paidAmount, progressPercentage } = projectStats;

  return (
    <div className="min-h-screen bg-secondary-bg">
      <Navigation />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 space-y-6 sm:space-y-8">
        <button
          onClick={() => navigate('/dashboard')}
          className="inline-flex items-center text-gray-600 hover:text-green-600 transition-all duration-200 group min-h-[44px]"
        >
          <ArrowLeft className="w-4 h-4 mr-2 transition-transform duration-200 group-hover:-translate-x-1" />
          <span className="text-sm sm:text-base">Back to Dashboard</span>
        </button>

        <div>
          <div className="flex flex-wrap items-center gap-3 mb-2 sm:mb-4">
            <h1 className="text-4xl lg:text-5xl font-black tracking-tight text-gray-900">
              {project.project_name}
            </h1>
            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getProjectStatusColor(project.status, completedStages, totalStages)}`}>
              {getProjectStatusLabel(project.status, completedStages, totalStages)}
            </span>
          </div>
          <p className="text-sm sm:text-base text-gray-600">
            Client: {project.client_name} ({project.client_email})
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card className="border-l-4 border-green-500 shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-200 cursor-pointer">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Revenue Earned</p>
                <p className="text-5xl lg:text-6xl font-black text-gray-900 truncate">
                  {formatCurrency(paidAmount, project.currency || 'USD')}
                </p>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              of {formatCurrency(project.total_amount, project.currency || 'USD')} total
            </p>
          </Card>

          <Card className="shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-200 cursor-pointer">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Progress</p>
                <p className="text-3xl lg:text-4xl font-bold text-green-600">
                  {progressPercentage}%
                </p>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 mt-2">
              <div
                className="bg-green-500 h-3 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </Card>

          <Card className="shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-200 cursor-pointer sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Stages Complete</p>
                <p className="text-3xl lg:text-4xl font-bold text-gray-900">
                  <span className="font-bold">{completedStages}</span> / <span className="font-bold">{totalStages}</span>
                </p>
              </div>
            </div>
          </Card>
        </div>

        <Card className="shadow-md hover:shadow-lg transition-shadow duration-300">
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 mb-4 sm:mb-6">
            Client Portal Link
          </h2>
          <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
            Share this link with your Client so they can track Project progress and make payments.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 sm:px-4 py-3 font-mono text-xs sm:text-sm text-gray-900 overflow-x-auto break-all">
              {window.location.origin}/portal/{project.share_code}
            </div>
            <Button
              onClick={copyPortalLink}
              variant="secondary"
              className="flex items-center justify-center gap-2 min-h-[44px] whitespace-nowrap"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 transition-transform duration-300" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 transition-transform duration-300 hover:scale-110" />
                  Copy Link
                </>
              )}
            </Button>
            <Button
              onClick={openPortal}
              variant="secondary"
              className="flex items-center justify-center gap-2 min-h-[44px] whitespace-nowrap hidden sm:flex"
            >
              <ExternalLink className="w-4 h-4 transition-transform duration-300 hover:scale-110" />
              Open Portal
            </Button>
          </div>
        </Card>

        <Card>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 mb-4 sm:mb-6">
            Project Stages
          </h2>
          <div className="space-y-3 sm:space-y-4">
            {project.stages.map((stage, index) => {
              const needsAttention = hasUnreadActions(stage);

              // COMPLETED STAGE - Green collapsed bar
              if (stage.status === 'completed' || stage.status === 'complete') {
                return (
                  <div
                    key={stage.id}
                    className="bg-green-50 border-2 border-green-500 rounded-xl p-4 shadow-md hover:shadow-lg hover:border-green-600 transition-all duration-200 animate-fade-in"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="flex flex-col gap-4">
                      {/* Stage Info Section */}
                      <div className="flex items-center gap-3">
                        <div className="bg-green-100 rounded-full p-2 flex-shrink-0">
                          <CheckCircle2 className="w-5 h-5 text-green-600" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-base sm:text-lg font-medium text-green-900">
                              Stage {stage.stage_number}: {stage.name}
                            </h3>
                            <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded">
                              COMPLETED
                            </span>
                          </div>
                          <p className="text-xs sm:text-sm text-green-700 mt-1">
                            Amount: {formatCurrency(stage.amount, project.currency || 'USD')}{stage.stage_number !== 0 && ` • Revisions: ${stage.revisions_used || 0}/${stage.revisions_included || 2}`}
                          </p>
                        </div>
                      </div>

                      {/* Button Section */}
                      <div className="pt-3 border-t border-green-200">
                        <Button
                          onClick={() => navigate(`/projects/${id}/detail`)}
                          variant="secondary"
                          className="w-full justify-center sm:w-auto group"
                        >
                          <span className="inline-flex items-center gap-1">
                            Manage Details
                            <span className="group-hover:translate-x-1 transition-transform duration-200 inline-block">→</span>
                          </span>
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              }

              // ACTIVE/LOCKED STAGES - Regular white card
              const getBorderColor = () => {
                if (stage.payment_status === 'received') return 'border-green-500';
                if (stage.status === 'active' || stage.status === 'in_progress') return 'border-yellow-400';
                if (stage.status === 'locked') return 'border-gray-300';
                return 'border-gray-300';
              };

              const getStatusBadge = () => {
                if (stage.payment_status === 'received') {
                  return 'bg-green-100 text-green-700';
                }
                if (needsAttention) {
                  return 'bg-red-100 text-red-700';
                }
                if (stage.status === 'active' || stage.status === 'in_progress') {
                  return 'bg-yellow-100 text-yellow-700';
                }
                if (stage.status === 'payment_pending') {
                  return 'bg-yellow-100 text-yellow-700';
                }
                if (stage.status === 'locked') {
                  return 'bg-gray-100 text-gray-600';
                }
                if (stage.status === 'paused') {
                  return 'bg-orange-100 text-orange-700';
                }
                return 'bg-gray-100 text-gray-700';
              };

              const getStatusText = () => {
                if (stage.payment_status === 'received') return 'PAID';
                if (needsAttention) return 'NEEDS ATTENTION';
                if (stage.status === 'active' || stage.status === 'in_progress') return 'ACTIVE';
                if (stage.status === 'payment_pending') return 'PAYMENT PENDING';
                if (stage.status === 'locked') return 'LOCKED';
                if (stage.status === 'paused') return 'PAUSED';
                return stage.status.toUpperCase();
              };

              return (
                <div
                  key={stage.id}
                  className={`bg-white border-2 ${getBorderColor()} rounded-xl p-4 shadow-lg hover:shadow-xl hover:border-green-500 transition-all duration-200 animate-fade-in`}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex flex-col gap-4">
                    {/* Stage Info Section */}
                    <div>
                      <div className="flex items-center gap-2 sm:gap-3 mb-2 flex-wrap">
                        <h3 className="text-base sm:text-lg font-medium text-gray-900">
                          Stage {stage.stage_number}: {stage.name}
                        </h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge()}`}>
                          {getStatusText()}
                        </span>
                        {stage.status !== 'completed' && stage.status !== 'complete' && stage.payment_status !== 'received' && stage.status !== 'locked' && (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            Unpaid
                          </span>
                        )}
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600">
                        <span>Amount: {formatCurrency(stage.amount, project.currency || 'USD')}</span>
                        {stage.stage_number !== 0 && (
                          <span>Revisions: {stage.revisions_used || 0} / {stage.revisions_included || 2}</span>
                        )}
                      </div>

                      {/* Attention alert message */}
                      {needsAttention && (
                        <div className="mt-2 pt-2 border-t border-yellow-200">
                          <p className="text-sm text-gray-700">
                            {getStageNotificationMessage({
                              hasUnviewedPayment: stage.stage_payments?.some((p) => p.status === 'marked_paid' && !p.viewed_by_freelancer_at) || false,
                              hasUnviewedRevision: stage.revisions?.some((r) => r.requested_at && !r.viewed_by_freelancer_at) || false,
                              hasUnviewedApproval: (stage.approved_at && !stage.viewed_by_freelancer_at) || false,
                              unreadMessageCount: getUnreadMessageCount(stage)
                            })}
                          </p>
                        </div>
                      )}

                      {/* Extension Purchased notification */}
                      {pendingExtensions.some(ext => ext.stage_id === stage.id) && (
                        <div className="mt-2 pt-2 border-t border-purple-200">
                          <p className="text-sm text-purple-700 font-medium flex items-center gap-1">
                            💎 Extension Purchased - Verify payment in Manage Details
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Button Section */}
                    <div className="pt-3 border-t border-gray-200">
                      <Button
                        onClick={() => navigate(`/projects/${id}/detail`)}
                        variant="secondary"
                        className="w-full justify-center sm:w-auto group"
                      >
                        <span className="inline-flex items-center gap-1">
                          Manage Details
                          <span className="group-hover:translate-x-1 transition-transform duration-200 inline-block">→</span>
                        </span>
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </main>
    </div>
  );
}
