# OCR on Shared Hosting - Setup Guide

This guide explains how to use the OCR functionality on shared hosting environments.

## Shared Hosting Limitations

**Tesseract OCR** will **NOT work** on shared hosting because:
- Requires system-level binary installation
- Needs command execution permissions
- Shared hosts don't allow installing system packages
- Requires shell access (not available on shared hosting)

## Solution: Use Google Cloud Vision API Only

For shared hosting, you **must** use **Google Cloud Vision API** as it's a cloud-based service that doesn't require server-side installations.

## Setup Steps for Shared Hosting

### 1. Configure Environment Variables

Add these to your `.env` file:

```env
# Disable Tesseract (required for shared hosting)
OCR_DISABLE_TESSERACT=true

# Optional: Prefer Google Vision (skip Tesseract entirely)
OCR_PREFER_GOOGLE_VISION=true

# Google Vision API Configuration (REQUIRED for shared hosting)
GOOGLE_APPLICATION_CREDENTIALS=storage/app/google-credentials.json
GOOGLE_CLOUD_PROJECT_ID=your-project-id
GOOGLE_VISION_KEY_FILE=storage/app/google-credentials.json
```

### 2. Setup Google Cloud Vision API

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
   - Create a service account with "Cloud Vision API User" role
   - Download the JSON key file

4. **Upload Credentials File**
   - Upload the JSON key file to your shared hosting
   - Recommended location: `storage/app/google-credentials.json`
   - **IMPORTANT**: Make sure this file is NOT publicly accessible
   - Add `storage/app/google-credentials.json` to `.gitignore`
   - Set proper file permissions (600 or 640)

### 3. Verify File Permissions

On your shared hosting, ensure the credentials file has proper permissions:

```bash
chmod 600 storage/app/google-credentials.json
```

### 4. Test the Setup

1. Go to "Manage Client" > "Add New Client"
2. Upload a sample invoice or quotation document
3. The system should extract text using Google Vision API
4. Check the logs if there are any errors

## Requirements for Shared Hosting

### PHP Requirements
- PHP 8.2 or higher
- `curl` extension enabled (required for REST API calls)
- `openssl` extension enabled
- `json` extension enabled
- `fileinfo` extension enabled
- **gRPC extension NOT required** - The system automatically uses REST transport if gRPC is not available (which is typical on shared hosting)

### Server Requirements
- Ability to make outbound HTTPS requests to Google APIs
- Sufficient memory limit (recommended: 128MB or higher)
- File upload capability (for document uploads)
- Write permissions to `storage/app/temp` directory

### Network Requirements
- Outbound HTTPS access to `*.googleapis.com`
- No firewall blocking Google Cloud APIs

## Troubleshooting

### "Google Vision API credentials not configured"
- Verify the credentials file path in `.env` is correct
- Check that the file exists on the server
- Verify file permissions (should be 600 or 640)

### "Failed to process document"
- Check if your hosting allows outbound HTTPS requests
- Verify Google Vision API is enabled in your Google Cloud project
- Check server error logs for detailed error messages
- Ensure the service account has proper permissions

### "Connection timeout" or "Network error"
- Some shared hosts block outbound connections
- Contact your hosting provider to allow connections to `*.googleapis.com`
- Consider using a VPS or cloud hosting if your provider blocks API calls

### File Upload Issues
- Check PHP `upload_max_filesize` and `post_max_size` settings
- Verify file type restrictions in `ClientController.php`
- Ensure `storage/app/temp` directory is writable

### Memory Issues
- Increase PHP memory limit in `.htaccess` or `php.ini`:
  ```php
  php_value memory_limit 256M
  ```
- Process smaller files or reduce image resolution before upload

## Cost Considerations

Google Cloud Vision API has usage-based pricing:
- First 1,000 units per month: **FREE**
- After that: $1.50 per 1,000 units
- 1 unit = 1 image up to 1,920 x 1,080 pixels
- Larger images count as multiple units

**Example**: Processing 100 documents per month would cost approximately $0 (within free tier).

Check current pricing: https://cloud.google.com/vision/pricing

## Alternative: Upgrade to VPS

If your shared hosting doesn't support outbound API calls or you need better performance, consider upgrading to:
- **VPS (Virtual Private Server)** - Full control, can install Tesseract
- **Cloud Hosting** (AWS, DigitalOcean, etc.) - More flexibility
- **Dedicated Server** - Maximum control and performance

## Configuration Options

### Option 1: Google Vision Only (Recommended for Shared Hosting)
```env
OCR_DISABLE_TESSERACT=true
OCR_PREFER_GOOGLE_VISION=true
```

### Option 2: Try Tesseract First, Fallback to Google Vision
```env
OCR_DISABLE_TESSERACT=false
OCR_PREFER_GOOGLE_VISION=false
```
*Note: This won't work on shared hosting if Tesseract is not installed*

## Security Notes

1. **Never commit credentials file to Git**
   - Add to `.gitignore`: `storage/app/google-credentials.json`
   - Use environment variables for sensitive data

2. **Protect credentials file**
   - Set file permissions to 600 (read/write for owner only)
   - Store outside web root if possible
   - Use Laravel's storage system (already protected)

3. **Monitor API usage**
   - Set up billing alerts in Google Cloud Console
   - Monitor API usage regularly
   - Implement rate limiting if needed

## Support

If you encounter issues:
1. Check server error logs
2. Verify Google Cloud Vision API is enabled
3. Test API credentials using Google Cloud Console
4. Contact your hosting provider about outbound connections
5. Consider upgrading to VPS for full control

## Summary

✅ **Works on Shared Hosting**: Google Cloud Vision API (uses REST transport automatically)  
❌ **Does NOT work on Shared Hosting**: Tesseract OCR (requires system binary)  

**Required Setup**:
1. Set `OCR_DISABLE_TESSERACT=true` in `.env`
2. Configure Google Cloud Vision API credentials
3. Upload credentials file to server
4. Test with a sample document

**Automatic Features**:
- System automatically detects if gRPC extension is available
- Falls back to REST transport if gRPC is not available (typical on shared hosting)
- Automatically uses Google Vision API when Tesseract is disabled or unavailable
- No manual transport configuration needed

The system is designed to work seamlessly on shared hosting with minimal configuration.

