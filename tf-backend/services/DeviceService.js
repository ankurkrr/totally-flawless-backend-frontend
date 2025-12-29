const conn = require('../connection/database');
const process = require("dotenv").config();
const { v4: uuidv4 } = require('uuid');
const moment = require('moment');
const axios = require('axios');
const stripe = require('./stripe');
const twilio = require("twilio");

module.exports.Divice = async (req, res) => {
    const { userId, deviceId, deviceType, deviceToken } = req.body;

    if (!userId || !deviceId || !deviceType || !deviceToken) {
        return res.status(400).json({ message: "All fields (userId, deviceId, deviceType, deviceToken) are required." });
    }

    try {
        const checkUserQuery = `
            SELECT * FROM devices WHERE userId = ?`;
        const [userRows] = await conn.promise().query(checkUserQuery, [userId]);

        if (userRows.length > 0) {
            const updateDeviceQuery = `
                UPDATE devices 
                SET deviceId = ?, deviceType = ?, deviceToken = ?, updatedAt = NOW()
                WHERE userId = ?`;
            await conn.promise().query(updateDeviceQuery, [deviceId, deviceType, deviceToken, userId]);
            return res.status(200).json({ message: "Device updated successfully." });
        } else {
            const insertDeviceQuery = `
                INSERT INTO devices (userId, deviceId, deviceType, deviceToken, createdAt, updatedAt)
                VALUES (?, ?, ?, ?, NOW(), NOW())`;
            await conn.promise().query(insertDeviceQuery, [userId, deviceId, deviceType, deviceToken]);
            return res.status(201).json({ message: "Device added successfully." });
        }
    } catch (error) {
        console.error("Error managing device:", error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
};


module.exports.DivicesCallController = async (req, res) => {
    try {
        const { from, to } = req.body;
        const accountSid = process.parsed.TWILIO_ACCOUNT_SID;
        const authToken = process.parsed.TWILIO_AUTH_TOKEN;
        const client = twilio(accountSid, authToken);
        const call = await client.calls.create({
            from: process.parsed.TWILIO_NUMBER,
            to: to,
            url: process.parsed.SITELINK + "/device/get/call?phone=" + from,
        });
        console.log(process.parsed.SITELINK + "/device/get/call?phone=" + from);
        return res.status(201).json({ message: "Successfully created device call.", data: call });
    } catch (error) {
        return res.status(500).json({ error: error });
    }
};


module.exports.DivicesGetCallController = async (req, res) => {
    try {
        const phoneNumber = req.query.phone || '415-123-4567';
        const xmlResponse = `<?xml version="1.0" encoding="UTF-8"?><Response><Dial>${phoneNumber}</Dial></Response>`;
        res.set('Content-Type', 'text/xml');
        return res.status(200).send(xmlResponse);
    } catch (error) {
        return res.status(500).json({ error: "Internal Server Error" });
    }
}
