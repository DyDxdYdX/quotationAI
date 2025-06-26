import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { router } from '@inertiajs/react';
import { useState } from 'react';
import { ArrowLeft, CheckCircle, XCircle, Clock, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

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
    quotation_message: any;
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
        router.put(`/quotation/${quotation.id}`, {
            quotation_status: status
        }, {
            onSuccess: () => {
                // Status updated successfully
            },
            onFinish: () => {
                setIsUpdating(false);
            }
        });
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending':
                return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100';
            case 'approved':
                return 'bg-green-100 text-green-800 hover:bg-green-100';
            case 'rejected':
                return 'bg-red-100 text-red-800 hover:bg-red-100';
            default:
                return 'bg-gray-100 text-gray-800 hover:bg-gray-100';
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`View Quotation #${quotation.id}`} />
            
            <div className="m-4">
                <div className="flex items-center gap-4 mb-8">
                    <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => router.get('/manage-quotation')}
                        className="h-9 w-9"
                    >
                        <ArrowLeft className="w-4 h-4" />
                    </Button>
                    <div className="flex-1">
                        <div className="flex items-center gap-4">
                            <h1 className="text-3xl font-bold tracking-tight">Quotation #{quotation.id}</h1>
                            <Badge className={getStatusColor(quotation.quotation_status)}>
                                {quotation.quotation_status.charAt(0).toUpperCase() + quotation.quotation_status.slice(1)}
                            </Badge>
                        </div>
                        <p className="text-muted-foreground mt-2">View quotation details and manage status</p>
                    </div>
                </div>

                <div className="space-y-8">
                    <Card className="border-border/50">
                        <CardHeader>
                            <CardTitle className="text-lg font-semibold">Client Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {quotation.client && (
                                <div className="bg-muted/50 border rounded-lg p-4">
                                    <h4 className="font-semibold text-sm mb-3">Client Details</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                        <div className="flex flex-col">
                                            <span className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Company</span>
                                            <span className="font-medium">{quotation.client.company_name}</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Supervisor</span>
                                            <span className="font-medium">{quotation.client.supervisor_name}</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Email</span>
                                            <span className="font-medium">{quotation.client.company_email}</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Phone</span>
                                            <span className="font-medium">{quotation.client.company_phone_number}</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="border-border/50">
                        <CardHeader>
                            <CardTitle className="text-lg font-semibold">Service Requirements</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <Label className="text-sm font-medium">Service Type</Label>
                                <div className="p-3 bg-muted/50 rounded-md">
                                    <span className="font-medium">
                                        {serviceTypeLabels[quotation.quotation_request?.service_type as keyof typeof serviceTypeLabels] || 'N/A'}
                                    </span>
                                </div>
                            </div>

                            {quotation.quotation_request?.problem && (
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium">Problem Description</Label>
                                    <div className="p-3 bg-muted/50 rounded-md text-sm">
                                        {quotation.quotation_request.problem}
                                    </div>
                                </div>
                            )}

                            {quotation.quotation_request?.solution && (
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium">Proposed Solution</Label>
                                    <div className="p-3 bg-muted/50 rounded-md text-sm">
                                        {quotation.quotation_request.solution}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="border-border/50">
                        <CardHeader>
                            <CardTitle className="text-lg font-semibold">AI Generated Quotation</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-4">
                                <Label className="text-sm font-medium">Quotation Details</Label>
                                
                                {(() => {
                                    try {
                                        const quotationData = typeof quotation.quotation_message === 'string' 
                                            ? JSON.parse(quotation.quotation_message)
                                            : quotation.quotation_message;
                                        
                                        return (
                                            <div className="space-y-4">
                                                {/* Project Overview */}
                                                {quotationData.project_overview && (
                                                    <div className="border rounded-lg p-4">
                                                        <h4 className="font-semibold text-sm mb-2">Project Overview</h4>
                                                        <p className="text-sm text-muted-foreground">{quotationData.project_overview}</p>
                                                    </div>
                                                )}

                                                {/* Timeline */}
                                                {quotationData.timeline && (
                                                    <div className="border rounded-lg p-4">
                                                        <h4 className="font-semibold text-sm mb-2">Timeline</h4>
                                                        <p className="text-sm text-muted-foreground">{quotationData.timeline}</p>
                                                    </div>
                                                )}

                                                {/* Cost Breakdown */}
                                                {quotationData.cost_breakdown && (
                                                    <div className="border rounded-lg p-4">
                                                        <h4 className="font-semibold text-sm mb-3">Cost Breakdown</h4>
                                                        <div className="overflow-x-auto">
                                                            <table className="w-full text-sm">
                                                                <thead>
                                                                    <tr className="border-b">
                                                                        <th className="text-left py-2 px-3 font-medium">Item</th>
                                                                        <th className="text-right py-2 px-3 font-medium">Cost</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    {Object.entries(quotationData.cost_breakdown).map(([key, value]) => (
                                                                        <tr key={key} className="border-b border-muted">
                                                                            <td className="py-2 px-3 capitalize">{key.replace(/_/g, ' ')}</td>
                                                                            <td className="py-2 px-3 text-right font-medium">{String(value)}</td>
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Deliverables */}
                                                {quotationData.deliverables && Array.isArray(quotationData.deliverables) && (
                                                    <div className="border rounded-lg p-4">
                                                        <h4 className="font-semibold text-sm mb-3">Deliverables</h4>
                                                        <ul className="space-y-1 text-sm text-muted-foreground">
                                                            {quotationData.deliverables.map((item: string, index: number) => (
                                                                <li key={index} className="flex items-start gap-2">
                                                                    <span className="text-primary mt-1">•</span>
                                                                    <span>{item}</span>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}

                                                {/* Payment Terms */}
                                                {quotationData.payment_terms && (
                                                    <div className="border rounded-lg p-4">
                                                        <h4 className="font-semibold text-sm mb-2">Payment Terms</h4>
                                                        <p className="text-sm text-muted-foreground">{quotationData.payment_terms}</p>
                                                    </div>
                                                )}

                                                {/* Support */}
                                                {quotationData.support && (
                                                    <div className="border rounded-lg p-4">
                                                        <h4 className="font-semibold text-sm mb-2">Support & Maintenance</h4>
                                                        <p className="text-sm text-muted-foreground">{quotationData.support}</p>
                                                    </div>
                                                )}

                                                {/* AI Generated Badge */}
                                                {quotationData.ai_generated && (
                                                    <div className="border rounded-lg p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
                                                        <div className="flex items-center gap-2">
                                                            <div className="h-2 w-2 bg-blue-500 rounded-full animate-pulse"></div>
                                                            <span className="text-xs font-medium text-blue-700">AI Generated Quotation</span>
                                                        </div>
                                                        {quotationData.generated_at && (
                                                            <p className="text-xs text-blue-600 mt-1">
                                                                Generated: {new Date(quotationData.generated_at).toLocaleString()}
                                                            </p>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    } catch (error) {
                                        // Fallback for non-JSON data
                                        return (
                                            <div className="p-4 bg-muted/50 rounded-md text-sm whitespace-pre-wrap">
                                                {typeof quotation.quotation_message === 'string' 
                                                    ? quotation.quotation_message 
                                                    : JSON.stringify(quotation.quotation_message, null, 2)
                                                }
                                            </div>
                                        );
                                    }
                                })()}
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div className="flex flex-col">
                                    <span className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Created Date</span>
                                    <span className="font-medium">{new Date(quotation.created_at).toLocaleDateString()}</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Last Updated</span>
                                    <span className="font-medium">{new Date(quotation.updated_at).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Status Management */}
                    <Card className="border-border/50 bg-gradient-to-r from-background to-muted/30">
                        <CardContent>
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                <div className="space-y-1">
                                    <h4 className="font-semibold text-lg">Quotation Status</h4>
                                </div>
                                <div className="flex gap-3">
                                    <Button 
                                        onClick={() => window.open(`/quotation/${quotation.id}/pdf`, '_blank')}
                                        variant="outline"
                                        className="gap-2"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                        Download PDF
                                    </Button>
                                    
                                    {quotation.quotation_status !== 'approved' && (
                                        <Button 
                                            onClick={() => handleStatusUpdate('approved')}
                                            disabled={isUpdating}
                                            className="gap-2 bg-green-600 hover:bg-green-700"
                                        >
                                            {isUpdating ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <CheckCircle className="w-4 h-4" />
                                            )}
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
                                            {isUpdating ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <XCircle className="w-4 h-4" />
                                            )}
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
                                            {isUpdating ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <Clock className="w-4 h-4" />
                                            )}
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
