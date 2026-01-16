
// Production API URL
const API_URL_PROD = "https://api.totallyflawless.co"

// Main API - Production only
const API_URL = API_URL_PROD

// Upload URL - Production only
const API_URL_UPLOAD = API_URL_PROD

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
