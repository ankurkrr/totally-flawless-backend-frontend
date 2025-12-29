const conn = require('../connection/database');
const generateOtp = require('../connection/constant');
const sendOtp = require('../connection/twilioOtp');
const { v4: uuidv4 } = require('uuid');
var moment = require('moment');

module.exports.CreateArtist = async (req, res) => {
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
    } = req.body;
    
    // Input validation
    if (!phone) {
        return res.status(400).json({ error: "phone is a required field." });
    }
    
    const uniqueID = uuidv4();
    const dateTime = moment().format('YYYY-MM-DD HH:mm:ss');
    
    try {
        // Generate actual OTP instead of hardcoded value
        const otp = generateOtp();
        
        // Use parameterized query to prevent SQL injection
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
        
        // Use promise-based query for better error handling
        const pool = conn.promise();
        await pool.query(query, values);
        
        // Send OTP via Twilio (only if phone number is valid)
        if (phone && process.env.NODE_ENV !== 'development') {
            try {
                await sendOtp(otp, "+" + (countryCode || "1") + phone);
            } catch (otpError) {
                console.error('Error sending OTP:', otpError);
                // Don't fail artist creation if OTP send fails, but log it
            }
        } else if (process.env.NODE_ENV === 'development') {
            console.log(`[DEV MODE] OTP for ${phone}: ${otp}`);
        }
        
        // Generate JWT token for artist (similar to user creation)
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
            if (!jwtSecret) {
                // If JWT secret not available, return without token
                return res.status(200).json({ 
                    status: 'success', 
                    message: 'Artist created successfully.', 
                    id: uniqueID.toString(),
                    otp: otp // Include OTP so they can login
                });
            }
        }
        
        // Generate JWT token
        const payload = {
            id: uniqueID.toString(),
            userId: uniqueID.toString(),
            phone: phone,
            userType: 2 // Artist user type
        };
        
        const token = jwt.sign(payload, jwtSecret, { expiresIn: '7d' });
        
        res.status(200).json({ 
            status: 'success', 
            message: 'Artist created successfully.', 
            data: {
                id: uniqueID.toString(),
                phone: phone,
                accessToken: token,
                otp: otp // Include OTP for reference
            }
        });
    } catch (err) {
        console.error('Error creating artist:', err);
        res.status(500).json({ error: "An error occurred while creating the artist." });
    }
};
