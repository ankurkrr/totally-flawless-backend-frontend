/**
 * @fileoverview Get User Details Service
 * @description Business logic for retrieving user profile information
 * @module services/getUserDetailsService
 * @version 1.0.0
 */

const conn = require('../connection/database');
const cacheService = require('../utils/cacheService');
const { CACHE_KEYS } = cacheService;

/**
 * @function GetUserDetails
 * @description Retrieves user profile details with device information
 * @param {Object} req - Express request object
 * @param {string} req.user.id - Authenticated user ID from JWT token
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 * @description
 * - Retrieves user data from cache if available
 * - Fetches user profile from database if not cached
 * - Includes associated device information
 * - Caches result for 15 minutes
 */
module.exports.GetUserDetails = async (req, res) => {
    // Get authenticated user ID from token, not from query parameters
    const authenticatedUserId = req.user.id || req.user.userId;
    
    if (!authenticatedUserId) {
        return res.status(401).json({ status: 'error', message: 'User not authenticated' });
    }

    try {
        // Try to get from cache first
        const cacheKey = `${CACHE_KEYS.USER_PROFILE}${authenticatedUserId}`;
        const cachedData = cacheService.get(cacheKey);
        
        if (cachedData !== null) {
            res.setHeader('X-Cache', 'HIT');
            return res.status(200).json({ status: 'success', data: cachedData });
        }

        // Use parameterized queries to prevent SQL injection
        // Users can only access their own details
        const rawQuery = `SELECT * FROM users WHERE id = ?`;
        conn.query(rawQuery, [authenticatedUserId], (err, rows) => {
            if (err) {
                return res.status(500).json({ error: err });
            }
            if (rows.length > 0) {
                const rawQuerydevice = `SELECT * FROM devices WHERE userId = ? ORDER BY id DESC`;
                conn.query(rawQuerydevice, [authenticatedUserId], (err, result) => {
                    if (err) {
                        return res.status(500).json({ error: err });
                    }
                    if (result.length > 0) {
                        rows[0]['deviceDetail'] = result;
                    } else {
                        rows[0]['deviceDetail'] = [];
                    }
                    console.log(rows);
                    var data = JSON.parse(JSON.stringify(rows));
                    
                    // Cache the result for 15 minutes (900 seconds) - user profile changes more frequently
                    cacheService.set(cacheKey, data, 900);
                    res.setHeader('X-Cache', 'MISS');
                    res.status(200).json({ status: 'success', data });
                });
            } else {
                res.status(404).json({ status: 'error', message: 'User not found' });
            }
        });
    } catch (err) {
        res.status(500).json({ err });
    }
};
