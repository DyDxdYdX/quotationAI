import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Calendar, DollarSign, Package, Clock, CreditCard } from 'lucide-react';

interface QuotationData {
    [key: string]: any;
}

interface QuotationRendererProps {
    quotationData: QuotationData;
    className?: string;
}

// Shared helper functions
const formatCurrency = (value: number | string, currency: string = 'RM'): string => {
    const num = typeof value === 'string' ? parseFloat(value.replace(/[^\d.]/g, '')) : value;
    return `${currency} ${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const renderBoldText = (text: string): React.ReactNode => {
    if (!text || typeof text !== 'string') return text;
    
    const parts: (string | React.ReactNode)[] = [];
    let key = 0;
    let lastIndex = 0;
    
    const boldRegex = /\*\*([^*]+?)\*\*/g;
    let match;
    
    boldRegex.lastIndex = 0;
    
    while ((match = boldRegex.exec(text)) !== null) {
        if (match.index > lastIndex) {
            parts.push(text.substring(lastIndex, match.index));
        }
        parts.push(<strong key={key++}>{match[1]}</strong>);
        lastIndex = match.index + match[0].length;
    }
    
    if (lastIndex < text.length) {
        parts.push(text.substring(lastIndex));
    }
    
    if (parts.length === 0) {
        return text;
    }
    
    return <>{parts}</>;
};

const renderFormattedText = (text: string): React.ReactNode => {
    const paragraphs = text.split(/\n\n+/).filter(p => p.trim());
    
    const renderParagraph = (para: string, idx: number): React.ReactNode => {
        para = para.trim();
        
        if (para.match(/^\s*[\*\-\•]/m)) {
            const listRegex = /^\s*[\*\-\•]\s+(.+)$/gm;
            const items: string[] = [];
            let match;
            while ((match = listRegex.exec(para)) !== null) {
                items.push(match[1].trim());
            }
            return (
                <ul key={idx} className="space-y-2 list-disc list-inside text-sm text-muted-foreground ml-4">
                    {items.map((item, itemIdx) => (
                        <li key={itemIdx}>{renderBoldText(item.replace(/^\s*[\*\-\•]\s+/, ''))}</li>
                    ))}
                </ul>
            );
        }
        
        return (
            <p key={idx} className="text-sm text-muted-foreground leading-relaxed">
                {renderBoldText(para)}
            </p>
        );
    };
    
    return (
        <div className="space-y-4">
            {paragraphs.map((para, idx) => renderParagraph(para, idx))}
        </div>
    );
};

// Gemini Text Format Renderer
const GeminiTextRenderer: React.FC<QuotationRendererProps> = ({ quotationData, className = "" }) => {
    const content = quotationData?.content || '';
    const generatedAt = quotationData?.generated_at;

    // Extract JSON cost breakdown from content
    const extractJsonFromContent = (text: string): any => {
        // Try to find JSON in code blocks
        const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
            try {
                return JSON.parse(jsonMatch[1]);
            } catch (e) {
                console.error('Failed to parse JSON from content:', e);
            }
        }
        return null;
    };

    // Parse markdown-like sections
    const parseSections = (text: string): { [key: string]: string } => {
        const sections: { [key: string]: string } = {};
        const sectionRegex = /\*\*(\d+\.\s*[^*]+)\*\*\s*\n([\s\S]*?)(?=\*\*\d+\.|$)/g;
        let match;

        while ((match = sectionRegex.exec(text)) !== null) {
            const title = match[1].trim();
            const content = match[2].trim();
            sections[title] = content;
        }

        return sections;
    };

    // Extract header information
    const extractHeader = (text: string) => {
        const header: any = {};
        const quotationMatch = text.match(/\*\*Quotation Number:\*\*\s*([^\n]+)/i);
        const dateMatch = text.match(/\*\*Date:\*\*\s*([^\n]+)/i);
        const validUntilMatch = text.match(/\*\*Valid Until:\*\*\s*([^\n]+)/i);
        
        if (quotationMatch) header.quotationNumber = quotationMatch[1].trim();
        if (dateMatch) header.date = dateMatch[1].trim();
        if (validUntilMatch) header.validUntil = validUntilMatch[1].trim();
        
        return header;
    };

    // Parse table from markdown
    const parseTable = (text: string): Array<{ [key: string]: string }> | null => {
        const allLines = text.split('\n');
        const tableLines: string[] = [];
        
        // Collect all table rows, excluding separator rows
        for (const line of allLines) {
            const trimmed = line.trim();
            if (trimmed.startsWith('|')) {
                // Check if it's a separator row (contains only dashes/colons)
                if (!trimmed.match(/^\|\s*[:-\s|]+\s*\|$/)) {
                    tableLines.push(trimmed);
                }
            }
        }
        
        if (tableLines.length < 1) return null;
        
        // Get headers from first line
        const headers = tableLines[0].split('|').map(h => h.trim()).filter(h => h);
        if (headers.length === 0) return null;
        
        const rows: Array<{ [key: string]: string }> = [];
        
        // Process data rows (skip header)
        for (let i = 1; i < tableLines.length; i++) {
            const values = tableLines[i].split('|').map(v => v.trim()).filter(v => v);
            // Match column count, allowing for slight variations
            if (values.length >= headers.length) {
                const row: { [key: string]: string } = {};
                headers.forEach((header, index) => {
                    row[header] = values[index] || '';
                });
                rows.push(row);
            }
        }
        
        return rows.length > 0 ? rows : null;
    };

    // Parse list items
    const parseList = (text: string): string[] => {
        const listItems: string[] = [];
        const listRegex = /^\s*[\*\-\•]\s+(.+)$/gm;
        let match;
        
        while ((match = listRegex.exec(text)) !== null) {
            listItems.push(match[1].trim());
        }
        
        return listItems;
    };


    const jsonData = extractJsonFromContent(content);
    const header = extractHeader(content);
    const sections = parseSections(content);

    // Extract cost breakdown if available
    // The JSON structure is: { project_name, currency, cost_breakdown: { ... } }
    const costBreakdown = jsonData?.cost_breakdown || jsonData;
    const currency = jsonData?.currency || 'RM';

    return (
        <div className={`space-y-6 ${className}`}>
            {/* Header Section */}
            {header.quotationNumber && (
                <Card className="border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-2xl font-bold flex items-center gap-2">
                                    <FileText className="w-6 h-6" />
                                    Quotation {header.quotationNumber}
                                </CardTitle>
                                <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                                    {header.date && (
                                        <span className="flex items-center gap-1">
                                            <Calendar className="w-4 h-4" />
                                            Date: {header.date}
                                        </span>
                                    )}
                                    {header.validUntil && (
                                        <span className="flex items-center gap-1">
                                            <Clock className="w-4 h-4" />
                                            Valid Until: {header.validUntil}
                                        </span>
                                    )}
                                </div>
                            </div>
                            {generatedAt && (
                                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                    AI Generated
                                </Badge>
                            )}
                        </div>
                    </CardHeader>
                </Card>
            )}

            {/* Cost Breakdown */}
            {costBreakdown && typeof costBreakdown === 'object' && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <DollarSign className="w-5 h-5" />
                            Cost Breakdown
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {(() => {
                                // Handle nested cost_breakdown structure
                                const breakdown = costBreakdown.cost_breakdown || costBreakdown;
                                const items = Object.entries(breakdown).filter(([key]) => 
                                    !['subtotal', 'total_project_cost', 'project_name', 'currency'].includes(key)
                                );
                                
                                if (items.length === 0) return null;
                                
                                let totalCost = breakdown.total_project_cost || breakdown.subtotal;
                                
                                return (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="border-b border-border">
                                                    <th className="text-left py-3 px-4 font-medium">Item</th>
                                                    <th className="text-left py-3 px-4 font-medium">Description</th>
                                                    <th className="text-right py-3 px-4 font-medium">Cost</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {items.map(([key, value]: [string, any]) => {
                                                    if (typeof value === 'object' && value.cost !== undefined) {
                                                        return (
                                                            <tr key={key} className="border-b border-border/50 hover:bg-muted/30">
                                                                <td className="py-3 px-4 font-medium capitalize">
                                                                    {key.replace(/_/g, ' ')}
                                                                </td>
                                                                <td className="py-3 px-4 text-muted-foreground text-sm">
                                                                    {value.description || '-'}
                                                                </td>
                                                                <td className="py-3 px-4 text-right font-semibold">
                                                                    {formatCurrency(value.cost, currency)}
                                                                </td>
                                                            </tr>
                                                        );
                                                    }
                                                    return null;
                                                })}
                                                {totalCost && (
                                                    <tr className="border-t-2 border-primary bg-primary/5 font-bold">
                                                        <td colSpan={2} className="py-4 px-4">
                                                            Total Project Cost
                                                        </td>
                                                        <td className="py-4 px-4 text-right text-lg text-primary">
                                                            {formatCurrency(totalCost, currency)}
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                );
                            })()}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Timeline Section */}
            {content.includes('TIMELINE') && (() => {
                const timelineMatch = content.match(/\*\*2\.\s*DETAILED TIMELINE\*\*([\s\S]*?)(?=\*\*3\.|$)/i);
                if (timelineMatch) {
                    const timelineContent = timelineMatch[1];
                    const timelineTable = parseTable(timelineContent);
                    
                    if (timelineTable) {
                        return (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Clock className="w-5 h-5" />
                                        Project Timeline
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="border-b border-border">
                                                    {Object.keys(timelineTable[0]).map((header, idx) => (
                                                        <th key={idx} className="text-left py-3 px-4 font-medium bg-muted/50">
                                                            {renderBoldText(header)}
                                                        </th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {timelineTable.map((row, idx) => (
                                                    <tr key={idx} className="border-b border-border/50 hover:bg-muted/30">
                                                        {Object.values(row).map((cell: any, cellIdx) => (
                                                            <td key={cellIdx} className="py-3 px-4">
                                                                {renderBoldText(String(cell))}
                                                            </td>
                                                        ))}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    }
                }
                return null;
            })()}

            {/* Payment Terms */}
            {content.includes('PAYMENT TERMS') && (() => {
                const paymentMatch = content.match(/\*\*6\.\s*PAYMENT TERMS\*\*([\s\S]*?)(?=\*\*7\.|$)/i);
                if (paymentMatch) {
                    const paymentContent = paymentMatch[1];
                    const paymentTable = parseTable(paymentContent);
                    
                    if (paymentTable) {
                        return (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <CreditCard className="w-5 h-5" />
                                        Payment Terms
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="border-b border-border">
                                                    {Object.keys(paymentTable[0]).map((header, idx) => (
                                                        <th key={idx} className="text-left py-3 px-4 font-medium bg-muted/50">
                                                            {renderBoldText(header)}
                                                        </th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {paymentTable.map((row, idx) => (
                                                    <tr key={idx} className="border-b border-border/50 hover:bg-muted/30">
                                                        {Object.values(row).map((cell: any, cellIdx) => (
                                                            <td key={cellIdx} className="py-3 px-4">
                                                                {renderBoldText(String(cell))}
                                                            </td>
                                                        ))}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    }
                }
                return null;
            })()}

            {/* Deliverables & Milestones */}
            {content.includes('DELIVERABLES') && (() => {
                const deliverablesMatch = content.match(/\*\*4\.\s*DELIVERABLES AND MILESTONES\*\*([\s\S]*?)(?=\*\*5\.|$)/i);
                if (deliverablesMatch) {
                    const deliverablesContent = deliverablesMatch[1];
                    const milestonesTable = parseTable(deliverablesContent);
                    const deliverablesList = parseList(deliverablesContent.split('MILESTONES')[0] || deliverablesContent);
                    
                    return (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Package className="w-5 h-5" />
                                    Deliverables & Milestones
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {deliverablesList.length > 0 && (
                                    <div>
                                        <h4 className="font-semibold mb-3">Key Deliverables</h4>
                                        <ul className="space-y-2 list-disc list-inside text-sm text-muted-foreground ml-4">
                                            {deliverablesList.map((item, idx) => (
                                                <li key={idx}>{renderBoldText(item)}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                                {milestonesTable && milestonesTable.length > 0 && (
                                    <div>
                                        <h4 className="font-semibold mb-3">Milestones</h4>
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm">
                                                <thead>
                                                    <tr className="border-b border-border">
                                                        {Object.keys(milestonesTable[0]).map((header, idx) => (
                                                            <th key={idx} className="text-left py-3 px-4 font-medium bg-muted/50">
                                                                {renderBoldText(header)}
                                                            </th>
                                                        ))}
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {milestonesTable.map((row, idx) => (
                                                        <tr key={idx} className="border-b border-border/50 hover:bg-muted/30">
                                                            {Object.values(row).map((cell: any, cellIdx) => (
                                                                <td key={cellIdx} className="py-3 px-4">
                                                                    {renderBoldText(String(cell))}
                                                                </td>
                                                            ))}
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    );
                }
                return null;
            })()}

            {/* Project Overview */}
            {content.includes('PROJECT OVERVIEW') && (() => {
                const overviewMatch = content.match(/\*\*1\.\s*PROJECT OVERVIEW AND SCOPE\*\*([\s\S]*?)(?=\*\*2\.|$)/i);
                if (overviewMatch) {
                    return (
                        <Card>
                            <CardHeader>
                                <CardTitle>Project Overview & Scope</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {renderFormattedText(overviewMatch[1])}
                            </CardContent>
                        </Card>
                    );
                }
                return null;
            })()}

            {/* Technical Requirements */}
            {content.includes('TECHNICAL REQUIREMENTS') && (() => {
                const techMatch = content.match(/\*\*5\.\s*TECHNICAL REQUIREMENTS\*\*([\s\S]*?)(?=\*\*6\.|$)/i);
                if (techMatch) {
                    return (
                        <Card>
                            <CardHeader>
                                <CardTitle>Technical Requirements</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {renderFormattedText(techMatch[1])}
                            </CardContent>
                        </Card>
                    );
                }
                return null;
            })()}

            {/* Terms and Conditions */}
            {content.includes('TERMS AND CONDITIONS') && (() => {
                const termsMatch = content.match(/\*\*7\.\s*TERMS AND CONDITIONS\*\*([\s\S]*?)(?=\*\*8\.|$)/i);
                if (termsMatch) {
                    return (
                        <Card>
                            <CardHeader>
                                <CardTitle>Terms and Conditions</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {renderFormattedText(termsMatch[1])}
                            </CardContent>
                        </Card>
                    );
                }
                return null;
            })()}

            {/* Support and Maintenance */}
            {content.includes('SUPPORT') && (() => {
                const supportMatch = content.match(/\*\*8\.\s*SUPPORT AND MAINTENANCE OPTIONS\*\*([\s\S]*?)(?=\*\*9\.|$|We are confident)/i);
                if (supportMatch) {
                    return (
                        <Card>
                            <CardHeader>
                                <CardTitle>Support & Maintenance Options</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {renderFormattedText(supportMatch[1])}
                            </CardContent>
                        </Card>
                    );
                }
                return null;
            })()}

            {/* Footer/Closing */}
            {content.includes('Sincerely') && (() => {
                const closingMatch = content.match(/(We are confident[\s\S]*?Date:[\s\S]*?)$/i);
                if (closingMatch) {
                    return (
                        <Card className="bg-muted/30">
                            <CardContent className="pt-6">
                                {renderFormattedText(closingMatch[1])}
                            </CardContent>
                        </Card>
                    );
                }
                return null;
            })()}

            {/* Meta Information */}
            {generatedAt && (
                <div className="text-xs text-muted-foreground text-center pt-4 border-t">
                    Generated on {new Date(generatedAt).toLocaleString()}
                </div>
            )}
        </div>
    );
};

// Structured JSON Format Renderer
const StructuredQuotationRenderer: React.FC<QuotationRendererProps> = ({ quotationData, className = "" }) => {
    const meta = quotationData?.meta || {};
    const quotation = quotationData?.quotation || {};
    const sections = quotation?.sections || [];
    const title = quotation?.title || 'Quotation';
    const currency = quotation?.currency || 'RM';

    // Render section based on type
    const renderSection = (section: any, index: number) => {
        const { id, type, title: sectionTitle, content, headers, rows, data, items } = section;

        switch (type) {
            case 'markdown':
                return (
                    <Card key={id || index}>
                        <CardHeader>
                            <CardTitle>{sectionTitle}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {renderFormattedText(content || '')}
                        </CardContent>
                    </Card>
                );

            case 'table':
                if (!headers || !rows || rows.length === 0) return null;
                return (
                    <Card key={id || index}>
                        <CardHeader>
                            <CardTitle>{sectionTitle}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-border">
                                            {headers.map((header: string, idx: number) => (
                                                <th key={idx} className="text-left py-3 px-4 font-medium bg-muted/50">
                                                    {renderBoldText(header)}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {rows.map((row: any[], rIdx: number) => (
                                            <tr key={rIdx} className="border-b border-border/50 hover:bg-muted/30">
                                                {row.map((cell: any, cellIdx: number) => (
                                                    <td key={cellIdx} className="py-3 px-4">
                                                        {renderBoldText(String(cell))}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                );

            case 'object':
                if (!data || typeof data !== 'object') return null;
                // This is cost breakdown
                const costItems = Object.entries(data).filter(([key]) => 
                    typeof data[key] === 'object' && data[key].cost !== undefined
                );
                
                if (costItems.length === 0) return null;

                let totalCost = 0;
                costItems.forEach(([, item]: [string, any]) => {
                    if (item.cost) totalCost += parseFloat(item.cost) || 0;
                });

                return (
                    <Card key={id || index}>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <DollarSign className="w-5 h-5" />
                                {sectionTitle}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-border">
                                            <th className="text-left py-3 px-4 font-medium bg-muted/50">Item</th>
                                            <th className="text-left py-3 px-4 font-medium bg-muted/50">Description</th>
                                            <th className="text-right py-3 px-4 font-medium bg-muted/50">Cost</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {costItems.map(([key, item]: [string, any]) => (
                                            <tr key={key} className="border-b border-border/50 hover:bg-muted/30">
                                                <td className="py-3 px-4 font-medium capitalize">
                                                    {key.replace(/_/g, ' ')}
                                                </td>
                                                <td className="py-3 px-4 text-muted-foreground text-sm">
                                                    {item.description || '-'}
                                                </td>
                                                <td className="py-3 px-4 text-right font-semibold">
                                                    {formatCurrency(item.cost, currency)}
                                                </td>
                                            </tr>
                                        ))}
                                        <tr className="border-t-2 border-primary bg-primary/5 font-bold">
                                            <td colSpan={2} className="py-4 px-4">
                                                Total Project Cost
                                            </td>
                                            <td className="py-4 px-4 text-right text-lg text-primary">
                                                {formatCurrency(totalCost, currency)}
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                );

            case 'list':
                if (!items || !Array.isArray(items) || items.length === 0) return null;
                return (
                    <Card key={id || index}>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Package className="w-5 h-5" />
                                {sectionTitle}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-2 list-disc list-inside text-sm text-muted-foreground ml-4">
                                {items.map((item: string, idx: number) => (
                                    <li key={idx}>{renderBoldText(item)}</li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>
                );

            case 'key_value':
                if (!data || typeof data !== 'object') return null;
                return (
                    <Card key={id || index}>
                        <CardHeader>
                            <CardTitle>{sectionTitle}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                {Object.entries(data).map(([key, value]: [string, any]) => (
                                    <div key={key} className="flex flex-col">
                                        <span className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
                                            {key}
                                        </span>
                                        <span className="font-medium">{String(value)}</span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                );

            case 'accordion':
                if (!items || !Array.isArray(items) || items.length === 0) return null;
                return (
                    <Card key={id || index}>
                        <CardHeader>
                            <CardTitle>{sectionTitle}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {items.map((item: any, idx: number) => (
                                    <div key={idx} className="border rounded-lg p-4 space-y-2">
                                        <h4 className="font-semibold text-sm">{item.name}</h4>
                                        {item.availability && (
                                            <p className="text-xs text-muted-foreground">
                                                <strong>Availability:</strong> {item.availability}
                                            </p>
                                        )}
                                        {item.description && (
                                            <p className="text-sm text-muted-foreground">
                                                {item.description}
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                );

            default:
                return null;
        }
    };

    return (
        <div className={`space-y-6 ${className}`}>
            {/* Header */}
            <Card className="border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-2xl font-bold flex items-center gap-2">
                                <FileText className="w-6 h-6" />
                                {title}
                            </CardTitle>
                            {meta.generated_at && (
                                <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                                    <span className="flex items-center gap-1">
                                        <Calendar className="w-4 h-4" />
                                        Generated: {new Date(meta.generated_at).toLocaleDateString()}
                                    </span>
                                </div>
                            )}
                        </div>
                        {meta.ai_generated && (
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                AI Generated
                            </Badge>
                        )}
                    </div>
                </CardHeader>
            </Card>

            {/* Sections */}
            {sections.map((section: any, index: number) => renderSection(section, index))}

            {/* Meta Information */}
            {meta.generated_at && (
                <div className="text-xs text-muted-foreground text-center pt-4 border-t">
                    Generated on {new Date(meta.generated_at).toLocaleString()}
                </div>
            )}
        </div>
    );
};

const QuotationRenderer: React.FC<QuotationRendererProps> = ({ quotationData, className = "" }) => {
    // Check if this is the new structured format
    const isStructuredFormat = quotationData?.quotation && Array.isArray(quotationData.quotation.sections);
    
    if (isStructuredFormat) {
        return <StructuredQuotationRenderer quotationData={quotationData} className={className} />;
    }
    
    // Check if this is Gemini text format
    const isGeminiTextFormat = quotationData?.format === 'text' && quotationData?.content;
    
    if (isGeminiTextFormat) {
        return <GeminiTextRenderer quotationData={quotationData} className={className} />;
    }

    // Fallback to original renderer for structured JSON data
    // Configuration for how to render different field types
    const fieldConfig = {
        // Fields that should be rendered as tables
        tableFields: ['cost_breakdown', 'items', 'milestones', 'payment_schedule'],
        
        // Fields that should be rendered as lists
        listFields: ['deliverables', 'scope_of_work', 'out_of_scope', 'client_responsibilities', 'features'],
        
        // Fields that should be highlighted as important sections
        sectionFields: ['project_overview', 'timeline', 'duration', 'payment_terms', 'support', 'acceptance'],
        
        // Fields that should be rendered as nested objects with special handling
        nestedFields: ['phases', 'options', 'terms'],
        
        // Fields to skip or handle specially
        metaFields: ['ai_generated', 'generated_at', 'format', 'error', 'error_message'],
        
        // Currency-related fields
        currencyFields: ['cost', 'total', 'price', 'amount', 'sub_total', 'total_project_cost']
    };

    const formatFieldName = (key: string): string => {
        return key
            .replace(/_/g, ' ')
            .replace(/([A-Z])/g, ' $1')
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    };

    const isCurrencyValue = (key: string, value: any): boolean => {
        return fieldConfig.currencyFields.some(field => key.toLowerCase().includes(field)) ||
               (typeof value === 'string' && /^(RM|USD|\$)?\s?\d+([,\d]*)?(\.\d{2})?$/.test(value.toString().trim()));
    };

    const isTableField = (key: string): boolean => {
        return fieldConfig.tableFields.some(field => key.toLowerCase().includes(field));
    };

    const isListField = (key: string): boolean => {
        return fieldConfig.listFields.some(field => key.toLowerCase().includes(field));
    };

    const isSectionField = (key: string): boolean => {
        return fieldConfig.sectionFields.some(field => key.toLowerCase().includes(field));
    };

    const isMetaField = (key: string): boolean => {
        return fieldConfig.metaFields.includes(key);
    };

    const renderValue = (key: string, value: any, depth: number = 0): React.ReactNode => {
        if (value === null || value === undefined) return null;

        // Handle arrays
        if (Array.isArray(value)) {
            if (value.length === 0) return null;
            
            return (
                <ul className="space-y-1 text-sm text-muted-foreground">
                    {value.map((item, index) => (
                        <li key={index} className="flex items-start gap-2">
                            <span className="text-primary mt-1">•</span>
                            <span>
                                {typeof item === 'object' ? renderObject(item, depth + 1) : item.toString()}
                            </span>
                        </li>
                    ))}
                </ul>
            );
        }

        // Handle objects
        if (typeof value === 'object') {
            return renderObject(value, depth + 1);
        }

        // Handle primitive values
        return <span className="text-sm text-muted-foreground">{value.toString()}</span>;
    };

    const renderObject = (obj: QuotationData, depth: number = 0): React.ReactNode => {
        if (!obj || typeof obj !== 'object') return null;

        return (
            <div className={`space-y-4 ${depth > 0 ? 'ml-4 pl-4 border-l-2 border-muted' : ''}`}>
                {Object.entries(obj).map(([key, value]) => {
                    if (isMetaField(key)) return null;
                    if (value === null || value === undefined) return null;

                    return (
                        <div key={key} className="border rounded-lg p-4">
                            <h4 className="font-semibold text-sm mb-2">{formatFieldName(key)}</h4>
                            {renderFieldContent(key, value, depth)}
                        </div>
                    );
                })}
            </div>
        );
    };

    const renderFieldContent = (key: string, value: any, depth: number): React.ReactNode => {
        // Handle table-like structures (objects with similar nested objects)
        if (typeof value === 'object' && !Array.isArray(value) && isTableField(key)) {
            return renderTable(value);
        }

        // Handle arrays that should be rendered as lists
        if (Array.isArray(value) && isListField(key)) {
            return (
                <ul className="space-y-1 text-sm text-muted-foreground">
                    {value.map((item, index) => (
                        <li key={index} className="flex items-start gap-2">
                            <span className="text-primary mt-1">•</span>
                            <span>
                                {typeof item === 'object' ? renderObject(item, depth + 1) : item.toString()}
                            </span>
                        </li>
                    ))}
                </ul>
            );
        }

        // Handle arrays of objects (like phases, milestones)
        if (Array.isArray(value) && value.every(item => typeof item === 'object')) {
            return (
                <div className="space-y-3">
                    {value.map((item, index) => (
                        <div key={index} className="bg-muted/30 border rounded-lg p-3">
                            {renderObject(item, depth + 1)}
                        </div>
                    ))}
                </div>
            );
        }

        // Handle currency values
        if (isCurrencyValue(key, value)) {
            return (
                <div className="text-lg font-semibold text-green-600">
                    {value.toString()}
                </div>
            );
        }

        // Handle section fields with special styling
        if (isSectionField(key) && typeof value === 'string') {
            return (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm text-blue-800">{value}</p>
                </div>
            );
        }

        // Default rendering
        return renderValue(key, value, depth);
    };

    const renderTable = (obj: QuotationData): React.ReactNode => {
        const entries = Object.entries(obj);
        if (entries.length === 0) return null;

        // Check if this looks like a cost breakdown table
        const hasNumericValues = entries.some(([, value]) => 
            typeof value === 'number' || /^\d+/.test(value?.toString() || '')
        );

        if (hasNumericValues) {
            return (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b">
                                <th className="text-left py-2 px-3 font-medium">Item</th>
                                <th className="text-right py-2 px-3 font-medium">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {entries.map(([key, value]) => (
                                <tr key={key} className={`border-b border-muted ${key.toLowerCase().includes('total') ? 'font-semibold bg-muted/50' : ''}`}>
                                    <td className="py-2 px-3 capitalize">{formatFieldName(key)}</td>
                                    <td className="py-2 px-3 text-right font-medium">{value?.toString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            );
        }

        // Render as key-value pairs
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                {entries.map(([key, value]) => (
                    <div key={key} className="flex flex-col">
                        <span className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
                            {formatFieldName(key)}
                        </span>
                        <span className="font-medium">{value?.toString()}</span>
                    </div>
                ))}
            </div>
        );
    };

    const renderMetaInfo = (): React.ReactNode => {
        const metaInfo = Object.fromEntries(
            Object.entries(quotationData).filter(([key]) => isMetaField(key))
        );

        if (Object.keys(metaInfo).length === 0) return null;

        return (
            <div className="border rounded-lg p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
                <div className="flex items-center gap-2 mb-2">
                    <div className="h-2 w-2 bg-blue-500 rounded-full animate-pulse"></div>
                    <span className="text-xs font-medium text-blue-700">
                        {metaInfo.ai_generated ? 'AI Generated Quotation' : 'Quotation Information'}
                    </span>
                </div>
                {metaInfo.generated_at && (
                    <p className="text-xs text-blue-600">
                        Generated: {new Date(metaInfo.generated_at).toLocaleString()}
                    </p>
                )}
                {metaInfo.error && (
                    <div className="mt-2">
                        <Badge variant="destructive" className="text-xs">
                            {metaInfo.error}
                        </Badge>
                        {metaInfo.error_message && (
                            <p className="text-xs text-red-600 mt-1">{metaInfo.error_message}</p>
                        )}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className={`space-y-4 ${className}`}>
            {renderObject(quotationData)}
            {renderMetaInfo()}
        </div>
    );
};

export default QuotationRenderer; 