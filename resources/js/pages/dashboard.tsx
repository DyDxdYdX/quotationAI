import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { Head, usePage } from '@inertiajs/react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Calendar, Clock, TrendingUp, Users, FileText, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { useState, useEffect } from 'react';

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
        label: "Quotations",
        color: "hsl(var(--chart-1))",
    },
    pending: {
        label: "Pending",
        color: "hsl(var(--chart-1))",
    },
    approved: {
        label: "Approved", 
        color: "hsl(var(--chart-2))",
    },
    rejected: {
        label: "Rejected",
        color: "hsl(var(--chart-3))",
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
            day: 'numeric'
        });
    };

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
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
                return 'text-amber-600 bg-amber-50 border-amber-200';
            case 'approved':
                return 'text-green-600 bg-green-50 border-green-200';
            case 'rejected':
                return 'text-red-600 bg-red-50 border-red-200';
            default:
                return 'text-gray-600 bg-gray-50 border-gray-200';
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                {/* Date and Time Section */}
                <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center gap-4">
                                <Calendar className="h-8 w-8 text-blue-500" />
                                <div>
                                    <p className="text-2xl font-bold">{formatDate(currentTime)}</p>
                                    <p className="text-sm text-muted-foreground">Today's Date</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center gap-4">
                                <Clock className="h-8 w-8 text-green-500" />
                                <div>
                                    <p className="text-2xl font-bold font-mono">{formatTime(currentTime)}</p>
                                    <p className="text-sm text-muted-foreground">Current Time</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Analytics Cards */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center gap-4">
                                <Users className="h-8 w-8 text-blue-500" />
                                <div>
                                    <p className="text-2xl font-bold">{analytics.totalClients}</p>
                                    <p className="text-sm text-muted-foreground">Total Clients</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center gap-4">
                                <FileText className="h-8 w-8 text-green-500" />
                                <div>
                                    <p className="text-2xl font-bold">{analytics.totalQuotations}</p>
                                    <p className="text-sm text-muted-foreground">Total Quotations</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center gap-4">
                                <TrendingUp className="h-8 w-8 text-purple-500" />
                                <div>
                                    <p className="text-2xl font-bold">{analytics.totalQuotationRequests}</p>
                                    <p className="text-sm text-muted-foreground">Total Requests</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center gap-4">
                                <AlertCircle className="h-8 w-8 text-amber-500" />
                                <div>
                                    <p className="text-2xl font-bold">{analytics.pendingQuotations}</p>
                                    <p className="text-sm text-muted-foreground">Pending Quotations</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Charts Section */}
                <div className="grid gap-6 md:grid-cols-2">
                    {/* Quotations by Status - Pie Chart */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Quotations by Status</CardTitle>
                            <CardDescription>Distribution of quotation statuses</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ChartContainer config={chartConfig} className="h-[300px]">
                                <PieChart>
                                    <ChartTooltip content={<ChartTooltipContent />} />
                                    <Pie
                                        data={chartData.quotationsByStatus}
                                        dataKey="value"
                                        nameKey="name"
                                        cx="50%"
                                        cy="50%"
                                        outerRadius={80}
                                        label={({ name, value }) => `${name}: ${value}`}
                                    >
                                        {chartData.quotationsByStatus.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.fill} />
                                        ))}
                                    </Pie>
                                </PieChart>
                            </ChartContainer>
                        </CardContent>
                    </Card>

                    {/* Service Types Distribution */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Service Types</CardTitle>
                            <CardDescription>Distribution of service requests by type</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ChartContainer config={chartConfig} className="h-[300px]">
                                <PieChart>
                                    <ChartTooltip content={<ChartTooltipContent />} />
                                    <Pie
                                        data={chartData.serviceTypesData}
                                        dataKey="value"
                                        nameKey="name"
                                        cx="50%"
                                        cy="50%"
                                        outerRadius={80}
                                        label={({ name, value }) => `${name}: ${value}`}
                                    >
                                        {chartData.serviceTypesData.map((entry: any, index: number) => (
                                            <Cell key={`cell-${index}`} fill={entry.fill} />
                                        ))}
                                    </Pie>
                                </PieChart>
                            </ChartContainer>
                        </CardContent>
                    </Card>
                </div>

                {/* Monthly Trend - Bar Chart */}
                <Card>
                    <CardHeader>
                        <CardTitle>Monthly Quotations Trend</CardTitle>
                        <CardDescription>Quotations created over the last 6 months</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ChartContainer config={chartConfig} className="h-[400px]">
                            <BarChart data={chartData.monthlyData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="month" />
                                <YAxis />
                                <ChartTooltip content={<ChartTooltipContent />} />
                                <Bar dataKey="quotations" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ChartContainer>
                    </CardContent>
                </Card>

                {/* Recent Quotations */}
                <Card>
                    <CardHeader>
                        <CardTitle>Recent Quotations</CardTitle>
                        <CardDescription>Latest quotation activities</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {recentQuotations.map((quotation: any) => (
                                <div key={quotation.id} className="flex items-center justify-between p-4 border rounded-lg">
                                    <div className="flex items-center gap-3">
                                        {getStatusIcon(quotation.quotation_status)}
                                        <div>
                                            <p className="font-medium">{quotation.client?.company_name || 'Unknown Client'}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {quotation.quotationRequest?.service_type.replace('_', ' ') || 'Unknown Service'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(quotation.quotation_status)}`}>
                                            {quotation.quotation_status.charAt(0).toUpperCase() + quotation.quotation_status.slice(1)}
                                        </span>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {new Date(quotation.created_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
