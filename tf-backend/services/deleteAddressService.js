const conn = require("../connection/database");
const cacheService = require("../utils/cacheService");
const { CACHE_KEYS } = cacheService;

module.exports.DeleteAddress = async (req, res) => {
  const { addressId } = req.params; // Get from route params
  const authenticatedUserId = req.user.id || req.user.userId; // Get from authenticated token
  
  if (!authenticatedUserId) {
    return res.status(401).json({ status: "error", message: "User not authenticated" });
  }

  try {
    // Verify address belongs to authenticated user before deleting
    // Use parameterized queries to prevent SQL injection
    const rawQuery = `DELETE FROM useraddresses WHERE id = ? AND userid = ?`;
    conn.query(rawQuery, [addressId, authenticatedUserId], (err, result) => {
        if (err) {
            // If an error occurs during the query execution
            console.error('Error deleting address:', err);
            return res.status(500).json({ 
                status: 'error', 
                message: process.env.NODE_ENV === 'development' ? err.message : 'Failed to delete address' 
            });
          } else {
            console.log(result);
            // If the query executes successfully
            if (result.affectedRows > 0) {
              // Invalidate user addresses cache
              cacheService.del(`${CACHE_KEYS.USER_ADDRESSES}${authenticatedUserId}`);
              // If any rows were affected (deleted in this case)
              res.status(200).json({ status: "success", message: "Address deleted successfully" });
            } else {
              // If no rows were affected (address not found or doesn't belong to user)
              res.status(404).json({ status: "error", message: "Address not found or access denied" });
            }
          }
    });
  } catch (err) {
    console.error('Error in DeleteAddress:', err);
    res.status(500).json({ 
        status: 'error', 
        message: process.env.NODE_ENV === 'development' ? err.message : 'An error occurred' 
    });
  }
};
