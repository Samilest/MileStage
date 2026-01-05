import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { formatCurrency, type CurrencyCode } from '../lib/currency';
import { DollarSign, TrendingUp, Briefcase, CalendarDays } from 'lucide-react';

interface DashboardStatsProps {
  userId: string;
}

interface Stats {
  earnedThisMonth: number;
  earnedThisYear: number;
  outstanding: number;
  activeProjects: number;
  currency: CurrencyCode;
}

export default function DashboardStats({ userId }: DashboardStatsProps) {
  const [stats, setStats] = useState<Stats>({
    earnedThisMonth: 0,
    earnedThisYear: 0,
    outstanding: 0,
    activeProjects: 0,
    currency: 'USD',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      console.log('[DashboardStats] No userId provided, skipping fetch');
      setLoading(false);
      return;
    }
    console.log('[DashboardStats] Fetching stats for userId:', userId);
    fetchStats();
  }, [userId]);

  const fetchStats = async () => {
    if (!userId) {
      console.log('[DashboardStats] fetchStats called without userId');
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);

      // Get current date info
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const startOfYear = new Date(now.getFullYear(), 0, 1).toISOString();

      console.log('[DashboardStats] Running query for user:', userId);

      // Query projects with nested stages - EXACT same pattern as Dashboard.tsx
      const { data: projects, error: projectsError } = await supabase
        .from('projects')
        .select(`
          id,
          currency,
          archived_at,
          stages (
            id,
            stage_number,
            status,
            amount,
            payment_status,
            payment_received_at
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (projectsError) {
        console.error('[DashboardStats] Projects query error:', projectsError);
        setLoading(false);
        return;
      }

      if (!projects || projects.length === 0) {
        console.log('[DashboardStats] No projects found');
        setLoading(false);
        return;
      }

      // Use the most common currency (or first project's currency)
      const primaryCurrency = projects[0]?.currency || 'USD';

      // Flatten all stages from all projects
      const allStages = projects.flatMap(p => (p.stages as any[]) || []);

      console.log('[DashboardStats] Found', projects.length, 'projects with', allStages.length, 'total stages');

      if (allStages.length === 0) {
        setLoading(false);
        return;
      }

      // Calculate stats
      let earnedThisMonth = 0;
      let earnedThisYear = 0;
      let outstanding = 0;
      let activeProjects = 0;

      // Count active projects (not completed, not archived)
      projects.forEach(project => {
        const stages = (project.stages as any[]) || [];
        const allStagesPaid = stages.length > 0 && stages.every(s => s.payment_status === 'received');
        const isArchived = !!(project as any).archived_at;
        
        if (!allStagesPaid && !isArchived) {
          activeProjects++;
        }
      });

      allStages.forEach(stage => {
        const amount = stage.amount || 0;

        if (stage.payment_status === 'received' && stage.payment_received_at) {
          const paidDate = new Date(stage.payment_received_at);
          
          // Earned this month
          if (paidDate >= new Date(startOfMonth)) {
            earnedThisMonth += amount;
          }
          
          // Earned this year
          if (paidDate >= new Date(startOfYear)) {
            earnedThisYear += amount;
          }
        } else if (stage.payment_status !== 'received' && stage.status !== 'locked') {
          // Outstanding = unpaid stages that are not locked
          outstanding += amount;
        }
      });

      console.log('[DashboardStats] Calculated:', { earnedThisMonth, earnedThisYear, outstanding, activeProjects });

      setStats({
        earnedThisMonth,
        earnedThisYear,
        outstanding,
        activeProjects,
        currency: primaryCurrency as CurrencyCode,
      });

    } catch (error) {
      console.error('[DashboardStats] Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-24 mb-3"></div>
            <div className="h-8 bg-gray-200 rounded w-32"></div>
          </div>
        ))}
      </div>
    );
  }

  const statCards = [
    {
      label: 'Earned This Month',
      value: formatCurrency(stats.earnedThisMonth, stats.currency),
      icon: CalendarDays,
      iconColor: 'text-green-600',
      iconBg: 'bg-green-50',
    },
    {
      label: 'Earned This Year',
      value: formatCurrency(stats.earnedThisYear, stats.currency),
      icon: TrendingUp,
      iconColor: 'text-blue-600',
      iconBg: 'bg-blue-50',
    },
    {
      label: 'Outstanding',
      value: formatCurrency(stats.outstanding, stats.currency),
      icon: DollarSign,
      iconColor: stats.outstanding > 0 ? 'text-orange-600' : 'text-gray-600',
      iconBg: stats.outstanding > 0 ? 'bg-orange-50' : 'bg-gray-50',
      tooltip: 'Unpaid amounts from active stages',
    },
    {
      label: 'Active Projects',
      value: stats.activeProjects.toString(),
      icon: Briefcase,
      iconColor: 'text-purple-600',
      iconBg: 'bg-purple-50',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {statCards.map((stat, index) => (
        <div
          key={index}
          className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className={`p-2 rounded-lg ${stat.iconBg}`}>
              <stat.icon className={`w-4 h-4 sm:w-5 sm:h-5 ${stat.iconColor}`} />
            </div>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 mb-1">{stat.label}</p>
          <p className="text-lg sm:text-2xl font-bold text-gray-900">
            {stat.value}
          </p>
        </div>
      ))}
    </div>
  );
}
