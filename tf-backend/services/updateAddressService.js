const conn = require("../connection/database");
var moment = require("moment");
const cacheService = require("../utils/cacheService");
const { CACHE_KEYS } = cacheService;

module.exports.UpdateAddress = async (req, res) => {
    const { id, street, city, state, pincode, isDefault } = req.body;
    const authenticatedUserId = req.user.id || req.user.userId; // Get from authenticated token, not request body
    
    if (!authenticatedUserId) {
        return res.status(401).json({ status: "error", message: "User not authenticated" });
    }

    const dateTime = moment().format("YYYY-MM-DD HH:mm:ss");
    
    try {
        // First verify the address belongs to the authenticated user
        const verifyQuery = `SELECT id, userid FROM useraddresses WHERE id = ? AND userid = ?`;
        conn.query(verifyQuery, [id, authenticatedUserId], (err, verifyRows) => {
            if (err) {
                return res.status(500).json({ error: err });
            }
            
            if (verifyRows.length === 0) {
                return res.status(403).json({ status: "error", message: "Address not found or access denied" });
            }

            // Use parameterized queries to prevent SQL injection
        if (isDefault == 1) {
                const updateIsDefaultQuery = `UPDATE useraddresses SET isdefault = 0 WHERE userid = ?`;
                conn.query(updateIsDefaultQuery, [authenticatedUserId], (err, rows) => {
                if (err) {
                        return res.status(500).json({ error: err });
                } else {
                        const rawQuery = `UPDATE useraddresses
                            SET 
                                street = ?,
                                city = ?,
                                state = ?,
                                pincode = ?,
                                isdefault = ?
                            WHERE id = ? AND userid = ?`;
                        conn.query(rawQuery, [street, city, state, pincode, isDefault, id, authenticatedUserId], (err, result) => {
                        if (err) {
                                return res.status(500).json({ error: err });
                            } else {
                                if (result.affectedRows > 0) {
                                    // Invalidate user addresses cache
                                    cacheService.del(`${CACHE_KEYS.USER_ADDRESSES}${authenticatedUserId}`);
                                    res.status(200).json({ status: "success", message: "Address updated successfully" });
                                } else {
                                res.status(404).json({ status: "error", message: "Address not found" });
                            }
                        }
                    });
                }
            });
        }
        else {
                const rawQuery = `UPDATE useraddresses
                    SET 
                        street = ?,
                        city = ?,
                        state = ?,
                        pincode = ?,
                        isdefault = ?
                    WHERE id = ? AND userid = ?`;
                conn.query(rawQuery, [street, city, state, pincode, isDefault, id, authenticatedUserId], (err, result) => {
                if (err) {
                        console.error('Error updating address:', err);
                        return res.status(500).json({ 
                            status: 'error', 
                            message: process.env.NODE_ENV === 'development' ? err.message : 'Failed to update address' 
                        });
                    } else {
                        if (result.affectedRows > 0) {
                            // Invalidate user addresses cache
                            cacheService.del(`${CACHE_KEYS.USER_ADDRESSES}${authenticatedUserId}`);
                            res.status(200).json({ status: "success", message: "Address updated successfully" });
                        } else {
                        res.status(404).json({ status: "error", message: "Address not found" });
                    }
                }
            });
        }
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: err.toString() });
    }
};
