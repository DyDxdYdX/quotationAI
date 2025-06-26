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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { router } from '@inertiajs/react';
import { useState } from 'react';
import { ArrowLeft, Save, Loader2, Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Manage Quotation',
        href: '/manage-quotation',
    },
    {
        title: 'Edit Quotation',
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
    request_message?: string;
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

export default function EditQuotation({ quotation, clients }: { quotation: Quotation; clients: Client[] }) {
    const [form, setForm] = useState(() => {
        // Parse request_message if problem/solution are null but request_message exists
        let problem = quotation.quotation_request?.problem || '';
        let solution = quotation.quotation_request?.solution || '';
        
        if ((!problem || !solution) && quotation.quotation_request?.request_message) {
            try {
                const requestData = typeof quotation.quotation_request.request_message === 'string' 
                    ? JSON.parse(quotation.quotation_request.request_message)
                    : quotation.quotation_request.request_message;
                
                problem = requestData.problem || '';
                solution = requestData.solution || '';
            } catch (error) {
                console.error('Error parsing request_message:', error);
            }
        }
        
        return {
            client_id: quotation.client_id.toString(),
            service_type: quotation.quotation_request?.service_type || '',
            problem: problem,
            solution: solution,
            quotation_message: typeof quotation.quotation_message === 'string' 
                ? quotation.quotation_message 
                : JSON.stringify(quotation.quotation_message, null, 2),
            quotation_status: quotation.quotation_status,
        };
    });
    
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [clientComboOpen, setClientComboOpen] = useState(false);

    const serviceTypes = [
        { value: 'web_development', label: 'Web Development' },
        { value: 'mobile_development', label: 'Mobile Development' },
        { value: 'desktop_development', label: 'Desktop Development' },
        { value: 'ai_development', label: 'AI Development' },
        { value: 'graphic_design', label: 'Graphic Design' },
        { value: 'digital_marketing', label: 'Digital Marketing' },
        { value: 'other', label: 'Other' },
    ];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrors({});
        setIsSubmitting(true);

        // Validate form
        const newErrors: Record<string, string> = {};
        if (!form.client_id) newErrors.client_id = 'Client is required';
        if (!form.service_type) newErrors.service_type = 'Service type is required';

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            setIsSubmitting(false);
            return;
        }

        try {
            router.put(`/quotation/${quotation.id}`, form, {
                onSuccess: () => {
                    // Redirect will be handled by the backend
                },
                onError: (errors) => {
                    setErrors(errors);
                },
                onFinish: () => {
                    setIsSubmitting(false);
                }
            });
        } catch (error) {
            console.error('Error updating quotation:', error);
            setIsSubmitting(false);
        }
    };

    const selectedClient = clients.find(client => client.id.toString() === form.client_id);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit Quotation #${quotation.id}`} />
            
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
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Edit Quotation #{quotation.id}</h1>
                        <p className="text-muted-foreground mt-2">Update quotation details and information</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                    <Card className="border-border/50">
                        <CardHeader>
                            <CardTitle className="text-lg font-semibold">Client Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="client_id" className="text-sm font-medium">Select Client *</Label>
                                <Popover open={clientComboOpen} onOpenChange={setClientComboOpen}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            aria-expanded={clientComboOpen}
                                            className={cn(
                                                "w-full justify-between h-10 px-3 py-2 text-left font-normal",
                                                !form.client_id && "text-muted-foreground"
                                            )}
                                        >
                                            <span className="truncate">
                                                {form.client_id
                                                    ? clients.find((client) => client.id.toString() === form.client_id)?.company_name
                                                    : "Choose a client..."}
                                            </span>
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[400px] p-0" align="start">
                                        <Command>
                                            <CommandInput 
                                                placeholder="Search clients..." 
                                                className="h-9"
                                            />
                                            <CommandList className="max-h-[200px]">
                                                <CommandEmpty>No clients found.</CommandEmpty>
                                                <CommandGroup>
                                                    {clients.map((client) => (
                                                        <CommandItem
                                                            key={client.id}
                                                            value={`${client.company_name} ${client.supervisor_name}`}
                                                            onSelect={() => {
                                                                setForm({...form, client_id: client.id.toString()});
                                                                setClientComboOpen(false);
                                                            }}
                                                            className="flex items-center gap-2 p-2 cursor-pointer"
                                                        >
                                                            <Check
                                                                className={cn(
                                                                    "h-4 w-4",
                                                                    client.id.toString() === form.client_id
                                                                        ? "opacity-100"
                                                                        : "opacity-0"
                                                                )}
                                                            />
                                                            <div className="flex flex-col min-w-0 flex-1">
                                                                <div className="font-medium text-sm truncate">{client.company_name}</div>
                                                                <div className="text-xs text-muted-foreground truncate">{client.supervisor_name}</div>
                                                            </div>
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                                {errors.client_id && <p className="text-sm text-red-500 mt-1">{errors.client_id}</p>}
                            </div>

                            {selectedClient && (
                                <div className="bg-muted/50 border rounded-lg p-4">
                                    <h4 className="font-semibold text-sm mb-3">Selected Client Details</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                        <div className="flex flex-col">
                                            <span className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Company</span>
                                            <span className="font-medium">{selectedClient.company_name}</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Supervisor</span>
                                            <span className="font-medium">{selectedClient.supervisor_name}</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Email</span>
                                            <span className="font-medium">{selectedClient.company_email}</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Phone</span>
                                            <span className="font-medium">{selectedClient.company_phone_number}</span>
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
                                <Label htmlFor="service_type" className="text-sm font-medium">Service Type *</Label>
                                <Select
                                    value={form.service_type}
                                    onValueChange={(value) => setForm({...form, service_type: value})}
                                    required
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select service type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {serviceTypes.map((service) => (
                                            <SelectItem key={service.value} value={service.value}>
                                                {service.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.service_type && <p className="text-sm text-red-500 mt-1">{errors.service_type}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="problem" className="text-sm font-medium">Problem Description</Label>
                                <textarea
                                    id="problem"
                                    value={form.problem}
                                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setForm({...form, problem: e.target.value})}
                                    placeholder="What specific problem needs to be solved?"
                                    className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                                />
                                {errors.problem && <p className="text-sm text-red-500 mt-1">{errors.problem}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="solution" className="text-sm font-medium">Proposed Solution</Label>
                                <textarea
                                    id="solution"
                                    value={form.solution}
                                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setForm({...form, solution: e.target.value})}
                                    placeholder="Describe your proposed solution approach..."
                                    className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                                />
                                {errors.solution && <p className="text-sm text-red-500 mt-1">{errors.solution}</p>}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-border/50">
                        <CardHeader>
                            <CardTitle className="text-lg font-semibold">Quotation Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-4">
                                <Label className="text-sm font-medium">Quotation Details *</Label>
                                
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

                                                {/* Raw JSON Editor (fallback) */}
                                                <div className="border rounded-lg p-4 bg-muted/30">
                                                    <h4 className="font-semibold text-sm mb-2">Raw JSON (Advanced)</h4>
                                                    <textarea
                                                        value={form.quotation_message}
                                                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setForm({...form, quotation_message: e.target.value})}
                                                        placeholder="Enter the quotation details as JSON..."
                                                        className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-xs font-mono ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                                                        required
                                                    />
                                                </div>
                                            </div>
                                        );
                                    } catch (error) {
                                        // Fallback for non-JSON data
                                        return (
                                            <div className="space-y-2">
                                                <Label htmlFor="quotation_message" className="text-sm font-medium">Quotation Message *</Label>
                                                <textarea
                                                    id="quotation_message"
                                                    value={form.quotation_message}
                                                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setForm({...form, quotation_message: e.target.value})}
                                                    placeholder="Enter the quotation details..."
                                                    className="flex min-h-[200px] w-full rounded-md border border-input bg-background px-3 py-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                                                    required
                                                />
                                            </div>
                                        );
                                    }
                                })()}
                                {errors.quotation_message && <p className="text-sm text-red-500 mt-1">{errors.quotation_message}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="quotation_status" className="text-sm font-medium">Status *</Label>
                                <Select
                                    value={form.quotation_status}
                                    onValueChange={(value: 'pending' | 'approved' | 'rejected') => setForm({...form, quotation_status: value})}
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
                                {errors.quotation_status && <p className="text-sm text-red-500 mt-1">{errors.quotation_status}</p>}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-border/50 bg-gradient-to-r from-background to-muted/30">
                        <CardContent>
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                <div className="space-y-1">
                                    <h4 className="font-semibold text-lg">Save Changes</h4>
                                </div>
                                <Button 
                                    type="submit" 
                                    disabled={isSubmitting}
                                    className="gap-2 min-w-[150px] h-11"
                                    size="lg"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="w-4 h-4" />
                                            Save Changes
                                        </>
                                    )}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </form>
            </div>
        </AppLayout>
    );
}
