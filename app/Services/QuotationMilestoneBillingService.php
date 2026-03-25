<?php

namespace App\Services;

use App\Models\Quotation;
use Illuminate\Support\Str;

class QuotationMilestoneBillingService
{
    /**
     * @return array<int, array{phase_key: string, phase_name: string, phase_description: string, phase_percentage: float, amount: float, currency: string}>
     */
    public function extractBillablePhases(Quotation $quotation): array
    {
        $quotationData = $this->decodeQuotationData($quotation->quotation_message);
        $currency = $this->extractCurrency($quotationData);
        $projectTotal = $this->extractProjectTotal($quotationData);
        $milestones = $this->extractMilestones($quotationData);

        $phases = [];
        foreach ($milestones as $milestone) {
            $amount = round(($projectTotal * $milestone['percentage']) / 100, 2);

            $phases[] = [
                'phase_key' => $milestone['phase_key'],
                'phase_name' => $milestone['phase_name'],
                'phase_description' => $milestone['phase_description'],
                'phase_percentage' => $milestone['percentage'],
                'amount' => $amount,
                'currency' => $currency,
            ];
        }

        return $phases;
    }

    /**
     * @return array<int, array{phase_key: string, phase_name: string, phase_description: string, percentage: float}>
     */
    protected function extractMilestones(array $quotationData): array
    {
        $milestoneSection = null;
        foreach ($this->extractSections($quotationData) as $section) {
            if (($section['id'] ?? null) === 'milestones') {
                $milestoneSection = $section;
                break;
            }
        }

        if (! is_array($milestoneSection)) {
            return [];
        }

        $rows = $milestoneSection['rows'] ?? [];
        if (! is_array($rows)) {
            return [];
        }

        $milestones = [];
        foreach ($rows as $row) {
            if (! is_array($row) || count($row) < 3) {
                continue;
            }

            $name = trim((string) ($row[0] ?? ''));
            $description = trim((string) ($row[1] ?? ''));
            $percentageRaw = $row[2] ?? null;
            $percentage = $this->parseNumeric($percentageRaw);

            if ($name === '' || $percentage <= 0) {
                continue;
            }

            $milestones[] = [
                'phase_key' => Str::slug($name),
                'phase_name' => $name,
                'phase_description' => $description,
                'percentage' => $percentage,
            ];
        }

        return $milestones;
    }

    protected function extractProjectTotal(array $quotationData): float
    {
        $costBreakdown = $this->extractCostBreakdown($quotationData);

        $total = 0.0;
        foreach ($costBreakdown as $key => $item) {
            if (in_array((string) $key, ['subtotal', 'total_project_cost', 'project_name', 'currency'], true)) {
                continue;
            }

            if (is_array($item) && array_key_exists('cost', $item)) {
                $total += $this->parseNumeric($item['cost']);
            }
        }

        return round($total, 2);
    }

    protected function extractCurrency(array $quotationData): string
    {
        $currency = $quotationData['quotation']['currency'] ?? null;

        if (! is_string($currency) || trim($currency) === '') {
            return 'RM';
        }

        return strtoupper(trim($currency));
    }

    protected function extractCostBreakdown(array $quotationData): array
    {
        foreach ($this->extractSections($quotationData) as $section) {
            if (($section['id'] ?? null) === 'cost_breakdown' && is_array($section['data'] ?? null)) {
                return $section['data'];
            }
        }

        $fallback = $quotationData['cost_breakdown'] ?? ($quotationData['quotation']['cost_breakdown'] ?? []);

        return is_array($fallback) ? $fallback : [];
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    protected function extractSections(array $quotationData): array
    {
        $sections = $quotationData['quotation']['sections'] ?? [];

        return is_array($sections) ? $sections : [];
    }

    protected function decodeQuotationData(mixed $quotationMessage): array
    {
        if (is_array($quotationMessage)) {
            return $quotationMessage;
        }

        if (is_string($quotationMessage)) {
            $decoded = json_decode($quotationMessage, true);

            return is_array($decoded) ? $decoded : [];
        }

        return [];
    }

    protected function parseNumeric(mixed $value): float
    {
        if (is_numeric($value)) {
            return (float) $value;
        }

        if (is_string($value)) {
            return (float) preg_replace('/[^0-9.]/', '', $value);
        }

        return 0.0;
    }
}
