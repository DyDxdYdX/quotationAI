# OCR Setup Guide

This application uses OCR (Optical Character Recognition) to extract customer data from documents like invoices and quotations. The system uses Tesseract OCR by default and can optionally use Google Cloud Vision API for better accuracy.

## Shared Hosting Support

**For shared hosting, see [SHARED_HOSTING_SETUP.md](./SHARED_HOSTING_SETUP.md)**

- ❌ **Tesseract OCR**: Does NOT work on shared hosting (requires system installation)
- ✅ **Google Cloud Vision API**: Works on shared hosting (cloud-based, no server installation needed)

## Prerequisites

### 1. Tesseract OCR (Required)

Tesseract OCR is the primary OCR engine. You need to install it on your system.

#### Windows (using Laragon):
- Tesseract is usually included with Laragon
- If not, download from: https://github.com/UB-Mannheim/tesseract/wiki
- Add Tesseract to your system PATH

#### Linux:
```bash
sudo apt-get update
sudo apt-get install tesseract-ocr
```

#### macOS:
```bash
brew install tesseract
```

### 2. Google Cloud Vision API (Optional)

Google Vision API provides better accuracy, especially for low-quality images. It's used as a fallback when Tesseract results are of low quality.

#### Setup Steps:

1. **Create a Google Cloud Project**
   - Go to https://console.cloud.google.com/
   - Create a new project or select an existing one

2. **Enable Vision API**
   - Navigate to "APIs & Services" > "Library"
   - Search for "Cloud Vision API"
   - Click "Enable"

3. **Create Service Account**
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "Service Account"
   - Create a service account and download the JSON key file

4. **Configure in Laravel**
   - Place the JSON key file in a secure location (e.g., `storage/app/google-credentials.json`)
   - Add to your `.env` file:
   ```
   GOOGLE_APPLICATION_CREDENTIALS=/path/to/your/google-credentials.json
   GOOGLE_CLOUD_PROJECT_ID=your-project-id
   GOOGLE_VISION_KEY_FILE=/path/to/your/google-credentials.json
   ```

## Configuration

### Environment Variables

Add these to your `.env` file:

```env
# Google Vision API (Optional)
GOOGLE_APPLICATION_CREDENTIALS=/path/to/google-credentials.json
GOOGLE_CLOUD_PROJECT_ID=your-project-id
GOOGLE_VISION_KEY_FILE=/path/to/google-credentials.json
```

### File Upload Limits

The default file upload limit is 10MB. You can adjust this in:
- `app/Http/Controllers/ClientController.php` (validation rule)
- PHP configuration (`upload_max_filesize` and `post_max_size` in `php.ini`)

## How It Works

1. **File Upload**: User uploads a document (image or PDF)
2. **Tesseract OCR**: System first tries to extract text using Tesseract
3. **Quality Check**: If text quality is low (low confidence or too short), system falls back to Google Vision API
4. **Data Extraction**: Extracted text is processed using regex patterns to find customer information
5. **Form Population**: Extracted data automatically populates the customer form fields

## Supported File Formats

- Images: JPEG, JPG, PNG, WebP
- Documents: PDF

## Troubleshooting

### Tesseract not found
- Ensure Tesseract is installed and in your system PATH
- Restart your web server after installing Tesseract

### Google Vision API errors
- Verify your credentials file path is correct
- Check that the Vision API is enabled in your Google Cloud project
- Ensure the service account has proper permissions

### Low OCR accuracy
- Use higher quality images (minimum 300 DPI recommended)
- Ensure documents are well-lit and in focus
- Try using Google Vision API for better results

### File upload fails
- Check file size limits in PHP configuration
- Verify file type is supported
- Check server disk space

## Testing

To test OCR functionality:
1. Go to "Manage Client" > "Add New Client"
2. Upload a sample invoice or quotation document
3. Check if customer data is automatically extracted
4. Verify and correct any extracted data if needed

## Notes

- Missing data fields will remain empty - you can fill them manually
- OCR accuracy depends on document quality
- Complex layouts may require manual verification
- Google Vision API usage may incur costs (check Google Cloud pricing)

