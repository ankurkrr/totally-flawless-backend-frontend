const conn = require("../connection/database");
const cacheService = require("../utils/cacheService");
const { CACHE_KEYS } = cacheService;

module.exports.GetSubCategories = async (req, res) => {
  const { serviceId } = req.query;
  
  if (!serviceId) {
    return res.status(400).json({ status: "error", message: "serviceId is required" });
  }

  try {
    // Try to get from cache first
    const cacheKey = `${CACHE_KEYS.SUBCATEGORIES}${serviceId}`;
    const cachedData = cacheService.get(cacheKey);
    
    if (cachedData !== null) {
      res.setHeader('X-Cache', 'HIT');
      return res.status(200).json({ status: "success", data: cachedData });
    }

    // Use parameterized query to prevent SQL injection
    const rawQuery = `SELECT * FROM subcategories WHERE serviceid = ?`;
    conn.query(rawQuery, [serviceId], (err, rows) => {
      if (err) {
        console.error('Error fetching subcategories:', err);
        return res.status(500).json({ 
          status: 'error', 
          message: process.env.NODE_ENV === 'development' ? err.message : 'Failed to fetch subcategories' 
        });
      }
      if(rows.length>0){
        var data = JSON.parse(JSON.stringify(rows));
       console.log(data);
        
        // Cache the result for 2 hours
        cacheService.set(cacheKey, data, 7200);
        res.setHeader('X-Cache', 'MISS');
       res.status(200).json({status:"success",data });
      }
      else{
        const emptyData = [];
        cacheService.set(cacheKey, emptyData, 7200);
        res.setHeader('X-Cache', 'MISS');
        res.status(200).json({status:"success",data:[] });
      }
    });
  } catch (err) {
    console.error('Error in GetSubCategories:', err);
    res.status(500).json({ 
      status: 'error', 
      message: process.env.NODE_ENV === 'development' ? err.message : 'An error occurred' 
    });
  }
};
