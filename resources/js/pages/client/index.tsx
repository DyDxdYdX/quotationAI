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

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Manage Client',
        href: '/manage-client',
    },
];

interface Client {
    id: number;
    supervisor_name: string;
    company_phone_number: string;
    company_email: string;
    company_name: string;
    company_address: string;
    company_city: string;
    quotation_requests?: any[];
    quotations?: any[];
    created_at: string;
    updated_at: string;
}

interface PaginatedClients {
    data: Client[];
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

export default function Client({ clients, per_page_request }: { clients: PaginatedClients; per_page_request: string }) {
    const [viewDialogOpen, setViewDialogOpen] = useState(false);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [editForm, setEditForm] = useState({
        supervisor_name: '',
        company_phone_number: '',
        company_email: '',
        company_name: '',
        company_address: '',
        company_city: '',
    });
    const [createForm, setCreateForm] = useState({
        supervisor_name: '',
        company_phone_number: '',
        company_email: '',
        company_name: '',
        company_address: '',
        company_city: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const clientSummary = [
        {
            title: 'Total Clients',
            value: clients.total,
        },
        {
            title: 'Total Projects',
            value: clients.data.reduce((total, client) => total + (client.quotations?.length || 0), 0),
        },
    ];

    const handleView = (client: Client) => {
        setSelectedClient(client);
        setViewDialogOpen(true);
    };

    const handleCreate = () => {
        setCreateForm({
            supervisor_name: '',
            company_phone_number: '',
            company_email: '',
            company_name: '',
            company_address: '',
            company_city: '',
        });
        setCreateDialogOpen(true);
    };

    const handleEdit = (client: Client) => {
        setSelectedClient(client);
        setEditForm({
            supervisor_name: client.supervisor_name,
            company_phone_number: client.company_phone_number,
            company_email: client.company_email,
            company_name: client.company_name,
            company_address: client.company_address,
            company_city: client.company_city,
        });
        setEditDialogOpen(true);
    };

    const handleDelete = (client: Client) => {
        setSelectedClient(client);
        setDeleteDialogOpen(true);
    };

    const submitCreate = (e: React.FormEvent) => {
        e.preventDefault();

        setIsSubmitting(true);
        router.post('/client', createForm, {
            onSuccess: () => {
                setCreateDialogOpen(false);
                setCreateForm({
                    supervisor_name: '',
                    company_phone_number: '',
                    company_email: '',
                    company_name: '',
                    company_address: '',
                    company_city: '',
                });
            },
            onFinish: () => {
                setIsSubmitting(false);
            }
        });
    };

    const submitEdit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedClient) return;

        setIsSubmitting(true);
        router.put(`/client/${selectedClient.id}`, editForm, {
            onSuccess: () => {
                setEditDialogOpen(false);
                setSelectedClient(null);
            },
            onFinish: () => {
                setIsSubmitting(false);
            }
        });
    };

    const confirmDelete = () => {
        if (!selectedClient) return;

        setIsSubmitting(true);
        router.delete(`/client/${selectedClient.id}`, {
            onSuccess: () => {
                setDeleteDialogOpen(false);
                setSelectedClient(null);
            },
            onFinish: () => {
                setIsSubmitting(false);
            }
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Manage Client" />
            
            {/* Client Summary Cards */}
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4 m-4'>
                <Card className='bg-sidebar'>
                    <CardHeader className='font-bold text-lg'>
                        {clientSummary[0].title}
                    </CardHeader>
                    <CardContent className='text-2xl font-semibold'>
                        {clientSummary[0].value}
                    </CardContent>
                </Card>
                <Card className='bg-sidebar'>
                    <CardHeader className='font-bold text-lg'>
                        {clientSummary[1].title}
                    </CardHeader>
                    <CardContent className='text-2xl font-semibold'>
                        {clientSummary[1].value}
                    </CardContent>
                </Card>
            </div>

            {/* Client Table */}
            <div className='m-4'>
                <Card className='bg-sidebar'>
                    <CardHeader className='flex flex-row items-center justify-between'>
                        <h2 className='text-xl font-bold'>Clients List</h2>
                        <Button onClick={handleCreate} className='flex items-center gap-2'>
                            <PlusIcon className='w-4 h-4' />
                            Add New Client
                        </Button>
                    </CardHeader>
                    <CardContent>
                        {clients.data.length === 0 ? (
                            <div className='text-center py-8 text-muted-foreground'>
                                <p>No clients found.</p>
                            </div>
                        ) : (
                            <>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className='font-bold'>Company Name</TableHead>
                                            <TableHead className='font-bold'>Supervisor</TableHead>
                                            <TableHead className='font-bold'>Email</TableHead>
                                            <TableHead className='font-bold'>Phone</TableHead>
                                            <TableHead className='font-bold'>City</TableHead>
                                            <TableHead className='font-bold'>Quotations</TableHead>
                                            <TableHead className='font-bold'>Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {clients.data.map((client) => (
                                            <TableRow key={client.id}>
                                                <TableCell className='font-medium'>
                                                    {client.company_name}
                                                </TableCell>
                                                <TableCell>{client.supervisor_name}</TableCell>
                                                <TableCell>{client.company_email}</TableCell>
                                                <TableCell>{client.company_phone_number}</TableCell>
                                                <TableCell>{client.company_city}</TableCell>
                                                <TableCell>
                                                    {client.quotations?.length || 0}
                                                </TableCell>
                                                <TableCell>
                                                <Button 
                                                    variant='default' 
                                                    size='icon' 
                                                    className='mr-2'
                                                    onClick={() => handleView(client)}
                                                    title="View Client"
                                                >
                                                    <EyeIcon className='w-4 h-4' />
                                                </Button>
                                                <Button 
                                                    variant='default' 
                                                    size='icon' 
                                                    className='mr-2'
                                                    onClick={() => handleEdit(client)}
                                                    title="Edit Client"
                                                >
                                                    <PencilIcon className='w-4 h-4' />
                                                </Button>
                                                <Button 
                                                    variant='destructive' 
                                                    size='icon' 
                                                    className='mr-2'
                                                    onClick={() => handleDelete(client)}
                                                    title="Delete Client"
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
                                                        page: 1 // Reset to first page when changing per_page
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
                                            Showing {clients.from} to {clients.to} of {clients.total} results
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
                                                            if (clients.current_page > 1) {
                                                                router.get(window.location.pathname, {
                                                                page: clients.current_page - 1,
                                                                per_page: per_page_request
                                                            }, { preserveState: true });
                                                            }
                                                        }}
                                                        className={clients.current_page <= 1 ? 'pointer-events-none opacity-50' : ''}
                                                    />
                                                </PaginationItem>

                                                {clients.links.slice(1, -1).map((link, index) => {
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
                                                            if (clients.current_page < clients.last_page) {
                                                                router.get(window.location.pathname, {
                                                                    page: clients.current_page + 1,
                                                                    per_page: per_page_request
                                                                }, { preserveState: true });
                                                            }
                                                        }}
                                                        className={clients.current_page >= clients.last_page ? 'pointer-events-none opacity-50' : ''}
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

            {/* View Client Dialog */}
            <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Client Details</DialogTitle>
                    </DialogHeader>
                    {selectedClient && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-sm font-medium text-muted-foreground">Company Name</Label>
                                    <p className="text-sm font-medium">{selectedClient.company_name}</p>
                                </div>
                                <div>
                                    <Label className="text-sm font-medium text-muted-foreground">Supervisor</Label>
                                    <p className="text-sm">{selectedClient.supervisor_name}</p>
                                </div>
                                <div>
                                    <Label className="text-sm font-medium text-muted-foreground">Email</Label>
                                    <p className="text-sm">{selectedClient.company_email}</p>
                                </div>
                                <div>
                                    <Label className="text-sm font-medium text-muted-foreground">Phone</Label>
                                    <p className="text-sm">{selectedClient.company_phone_number}</p>
                                </div>
                                <div>
                                    <Label className="text-sm font-medium text-muted-foreground">City</Label>
                                    <p className="text-sm">{selectedClient.company_city}</p>
                                </div>
                                <div>
                                    <Label className="text-sm font-medium text-muted-foreground">Address</Label>
                                    <p className="text-sm">{selectedClient.company_address}</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                                <div>
                                    <Label className="text-sm font-medium text-muted-foreground">Total Quotations</Label>
                                    <p className="text-sm font-medium">{selectedClient.quotations?.length || 0}</p>
                                </div>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="default" onClick={() => setViewDialogOpen(false)}>
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Create Client Dialog */}
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Add New Client</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={submitCreate} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="create_company_name">Company Name *</Label>
                                <Input
                                    id="create_company_name"
                                    value={createForm.company_name}
                                    onChange={(e) => setCreateForm({...createForm, company_name: e.target.value})}
                                    required
                                />
                            </div>
                            <div>
                                <Label htmlFor="create_supervisor_name">Supervisor Name *</Label>
                                <Input
                                    id="create_supervisor_name"
                                    value={createForm.supervisor_name}
                                    onChange={(e) => setCreateForm({...createForm, supervisor_name: e.target.value})}
                                    required
                                />
                            </div>
                            <div>
                                <Label htmlFor="create_company_email">Email *</Label>
                                <Input
                                    id="create_company_email"
                                    type="email"
                                    value={createForm.company_email}
                                    onChange={(e) => setCreateForm({...createForm, company_email: e.target.value})}
                                    required
                                />
                            </div>
                            <div>
                                <Label htmlFor="create_company_phone_number">Phone Number *</Label>
                                <Input
                                    id="create_company_phone_number"
                                    value={createForm.company_phone_number}
                                    onChange={(e) => setCreateForm({...createForm, company_phone_number: e.target.value})}
                                    required
                                />
                            </div>
                            <div>
                                <Label htmlFor="create_company_city">City *</Label>
                                <Input
                                    id="create_company_city"
                                    value={createForm.company_city}
                                    onChange={(e) => setCreateForm({...createForm, company_city: e.target.value})}
                                    required
                                />
                            </div>
                            <div>
                                <Label htmlFor="create_company_address">Address *</Label>
                                <Input
                                    id="create_company_address"
                                    value={createForm.company_address}
                                    onChange={(e) => setCreateForm({...createForm, company_address: e.target.value})}
                                    required
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
                                {isSubmitting ? 'Creating...' : 'Create Client'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Edit Client Dialog */}
            <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Edit Client</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={submitEdit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="company_name">Company Name *</Label>
                                <Input
                                    id="company_name"
                                    value={editForm.company_name}
                                    onChange={(e) => setEditForm({...editForm, company_name: e.target.value})}
                                    required
                                />
                            </div>
                            <div>
                                <Label htmlFor="supervisor_name">Supervisor Name *</Label>
                                <Input
                                    id="supervisor_name"
                                    value={editForm.supervisor_name}
                                    onChange={(e) => setEditForm({...editForm, supervisor_name: e.target.value})}
                                    required
                                />
                            </div>
                            <div>
                                <Label htmlFor="company_email">Email *</Label>
                                <Input
                                    id="company_email"
                                    type="email"
                                    value={editForm.company_email}
                                    onChange={(e) => setEditForm({...editForm, company_email: e.target.value})}
                                    required
                                />
                            </div>
                            <div>
                                <Label htmlFor="company_phone_number">Phone Number *</Label>
                                <Input
                                    id="company_phone_number"
                                    value={editForm.company_phone_number}
                                    onChange={(e) => setEditForm({...editForm, company_phone_number: e.target.value})}
                                    required
                                />
                            </div>
                            <div>
                                <Label htmlFor="company_city">City *</Label>
                                <Input
                                    id="company_city"
                                    value={editForm.company_city}
                                    onChange={(e) => setEditForm({...editForm, company_city: e.target.value})}
                                    required
                                />
                            </div>
                            <div>
                                <Label htmlFor="company_address">Address *</Label>
                                <Input
                                    id="company_address"
                                    value={editForm.company_address}
                                    onChange={(e) => setEditForm({...editForm, company_address: e.target.value})}
                                    required
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button 
                                type="button" 
                                variant="outline" 
                                onClick={() => setEditDialogOpen(false)}
                                disabled={isSubmitting}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? 'Updating...' : 'Update Client'}
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
                            This action cannot be undone. This will permanently delete the client and all associated data.
                        </AlertDescription>
                    </Alert>
                    {selectedClient && (
                        <div className="py-4">
                            <p className="text-sm">
                                Are you sure you want to delete <strong>{selectedClient.company_name}</strong>?
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
                            {isSubmitting ? 'Deleting...' : 'Delete Client'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}