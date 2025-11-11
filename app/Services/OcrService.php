<?php

namespace App\Services;

use Google\Cloud\Vision\V1\Client\ImageAnnotatorClient;
use Google\Cloud\Vision\V1\BatchAnnotateImagesRequest;
use Google\Cloud\Vision\V1\AnnotateImageRequest;
use Google\Cloud\Vision\V1\Image;
use Google\Cloud\Vision\V1\Feature;
use thiagoalessio\TesseractOCR\TesseractOCR;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;

class OcrService
{
    private const MIN_TEXT_QUALITY_THRESHOLD = 0.7; // Minimum confidence threshold (70%)
    private const MIN_TEXT_LENGTH = 50; // Minimum characters to consider valid OCR

    /**
     * Process an uploaded file and extract text using OCR
     * 
     * @param UploadedFile $file
     * @return array{text: string, confidence: float, method: string}
     */
    public function extractText(UploadedFile $file): array
    {
        // Validate file type
        $allowedMimeTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf', 'image/webp'];
        if (!in_array($file->getMimeType(), $allowedMimeTypes)) {
            throw new \Exception('Unsupported file type. Please upload an image (JPEG, PNG, WebP) or PDF.');
        }

        // Store file temporarily using 'local' disk
        // The 'local' disk root is storage/app/private
        $tempPath = $file->store('temp', 'local');
        
        // Get the absolute path - Storage::disk('local')->path() returns the full path
        // $tempPath will be like 'temp/filename.jpg'
        // Storage::disk('local')->path($tempPath) should return 'storage/app/private/temp/filename.jpg'
        $fullPath = Storage::disk('local')->path($tempPath);
        
        // Get canonical absolute path (resolves symlinks, normalizes separators)
        $canonicalPath = realpath($fullPath);
        if ($canonicalPath !== false) {
            $fullPath = $canonicalPath;
        }
        
        // Verify the file exists
        if (!file_exists($fullPath)) {
            // Log detailed information for debugging
            $storageRoot = Storage::disk('local')->path('');
            Log::error('Temporary file not found after storing', [
                'temp_path_returned' => $tempPath,
                'full_path_from_storage' => Storage::disk('local')->path($tempPath),
                'full_path_used' => $fullPath,
                'canonical_path' => $canonicalPath,
                'storage_root' => $storageRoot,
                'file_exists' => file_exists($fullPath),
                'directory_exists' => is_dir(dirname($fullPath)),
                'temp_dir_exists' => is_dir($storageRoot . DIRECTORY_SEPARATOR . 'temp'),
                'files_in_temp' => is_dir($storageRoot . DIRECTORY_SEPARATOR . 'temp') ? count(glob($storageRoot . DIRECTORY_SEPARATOR . 'temp' . DIRECTORY_SEPARATOR . '*')) : 0,
            ]);
            throw new \Exception('Failed to store uploaded file temporarily. Expected at: ' . $fullPath);
        }
        
        if (!is_readable($fullPath)) {
            throw new \Exception('Temporary file is not readable: ' . $fullPath);
        }
        
        // Store the verified absolute path
        $verifiedFullPath = $fullPath;
        
        Log::info('Temporary file stored successfully', [
            'temp_path' => $tempPath,
            'full_path' => $verifiedFullPath,
            'file_size' => filesize($verifiedFullPath),
        ]);

        $tesseractResult = null;
        $useTesseract = $this->isTesseractAvailable();
        
        // Use the verified full path
        $filePathToProcess = $verifiedFullPath;
        
        try {
            // Try Tesseract OCR first (if available)
            if ($useTesseract) {
                try {
                    $tesseractResult = $this->extractWithTesseract($filePathToProcess);
                    
                    // Check if Tesseract result is good enough
                    if ($this->isTextQualityGood($tesseractResult['text'], $tesseractResult['confidence'])) {
                        Storage::disk('local')->delete($tempPath);
                        return [
                            'text' => $tesseractResult['text'],
                            'confidence' => $tesseractResult['confidence'],
                            'method' => 'tesseract'
                        ];
                    }
                    
                    Log::info('Tesseract OCR quality low, attempting to use Google Vision API');
                } catch (\Exception $e) {
                    Log::warning('Tesseract OCR failed, falling back to Google Vision API: ' . $e->getMessage());
                    // Continue to Google Vision API
                }
            } else {
                Log::info('Tesseract not available, using Google Vision API directly');
            }

            // Try Google Vision API - verify file still exists before processing
            if (!file_exists($filePathToProcess)) {
                throw new \Exception('File was deleted before Google Vision processing: ' . $filePathToProcess);
            }
            
            try {
                $googleVisionResult = $this->extractWithGoogleVision($filePathToProcess, $file->getMimeType());
                
                // Clean up temporary file
                try {
                    Storage::disk('local')->delete($tempPath);
                } catch (\Exception $e) {
                    Log::warning('Failed to delete temporary file: ' . $e->getMessage());
                }
                
                return [
                    'text' => $googleVisionResult['text'],
                    'confidence' => $googleVisionResult['confidence'],
                    'method' => 'google_vision'
                ];
            } catch (\Exception $e) {
                // Google Vision not available or failed
                Log::warning('Google Vision API failed: ' . $e->getMessage(), [
                    'file_path' => $filePathToProcess,
                    'file_exists' => file_exists($filePathToProcess),
                ]);
                
                // Clean up temporary file
                try {
                    Storage::disk('local')->delete($tempPath);
                } catch (\Exception $deleteException) {
                    Log::warning('Failed to delete temporary file: ' . $deleteException->getMessage());
                }
                
                // If we have a Tesseract result, return it even if quality is low
                if ($tesseractResult && !empty($tesseractResult['text'])) {
                    return [
                        'text' => $tesseractResult['text'],
                        'confidence' => $tesseractResult['confidence'],
                        'method' => 'tesseract'
                    ];
                }
                
                throw new \Exception('OCR extraction failed. ' . ($useTesseract ? 'Both Tesseract and Google Vision failed.' : 'Google Vision API is required but not configured or unavailable.') . ' Error: ' . $e->getMessage());
            }

        } catch (\Exception $e) {
            // Clean up temporary file on any error
            try {
                if (isset($tempPath)) {
                    Storage::disk('local')->delete($tempPath);
                }
            } catch (\Exception $deleteException) {
                Log::warning('Failed to delete temporary file during cleanup: ' . $deleteException->getMessage());
            }
            
            Log::error('OCR extraction failed: ' . $e->getMessage());
            
            // If we have a Tesseract result, return it even if quality is low
            if (isset($tesseractResult) && !empty($tesseractResult['text'])) {
                return [
                    'text' => $tesseractResult['text'],
                    'confidence' => $tesseractResult['confidence'],
                    'method' => 'tesseract_fallback'
                ];
            }
            
            throw new \Exception('OCR extraction failed: ' . $e->getMessage());
        }
    }

    /**
     * Extract text using Tesseract OCR
     * 
     * @param string $filePath
     * @return array{text: string, confidence: float}
     */
    private function extractWithTesseract(string $filePath): array
    {
        try {
            // Check if file is PDF, convert to image first if needed
            $imagePath = $this->convertPdfToImage($filePath);
            
            $ocr = new TesseractOCR($imagePath);
            $text = $ocr->run();
            
            // Clean up temporary image if it was created from PDF
            if ($imagePath !== $filePath && file_exists($imagePath)) {
                unlink($imagePath);
            }

            // Estimate confidence based on text length and content
            $confidence = $this->estimateConfidence($text);

            return [
                'text' => $text,
                'confidence' => $confidence
            ];
        } catch (\Exception $e) {
            Log::warning('Tesseract OCR failed: ' . $e->getMessage());
            return [
                'text' => '',
                'confidence' => 0.0
            ];
        }
    }

    /**
     * Extract text using Google Cloud Vision API
     * 
     * @param string $filePath
     * @param string $mimeType
     * @return array{text: string, confidence: float}
     */
    private function extractWithGoogleVision(string $filePath, string $mimeType): array
    {
        try {
            // Check if credentials are configured
            $credentialsPath = config('services.google_vision.credentials') 
                ?? config('services.google_vision.key_file');
            
            if (!$credentialsPath) {
                throw new \Exception('Google Vision API credentials path not configured. Please set GOOGLE_APPLICATION_CREDENTIALS or GOOGLE_VISION_KEY_FILE in your .env file.');
            }
            
            // Convert relative path to absolute path if needed
            $originalCredentialsPath = $credentialsPath;
            
            // Handle storage/app/ paths
            if (str_starts_with($credentialsPath, 'storage/app/')) {
                $fileName = str_replace('storage/app/', '', $credentialsPath);
                $credentialsPath = storage_path('app/' . $fileName);
            } 
            // Handle storage/ paths (without app/)
            elseif (str_starts_with($credentialsPath, 'storage/')) {
                $fileName = str_replace('storage/', '', $credentialsPath);
                $credentialsPath = storage_path($fileName);
            }
            // Handle relative paths (not starting with / or drive letter)
            elseif (!str_starts_with($credentialsPath, '/') && !preg_match('/^[A-Za-z]:[\\\\\/]/', $credentialsPath)) {
                // Try as relative to base path
                $credentialsPath = base_path($credentialsPath);
            }
            // Absolute path - normalize path separators for Windows
            $credentialsPath = str_replace(['/', '\\'], DIRECTORY_SEPARATOR, $credentialsPath);
            
            // Get canonical path (resolves symlinks and relative paths)
            $realPath = realpath($credentialsPath);
            if ($realPath !== false) {
                $credentialsPath = $realPath;
            }
            
            // Verify file exists and is readable
            if (!file_exists($credentialsPath)) {
                $originalPath = $originalCredentialsPath;
                Log::error('Google Vision credentials file not found', [
                    'original_path' => $originalPath,
                    'resolved_path' => $credentialsPath,
                    'real_path' => $realPath,
                    'storage_path' => storage_path('app'),
                    'base_path' => base_path(),
                    'file_exists' => file_exists($credentialsPath),
                    'is_readable' => is_readable($credentialsPath),
                ]);
                throw new \Exception('Google Vision API credentials file not found. Original: ' . $originalPath . ', Resolved: ' . $credentialsPath . '. Please verify the file exists at: ' . storage_path('app/gen-lang-client-0655708362-2a5432aefbd8.json'));
            }
            
            if (!is_readable($credentialsPath)) {
                throw new \Exception('Google Vision API credentials file is not readable: ' . $credentialsPath . '. Please check file permissions.');
            }
            
            // Verify it's valid JSON
            $credentialsContent = file_get_contents($credentialsPath);
            if ($credentialsContent === false) {
                throw new \Exception('Failed to read Google Vision API credentials file: ' . $credentialsPath);
            }
            
            $credentialsData = json_decode($credentialsContent, true);
            if (json_last_error() !== JSON_ERROR_NONE) {
                throw new \Exception('Google Vision API credentials file is not valid JSON: ' . json_last_error_msg());
            }
            
            // Verify required fields exist
            if (empty($credentialsData['type']) || $credentialsData['type'] !== 'service_account') {
                throw new \Exception('Invalid Google Vision API credentials: service account type not found.');
            }
            
            Log::info('Using Google Vision credentials from: ' . $credentialsPath);

            // Initialize Google Vision client
            // Check if gRPC extension is available (usually not on shared hosting)
            $useRestTransport = !extension_loaded('grpc');
            
            $clientOptions = [
                'credentials' => $credentialsPath,
            ];
            
            // Force REST transport for shared hosting compatibility
            // gRPC extension is rarely available on shared hosting
            if ($useRestTransport) {
                $clientOptions['transport'] = 'rest';
                Log::info('Using REST transport for Google Vision API (gRPC not available)');
            }
            
            $client = new ImageAnnotatorClient($clientOptions);

            // Read file content - ensure we have the correct absolute path
            // The filePath should already be an absolute path from extractText()
            $realPath = realpath($filePath);
            
            if ($realPath === false) {
                // Path doesn't exist, try to resolve it
                $filePath = str_replace(['/', '\\'], DIRECTORY_SEPARATOR, $filePath);
                $realPath = realpath($filePath);
            }
            
            if ($realPath === false || !file_exists($realPath)) {
                Log::error('Image file not found for Google Vision API', [
                    'original_path' => $filePath,
                    'real_path' => $realPath,
                    'file_exists' => file_exists($filePath),
                    'dirname' => dirname($filePath),
                    'dirname_exists' => is_dir(dirname($filePath)),
                ]);
                throw new \Exception('Image file not found for Google Vision API. Path: ' . $filePath . (file_exists($filePath) ? ' (exists but realpath failed)' : ' (does not exist)'));
            }
            
            $filePath = $realPath;
            
            if (!is_readable($filePath)) {
                throw new \Exception('Image file is not readable: ' . $filePath . '. File permissions: ' . substr(sprintf('%o', fileperms($filePath)), -4));
            }
            
            $imageContent = file_get_contents($filePath);
            if ($imageContent === false) {
                throw new \Exception('Failed to read image file: ' . $filePath . '. Error: ' . error_get_last()['message'] ?? 'Unknown error');
            }
            
            if (empty($imageContent)) {
                throw new \Exception('Image file is empty: ' . $filePath);
            }
            
            Log::info('Reading image file for Google Vision', [
                'file_path' => $filePath,
                'file_size' => strlen($imageContent),
                'mime_type' => $mimeType,
            ]);
            
            $image = (new Image())->setContent($imageContent);

            // Create feature for text detection
            $feature = (new Feature())
                ->setType(\Google\Cloud\Vision\V1\Feature\Type::TEXT_DETECTION);

            // Create annotate image request
            $request = (new AnnotateImageRequest())
                ->setImage($image)
                ->setFeatures([$feature]);

            // Create batch request
            $batchRequest = (new BatchAnnotateImagesRequest())
                ->setRequests([$request]);

            // Perform text detection
            $response = $client->batchAnnotateImages($batchRequest);
            $responses = $response->getResponses();

            if (count($responses) > 0 && $responses[0]->getTextAnnotations()) {
                $annotations = $responses[0]->getTextAnnotations();
                
                if (count($annotations) > 0) {
                    // Get full text (first annotation contains all text)
                    $fullTextAnnotation = $annotations[0];
                    $text = $fullTextAnnotation->getDescription();
                    
                    // Default high confidence for Google Vision
                    $averageConfidence = 0.9;

                    $client->close();
                    
                    return [
                        'text' => $text ?? '',
                        'confidence' => $averageConfidence
                    ];
                }
            }

            $client->close();
            return [
                'text' => '',
                'confidence' => 0.0
            ];

        } catch (\Exception $e) {
            Log::error('Google Vision API failed: ' . $e->getMessage());
            throw new \Exception('Google Vision API error: ' . $e->getMessage());
        }
    }

    /**
     * Check if text quality is good enough
     * 
     * @param string $text
     * @param float $confidence
     * @return bool
     */
    private function isTextQualityGood(string $text, float $confidence): bool
    {
        // Check if text is long enough
        if (strlen(trim($text)) < self::MIN_TEXT_LENGTH) {
            return false;
        }

        // Check confidence threshold
        if ($confidence < self::MIN_TEXT_QUALITY_THRESHOLD) {
            return false;
        }

        // Check if text contains meaningful content (not just symbols)
        $alphaNumericCount = preg_match_all('/[a-zA-Z0-9]/', $text);
        $totalChars = strlen($text);
        
        if ($totalChars > 0 && ($alphaNumericCount / $totalChars) < 0.3) {
            return false;
        }

        return true;
    }

    /**
     * Estimate confidence based on text characteristics
     * 
     * @param string $text
     * @return float
     */
    private function estimateConfidence(string $text): float
    {
        if (empty(trim($text))) {
            return 0.0;
        }

        $text = trim($text);
        $length = strlen($text);
        
        // Base confidence on length
        $lengthConfidence = min(1.0, $length / 200);
        
        // Check for common OCR errors (too many special characters)
        $alphaNumericRatio = preg_match_all('/[a-zA-Z0-9]/', $text) / max($length, 1);
        
        // Check for readable words
        $wordCount = str_word_count($text);
        $wordConfidence = min(1.0, $wordCount / 10);
        
        // Average confidence
        return ($lengthConfidence * 0.3 + $alphaNumericRatio * 0.4 + $wordConfidence * 0.3);
    }


    /**
     * Convert PDF to image for OCR processing
     * 
     * @param string $filePath
     * @return string
     */
    private function convertPdfToImage(string $filePath): string
    {
        // If not a PDF, return original path
        $mimeType = mime_content_type($filePath);
        if ($mimeType !== 'application/pdf') {
            return $filePath;
        }

        // For PDF, we need to convert to image
        // This requires Imagick or similar. For now, we'll try to use Tesseract's PDF support
        // Tesseract can handle PDFs directly in newer versions
        return $filePath;
    }

    /**
     * Check if Tesseract OCR is available on the system
     * 
     * @return bool
     */
    private function isTesseractAvailable(): bool
    {
        // Check if Tesseract is disabled via config (for shared hosting)
        if (config('services.ocr.disable_tesseract', false)) {
            Log::info('Tesseract OCR is disabled via configuration');
            return false;
        }

        // Check if class exists (package might not be installed)
        if (!class_exists(TesseractOCR::class)) {
            Log::info('TesseractOCR class not found - package may not be installed');
            return false;
        }

        try {
            // Try to create a TesseractOCR instance
            // This will fail if Tesseract binary is not available on the system
            $testOcr = new TesseractOCR();
            // The actual check happens when we try to run OCR, but this validates the class can be instantiated
            return true;
        } catch (\Exception $e) {
            Log::info('Tesseract OCR not available: ' . $e->getMessage());
            return false;
        }
    }
}

