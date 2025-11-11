<?php

namespace App\Services;

use Illuminate\Support\Str;
use Illuminate\Support\Facades\Log;

class CustomerDataExtractor
{
    /**
     * Extract customer data from OCR text
     * 
     * @param string $text
     * @return array
     */
    public function extract(string $text): array
    {
        $data = [
            'company_name' => '',
            'company_registration_number' => '',
            'supervisor_name' => '',
            'company_email' => '',
            'company_phone_number' => '',
            'company_address' => '',
            'company_city' => '',
        ];

        // Clean text
        $text = $this->cleanText($text);

        // Extract each field
        $data['company_name'] = $this->extractCompanyName($text);
        $data['company_registration_number'] = $this->extractRegistrationNumber($text);
        $data['supervisor_name'] = $this->extractSupervisorName($text);
        $data['company_email'] = $this->extractEmail($text);
        $data['company_phone_number'] = $this->extractPhoneNumber($text);
        $data['company_address'] = $this->extractAddress($text);
        $data['company_city'] = $this->extractCity($text);

        return $data;
    }

    /**
     * Clean and normalize text
     * 
     * @param string $text
     * @return string
     */
    private function cleanText(string $text): string
    {
        // Normalize line endings
        $text = str_replace(["\r\n", "\r"], "\n", $text);
        
        // Remove excessive whitespace but preserve line breaks for better field separation
        $text = preg_replace('/[ \t]+/', ' ', $text);
        
        // Remove special characters that might interfere
        $text = trim($text);
        
        return $text;
    }

    /**
     * Extract company name
     * 
     * @param string $text
     * @return string
     */
    private function extractCompanyName(string $text): string
    {
        // Common patterns for company name - stop at newline or next field label
        $patterns = [
            // "Company Name: ABC Sdn Bhd" - stop at newline or next field
            '/company\s*name\s*:?\s*([^\n:]+?)(?:\n|$|Company\s+Registration|Supervisor|Email|Phone|City|Address)/i',
            // "Company: ABC Sdn Bhd" - stop at newline or next field
            '/company\s*:?\s*([^\n:]+?)(?:\n|$|Company\s+Registration|Supervisor|Email|Phone|City|Address)/i',
            // "Business Name: ABC Sdn Bhd"
            '/business\s*name\s*:?\s*([^\n:]+?)(?:\n|$|Company\s+Registration|Supervisor|Email|Phone|City|Address)/i',
            // "Trading Name: ABC Sdn Bhd"
            '/trading\s*name\s*:?\s*([^\n:]+?)(?:\n|$|Company\s+Registration|Supervisor|Email|Phone|City|Address)/i',
            // "Registered Name: ABC Sdn Bhd"
            '/registered\s*name\s*:?\s*([^\n:]+?)(?:\n|$|Company\s+Registration|Supervisor|Email|Phone|City|Address)/i',
        ];

        foreach ($patterns as $pattern) {
            if (preg_match($pattern, $text, $matches)) {
                $name = trim($matches[1]);
                // Remove trailing common words that might have been captured
                $name = preg_replace('/\s+(company\s+registration|registration\s+number|supervisor|email|phone|city|address).*$/i', '', $name);
                // Clean up the name
                $name = trim($name);
                if (strlen($name) > 2 && strlen($name) < 100) {
                    return $name;
                }
            }
        }

        // Try to find company name at the beginning of document (often the first substantial line)
        $lines = explode("\n", $text);
        foreach ($lines as $line) {
            $line = trim($line);
            // Skip lines that are clearly field labels
            if (preg_match('/^(company|business|trading|registered|registration|supervisor|email|phone|city|address)\s*:?\s*/i', $line)) {
                continue;
            }
            if (strlen($line) > 3 && strlen($line) < 80) {
                // Check if it looks like a company name
                if (preg_match('/^[A-Z][A-Za-z0-9\s&.,-]+$/u', $line)) {
                    // Skip if it looks like an address or other field
                    if (!preg_match('/\d{4,}/', $line) && // Not a number
                        !preg_match('/@/', $line) && // Not an email
                        !preg_match('/\d{2,}[-\/]\d{2,}[-\/]\d{2,4}/', $line) && // Not a date
                        !preg_match('/^\+?\d[\d\s\-()]{7,}/', $line) // Not a phone number
                    ) {
                        return $line;
                    }
                }
            }
        }

        return '';
    }

    /**
     * Extract company registration number
     * 
     * @param string $text
     * @return string
     */
    private function extractRegistrationNumber(string $text): string
    {
        $patterns = [
            // "Registration Number: 123456"
            '/registration\s*(?:number|no\.?|#)\s*:?\s*([A-Z0-9\-]+)/i',
            // "Reg No: 123456"
            '/reg\s*(?:no\.?|number|#)\s*:?\s*([A-Z0-9\-]+)/i',
            // "Company Reg: 123456"
            '/company\s*reg\s*:?\s*([A-Z0-9\-]+)/i',
            // "CRN: 123456"
            '/crn\s*:?\s*([A-Z0-9\-]+)/i',
            // "UEN: 123456" (Singapore)
            '/uen\s*:?\s*([A-Z0-9\-]+)/i',
            // "ACN: 123456" (Australia)
            '/acn\s*:?\s*([A-Z0-9\-]+)/i',
            // "GSTIN: 123456" (India)
            '/gstin\s*:?\s*([A-Z0-9\-]+)/i',
            // Look for alphanumeric patterns that look like registration numbers
            '/\b([A-Z]{2,3}[\s\-]?\d{6,12})\b/i',
        ];

        foreach ($patterns as $pattern) {
            if (preg_match($pattern, $text, $matches)) {
                $regNumber = preg_replace('/[\s\-]/', '', strtoupper($matches[1]));
                if (strlen($regNumber) >= 6 && strlen($regNumber) <= 20) {
                    return $regNumber;
                }
            }
        }

        return '';
    }

    /**
     * Extract supervisor/contact person name
     * 
     * @param string $text
     * @return string
     */
    private function extractSupervisorName(string $text): string
    {
        $patterns = [
            // "Supervisor Name: John Doe" - stop at newline or next field
            '/supervisor\s*(?:name)?\s*:?\s*([^\n:]+?)(?:\n|$|Email|Phone|City|Address|Company)/i',
            // "Contact Person: John Doe"
            '/contact\s*(?:person|name)\s*:?\s*([^\n:]+?)(?:\n|$|Email|Phone|City|Address|Company)/i',
            // "Supervisor: John Doe"
            '/supervisor\s*:?\s*([^\n:]+?)(?:\n|$|Email|Phone|City|Address|Company)/i',
            // "Manager: John Doe"
            '/manager\s*:?\s*([^\n:]+?)(?:\n|$|Email|Phone|City|Address|Company)/i',
            // "Attn: John Doe"
            '/attn\s*:?\s*([^\n:]+?)(?:\n|$|Email|Phone|City|Address|Company)/i',
            // "Attention: John Doe"
            '/attention\s*:?\s*([^\n:]+?)(?:\n|$|Email|Phone|City|Address|Company)/i',
            // "Name: John Doe" (but not "Company Name:")
            '/(?<!company\s)(?<!business\s)(?<!trading\s)(?<!registered\s)name\s*:?\s*([^\n:]+?)(?:\n|$|Email|Phone|City|Address|Company)/i',
        ];

        foreach ($patterns as $pattern) {
            if (preg_match($pattern, $text, $matches)) {
                $name = trim($matches[1]);
                // Remove trailing field labels that might have been captured
                $name = preg_replace('/\s+(email|phone|city|address|company).*$/i', '', $name);
                // Remove common prefixes
                $name = preg_replace('/^(mr|mrs|ms|dr|prof)\.?\s+/i', '', $name);
                // Clean up
                $name = trim($name);
                // Validate it looks like a name (at least 2 characters, starts with capital letter)
                if (strlen($name) >= 2 && strlen($name) < 50 && preg_match('/^[A-Z]/', $name)) {
                    return $name;
                }
            }
        }

        return '';
    }

    /**
     * Extract email address
     * 
     * @param string $text
     * @return string
     */
    private function extractEmail(string $text): string
    {
        // Standard email pattern
        $pattern = '/\b([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\b/';
        
        if (preg_match($pattern, $text, $matches)) {
            return strtolower(trim($matches[1]));
        }

        return '';
    }

    /**
     * Extract phone number
     * 
     * @param string $text
     * @return string
     */
    private function extractPhoneNumber(string $text): string
    {
        $patterns = [
            // "Phone: +1-234-567-8900"
            '/phone\s*(?:number|no\.?|#)?\s*:?\s*([+]?[\d\s\-()]{8,20})/i',
            // "Tel: +1-234-567-8900"
            '/tel(?:ephone)?\s*:?\s*([+]?[\d\s\-()]{8,20})/i',
            // "Mobile: +1-234-567-8900"
            '/mobile\s*:?\s*([+]?[\d\s\-()]{8,20})/i',
            // "Contact: +1-234-567-8900"
            '/contact\s*:?\s*([+]?[\d\s\-()]{8,20})/i',
            // Generic phone number pattern
            '/([+]?[\d]{1,4}[\s\-]?[\d\s\-()]{7,15})/',
        ];

        foreach ($patterns as $pattern) {
            if (preg_match($pattern, $text, $matches)) {
                $phone = preg_replace('/[\s\-()]/', '', $matches[1]);
                // Clean up phone number
                $phone = trim($phone);
                if (strlen($phone) >= 8 && strlen($phone) <= 20) {
                    return $phone;
                }
            }
        }

        return '';
    }

    /**
     * Extract address
     * 
     * @param string $text
     * @return string
     */
    private function extractAddress(string $text): string
    {
        $patterns = [
            // "Address: 123 Main St"
            '/address\s*:?\s*([A-Za-z0-9\s,#.\-]{10,80})/i',
            // "Street Address: 123 Main St"
            '/street\s*address\s*:?\s*([A-Za-z0-9\s,#.\-]{10,80})/i',
            // "Location: 123 Main St"
            '/location\s*:?\s*([A-Za-z0-9\s,#.\-]{10,80})/i',
        ];

        foreach ($patterns as $pattern) {
            if (preg_match($pattern, $text, $matches)) {
                $address = trim($matches[1]);
                // Remove city if it's at the end (we'll extract it separately)
                $address = preg_replace('/,\s*[A-Z][a-z]+(\s+[A-Z][a-z]+)*\s*$/', '', $address);
                if (strlen($address) > 5 && strlen($address) < 100) {
                    return $address;
                }
            }
        }

        // Try to find address-like patterns (numbers followed by street names)
        if (preg_match('/(\d+\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*(?:\s+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr|Way|Court|Ct))[A-Za-z0-9\s,#.\-]*)/i', $text, $matches)) {
            $address = trim($matches[1]);
            if (strlen($address) > 5 && strlen($address) < 100) {
                return $address;
            }
        }

        return '';
    }

    /**
     * Extract city
     * 
     * @param string $text
     * @return string
     */
    private function extractCity(string $text): string
    {
        $patterns = [
            // "City: Kota Kinabalu" - stop at newline or next field
            '/city\s*:?\s*([^\n,]+?)(?:\n|$|Address|Email|Phone|Company|Supervisor)/i',
            // "City: New York" (simpler pattern)
            '/city\s*:?\s*([A-Z][A-Za-z\s]+?)(?:\n|$|Address|Email|Phone|Company|Supervisor)/',
        ];

        foreach ($patterns as $pattern) {
            if (preg_match($pattern, $text, $matches)) {
                $city = trim($matches[1]);
                // Remove trailing field labels or addresses that might have been captured
                $city = preg_replace('/\s+(address|email|phone|company|supervisor|malaysia|state|country).*$/i', '', $city);
                // Remove trailing commas
                $city = rtrim($city, ',');
                // Remove common words that aren't cities
                if (!preg_match('/^(state|country|province|region|address)$/i', $city)) {
                    $city = trim($city);
                    if (strlen($city) > 2 && strlen($city) < 50) {
                        return $city;
                    }
                }
            }
        }

        // Try to extract city from address line (often the second-to-last part before country)
        // "Address: 123 Jalan Example, Sabah, Malaysia" -> extract "Sabah" or "Kota Kinabalu"
        if (preg_match('/address\s*:?\s*[^,]+,\s*([^,]+?)(?:,\s*(?:Malaysia|State|Country))?/i', $text, $matches)) {
            $city = trim($matches[1]);
            // Validate it looks like a city name
            if (preg_match('/^[A-Z][A-Za-z\s]+$/', $city) && strlen($city) > 2 && strlen($city) < 50) {
                return $city;
            }
        }

        return '';
    }
}

