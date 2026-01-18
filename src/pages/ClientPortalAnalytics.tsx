import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { ArrowLeft, TrendingUp, TrendingDown, Eye, Shirt, Target, Gauge, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from '@/components/ui/chart';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { useAnalytics } from '@/hooks/useAnalytics';
import { supabase } from '@/integrations/supabase/client';

const CATEGORY_LABELS: Record<string, string> = {
  buzo: 'Buzo',
  remera: 'Remera',
  camisa: 'Camisa',
  vestido: 'Vestido',
  falda: 'Falda',
  pantalon: 'Pantalón',
  zapatos: 'Zapatos',
};

const CHART_COLORS = {
  tryons: 'hsl(var(--primary))',
  view360: 'hsl(var(--secondary))',
};

const PIE_COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(262, 83%, 58%)', 'hsl(280, 65%, 60%)', 'hsl(300, 50%, 55%)', 'hsl(320, 70%, 55%)'];

const chartConfig = {
  tryons: {
    label: 'Try-ons',
    color: CHART_COLORS.tryons,
  },
  view360: {
    label: 'Vistas 360°',
    color: CHART_COLORS.view360,
  },
};

const ClientPortalAnalytics = () => {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();
  const [clientName, setClientName] = useState<string>('');
  const { loading, error, metrics, dailyData, categoryData, recentActivity, period, setPeriod, refetch } = useAnalytics(clientId);

  useEffect(() => {
    const fetchClientName = async () => {
      if (!clientId) return;
      const { data } = await supabase
        .from('embed_clients')
        .select('name')
        .eq('id', clientId)
        .maybeSingle();
      if (data) setClientName(data.name);
    };
    fetchClientName();
  }, [clientId]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
  };

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('es-ES', { 
      day: '2-digit', 
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const pieData = [
    { name: 'Try-ons', value: metrics.totalTryons },
    { name: 'Vistas 360°', value: metrics.totalView360 },
  ].filter(d => d.value > 0);

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <p className="text-destructive">{error}</p>
          <Button onClick={() => refetch()} className="mt-4">Reintentar</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => navigate('/client-portal')}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Analytics</h1>
              <p className="text-muted-foreground">{clientName || 'Cargando...'}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Select value={period} onValueChange={(v) => setPeriod(v as '7d' | '30d' | '90d')}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Últimos 7 días</SelectItem>
                <SelectItem value="30d">Últimos 30 días</SelectItem>
                <SelectItem value="90d">Últimos 90 días</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={() => refetch()} disabled={loading}>
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Total Try-ons"
            value={metrics.totalTryons}
            icon={<Shirt className="w-5 h-5" />}
            loading={loading}
          />
          <MetricCard
            title="Vistas 360°"
            value={metrics.totalView360}
            icon={<Eye className="w-5 h-5" />}
            loading={loading}
          />
          <MetricCard
            title="Tasa de Conversión"
            value={`${metrics.conversionRate.toFixed(1)}%`}
            icon={<Target className="w-5 h-5" />}
            description="360° / Try-ons"
            loading={loading}
          />
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Uso Mensual</CardTitle>
              <Gauge className="w-5 h-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <>
                  <div className="text-2xl font-bold">
                    {metrics.monthlyUsage} / {metrics.monthlyLimit}
                  </div>
                  <Progress 
                    value={metrics.percentageUsed} 
                    className="mt-2 h-2"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {metrics.percentageUsed.toFixed(1)}% utilizado
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Area Chart - Usage over time */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Uso en el Tiempo</CardTitle>
              <CardDescription>Try-ons y vistas 360° por día</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-[300px] w-full" />
              ) : dailyData.length > 0 ? (
                <ChartContainer config={chartConfig} className="h-[300px] w-full">
                  <AreaChart data={dailyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="tryonsGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={CHART_COLORS.tryons} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={CHART_COLORS.tryons} stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="view360Gradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={CHART_COLORS.view360} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={CHART_COLORS.view360} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={formatDate}
                      className="text-xs"
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <YAxis 
                      className="text-xs"
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <ChartLegend content={<ChartLegendContent />} />
                    <Area
                      type="monotone"
                      dataKey="tryons"
                      stroke={CHART_COLORS.tryons}
                      fill="url(#tryonsGradient)"
                      strokeWidth={2}
                      name="Try-ons"
                    />
                    <Area
                      type="monotone"
                      dataKey="view360"
                      stroke={CHART_COLORS.view360}
                      fill="url(#view360Gradient)"
                      strokeWidth={2}
                      name="Vistas 360°"
                    />
                  </AreaChart>
                </ChartContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  No hay datos para este período
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pie Chart - Action distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Distribución</CardTitle>
              <CardDescription>Proporción de acciones</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-[250px] w-full" />
              ) : pieData.length > 0 ? (
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {pieData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <ChartTooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                  No hay datos
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Second Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Bar Chart - Categories */}
          <Card>
            <CardHeader>
              <CardTitle>Categorías Populares</CardTitle>
              <CardDescription>Prendas más probadas</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-[250px] w-full" />
              ) : categoryData.length > 0 ? (
                <ChartContainer config={chartConfig} className="h-[250px] w-full">
                  <BarChart 
                    data={categoryData} 
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 50, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={true} vertical={false} />
                    <XAxis type="number" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis 
                      type="category" 
                      dataKey="category"
                      tickFormatter={(value) => CATEGORY_LABELS[value] || value}
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                      width={80}
                    />
                    <ChartTooltip 
                      content={<ChartTooltipContent />}
                      formatter={(value, name, props) => [value, CATEGORY_LABELS[props.payload.category] || props.payload.category]}
                    />
                    <Bar 
                      dataKey="count" 
                      fill={CHART_COLORS.tryons}
                      radius={[0, 4, 4, 0]}
                      name="Usos"
                    />
                  </BarChart>
                </ChartContainer>
              ) : (
                <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <p>No hay datos de categorías</p>
                    <p className="text-sm">Las categorías se registrarán en nuevos try-ons</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Activity Table */}
          <Card>
            <CardHeader>
              <CardTitle>Actividad Reciente</CardTitle>
              <CardDescription>Últimas 10 acciones</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : recentActivity.length > 0 ? (
                <div className="max-h-[250px] overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Acción</TableHead>
                        <TableHead>Categoría</TableHead>
                        <TableHead>Fecha</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recentActivity.map((activity) => (
                        <TableRow key={activity.id}>
                          <TableCell>
                            <Badge variant={activity.action === 'tryon' ? 'default' : 'secondary'}>
                              {activity.action === 'tryon' ? 'Try-on' : '360°'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {activity.category ? (CATEGORY_LABELS[activity.category] || activity.category) : '-'}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {formatDateTime(activity.created_at)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                  No hay actividad reciente
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
  );
};

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  description?: string;
  trend?: number;
  loading?: boolean;
}

const MetricCard = ({ title, value, icon, description, trend, loading }: MetricCardProps) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between pb-2">
      <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      <div className="text-muted-foreground">{icon}</div>
    </CardHeader>
    <CardContent>
      {loading ? (
        <Skeleton className="h-8 w-24" />
      ) : (
        <>
          <div className="text-2xl font-bold">{value}</div>
          {description && (
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
          )}
          {trend !== undefined && (
            <div className={`flex items-center text-xs mt-1 ${trend >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {trend >= 0 ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
              {Math.abs(trend)}% vs período anterior
            </div>
          )}
        </>
      )}
    </CardContent>
  </Card>
);

export default ClientPortalAnalytics;
