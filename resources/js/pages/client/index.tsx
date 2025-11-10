import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
import { AlertTriangle, EyeIcon, PencilIcon, PlusIcon, SearchIcon, TrashIcon, X } from 'lucide-react';
import { useState, useEffect } from 'react';

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
    company_registration_number: string;
    quotation_requests?: Array<{
        id: number;
        service_type: string;
        message: string;
    }>;
    quotations?: Array<{
        id: number;
        quotation_status: string;
        created_at: string;
    }>;
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

export default function Client({ clients, per_page_request, search_request = '' }: { clients: PaginatedClients; per_page_request: string; search_request?: string }) {
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
        company_registration_number: '',
    });
    const [createForm, setCreateForm] = useState({
        supervisor_name: '',
        company_phone_number: '',
        company_email: '',
        company_name: '',
        company_address: '',
        company_city: '',
        company_registration_number: '',
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
            company_registration_number: '',
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
            company_registration_number: client.company_registration_number,
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
                    company_registration_number: '',
                });
            },
            onFinish: () => {
                setIsSubmitting(false);
            },
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
            },
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
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Manage Client" />

            {/* Client Summary Cards */}
            <div className="grid grid-cols-1 gap-6 px-6 py-4 md:grid-cols-2">
                {clientSummary.map((summary, index) => {
                    const colors = ['from-blue-500 to-blue-600', 'from-purple-500 to-purple-600'];
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

            {/* Client Table */}
            <div className="px-6 pb-6">
                <Card className="border shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between border-b bg-muted/30">
                        <div>
                            <h2 className="text-2xl font-bold text-foreground">Clients</h2>
                            <p className="mt-1 text-sm text-muted-foreground">Manage and track all client information</p>
                        </div>
                        <Button
                            onClick={handleCreate}
                            className="flex items-center gap-2 bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
                        >
                            <PlusIcon className="h-4 w-4" />
                            Add New Client
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
                                        placeholder="Search clients by company name, supervisor, email, phone, city, address, or registration number..."
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
                            {search && (
                                <p className="mt-2 text-sm text-muted-foreground">
                                    Showing results for: <span className="font-medium text-foreground">&quot;{search}&quot;</span> ({clients.total} {clients.total === 1 ? 'result' : 'results'})
                                </p>
                            )}
                        </div>
                        {clients.data.length === 0 ? (
                            <div className="py-16 text-center">
                                <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-muted">
                                    <PlusIcon className="h-12 w-12 text-muted-foreground" />
                                </div>
                                <p className="mb-2 text-lg font-medium text-foreground">No clients found</p>
                                <p className="mb-6 text-sm text-muted-foreground">Get started by adding your first client</p>
                                <Button onClick={handleCreate} className="gap-2">
                                    <PlusIcon className="h-4 w-4" />
                                    Add New Client
                                </Button>
                            </div>
                        ) : (
                            <>
                                <div className="overflow-x-auto px-4">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="border-b bg-muted/50 hover:bg-muted/50">
                                                <TableHead className="h-12 text-sm font-semibold text-foreground">Company Name</TableHead>
                                                <TableHead className="h-12 text-sm font-semibold text-foreground">Supervisor</TableHead>
                                                <TableHead className="h-12 text-sm font-semibold text-foreground">Email</TableHead>
                                                <TableHead className="h-12 text-sm font-semibold text-foreground">Phone</TableHead>
                                                <TableHead className="h-12 text-sm font-semibold text-foreground">City</TableHead>
                                                <TableHead className="h-12 text-sm font-semibold text-foreground">Quotations</TableHead>
                                                <TableHead className="h-12 text-right text-sm font-semibold text-foreground">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {clients.data.map((client) => (
                                                <TableRow key={client.id} className="border-b transition-colors duration-150 hover:bg-muted/30">
                                                    <TableCell className="py-4">
                                                        <span className="font-medium text-foreground">{client.company_name}</span>
                                                    </TableCell>
                                                    <TableCell className="py-4">
                                                        <span className="text-sm text-muted-foreground">{client.supervisor_name}</span>
                                                    </TableCell>
                                                    <TableCell className="py-4">
                                                        <span className="text-sm text-muted-foreground">{client.company_email}</span>
                                                    </TableCell>
                                                    <TableCell className="py-4">
                                                        <span className="text-sm text-muted-foreground">{client.company_phone_number}</span>
                                                    </TableCell>
                                                    <TableCell className="py-4">
                                                        <span className="text-sm text-muted-foreground">{client.company_city}</span>
                                                    </TableCell>
                                                    <TableCell className="py-4">
                                                        <span className="text-sm font-medium text-foreground">{client.quotations?.length || 0}</span>
                                                    </TableCell>
                                                    <TableCell className="py-4">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => handleView(client)}
                                                                className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary"
                                                                title="View Client"
                                                            >
                                                                <EyeIcon className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => handleEdit(client)}
                                                                className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary"
                                                                title="Edit Client"
                                                            >
                                                                <PencilIcon className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => handleDelete(client)}
                                                                className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                                                                title="Delete Client"
                                                            >
                                                                <TrashIcon className="h-4 w-4" />
                                                            </Button>
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
                                            Showing <span className="font-medium text-foreground">{clients.from}</span> to{' '}
                                            <span className="font-medium text-foreground">{clients.to}</span> of{' '}
                                            <span className="font-medium text-foreground">{clients.total}</span> results
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
                                                            if (clients.current_page > 1) {
                                                                router.get(
                                                                    window.location.pathname,
                                                                    {
                                                                        page: clients.current_page - 1,
                                                                        per_page: per_page_request,
                                                                        search: search,
                                                                    },
                                                                    { preserveState: true },
                                                                );
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
                                                            if (clients.current_page < clients.last_page) {
                                                                router.get(
                                                                    window.location.pathname,
                                                                    {
                                                                        page: clients.current_page + 1,
                                                                        per_page: per_page_request,
                                                                        search: search,
                                                                    },
                                                                    { preserveState: true },
                                                                );
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
                <DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold">Client Details</DialogTitle>
                    </DialogHeader>
                    {selectedClient && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-sm font-medium text-muted-foreground">Company Name</Label>
                                    <p className="text-sm font-medium">{selectedClient.company_name}</p>
                                </div>
                                <div>
                                    <Label className="text-sm font-medium text-muted-foreground">Company Registration Number</Label>
                                    <p className="text-sm">{selectedClient.company_registration_number}</p>
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
                                <div className="col-span-2">
                                    <Label className="text-sm font-medium text-muted-foreground">Address</Label>
                                    <p className="text-sm">{selectedClient.company_address}</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4 border-t pt-4">
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
                <DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold">Add New Client</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={submitCreate} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="create_company_name">Company Name *</Label>
                                <Input
                                    id="create_company_name"
                                    value={createForm.company_name}
                                    onChange={(e) => setCreateForm({ ...createForm, company_name: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <Label htmlFor="create_company_registration_number">Company Registration Number *</Label>
                                <Input
                                    id="create_company_registration_number"
                                    value={createForm.company_registration_number}
                                    onChange={(e) => setCreateForm({ ...createForm, company_registration_number: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <Label htmlFor="create_supervisor_name">Supervisor Name *</Label>
                                <Input
                                    id="create_supervisor_name"
                                    value={createForm.supervisor_name}
                                    onChange={(e) => setCreateForm({ ...createForm, supervisor_name: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <Label htmlFor="create_company_email">Email *</Label>
                                <Input
                                    id="create_company_email"
                                    type="email"
                                    value={createForm.company_email}
                                    onChange={(e) => setCreateForm({ ...createForm, company_email: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <Label htmlFor="create_company_phone_number">Phone Number *</Label>
                                <Input
                                    id="create_company_phone_number"
                                    value={createForm.company_phone_number}
                                    onChange={(e) => setCreateForm({ ...createForm, company_phone_number: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <Label htmlFor="create_company_city">City *</Label>
                                <Input
                                    id="create_company_city"
                                    value={createForm.company_city}
                                    onChange={(e) => setCreateForm({ ...createForm, company_city: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="col-span-2">
                                <Label htmlFor="create_company_address">Address *</Label>
                                <Input
                                    id="create_company_address"
                                    value={createForm.company_address}
                                    onChange={(e) => setCreateForm({ ...createForm, company_address: e.target.value })}
                                    required
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)} disabled={isSubmitting}>
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={isSubmitting}
                                className="bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
                            >
                                {isSubmitting ? 'Creating...' : 'Create Client'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Edit Client Dialog */}
            <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                <DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold">Edit Client</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={submitEdit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="company_name">Company Name *</Label>
                                <Input
                                    id="company_name"
                                    value={editForm.company_name}
                                    onChange={(e) => setEditForm({ ...editForm, company_name: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <Label htmlFor="company_registration_number">Company Registration Number *</Label>
                                <Input
                                    id="company_registration_number"
                                    value={editForm.company_registration_number}
                                    onChange={(e) => setEditForm({ ...editForm, company_registration_number: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <Label htmlFor="supervisor_name">Supervisor Name *</Label>
                                <Input
                                    id="supervisor_name"
                                    value={editForm.supervisor_name}
                                    onChange={(e) => setEditForm({ ...editForm, supervisor_name: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <Label htmlFor="company_email">Email *</Label>
                                <Input
                                    id="company_email"
                                    type="email"
                                    value={editForm.company_email}
                                    onChange={(e) => setEditForm({ ...editForm, company_email: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <Label htmlFor="company_phone_number">Phone Number *</Label>
                                <Input
                                    id="company_phone_number"
                                    value={editForm.company_phone_number}
                                    onChange={(e) => setEditForm({ ...editForm, company_phone_number: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <Label htmlFor="company_city">City *</Label>
                                <Input
                                    id="company_city"
                                    value={editForm.company_city}
                                    onChange={(e) => setEditForm({ ...editForm, company_city: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="col-span-2">
                                <Label htmlFor="company_address">Address *</Label>
                                <Input
                                    id="company_address"
                                    value={editForm.company_address}
                                    onChange={(e) => setEditForm({ ...editForm, company_address: e.target.value })}
                                    required
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)} disabled={isSubmitting}>
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={isSubmitting}
                                className="bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
                            >
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
                        <DialogTitle className="text-xl font-bold">Confirm Deletion</DialogTitle>
                    </DialogHeader>
                    <Alert variant="destructive" className="border-destructive/50 bg-destructive/10">
                        <AlertTriangle className="h-4 w-4 text-destructive" />
                        <AlertTitle className="font-semibold">Warning</AlertTitle>
                        <AlertDescription className="text-sm">
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
                        <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={isSubmitting}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={confirmDelete} disabled={isSubmitting}>
                            {isSubmitting ? 'Deleting...' : 'Delete Client'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
