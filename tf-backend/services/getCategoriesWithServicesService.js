const conn = require("../connection/database");
const cacheService = require("../utils/cacheService");
const { CACHE_KEYS } = cacheService;

module.exports.GetServices = async (req, res) => {
  const {} = req.query;
//   console.log(req);
  try {
    // Try to get from cache first
    const cacheKey = CACHE_KEYS.CATEGORIES;
    const cachedData = cacheService.get(cacheKey);
    
    if (cachedData !== null) {
      res.setHeader('X-Cache', 'HIT');
      return res.status(200).json({ status: "success", data: cachedData });
    }

    const rawQuery = `SELECT c.id as categoryId, c.name as categoryName,s.id as serviceId,s.name as serviceName, s.imgUrl FROM servicecategories c
    inner join services s on c.id = s.categoryId`;
    conn.query(rawQuery, (err, rows) => {
      if (err) {
        console.error('Database query error:', err);
        return res.status(500).json({ 
          status: 'error',
          message: 'Database query failed',
          error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
        });
      }
      
      // Handle case where rows is undefined or null
      if (!rows) {
        return res.status(200).json({ status: "success", data: [] });
      }
      
      if(rows.length > 0){
        // console.log(rows);
        // var row = JSON.stringify(rows).toString();
        // console.log(row);
        // var jsonObj = JSON.parse(row);
        var jsonData = JSON.parse(JSON.stringify(rows));
        const dataMap = new Map();
        //

        jsonData.forEach(row => {
            console.log(row.serviceId);
            const categoryId = row.categoryId;
            const service = {
                serviceId: row.serviceId,
                serviceName: row.serviceName,
                imgUrl:row.imgUrl
            };
    
            if (!dataMap.has(categoryId)) {
                // If category not in map, add it
                dataMap.set(categoryId, {
                    categoryId: categoryId,
                    categoryName: row.categoryName,
                    services: [service]
                });
            } else {
                // If category already in map, add service to its services array
                const category = dataMap.get(categoryId);
                category.services.push(service);
            }
        });
        
        // Convert map values to array
    const data = Array.from(dataMap.values());
    
    // Cache the result for 2 hours (7200 seconds) - catalog data changes infrequently
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
    res.status(500).json({ err });
  }
};
