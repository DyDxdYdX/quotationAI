import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { ArrowLeft, Check, ChevronsUpDown, Loader2, PlusIcon, Save, TrashIcon } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface Client {
    id: number;
    company_name: string;
    supervisor_name: string;
    company_email: string;
    company_phone_number: string;
    company_registration_number?: string;
}

interface Item {
    description: string;
    quantity: number;
    unit_price: number;
    amount: number;
}

interface Invoice {
    id: number;
    client_id: number;
    quotation_id: number | null;
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
    items?: Item[];
}

interface EditInvoiceProps {
    invoice: Invoice;
    clients: Client[];
}

export default function EditInvoice({ invoice, clients }: EditInvoiceProps) {
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Manage Invoices',
            href: '/manage-invoices',
        },
        {
            title: `Invoice #${invoice.invoice_number}`,
            href: `/invoices/${invoice.id}`,
        },
        {
            title: 'Edit',
            href: `/invoices/${invoice.id}/edit`,
        },
    ];

    const [form, setForm] = useState({
        client_id: invoice.client_id.toString(),
        invoice_date: invoice.invoice_date.split('T')[0],
        due_date: invoice.due_date.split('T')[0],
        status: invoice.status,
        currency: invoice.currency,
        notes: invoice.notes || '',
        items: invoice.items && invoice.items.length > 0
            ? invoice.items.map(item => ({
                description: item.description,
                quantity: item.quantity,
                unit_price: Number(item.unit_price),
                amount: Number(item.amount)
            }))
            : [{ description: '', quantity: 1, unit_price: 0, amount: 0 }],
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [clientComboOpen, setClientComboOpen] = useState(false);
    
    // Find the selected client object for display details
    const selectedClient = clients.find((client) => client.id.toString() === form.client_id);

    const updateItem = (index: number, field: keyof Item, value: any) => {
        const newItems = [...form.items];
        newItems[index] = { ...newItems[index], [field]: value };
        
        // Recalculate amount if quantity or unit_price changes
        if (field === 'quantity' || field === 'unit_price') {
            newItems[index].amount = newItems[index].quantity * newItems[index].unit_price;
        }

        setForm({ ...form, items: newItems });
    };

    const addItem = () => {
        setForm({
            ...form,
            items: [...form.items, { description: '', quantity: 1, unit_price: 0, amount: 0 }],
        });
    };

    const removeItem = (index: number) => {
        if (form.items.length === 1) return;
        const newItems = [...form.items];
        newItems.splice(index, 1);
        setForm({ ...form, items: newItems });
    };

    const calculateTotal = () => {
        return form.items.reduce((total, item) => total + item.amount, 0);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!form.client_id) {
            alert("Please select a client.");
            return;
        }

        setIsSubmitting(true);
        // Cast form to any to bypass strict FormDataConvertible checks for nested objects
        router.put(`/invoices/${invoice.id}`, form as any, {
            onFinish: () => setIsSubmitting(false),
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit Invoice #${invoice.invoice_number}`} />

            <div className="px-6 py-4">
                <div className="mb-6 flex items-center gap-4">
                    <Button variant="outline" size="sm" onClick={() => router.get(`/invoices/${invoice.id}`)} className="h-9 w-9">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-foreground">Edit Invoice #{invoice.invoice_number}</h1>
                        <p className="mt-2 text-sm text-muted-foreground">Update invoice details below</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Client Information */}
                    <Card className="border shadow-sm">
                        <CardHeader className="border-b bg-muted/30">
                            <CardTitle className="text-xl font-bold">Client Information</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <div className="space-y-4">
                                <div>
                                    <Label htmlFor="client_id" className="text-sm font-medium">
                                        Select Client *
                                    </Label>
                                    <div className="mt-1">
                                        <Popover open={clientComboOpen} onOpenChange={setClientComboOpen}>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    role="combobox"
                                                    aria-expanded={clientComboOpen}
                                                    className={cn(
                                                        'h-10 w-full justify-between px-3 py-2 text-left font-normal',
                                                        !form.client_id && 'text-muted-foreground',
                                                    )}
                                                >
                                                    <span className="truncate">
                                                        {form.client_id
                                                            ? clients.find((client) => client.id.toString() === form.client_id)?.company_name
                                                            : 'Choose a client...'}
                                                    </span>
                                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-[400px] p-0" align="start">
                                                <Command>
                                                    <CommandInput placeholder="Search clients..." className="h-9" />
                                                    <CommandList className="max-h-[200px]">
                                                        <CommandEmpty>No clients found.</CommandEmpty>
                                                        <CommandGroup>
                                                            {clients.map((client) => (
                                                                <CommandItem
                                                                    key={client.id}
                                                                    value={`${client.company_name} ${client.supervisor_name}`}
                                                                    onSelect={() => {
                                                                        setForm({ ...form, client_id: client.id.toString() });
                                                                        setClientComboOpen(false);
                                                                    }}
                                                                    className="flex cursor-pointer items-center gap-2 p-2"
                                                                >
                                                                    <Check
                                                                        className={cn(
                                                                            'h-4 w-4',
                                                                            client.id.toString() === form.client_id ? 'opacity-100' : 'opacity-0',
                                                                        )}
                                                                    />
                                                                    <div className="flex min-w-0 flex-1 flex-col">
                                                                        <div className="truncate text-sm font-medium">{client.company_name}</div>
                                                                        <div className="truncate text-xs text-muted-foreground">{client.supervisor_name}</div>
                                                                    </div>
                                                                </CommandItem>
                                                            ))}
                                                        </CommandGroup>
                                                    </CommandList>
                                                </Command>
                                            </PopoverContent>
                                        </Popover>
                                    </div>
                                </div>

                                {selectedClient && (
                                    <div className="rounded-lg border bg-muted/50 p-4">
                                        <h4 className="mb-3 text-sm font-semibold">Selected Client Details</h4>
                                        <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
                                            <div className="flex flex-col">
                                                <span className="text-xs font-medium tracking-wider text-muted-foreground uppercase">Company</span>
                                                <span className="font-medium">{selectedClient.company_name}</span>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
                                                    Company Registration Number
                                                </span>
                                                <span className="font-medium">{selectedClient.company_registration_number || 'N/A'}</span>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-xs font-medium tracking-wider text-muted-foreground uppercase">Supervisor</span>
                                                <span className="font-medium">{selectedClient.supervisor_name}</span>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-xs font-medium tracking-wider text-muted-foreground uppercase">Email</span>
                                                <span className="font-medium">{selectedClient.company_email}</span>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-xs font-medium tracking-wider text-muted-foreground uppercase">Phone</span>
                                                <span className="font-medium">{selectedClient.company_phone_number}</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Invoice Details */}
                    <Card className="border shadow-sm">
                        <CardHeader className="border-b bg-muted/30">
                            <CardTitle className="text-xl font-bold">Invoice Details</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="invoice_date">Invoice Date *</Label>
                                    <Input
                                        id="invoice_date"
                                        type="date"
                                        value={form.invoice_date}
                                        onChange={(e) => setForm({ ...form, invoice_date: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="due_date">Due Date *</Label>
                                    <Input
                                        id="due_date"
                                        type="date"
                                        value={form.due_date}
                                        onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="status">Status *</Label>
                                    <Select
                                        value={form.status}
                                        onValueChange={(value) => setForm({ ...form, status: value as 'pending' | 'paid' | 'void' })}
                                        required
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="pending">Pending</SelectItem>
                                            <SelectItem value="paid">Paid</SelectItem>
                                            <SelectItem value="void">Void</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="currency">Currency</Label>
                                    <Input
                                        id="currency"
                                        value={form.currency}
                                        onChange={(e) => setForm({ ...form, currency: e.target.value })}
                                        placeholder="e.g. RM, USD"
                                        required
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Items Section */}
                    <Card className="border shadow-sm">
                        <CardHeader className="border-b bg-muted/30 flex flex-row items-center justify-between">
                            <CardTitle className="text-xl font-bold">Items & Breakdown</CardTitle>
                            <Button type="button" variant="outline" size="sm" onClick={addItem} className="gap-2">
                                <PlusIcon className="h-4 w-4" />
                                Add Item
                            </Button>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <div className="space-y-4">
                                {form.items.map((item, index) => (
                                    <div key={index} className="grid grid-cols-12 gap-4 items-end border p-4 rounded-lg bg-muted/20">
                                        <div className="col-span-12 md:col-span-6 space-y-2">
                                            <Label htmlFor={`description-${index}`}>Description</Label>
                                            <Input
                                                id={`description-${index}`}
                                                value={item.description}
                                                onChange={(e) => updateItem(index, 'description', e.target.value)}
                                                placeholder="Item description"
                                                required
                                            />
                                        </div>
                                        <div className="col-span-6 md:col-span-2 space-y-2">
                                            <Label htmlFor={`quantity-${index}`}>Qty</Label>
                                            <Input
                                                id={`quantity-${index}`}
                                                type="number"
                                                min="1"
                                                value={item.quantity}
                                                onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 0)}
                                                required
                                            />
                                        </div>
                                        <div className="col-span-6 md:col-span-2 space-y-2">
                                            <Label htmlFor={`price-${index}`}>Price</Label>
                                            <Input
                                                id={`price-${index}`}
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={item.unit_price}
                                                onChange={(e) => updateItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                                                required
                                            />
                                        </div>
                                        <div className="col-span-10 md:col-span-1 space-y-2">
                                            <Label>Amount</Label>
                                            <div className="py-2 px-3 text-sm font-medium bg-muted rounded-md text-right whitespace-nowrap">
                                                {Number(item.amount).toFixed(2)}
                                            </div>
                                        </div>
                                        <div className="col-span-2 md:col-span-1 flex justify-end">
                                             <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                                                onClick={() => removeItem(index)}
                                                disabled={form.items.length === 1}
                                            >
                                                <TrashIcon className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                                
                                <div className="flex justify-end pt-4 border-t mt-4">
                                    <div className="w-full md:w-1/3 flex justify-between items-center p-4 bg-muted/50 rounded-lg border">
                                        <span className="text-lg font-bold">Total ({form.currency}):</span>
                                        <span className="text-2xl font-bold text-primary">{calculateTotal().toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                     {/* Notes */}
                     <Card className="border shadow-sm">
                        <CardHeader className="border-b bg-muted/30">
                            <CardTitle className="text-xl font-bold">Notes</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <textarea
                                id="notes"
                                value={form.notes}
                                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setForm({ ...form, notes: e.target.value })}
                                placeholder="Add any additional notes or terms..."
                                rows={4}
                                className="flex min-h-[120px] w-full resize-none rounded-md border border-input bg-background px-3 py-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                            />
                        </CardContent>
                    </Card>

                    {/* Action Bar */}
                    <Card className="border shadow-sm">
                        <CardContent className="p-6">
                            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                                <div className="space-y-1">
                                    <h4 className="text-lg font-bold text-foreground">Update Invoice</h4>
                                    <p className="text-sm text-muted-foreground">Review the details before saving changes</p>
                                </div>
                                <div className="flex gap-4">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => router.visit(`/invoices/${invoice.id}`)}
                                        disabled={isSubmitting}
                                        className="gap-2"
                                    >
                                        Cancel
                                    </Button>
                                    <Button 
                                        type="submit" 
                                        disabled={isSubmitting}
                                        className="gap-2 min-w-[140px]"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                Saving...
                                            </>
                                        ) : (
                                            <>
                                                <Save className="h-4 w-4" />
                                                Save Changes
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </form>
            </div>
        </AppLayout>
    );
}
