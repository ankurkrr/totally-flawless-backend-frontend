
// Load API URL from environment at build/runtime. Set `API_URL` in your
// CI or local env (e.g. using react-native-config or babel-plugin-inline-dotenv).
// Fallback remains to the previous production URL to avoid breakage in local dev.
const API_URL_PROD = "https://api.totallyflawless.co"
const API_URL_DEV = "http://164.52.197.9:3001" // Found as commented out in multiple screens
const API_URL_LOCAL = "http://192.168.1.11:3000" // Found in BookVirtualAppointment.tsx


// Default to Prod if env var not set, but export others for easy switching/testing
const API_URL = process.env.API_URL || API_URL_PROD

const TERMS_URL = "https://totallyflawless.co/terms-and-conditions"
const PRIVACY_URL = "https://totallyflawless.co/privacy-policy"
const CONTACT_URL = "https://totallyflawless.co/contact"


// NOTE: Removed hardcoded AWS S3 credentials and region from the client.
// These secrets were previously exposed here and must be kept on the backend.
// File uploads should be performed by the backend via POST /send-upload or
// /upload endpoints which hold S3 credentials in server-side environment vars.

const S3_REGION = '' // Moved to backend; kept placeholder for compatibility


// S3 credentials removed from client; use server-side upload endpoints.

const O_AUTH = "1091456337250-b5ioc8cnr2ctvr7i8h6othj3m8ndbibf.apps.googleusercontent.com"

// NOTE: Removed hardcoded Google Maps API key from the client.
// All Places / Maps requests should be proxied through the backend
// (e.g. GET /maps/autocomplete and GET /maps/place) to keep the API key secret.
// AndroidManifest.xml also contains a placeholder for the Google Maps API Key.

// Load Stripe publishable key from environment. This value is public-facing
// (publishable key) but we prefer injecting it at build time instead of
// hardcoding. Set `STRIPE_PUBLISHABLE_KEY` in your CI / build environment.
const STRIPE_KEY = process.env.STRIPE_PUBLISHABLE_KEY || ''


export {
    API_URL,
    API_URL_PROD,
    API_URL_DEV,
    API_URL_LOCAL,

    S3_REGION,
    O_AUTH,
    STRIPE_KEY,

    TERMS_URL,
    PRIVACY_URL,
    CONTACT_URL
}

//
// for ios archive build 

//bundle install
// NO_FLIPPER=1 bundle exec pod install --project-directory=ios

// DB Access Token removed from client side.

//FIXME: new mobile notch issue fix
