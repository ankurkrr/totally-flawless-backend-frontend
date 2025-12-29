const conn = require("../connection/database");
const cacheService = require("../utils/cacheService");
const { CACHE_KEYS } = cacheService;

module.exports.GetPrices = async (req, res) => {
  const { serviceId } = req.query;
  
  if (!serviceId) {
    return res.status(400).json({ status: "error", message: "serviceId is required" });
  }

  try {
    // Try to get from cache first
    const cacheKey = `${CACHE_KEYS.PRICES}${serviceId}`;
    const cachedData = cacheService.get(cacheKey);
    
    if (cachedData !== null) {
      res.setHeader('X-Cache', 'HIT');
      return res.status(200).json({ status: "success", data: cachedData });
    }

    // Use parameterized query to prevent SQL injection
    const rawQuery = `SELECT p.id as priceId, price, name, description FROM priceforservices p
    inner join artistlevels a on p.artistlevelId = a.id
    where p.serviceId = ?`;
    conn.query(rawQuery, [serviceId], (err, rows) => {
      if (err) {
        console.error('Error fetching prices:', err);
        return res.status(500).json({ 
          status: 'error', 
          message: process.env.NODE_ENV === 'development' ? err.message : 'Failed to fetch prices' 
        });
      }
      if(rows.length>0){
        // console.log(rows);
        // var row = JSON.stringify(rows).toString();
        // console.log(row);
        // var jsonObj = JSON.parse(row);
        var jsonData = JSON.parse(JSON.stringify(rows));
        var dataArr = [];
        //

        jsonData.forEach(row => {
            console.log(row.serviceId);
            var obj = {
                priceId : row.priceId,
                levelName : row.name,
                price : row.price,
                description:row.description
            }
            dataArr.push(obj);
        });
        
        // Convert map values to array
    const data = dataArr;
    
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
    console.error('Error in GetPrices:', err);
    res.status(500).json({ 
      status: 'error', 
      message: process.env.NODE_ENV === 'development' ? err.message : 'An error occurred' 
    });
  }
};
