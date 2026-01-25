// Production API URLs
// api.totallyflawless.co = Old server with Twilio SMS working
// Cloud Run = New deployment with /send-upload endpoint

// Main API - uses old server for Twilio OTP/SMS authentication
const API_URL_PROD = "https://api.totallyflawless.co"
const API_URL = API_URL_PROD

// Upload URL - uses new Cloud Run deployment (has /send-upload endpoint)
const API_URL_UPLOAD = "https://flawless-api-294261947866.us-central1.run.app"

const TERMS_URL = "https://totallyflawless.co/terms-and-conditions"
const PRIVACY_URL = "https://totallyflawless.co/privacy-policy"
const CONTACT_URL = "https://totallyflawless.co/contact"

const S3_REGION = '' // Moved to backend; kept placeholder for compatibility

const O_AUTH = "1091456337250-b5ioc8cnr2ctvr7i8h6othj3m8ndbibf.apps.googleusercontent.com"

const STRIPE_KEY = process.env.STRIPE_PUBLISHABLE_KEY || ''


export {
    API_URL,
    API_URL_PROD,
    API_URL_UPLOAD,

    S3_REGION,
    O_AUTH,
    STRIPE_KEY,

    TERMS_URL,
    PRIVACY_URL,
    CONTACT_URL
}
