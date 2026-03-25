import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from '@/components/ui/pagination';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { AlertTriangle, CheckCircle, EyeIcon, FileDown, MoreVertical, PlusIcon, SearchIcon, TrashIcon, X, XCircle, PencilIcon } from 'lucide-react';
import { useEffect, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Manage Invoices',
        href: '/manage-invoices',
    },
];

interface Client {
    id: number;
    supervisor_name: string;
    company_name: string;
    company_email: string;
    company_phone_number: string;
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
    client?: Client;
    quotation?: {
        id: number;
        quotation_number: string;
    };
}

interface PaginatedInvoices {
    data: Invoice[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
    links: Array<{
        url: string | null;
        label: string;
        active: boolean;
    }>;
}

export default function InvoiceIndex({
    invoices,
    per_page_request = '10',
    search_request = '',
}: {
    invoices?: PaginatedInvoices;
    per_page_request?: string;
    search_request?: string;
}) {
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [search, setSearch] = useState(search_request);
    const [searchInput, setSearchInput] = useState(search_request);

    // Update search input when search_request prop changes
    useEffect(() => {
        setSearch(search_request);
        setSearchInput(search_request);
    }, [search_request]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setSearch(searchInput);
        router.get(
            '/manage-invoices',
            {
                search: searchInput,
                per_page: per_page_request,
                page: 1,
            },
            { preserveState: false },
        );
    };

    const handleClearSearch = () => {
        setSearchInput('');
        setSearch('');
        router.get(
            '/manage-invoices',
            {
                per_page: per_page_request,
                page: 1,
            },
            { preserveState: false },
        );
    };

    const invoiceSummary = [
        {
            title: 'Total Invoices',
            value: invoices?.total || 0,
        },
        {
            title: 'Pending',
            value: invoices?.data?.filter((i) => i.status === 'pending').length || 0,
        },
        {
            title: 'Paid',
            value: invoices?.data?.filter((i) => i.status === 'paid').length || 0,
        },
        {
            title: 'Void',
            value: invoices?.data?.filter((i) => i.status === 'void').length || 0,
        },
    ];

    const handleDelete = (invoice: Invoice) => {
        setSelectedInvoice(invoice);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = () => {
        if (!selectedInvoice) return;

        setIsSubmitting(true);
        router.delete(`/invoices/${selectedInvoice.id}`, {
            onSuccess: () => {
                setDeleteDialogOpen(false);
                setSelectedInvoice(null);
            },
            onFinish: () => {
                setIsSubmitting(false);
            },
        });
    };

    const handleStatusUpdate = (invoice: Invoice, status: 'paid' | 'void' | 'pending') => {
        setIsSubmitting(true);
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
                    setIsSubmitting(false);
                },
            },
        );
    };

    const handleDownloadPdf = async (invoice: Invoice) => {
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

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Manage Invoices" />

            {/* Invoice Summary Cards */}
            <div className="grid grid-cols-1 gap-6 px-6 py-4 md:grid-cols-2 lg:grid-cols-4">
                {invoiceSummary.map((summary, index) => {
                    const colors = [
                        'from-blue-500 to-blue-600',
                        'from-amber-500 to-amber-600',
                        'from-emerald-500 to-emerald-600',
                        'from-rose-500 to-rose-600',
                    ];
                    return (
                        <Card key={index} className="overflow-hidden border-0 shadow-md transition-shadow duration-300 hover:shadow-lg">
                            <div className={`h-1.5 bg-gradient-to-r ${colors[index % colors.length]}`} />
                            <CardHeader className="pb-2">
                                <p className="text-sm font-medium tracking-wide text-muted-foreground uppercase">{summary.title}</p>
                            </CardHeader>
                            <CardContent>
                                <p className="text-3xl font-bold text-foreground">{summary.value}</p>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* Invoice Table */}
            <div className="px-6 pb-6">
                <Card className="border shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between border-b bg-muted/30">
                        <div>
                            <h2 className="text-2xl font-bold text-foreground">Invoices</h2>
                            <p className="mt-1 text-sm text-muted-foreground">Manage and track all invoices</p>
                        </div>
                        <Button
                            onClick={() => router.get('/invoices/create')}
                            className="flex items-center gap-2 bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
                        >
                            <PlusIcon className="h-4 w-4" />
                            Create New Invoice
                        </Button>
                    </CardHeader>
                    <CardContent className="p-0">
                        {/* Search Bar */}
                        <div className="border-b px-4 py-4">
                            <form onSubmit={handleSearch} className="flex gap-2">
                                <div className="relative flex-1">
                                    <SearchIcon className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        type="text"
                                        placeholder="Search invoices by ID, client name, or status..."
                                        value={searchInput}
                                        onChange={(e) => setSearchInput(e.target.value)}
                                        className="pr-9 pl-9"
                                    />
                                    {searchInput && (
                                        <button
                                            type="button"
                                            onClick={handleClearSearch}
                                            className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    )}
                                </div>
                                <Button type="submit" variant="default" className="gap-2">
                                    <SearchIcon className="h-4 w-4" />
                                    Search
                                </Button>
                                {search && (
                                    <Button type="button" variant="outline" onClick={handleClearSearch} className="gap-2">
                                        Clear
                                    </Button>
                                )}
                            </form>
                            {search && invoices && (
                                <p className="mt-2 text-sm text-muted-foreground">
                                    Showing results for: <span className="font-medium text-foreground">&quot;{search}&quot;</span> ({invoices.total}{' '}
                                    {invoices.total === 1 ? 'result' : 'results'})
                                </p>
                            )}
                        </div>
                        {!invoices?.data || invoices.data.length === 0 ? (
                            <div className="py-16 text-center">
                                <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-muted">
                                    <PlusIcon className="h-12 w-12 text-muted-foreground" />
                                </div>
                                <p className="mb-2 text-lg font-medium text-foreground">No invoices found</p>
                                <p className="mb-6 text-sm text-muted-foreground">Get started by creating a new invoice</p>
                                <Button onClick={() => router.get('/invoices/create')} className="gap-2">
                                    <PlusIcon className="h-4 w-4" />
                                    Create New Invoice
                                </Button>
                            </div>
                        ) : (
                            <>
                                <div className="overflow-x-auto px-4">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="border-b bg-muted/50 hover:bg-muted/50">
                                                <TableHead className="h-12 text-sm font-semibold text-foreground">Invoice ID</TableHead>
                                                <TableHead className="h-12 text-sm font-semibold text-foreground">Client</TableHead>
                                                <TableHead className="h-12 text-sm font-semibold text-foreground">Date</TableHead>
                                                <TableHead className="h-12 text-sm font-semibold text-foreground">Due Date</TableHead>
                                                <TableHead className="h-12 text-sm font-semibold text-foreground">Amount</TableHead>
                                                <TableHead className="h-12 text-sm font-semibold text-foreground">Status</TableHead>
                                                <TableHead className="h-12 text-right text-sm font-semibold text-foreground">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {invoices.data.map((invoice) => (
                                                <TableRow key={invoice.id} className="border-b transition-colors duration-150 hover:bg-muted/30">
                                                    <TableCell className="py-4">
                                                        <span className="font-medium text-foreground">
                                                            INV-{invoice.invoice_number}
                                                        </span>
                                                        {invoice.quotation && (
                                                            <div className="text-xs text-muted-foreground">
                                                                Ref: QTN-{invoice.quotation.quotation_number}
                                                            </div>
                                                        )}
                                                        {invoice.phase_name && (
                                                            <div className="text-xs text-blue-700 dark:text-blue-400">
                                                                Phase: {invoice.phase_name} ({Number(invoice.phase_percentage).toLocaleString(undefined, {
                                                                    minimumFractionDigits: 2,
                                                                    maximumFractionDigits: 2,
                                                                })}
                                                                %)
                                                            </div>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="py-4">
                                                        <span className="font-medium text-foreground">{invoice.client?.company_name || 'N/A'}</span>
                                                    </TableCell>
                                                    <TableCell className="py-4">
                                                        <span className="text-sm text-muted-foreground">
                                                            {new Date(invoice.invoice_date).toLocaleDateString()}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="py-4">
                                                        <span className="text-sm text-muted-foreground">
                                                            {new Date(invoice.due_date).toLocaleDateString()}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="py-4">
                                                        <span className="font-medium text-foreground">
                                                            {invoice.currency} {Number(invoice.total_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="py-4">
                                                        <Badge
                                                            className={`${getStatusColor(invoice.status)} border px-3 py-1 text-xs font-semibold`}
                                                        >
                                                            {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="py-4">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => router.get(`/invoices/${invoice.id}`)}
                                                                className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary"
                                                                title="View invoice"
                                                            >
                                                                <EyeIcon className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => router.get(`/invoices/${invoice.id}/edit`)}
                                                                className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary"
                                                                title="Edit invoice"
                                                            >
                                                                <PencilIcon className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => handleDownloadPdf(invoice)}
                                                                className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary"
                                                                title="Download PDF"
                                                            >
                                                                <FileDown className="h-4 w-4" />
                                                            </Button>
                                                            {invoice.status === 'pending' && (
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => handleStatusUpdate(invoice, 'paid')}
                                                                    disabled={isSubmitting}
                                                                    className="h-8 w-8 p-0 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 dark:text-emerald-500 dark:hover:bg-emerald-950/30"
                                                                    title="Mark as Paid"
                                                                >
                                                                    <CheckCircle className="h-4 w-4" />
                                                                </Button>
                                                            )}
                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger asChild>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        className="h-8 w-8 p-0 hover:bg-muted"
                                                                        title="More actions"
                                                                    >
                                                                        <MoreVertical className="h-4 w-4" />
                                                                        <span className="sr-only">More actions</span>
                                                                    </Button>
                                                                </DropdownMenuTrigger>
                                                                <DropdownMenuContent align="end" className="w-48">
                                                                     {invoice.status !== 'void' && (
                                                                         <DropdownMenuItem
                                                                            onClick={() => handleStatusUpdate(invoice, 'void')}
                                                                            disabled={isSubmitting}
                                                                            className="gap-2 text-rose-600"
                                                                        >
                                                                            <XCircle className="h-4 w-4" />
                                                                            Void Invoice
                                                                        </DropdownMenuItem>
                                                                    )}
                                                                    <DropdownMenuItem
                                                                        onClick={() => handleDelete(invoice)}
                                                                        disabled={isSubmitting}
                                                                        variant="destructive"
                                                                        className="gap-2"
                                                                    >
                                                                        <TrashIcon className="h-4 w-4" />
                                                                        Delete Invoice
                                                                    </DropdownMenuItem>
                                                                </DropdownMenuContent>
                                                            </DropdownMenu>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>

                                {/* Pagination */}
                                <div className="border-t bg-muted/30 px-6 py-4">
                                    <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm text-muted-foreground">Show</span>
                                            <Select
                                                value={per_page_request.toString()}
                                                onValueChange={(value) => {
                                                    router.get(
                                                        '/manage-invoices',
                                                        {
                                                            per_page: value,
                                                            page: 1,
                                                            search: search,
                                                        },
                                                        { preserveState: true },
                                                    );
                                                }}
                                            >
                                                <SelectTrigger className="h-8 w-20">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="10">10</SelectItem>
                                                    <SelectItem value="25">25</SelectItem>
                                                    <SelectItem value="50">50</SelectItem>
                                                    <SelectItem value="all">All</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <span className="text-sm text-muted-foreground">entries</span>
                                        </div>
                                        <div className="text-sm text-muted-foreground">
                                            Showing <span className="font-medium text-foreground">{invoices?.from || 0}</span> to{' '}
                                            <span className="font-medium text-foreground">{invoices?.to || 0}</span> of{' '}
                                            <span className="font-medium text-foreground">{invoices?.total || 0}</span> results
                                        </div>
                                    </div>
                                    <div className="flex justify-center">
                                        <Pagination>
                                            <PaginationContent>
                                                <PaginationItem>
                                                    <PaginationPrevious
                                                        href="#"
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            if (invoices && invoices.current_page > 1) {
                                                                router.get(
                                                                   '/manage-invoices',
                                                                    {
                                                                        page: invoices.current_page - 1,
                                                                        per_page: per_page_request,
                                                                        search: search,
                                                                    },
                                                                    { preserveState: true },
                                                                );
                                                            }
                                                        }}
                                                        className={
                                                            !invoices || invoices.current_page <= 1 ? 'pointer-events-none opacity-50' : ''
                                                        }
                                                    />
                                                </PaginationItem>

                                                {invoices?.links?.slice(1, -1).map((link, index) => {
                                                    if (link.label === '...') {
                                                        return (
                                                            <PaginationItem key={index}>
                                                                <PaginationEllipsis />
                                                            </PaginationItem>
                                                        );
                                                    }

                                                    const pageNumber = parseInt(link.label);

                                                    return (
                                                        <PaginationItem key={index}>
                                                            <PaginationLink
                                                                href="#"
                                                                onClick={(e) => {
                                                                    e.preventDefault();
                                                                    router.get(
                                                                        '/manage-invoices',
                                                                        {
                                                                            page: pageNumber,
                                                                            per_page: per_page_request,
                                                                            search: search,
                                                                        },
                                                                        { preserveState: true },
                                                                    );
                                                                }}
                                                                isActive={link.active}
                                                            >
                                                                {link.label}
                                                            </PaginationLink>
                                                        </PaginationItem>
                                                    );
                                                })}

                                                <PaginationItem>
                                                    <PaginationNext
                                                        href="#"
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            if (invoices.current_page < invoices.last_page) {
                                                                router.get(
                                                                    '/manage-invoices',
                                                                    {
                                                                        page: invoices.current_page + 1,
                                                                        per_page: per_page_request,
                                                                        search: search,
                                                                    },
                                                                    { preserveState: true },
                                                                );
                                                            }
                                                        }}
                                                        className={
                                                            invoices.current_page >= invoices.last_page ? 'pointer-events-none opacity-50' : ''
                                                        }
                                                    />
                                                </PaginationItem>
                                            </PaginationContent>
                                        </Pagination>
                                    </div>
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold">Confirm Deletion</DialogTitle>
                    </DialogHeader>
                    <Alert variant="destructive" className="border-destructive/50 bg-destructive/10">
                        <AlertTriangle className="h-4 w-4 text-destructive" />
                        <AlertTitle className="font-semibold">Warning</AlertTitle>
                        <AlertDescription className="text-sm">
                            This action cannot be undone. This will permanently delete the invoice.
                        </AlertDescription>
                    </Alert>
                    {selectedInvoice && (
                        <div className="py-4">
                            <p className="text-sm">
                                Are you sure you want to delete invoice <strong>INV-{selectedInvoice.invoice_number}</strong>?
                            </p>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={isSubmitting}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={confirmDelete} disabled={isSubmitting}>
                            {isSubmitting ? 'Deleting...' : 'Delete Invoice'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
