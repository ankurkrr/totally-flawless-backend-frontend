
const conn = require("../connection/database");
const generateOtp = require("../connection/constant");
const sendOtp = require("../connection/twilioOtp");
const { v4: uuidv4 } = require("uuid");
var moment = require("moment");

module.exports.GetOtp = async (req, res) => {
    const { phone, countryCode } = req.query;
    
    if (!phone || !countryCode) {
        return res.status(400).json({ status: "error", message: "Phone and countryCode are required" });
    }

    const uniqueID = uuidv4();
    const dateTime = moment().format("YYYY-MM-DD HH:mm:ss");
    
    try {
        // Use parameterized query to prevent SQL injection
        const rawQuery = `SELECT * FROM artists WHERE mobile = ?`;
        conn.query(rawQuery, [phone], (err, rows) => {
            if (err) {
                console.error('Error fetching artist:', err);
                return res.status(500).json({ 
                    status: "error", 
                    message: process.env.NODE_ENV === 'development' ? err.message : 'Failed to process request' 
                });
            }

            // Get test phone numbers from environment variable (comma-separated)
            const testPhones = process.env.TEST_PHONE_NUMBERS ? 
                process.env.TEST_PHONE_NUMBERS.split(',').map(p => p.trim()) : [];
            const testOtp = process.env.TEST_OTP || '1111';

            // Generate OTP - use test OTP for test phone numbers in development
            let otp;
            if (process.env.NODE_ENV === 'development' && testPhones.includes(phone)) {
                otp = parseInt(testOtp);
            } else {
                otp = generateOtp();
            }

            sendOtp(otp, "+" + countryCode + phone);

            if (rows.length > 0) {
                var row = JSON.stringify(rows[0]).toString();
                var jsonObj = JSON.parse(row);
                
                // Use parameterized query to prevent SQL injection
                const updateQuery = `UPDATE artists SET otp = ?, isApproved = ? WHERE mobile = ?`;
                conn.query(updateQuery, [otp, jsonObj.isApproved || 0, phone], (err, result) => {
                    if (err) {
                        console.error('Error updating artist OTP:', err);
                        return res.status(500).json({ 
                            status: "error", 
                            message: process.env.NODE_ENV === 'development' ? err.message : 'Failed to update OTP' 
                        });
                    }
                    res.status(200).json({ 
                        status: "success", 
                        message: "User found.", 
                        id: jsonObj.id, 
                        isNewUser: false, 
                        isApproved: jsonObj.isApproved == 0 ? false : true 
                    });
                });
            } else {
                // Use parameterized query to prevent SQL injection
                const insertUserQuery = `INSERT INTO artists (id, mobile, countryCode, createdDate, otp, isApproved) VALUES (?, ?, ?, ?, ?, ?)`;
                conn.query(insertUserQuery, [uniqueID.toString(), phone, countryCode, dateTime, otp, 0], (err, result) => {
                    if (err) {
                        console.error('Error creating artist:', err);
                        return res.status(500).json({ 
                            status: "error", 
                            message: process.env.NODE_ENV === 'development' ? err.message : 'Failed to create artist' 
                        });
                    }
                    res.status(200).json({ 
                        status: "success", 
                        message: "New user created.", 
                        id: uniqueID.toString(), 
                        isNewUser: true, 
                        isApproved: false 
                    });
                });
            }
        });
    } catch (err) {
        console.error('Error in GetArtistOtp:', err);
        res.status(500).json({ 
            status: "error", 
            message: process.env.NODE_ENV === 'development' ? err.message : 'An error occurred' 
        });
    }
};
