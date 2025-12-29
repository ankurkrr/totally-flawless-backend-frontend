const conn = require('../connection/database');
const generateOtp = require('../connection/constant');
const sendOtp = require('../connection/twilioOtp');
const { v4: uuidv4 } = require('uuid');
const moment = require('moment');

class ArtistService {

    /**
     * Create a new artist.
     * @param {Object} artistData 
     */
    async createArtist(artistData) {
        const {
            firstName,
            lastName,
            email,
            phone,
            address,
            geocode,
            city,
            state,
            businessType,
            videoUrl,
            countryCode,
        } = artistData;

        if (!phone) {
            throw new Error("Phone number is required.");
        }

        const uniqueID = uuidv4();
        const dateTime = moment().format('YYYY-MM-DD HH:mm:ss');
        const otp = generateOtp();

        const query = `INSERT INTO artists
                        (id, mobile, firstName, lastName, email, address, geocode, businessType, videoUrl, createdDate, otp, countryCode, isApproved)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

        const values = [
            uniqueID.toString(),
            phone,
            firstName || null,
            lastName || null,
            email || null,
            address || null,
            geocode || null,
            businessType || null,
            videoUrl || null,
            dateTime,
            otp,
            countryCode || null,
            0 // isApproved defaults to false
        ];

        await conn.promise().query(query, values);

        // Send OTP
        if (phone && process.env.NODE_ENV !== 'development') {
            try {
                await sendOtp(otp, "+" + (countryCode || "1") + phone);
            } catch (otpError) {
                console.error('Error sending OTP:', otpError);
            }
        } else if (process.env.NODE_ENV === 'development') {
            console.log(`[DEV MODE] OTP for ${phone}: ${otp}`);
        }

        // Generate JWT token for artist
        const jwt = require('jsonwebtoken');
        const KeyProvider = require('../utils/keyProvider');
        
        let jwtSecret;
        try {
            jwtSecret = await KeyProvider.getJWTSecret();
        } catch (error) {
            if (process.env.NODE_ENV !== 'test') {
                console.warn('⚠️  KeyProvider failed, using JWT_SECRET directly from environment variables.');
            }
            jwtSecret = process.env.JWT_SECRET;
        }
        
        let token = null;
        if (jwtSecret) {
            const payload = {
                id: uniqueID.toString(),
                userId: uniqueID.toString(),
                phone: phone,
                userType: 2 // Artist user type
            };
            token = jwt.sign(payload, jwtSecret, { expiresIn: '7d' });
        }

        return {
            status: 'success',
            message: 'Artist created successfully.',
            data: {
                id: uniqueID.toString(),
                phone: phone,
                accessToken: token,
                otp: otp // Include OTP for reference
            }
        };
    }
}

module.exports = new ArtistService();
