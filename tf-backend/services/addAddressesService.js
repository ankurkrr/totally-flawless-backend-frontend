const conn = require("../connection/database");
const { v4: uuidv4 } = require("uuid");
var moment = require("moment");
const cacheService = require("../utils/cacheService");
const { CACHE_KEYS } = cacheService;

module.exports.AddAddress = async (req, res) => {
  const authenticatedUserId = req.user.id || req.user.userId; // Get from authenticated token
  const { street, city, state, pincode, geocode, isDefault } = req.body;
  
  if (!authenticatedUserId) {
    return res.status(401).json({ status: "error", message: "User not authenticated" });
  }
  const uniqueID = uuidv4();
  const dateTime = moment().format("YYYY-MM-DD HH:mm:ss");
  try {
    if (isDefault == 1) {
      const updateIsDefaultQuery = `UPDATE useraddresses SET isdefault = 0 WHERE userid = ?`;
      conn.query(updateIsDefaultQuery, [authenticatedUserId], (err, rows) => {
        if (err) {
          return res.status(500).json({ error: err });
        } else {
          const rawQuery = `INSERT INTO useraddresses
                            (id, userid, street, city, state, pincode, geocode, createddate, isdefault)
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
          conn.query(rawQuery, [uniqueID.toString(), authenticatedUserId, street, city, state, pincode, geocode, dateTime, isDefault], (err, rows) => {
            if (err) {
              return res.status(500).json({ error: err });
            } else {
              // Invalidate user addresses cache
              cacheService.del(`${CACHE_KEYS.USER_ADDRESSES}${authenticatedUserId}`);
              res.status(200).json({ status: "success", message: "Address added successfully.", id: uniqueID.toString() });
            }
          });
        }
      });
    }
    else {
      const rawQuery = `INSERT INTO useraddresses
                        (id, userid, street, city, state, pincode, geocode, createddate, isdefault)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
      conn.query(rawQuery, [uniqueID.toString(), authenticatedUserId, street, city, state, pincode, geocode, dateTime, isDefault], (err, rows) => {
        if (err) {
          return res.status(500).json({ error: err });
        } else {
          // Invalidate user addresses cache
          cacheService.del(`${CACHE_KEYS.USER_ADDRESSES}${authenticatedUserId}`);
          res.status(200).json({ status: "success", message: "Address added successfully.", id: uniqueID.toString() });
        }
      });
    }

  } catch (err) {
    console.log(err);
    res.status(500).json({ error: err.toString() });
  }
};
