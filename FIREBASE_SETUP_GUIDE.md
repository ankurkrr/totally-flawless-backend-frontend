# Firebase Setup Guide for Backend

This guide will walk you through creating a Firebase account and configuring it for your backend application.

## Prerequisites
- A Google account (Gmail account)
- Access to the backend codebase

## Step 1: Create a Firebase Account

1. **Go to Firebase Console**
   - Visit: https://console.firebase.google.com/
   - Sign in with your Google account

2. **Create a New Project**
   - Click "Add project" or "Create a project"
   - Enter a project name (e.g., "totally-flawless-backend")
   - Click "Continue"

3. **Configure Google Analytics (Optional)**
   - You can enable or disable Google Analytics
   - For backend-only usage, you can disable it
   - Click "Create project"

4. **Wait for Project Creation**
   - Firebase will create your project (takes 30-60 seconds)
   - Click "Continue" when ready

## Step 2: Enable Required Firebase Services

Your backend uses Firebase Admin SDK for **Push Notifications**. You need to enable Cloud Messaging:

1. **In Firebase Console**, click on your project
2. **Go to Project Settings** (gear icon ⚙️ in the left sidebar)
3. **Click on "Cloud Messaging" tab**
4. **Enable Cloud Messaging API** if not already enabled
   - This is usually enabled by default

## Step 3: Create Service Account & Download Credentials

1. **Go to Project Settings**
   - Click the gear icon ⚙️ next to "Project Overview"
   - Select "Project settings"

2. **Navigate to Service Accounts Tab**
   - Click on "Service accounts" tab at the top

3. **Generate New Private Key**
   - Click "Generate new private key" button
   - A dialog will appear warning you about security
   - Click "Generate key"
   - A JSON file will be downloaded (e.g., `your-project-firebase-adminsdk-xxxxx.json`)

4. **Save the JSON file securely**
   - ⚠️ **IMPORTANT**: Never commit this file to Git!
   - Store it in a secure location on your computer

## Step 4: Extract Credentials from JSON File

Open the downloaded JSON file. It will look like this:

```json
{
  "type": "service_account",
  "project_id": "your-project-id",
  "private_key_id": "abc123...",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com",
  "client_id": "123456789",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/..."
}
```

## Step 5: Configure Environment Variables

1. **Locate your `.env` file** in the backend root directory
   - If it doesn't exist, copy from `env.example`:
     ```bash
     cp env.example .env
     ```

2. **Add Firebase credentials to `.env` file**

   Extract values from the JSON file and add them:

   ```env
   # FIREBASE CONFIGURATION (REQUIRED - Push Notifications)
   FIREBASE_PROJECT_ID=your-project-id
   FIREBASE_PRIVATE_KEY_ID=abc123...
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n"
   FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
   FIREBASE_CLIENT_ID=123456789
   ```

   **Important Notes:**
   - The `FIREBASE_PRIVATE_KEY` must be wrapped in double quotes `""`
   - Keep the `\n` characters in the private key (they represent newlines)
   - The private key should start with `-----BEGIN PRIVATE KEY-----` and end with `-----END PRIVATE KEY-----`

3. **Optional: Add other Firebase URLs** (these have defaults but can be overridden):
   ```env
   FIREBASE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
   FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token
   FIREBASE_AUTH_PROVIDER_X509_CERT_URL=https://www.googleapis.com/oauth2/v1/certs
   FIREBASE_CLIENT_X509_CERT_URL=https://www.googleapis.com/robot/v1/metadata/x509/...
   ```

## Step 6: Verify Configuration

1. **Test your backend startup**
   ```bash
   npm start
   ```

2. **Look for success message:**
   ```
   ✅ Firebase Admin SDK initialized successfully
      Project ID: your-project-id
   ```

3. **If you see errors:**
   - Check that all required environment variables are set
   - Verify the private key format (must include `\n` for newlines)
   - Ensure the private key is wrapped in double quotes
   - Check that the JSON file was downloaded correctly

## Troubleshooting

### Error: "Firebase credentials are required"
- Make sure your `.env` file exists and contains all required Firebase variables
- Check that variable names match exactly (case-sensitive)

### Error: "Invalid private key format"
- Ensure the private key is wrapped in double quotes
- Keep the `\n` characters (don't replace them with actual newlines)
- The key should be on a single line with `\n` escape sequences

### Error: "Permission denied" or "Authentication failed"
- Verify the service account JSON file was downloaded correctly
- Make sure you copied all values exactly from the JSON file
- Check that the project ID matches your Firebase project

## Security Best Practices

1. **Never commit `.env` file to Git**
   - It should already be in `.gitignore`
   - Double-check that your `.env` file is not tracked

2. **Never commit the service account JSON file**
   - Keep it only on your local machine or secure server
   - If accidentally committed, rotate the key immediately in Firebase Console

3. **Use different Firebase projects for different environments**
   - Development: `your-project-dev`
   - Production: `your-project-prod`

## Quick Reference: Required Environment Variables

| Variable | Required | Description |
|---------|----------|-------------|
| `FIREBASE_PROJECT_ID` | ✅ Yes | Your Firebase project ID |
| `FIREBASE_PRIVATE_KEY` | ✅ Yes | Service account private key (with `\n` escape sequences) |
| `FIREBASE_CLIENT_EMAIL` | ✅ Yes | Service account email |
| `FIREBASE_PRIVATE_KEY_ID` | ⚠️ Recommended | Private key ID |
| `FIREBASE_CLIENT_ID` | ⚠️ Recommended | Client ID |

## Additional Resources

- [Firebase Console](https://console.firebase.google.com/)
- [Firebase Admin SDK Documentation](https://firebase.google.com/docs/admin/setup)
- [Service Account Documentation](https://cloud.google.com/iam/docs/service-accounts)

---

**Need Help?** If you encounter issues, check:
1. Firebase Console > Project Settings > Service Accounts
2. Your `.env` file format
3. Backend logs for specific error messages

