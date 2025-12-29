const conn = require('../connection/database');
var moment = require('moment');
const cacheService = require('../utils/cacheService');
const { CACHE_KEYS } = cacheService;

module.exports.UpdateUser = async (req, res) => {
    const authenticatedUserId = req.user.id || req.user.userId; // Get from authenticated token
    const { firstName, lastName, email, address, imgUrl, phone } = req.body;
    const dateTime = moment().format('YYYY-MM-DD HH:mm:ss');

    if (!authenticatedUserId) {
        return res.status(401).json({ status: 'error', message: 'User not authenticated' });
    }

    try {
        let updateFields = [];
        const updateParams = [];

        if (firstName) {
            updateFields.push(`firstName = ?`);
            updateParams.push(firstName);
        }
        if (lastName) {
            updateFields.push(`lastName = ?`);
            updateParams.push(lastName);
        }
        if (email) {
            updateFields.push(`email = ?`);
            updateParams.push(email);
        }
        if (address) {
            updateFields.push(`address = ?`);
            updateParams.push(address);
        }
        if (imgUrl) {
            updateFields.push(`profileImage = ?`);
            updateParams.push(imgUrl);
        }
        if (phone) {
            updateFields.push(`phone = ?`);
            updateParams.push(phone);
        }

        updateFields.push(`lastUpdatedOn = ?`);
        updateParams.push(dateTime);
        updateParams.push(authenticatedUserId);

        const updateQuery = `
            UPDATE users
            SET ${updateFields.join(', ')}
            WHERE id = ?
        `;
        conn.query(updateQuery, updateParams, (err, rows) => {
            if (err) {
                return res.status(500).json({ error: err });
            } else {
                // Invalidate user profile cache
                cacheService.del(`${CACHE_KEYS.USER_PROFILE}${authenticatedUserId}`);
                res.status(200).json({ status: 'success', message: 'User information updated successfully.' });
            }
        });

    } catch (err) {
        console.log(err);
        res.status(500).json({ error: err.toString() });
    }
};

module.exports.UpdateUserGratuity = async (req, res) => {
    const authenticatedUserId = req.user.id || req.user.userId; // Get from authenticated token
    const { gratuity } = req.body;
    const dateTime = moment().format('YYYY-MM-DD HH:mm:ss');
    
    if (!authenticatedUserId) {
        return res.status(401).json({ status: 'error', message: 'User not authenticated' });
    }

    if (gratuity === undefined || gratuity === null) {
        return res.status(400).json({ status: 'error', message: 'Gratuity value is required' });
    }

    try {
        // Use parameterized query to prevent SQL injection
        const updateQuery = `UPDATE users 
                            SET gratuity = ?, lastUpdatedOn = ? 
                            WHERE id = ?`;
        
        conn.query(updateQuery, [gratuity, dateTime, authenticatedUserId], (err, result) => {
            if (err) {
                console.error('Error updating gratuity:', err);
                return res.status(500).json({ 
                    status: 'error', 
                    message: process.env.NODE_ENV === 'development' ? err.message : 'Failed to update gratuity' 
                });
            }
            
            // Invalidate user profile cache
            cacheService.del(`${CACHE_KEYS.USER_PROFILE}${authenticatedUserId}`);
            res.status(200).json({ status: 'success', message: 'User gratuity updated successfully.' });
        });
    } catch (err) {
        console.error('Error in UpdateUserGratuity:', err);
        res.status(500).json({ 
            status: 'error', 
            message: process.env.NODE_ENV === 'development' ? err.message : 'An error occurred' 
        });
    }
};
