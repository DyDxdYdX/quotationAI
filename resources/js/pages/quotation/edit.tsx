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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { router } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { ArrowLeft, Save, Loader2, Eye, Edit, FileText, Plus, Trash2, DollarSign } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import QuotationRenderer from '@/components/quotation-renderer';

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
    quotation_message: string | object;
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

export default function EditQuotation({ quotation }: { quotation: Quotation }) {
    // Parse quotation message to extract content for editing
    const parseQuotationMessage = () => {
        try {
            const quotationData = typeof quotation.quotation_message === 'string' 
                ? JSON.parse(quotation.quotation_message) 
                : quotation.quotation_message;
            
            // Check if it's the new structured format
            if (quotationData?.quotation && Array.isArray(quotationData.quotation.sections)) {
                return {
                    format: 'structured',
                    meta: quotationData.meta || {},
                    quotation: quotationData.quotation,
                };
            }
            
            // If it's the new text format, extract the content
            if (quotationData?.format === 'text' && quotationData?.content) {
                return {
                    format: quotationData.format,
                    content: quotationData.content,
                    ai_generated: quotationData.ai_generated,
                    generated_at: quotationData.generated_at,
                };
            }
            
            // For old format, return as is
            return quotationData;
        } catch (error) {
            console.error('Error parsing quotation message:', error);
        return {
                format: 'text',
                content: typeof quotation.quotation_message === 'string' 
                ? quotation.quotation_message 
                : JSON.stringify(quotation.quotation_message, null, 2),
                ai_generated: false,
                generated_at: new Date().toISOString(),
            };
        }
    };

    const initialQuotationData = parseQuotationMessage();
    
    // Check if it's structured format
    const isStructuredFormat = initialQuotationData.format === 'structured';
    
    // Parse quotation content into editable sections
    const parseQuotationSections = (content: string) => {
        const sections: any = {
            projectOverview: '',
            timeline: '',
            costBreakdown: null,
            deliverables: [],
            technicalRequirements: '',
            paymentTerms: '',
            supportOptions: '',
        };

        // Extract JSON cost breakdown
        const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
            try {
                const jsonData = JSON.parse(jsonMatch[1]);
                // Handle both formats: { cost_breakdown: {...} } or just { ... } directly
                if (jsonData.cost_breakdown) {
                    sections.costBreakdown = jsonData;
                } else if (jsonData.project_name || Object.keys(jsonData).some(k => typeof jsonData[k] === 'object' && jsonData[k].cost !== undefined)) {
                    // It's a cost breakdown object structure - ensure it has cost_breakdown property
                    const costItems: any = {};
                    Object.keys(jsonData).forEach(key => {
                        if (key !== 'project_name' && key !== 'currency' && typeof jsonData[key] === 'object' && jsonData[key].cost !== undefined) {
                            costItems[key] = jsonData[key];
                        }
                    });
                    sections.costBreakdown = {
                        project_name: jsonData.project_name || '',
                        currency: jsonData.currency || 'RM',
                        cost_breakdown: costItems,
                    };
                }
            } catch (e) {
                console.error('Failed to parse cost breakdown JSON:', e);
            }
        }
        
        // If no cost breakdown found, initialize with empty structure
        if (!sections.costBreakdown) {
            sections.costBreakdown = {
                project_name: '',
                currency: 'RM',
                cost_breakdown: {},
            };
        }
        
        // Ensure cost_breakdown property exists
        if (!sections.costBreakdown.cost_breakdown) {
            sections.costBreakdown.cost_breakdown = {};
        }

        // Extract sections using regex
        const sectionPatterns = {
            projectOverview: /\*\*1\.\s*PROJECT OVERVIEW[^*]*\*\*([\s\S]*?)(?=\*\*2\.|$)/i,
            timeline: /\*\*2\.\s*DETAILED TIMELINE[^*]*\*\*([\s\S]*?)(?=\*\*3\.|$)/i,
            costBreakdown: /\*\*3\.\s*COST BREAKDOWN[^*]*\*\*([\s\S]*?)(?=\*\*4\.|$)/i,
            deliverables: /\*\*4\.\s*DELIVERABLES[^*]*\*\*([\s\S]*?)(?=\*\*5\.|$)/i,
            technicalRequirements: /\*\*5\.\s*TECHNICAL REQUIREMENTS[^*]*\*\*([\s\S]*?)(?=\*\*6\.|$)/i,
            paymentTerms: /\*\*6\.\s*PAYMENT TERMS[^*]*\*\*([\s\S]*?)(?=\*\*7\.|$)/i,
            supportOptions: /\*\*7\.\s*SUPPORT[^*]*\*\*([\s\S]*?)(?=\*\*8\.|$)/i,
        };

        Object.entries(sectionPatterns).forEach(([key, pattern]) => {
            const match = content.match(pattern);
            if (match && match[1]) {
                let sectionContent = match[1].trim();
                
                // Remove JSON code blocks from cost breakdown section
                if (key === 'costBreakdown') {
                    sectionContent = sectionContent.replace(/```json\s*[\s\S]*?\s*```/g, '').trim();
                }
                
                if (key === 'deliverables') {
                    // Extract list items
                    const listItems = sectionContent.match(/^\s*[\*\-\•]\s+(.+)$/gm);
                    if (listItems) {
                        sections.deliverables = listItems.map(item => item.replace(/^\s*[\*\-\•]\s+/, '').trim());
                    }
                } else {
                    sections[key] = sectionContent;
                }
            }
        });

        return sections;
    };

    // Reconstruct markdown content from sections
    const reconstructContent = (sections: any, costBreakdown: any) => {
        let content = '';

        // 1. Project Overview
        if (sections.projectOverview) {
            content += `**1. PROJECT OVERVIEW AND SCOPE**\n\n${sections.projectOverview}\n\n`;
        }

        // 2. Timeline
        if (sections.timeline) {
            content += `**2. DETAILED TIMELINE**\n\n${sections.timeline}\n\n`;
        }

        // 3. Cost Breakdown
        if (costBreakdown && costBreakdown.cost_breakdown) {
            content += `**3. COST BREAKDOWN**\n\n\`\`\`json\n${JSON.stringify(costBreakdown, null, 2)}\n\`\`\`\n\n`;
        }

        // 4. Deliverables
        if (sections.deliverables && sections.deliverables.length > 0) {
            content += `**4. DELIVERABLES AND MILESTONES**\n\n`;
            sections.deliverables.forEach((item: string) => {
                content += `* ${item}\n`;
            });
            content += '\n';
        }

        // 5. Technical Requirements
        if (sections.technicalRequirements) {
            content += `**5. TECHNICAL REQUIREMENTS**\n\n${sections.technicalRequirements}\n\n`;
        }

        // 6. Payment Terms
        if (sections.paymentTerms) {
            content += `**6. PAYMENT TERMS**\n\n${sections.paymentTerms}\n\n`;
        }

        // 7. Support Options
        if (sections.supportOptions) {
            content += `**7. SUPPORT AND MAINTENANCE OPTIONS**\n\n${sections.supportOptions}\n\n`;
        }

        return content.trim();
    };

    // Parse structured format sections
    const parseStructuredSections = (quotation: any) => {
        const sections: any = {
            title: quotation?.title || '',
            currency: quotation?.currency || 'RM',
            sections: quotation?.sections || [],
        };
        return sections;
    };

    const initialSections = isStructuredFormat 
        ? parseStructuredSections(initialQuotationData.quotation)
        : parseQuotationSections(initialQuotationData.content || '');
    
    const [form, setForm] = useState<any>(() => {
        if (isStructuredFormat) {
            return {
                format: 'structured',
                title: initialSections.title || '',
                currency: initialSections.currency || 'RM',
                sections: initialSections.sections || [],
                quotation_status: quotation.quotation_status,
            };
        }
        
        return {
            format: 'text',
            sections: {
                projectOverview: initialSections.projectOverview || '',
                timeline: initialSections.timeline || '',
                deliverables: initialSections.deliverables || [],
                technicalRequirements: initialSections.technicalRequirements || '',
                paymentTerms: initialSections.paymentTerms || '',
                supportOptions: initialSections.supportOptions || '',
            },
            costBreakdown: initialSections.costBreakdown && Object.keys(initialSections.costBreakdown).length > 0 
                ? initialSections.costBreakdown 
                : {
                    project_name: '',
                    currency: 'RM',
                    cost_breakdown: {},
                },
            quotation_status: quotation.quotation_status,
        };
    });
    
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [editMode, setEditMode] = useState<'preview' | 'edit'>('preview');

    // Reconstruct content whenever form changes
    const [quotationContent, setQuotationContent] = useState(() => {
        if (isStructuredFormat) {
            return JSON.stringify({
                meta: initialQuotationData.meta || {
                    ai_generated: true,
                    generated_at: new Date().toISOString(),
                    note: 'AI-generated descriptive content. System adds metadata, totals, and templates for legal terms.',
                    version: '1.0',
                },
                quotation: {
                    title: form.title,
                    currency: form.currency,
                    sections: form.sections,
                },
            }, null, 2);
        }
        return reconstructContent(form.sections, form.costBreakdown);
    });

    useEffect(() => {
        if (isStructuredFormat) {
            setQuotationContent(JSON.stringify({
                meta: initialQuotationData.meta || {
                    ai_generated: true,
                    generated_at: new Date().toISOString(),
                    note: 'AI-generated descriptive content. System adds metadata, totals, and templates for legal terms.',
                    version: '1.0',
                },
                quotation: {
                    title: form.title,
                    currency: form.currency,
                    sections: form.sections,
                },
            }, null, 2));
        } else {
            setQuotationContent(reconstructContent(form.sections, form.costBreakdown));
        }
    }, [form, isStructuredFormat]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrors({});
        setIsSubmitting(true);

        // Validate form
        const newErrors: Record<string, string> = {};
        if (!quotationContent.trim()) {
            newErrors.quotation_content = 'Quotation content is required';
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            setIsSubmitting(false);
            return;
        }

        try {
            // Reconstruct quotation_message JSON with updated content
            let quotationMessage;
            
            if (isStructuredFormat) {
                quotationMessage = {
                    meta: initialQuotationData.meta || {
                        ai_generated: true,
                        generated_at: new Date().toISOString(),
                        note: 'AI-generated descriptive content. System adds metadata, totals, and templates for legal terms.',
                        version: '1.0',
                    },
                    quotation: {
                        title: form.title,
                        currency: form.currency,
                        sections: form.sections,
                    },
                };
            } else {
                quotationMessage = {
                    format: initialQuotationData.format || 'text',
                    content: quotationContent,
                    ai_generated: initialQuotationData.ai_generated !== undefined ? initialQuotationData.ai_generated : true,
                    generated_at: initialQuotationData.generated_at || new Date().toISOString(),
                };
            }

            const submitData = {
                quotation_message: JSON.stringify(quotationMessage),
                quotation_status: form.quotation_status,
            };

            router.put(`/quotation/${quotation.id}`, submitData, {
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

    // Add cost breakdown item
    const addCostItem = () => {
        const newKey = `item_${Date.now()}`;
        setForm({
            ...form,
            costBreakdown: {
                ...form.costBreakdown,
                cost_breakdown: {
                    ...form.costBreakdown.cost_breakdown,
                    [newKey]: {
                        description: '',
                        cost: 0,
                    },
                },
            },
        });
    };

    // Remove cost breakdown item
    const removeCostItem = (key: string) => {
        const newCostBreakdown = { ...form.costBreakdown.cost_breakdown };
        delete newCostBreakdown[key];
        setForm({
            ...form,
            costBreakdown: {
                ...form.costBreakdown,
                cost_breakdown: newCostBreakdown,
            },
        });
    };

    // Update cost breakdown item
    const updateCostItem = (key: string, field: 'description' | 'cost', value: string | number) => {
        setForm({
            ...form,
            costBreakdown: {
                ...form.costBreakdown,
                cost_breakdown: {
                    ...form.costBreakdown.cost_breakdown,
                    [key]: {
                        ...form.costBreakdown.cost_breakdown[key],
                        [field]: value,
                    },
                },
            },
        });
    };

    // Add deliverable
    const addDeliverable = () => {
        setForm({
            ...form,
            sections: {
                ...form.sections,
                deliverables: [...form.sections.deliverables, ''],
            },
        });
    };

    // Remove deliverable
    const removeDeliverable = (index: number) => {
        setForm({
            ...form,
            sections: {
                ...form.sections,
                deliverables: form.sections.deliverables.filter((_: string, i: number) => i !== index),
            },
        });
    };

    // Update deliverable
    const updateDeliverable = (index: number, value: string) => {
        const newDeliverables = [...form.sections.deliverables];
        newDeliverables[index] = value;
        setForm({
            ...form,
            sections: {
                ...form.sections,
                deliverables: newDeliverables,
            },
        });
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

    // Get current quotation data for preview
    const getQuotationDataForPreview = () => {
        if (isStructuredFormat) {
            return {
                meta: initialQuotationData.meta || {
                    ai_generated: true,
                    generated_at: new Date().toISOString(),
                    note: 'AI-generated descriptive content. System adds metadata, totals, and templates for legal terms.',
                    version: '1.0',
                },
                quotation: {
                    title: form.title,
                    currency: form.currency,
                    sections: form.sections,
                },
            };
        }
        return {
            format: initialQuotationData.format || 'text',
            content: quotationContent,
            ai_generated: initialQuotationData.ai_generated !== undefined ? initialQuotationData.ai_generated : true,
            generated_at: initialQuotationData.generated_at || new Date().toISOString(),
        };
    };


    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit Quotation #${quotation.id}`} />
            
            <div className="px-6 py-4">
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
                        <h1 className="text-3xl font-bold tracking-tight text-foreground">Edit Quotation #{quotation.id}</h1>
                            <Badge className={`${getStatusColor(form.quotation_status)} text-xs font-semibold px-3 py-1 border`}>
                                {form.quotation_status.charAt(0).toUpperCase() + form.quotation_status.slice(1)}
                            </Badge>
                        </div>
                        <p className="text-muted-foreground mt-2 text-sm">Update quotation details and information</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                    <Card className="border shadow-sm">
                        <CardHeader className="border-b bg-muted/30">
                            <CardTitle className="text-xl font-bold">Client Information</CardTitle>
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

                    <Card className="border shadow-sm">
                        <CardHeader className="border-b bg-muted/30">
                            <CardTitle className="text-xl font-bold">Service Requirements</CardTitle>
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

                    <Card className="border shadow-sm">
                        <CardHeader className="border-b bg-muted/30">
                            <CardTitle className="text-xl font-bold">AI Generated Quotation</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <Label className="text-sm font-medium">Quotation Details</Label>
                                    <div className="flex gap-2">
                                        <Button
                                            type="button"
                                            variant={editMode === 'preview' ? 'default' : 'outline'}
                                            size="sm"
                                            onClick={() => setEditMode('preview')}
                                            className="gap-2"
                                        >
                                            <Eye className="w-4 h-4" />
                                            Preview
                                        </Button>
                                        <Button
                                            type="button"
                                            variant={editMode === 'edit' ? 'default' : 'outline'}
                                            size="sm"
                                            onClick={() => setEditMode('edit')}
                                            className="gap-2"
                                        >
                                            <Edit className="w-4 h-4" />
                                            Edit
                                        </Button>
                                    </div>
                                </div>
                                
                                {editMode === 'preview' ? (
                                    <div className="border rounded-lg p-4 bg-muted/20 min-h-[400px]">
                                        <QuotationRenderer quotationData={getQuotationDataForPreview()} />
                                    </div>
                                ) : isStructuredFormat ? (
                                    <div className="space-y-6">
                                        {/* Title and Currency */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="quotation_title" className="text-sm font-medium">
                                                    Quotation Title *
                                                </Label>
                                                <Input
                                                    id="quotation_title"
                                                    value={form.title}
                                                    onChange={(e) => setForm({...form, title: e.target.value})}
                                                    placeholder="Enter quotation title"
                                    required
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="quotation_currency" className="text-sm font-medium">
                                                    Currency *
                                                </Label>
                                                <Input
                                                    id="quotation_currency"
                                                    value={form.currency}
                                                    onChange={(e) => setForm({...form, currency: e.target.value})}
                                                    placeholder="RM"
                                                    required
                                                />
                                            </div>
                                        </div>

                                        {/* Sections Editor */}
                                        <div className="space-y-4">
                                            <Label className="text-sm font-medium">Sections</Label>
                                            {form.sections.map((section: any, sectionIndex: number) => (
                                                <div key={sectionIndex} className="border rounded-lg p-4 space-y-3">
                                                    <div className="flex items-center justify-between">
                                                        <Label className="text-sm font-medium">{section.title || `Section ${sectionIndex + 1}`}</Label>
                                                        <div className="flex gap-2">
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => {
                                                                    const newSections = form.sections.filter((_: any, i: number) => i !== sectionIndex);
                                                                    setForm({...form, sections: newSections});
                                                                }}
                                                                className="text-destructive hover:text-destructive"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="space-y-2">
                                                        <Input
                                                            placeholder="Section Title"
                                                            value={section.title || ''}
                                                            onChange={(e) => {
                                                                const newSections = [...form.sections];
                                                                newSections[sectionIndex] = {...section, title: e.target.value};
                                                                setForm({...form, sections: newSections});
                                                            }}
                                                        />
                                                        <Select
                                                            value={section.type || 'markdown'}
                                                            onValueChange={(value) => {
                                                                const newSections = [...form.sections];
                                                                newSections[sectionIndex] = {...section, type: value};
                                                                setForm({...form, sections: newSections});
                                                            }}
                                >
                                    <SelectTrigger>
                                                                <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                                                <SelectItem value="markdown">Markdown</SelectItem>
                                                                <SelectItem value="table">Table</SelectItem>
                                                                <SelectItem value="object">Object (Cost Breakdown)</SelectItem>
                                                                <SelectItem value="list">List</SelectItem>
                                                                <SelectItem value="key_value">Key-Value</SelectItem>
                                                                <SelectItem value="accordion">Accordion</SelectItem>
                                    </SelectContent>
                                </Select>
                                                        
                                                        {/* Render editor based on type */}
                                                        {section.type === 'markdown' && (
                                                            <textarea
                                                                value={section.content || ''}
                                                                onChange={(e) => {
                                                                    const newSections = [...form.sections];
                                                                    newSections[sectionIndex] = {...section, content: e.target.value};
                                                                    setForm({...form, sections: newSections});
                                                                }}
                                                                placeholder="Enter markdown content..."
                                                                className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                                                            />
                                                        )}
                                                        
                                                        {section.type === 'object' && (
                                                            <div className="space-y-2">
                                                                <div className="flex items-center justify-between">
                                                                    <Label className="text-xs">Cost Items</Label>
                                                                    <Button
                                                                        type="button"
                                                                        variant="outline"
                                                                        size="sm"
                                                                        onClick={() => {
                                                                            const newKey = `item_${Date.now()}`;
                                                                            const newSections = [...form.sections];
                                                                            const currentData = section.data || {};
                                                                            newSections[sectionIndex] = {
                                                                                ...section,
                                                                                data: {
                                                                                    ...currentData,
                                                                                    [newKey]: { description: '', cost: 0 }
                                                                                }
                                                                            };
                                                                            setForm({...form, sections: newSections});
                                                                        }}
                                                                        className="gap-1 h-7 text-xs"
                                                                    >
                                                                        <Plus className="w-3 h-3" />
                                                                        Add
                                                                    </Button>
                            </div>
                                                                {section.data && Object.entries(section.data).map(([key, item]: [string, any]) => (
                                                                    <div key={key} className="border rounded p-2 space-y-2">
                                                                        <div className="flex items-center justify-between">
                                                                            <Input
                                                                                value={key}
                                                                                onChange={(e) => {
                                                                                    const newKey = e.target.value;
                                                                                    if (newKey && newKey !== key) {
                                                                                        const newSections = [...form.sections];
                                                                                        const currentData = {...section.data};
                                                                                        currentData[newKey] = currentData[key];
                                                                                        delete currentData[key];
                                                                                        newSections[sectionIndex] = {...section, data: currentData};
                                                                                        setForm({...form, sections: newSections});
                                                                                    }
                                                                                }}
                                                                                className="font-mono text-xs flex-1 mr-2"
                                                                                placeholder="Item key"
                                                                            />
                                                                            <Button
                                                                                type="button"
                                                                                variant="ghost"
                                                                                size="sm"
                                                                                onClick={() => {
                                                                                    const newSections = [...form.sections];
                                                                                    const currentData = {...section.data};
                                                                                    delete currentData[key];
                                                                                    newSections[sectionIndex] = {...section, data: currentData};
                                                                                    setForm({...form, sections: newSections});
                                                                                }}
                                                                                className="text-destructive hover:text-destructive h-7"
                                                                            >
                                                                                <Trash2 className="w-3 h-3" />
                                                                            </Button>
                                                                        </div>
                                                                        <Input
                                                                            value={item.description || ''}
                                                                            onChange={(e) => {
                                                                                const newSections = [...form.sections];
                                                                                const currentData = {...section.data};
                                                                                currentData[key] = {...item, description: e.target.value};
                                                                                newSections[sectionIndex] = {...section, data: currentData};
                                                                                setForm({...form, sections: newSections});
                                                                            }}
                                                                            placeholder="Description"
                                                                        />
                                                                        <Input
                                                                            type="number"
                                                                            value={item.cost || 0}
                                                                            onChange={(e) => {
                                                                                const newSections = [...form.sections];
                                                                                const currentData = {...section.data};
                                                                                currentData[key] = {...item, cost: parseFloat(e.target.value) || 0};
                                                                                newSections[sectionIndex] = {...section, data: currentData};
                                                                                setForm({...form, sections: newSections});
                                                                            }}
                                                                            placeholder="Cost"
                                                                        />
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                        
                                                        {section.type === 'list' && (
                            <div className="space-y-2">
                                                                {section.items && section.items.map((item: string, itemIndex: number) => (
                                                                    <div key={itemIndex} className="flex gap-2">
                                                                        <Input
                                                                            value={item}
                                                                            onChange={(e) => {
                                                                                const newSections = [...form.sections];
                                                                                const newItems = [...(section.items || [])];
                                                                                newItems[itemIndex] = e.target.value;
                                                                                newSections[sectionIndex] = {...section, items: newItems};
                                                                                setForm({...form, sections: newSections});
                                                                            }}
                                                                            placeholder="List item"
                                                                            className="flex-1"
                                                                        />
                                                                        <Button
                                                                            type="button"
                                                                            variant="ghost"
                                                                            size="sm"
                                                                            onClick={() => {
                                                                                const newSections = [...form.sections];
                                                                                const newItems = section.items.filter((_: string, i: number) => i !== itemIndex);
                                                                                newSections[sectionIndex] = {...section, items: newItems};
                                                                                setForm({...form, sections: newSections});
                                                                            }}
                                                                            className="text-destructive hover:text-destructive"
                                                                        >
                                                                            <Trash2 className="w-4 h-4" />
                                                                        </Button>
                                                                    </div>
                                                                ))}
                                                                <Button
                                                                    type="button"
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() => {
                                                                        const newSections = [...form.sections];
                                                                        const newItems = [...(section.items || []), ''];
                                                                        newSections[sectionIndex] = {...section, items: newItems};
                                                                        setForm({...form, sections: newSections});
                                                                    }}
                                                                    className="gap-2"
                                                                >
                                                                    <Plus className="w-4 h-4" />
                                                                    Add Item
                                                                </Button>
                                                            </div>
                                                        )}
                                                        
                                                        {section.type === 'table' && (
                                                            <div className="space-y-3">
                                                                <div className="flex items-center justify-between">
                                                                    <Label className="text-xs">Table Headers</Label>
                                                                    <Button
                                                                        type="button"
                                                                        variant="outline"
                                                                        size="sm"
                                                                        onClick={() => {
                                                                            const newSections = [...form.sections];
                                                                            const currentHeaders = section.headers || [];
                                                                            newSections[sectionIndex] = {
                                                                                ...section,
                                                                                headers: [...currentHeaders, `Header ${currentHeaders.length + 1}`]
                                                                            };
                                                                            setForm({...form, sections: newSections});
                                                                        }}
                                                                        className="gap-1 h-7 text-xs"
                                                                    >
                                                                        <Plus className="w-3 h-3" />
                                                                        Add Header
                                                                    </Button>
                                                                </div>
                                                                
                                                                {section.headers && section.headers.length > 0 ? (
                                                                    <div className="border rounded-lg p-3 space-y-2">
                                                                        <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${section.headers.length}, 1fr) auto` }}>
                                                                            {section.headers.map((header: string, headerIndex: number) => (
                                                                                <div key={headerIndex} className="flex gap-2">
                                                                                    <Input
                                                                                        value={header}
                                                                                        onChange={(e) => {
                                                                                            const newSections = [...form.sections];
                                                                                            const newHeaders = [...(section.headers || [])];
                                                                                            newHeaders[headerIndex] = e.target.value;
                                                                                            newSections[sectionIndex] = {...section, headers: newHeaders};
                                                                                            setForm({...form, sections: newSections});
                                                                                        }}
                                                                                        placeholder={`Header ${headerIndex + 1}`}
                                                                                        className="text-xs"
                                                                                    />
                                                                                    {section.headers.length > 1 && (
                                                                                        <Button
                                                                                            type="button"
                                                                                            variant="ghost"
                                                                                            size="sm"
                                                                                            onClick={() => {
                                                                                                const newSections = [...form.sections];
                                                                                                const newHeaders = section.headers.filter((_: string, i: number) => i !== headerIndex);
                                                                                                // Remove corresponding column from all rows
                                                                                                const newRows = (section.rows || []).map((row: any[]) => 
                                                                                                    row.filter((_: any, i: number) => i !== headerIndex)
                                                                                                );
                                                                                                newSections[sectionIndex] = {...section, headers: newHeaders, rows: newRows};
                                                                                                setForm({...form, sections: newSections});
                                                                                            }}
                                                                                            className="text-destructive hover:text-destructive h-7 w-7 p-0"
                                                                                        >
                                                                                            <Trash2 className="w-3 h-3" />
                                                                                        </Button>
                                                                                    )}
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                ) : (
                                                                    <div className="text-center py-4 text-sm text-muted-foreground border border-dashed rounded-lg">
                                                                        No headers yet. Click "Add Header" to add one.
                                                                    </div>
                                                                )}
                                                                
                                                                {section.headers && section.headers.length > 0 && (
                                                                    <div className="space-y-2">
                                                                        <div className="flex items-center justify-between">
                                                                            <Label className="text-xs">Table Rows</Label>
                                                                            <Button
                                                                                type="button"
                                                                                variant="outline"
                                                                                size="sm"
                                                                                onClick={() => {
                                                                                    const newSections = [...form.sections];
                                                                                    const currentRows = section.rows || [];
                                                                                    const newRow = Array(section.headers.length).fill('');
                                                                                    newSections[sectionIndex] = {
                                                                                        ...section,
                                                                                        rows: [...currentRows, newRow]
                                                                                    };
                                                                                    setForm({...form, sections: newSections});
                                                                                }}
                                                                                className="gap-1 h-7 text-xs"
                                                                            >
                                                                                <Plus className="w-3 h-3" />
                                                                                Add Row
                                                                            </Button>
                                                                        </div>
                                                                        
                                                                        <div className="border rounded-lg overflow-hidden">
                                                                            <div className="overflow-x-auto">
                                                                                <table className="w-full text-sm border-collapse">
                                                                                    <thead>
                                                                                        <tr className="bg-muted/50 border-b">
                                                                                            {section.headers.map((header: string, hIdx: number) => (
                                                                                                <th key={hIdx} className="text-left p-2 font-medium border-r last:border-r-0">
                                                                                                    {header || `Column ${hIdx + 1}`}
                                                                                                </th>
                                                                                            ))}
                                                                                            <th className="w-10 p-2"></th>
                                                                                        </tr>
                                                                                    </thead>
                                                                                    <tbody>
                                                                                        {section.rows && section.rows.map((row: any[], rowIndex: number) => (
                                                                                            <tr key={rowIndex} className="border-b hover:bg-muted/30">
                                                                                                {section.headers.map((_: string, colIndex: number) => (
                                                                                                    <td key={colIndex} className="p-1 border-r last:border-r-0">
                                                                                                        <Input
                                                                                                            value={row[colIndex] || ''}
                                                                                                            onChange={(e) => {
                                                                                                                const newSections = [...form.sections];
                                                                                                                const newRows = [...(section.rows || [])];
                                                                                                                const newRow = [...newRows[rowIndex]];
                                                                                                                newRow[colIndex] = e.target.value;
                                                                                                                newRows[rowIndex] = newRow;
                                                                                                                newSections[sectionIndex] = {...section, rows: newRows};
                                                                                                                setForm({...form, sections: newSections});
                                                                                                            }}
                                                                                                            placeholder={`Row ${rowIndex + 1}, Col ${colIndex + 1}`}
                                                                                                            className="border-0 h-8 text-xs focus-visible:ring-1"
                                                                                                        />
                                                                                                    </td>
                                                                                                ))}
                                                                                                <td className="p-1 text-center">
                                                                                                    <Button
                                                                                                        type="button"
                                                                                                        variant="ghost"
                                                                                                        size="sm"
                                                                                                        onClick={() => {
                                                                                                            const newSections = [...form.sections];
                                                                                                            const newRows = section.rows.filter((_: any[], i: number) => i !== rowIndex);
                                                                                                            newSections[sectionIndex] = {...section, rows: newRows};
                                                                                                            setForm({...form, sections: newSections});
                                                                                                        }}
                                                                                                        className="text-destructive hover:text-destructive h-7 w-7 p-0"
                                                                                                    >
                                                                                                        <Trash2 className="w-3 h-3" />
                                                                                                    </Button>
                                                                                                </td>
                                                                                            </tr>
                                                                                        ))}
                                                                                    </tbody>
                                                                                </table>
                                                                            </div>
                                                                        </div>
                                                                        
                                                                        {(!section.rows || section.rows.length === 0) && (
                                                                            <div className="text-center py-4 text-sm text-muted-foreground border border-dashed rounded-lg">
                                                                                No rows yet. Click "Add Row" to add one.
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                        
                                                        {section.type === 'key_value' && (
                                                            <div className="space-y-2">
                                                                {section.data && Object.entries(section.data).map(([key, value]: [string, any]) => (
                                                                    <div key={key} className="grid grid-cols-2 gap-2">
                                                                        <Input
                                                                            value={key}
                                                                            onChange={(e) => {
                                                                                const newKey = e.target.value;
                                                                                if (newKey && newKey !== key) {
                                                                                    const newSections = [...form.sections];
                                                                                    const currentData = {...section.data};
                                                                                    currentData[newKey] = currentData[key];
                                                                                    delete currentData[key];
                                                                                    newSections[sectionIndex] = {...section, data: currentData};
                                                                                    setForm({...form, sections: newSections});
                                                                                }
                                                                            }}
                                                                            placeholder="Key"
                                                                        />
                                                                        <div className="flex gap-2">
                                                                            <Input
                                                                                value={String(value)}
                                                                                onChange={(e) => {
                                                                                    const newSections = [...form.sections];
                                                                                    const currentData = {...section.data};
                                                                                    currentData[key] = e.target.value;
                                                                                    newSections[sectionIndex] = {...section, data: currentData};
                                                                                    setForm({...form, sections: newSections});
                                                                                }}
                                                                                placeholder="Value"
                                                                                className="flex-1"
                                                                            />
                                                                            <Button
                                                                                type="button"
                                                                                variant="ghost"
                                                                                size="sm"
                                                                                onClick={() => {
                                                                                    const newSections = [...form.sections];
                                                                                    const currentData = {...section.data};
                                                                                    delete currentData[key];
                                                                                    newSections[sectionIndex] = {...section, data: currentData};
                                                                                    setForm({...form, sections: newSections});
                                                                                }}
                                                                                className="text-destructive hover:text-destructive"
                                                                            >
                                                                                <Trash2 className="w-4 h-4" />
                                                                            </Button>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                                <Button
                                                                    type="button"
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() => {
                                                                        const newSections = [...form.sections];
                                                                        const currentData = {...(section.data || {}), [`key_${Date.now()}`]: ''};
                                                                        newSections[sectionIndex] = {...section, data: currentData};
                                                                        setForm({...form, sections: newSections});
                                                                    }}
                                                                    className="gap-2"
                                                                >
                                                                    <Plus className="w-4 h-4" />
                                                                    Add Key-Value
                                                                </Button>
                                                            </div>
                                                        )}
                                                        
                                                        {section.type === 'accordion' && (
                                                            <div className="space-y-2">
                                                                {section.items && section.items.map((item: any, itemIndex: number) => (
                                                                    <div key={itemIndex} className="border rounded p-2 space-y-2">
                                                                        <div className="flex items-center justify-between">
                                                                            <Input
                                                                                value={item.name || ''}
                                                                                onChange={(e) => {
                                                                                    const newSections = [...form.sections];
                                                                                    const newItems = [...(section.items || [])];
                                                                                    newItems[itemIndex] = {...item, name: e.target.value};
                                                                                    newSections[sectionIndex] = {...section, items: newItems};
                                                                                    setForm({...form, sections: newSections});
                                                                                }}
                                                                                placeholder="Name"
                                                                                className="flex-1 mr-2"
                                                                            />
                                                                            <Button
                                                                                type="button"
                                                                                variant="ghost"
                                                                                size="sm"
                                                                                onClick={() => {
                                                                                    const newSections = [...form.sections];
                                                                                    const newItems = section.items.filter((_: any, i: number) => i !== itemIndex);
                                                                                    newSections[sectionIndex] = {...section, items: newItems};
                                                                                    setForm({...form, sections: newSections});
                                                                                }}
                                                                                className="text-destructive hover:text-destructive"
                                                                            >
                                                                                <Trash2 className="w-4 h-4" />
                                                                            </Button>
                                                                        </div>
                                                                        <Input
                                                                            value={item.availability || ''}
                                                                            onChange={(e) => {
                                                                                const newSections = [...form.sections];
                                                                                const newItems = [...(section.items || [])];
                                                                                newItems[itemIndex] = {...item, availability: e.target.value};
                                                                                newSections[sectionIndex] = {...section, items: newItems};
                                                                                setForm({...form, sections: newSections});
                                                                            }}
                                                                            placeholder="Availability"
                                                                        />
                                <textarea
                                                                            value={item.description || ''}
                                                                            onChange={(e) => {
                                                                                const newSections = [...form.sections];
                                                                                const newItems = [...(section.items || [])];
                                                                                newItems[itemIndex] = {...item, description: e.target.value};
                                                                                newSections[sectionIndex] = {...section, items: newItems};
                                                                                setForm({...form, sections: newSections});
                                                                            }}
                                                                            placeholder="Description"
                                                                            className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-3 text-sm"
                                                                        />
                            </div>
                                                                ))}
                                                                <Button
                                                                    type="button"
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() => {
                                                                        const newSections = [...form.sections];
                                                                        const newItems = [...(section.items || []), { name: '', availability: '', description: '' }];
                                                                        newSections[sectionIndex] = {...section, items: newItems};
                                                                        setForm({...form, sections: newSections});
                                                                    }}
                                                                    className="gap-2"
                                                                >
                                                                    <Plus className="w-4 h-4" />
                                                                    Add Accordion Item
                                                                </Button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                            
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => {
                                                    setForm({
                                                        ...form,
                                                        sections: [...form.sections, {
                                                            id: `section_${Date.now()}`,
                                                            type: 'markdown',
                                                            title: '',
                                                            content: ''
                                                        }]
                                                    });
                                                }}
                                                className="gap-2 w-full"
                                            >
                                                <Plus className="w-4 h-4" />
                                                Add Section
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        {/* Project Overview */}
                            <div className="space-y-2">
                                            <Label htmlFor="project_overview" className="text-sm font-medium">
                                                1. Project Overview and Scope *
                                            </Label>
                                <textarea
                                                id="project_overview"
                                                value={form.sections.projectOverview}
                                                onChange={(e) => setForm({
                                                    ...form,
                                                    sections: { ...form.sections, projectOverview: e.target.value }
                                                })}
                                                placeholder="Describe the project overview, scope, objectives, and approach..."
                                    className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                                                required
                                />
                            </div>

                                        {/* Timeline */}
                                        <div className="space-y-2">
                                            <Label htmlFor="timeline" className="text-sm font-medium">
                                                2. Detailed Timeline
                                            </Label>
                                            <textarea
                                                id="timeline"
                                                value={form.sections.timeline}
                                                onChange={(e) => setForm({
                                                    ...form,
                                                    sections: { ...form.sections, timeline: e.target.value }
                                                })}
                                                placeholder="Describe project phases, duration, and milestones. You can use markdown table format."
                                                className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-3 text-sm font-mono ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                                            />
                                        </div>

                                        {/* Cost Breakdown */}
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <Label className="text-sm font-medium flex items-center gap-2">
                                                    <DollarSign className="w-4 h-4" />
                                                    3. Cost Breakdown
                                                </Label>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={addCostItem}
                                                    className="gap-2"
                                                >
                                                    <Plus className="w-4 h-4" />
                                                    Add Item
                                                </Button>
                                            </div>
                                            <div className="space-y-3">
                                                <div className="grid grid-cols-2 gap-3">
                                                    <Input
                                                        placeholder="Project Name"
                                                        value={form.costBreakdown.project_name || ''}
                                                        onChange={(e) => setForm({
                                                            ...form,
                                                            costBreakdown: {
                                                                ...form.costBreakdown,
                                                                project_name: e.target.value
                                                            }
                                                        })}
                                                    />
                                                    <Input
                                                        placeholder="Currency (e.g., RM)"
                                                        value={form.costBreakdown.currency || 'RM'}
                                                        onChange={(e) => setForm({
                                                            ...form,
                                                            costBreakdown: {
                                                                ...form.costBreakdown,
                                                                currency: e.target.value
                                                            }
                                                        })}
                                                    />
                                                </div>
                                                
                                                {Object.entries(form.costBreakdown.cost_breakdown || {}).map(([key, item]: [string, any]) => (
                                                    <div key={key} className="border rounded-lg p-4 space-y-3">
                                                        <div className="flex items-center justify-between">
                                                            <Label className="text-sm font-medium">
                                                                {key.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                                                            </Label>
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => removeCostItem(key)}
                                                                className="text-destructive hover:text-destructive"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </Button>
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Input
                                                                placeholder="Item key (e.g., discovery_and_planning)"
                                                                value={key}
                                                                onChange={(e) => {
                                                                    const newKey = e.target.value;
                                                                    if (newKey && newKey !== key) {
                                                                        const newCostBreakdown = { ...form.costBreakdown.cost_breakdown };
                                                                        newCostBreakdown[newKey] = newCostBreakdown[key];
                                                                        delete newCostBreakdown[key];
                                                                        setForm({
                                                                            ...form,
                                                                            costBreakdown: {
                                                                                ...form.costBreakdown,
                                                                                cost_breakdown: newCostBreakdown,
                                                                            },
                                                                        });
                                                                    }
                                                                }}
                                                                className="font-mono text-xs"
                                                            />
                                                            <Input
                                                                placeholder="Item description"
                                                                value={item.description || ''}
                                                                onChange={(e) => updateCostItem(key, 'description', e.target.value)}
                                                            />
                                                            <Input
                                                                type="number"
                                                                placeholder="Cost amount"
                                                                value={item.cost || 0}
                                                                onChange={(e) => updateCostItem(key, 'cost', parseFloat(e.target.value) || 0)}
                                                            />
                                                        </div>
                                                    </div>
                                                ))}
                                                
                                                {(!form.costBreakdown.cost_breakdown || Object.keys(form.costBreakdown.cost_breakdown).length === 0) && (
                                                    <div className="text-center py-8 text-sm text-muted-foreground border border-dashed rounded-lg">
                                                        No cost items yet. Click "Add Item" to add one.
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Deliverables */}
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <Label className="text-sm font-medium">
                                                    4. Deliverables and Milestones
                                                </Label>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={addDeliverable}
                                                    className="gap-2"
                                                >
                                                    <Plus className="w-4 h-4" />
                                                    Add Deliverable
                                                </Button>
                                            </div>
                                            <div className="space-y-2">
                                                {form.sections.deliverables.map((deliverable: string, index: number) => (
                                                    <div key={index} className="flex items-center gap-2">
                                                        <Input
                                                            value={deliverable}
                                                            onChange={(e) => updateDeliverable(index, e.target.value)}
                                                            placeholder="Enter deliverable description"
                                                            className="flex-1"
                                                        />
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => removeDeliverable(index)}
                                                            className="text-destructive hover:text-destructive"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                </div>
                                                ))}
                                                {form.sections.deliverables.length === 0 && (
                                                    <div className="text-center py-4 text-sm text-muted-foreground border border-dashed rounded-lg">
                                                        No deliverables yet. Click "Add Deliverable" to add one.
                                            </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Technical Requirements */}
                                            <div className="space-y-2">
                                            <Label htmlFor="technical_requirements" className="text-sm font-medium">
                                                5. Technical Requirements
                                            </Label>
                                                <textarea
                                                id="technical_requirements"
                                                value={form.sections.technicalRequirements}
                                                onChange={(e) => setForm({
                                                    ...form,
                                                    sections: { ...form.sections, technicalRequirements: e.target.value }
                                                })}
                                                placeholder="Describe technical requirements, platforms, technologies needed..."
                                                className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                                                />
                                            </div>

                                        {/* Payment Terms */}
                                        <div className="space-y-2">
                                            <Label htmlFor="payment_terms" className="text-sm font-medium">
                                                6. Payment Terms
                                            </Label>
                                            <textarea
                                                id="payment_terms"
                                                value={form.sections.paymentTerms}
                                                onChange={(e) => setForm({
                                                    ...form,
                                                    sections: { ...form.sections, paymentTerms: e.target.value }
                                                })}
                                                placeholder="Describe payment structure and terms..."
                                                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                                            />
                            </div>

                                        {/* Support Options */}
                            <div className="space-y-2">
                                            <Label htmlFor="support_options" className="text-sm font-medium">
                                                7. Support and Maintenance Options
                                            </Label>
                                            <textarea
                                                id="support_options"
                                                value={form.sections.supportOptions}
                                                onChange={(e) => setForm({
                                                    ...form,
                                                    sections: { ...form.sections, supportOptions: e.target.value }
                                                })}
                                                placeholder="Describe available support packages and maintenance options..."
                                                className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                                            />
                                        </div>

                                        {errors.quotation_content && <p className="text-sm text-red-500 mt-1">{errors.quotation_content}</p>}
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-4 text-sm pt-4 border-t">
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

                    <Card className="border shadow-sm">
                        <CardContent className="pt-6">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                <div className="space-y-1">
                                    <h4 className="font-bold text-lg text-foreground">Save Changes</h4>
                                    <p className="text-sm text-muted-foreground">Review your changes before saving</p>
                                </div>
                                <Button 
                                    type="submit" 
                                    disabled={isSubmitting}
                                    className="gap-2 min-w-[150px] h-11 bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
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
