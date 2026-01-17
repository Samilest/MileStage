import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { formatCurrency, type CurrencyCode } from '../lib/currency';
import { DollarSign, TrendingUp, Briefcase, CalendarDays } from 'lucide-react';

interface DashboardStatsProps {
  userId: string;
}

// Stats grouped by currency
interface CurrencyStats {
  earnedThisMonth: number;
  earnedThisYear: number;
  outstanding: number;
}

interface Stats {
  byCurrency: Record<CurrencyCode, CurrencyStats>;
  activeProjects: number;
  primaryCurrency: CurrencyCode;
}

export default function DashboardStats({ userId }: DashboardStatsProps) {
  const [stats, setStats] = useState<Stats>({
    byCurrency: {},
    activeProjects: 0,
    primaryCurrency: 'USD',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }
    fetchStats();
  }, [userId]);

  const fetchStats = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);

      // Get current date info
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const startOfYear = new Date(now.getFullYear(), 0, 1).toISOString();

      // Query projects with nested stages
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
        setLoading(false);
        return;
      }

      // Initialize stats by currency
      const byCurrency: Record<string, CurrencyStats> = {};
      let activeProjects = 0;

      // Count currency frequency to determine primary
      const currencyCount: Record<string, number> = {};

      projects.forEach(project => {
        const currency = (project.currency || 'USD') as CurrencyCode;
        const stages = (project.stages as any[]) || [];
        const isArchived = !!(project as any).archived_at;
        
        // Count currency usage
        currencyCount[currency] = (currencyCount[currency] || 0) + 1;

        // Initialize currency stats if needed
        if (!byCurrency[currency]) {
          byCurrency[currency] = {
            earnedThisMonth: 0,
            earnedThisYear: 0,
            outstanding: 0,
          };
        }

        // Check if project is active (has at least one unpaid stage and not archived)
        const hasUnpaidStage = stages.some(s => s.payment_status !== 'received');
        if (hasUnpaidStage && !isArchived) {
          activeProjects++;
        }

        // Calculate stats per stage
        stages.forEach(stage => {
          const amount = stage.amount || 0;

          if (stage.payment_status === 'received' && stage.payment_received_at) {
            const paidDate = new Date(stage.payment_received_at);
            
            // Earned this month
            if (paidDate >= new Date(startOfMonth)) {
              byCurrency[currency].earnedThisMonth += amount;
            }
            
            // Earned this year
            if (paidDate >= new Date(startOfYear)) {
              byCurrency[currency].earnedThisYear += amount;
            }
          } else if (stage.payment_status !== 'received') {
            // Outstanding = ALL unpaid stages (regardless of locked status)
            // This matches what users see on project cards - total unpaid amount
            byCurrency[currency].outstanding += amount;
          }
        });
      });

      // Find primary currency (most used)
      const primaryCurrency = Object.entries(currencyCount)
        .sort((a, b) => b[1] - a[1])[0]?.[0] as CurrencyCode || 'USD';

      setStats({
        byCurrency: byCurrency as Record<CurrencyCode, CurrencyStats>,
        activeProjects,
        primaryCurrency,
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

  // Get all currencies with data
  const currencies = Object.keys(stats.byCurrency) as CurrencyCode[];
  const hasMixedCurrencies = currencies.length > 1;

  // Helper to format multi-currency values
  const formatMultiCurrency = (getValue: (currency: CurrencyCode) => number) => {
    if (currencies.length === 0) {
      return formatCurrency(0, 'USD');
    }
    
    if (!hasMixedCurrencies) {
      // Single currency - simple display
      return formatCurrency(getValue(currencies[0]), currencies[0]);
    }

    // Multiple currencies - show each on its own line
    const nonZeroCurrencies = currencies.filter(c => getValue(c) > 0);
    
    if (nonZeroCurrencies.length === 0) {
      return formatCurrency(0, stats.primaryCurrency);
    }

    return nonZeroCurrencies
      .map(currency => formatCurrency(getValue(currency), currency))
      .join('\n');
  };

  // Calculate totals for display
  const earnedThisMonth = formatMultiCurrency(c => stats.byCurrency[c]?.earnedThisMonth || 0);
  const earnedThisYear = formatMultiCurrency(c => stats.byCurrency[c]?.earnedThisYear || 0);
  const outstanding = formatMultiCurrency(c => stats.byCurrency[c]?.outstanding || 0);

  // Check if outstanding has any value
  const hasOutstanding = currencies.some(c => (stats.byCurrency[c]?.outstanding || 0) > 0);

  const statCards = [
    {
      label: 'Earned This Month',
      value: earnedThisMonth,
      icon: CalendarDays,
      iconColor: 'text-green-600',
      iconBg: 'bg-green-50',
    },
    {
      label: 'Earned This Year',
      value: earnedThisYear,
      icon: TrendingUp,
      iconColor: 'text-blue-600',
      iconBg: 'bg-blue-50',
    },
    {
      label: 'Outstanding',
      value: outstanding,
      icon: DollarSign,
      iconColor: hasOutstanding ? 'text-orange-600' : 'text-gray-600',
      iconBg: hasOutstanding ? 'bg-orange-50' : 'bg-gray-50',
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
          <p className="text-lg sm:text-2xl font-bold text-gray-900 whitespace-pre-line">
            {stat.value}
          </p>
        </div>
      ))}
    </div>
  );
}
