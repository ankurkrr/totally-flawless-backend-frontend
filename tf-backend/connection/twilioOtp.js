require('dotenv').config();

let twilioClient = null;

// Initialize Twilio client only if credentials are available
const initializeTwilio = () => {
    if (twilioClient) {
        return twilioClient;
    }

    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const phoneNumber = process.env.TWILIO_PHONE_NUMBER;

    // Only initialize if all credentials are present and valid
    if (accountSid && authToken && phoneNumber && accountSid.startsWith('AC')) {
        try {
            const twilio = require('twilio');
            twilioClient = twilio(accountSid, authToken);
            return twilioClient;
        } catch (error) {
            console.error('Error initializing Twilio:', error.message);
            return null;
        }
    }

    return null;
};

const sendOtp = async (otp, phone) => {
    try {
        const client = initializeTwilio();
        
        if (!client) {
            console.log(`[Twilio not configured] OTP for ${phone}: ${otp}`);
            return;
        }

        const phoneNumber = process.env.TWILIO_PHONE_NUMBER;
        
        if (!phoneNumber) {
            console.log(`[Twilio phone number not set] OTP for ${phone}: ${otp}`);
            return;
        }

        console.log(`Sending OTP to ${phone}: ${otp}`);
        
        const message = await client.messages.create({
            body: `TF App: Your verification code is ${otp}. It expires in 10 minutes. Do not share this code.`,
            from: phoneNumber,
            to: phone,
        });

        console.log(`OTP sent successfully. Message SID: ${message.sid}`);
    } catch (err) {
        console.error('Error sending OTP via Twilio:', err.message);
        console.log(`[Fallback] OTP for ${phone}: ${otp}`);
        // Don't throw - allow the process to continue
    }
};

module.exports = sendOtp;