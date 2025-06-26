import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import {
    Card,
    CardContent,
    CardHeader,
} from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { EyeIcon, PencilIcon, TrashIcon, PlusIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
    Pagination, 
    PaginationContent, 
    PaginationItem, 
    PaginationLink, 
    PaginationPrevious, 
    PaginationNext, 
    PaginationEllipsis 
} from '@/components/ui/pagination';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle, 
    DialogFooter 
} from '@/components/ui/dialog';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { router } from '@inertiajs/react';
import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

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
    quotation_message: any;
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

export default function Quotation({ quotations, per_page_request = '10', clients = [], quotation_requests = [] }: { 
    quotations?: PaginatedQuotations; 
    per_page_request?: string;
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

    const quotationSummary = [
        {
            title: 'Total Quotations',
            value: quotations?.total || 0,
        },
        {
            title: 'Pending Quotations',
            value: quotations?.data?.filter(q => q.quotation_status === 'pending').length || 0,
        },
        {
            title: 'Approved Quotations',
            value: quotations?.data?.filter(q => q.quotation_status === 'approved').length || 0,
        },
        {
            title: 'Rejected Quotations',
            value: quotations?.data?.filter(q => q.quotation_status === 'rejected').length || 0,
        },
    ];

    const handleCreate = () => {
        setCreateForm({
            client_id: '',
            quotation_request_id: '',
            quotation_message: '',
            quotation_status: 'pending',
        });
        setCreateDialogOpen(true);
    };

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
            }
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
            <Head title="Manage Quotation" />
            
            {/* Quotation Summary Cards */}
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 m-4'>
                {quotationSummary.map((summary, index) => (
                    <Card key={index} className='bg-sidebar'>
                        <CardHeader className='font-bold text-lg'>
                            {summary.title}
                        </CardHeader>
                        <CardContent className='text-2xl font-semibold'>
                            {summary.value}
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Quotation Table */}
            <div className='m-4'>
                <Card className='bg-sidebar'>
                    <CardHeader className='flex flex-row items-center justify-between'>
                        <h2 className='text-xl font-bold'>Quotations List</h2>
                        <Button onClick={() => router.get('/quotation/create')} className='flex items-center gap-2'>
                            <PlusIcon className='w-4 h-4' />
                            Generate New Quotation
                        </Button>
                    </CardHeader>
                    <CardContent>
                        {!quotations?.data || quotations.data.length === 0 ? (
                            <div className='text-center py-8 text-muted-foreground'>
                                <p>No quotations found.</p>
                            </div>
                        ) : (
                            <>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className='font-bold'>Client</TableHead>
                                            <TableHead className='font-bold'>Service Type</TableHead>
                                            <TableHead className='font-bold'>Status</TableHead>
                                            <TableHead className='font-bold'>Created Date</TableHead>
                                            <TableHead className='font-bold'>Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {quotations.data.map((quotation) => (
                                            <TableRow key={quotation.id}>
                                                <TableCell>
                                                    {quotation.client?.company_name || 'N/A'}
                                                </TableCell>
                                                <TableCell>
                                                    {serviceTypeLabels[quotation.quotation_request?.service_type as keyof typeof serviceTypeLabels] || 'N/A'}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge className={getStatusColor(quotation.quotation_status)}>
                                                        {quotation.quotation_status.charAt(0).toUpperCase() + quotation.quotation_status.slice(1)}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    {new Date(quotation.created_at).toLocaleDateString()}
                                                </TableCell>
                                                <TableCell>
                                                    <Button 
                                                        variant='default' 
                                                        size='icon' 
                                                        className='mr-2'
                                                        onClick={() => router.get(`/quotation/${quotation.id}`)}
                                                        title="View Quotation"
                                                    >
                                                        <EyeIcon className='w-4 h-4' />
                                                    </Button>
                                                    <Button 
                                                        variant='default' 
                                                        size='icon' 
                                                        className='mr-2'
                                                        onClick={() => router.get(`/quotation/${quotation.id}/edit`)}
                                                        title="Edit Quotation"
                                                    >
                                                        <PencilIcon className='w-4 h-4' />
                                                    </Button>
                                                    <Button 
                                                        variant='destructive' 
                                                        size='icon' 
                                                        className='mr-2'
                                                        onClick={() => handleDelete(quotation)}
                                                        title="Delete Quotation"
                                                    >
                                                        <TrashIcon className='w-4 h-4' />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                                
                                {/* Pagination */}
                                <div className='mt-6 space-y-4'>
                                    <div className='flex flex-col sm:flex-row items-center justify-between gap-4'>
                                        <div className='flex items-center gap-2'>
                                            <span className='text-sm text-muted-foreground'>Show</span>
                                            <Select
                                                value={per_page_request.toString()}
                                                onValueChange={(value) => {
                                                    router.get(window.location.pathname, {
                                                        per_page: value,
                                                        page: 1
                                                    }, { preserveState: true })
                                                }}
                                            >
                                                <SelectTrigger className='w-auto'>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="10">10</SelectItem>
                                                    <SelectItem value="25">25</SelectItem>
                                                    <SelectItem value="50">50</SelectItem>
                                                    <SelectItem value="all">All</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <span className='text-sm text-muted-foreground'>entries</span>
                                        </div>
                                        <div className='text-sm text-muted-foreground'>
                                            Showing {quotations?.from || 0} to {quotations?.to || 0} of {quotations?.total || 0} results
                                        </div>
                                    </div>
                                    <div className='flex justify-center'>
                                        <Pagination>
                                            <PaginationContent>
                                                <PaginationItem>
                                                    <PaginationPrevious 
                                                        href="#"
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            if (quotations && quotations.current_page > 1) {
                                                                router.get(window.location.pathname, {
                                                                page: quotations.current_page - 1,
                                                                per_page: per_page_request
                                                            }, { preserveState: true });
                                                            }
                                                        }}
                                                        className={!quotations || quotations.current_page <= 1 ? 'pointer-events-none opacity-50' : ''}
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
                                                                    router.get(window.location.pathname, {
                                                                        page: pageNumber,
                                                                        per_page: per_page_request
                                                                    }, { preserveState: true });
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
                                                                router.get(window.location.pathname, {
                                                                    page: quotations.current_page + 1,
                                                                    per_page: per_page_request
                                                                }, { preserveState: true });
                                                            }
                                                        }}
                                                        className={quotations.current_page >= quotations.last_page ? 'pointer-events-none opacity-50' : ''}
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
                        <DialogTitle>Add New Quotation</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={submitCreate} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="create_client_id">Client *</Label>
                                <Select
                                    value={createForm.client_id}
                                    onValueChange={(value) => setCreateForm({...createForm, client_id: value})}
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
                                    onValueChange={(value) => setCreateForm({...createForm, quotation_request_id: value})}
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
                                    onValueChange={(value: 'pending' | 'approved' | 'rejected') => setCreateForm({...createForm, quotation_status: value})}
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
                                    onChange={(e) => setCreateForm({...createForm, quotation_message: e.target.value})}
                                    required
                                    placeholder="Enter quotation details..."
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button 
                                type="button" 
                                variant="outline" 
                                onClick={() => setCreateDialogOpen(false)}
                                disabled={isSubmitting}
                            >
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
                        <DialogTitle>Confirm Deletion</DialogTitle>
                    </DialogHeader>
                    <Alert variant="default">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Warning</AlertTitle>
                        <AlertDescription>
                            This action cannot be undone. This will permanently delete the quotation.
                        </AlertDescription>
                    </Alert>
                    {selectedQuotation && (
                        <div className="py-4">
                            <p className="text-sm">
                                Are you sure you want to delete quotation <strong>#{selectedQuotation.id}</strong>?
                            </p>
                        </div>
                    )}
                    <DialogFooter>
                        <Button 
                            variant="outline" 
                            onClick={() => setDeleteDialogOpen(false)}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button 
                            variant="destructive" 
                            onClick={confirmDelete}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Deleting...' : 'Delete Quotation'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}