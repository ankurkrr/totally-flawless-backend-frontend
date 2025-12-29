const conn = require("../connection/database");

module.exports.GetAddressById = async (req, res) => {
    const { addressId } = req.params; // Get from route params
    const authenticatedUserId = req.user.id || req.user.userId; // Get from authenticated token
    
    if (!authenticatedUserId) {
        return res.status(401).json({ status: "error", message: "User not authenticated" });
    }

    try {
        // Verify address belongs to authenticated user
        const rawQuery = `SELECT * FROM useraddresses WHERE id = ? AND userid = ?`;
        conn.query(rawQuery, [addressId, authenticatedUserId], (err, rows) => {
            if (err) {
                console.error('Error fetching address:', err);
                return res.status(500).json({ 
                    status: 'error', 
                    message: process.env.NODE_ENV === 'development' ? err.message : 'Failed to fetch address' 
                });
            }
            if (rows.length > 0) {
                var data = JSON.parse(JSON.stringify(rows));
                console.log(data);
                res.status(200).json({ status: "success", data });
            }
            else {
                res.status(404).json({ status: "error", message: "Address not found or access denied" });
            }
        });
    } catch (err) {
        console.error('Error in GetAddressById:', err);
        res.status(500).json({ 
            status: 'error', 
            message: process.env.NODE_ENV === 'development' ? err.message : 'An error occurred' 
        });
    }
}