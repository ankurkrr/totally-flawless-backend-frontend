const conn = require("../connection/database");
const generateOtp = require("../connection/constant");
const sendOtp = require("../connection/twilioOtp");
const { v4: uuidv4 } = require("uuid");
const moment = require("moment");

/**
 * Service to handle user-related business logic.
 * Decoupled from HTTP layer.
 */
class UserService {

    /**
     * Create a new user in the system.
     * @param {Object} userData - The user data.
     * @param {string} userData.firstName - First name.
     * @param {string} userData.lastName - Last name.
     * @param {string} userData.email - Email address.
     * @param {string} userData.phone - Phone number.
     * @param {string} [userData.address] - Physical address.
     * @param {string} [userData.imgUrl] - Profile image URL.
     * @param {string} [userData.countryCode] - Country dial code.
     * @returns {Promise<Object>} The result of the operation.
     * @throws {Error} If database operation fails.
     */
    async createUser(userData) {
        const { firstName, lastName, email, phone, address, imgUrl, countryCode } = userData;

        // Basic validation (though Controller/Joi should catch this)
        if (!firstName || !lastName || !phone) {
            throw new Error("Missing required fields: firstName, lastName, phone");
        }

        const uniqueID = uuidv4();
        const dateTime = moment().format("YYYY-MM-DD HH:mm:ss");
        const otp = generateOtp();

        const query = `INSERT INTO users
                        (id, phone, firstName, lastName, email, address, createdDate, profileImage, otp, countryCode)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

        const values = [
            uniqueID.toString(),
            phone,
            firstName,
            lastName,
            email || null,
            address || null,
            dateTime,
            imgUrl || null,
            otp,
            countryCode || null
        ];

        // Database execution
        // Using conn.promise() for async/await support
        const pool = conn.promise();
        await pool.query(query, values);

        // Side Effects: Send OTP
        // Logic preserved from original service
        if (phone && process.env.NODE_ENV !== 'development') {
            try {
                await sendOtp(otp, phone);
            } catch (otpError) {
                console.error('Error sending OTP:', otpError);
                // We don't block user creation on SMS failure
            }
        } else if (process.env.NODE_ENV === 'development') {
            console.log(`[DEV MODE] OTP for ${phone}: ${otp}`);
        }

        return {
            status: "success",
            message: "User created successfully.",
            id: uniqueID.toString()
        };
    }
}

module.exports = new UserService();
