import QuotationRenderer from '@/components/quotation-renderer';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { ArrowLeft, CheckCircle, Clock, Loader2, XCircle } from 'lucide-react';
import { useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Manage Quotation',
        href: '/manage-quotation',
    },
    {
        title: 'View Quotation',
        href: '#',
    },
];

interface Client {
    id: number;
    supervisor_name: string;
    company_name: string;
    company_email: string;
    company_phone_number: string;
    company_registration_number: string;
}

interface QuotationRequest {
    id: number;
    service_type: string;
    message: string;
    problem: string;
    solution: string;
}

interface Quotation {
    id: number;
    client_id: number;
    quotation_request_id: number;
    quotation_message: string | object;
    quotation_status: 'pending' | 'approved' | 'rejected';
    created_at: string;
    updated_at: string;
    client?: Client;
    quotation_request?: QuotationRequest;
}

const serviceTypeLabels = {
    web_development: 'Web Development',
    mobile_development: 'Mobile Development',
    desktop_development: 'Desktop Development',
    ai_development: 'AI Development',
    graphic_design: 'Graphic Design',
    digital_marketing: 'Digital Marketing',
    other: 'Other',
};

export default function ViewQuotation({ quotation }: { quotation: Quotation }) {
    const [isUpdating, setIsUpdating] = useState(false);

    const handleStatusUpdate = (status: 'pending' | 'approved' | 'rejected') => {
        setIsUpdating(true);
        router.put(
            `/quotation/${quotation.id}`,
            {
                quotation_status: status,
            },
            {
                onSuccess: () => {
                    // Status updated successfully
                },
                onFinish: () => {
                    setIsUpdating(false);
                },
            },
        );
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

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`View Quotation QTN-${quotation.id.toString().padStart(6, '0')} - ${quotation.client?.company_name}`} />

            <div className="px-6 py-4">
                <div className="mb-6 flex items-center gap-4">
                    <Button variant="outline" size="sm" onClick={() => router.get('/manage-quotation')} className="h-9 w-9">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div className="flex-1">
                        <div className="flex items-center gap-4">
                            <h1 className="text-3xl font-bold tracking-tight text-foreground">Quotation QTN-{quotation.id.toString().padStart(6, '0')}</h1>
                            <Badge className={`${getStatusColor(quotation.quotation_status)} border px-3 py-1 text-xs font-semibold`}>
                                {quotation.quotation_status.charAt(0).toUpperCase() + quotation.quotation_status.slice(1)}
                            </Badge>
                        </div>
                        <p className="mt-2 text-sm text-muted-foreground">View quotation details and manage status</p>
                    </div>
                </div>

                <div className="space-y-6">
                    <Card className="border shadow-sm">
                        <CardHeader className="border-b bg-muted/30">
                            <CardTitle className="text-xl font-bold">Client Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {quotation.client && (
                                <div className="rounded-lg border bg-muted/50 p-4">
                                    <h4 className="mb-3 text-sm font-semibold">Client Details</h4>
                                    <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
                                        <div className="flex flex-col">
                                            <span className="text-xs font-medium tracking-wider text-muted-foreground uppercase">Company</span>
                                            <span className="font-medium">{quotation.client.company_name}</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-xs font-medium tracking-wider text-muted-foreground uppercase">Company Registration Number</span>
                                            <span className="font-medium">{quotation.client.company_registration_number}</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-xs font-medium tracking-wider text-muted-foreground uppercase">Supervisor</span>
                                            <span className="font-medium">{quotation.client.supervisor_name}</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-xs font-medium tracking-wider text-muted-foreground uppercase">Email</span>
                                            <span className="font-medium">{quotation.client.company_email}</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-xs font-medium tracking-wider text-muted-foreground uppercase">Phone</span>
                                            <span className="font-medium">{quotation.client.company_phone_number}</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="border shadow-sm">
                        <CardHeader className="border-b bg-muted/30">
                            <CardTitle className="text-xl font-bold">Service Requirements</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <Label className="text-sm font-medium">Service Type</Label>
                                <div className="rounded-md bg-muted/50 p-3">
                                    <span className="font-medium">
                                        {serviceTypeLabels[quotation.quotation_request?.service_type as keyof typeof serviceTypeLabels] || 'N/A'}
                                    </span>
                                </div>
                            </div>

                            {quotation.quotation_request?.problem && (
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium">Problem Description</Label>
                                    <div className="rounded-md bg-muted/50 p-3 text-sm">{quotation.quotation_request.problem}</div>
                                </div>
                            )}

                            {quotation.quotation_request?.solution && (
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium">Proposed Solution</Label>
                                    <div className="rounded-md bg-muted/50 p-3 text-sm">{quotation.quotation_request.solution}</div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="border shadow-sm">
                        <CardHeader className="border-b bg-muted/30">
                            <CardTitle className="text-xl font-bold">AI Generated Quotation</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-4">
                                <Label className="text-sm font-medium">Quotation Details</Label>

                                {(() => {
                                    try {
                                        // Parse quotation data - QuotationRenderer will detect format automatically
                                        const quotationData =
                                            typeof quotation.quotation_message === 'string'
                                                ? JSON.parse(quotation.quotation_message)
                                                : quotation.quotation_message;

                                        return <QuotationRenderer quotationData={quotationData} />;
                                    } catch (error) {
                                        console.error('Error parsing quotation data:', error);
                                        // Fallback for non-JSON data
                                        return (
                                            <div className="space-y-4">
                                                <div className="rounded-md border border-red-200 bg-red-50 p-4">
                                                    <p className="mb-2 text-sm font-medium text-red-800">Error parsing quotation data</p>
                                                    <p className="text-xs text-red-600">
                                                        The quotation data could not be parsed properly. Displaying raw content below.
                                                    </p>
                                                </div>
                                                <div className="max-h-96 overflow-y-auto rounded-md bg-muted/50 p-4 text-sm whitespace-pre-wrap">
                                                    {typeof quotation.quotation_message === 'string'
                                                        ? quotation.quotation_message
                                                        : JSON.stringify(quotation.quotation_message, null, 2)}
                                                </div>
                                            </div>
                                        );
                                    }
                                })()}
                            </div>

                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div className="flex flex-col">
                                    <span className="text-xs font-medium tracking-wider text-muted-foreground uppercase">Created Date</span>
                                    <span className="font-medium">{new Date(quotation.created_at).toLocaleDateString()}</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-xs font-medium tracking-wider text-muted-foreground uppercase">Last Updated</span>
                                    <span className="font-medium">{new Date(quotation.updated_at).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Status Management */}
                    <Card className="border shadow-sm">
                        <CardContent className="pt-6">
                            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                                <div className="space-y-1">
                                    <h4 className="text-lg font-bold text-foreground">Quotation Status</h4>
                                    <p className="text-sm text-muted-foreground">Manage quotation status and download PDF</p>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    <Button
                                        onClick={() => window.open(`/quotation/${quotation.id}/pdf`, '_blank')}
                                        variant="outline"
                                        className="gap-2 hover:bg-primary/10 hover:text-primary"
                                        disabled={quotation.quotation_status !== 'approved'}
                                    >
                                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                            />
                                        </svg>
                                        Download PDF
                                    </Button>

                                    {quotation.quotation_status !== 'approved' && (
                                        <Button
                                            onClick={() => handleStatusUpdate('approved')}
                                            disabled={isUpdating}
                                            className="gap-2 bg-emerald-600 text-white hover:bg-emerald-700"
                                        >
                                            {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                                            Approve
                                        </Button>
                                    )}

                                    {quotation.quotation_status !== 'rejected' && (
                                        <Button
                                            onClick={() => handleStatusUpdate('rejected')}
                                            disabled={isUpdating}
                                            variant="destructive"
                                            className="gap-2"
                                        >
                                            {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                                            Reject
                                        </Button>
                                    )}

                                    {quotation.quotation_status !== 'pending' && (
                                        <Button
                                            onClick={() => handleStatusUpdate('pending' as 'pending' | 'approved' | 'rejected')}
                                            disabled={isUpdating}
                                            variant="outline"
                                            className="gap-2"
                                        >
                                            {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Clock className="h-4 w-4" />}
                                            Set Pending
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
