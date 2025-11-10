import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { AlertTriangle, CheckCircle, EyeIcon, FileDown, MoreVertical, PencilIcon, PlusIcon, SearchIcon, TrashIcon, X, XCircle } from 'lucide-react';
import { useState, useEffect } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Manage Quotation',
        href: '/manage-quotation',
    },
];

const serviceTypeLabels = {
    web_development: 'Web Development',
    mobile_development: 'Mobile Development',
    desktop_development: 'Desktop Development',
    ai_development: 'AI Development',
    graphic_design: 'Graphic Design',
    digital_marketing: 'Digital Marketing',
};

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

interface PaginatedQuotations {
    data: Quotation[];
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

export default function Quotation({
    quotations,
    per_page_request = '10',
    search_request = '',
    clients = [],
    quotation_requests = [],
}: {
    quotations?: PaginatedQuotations;
    per_page_request?: string;
    search_request?: string;
    clients?: Client[];
    quotation_requests?: QuotationRequest[];
}) {
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null);
    const [createForm, setCreateForm] = useState({
        client_id: '',
        quotation_request_id: '',
        quotation_message: '',
        quotation_status: 'pending' as 'pending' | 'approved' | 'rejected',
    });
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
            window.location.pathname,
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
            window.location.pathname,
            {
                per_page: per_page_request,
                page: 1,
            },
            { preserveState: false },
        );
    };

    const quotationSummary = [
        {
            title: 'Total Quotations',
            value: quotations?.total || 0,
        },
        {
            title: 'Pending Quotations',
            value: quotations?.data?.filter((q) => q.quotation_status === 'pending').length || 0,
        },
        {
            title: 'Approved Quotations',
            value: quotations?.data?.filter((q) => q.quotation_status === 'approved').length || 0,
        },
        {
            title: 'Rejected Quotations',
            value: quotations?.data?.filter((q) => q.quotation_status === 'rejected').length || 0,
        },
    ];

    const handleDelete = (quotation: Quotation) => {
        setSelectedQuotation(quotation);
        setDeleteDialogOpen(true);
    };

    const submitCreate = (e: React.FormEvent) => {
        e.preventDefault();

        setIsSubmitting(true);
        router.post('/quotation', createForm, {
            onSuccess: () => {
                setCreateDialogOpen(false);
                setCreateForm({
                    client_id: '',
                    quotation_request_id: '',
                    quotation_message: '',
                    quotation_status: 'pending',
                });
            },
            onFinish: () => {
                setIsSubmitting(false);
            },
        });
    };

    const confirmDelete = () => {
        if (!selectedQuotation) return;

        setIsSubmitting(true);
        router.delete(`/quotation/${selectedQuotation.id}`, {
            onSuccess: () => {
                setDeleteDialogOpen(false);
                setSelectedQuotation(null);
            },
            onFinish: () => {
                setIsSubmitting(false);
            },
        });
    };

    const handleStatusUpdate = (quotation: Quotation, status: 'approved' | 'rejected') => {
        setIsSubmitting(true);
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
                    setIsSubmitting(false);
                },
            },
        );
    };

    const handleDownloadPdf = (quotation: Quotation) => {
        // Only allow download if status is approved
        if (quotation.quotation_status === 'approved') {
            window.open(`/quotation/${quotation.id}/pdf`, '_blank');
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

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Manage Quotation" />

            {/* Quotation Summary Cards */}
            <div className="grid grid-cols-1 gap-6 px-6 py-4 md:grid-cols-2 lg:grid-cols-4">
                {quotationSummary.map((summary, index) => {
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

            {/* Quotation Table */}
            <div className="px-6 pb-6">
                <Card className="border shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between border-b bg-muted/30">
                        <div>
                            <h2 className="text-2xl font-bold text-foreground">Quotations</h2>
                            <p className="mt-1 text-sm text-muted-foreground">Manage and track all quotation requests</p>
                        </div>
                        <Button
                            onClick={() => router.get('/quotation/create')}
                            className="flex items-center gap-2 bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
                        >
                            <PlusIcon className="h-4 w-4" />
                            Generate New Quotation
                        </Button>
                    </CardHeader>
                    <CardContent className="p-0">
                        {/* Search Bar */}
                        <div className="border-b px-4 py-4">
                            <form onSubmit={handleSearch} className="flex gap-2">
                                <div className="relative flex-1">
                                    <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        type="text"
                                        placeholder="Search quotations by ID, client name, service type, or status..."
                                        value={searchInput}
                                        onChange={(e) => setSearchInput(e.target.value)}
                                        className="pl-9 pr-9"
                                    />
                                    {searchInput && (
                                        <button
                                            type="button"
                                            onClick={handleClearSearch}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
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
                            {search && quotations && (
                                <p className="mt-2 text-sm text-muted-foreground">
                                    Showing results for: <span className="font-medium text-foreground">&quot;{search}&quot;</span> ({quotations.total} {quotations.total === 1 ? 'result' : 'results'})
                                </p>
                            )}
                        </div>
                        {!quotations?.data || quotations.data.length === 0 ? (
                            <div className="py-16 text-center">
                                <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-muted">
                                    <PlusIcon className="h-12 w-12 text-muted-foreground" />
                                </div>
                                <p className="mb-2 text-lg font-medium text-foreground">No quotations found</p>
                                <p className="mb-6 text-sm text-muted-foreground">Get started by creating a new quotation</p>
                                <Button onClick={() => router.get('/quotation/create')} className="gap-2">
                                    <PlusIcon className="h-4 w-4" />
                                    Generate New Quotation
                                </Button>
                            </div>
                        ) : (
                            <>
                                <div className="overflow-x-auto px-4">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="border-b bg-muted/50 hover:bg-muted/50">
                                                <TableHead className="h-12 text-sm font-semibold text-foreground">Quotation ID</TableHead>
                                                <TableHead className="h-12 text-sm font-semibold text-foreground">Client</TableHead>
                                                <TableHead className="h-12 text-sm font-semibold text-foreground">Service Type</TableHead>
                                                <TableHead className="h-12 text-sm font-semibold text-foreground">Status</TableHead>
                                                <TableHead className="h-12 text-sm font-semibold text-foreground">Created Date</TableHead>
                                                <TableHead className="h-12 text-right text-sm font-semibold text-foreground">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {quotations.data.map((quotation) => (
                                                <TableRow key={quotation.id} className="border-b transition-colors duration-150 hover:bg-muted/30">
                                                    <TableCell className="py-4">
                                                        <span className="font-medium text-foreground">
                                                            QTN-{quotation.id.toString().padStart(6, '0')}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="py-4">
                                                        <span className="font-medium text-foreground">{quotation.client?.company_name || 'N/A'}</span>
                                                    </TableCell>
                                                    <TableCell className="py-4">
                                                        <span className="text-sm text-muted-foreground">
                                                            {serviceTypeLabels[
                                                                quotation.quotation_request?.service_type as keyof typeof serviceTypeLabels
                                                            ] || 'N/A'}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="py-4">
                                                        <Badge
                                                            className={`${getStatusColor(quotation.quotation_status)} border px-3 py-1 text-xs font-semibold`}
                                                        >
                                                            {quotation.quotation_status.charAt(0).toUpperCase() + quotation.quotation_status.slice(1)}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="py-4">
                                                        <span className="text-sm text-muted-foreground">
                                                            {new Date(quotation.created_at).toLocaleDateString()}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="py-4">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => router.get(`/quotation/${quotation.id}`)}
                                                                className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary"
                                                                title="View quotation"
                                                            >
                                                                <EyeIcon className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => router.get(`/quotation/${quotation.id}/edit`)}
                                                                className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary"
                                                                title="Edit quotation"
                                                            >
                                                                <PencilIcon className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => handleDownloadPdf(quotation)}
                                                                disabled={quotation.quotation_status !== 'approved' || isSubmitting}
                                                                className={`h-8 w-8 p-0 ${
                                                                    quotation.quotation_status === 'approved'
                                                                        ? 'hover:bg-primary/10 hover:text-primary'
                                                                        : 'cursor-not-allowed text-muted-foreground/30'
                                                                }`}
                                                                title={
                                                                    quotation.quotation_status === 'approved'
                                                                        ? 'Download PDF'
                                                                        : 'PDF available only for approved quotations'
                                                                }
                                                            >
                                                                <FileDown className="h-4 w-4" />
                                                            </Button>
                                                            {quotation.quotation_status !== 'approved' && (
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => handleStatusUpdate(quotation, 'approved')}
                                                                    disabled={isSubmitting}
                                                                    className="h-8 w-8 p-0 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 dark:text-emerald-500 dark:hover:bg-emerald-950/30"
                                                                    title="Approve quotation"
                                                                >
                                                                    <CheckCircle className="h-4 w-4" />
                                                                </Button>
                                                            )}
                                                            {quotation.quotation_status !== 'rejected' && (
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => handleStatusUpdate(quotation, 'rejected')}
                                                                    disabled={isSubmitting}
                                                                    className="h-8 w-8 p-0 text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:text-rose-500 dark:hover:bg-rose-950/30"
                                                                    title="Reject quotation"
                                                                >
                                                                    <XCircle className="h-4 w-4" />
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
                                                                    <DropdownMenuItem
                                                                        onClick={() => handleDelete(quotation)}
                                                                        disabled={isSubmitting}
                                                                        variant="destructive"
                                                                        className="gap-2"
                                                                    >
                                                                        <TrashIcon className="h-4 w-4" />
                                                                        Delete Quotation
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
                                                        window.location.pathname,
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
                                            Showing <span className="font-medium text-foreground">{quotations?.from || 0}</span> to{' '}
                                            <span className="font-medium text-foreground">{quotations?.to || 0}</span> of{' '}
                                            <span className="font-medium text-foreground">{quotations?.total || 0}</span> results
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
                                                            if (quotations && quotations.current_page > 1) {
                                                                router.get(
                                                                    window.location.pathname,
                                                                    {
                                                                        page: quotations.current_page - 1,
                                                                        per_page: per_page_request,
                                                                        search: search,
                                                                    },
                                                                    { preserveState: true },
                                                                );
                                                            }
                                                        }}
                                                        className={
                                                            !quotations || quotations.current_page <= 1 ? 'pointer-events-none opacity-50' : ''
                                                        }
                                                    />
                                                </PaginationItem>

                                                {quotations?.links?.slice(1, -1).map((link, index) => {
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
                                                                        window.location.pathname,
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
                                                            if (quotations.current_page < quotations.last_page) {
                                                                router.get(
                                                                    window.location.pathname,
                                                                    {
                                                                        page: quotations.current_page + 1,
                                                                        per_page: per_page_request,
                                                                        search: search,
                                                                    },
                                                                    { preserveState: true },
                                                                );
                                                            }
                                                        }}
                                                        className={
                                                            quotations.current_page >= quotations.last_page ? 'pointer-events-none opacity-50' : ''
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

            {/* Create Quotation Dialog */}
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold">Add New Quotation</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={submitCreate} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="create_client_id">Client *</Label>
                                <Select
                                    value={createForm.client_id}
                                    onValueChange={(value) => setCreateForm({ ...createForm, client_id: value })}
                                    required
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a client" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {clients.map((client) => (
                                            <SelectItem key={client.id} value={client.id.toString()}>
                                                {client.company_name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label htmlFor="create_quotation_request_id">Quotation Request *</Label>
                                <Select
                                    value={createForm.quotation_request_id}
                                    onValueChange={(value) => setCreateForm({ ...createForm, quotation_request_id: value })}
                                    required
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a request" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {quotation_requests.map((request) => (
                                            <SelectItem key={request.id} value={request.id.toString()}>
                                                {request.service_type}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label htmlFor="create_quotation_status">Status *</Label>
                                <Select
                                    value={createForm.quotation_status}
                                    onValueChange={(value: 'pending' | 'approved' | 'rejected') =>
                                        setCreateForm({ ...createForm, quotation_status: value })
                                    }
                                    required
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="pending">Pending</SelectItem>
                                        <SelectItem value="approved">Approved</SelectItem>
                                        <SelectItem value="rejected">Rejected</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="col-span-2">
                                <Label htmlFor="create_quotation_message">Quotation Message *</Label>
                                <Input
                                    id="create_quotation_message"
                                    value={createForm.quotation_message}
                                    onChange={(e) => setCreateForm({ ...createForm, quotation_message: e.target.value })}
                                    required
                                    placeholder="Enter quotation details..."
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)} disabled={isSubmitting}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? 'Creating...' : 'Create Quotation'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

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
                            This action cannot be undone. This will permanently delete the quotation.
                        </AlertDescription>
                    </Alert>
                    {selectedQuotation && (
                        <div className="py-4">
                            <p className="text-sm">
                                Are you sure you want to delete quotation <strong>QTN-{selectedQuotation.id.toString().padStart(6, '0')}</strong>?
                            </p>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={isSubmitting}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={confirmDelete} disabled={isSubmitting}>
                            {isSubmitting ? 'Deleting...' : 'Delete Quotation'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
