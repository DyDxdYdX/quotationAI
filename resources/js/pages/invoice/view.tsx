import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, CheckCircle, Clock, DollarSign, Download, FileText, Loader2, Mail, Phone, XCircle, PencilIcon } from 'lucide-react';
import { useState } from 'react';

interface Client {
    id: number;
    supervisor_name: string;
    company_name: string;
    company_email: string;
    company_phone_number: string;
    company_address?: string;
    company_registration_number?: string;
}

interface InvoiceItem {
    id: number;
    description: string;
    quantity: number;
    unit_price: number | string;
    amount: number | string;
}

interface Invoice {
    id: number;
    client_id: number;
    quotation_id: number | null;
    phase_key: string | null;
    phase_name: string | null;
    phase_description: string | null;
    phase_percentage: number | string | null;
    invoice_number: string;
    invoice_date: string;
    due_date: string;
    status: 'pending' | 'paid' | 'void';
    currency: string;
    total_amount: number | string;
    notes: string | null;
    created_at: string;
    updated_at: string;
    client: Client;
    items: InvoiceItem[];
    quotation?: {
        id: number;
        quotation_number: string;
    };
}

export default function ViewInvoice({ invoice }: { invoice: Invoice }) {
    const [isUpdating, setIsUpdating] = useState(false);

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Manage Invoices',
            href: '/manage-invoices',
        },
        {
            title: `Invoice INV-${invoice.invoice_number}`,
            href: `/invoices/${invoice.id}`,
        },
    ];

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending':
                return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800/50';
            case 'paid':
                return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800/50';
            case 'void':
                return 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-800/50';
            default:
                return 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800/50 dark:text-slate-300 dark:border-slate-700';
        }
    };

    const handleStatusUpdate = (status: 'pending' | 'paid' | 'void') => {
        setIsUpdating(true);
        router.put(
            `/invoices/${invoice.id}`,
            {
                status: status,
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

    const handleDownloadPdf = async () => {
         try {
            const response = await fetch(`/invoices/${invoice.id}/pdf`, {
                credentials: 'include',
            });
            if (!response.ok) throw new Error('Failed to generate PDF');
            
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `Invoice_INV-${invoice.invoice_number}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error downloading PDF:', error);
            window.location.href = `/invoices/${invoice.id}/pdf`;
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Invoice INV-${invoice.invoice_number}`} />

            <div className="px-6 py-4">
                <div className="mb-6 flex items-center gap-4">
                    <Button variant="outline" size="sm" onClick={() => router.get('/manage-invoices')} className="h-9 w-9">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div className="flex-1">
                        <div className="flex items-center gap-4">
                            <h1 className="text-3xl font-bold tracking-tight text-foreground">
                                Invoice INV-{invoice.invoice_number}
                            </h1>
                            <Badge className={`${getStatusColor(invoice.status)} border px-3 py-1 text-xs font-semibold`}>
                                {invoice.status.toUpperCase()}
                            </Badge>
                        </div>
                        <div className="mt-2 flex items-center gap-4 text-sm text-muted-foreground">
                            <span>View invoice details and manage status</span>
                            {invoice.quotation && (
                                <Link href={`/quotation/${invoice.quotation_id}`} className="flex items-center gap-1 hover:text-primary hover:underline">
                                    <FileText className="h-3 w-3" />
                                    Reference: QTN-{invoice.quotation.quotation_number}
                                </Link>
                            )}
                        </div>
                        {invoice.phase_name && (
                            <p className="mt-1 text-sm text-blue-700 dark:text-blue-400">
                                Phase Billing: {invoice.phase_name} ({Number(invoice.phase_percentage).toLocaleString(undefined, {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                })}
                                %)
                            </p>
                        )}
                    </div>
                </div>

                <div className="space-y-6">
                    {/* Client Information */}
                    <Card className="border shadow-sm">
                        <CardHeader className="border-b bg-muted/30">
                            <CardTitle className="text-xl font-bold">Client Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="rounded-lg border bg-muted/50 p-4">
                                <h4 className="mb-3 text-sm font-semibold">Client Details</h4>
                                <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
                                    <div className="flex flex-col">
                                        <span className="text-xs font-medium tracking-wider text-muted-foreground uppercase">Company</span>
                                        <span className="font-medium">{invoice.client.company_name}</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
                                            Company Registration Number
                                        </span>
                                        <span className="font-medium">{invoice.client.company_registration_number || 'N/A'}</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-xs font-medium tracking-wider text-muted-foreground uppercase">Supervisor</span>
                                        <span className="font-medium">{invoice.client.supervisor_name}</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-xs font-medium tracking-wider text-muted-foreground uppercase">Email</span>
                                        <span className="font-medium">{invoice.client.company_email}</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-xs font-medium tracking-wider text-muted-foreground uppercase">Phone</span>
                                        <span className="font-medium">{invoice.client.company_phone_number}</span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Invoice Dates */}
                    <Card className="border shadow-sm">
                        <CardHeader className="border-b bg-muted/30">
                            <CardTitle className="text-xl font-bold">Invoice Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
                                <div className="flex flex-col">
                                    <span className="text-xs font-medium tracking-wider text-muted-foreground uppercase">Invoice Date</span>
                                    <span className="font-medium">
                                        {new Date(invoice.invoice_date).toLocaleDateString(undefined, { dateStyle: 'long' })}
                                    </span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-xs font-medium tracking-wider text-muted-foreground uppercase">Due Date</span>
                                    <span className="font-medium text-red-600">
                                        {new Date(invoice.due_date).toLocaleDateString(undefined, { dateStyle: 'long' })}
                                    </span>
                                </div>
                                {invoice.phase_name && (
                                    <div className="flex flex-col md:col-span-2">
                                        <span className="text-xs font-medium tracking-wider text-muted-foreground uppercase">Billed Milestone</span>
                                        <span className="font-medium">{invoice.phase_name}</span>
                                        {invoice.phase_description && (
                                            <span className="text-sm text-muted-foreground">{invoice.phase_description}</span>
                                        )}
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Line Items */}
                    <Card className="border shadow-sm">
                        <CardHeader className="border-b bg-muted/30">
                            <CardTitle className="text-xl font-bold flex items-center gap-2">
                                <DollarSign className="h-5 w-5" />
                                Items & Breakdown
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6">
                            {/* Custom Table matching QuotationRenderer Cost Breakdown style */}
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-border">
                                            <th className="bg-muted/50 px-4 py-3 text-left font-medium">Item</th>
                                            <th className="bg-muted/50 px-4 py-3 text-left font-medium">Description</th>
                                            <th className="bg-muted/50 px-4 py-3 text-right font-medium">Cost</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {invoice.items.map((item) => {
                                            const [title, ...descParts] = item.description.includes(':') 
                                                ? item.description.split(':') 
                                                : [item.description];
                                            const description = descParts.join(':').trim();

                                            return (
                                                <tr key={item.id} className="border-b border-border/50 hover:bg-muted/30">
                                                    <td className="px-4 py-3 font-medium capitalize align-top w-1/4">
                                                        {title.trim()}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-muted-foreground align-top">
                                                        {description || '-'}
                                                    </td>
                                                    <td className="px-4 py-3 text-right font-semibold align-top whitespace-nowrap">
                                                        {invoice.currency} {Number(item.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                        <tr className="border-t-2 border-primary bg-primary/5 font-bold">
                                            <td colSpan={2} className="px-4 py-4">
                                                Total Project Cost
                                            </td>
                                            <td className="px-4 py-4 text-right text-lg text-primary">
                                                {invoice.currency} {Number(invoice.total_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Status Management (Action Bar) */}
                    <Card className="border shadow-sm">
                        <CardContent className="pt-6">
                            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                                <div className="space-y-1">
                                    <h4 className="text-lg font-bold text-foreground">Invoice Actions</h4>
                                    <p className="text-sm text-muted-foreground">Manage invoice status and download</p>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    <Button
                                        onClick={() => router.get(`/invoices/${invoice.id}/edit`)}
                                        variant="outline"
                                        className="gap-2 hover:bg-primary/10 hover:text-primary"
                                    >
                                        <PencilIcon className="h-4 w-4" />
                                        Edit Invoice
                                    </Button>
                                    <Button
                                        onClick={handleDownloadPdf}
                                        variant="outline"
                                        className="gap-2 hover:bg-primary/10 hover:text-primary"
                                    >
                                        <Download className="h-4 w-4" />
                                        Download PDF
                                    </Button>

                                    {/* Status Controls */}
                                    {invoice.status !== 'paid' && (
                                        <Button
                                            onClick={() => handleStatusUpdate('paid')}
                                            disabled={isUpdating}
                                            className="gap-2 bg-emerald-600 text-white hover:bg-emerald-700"
                                        >
                                            {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                                            Mark as Paid
                                        </Button>
                                    )}

                                    {invoice.status !== 'void' && (
                                        <Button
                                            onClick={() => handleStatusUpdate('void')}
                                            disabled={isUpdating}
                                            variant="destructive"
                                            className="gap-2"
                                        >
                                            {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                                            Void Invoice
                                        </Button>
                                    )}

                                    {invoice.status !== 'pending' && (
                                        <Button
                                            onClick={() => handleStatusUpdate('pending')}
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
