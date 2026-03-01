import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AnalyticsMetrics {
  totalTryons: number;
  totalView360: number;
  conversionRate: number;
  monthlyUsage: number;
  monthlyLimit: number;
  percentageUsed: number;
}

interface DailyData {
  date: string;
  tryons: number;
  view360: number;
}

interface CategoryData {
  category: string;
  count: number;
}

interface RecentActivity {
  id: string;
  action: string;
  category: string | null;
  referer_domain: string | null;
  created_at: string;
}

interface UseAnalyticsResult {
  loading: boolean;
  error: string | null;
  metrics: AnalyticsMetrics;
  dailyData: DailyData[];
  categoryData: CategoryData[];
  recentActivity: RecentActivity[];
  period: '7d' | '30d' | '90d';
  setPeriod: (period: '7d' | '30d' | '90d') => void;
  refetch: () => Promise<void>;
}

const getPeriodDays = (period: '7d' | '30d' | '90d'): number => {
  switch (period) {
    case '7d': return 7;
    case '30d': return 30;
    case '90d': return 90;
  }
};

export const useAnalytics = (clientId: string | undefined): UseAnalyticsResult => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('30d');
  const [metrics, setMetrics] = useState<AnalyticsMetrics>({
    totalTryons: 0,
    totalView360: 0,
    conversionRate: 0,
    monthlyUsage: 0,
    monthlyLimit: 1000,
    percentageUsed: 0,
  });
  const [dailyData, setDailyData] = useState<DailyData[]>([]);
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);

  const fetchAnalytics = useCallback(async () => {
    if (!clientId) return;

    setLoading(true);
    setError(null);

    try {
      const periodDays = getPeriodDays(period);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - periodDays);

      // Fetch client info for monthly limit
      const { data: clientData, error: clientError } = await supabase
        .from('embed_clients')
        .select('monthly_limit')
        .eq('id', clientId)
        .maybeSingle();

      if (clientError) throw clientError;

      // Calculate real monthly usage (only tryons from current month)
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);

      const { count: monthlyTryonCount, error: monthlyError } = await supabase
        .from('embed_usage')
        .select('*', { count: 'exact', head: true })
        .eq('client_id', clientId)
        .eq('action', 'tryon')
        .gte('created_at', monthStart.toISOString());

      if (monthlyError) throw monthlyError;

      // Fetch all usage data for the period
      const { data: usageData, error: usageError } = await supabase
        .from('embed_usage')
        .select('*')
        .eq('client_id', clientId)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false });

      if (usageError) throw usageError;

      // Calculate metrics
      const tryons = usageData?.filter(u => u.action === 'tryon').length || 0;
      const view360 = usageData?.filter(u => u.action === 'view360').length || 0;
      const conversionRate = tryons > 0 ? (view360 / tryons) * 100 : 0;

      const monthlyUsage = monthlyTryonCount || 0;
      const monthlyLimit = clientData?.monthly_limit || 1000;

      setMetrics({
        totalTryons: tryons,
        totalView360: view360,
        conversionRate,
        monthlyUsage,
        monthlyLimit,
        percentageUsed: (monthlyUsage / monthlyLimit) * 100,
      });

      // Group by day for chart
      const dailyMap = new Map<string, { tryons: number; view360: number }>();
      
      // Initialize all days in period
      for (let i = periodDays - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        dailyMap.set(dateStr, { tryons: 0, view360: 0 });
      }

      // Fill with actual data
      usageData?.forEach(item => {
        const dateStr = new Date(item.created_at).toISOString().split('T')[0];
        const existing = dailyMap.get(dateStr);
        if (existing) {
          if (item.action === 'tryon') {
            existing.tryons++;
          } else if (item.action === 'view360') {
            existing.view360++;
          }
        }
      });

      const dailyArray = Array.from(dailyMap.entries()).map(([date, data]) => ({
        date,
        ...data,
      }));
      setDailyData(dailyArray);

      // Group by category
      const categoryMap = new Map<string, number>();
      usageData?.forEach(item => {
        if (item.category) {
          categoryMap.set(item.category, (categoryMap.get(item.category) || 0) + 1);
        }
      });

      const categoryArray = Array.from(categoryMap.entries())
        .map(([category, count]) => ({ category, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 6);
      setCategoryData(categoryArray);

      // Recent activity
      const recent = (usageData || []).slice(0, 10).map(item => ({
        id: item.id,
        action: item.action,
        category: item.category,
        referer_domain: item.referer_domain,
        created_at: item.created_at,
      }));
      setRecentActivity(recent);

    } catch (err) {
      setError('Error al cargar los analytics');
    } finally {
      setLoading(false);
    }
  }, [clientId, period]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  return {
    loading,
    error,
    metrics,
    dailyData,
    categoryData,
    recentActivity,
    period,
    setPeriod,
    refetch: fetchAnalytics,
  };
};
