import { memo } from 'react';
import { formatCurrency, type CurrencyCode } from '../lib/currency';

interface ProjectCardProps {
  project: {
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
    client_last_viewed_at?: string | null;
  };
  onNavigate: (projectId: string) => void;
  getStatusColor: (status: string, completedStages: number, totalStages: number, hasUnreadActions: boolean, isArchived?: boolean) => string;
  getStatusLabel: (status: string, completedStages: number, totalStages: number, hasUnreadActions: boolean, isArchived?: boolean) => string;
}

function ProjectCard({ project, onNavigate, getStatusLabel }: ProjectCardProps) {
  const progressPct = project.total_stages > 0
    ? Math.round((project.completed_stages / project.total_stages) * 100)
    : 0;

  const isArchived = !!project.archived_at;
  const statusLabel = getStatusLabel(project.status, project.completed_stages, project.total_stages, project.has_unread_actions, isArchived);
  const isActive = statusLabel.includes('Active') || statusLabel.includes('In Progress');
  const isPaused = statusLabel.includes('Paused');
  const isCompleted = statusLabel.includes('Complete');
  const isArchivedStatus = statusLabel.includes('Archived');
  const needsAttention = project.has_unread_actions && !isCompleted;

  // Format relative time for "last viewed"
  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getProgressBarColor = () => {
    if (isCompleted) return 'bg-green-500';
    if (isPaused) return 'bg-orange-500';
    return 'bg-green-500';
  };

  const getEarnedColor = () => {
    if (isCompleted) return 'text-green-600';
    if (isPaused) return 'text-orange-600';
    return 'text-green-600';
  };

  const getStatusBadgeColor = () => {
    if (isArchivedStatus) return 'bg-gray-100 text-gray-600';
    if (isCompleted) return 'bg-green-100 text-green-700';
    if (isActive) return 'bg-yellow-100 text-yellow-700';
    if (isPaused) return 'bg-orange-100 text-orange-700';
    return 'bg-gray-100 text-gray-700';
  };

  return (
    <div
      className="bg-white rounded-xl p-5 sm:p-6 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-200 cursor-pointer"
      onClick={() => onNavigate(project.id)}
    >
      {/* Header: Project name + Status */}
      <div className="flex items-start justify-between mb-3 gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg sm:text-xl font-bold text-gray-900 truncate mb-1">
            {project.project_name}
          </h3>
          <p className="text-sm text-gray-500 truncate">
            {project.client_name}
          </p>
          {project.client_last_viewed_at && (
            <p className="text-xs text-gray-400 mt-0.5">
              Viewed {formatRelativeTime(project.client_last_viewed_at)}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Red dot notification indicator */}
          {needsAttention && (
            <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
          )}
          {/* Status badge - normal colors */}
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadgeColor()}`}>
            {statusLabel}
          </span>
        </div>
      </div>

      {/* Progress bar - no label, just percentage */}
      <div className="mb-4">
        <div className="flex items-center justify-end mb-2">
          <span className="text-sm font-semibold text-gray-900">{progressPct}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`${getProgressBarColor()} h-2 rounded-full transition-all duration-500 ease-out`}
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Revenue - clean layout, no labels */}
      <div className="flex items-end justify-between mb-2">
        <div className={`text-2xl sm:text-3xl font-black ${getEarnedColor()}`}>
          {formatCurrency(project.amount_earned, project.currency || 'USD')}
        </div>
        <div className="text-lg sm:text-xl font-bold text-gray-400">
          {formatCurrency(project.total_amount, project.currency || 'USD')}
        </div>
      </div>

      {/* Stage count - subtle */}
      <div className="text-xs text-gray-500">
        {project.completed_stages}/{project.total_stages} stages complete
      </div>

      {/* Primary notification - ALWAYS RESERVE SPACE for consistent card height */}
      <div className="mt-3 pt-3 border-t border-gray-200 min-h-[3rem]">
        {needsAttention && project.primary_notification ? (
          <p className="text-sm text-gray-700 font-medium">
            {project.primary_notification}
          </p>
        ) : (
          <div className="h-5" />
        )}
      </div>
    </div>
  );
}

export default memo(ProjectCard);
