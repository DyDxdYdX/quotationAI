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
// Using HTML textarea since UI component doesn't exist
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
import { ArrowLeft, Sparkles, Loader2, Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Manage Quotation',
        href: '/manage-quotation',
    },
    {
        title: 'Create New Quotation',
        href: '/quotation/create',
    },
];

interface Client {
    id: number;
    supervisor_name: string;
    company_name: string;
    company_email: string;
    company_phone_number: string;
}

export default function CreateQuotation({ clients }: { clients: Client[] }) {
    const [form, setForm] = useState({
        client_id: '',
        service_type: '',
        problem: '',
        solution: '',
    });
    const [isGenerating, setIsGenerating] = useState(false);
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
        setIsGenerating(true);

        // Validate form
        const newErrors: Record<string, string> = {};
        if (!form.client_id) newErrors.client_id = 'Client is required';
        if (!form.service_type) newErrors.service_type = 'Service type is required';
        if (!form.problem) newErrors.problem = 'Problem description is required';
        if (!form.solution) newErrors.solution = 'Solution description is required';

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            setIsGenerating(false);
            return;
        }

        try {
            router.post('/quotation/generate', form, {
                onSuccess: () => {
                    // Redirect will be handled by the backend
                },
                onError: (errors) => {
                    setErrors(errors);
                },
                onFinish: () => {
                    setIsGenerating(false);
                }
            });
        } catch (error) {
            console.error('Error generating quotation:', error);
            setIsGenerating(false);
        }
    };

    const selectedClient = clients.find(client => client.id.toString() === form.client_id);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create New Quotation" />
            
            <div className="px-6 py-4">
                <div className="flex items-center gap-4 mb-6">
                    <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => router.get('/manage-quotation')}
                        className="h-9 w-9"
                    >
                        <ArrowLeft className="w-4 h-4" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-foreground">Create New Quotation</h1>
                        <p className="text-muted-foreground mt-2 text-sm">Generate an AI-powered quotation based on client requirements</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <Card className="border shadow-sm">
                        <CardHeader className="border-b bg-muted/30">
                            <CardTitle className="text-xl font-bold">Client Information</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div>
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

                    <Card className="border shadow-sm">
                        <CardHeader className="border-b bg-muted/30">
                            <CardTitle className="text-xl font-bold">Service Requirements</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
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
                                <Label htmlFor="problem" className="text-sm font-medium">Problem Description *</Label>
                                <textarea
                                    id="problem"
                                    value={form.problem}
                                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setForm({...form, problem: e.target.value})}
                                    placeholder="What specific problem needs to be solved?"
                                    className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                                    required
                                />
                                {errors.problem && <p className="text-sm text-red-500 mt-1">{errors.problem}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="solution" className="text-sm font-medium">Proposed Solution *</Label>
                                <textarea
                                    id="solution"
                                    value={form.solution}
                                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setForm({...form, solution: e.target.value})}
                                    placeholder="Describe your proposed solution approach..."
                                    className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                                    required
                                />
                                {errors.solution && <p className="text-sm text-red-500 mt-1">{errors.solution}</p>}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border shadow-sm">
                        <CardContent className="pt-6">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                <div className="space-y-1">
                                    <h4 className="font-bold text-lg text-foreground">Generate AI Quotation</h4>
                                    <p className="text-sm text-muted-foreground">Click the button below to generate your quotation</p>
                                </div>
                                <Button 
                                    type="submit" 
                                    disabled={isGenerating}
                                    className="gap-2 min-w-[180px] h-11 bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
                                    size="lg"
                                >
                                    {isGenerating ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Generating...
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles className="w-4 h-4" />
                                            Generate Quotation
                                        </>
                                    )}
                                </Button>
                            </div>

                            {isGenerating && (
                                <div className="mt-6 p-4 bg-primary/10 border border-primary/20 rounded-lg">
                                    <div className="flex items-center gap-2 text-primary">
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        <span className="text-sm font-medium">Generating quotation with AI...</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Please wait while we process your request with Google Gemini API
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </form>
            </div>
        </AppLayout>
    );
}
