import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { Head, usePage } from '@inertiajs/react';
import { AlertCircle, Calendar, CheckCircle, Clock, FileText, TrendingUp, Users, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, LabelList, Legend, Pie, PieChart, XAxis, YAxis, type LegendPayload } from 'recharts';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
];

interface DashboardPageProps extends SharedData {
    analytics: {
        totalClients: number;
        totalQuotations: number;
        totalQuotationRequests: number;
        pendingQuotations: number;
        approvedQuotations: number;
        rejectedQuotations: number;
    };
    chartData: {
        quotationsByStatus: Array<{ name: string; value: number; fill: string }>;
        serviceTypesData: Array<{ name: string; value: number; fill: string }>;
        monthlyData: Array<{ month: string; quotations: number }>;
    };
    recentQuotations: Array<{
        id: number;
        quotation_status: string;
        created_at: string;
        client?: { company_name: string };
        quotationRequest?: { service_type: string };
    }>;
}

const chartConfig = {
    quotations: {
        label: 'Quotations',
        color: 'hsl(var(--chart-1))',
    },
    pending: {
        label: 'Pending',
        color: 'hsl(var(--chart-1))',
    },
    approved: {
        label: 'Approved',
        color: 'hsl(var(--chart-2))',
    },
    rejected: {
        label: 'Rejected',
        color: 'hsl(var(--chart-3))',
    },
};

export default function Dashboard() {
    const { analytics, chartData, recentQuotations } = usePage<DashboardPageProps>().props;
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        });
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'pending':
                return <AlertCircle className="h-4 w-4 text-amber-500" />;
            case 'approved':
                return <CheckCircle className="h-4 w-4 text-green-500" />;
            case 'rejected':
                return <XCircle className="h-4 w-4 text-red-500" />;
            default:
                return <AlertCircle className="h-4 w-4 text-gray-500" />;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending':
                return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800/50';
            case 'approved':
                return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800/50';
            case 'rejected':
                return 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-800/50';
            default:
                return 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800/50 dark:text-slate-300 dark:border-slate-700';
        }
    };

    // Calculate total for percentage calculation
    const getTotalValue = (data: Array<{ value: number }>) => {
        return data.reduce((sum, item) => sum + item.value, 0);
    };

    // Function to get computed CSS variable value
    const getCSSVariableValue = (variable: string): string => {
        if (typeof window === 'undefined') {
            // Fallback for SSR - use default colors
            const defaultColors: Record<string, string> = {
                'chart-1': '#3b82f6',
                'chart-2': '#8b5cf6',
                'chart-3': '#10b981',
                'chart-4': '#f59e0b',
                'chart-5': '#ef4444',
            };
            const match = variable.match(/var\(--([^)]+)\)/);
            if (match && defaultColors[match[1]]) {
                return defaultColors[match[1]];
            }
            return variable;
        }

        // Extract the variable name from hsl(var(--chart-1)) or var(--chart-1) format
        const match = variable.match(/var\(--([^)]+)\)/);
        if (!match) {
            // If it's already a valid color (hex, rgb, etc.), return it
            return variable;
        }

        const varName = match[1];
        const computedValue = getComputedStyle(document.documentElement).getPropertyValue(`--${varName}`).trim();

        // CSS variables from the theme are hex values like #3b82f6
        if (computedValue) {
            return computedValue;
        }

        // Fallback to default colors if CSS variable not found
        const defaultColors: Record<string, string> = {
            'chart-1': '#3b82f6',
            'chart-2': '#8b5cf6',
            'chart-3': '#10b981',
            'chart-4': '#f59e0b',
            'chart-5': '#ef4444',
        };

        return defaultColors[varName] || variable;
    };

    // Transform chart data to use computed colors
    const transformChartData = (data: Array<{ name: string; value: number; fill: string }>) => {
        return data.map((item) => ({
            ...item,
            fill: getCSSVariableValue(item.fill),
        }));
    };

    const quotationsByStatusData = transformChartData(chartData.quotationsByStatus);
    const serviceTypesData = transformChartData(chartData.serviceTypesData);

    // Get computed CSS variable value helper
    const getCSSVar = (varName: string, fallback: string): string => {
        if (typeof window === 'undefined') return fallback;
        const value = getComputedStyle(document.documentElement).getPropertyValue(`--${varName}`).trim();
        return value || fallback;
    };

    // Get colors for charts
    const primaryColor = getCSSVar('primary', '#3b82f6');
    const foregroundColor = getCSSVar('foreground', '#0f172a');
    const mutedForegroundColor = getCSSVar('muted-foreground', '#64748b');
    const borderColor = getCSSVar('border', '#e2e8f0');

    const quotationsTotal = getTotalValue(chartData.quotationsByStatus);
    const serviceTypesTotal = getTotalValue(chartData.serviceTypesData);

    // Custom label function for pie charts - show value and percentage
    const createPieLabelFunction = (total: number) => (props: {
        value?: number;
        cx?: number;
        cy?: number;
        midAngle?: number;
        innerRadius?: number;
        outerRadius?: number;
        [key: string]: unknown;
    }) => {
        const { value, cx, cy, midAngle, innerRadius, outerRadius } = props;
        if (!value || total === 0) return null;
        const percentage = ((value / total) * 100).toFixed(1);
        // Only show label if slice is large enough (>5% of total) to avoid clutter
        if (parseFloat(percentage) <= 5) return null;

        const RADIAN = Math.PI / 180;
        const radius = (innerRadius || 0) + ((outerRadius || 0) - (innerRadius || 0)) * 0.5;
        const x = (cx || 0) + radius * Math.cos(-(midAngle || 0) * RADIAN);
        const y = (cy || 0) + radius * Math.sin(-(midAngle || 0) * RADIAN);

        return (
            <text
                x={x}
                y={y}
                fill="hsl(var(--foreground))"
                textAnchor={x > (cx || 0) ? 'start' : 'end'}
                dominantBaseline="central"
                fontSize={12}
                fontWeight={500}
            >
                {`${value} (${percentage}%)`}
            </text>
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-6 px-6 py-4">
                {/* Date and Time Section */}
                <div className="grid gap-6 md:grid-cols-2">
                    <Card className="border shadow-sm">
                        <CardContent className="p-6">
                            <div className="flex items-center gap-4">
                                <div className="rounded-lg bg-primary/10 p-3">
                                    <Calendar className="h-6 w-6 text-primary" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-foreground">{formatDate(currentTime)}</p>
                                    <p className="text-sm text-muted-foreground">Today's Date</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border shadow-sm">
                        <CardContent className="p-6">
                            <div className="flex items-center gap-4">
                                <div className="rounded-lg bg-emerald-500/10 p-3">
                                    <Clock className="h-6 w-6 text-emerald-600" />
                                </div>
                                <div>
                                    <p className="font-mono text-2xl font-bold text-foreground">{formatTime(currentTime)}</p>
                                    <p className="text-sm text-muted-foreground">Current Time</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Analytics Cards */}
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                    <Card className="overflow-hidden border-0 shadow-md transition-shadow duration-300 hover:shadow-lg">
                        <div className="h-1.5 bg-gradient-to-r from-blue-500 to-blue-600" />
                        <CardContent className="p-6">
                            <div className="flex items-center gap-4">
                                <div className="rounded-lg bg-blue-500/10 p-3">
                                    <Users className="h-6 w-6 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-3xl font-bold text-foreground">{analytics.totalClients}</p>
                                    <p className="text-sm tracking-wide text-muted-foreground uppercase">Total Clients</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="overflow-hidden border-0 shadow-md transition-shadow duration-300 hover:shadow-lg">
                        <div className="h-1.5 bg-gradient-to-r from-emerald-500 to-emerald-600" />
                        <CardContent className="p-6">
                            <div className="flex items-center gap-4">
                                <div className="rounded-lg bg-emerald-500/10 p-3">
                                    <FileText className="h-6 w-6 text-emerald-600" />
                                </div>
                                <div>
                                    <p className="text-3xl font-bold text-foreground">{analytics.totalQuotations}</p>
                                    <p className="text-sm tracking-wide text-muted-foreground uppercase">Total Quotations</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="overflow-hidden border-0 shadow-md transition-shadow duration-300 hover:shadow-lg">
                        <div className="h-1.5 bg-gradient-to-r from-purple-500 to-purple-600" />
                        <CardContent className="p-6">
                            <div className="flex items-center gap-4">
                                <div className="rounded-lg bg-purple-500/10 p-3">
                                    <TrendingUp className="h-6 w-6 text-purple-600" />
                                </div>
                                <div>
                                    <p className="text-3xl font-bold text-foreground">{analytics.totalQuotationRequests}</p>
                                    <p className="text-sm tracking-wide text-muted-foreground uppercase">Total Requests</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="overflow-hidden border-0 shadow-md transition-shadow duration-300 hover:shadow-lg">
                        <div className="h-1.5 bg-gradient-to-r from-amber-500 to-amber-600" />
                        <CardContent className="p-6">
                            <div className="flex items-center gap-4">
                                <div className="rounded-lg bg-amber-500/10 p-3">
                                    <AlertCircle className="h-6 w-6 text-amber-600" />
                                </div>
                                <div>
                                    <p className="text-3xl font-bold text-foreground">{analytics.pendingQuotations}</p>
                                    <p className="text-sm tracking-wide text-muted-foreground uppercase">Pending Quotations</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Charts Section */}
                <div className="grid gap-6 md:grid-cols-2">
                    {/* Quotations by Status - Pie Chart */}
                    <Card className="border shadow-sm">
                        <CardHeader className="border-b bg-muted/30">
                            <CardTitle className="text-xl font-bold">Quotations by Status</CardTitle>
                            <CardDescription className="text-sm text-muted-foreground">Distribution of quotation statuses</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <ChartContainer config={chartConfig} className="h-[300px]">
                                <PieChart>
                                    <ChartTooltip content={<ChartTooltipContent />} />
                                    <Pie
                                        data={quotationsByStatusData}
                                        dataKey="value"
                                        nameKey="name"
                                        cx="50%"
                                        cy="40%"
                                        outerRadius={65}
                                        label={createPieLabelFunction(quotationsTotal)}
                                        labelLine={{ strokeWidth: 2 }}
                                    >
                                        {quotationsByStatusData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.fill} />
                                        ))}
                                    </Pie>
                                    <Legend
                                        verticalAlign="bottom"
                                        height={60}
                                        wrapperStyle={{ paddingTop: '20px' }}
                                        formatter={(value, entry: LegendPayload) => {
                                            const payloadValue = entry.payload?.value;
                                            const numericValue = typeof payloadValue === 'number' ? payloadValue : 0;
                                            const percentage =
                                                quotationsTotal > 0 && numericValue > 0
                                                    ? ((numericValue / quotationsTotal) * 100).toFixed(1)
                                                    : '0';
                                            return (
                                                <span style={{ color: 'hsl(var(--foreground))', fontSize: '13px', fontWeight: '500' }}>
                                                    <span style={{ color: entry.color, marginRight: '8px' }}>●</span>
                                                    {value}: <strong>{numericValue}</strong> ({percentage}%)
                                                </span>
                                            );
                                        }}
                                    />
                                </PieChart>
                            </ChartContainer>
                        </CardContent>
                    </Card>

                    {/* Service Types Distribution */}
                    <Card className="border shadow-sm">
                        <CardHeader className="border-b bg-muted/30">
                            <CardTitle className="text-xl font-bold">Service Types</CardTitle>
                            <CardDescription className="text-sm text-muted-foreground">Distribution of service requests by type</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <ChartContainer config={chartConfig} className="h-[300px]">
                                <PieChart>
                                    <ChartTooltip content={<ChartTooltipContent />} />
                                    <Pie
                                        data={serviceTypesData}
                                        dataKey="value"
                                        nameKey="name"
                                        cx="50%"
                                        cy="40%"
                                        outerRadius={65}
                                        label={createPieLabelFunction(serviceTypesTotal)}
                                        labelLine={{ strokeWidth: 2 }}
                                    >
                                        {serviceTypesData.map((entry: { name: string; value: number; fill: string }, index: number) => (
                                            <Cell key={`cell-${index}`} fill={entry.fill} />
                                        ))}
                                    </Pie>
                                    <Legend
                                        verticalAlign="bottom"
                                        height={60}
                                        wrapperStyle={{ paddingTop: '20px' }}
                                        formatter={(value, entry: LegendPayload) => {
                                            const payloadValue = entry.payload?.value;
                                            const numericValue = typeof payloadValue === 'number' ? payloadValue : 0;
                                            const percentage =
                                                serviceTypesTotal > 0 && numericValue > 0
                                                    ? ((numericValue / serviceTypesTotal) * 100).toFixed(1)
                                                    : '0';
                                            return (
                                                <span style={{ color: 'hsl(var(--foreground))', fontSize: '13px', fontWeight: '500' }}>
                                                    <span style={{ color: entry.color, marginRight: '8px' }}>●</span>
                                                    {value}: <strong>{numericValue}</strong> ({percentage}%)
                                                </span>
                                            );
                                        }}
                                    />
                                </PieChart>
                            </ChartContainer>
                        </CardContent>
                    </Card>
                </div>

                {/* Monthly Trend - Bar Chart */}
                <Card className="border shadow-sm">
                    <CardHeader className="border-b bg-muted/30">
                        <CardTitle className="text-xl font-bold">Monthly Quotations Trend</CardTitle>
                        <CardDescription className="text-sm text-muted-foreground">Quotations created over the last 6 months</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <ChartContainer config={chartConfig} className="h-[400px]">
                            <BarChart data={chartData.monthlyData}>
                                <CartesianGrid strokeDasharray="3 3" stroke={borderColor} />
                                <XAxis dataKey="month" stroke={mutedForegroundColor} />
                                <YAxis stroke={mutedForegroundColor} />
                                <ChartTooltip content={<ChartTooltipContent />} />
                                <Bar dataKey="quotations" fill={primaryColor} radius={[4, 4, 0, 0]}>
                                    <LabelList
                                        dataKey="quotations"
                                        position="top"
                                        fill={foregroundColor}
                                        style={{ fontSize: '12px', fontWeight: '500' }}
                                    />
                                </Bar>
                            </BarChart>
                        </ChartContainer>
                    </CardContent>
                </Card>

                {/* Recent Quotations */}
                <Card className="border shadow-sm">
                    <CardHeader className="border-b bg-muted/30">
                        <CardTitle className="text-xl font-bold">Recent Quotations</CardTitle>
                        <CardDescription className="text-sm text-muted-foreground">Latest quotation activities</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="space-y-3">
                            {recentQuotations.map(
                                (quotation: {
                                    id: number;
                                    quotation_status: string;
                                    created_at: string;
                                    client?: { company_name: string };
                                    quotationRequest?: { service_type: string };
                                }) => (
                                    <div
                                        key={quotation.id}
                                        className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/30"
                                    >
                                        <div className="flex items-center gap-3">
                                            {getStatusIcon(quotation.quotation_status)}
                                            <div>
                                                <p className="font-medium text-foreground">{quotation.client?.company_name || 'Unknown Client'}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    {quotation.quotationRequest?.service_type.replace('_', ' ') || 'Unknown Service'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span
                                                className={`rounded-md border px-3 py-1 text-xs font-semibold ${getStatusColor(quotation.quotation_status)}`}
                                            >
                                                {quotation.quotation_status.charAt(0).toUpperCase() + quotation.quotation_status.slice(1)}
                                            </span>
                                            <p className="mt-1 text-xs text-muted-foreground">
                                                {new Date(quotation.created_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                ),
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
