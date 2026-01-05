import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { formatCurrency, type CurrencyCode } from '../lib/currency';
import { DollarSign, TrendingUp, Clock, CalendarDays } from 'lucide-react';

interface DashboardStatsProps {
  userId: string;
}

interface Stats {
  earnedThisMonth: number;
  earnedThisYear: number;
  outstanding: number;
  avgDaysToPayment: number | null;
  currency: CurrencyCode;
}

export default function DashboardStats({ userId }: DashboardStatsProps) {
  const [stats, setStats] = useState<Stats>({
    earnedThisMonth: 0,
    earnedThisYear: 0,
    outstanding: 0,
    avgDaysToPayment: null,
    currency: 'USD',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    fetchStats();
  }, [userId]);

  const fetchStats = async () => {
    try {
      setLoading(true);

      // Get current date info
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const startOfYear = new Date(now.getFullYear(), 0, 1).toISOString();

      // Fetch all user's projects
      const { data: projects, error: projectsError } = await supabase
        .from('projects')
        .select('id, currency')
        .eq('user_id', userId);

      if (projectsError) throw projectsError;

      if (!projects || projects.length === 0) {
        setLoading(false);
        return;
      }

      const projectIds = projects.map(p => p.id);
      // Use the most common currency (or first project's currency)
      const primaryCurrency = projects[0]?.currency || 'USD';

      // Fetch all stages for these projects
      const { data: stages, error: stagesError } = await supabase
        .from('stages')
        .select('id, amount, payment_status, payment_received_at, created_at, status')
        .in('project_id', projectIds);

      if (stagesError) throw stagesError;

      if (!stages) {
        setLoading(false);
        return;
      }

      // Calculate stats
      let earnedThisMonth = 0;
      let earnedThisYear = 0;
      let outstanding = 0;
      let totalDaysToPayment = 0;
      let paidStagesCount = 0;

      stages.forEach(stage => {
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

          // Calculate days to payment (from stage creation or delivery)
          if (stage.created_at) {
            const createdDate = new Date(stage.created_at);
            const daysToPayment = Math.floor((paidDate.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
            if (daysToPayment >= 0) {
              totalDaysToPayment += daysToPayment;
              paidStagesCount++;
            }
          }
        } else if (stage.payment_status !== 'received' && stage.status !== 'locked') {
          // Outstanding = unpaid stages that are not locked
          outstanding += amount;
        }
      });

      const avgDaysToPayment = paidStagesCount > 0 
        ? Math.round(totalDaysToPayment / paidStagesCount) 
        : null;

      setStats({
        earnedThisMonth,
        earnedThisYear,
        outstanding,
        avgDaysToPayment,
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
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      label: 'Earned This Year',
      value: formatCurrency(stats.earnedThisYear, stats.currency),
      icon: TrendingUp,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      label: 'Outstanding',
      value: formatCurrency(stats.outstanding, stats.currency),
      icon: DollarSign,
      color: stats.outstanding > 0 ? 'text-orange-600' : 'text-gray-600',
      bgColor: stats.outstanding > 0 ? 'bg-orange-50' : 'bg-gray-50',
    },
    {
      label: 'Avg. Days to Payment',
      value: stats.avgDaysToPayment !== null ? `${stats.avgDaysToPayment} days` : '—',
      icon: Clock,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
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
            <div className={`p-2 rounded-lg ${stat.bgColor}`}>
              <stat.icon className={`w-4 h-4 sm:w-5 sm:h-5 ${stat.color}`} />
            </div>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 mb-1">{stat.label}</p>
          <p className={`text-lg sm:text-2xl font-bold ${stat.color}`}>
            {stat.value}
          </p>
        </div>
      ))}
    </div>
  );
}
